/**
 * Single-line operator narrative from persisted proposal / approval / execution fields.
 * Preflight copy uses the same blocker text as Safety & readiness (no second derivation of will_block).
 */

import type { TraceExecutionOutcome } from "@/lib/execution-truth";
import type { ReasonDetail } from "@/lib/reason-taxonomy";

export type PreflightSnapshot = {
  preflight: {
    willBlock: boolean;
    reasons: string[];
    reasonDetails: ReasonDetail[];
  };
};

/**
 * When `willBlock` is true but no structured reason was returned — state only; details live in Safety & readiness.
 * Exported for drift-guard tests (`tests/unit/operator-ui-vocabulary.test.ts`).
 */
export const PREFLIGHT_BLOCKS_EXECUTION_FALLBACK = "Preflight will block execution";

/** First human-readable blocker line from a preflight payload (reasonDetails win over raw reasons). */
export function firstPreflightBlockerLine(preflight: PreflightSnapshot): string {
  const d = preflight.preflight.reasonDetails[0];
  if (d) return `${d.label}: ${d.summary}`;
  const r = preflight.preflight.reasons[0];
  if (typeof r === "string" && r.trim()) return r.trim();
  return PREFLIGHT_BLOCKS_EXECUTION_FALLBACK;
}

export type DecisionReplayPreflightPhase = {
  loading: boolean;
  data: PreflightSnapshot | null;
};

export type BuildDecisionReplayLineInput = {
  proposerLabel: string;
  kind: string;
  eventStatus: "pending" | "approved" | "denied";
  rejectedAt?: string;
  approvedAt?: string;
  executed?: boolean;
  failedAt?: string;
  approvalActorLabel?: string;
  approvalActorId?: string;
  rejectionActorLabel?: string;
  rejectionActorId?: string;
  /** True when Execute just succeeded in-session (before events list refresh). */
  sessionExecuteSucceeded?: boolean;
  /** Approvals detail modal: live /api/preflight snapshot. Omit on trace view. */
  preflight?: DecisionReplayPreflightPhase;
  /** Trace (or derived) execution truth; used when preflight is not in play. */
  executionOutcome?: Pick<TraceExecutionOutcome, "status" | "reason" | "reasonCode"> | null;
};

function trimOrUndef(s: string | undefined): string | undefined {
  const t = s?.trim();
  return t || undefined;
}

/**
 * One compact lifecycle sentence: propose → approval outcome → execution readiness / outcome.
 * Does not invent lifecycle fields; uses only the provided input.
 */
export function buildDecisionReplayLine(input: BuildDecisionReplayLineInput): string {
  const { proposerLabel, kind } = input;
  const head = `${proposerLabel} proposed ${kind}`;

  if (input.eventStatus === "denied" || input.rejectedAt) {
    const by = trimOrUndef(input.rejectionActorLabel) || trimOrUndef(input.rejectionActorId);
    return by ? `${head} → rejected by ${by}` : `${head} → rejected`;
  }

  if (input.eventStatus === "pending") {
    return `${head} → awaiting approval`;
  }

  const approver =
    trimOrUndef(input.approvalActorLabel) ||
    trimOrUndef(input.approvalActorId) ||
    "Local user";

  const doneOk =
    (input.executed === true && !input.failedAt) ||
    input.sessionExecuteSucceeded === true ||
    input.executionOutcome?.status === "completed";

  if (doneOk) {
    return `${head} → approved by ${approver} → executed successfully`;
  }

  const failed = !!input.failedAt || input.executionOutcome?.status === "failed";
  if (failed) {
    return `${head} → approved by ${approver} → execution failed`;
  }

  if (input.preflight?.loading) {
    return `${head} → approved by ${approver} → checking execution readiness`;
  }

  if (input.preflight?.data?.preflight.willBlock) {
    const blocker = firstPreflightBlockerLine(input.preflight.data);
    return `${head} → approved by ${approver} → execution blocked (${blocker})`;
  }

  if (input.preflight?.data) {
    return `${head} → approved by ${approver} → awaiting execution`;
  }

  const eo = input.executionOutcome;
  if (eo?.status === "blocked") {
    return `${head} → approved by ${approver} → execution blocked (${eo.reason})`;
  }
  if (eo?.status === "not_applicable" && eo.reasonCode === "approval-rejected") {
    return `${head} → rejected`;
  }
  if (eo?.status === "pending") {
    return `${head} → approved by ${approver} → awaiting execution`;
  }

  return `${head} → approved by ${approver} → awaiting execution (readiness unknown)`;
}
