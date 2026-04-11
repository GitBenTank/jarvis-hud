import { NextResponse } from "next/server";

export const runtime = "nodejs";
import { readJson, getEventsFilePath, getDateKey } from "@/lib/storage";
import { listTraceScanDateKeys } from "@/lib/trace-scan";
import { readActionLogByTraceId, type ActionLogEntry } from "@/lib/action-log";
import { readRecoveryVerifications } from "@/lib/recovery-verification";
import { isRecoveryClass } from "@/lib/recovery-shared";
import { readPolicyDecisionsByTraceId, type PolicyDecisionEntry } from "@/lib/policy-decision-log";
import { readReconciliationByTraceId, type ReconciliationEntry } from "@/lib/reconciliation-log";
import { normalizeAction } from "@/lib/normalize";
import { getReasonDetail, reasonFromPolicyReason, type ReasonDetail } from "@/lib/reason-taxonomy";

type StoredEvent = {
  id: string;
  traceId?: string;
  type: string;
  agent: string;
  payload: unknown;
  requiresApproval?: boolean;
  status: string;
  createdAt: string;
  executed?: boolean;
  executedAt?: string;
  source?: {
    connector: string;
    verified?: boolean;
    sessionId?: string;
    agentId?: string;
    requestId?: string;
  };
  correlationId?: string;
  actorId?: string;
  actorType?: "human" | "agent";
  actorLabel?: string;
  approvalActorId?: string;
  approvalActorType?: "human" | "agent";
  approvalActorLabel?: string;
  rejectionActorId?: string;
  rejectionActorType?: "human" | "agent";
  rejectionActorLabel?: string;
  executionActorId?: string;
  executionActorType?: "human" | "agent";
  executionActorLabel?: string;
  proposalStatus?: string;
  approvedAt?: string;
  rejectedAt?: string;
  failedAt?: string;
  /** OpenClaw builder agent label (metadata only). */
  builder?: string;
  /** LLM provider (metadata only). */
  provider?: string;
  /** Model id (metadata only). */
  model?: string;
};

type PipelineStageId =
  | "proposal"
  | "approval"
  | "policy"
  | "execution"
  | "receipt"
  | "reconciliation";

type PipelineStageStatus = "done" | "active" | "pending" | "blocked";

type PipelineStage = {
  id: PipelineStageId;
  label: string;
  status: PipelineStageStatus;
  timestamp?: string;
  summary: string;
  evidence: string[];
  reason?: ReasonDetail;
};

type PipelineSummaryEvent = {
  id: string;
  kind: string;
  createdAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  executedAt?: string;
  executed?: boolean;
  failedAt?: string;
  source?: { connector: string };
};

function tracePipelineCurrentStage(stages: PipelineStage[]): PipelineStageId {
  const active = stages.find((s) => s.status === "active");
  if (active) return active.id;
  const blocked = stages.find((s) => s.status === "blocked");
  if (blocked) return blocked.id;
  return "reconciliation";
}

function tracePipelineBlockedReason(args: {
  wasRejected: boolean;
  policyDenied: boolean;
  policy: PolicyDecisionEntry | undefined;
  executionFailed: boolean;
  reconciliation: ReconciliationEntry | undefined;
}): string | undefined {
  if (args.wasRejected) return "approval_rejected";
  if (args.policyDenied) return args.policy?.reason;
  if (args.executionFailed) return "execution_failed";
  if (args.reconciliation?.status === "drift_detected") {
    return args.reconciliation.reason;
  }
  return undefined;
}

function buildProposalStage(event: PipelineSummaryEvent): PipelineStage {
  return {
    id: "proposal",
    label: "Proposal",
    status: "done",
    timestamp: event.createdAt,
    summary: "Proposal received",
    evidence: [`event:${event.id}`],
  };
}

function buildApprovalPipelineStage(
  event: PipelineSummaryEvent,
  wasRejected: boolean
): PipelineStage {
  let status: PipelineStageStatus;
  let summary: string;
  if (wasRejected) {
    status = "blocked";
    summary = "Rejected by operator";
  } else if (event.approvedAt) {
    status = "done";
    summary = "Approved by operator";
  } else {
    status = "active";
    summary = "Waiting for approval";
  }
  return {
    id: "approval",
    label: "Approval",
    status,
    timestamp: event.approvedAt ?? event.rejectedAt,
    summary,
    evidence: [
      ...(event.approvedAt ? ["approvedAt"] : []),
      ...(event.rejectedAt ? ["rejectedAt"] : []),
    ],
    ...(wasRejected ? { reason: getReasonDetail("APPROVAL_REQUIRED") } : {}),
  };
}

