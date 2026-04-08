import { NextResponse } from "next/server";

export const runtime = "nodejs";
import { readJson, getEventsFilePath, getDateKey } from "@/lib/storage";
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

function buildPipelineSummary(args: {
  events: Array<{
    id: string;
    kind: string;
    createdAt: string;
    approvedAt?: string;
    rejectedAt?: string;
    executedAt?: string;
    executed?: boolean;
    failedAt?: string;
    source?: { connector: string };
  }>;
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
    {
      id: "proposal",
      label: "Proposal",
      status: "done",
      timestamp: event.createdAt,
      summary: "Proposal received",
      evidence: [`event:${event.id}`],
    },
    {
      id: "approval",
      label: "Approval",
      status: wasRejected ? "blocked" : event.approvedAt ? "done" : "active",
      timestamp: event.approvedAt ?? event.rejectedAt,
      summary: wasRejected
        ? "Rejected by operator"
        : event.approvedAt
          ? "Approved by operator"
          : "Waiting for approval",
      evidence: [
        ...(event.approvedAt ? ["approvedAt"] : []),
        ...(event.rejectedAt ? ["rejectedAt"] : []),
      ],
      ...(wasRejected ? { reason: getReasonDetail("APPROVAL_REQUIRED") } : {}),
    },
    {
      id: "policy",
      label: "Policy",
      status: policy
        ? policyDenied
          ? "blocked"
          : "done"
        : event.approvedAt
          ? "active"
          : "pending",
      timestamp: policy?.timestamp,
      summary: policy
        ? policyDenied
          ? `Policy blocked (${policy.rule})`
          : `Policy allowed (${policy.rule})`
        : event.approvedAt
          ? "Policy check pending"
          : "Waiting for approval",
      evidence: policy ? [`policy:${policy.rule}:${policy.reason}`] : [],
      ...(policyDenied && policy ? { reason: reasonFromPolicyReason(policy.reason) } : {}),
    },
    {
      id: "execution",
      label: "Execution",
      status: policyDenied
        ? "blocked"
        : executionFailed
          ? "blocked"
          : executed
            ? "done"
            : event.approvedAt
              ? "active"
              : "pending",
      timestamp: event.executedAt ?? event.failedAt,
      summary: policyDenied
        ? "Policy blocked"
        : executionFailed
          ? "Execution failed"
          : executed
            ? "Execution completed"
            : event.approvedAt
              ? "Execution queued"
              : "Waiting for approval",
      evidence: [
        ...(event.executedAt ? ["executedAt"] : []),
        ...(event.failedAt ? ["failedAt"] : []),
      ],
      ...(executionFailed ? { reason: getReasonDetail("POLICY_DENIED") } : {}),
    },
    {
      id: "receipt",
      label: "Receipt",
      status: hasReceipt ? "done" : executed ? "active" : "pending",
      timestamp: action?.at,
      summary: hasReceipt
        ? "Receipt recorded"
        : executed
          ? "Receipt pending"
          : "Waiting for execution",
      evidence: hasReceipt
        ? [
            ...(action.outputPath ? [action.outputPath] : []),
            ...(action.artifactPath ? [action.artifactPath] : []),
          ]
        : [],
    },
    {
      id: "reconciliation",
      label: "Reconciliation",
      status: reconciliation
        ? reconciliation.status === "verified"
          ? "done"
          : reconciliation.status === "drift_detected"
            ? "blocked"
            : "active"
        : executed
          ? "active"
          : "pending",
      timestamp: reconciliation?.timestamp,
      summary: reconciliation
        ? `${reconciliation.status}: ${reconciliation.reason}`
        : executed
          ? "Awaiting reconciliation"
          : "Not started",
      evidence: reconciliation ? [reconciliation.reason] : [],
    },
  ];

  const currentStage =
    stages.find((s) => s.status === "active")?.id ??
    (stages.find((s) => s.status === "blocked")?.id ?? "reconciliation");

  const blockedReason =
    wasRejected
      ? "approval_rejected"
      : policyDenied
        ? policy?.reason
        : executionFailed
          ? "execution_failed"
          : reconciliation?.status === "drift_detected"
            ? reconciliation.reason
            : undefined;

  return { stages, currentStage, blockedReason };
}

function toDateKey(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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
  const dateKeys = Array.from({ length: 7 }, (_, i) => toDateKey(i));

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
            symptom: typeof n.symptom === "string" ? n.symptom : String(payload.symptom ?? ""),
            verificationCheck:
              typeof n.verificationCheck === "string"
                ? n.verificationCheck
                : String(payload.verificationCheck ?? ""),
            fallbackIfFailed:
              typeof n.fallbackIfFailed === "string"
                ? n.fallbackIfFailed
                : String(payload.fallbackIfFailed ?? ""),
          }
        : undefined;

    return {
      id: e.id,
      traceId: e.traceId ?? e.id,
      kind: normalized.kind,
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
