import {
  buildExecutionCapabilities,
  type ExecutionCapabilities,
} from "@/lib/execution-surface";
import { buildQueueHeadline, formatLatestLedgerPulse } from "@/lib/governance-headline";

export type RuntimePosture = {
  activeTraceId: string | null;
  /** Newest proposal row in today's events file (any origin; e.g. simulate has no OpenClaw source). */
  lastProposalAt: string | null;
  /**
   * Latest OpenClaw connector activity on disk (same scan as OpenClaw health). Null when absent.
   * Filled by GET /api/config; `buildRuntimePosture` sets null — merge there.
   */
  lastOpenClawProposalAt: string | null;
  lastExecutionAt: string | null;
  pendingCount: number;
  approvedCount: number;
  executedCount: number;
  agentLastSeen: string | null;
  latestDecisionSummary: string;
  /** One-line queue counts for status strip (aligned with approvals vocabulary). */
  queueHeadline: string;
  latestBlockReason: string | null;
  authEnabled: boolean;
  ingressEnabled: boolean;
  safetyOn: boolean;
  /** Ground truth for dry-run vs live execute paths (no global "HUD is dry-run" lie). */
  executionCapabilities: ExecutionCapabilities;
};

type StoredEvent = {
  id: string;
  traceId?: string;
  status?: string;
  createdAt?: string;
  approvedAt?: string;
  executedAt?: string;
  executed?: boolean;
  payload?: unknown;
};

type ActionLogEntry = {
  traceId?: string;
  at?: string;
  kind?: string;
  status?: string;
};

type PolicyDecisionEntry = {
  decision?: "allow" | "deny";
  reason?: string;
  timestamp?: string;
};

export function buildRuntimePosture(args: {
  events: StoredEvent[];
  actions: ActionLogEntry[];
  authEnabled: boolean;
  ingressEnabled: boolean;
  safetyOn: boolean;
  policyDecisions?: PolicyDecisionEntry[];
}): RuntimePosture {
  const { events, actions } = args;
  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
  );
  const sortedActions = [...actions].sort(
    (a, b) => new Date(b.at ?? 0).getTime() - new Date(a.at ?? 0).getTime()
  );

  const lastProposal = sortedEvents[0];
  const executedEvents = events.filter((e) => e.executed || !!e.executedAt);
  const approvedEvents = events.filter((e) => e.status === "approved" && !e.executed);
  const pendingEvents = events.filter((e) => e.status === "pending");
  const lastExecution =
    [...executedEvents].sort(
      (a, b) => new Date(b.executedAt ?? 0).getTime() - new Date(a.executedAt ?? 0).getTime()
    )[0] ?? null;

  const latestTraceCandidate = [
    ...events.map((e) => ({
      traceId: e.traceId ?? e.id,
      at: new Date(e.executedAt ?? e.createdAt ?? 0).getTime(),
    })),
    ...actions.map((a) => ({
      traceId: a.traceId ?? null,
      at: new Date(a.at ?? 0).getTime(),
    })),
  ]
    .filter((x) => x.traceId)
    .sort((a, b) => b.at - a.at)[0];

  const latestActionRow = sortedActions[0]
    ? {
        at: sortedActions[0].at,
        status: sortedActions[0].status ?? "unknown",
        kind: sortedActions[0].kind ?? "action",
      }
    : null;
  const latestEventRow = lastProposal
    ? {
        status: lastProposal.status,
        payload: lastProposal.payload,
        createdAt: lastProposal.createdAt,
      }
    : null;
  const latestDecisionSummary = formatLatestLedgerPulse({
    latestAction: latestActionRow,
    latestEvent: latestEventRow,
  });
  const queueHeadline = buildQueueHeadline(
    pendingEvents.length,
    approvedEvents.length,
    executedEvents.length
  );

  const latestDeny = [...(args.policyDecisions ?? [])]
    .filter((p) => p.decision === "deny")
    .sort((a, b) => new Date(b.timestamp ?? 0).getTime() - new Date(a.timestamp ?? 0).getTime())[0];

  return {
    activeTraceId: latestTraceCandidate?.traceId ?? null,
    lastProposalAt: lastProposal?.createdAt ?? null,
    lastOpenClawProposalAt: null,
    lastExecutionAt: lastExecution?.executedAt ?? null,
    pendingCount: pendingEvents.length,
    approvedCount: approvedEvents.length,
    executedCount: executedEvents.length,
    agentLastSeen: lastProposal?.createdAt ?? null,
    latestDecisionSummary,
    queueHeadline,
    latestBlockReason: latestDeny?.reason ?? null,
    authEnabled: args.authEnabled,
    ingressEnabled: args.ingressEnabled,
    safetyOn: args.safetyOn,
    executionCapabilities: buildExecutionCapabilities(),
  };
}
