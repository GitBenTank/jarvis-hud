/**
 * Derives operator-visible execution outcome from trace events, policy log, and action log.
 * No invented state — only persisted fields.
 */

import { reasonFromPolicyReason } from "@/lib/reason-taxonomy";

export type TraceExecutionStatus = "completed" | "blocked" | "failed" | "pending" | "not_applicable";

export type TraceExecutionReasonCode =
  | "policy-denied"
  | "preflight-failed"
  | "missing-approval"
  | "execution-error"
  | "approval-rejected";

export type TraceExecutionOutcome = {
  status: TraceExecutionStatus;
  reasonCode: TraceExecutionReasonCode | null;
  /** Single line for API / copy */
  reason: string;
  stage: "execution";
  /** Primary operator headline */
  headline: string;
  /** approved → executing → outcome */
  transitionLine: string;
};

type TruthEvent = {
  id: string;
  status?: string;
  approvedAt?: string;
  rejectedAt?: string;
  failedAt?: string;
  executed?: boolean;
  executedAt?: string;
  proposalStatus?: string;
};

type TruthPolicy = {
  decision: string;
  rule: string;
  reason: string;
};

type TruthAction = {
  approvalId: string;
  status: string;
  summary?: string;
};

function isApproved(e: TruthEvent): boolean {
  return (
    !!e.approvedAt ||
    e.status === "approved" ||
    e.executed === true ||
    e.proposalStatus === "approved" ||
    e.proposalStatus === "executing" ||
    e.proposalStatus === "executed" ||
    e.proposalStatus === "failed"
  );
}

function isRejected(e: TruthEvent): boolean {
  return !!e.rejectedAt || e.proposalStatus === "rejected";
}

function mapDenyToReasonCode(rule: string): TraceExecutionReasonCode {
  if (rule === "code.apply.preflight") return "preflight-failed";
  return "policy-denied";
}

function policyDetail(policy: TruthPolicy): string {
  const code = mapDenyToReasonCode(policy.rule);
  const slug = policy.reason?.trim() ?? "";
  const human = reasonFromPolicyReason(slug).summary;
  return `${code}: ${human || slug || policy.rule}`;
}

/**
 * Pick primary event the same way as TracePanel: sort by executedAt ?? createdAt, then createdAt.
 */
export function sortEventsForPrimaryEvent<
  T extends { createdAt: string; executedAt?: string },
>(events: T[]): T[] {
  return [...events].sort((a, b) => {
    const ta = a.executedAt ?? a.createdAt ?? "";
    const tb = b.executedAt ?? b.createdAt ?? "";
    return ta.localeCompare(tb) || a.createdAt.localeCompare(b.createdAt);
  });
}

export function deriveTraceExecutionOutcome(input: {
  event: TruthEvent;
  policy?: TruthPolicy | null;
  action?: TruthAction | null;
}): TraceExecutionOutcome {
  const { event, policy } = input;
  const action = input.action?.approvalId === event.id ? input.action : null;

  const rejected = isRejected(event);
  const approved = isApproved(event);
  const policyDenied = policy?.decision === "deny";
  const failed = !!event.failedAt;
  const completed = event.executed === true && !failed;

  if (rejected) {
    return {
      status: "not_applicable",
      reasonCode: "approval-rejected",
      reason: "approval-rejected: operator rejected before execution",
      stage: "execution",
      headline: "Rejected — execution did not run",
      transitionLine: "proposed → approval → rejected (execution never authorized)",
    };
  }

  if (!approved) {
    return {
      status: "blocked",
      reasonCode: "missing-approval",
      reason: "missing-approval: no operator approval recorded",
      stage: "execution",
      headline: "Execution blocked — no approval recorded",
      transitionLine: "proposed → awaiting approval (execution blocked until approved)",
    };
  }

  if (completed) {
    return {
      status: "completed",
      reasonCode: null,
      reason: "completed: receipt and execution recorded",
      stage: "execution",
      headline: "Executed successfully",
      transitionLine: event.executedAt
        ? `approved → executing → executed successfully · ${event.executedAt}`
        : "approved → executing → executed successfully",
    };
  }

  if (failed) {
    const actionHint = action?.summary?.trim();
    const reason = actionHint
      ? `execution-error: ${actionHint}`
      : "execution-error: adapter or runtime failure (see event failedAt)";
    return {
      status: "failed",
      reasonCode: "execution-error",
      reason,
      stage: "execution",
      headline: "Execution failed",
      transitionLine: event.failedAt
        ? `approved → executing → failed · ${event.failedAt}`
        : "approved → executing → failed",
    };
  }

  if (policyDenied) {
    const code = mapDenyToReasonCode(policy.rule);
    const detail = policyDetail(policy);
    return {
      status: "blocked",
      reasonCode: code,
      reason: detail,
      stage: "execution",
      headline: "Execution blocked (policy)",
      transitionLine: "approved → executing → execution blocked (policy)",
    };
  }

  // Approved, no deny, not failed, not executed yet
  return {
    status: "pending",
    reasonCode: null,
    reason: "awaiting execution (use Execute when ready)",
    stage: "execution",
    headline: "Awaiting execution",
    transitionLine: "approved → awaiting execution → Execute",
  };
}
