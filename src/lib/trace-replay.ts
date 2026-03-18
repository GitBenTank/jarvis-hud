/**
 * Trace Replay — reconstruct a trace from stored logs.
 * Enables forensic debugging: rebuild proposal → approval → policy → execution → receipt → reconciliation from disk.
 */

import { readJson, getEventsFilePath } from "./storage";
import { readActionLogByTraceId, type ActionLogEntry } from "./action-log";
import { readPolicyDecisionsByTraceId, type PolicyDecisionEntry } from "./policy-decision-log";
import { readReconciliationByTraceId, type ReconciliationEntry } from "./reconciliation-log";
import { normalizeAction } from "./normalize";

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
  source?: {
    connector: string;
    verified?: boolean;
    sessionId?: string;
    agentId?: string;
    requestId?: string;
  };
  correlationId?: string;
};

/**
 * Assemble a trace replay from action, policy, and reconciliation logs plus events.
 * Searches recent date buckets (7 days), merges by traceId, sorts by timestamp.
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

  const primary = events.sort(
    (a, b) =>
      (a.executedAt ?? a.approvedAt ?? a.createdAt ?? "").localeCompare(
        b.executedAt ?? b.approvedAt ?? b.createdAt ?? ""
      )
  )[0];

  const normalized = primary ? normalizeAction(primary.payload) : null;
  const primaryPayload = primary?.payload as Record<string, unknown> | undefined;
  const proposedAt =
    primaryPayload && typeof primaryPayload.proposedAt === "string"
      ? primaryPayload.proposedAt
      : undefined;
  const proposal = primary
    ? {
        id: primary.id,
        kind: normalized?.kind ?? "unknown",
        summary: normalized?.summary ?? "",
        title: normalized?.title,
        createdAt: primary.createdAt,
        source: primary.source,
        correlationId: primary.correlationId ?? undefined,
        ...(proposedAt ? { proposedAt } : {}),
      }
    : null;

  const approval = primary
    ? {
        status: primary.status,
        approvedAt: primary.approvedAt ?? null,
        rejectedAt: primary.rejectedAt ?? null,
        failedAt: primary.failedAt ?? null,
        executed: primary.executed ?? false,
        executedAt: primary.executedAt ?? null,
      }
    : null;

  const execution =
    receipts.length > 0
      ? {
          kind: receipts[0].kind,
          at: receipts[0].at,
          status: receipts[0].status,
          approvalId: receipts[0].approvalId,
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
