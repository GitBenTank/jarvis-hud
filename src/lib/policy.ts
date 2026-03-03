/**
 * Execution Policy v1 — enforce at execute-time before adapter runs.
 * Approve ≠ Execute. Policy blocks; never auto-executes.
 */

export const ALLOWED_KINDS = [
  "content.publish",
  "reflection.note",
  "system.note",
  "code.diff",
  "code.apply",
  "youtube.package",
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
};

export type ExecutePolicyResult =
  | { ok: true }
  | { ok: false; status: 400 | 403; reasons: string[] };

export function evaluateExecutePolicy(
  config: ExecutePolicyConfig
): ExecutePolicyResult {
  const reasons: string[] = [];

  if (!isAllowedKind(config.kind)) {
    reasons.push(
      `Kind "${config.kind}" is not in the execution allowlist. Allowed: ${ALLOWED_KINDS.join(", ")}.`
    );
    return { ok: false, status: 400, reasons };
  }

  if (config.authEnabled && !config.stepUpValid) {
    reasons.push("Step-up required to execute. Re-authenticate before execution.");
    return { ok: false, status: 403, reasons };
  }

  if (config.kind === "code.apply" && config.codeApplyBlockReasons?.length) {
    return { ok: false, status: 400, reasons: config.codeApplyBlockReasons };
  }

  return { ok: true };
}
