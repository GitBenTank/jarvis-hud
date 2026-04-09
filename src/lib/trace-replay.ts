/**
 * Trace Replay — reconstruct a trace from stored logs.
 * Enables forensic debugging: rebuild proposal → approval → policy → execution → receipt → reconciliation from disk.
 *
 * **Replay contract (deterministic ordering):**
 * - `proposal` — earliest matching ingress event (proposal envelope). Tie-break uses
 *   `executedAt ?? approvedAt ?? createdAt` ascending (see `proposalEvent` below).
 * - `approval` — lifecycle fields from that same event.
 * - `receipts` — full action-log timeline sorted by `at` (oldest → newest).
 * - `execution` — summary derived from the **latest** receipt by `at` (strongest execution outcome).
 * - `policyDecisions` / `reconciliation` — sorted by `timestamp` ascending.
 *
 * **Limitation:** only the last 7 calendar days of date buckets are scanned. Older traces
 * return null from assembly even if artifacts still exist on disk.
 */

import { readJson, getEventsFilePath } from "./storage";
import { readActionLogByTraceId, type ActionLogEntry } from "./action-log";
import { readPolicyDecisionsByTraceId, type PolicyDecisionEntry } from "./policy-decision-log";
import { readReconciliationByTraceId, type ReconciliationEntry } from "./reconciliation-log";
import { normalizeAction } from "./normalize";
import type { ActorFieldsOnEvent } from "./actor-identity";

function toDateKey(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export type TraceReplayResult = {
  traceId: string;
  dateKey: string | null;
  proposal: Record<string, unknown> | null;
  approval: Record<string, unknown> | null;
  policyDecisions: PolicyDecisionEntry[];
  execution: Record<string, unknown> | null;
  receipts: ActionLogEntry[];
  reconciliation: ReconciliationEntry[];
};

type StoredEvent = {
  id: string;
  traceId?: string;
  payload: unknown;
  status: string;
  createdAt: string;
  executed?: boolean;
  executedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  failedAt?: string;
  agent?: string;
  source?: {
    connector: string;
    verified?: boolean;
    sessionId?: string;
    agentId?: string;
    requestId?: string;
  };
  correlationId?: string;
} & Partial<ActorFieldsOnEvent>;

/**
 * Assemble a trace replay from action, policy, and reconciliation logs plus events.
 * Scans the last 7 date buckets, merges by traceId, applies the replay contract above.
 */
export async function assembleTraceReplay(traceId: string): Promise<TraceReplayResult | null> {
  const tid = traceId.trim();
  const dateKeys = Array.from({ length: 7 }, (_, i) => toDateKey(i));

  let foundDateKey: string | null = null;
  const events: StoredEvent[] = [];
  const receipts: ActionLogEntry[] = [];
  const policyDecisions: PolicyDecisionEntry[] = [];
  const reconciliation: ReconciliationEntry[] = [];

  for (const dateKey of dateKeys) {
    const evs = await readJson<StoredEvent[]>(getEventsFilePath(dateKey));
    const eventMatches = evs?.filter((e) => (e.traceId ?? e.id) === tid) ?? [];
    const actions = await readActionLogByTraceId(dateKey, tid);
    const policy = await readPolicyDecisionsByTraceId(dateKey, tid);
    const recon = await readReconciliationByTraceId(dateKey, tid);

    if (eventMatches.length > 0 || actions.length > 0) {
      if (!foundDateKey) foundDateKey = dateKey;
      events.push(...eventMatches);
      receipts.push(...actions);
    }
    policyDecisions.push(...policy);
    reconciliation.push(...recon);
  }

  policyDecisions.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  reconciliation.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  if (events.length === 0 && receipts.length === 0) {
    return null;
  }

  receipts.sort((a, b) => a.at.localeCompare(b.at));
  const latestReceipt = receipts.at(-1) ?? null;

  /** Earliest proposal envelope by composite time (not “latest state”). */
  const proposalEvent = [...events].sort(
    (a, b) =>
      (a.executedAt ?? a.approvedAt ?? a.createdAt ?? "").localeCompare(
        b.executedAt ?? b.approvedAt ?? b.createdAt ?? ""
      )
  )[0];

  const normalized = proposalEvent ? normalizeAction(proposalEvent.payload) : null;
  const proposalPayload = proposalEvent?.payload as Record<string, unknown> | undefined;
  const proposedAt =
    proposalPayload && typeof proposalPayload.proposedAt === "string"
      ? proposalPayload.proposedAt
      : undefined;
  const proposal = proposalEvent
    ? {
        id: proposalEvent.id,
        kind: normalized?.kind ?? "unknown",
        summary: normalized?.summary ?? "",
        title: normalized?.title,
        createdAt: proposalEvent.createdAt,
        source: proposalEvent.source,
        correlationId: proposalEvent.correlationId ?? undefined,
        agent: proposalEvent.agent,
        ...(proposalEvent.actorId
          ? {
              actorId: proposalEvent.actorId,
              actorType: proposalEvent.actorType,
              actorLabel: proposalEvent.actorLabel,
            }
          : {}),
        ...(proposedAt ? { proposedAt } : {}),
      }
    : null;

  const approval = proposalEvent
    ? {
        status: proposalEvent.status,
        approvedAt: proposalEvent.approvedAt ?? null,
        rejectedAt: proposalEvent.rejectedAt ?? null,
        failedAt: proposalEvent.failedAt ?? null,
        executed: proposalEvent.executed ?? false,
        executedAt: proposalEvent.executedAt ?? null,
        ...(proposalEvent.approvalActorId
          ? {
              approvalActorId: proposalEvent.approvalActorId,
              approvalActorType: proposalEvent.approvalActorType,
              approvalActorLabel: proposalEvent.approvalActorLabel,
            }
          : {}),
        ...(proposalEvent.rejectionActorId
          ? {
              rejectionActorId: proposalEvent.rejectionActorId,
              rejectionActorType: proposalEvent.rejectionActorType,
              rejectionActorLabel: proposalEvent.rejectionActorLabel,
            }
          : {}),
        ...(proposalEvent.executionActorId
          ? {
              executionActorId: proposalEvent.executionActorId,
              executionActorType: proposalEvent.executionActorType,
              executionActorLabel: proposalEvent.executionActorLabel,
            }
          : {}),
      }
    : null;

  const execution = latestReceipt
    ? {
        kind: latestReceipt.kind,
        at: latestReceipt.at,
        status: latestReceipt.status,
        approvalId: latestReceipt.approvalId,
        ...(latestReceipt.actors ? { actors: latestReceipt.actors } : {}),
      }
    : null;

  return {
    traceId: tid,
    dateKey: foundDateKey,
    proposal,
    approval,
    policyDecisions,
    execution,
    receipts,
    reconciliation,
  };
}
