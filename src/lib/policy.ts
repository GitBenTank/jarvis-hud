/**
 * Execution Policy v1 — enforce at execute-time before adapter runs.
 * Approve ≠ Execute. Policy blocks; never auto-executes.
 * Logs each decision to policy-decisions for audit.
 */

import { appendPolicyDecision } from "./policy-decision-log";

export const ALLOWED_KINDS = [
  "content.publish",
  "reflection.note",
  "system.note",
  "code.diff",
  "code.apply",
  "youtube.package",
  "recovery.heartbeat.restart",
  "recovery.approvals.cleanup",
  "recovery.connector.resync",
  "recovery.monitor.verify",
] as const;

export type AllowedKind = (typeof ALLOWED_KINDS)[number];

export function isAllowedKind(kind: string): kind is AllowedKind {
  return (ALLOWED_KINDS as readonly string[]).includes(kind);
}

export type ExecutePolicyConfig = {
  kind: string;
  authEnabled: boolean;
  stepUpValid: boolean;
  codeApplyBlockReasons?: string[];
  /** If provided, logs the decision to policy-decisions. */
  traceId?: string;
};

export type ExecutePolicyResult =
  | { ok: true }
  | { ok: false; status: 400 | 403; reasons: string[] };

function reasonToSlug(reason: string): string {
  if (reason.toLowerCase().includes("dirty") || reason.includes("DIRTY_WORKTREE")) return "dirty_worktree";
  if (reason.toLowerCase().includes("jarvis_repo_root") || reason.toLowerCase().includes("repo root")) return "repo_root_required";
  if (reason.toLowerCase().includes("step-up") || reason.toLowerCase().includes("re-authenticate")) return "reauthenticate_required";
  if (reason.toLowerCase().includes("allowlist") || reason.toLowerCase().includes("allowlist")) return "adapter_not_permitted";
  return "policy_denied";
}

export async function evaluateExecutePolicy(
  config: ExecutePolicyConfig
): Promise<ExecutePolicyResult> {
  const reasons: string[] = [];
  const timestamp = new Date().toISOString();

  if (!isAllowedKind(config.kind)) {
    reasons.push(
      `Kind "${config.kind}" is not in the execution allowlist. Allowed: ${ALLOWED_KINDS.join(", ")}.`
    );
    const result: ExecutePolicyResult = { ok: false, status: 400, reasons };
    if (config.traceId) {
      await appendPolicyDecision({
        traceId: config.traceId,
        decision: "deny",
        rule: "kind.allowlist",
        reason: "adapter_not_permitted",
        timestamp,
      });
    }
    return result;
  }

  if (config.authEnabled && !config.stepUpValid) {
    reasons.push("Step-up required to execute. Re-authenticate before execution.");
    const result: ExecutePolicyResult = { ok: false, status: 403, reasons };
    if (config.traceId) {
      await appendPolicyDecision({
        traceId: config.traceId,
        decision: "deny",
        rule: "step_up",
        reason: "reauthenticate_required",
        timestamp,
      });
    }
    return result;
  }

  if (config.kind === "code.apply" && config.codeApplyBlockReasons?.length) {
    const blockReasons = config.codeApplyBlockReasons;
    const result: ExecutePolicyResult = { ok: false, status: 400, reasons: blockReasons };
    if (config.traceId) {
      const reason = reasonToSlug(blockReasons[0] ?? "");
      await appendPolicyDecision({
        traceId: config.traceId,
        decision: "deny",
        rule: "code.apply.preflight",
        reason,
        timestamp,
      });
    }
    return result;
  }

  if (config.traceId) {
    const rule = config.kind === "code.apply" ? "code.apply.preflight" : "policy.passed";
    const reason = config.kind === "code.apply" ? "clean_worktree" : "allowed";
    await appendPolicyDecision({
      traceId: config.traceId,
      decision: "allow",
      rule,
      reason,
      timestamp,
    });
  }
  return { ok: true };
}