function buildPolicyPipelineStage(
  event: PipelineSummaryEvent,
  policy: PolicyDecisionEntry | undefined,
  policyDenied: boolean
): PipelineStage {
  let status: PipelineStageStatus;
  let summary: string;
  if (policy) {
    if (policyDenied) {
      status = "blocked";
      summary = `Policy blocked (${policy.rule})`;
    } else {
      status = "done";
      summary = `Policy allowed (${policy.rule})`;
    }
  } else if (event.approvedAt) {
    status = "active";
    summary = "Policy check pending";
  } else {
    status = "pending";
    summary = "Waiting for approval";
  }
  return {
    id: "policy",
    label: "Policy",
    status,
    timestamp: policy?.timestamp,
    summary,
    evidence: policy ? [`policy:${policy.rule}:${policy.reason}`] : [],
    ...(policyDenied && policy ? { reason: reasonFromPolicyReason(policy.reason) } : {}),
  };
}

function buildExecutionPipelineStage(
  event: PipelineSummaryEvent,
  policyDenied: boolean,
  executionFailed: boolean,
  executed: boolean
): PipelineStage {
  let status: PipelineStageStatus;
  let summary: string;
  if (policyDenied) {
    status = "blocked";
    summary = "Policy blocked";
  } else if (executionFailed) {
    status = "blocked";
    summary = "Execution failed";
  } else if (executed) {
    status = "done";
    summary = "Execution completed";
  } else if (event.approvedAt) {
    status = "active";
    summary = "Execution queued";
  } else {
    status = "pending";
    summary = "Waiting for approval";
  }
  return {
    id: "execution",
    label: "Execution",
    status,
    timestamp: event.executedAt ?? event.failedAt,
    summary,
    evidence: [
      ...(event.executedAt ? ["executedAt"] : []),
      ...(event.failedAt ? ["failedAt"] : []),
    ],
    ...(executionFailed ? { reason: getReasonDetail("POLICY_DENIED") } : {}),
  };
}

function buildReceiptPipelineStage(
  action: ActionLogEntry | undefined,
  hasReceipt: boolean,
  executed: boolean
): PipelineStage {
  let status: PipelineStageStatus;
  let summary: string;
  if (hasReceipt) {
    status = "done";
    summary = "Receipt recorded";
  } else if (executed) {
    status = "active";
    summary = "Receipt pending";
  } else {
    status = "pending";
    summary = "Waiting for execution";
  }
  const evidence: string[] =
    hasReceipt && action
      ? [
          ...(action.outputPath ? [action.outputPath] : []),
          ...(action.artifactPath ? [action.artifactPath] : []),
        ]
      : [];
  return {
    id: "receipt",
    label: "Receipt",
    status,
    timestamp: action?.at,
    summary,
    evidence,
  };
}

function buildReconciliationPipelineStage(
  reconciliation: ReconciliationEntry | undefined,
  executed: boolean
): PipelineStage {
  let status: PipelineStageStatus;
  let summary: string;
  if (reconciliation) {
    if (reconciliation.status === "verified") {
      status = "done";
    } else if (reconciliation.status === "drift_detected") {
      status = "blocked";
    } else {
      status = "active";
    }
    summary = `${reconciliation.status}: ${reconciliation.reason}`;
  } else if (executed) {
    status = "active";
    summary = "Awaiting reconciliation";
  } else {
    status = "pending";
    summary = "Not started";
  }
  return {
    id: "reconciliation",
    label: "Reconciliation",
    status,
    timestamp: reconciliation?.timestamp,
    summary,
    evidence: reconciliation ? [reconciliation.reason] : [],
  };
}

function buildPipelineSummary(args: {
  events: PipelineSummaryEvent[];
  actions: ActionLogEntry[];
  policyDecisions: PolicyDecisionEntry[];
  reconciliations: ReconciliationEntry[];
}): { stages: PipelineStage[]; currentStage: PipelineStageId; blockedReason?: string } {
  const event = args.events[0];
  const action = args.actions[0];
  const policy = args.policyDecisions.at(-1);
  const reconciliation = args.reconciliations.at(-1);

  if (!event) {
    return {
      stages: [],
      currentStage: "proposal",
    };
  }

  const policyDenied = policy?.decision === "deny";
  const wasRejected = !!event.rejectedAt;
  const executionFailed = !!event.failedAt;
  const executed = !!event.executed;
  const hasReceipt = !!action;

  const stages: PipelineStage[] = [
    buildProposalStage(event),
    buildApprovalPipelineStage(event, wasRejected),
    buildPolicyPipelineStage(event, policy, policyDenied),
    buildExecutionPipelineStage(event, policyDenied, executionFailed, executed),
    buildReceiptPipelineStage(action, hasReceipt, executed),
    buildReconciliationPipelineStage(reconciliation, executed),
  ];

  const currentStage = tracePipelineCurrentStage(stages);
  const blockedReason = tracePipelineBlockedReason({
    wasRejected,
    policyDenied,
    policy,
    executionFailed,
    reconciliation,
  });

  return { stages, currentStage, blockedReason };
}

