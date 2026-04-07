import { NextResponse } from "next/server";

export const runtime = "nodejs";
import { readJson, getEventsFilePath, getDateKey } from "@/lib/storage";
import { readActionLogByTraceId, type ActionLogEntry } from "@/lib/action-log";
import { readRecoveryVerifications } from "@/lib/recovery-verification";
import { isRecoveryClass } from "@/lib/recovery-shared";
import { readPolicyDecisionsByTraceId, type PolicyDecisionEntry } from "@/lib/policy-decision-log";
import { readReconciliationByTraceId, type ReconciliationEntry } from "@/lib/reconciliation-log";
import { normalizeAction } from "@/lib/normalize";

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

  return NextResponse.json({
    traceId: tid,
    dateKey: foundDateKey ?? getDateKey(),
    events,
    actions: actionsWithVerification,
    policyDecisions: matchedPolicyDecisions,
    reconciliations: matchedReconciliations,
    artifactPaths,
  });
}
