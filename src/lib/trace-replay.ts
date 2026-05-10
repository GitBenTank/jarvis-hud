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
 * **Limitation:** only the last `TRACE_SCAN_DAY_WINDOW` calendar days of date buckets are
 * scanned (`trace-scan.ts`). Older traces return null from assembly even if artifacts still
 * exist on disk.
 */

import { readJson, getEventsFilePath } from "./storage";
import { listTraceScanDateKeys } from "./trace-scan";
import { readActionLogByTraceId, type ActionLogEntry } from "./action-log";
import { readPolicyDecisionsByTraceId, type PolicyDecisionEntry } from "./policy-decision-log";
import { readReconciliationByTraceId, type ReconciliationEntry } from "./reconciliation-log";
import { normalizeAction } from "./normalize";
import type { ActorFieldsOnEvent } from "./actor-identity";
import {
  humanPrincipalsFromLifecycleFields,
  validateEventsForIdentityBindingExport,
} from "./audit-export-identity";

/** One governed workflow step (child receipt) for replay/export readability. */
export type WorkflowReplayStepSummary = {
  stepIndex: number;
  kind: string;
  summary: string;
  childApprovalId: string;
  outputPath?: string;
  at: string;
};

export type WorkflowParentReceiptSummary = {
  kind: string;
  at: string;
  summary: string;
  approvalId: string;
  workflowChildCount?: number;
};

export type WorkflowReplayLineage = {
  parentApprovalId: string;
  /** Operator-facing explanation (v0.3 truth test: parent vs step receipts). */
  narrative: string;
  steps: WorkflowReplayStepSummary[];
  parentReceipt: WorkflowParentReceiptSummary | null;
  /** Child receipts sorted by workflowStepIndex (same data as steps). */
  childReceipts: ActionLogEntry[];
};

/**
 * Derive workflow parent → step lineage from action log receipts (replay or live).
 */
export function computeWorkflowLineage(
  receiptsSorted: ActionLogEntry[],
  parentApprovalId: string
): WorkflowReplayLineage {
  const childReceipts = receiptsSorted
    .filter((r) => r.parentApprovalId === parentApprovalId)
    .sort((a, b) => (a.workflowStepIndex ?? 0) - (b.workflowStepIndex ?? 0));
  const parentRec =
    receiptsSorted.find(
      (r) => r.approvalId === parentApprovalId && r.kind === "workflow.plan"
    ) ?? null;
  const steps: WorkflowReplayStepSummary[] = childReceipts.map((r) => ({
    stepIndex: r.workflowStepIndex ?? 0,
    kind: r.kind,
    summary: r.summary,
    childApprovalId: r.approvalId,
    outputPath: r.outputPath,
    at: r.at,
  }));
  const n = steps.length;
  const narrative =
    n === 0
      ? `workflow.plan: parent approval ${parentApprovalId} has no child step receipts in this trace (unexpected after successful execute).`
      : `workflow.plan: one human approval (${parentApprovalId}) covered ${n} sequential governed step(s). Each step has its own receipt (child id …__wf_<i>); the closing receipt is the parent workflow row.`;

  return {
    parentApprovalId,
    narrative,
    steps,
    parentReceipt: parentRec
      ? {
          kind: parentRec.kind,
          at: parentRec.at,
          summary: parentRec.summary,
          approvalId: parentRec.approvalId,
          workflowChildCount: parentRec.workflowChildCount,
        }
      : null,
    childReceipts,
  };
}

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
  builder?: string;
  provider?: string;
  model?: string;
} & Partial<ActorFieldsOnEvent>;

export type TraceReplayResult = {
  traceId: string;
  dateKey: string | null;
  proposal: Record<string, unknown> | null;
  approval: Record<string, unknown> | null;
  policyDecisions: PolicyDecisionEntry[];
  execution: Record<string, unknown> | null;
  receipts: ActionLogEntry[];
  workflowLineage?: WorkflowReplayLineage;
  reconciliation: ReconciliationEntry[];
};

/**
 * Assemble a trace replay from action, policy, and reconciliation logs plus events.
 * Scans the configured day window, merges by traceId, applies the replay contract above.
 */
export async function assembleTraceReplay(traceId: string): Promise<TraceReplayResult | null> {
  const tid = traceId.trim();
  const dateKeys = listTraceScanDateKeys();

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

  validateEventsForIdentityBindingExport(events as unknown[]);

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
        ...(proposalEvent.builder ? { builder: proposalEvent.builder } : {}),
        ...(proposalEvent.provider ? { provider: proposalEvent.provider } : {}),
        ...(proposalEvent.model ? { model: proposalEvent.model } : {}),
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

  const proposalFields = proposalEvent
    ? (proposalEvent as unknown as Record<string, unknown>)
    : null;
  const humanPrincipals = proposalFields
    ? humanPrincipalsFromLifecycleFields(proposalFields)
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
        ...(proposalEvent.approvalPrincipalIss?.trim()
          ? {
              approvalPrincipalIss: proposalEvent.approvalPrincipalIss,
              approvalPrincipalSub: proposalEvent.approvalPrincipalSub,
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
        ...(proposalEvent.executionPrincipalIss?.trim()
          ? {
              executionPrincipalIss: proposalEvent.executionPrincipalIss,
              executionPrincipalSub: proposalEvent.executionPrincipalSub,
            }
          : {}),
        ...(humanPrincipals ? { humanPrincipals } : {}),
        principalRolesNote:
          "approvalPrincipal* = who approved; executionPrincipal* = who executed (receipt actors mirror the latest receipt; event fields are durable source).",
      }
    : null;

  const execution = latestReceipt
    ? {
        kind: latestReceipt.kind,
        at: latestReceipt.at,
        status: latestReceipt.status,
        approvalId: latestReceipt.approvalId,
        ...(latestReceipt.actors ? { actors: latestReceipt.actors } : {}),
        ...(proposalEvent?.executionPrincipalIss?.trim()
          ? {
              executionPrincipalIss: proposalEvent.executionPrincipalIss,
              executionPrincipalSub: proposalEvent.executionPrincipalSub,
            }
          : {}),
        ...(proposalEvent?.executionActorId
          ? {
              executionActorId: proposalEvent.executionActorId,
              executionActorType: proposalEvent.executionActorType,
              executionActorLabel: proposalEvent.executionActorLabel,
            }
          : {}),
      }
    : null;

  const workflowLineage =
    normalized?.kind === "workflow.plan" && proposalEvent
      ? computeWorkflowLineage(receipts, proposalEvent.id)
      : undefined;

  return {
    traceId: tid,
    dateKey: foundDateKey,
    proposal,
    approval,
    policyDecisions,
    execution,
    receipts,
    ...(workflowLineage ? { workflowLineage } : {}),
    reconciliation,
  };
}