/** Safe string for trace display; avoids String(object) → "[object Object]". */
function stringFromPayloadField(payload: Record<string, unknown>, key: string): string {
  const v = payload[key];
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return "";
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ traceId: string }> }
) {
  const { traceId } = await params;
  if (!traceId || typeof traceId !== "string" || !traceId.trim()) {
    return NextResponse.json(
      { error: "traceId is required" },
      { status: 400 }
    );
  }

  const tid = traceId.trim();
  const dateKeys = listTraceScanDateKeys();

  let foundDateKey: string | null = null;
  const matchedEvents: StoredEvent[] = [];
  const matchedActions: ActionLogEntry[] = [];
  const matchedPolicyDecisions: PolicyDecisionEntry[] = [];
  const matchedReconciliations: ReconciliationEntry[] = [];

  for (const dateKey of dateKeys) {
    const events = await readJson<StoredEvent[]>(getEventsFilePath(dateKey));
    const eventMatches =
      events?.filter(
        (e) => (e.traceId ?? e.id) === tid
      ) ?? [];

    const actions = await readActionLogByTraceId(dateKey, tid);
    const policyDecisions = await readPolicyDecisionsByTraceId(dateKey, tid);
    const reconciliations = await readReconciliationByTraceId(dateKey, tid);

    if (eventMatches.length > 0 || actions.length > 0) {
      if (!foundDateKey) foundDateKey = dateKey;
      matchedEvents.push(...eventMatches);
      matchedActions.push(...actions);
    }
    matchedPolicyDecisions.push(...policyDecisions);
    matchedReconciliations.push(...reconciliations);
  }

  matchedPolicyDecisions.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  matchedReconciliations.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  if (matchedEvents.length === 0 && matchedActions.length === 0) {
    return NextResponse.json(
      { error: "Trace not found", traceId: tid },
      { status: 404 }
    );
  }

  const events = matchedEvents.map((e) => {
    const normalized = normalizeAction(e.payload);
    const ev = e as StoredEvent & {
      proposalStatus?: string;
      approvedAt?: string;
      rejectedAt?: string;
      failedAt?: string;
    };
    const payload = e.payload as Record<string, unknown> | null;
    const proposedAt =
      payload && typeof payload.proposedAt === "string" ? payload.proposedAt : undefined;

    const n = normalized as { kind: string; symptom?: string; verificationCheck?: string; fallbackIfFailed?: string };
    const recovery =
      n.kind.startsWith("recovery.") && payload
        ? {
            class: n.kind,
            symptom:
              typeof n.symptom === "string"
                ? n.symptom
                : stringFromPayloadField(payload, "symptom"),
            verificationCheck:
              typeof n.verificationCheck === "string"
                ? n.verificationCheck
                : stringFromPayloadField(payload, "verificationCheck"),
            fallbackIfFailed:
              typeof n.fallbackIfFailed === "string"
                ? n.fallbackIfFailed
                : stringFromPayloadField(payload, "fallbackIfFailed"),
          }
        : undefined;

    return {
      id: e.id,
      traceId: e.traceId ?? e.id,
      kind: normalized.kind,
      agent: e.agent,
      status: e.status,
      createdAt: e.createdAt,
      executedAt: e.executedAt ?? undefined,
      executed: e.executed,
      summary: normalized.summary,
      title: normalized.title,
      source: e.source ?? undefined,
      correlationId: (e as { correlationId?: string }).correlationId ?? undefined,
      proposedAt,
      proposalStatus: ev.proposalStatus,
      approvedAt: ev.approvedAt,
      rejectedAt: ev.rejectedAt,
      failedAt: ev.failedAt,
      recovery,
      actorId: e.actorId,
      actorType: e.actorType,
      actorLabel: e.actorLabel,
      approvalActorId: e.approvalActorId,
      approvalActorType: e.approvalActorType,
      approvalActorLabel: e.approvalActorLabel,
      rejectionActorId: e.rejectionActorId,
      rejectionActorType: e.rejectionActorType,
      rejectionActorLabel: e.rejectionActorLabel,
      executionActorId: e.executionActorId,
      executionActorType: e.executionActorType,
      executionActorLabel: e.executionActorLabel,
      builder: e.builder,
      provider: e.provider,
      model: e.model,
    };
  });

  const artifactPaths = Array.from(
    new Set(
      matchedActions.flatMap((a) => {
        const paths: string[] = [];
        if (a.outputPath) paths.push(a.outputPath);
        if (a.artifactPath) paths.push(a.artifactPath);
        return paths;
      })
    )
  );

  const verifications = await readRecoveryVerifications();
  matchedActions.sort((a, b) => a.at.localeCompare(b.at));
  const actionsWithVerification = matchedActions.map((a) => {
    const out = { ...a };
    if (isRecoveryClass(a.kind)) {
      const v = verifications[a.approvalId];
      (out as { verificationStatus?: string }).verificationStatus = v?.status ?? "pending";
    }
    return out;
  });

  const pipeline = buildPipelineSummary({
    events,
    actions: actionsWithVerification,
    policyDecisions: matchedPolicyDecisions,
    reconciliations: matchedReconciliations,
  });

  return NextResponse.json({
    traceId: tid,
    dateKey: foundDateKey ?? getDateKey(),
    events,
    actions: actionsWithVerification,
    policyDecisions: matchedPolicyDecisions,
    reconciliations: matchedReconciliations,
    artifactPaths,
    pipeline,
  });
}
