"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useTraceContext } from "@/context/TraceContext";
import {
  normalizeProposalLifecycle,
  type ProposalLifecycleEvent,
} from "@/lib/proposal-lifecycle";
import { TRACE_SCAN_DAY_WINDOW } from "@/lib/trace-constants";
import type { ReceiptActors } from "@/lib/actor-identity";
import ApprovalTimePreflightSnapshotSection from "./ApprovalTimePreflightSnapshotSection";
import { buildDecisionReplayLine } from "@/lib/decision-replay";
import {
  deriveTraceExecutionOutcome,
  type TraceExecutionOutcome,
} from "@/lib/execution-truth";
import type { ApprovalPreflightSnapshotRecord } from "@/lib/approval-preflight-snapshot-shared";

type TraceEvent = {
  id: string;
  traceId?: string;
  kind: string;
  agent?: string;
  status: string;
  createdAt: string;
  executedAt?: string;
  executed?: boolean;
  summary?: string;
  title?: string;
  recovery?: {
    class: string;
    symptom: string;
    verificationCheck: string;
    fallbackIfFailed: string;
  };
  source?: {
    connector: string;
    verified?: boolean;
    sessionId?: string;
    agentId?: string;
    requestId?: string;
  };
  correlationId?: string;
  proposedAt?: string;
  proposalStatus?: string;
  approvedAt?: string;
  rejectedAt?: string;
  failedAt?: string;
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
  builder?: string;
  provider?: string;
  model?: string;
};

type TraceAction = {
  id: string;
  traceId?: string;
  at: string;
  kind: string;
  approvalId: string;
  status: string;
  summary: string;
  outputPath?: string;
  artifactPath?: string;
  verificationStatus?: "pending" | "verified" | "failed";
  commitHash?: string | null;
  rollbackCommand?: string | null;
  statsText?: string | null;
  statsJson?: { filesChangedCount: number; insertions: number; deletions: number } | null;
  repoHeadBefore?: string | null;
  repoHeadAfter?: string | null;
  actors?: ReceiptActors;
};

type TracePolicyDecision = {
  traceId: string;
  decision: "allow" | "deny";
  rule: string;
  reason: string;
  timestamp: string;
};

type TraceReconciliation = {
  traceId: string;
  status: "verified" | "drift_detected" | "not_reconcilable_yet";
  reason: string;
  timestamp: string;
};

type TraceResponse = {
  traceId: string;
  dateKey: string;
  events: TraceEvent[];
  actions: TraceAction[];
  policyDecisions?: TracePolicyDecision[];
  reconciliations?: TraceReconciliation[];
  artifactPaths: string[];
  executionOutcome?: TraceExecutionOutcome;
  approvalPreflightSnapshot?: ApprovalPreflightSnapshotRecord | null;
};

/** Replay API response — reconstructs trace from action, policy, reconciliation logs */
type TraceReplayResult = {
  traceId: string;
  dateKey: string | null;
  proposal: {
    id: string;
    kind: string;
    summary: string;
    title?: string;
    createdAt: string;
    agent?: string;
    source?: {
      connector: string;
      verified?: boolean;
      sessionId?: string;
      agentId?: string;
      requestId?: string;
    };
    correlationId?: string;
    proposedAt?: string;
    actorId?: string;
    actorType?: "human" | "agent";
    actorLabel?: string;
    builder?: string;
    provider?: string;
    model?: string;
  } | null;
  approval: {
    status: string;
    approvedAt?: string | null;
    rejectedAt?: string | null;
    failedAt?: string | null;
    executed?: boolean;
    executedAt?: string | null;
    approvalActorId?: string;
    approvalActorType?: "human" | "agent";
    approvalActorLabel?: string;
    rejectionActorId?: string;
    rejectionActorType?: "human" | "agent";
    rejectionActorLabel?: string;
    executionActorId?: string;
    executionActorType?: "human" | "agent";
    executionActorLabel?: string;
  } | null;
  policyDecisions: TracePolicyDecision[];
  execution: Record<string, unknown> | null;
  receipts: TraceAction[];
  reconciliation: TraceReconciliation[];
};

/** Transform replay result into TraceResponse shape for UI consistency */
function replayToTraceResponse(raw: TraceReplayResult): TraceResponse {
  const { proposal, approval, receipts, policyDecisions, reconciliation } = raw;
  const tid = raw.traceId;
  const dateKey = raw.dateKey ?? "unknown";

  const events: TraceEvent[] = [];
  if (proposal && approval) {
    const p = proposal as { proposedAt?: string; correlationId?: string };
    const proposalStatus = approval.executed
      ? "executed"
      : approval.approvedAt
        ? "approved"
        : approval.rejectedAt
          ? "rejected"
          : "pending";
    events.push({
      id: proposal.id,
      traceId: tid,
      kind: proposal.kind,
      agent: proposal.agent,
      status: approval.status,
      createdAt: proposal.createdAt,
      executedAt: approval.executedAt ?? undefined,
      executed: approval.executed ?? false,
      summary: proposal.summary,
      title: proposal.title,
      source: proposal.source,
      correlationId: p.correlationId ?? undefined,
      proposedAt: typeof p.proposedAt === "string" ? p.proposedAt : undefined,
      proposalStatus,
      approvedAt: approval.approvedAt ?? undefined,
      rejectedAt: approval.rejectedAt ?? undefined,
      failedAt: approval.failedAt ?? undefined,
      actorId: proposal.actorId,
      actorType: proposal.actorType,
      actorLabel: proposal.actorLabel,
      approvalActorId: approval.approvalActorId,
      approvalActorType: approval.approvalActorType,
      approvalActorLabel: approval.approvalActorLabel,
      rejectionActorId: approval.rejectionActorId,
      rejectionActorType: approval.rejectionActorType,
      rejectionActorLabel: approval.rejectionActorLabel,
      executionActorId: approval.executionActorId,
      executionActorType: approval.executionActorType,
      executionActorLabel: approval.executionActorLabel,
      builder: proposal.builder,
      provider: proposal.provider,
      model: proposal.model,
    });
  }

  const artifactPaths: string[] = [];
  for (const r of receipts) {
    if (r.outputPath) artifactPaths.push(r.outputPath);
    if (r.artifactPath && !artifactPaths.includes(r.artifactPath)) artifactPaths.push(r.artifactPath);
  }

  const primary = events[0];
  const lastPolicy = policyDecisions?.at(-1);
  const actionForPrimary = primary
    ? receipts.find((a) => a.approvalId === primary.id) ?? null
    : null;
  const executionOutcome = primary
    ? deriveTraceExecutionOutcome({
        event: primary,
        policy: lastPolicy ?? null,
        action: actionForPrimary,
      })
    : undefined;

  return {
    traceId: tid,
    dateKey,
    events,
    actions: receipts,
    policyDecisions,
    reconciliations: reconciliation,
    artifactPaths,
    executionOutcome,
    approvalPreflightSnapshot: null,
  };
}

function formatTime(ts?: string): string {
  if (!ts) return "—";
  try {
    return new Date(ts).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return ts;
  }
}

function policyEffectLabel(decision: "allow" | "deny"): string {
  return decision === "allow" ? "Execution allowed" : "Execution blocked";
}

function policyReasonDisplay(reason: string | undefined): string {
  const t = reason?.trim();
  if (t) return t;
  return "—";
}

function policyHealthSecondaryLine(
  pd: TracePolicyDecision,
  traceStatus: string,
): ReactNode {
  const blocked = pd.decision === "deny" || traceStatus === "BLOCKED";
  const reason = pd.reason?.trim() ?? "";
  if (blocked) {
    return (
      <span className="mt-0.5 block whitespace-pre-wrap break-words font-normal text-red-800 dark:text-red-200/90">
        {reason || "—"}
      </span>
    );
  }
  if (reason) {
    return (
      <span
        className="mt-0.5 block truncate font-normal text-zinc-500 dark:text-zinc-400"
        title={reason}
      >
        {reason}
      </span>
    );
  }
  return null;
}

function statusStyles(status: string): { badge: string; dot: string } {
  const s = status.toLowerCase();
  if (s === "executed" || s === "written") {
    return {
      badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
      dot: "bg-emerald-500",
    };
  }
  if (s === "approved" || s === "executing") {
    return {
      badge: s === "executing"
        ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300"
        : "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
      dot: s === "executing" ? "bg-indigo-500" : "bg-blue-500",
    };
  }
  if (s === "pending" || s.includes("pending")) {
    return {
      badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
      dot: "bg-amber-500",
    };
  }
  if (s === "denied" || s === "rejected" || s === "failed" || s === "error") {
    return {
      badge: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
      dot: "bg-red-500",
    };
  }
  return {
    badge: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
    dot: "bg-zinc-400",
  };
}

function formatEventLifecycle(lifecycle: {
  proposalStatus: string;
  approvedAt: string | null;
  executedAt: string | null;
  rejectedAt: string | null;
  failedAt: string | null;
}): string {
  const parts: string[] = ["pending_approval"];
  if (lifecycle.rejectedAt) return "pending_approval → rejected";
  if (lifecycle.approvedAt) parts.push("approved");
  if (lifecycle.failedAt) return parts.join(" → ") + " → failed";
  if (lifecycle.executedAt) parts.push("executed");
  return parts.join(" → ");
}

function formatStatsJson(stats?: { filesChangedCount: number; insertions: number; deletions: number } | null): string {
  if (!stats) return "—";
  const { filesChangedCount, insertions, deletions } = stats;
  const parts: string[] = [];
  if (filesChangedCount > 0) parts.push(`${filesChangedCount} files`);
  if (insertions > 0 || deletions > 0) {
    parts.push(`+${insertions} / -${deletions}`);
  }
  return parts.join(" changed, ") || "—";
}

type RecentTraceRow = {
  traceId: string;
  lastActivityAt: string;
  summary: string;
};

export default function TracePanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const traceFromUrl = searchParams.get("trace")?.trim() ?? "";
  const {
    traceIdFromUrl,
    setActiveTraceId,
    traceData: contextTraceData,
    loading: contextLoading,
    error: contextError,
  } = useTraceContext();
  const [traceId, setTraceId] = useState("");
  const [data, setData] = useState<TraceResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"live" | "replay">("live");
  const [recentTraces, setRecentTraces] = useState<RecentTraceRow[]>([]);
  const [recentLoading, setRecentLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setRecentLoading(true);
    fetch("/api/traces/recent?limit=20")
      .then((res) => res.json())
      .then((json: { traces?: RecentTraceRow[] }) => {
        if (!cancelled && Array.isArray(json.traces)) {
          setRecentTraces(json.traces);
        }
      })
      .catch(() => {
        if (!cancelled) setRecentTraces([]);
      })
      .finally(() => {
        if (!cancelled) setRecentLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const openTraceDeepLink = useCallback(
    (tid: string) => {
      const t = tid.trim();
      if (!t) return;
      router.push(`/activity?trace=${encodeURIComponent(t)}`);
    },
    [router]
  );

  // Use shared trace data when URL has ?trace= and context has it (avoids duplicate fetch)
  const dataSource = traceFromUrl && traceIdFromUrl === traceFromUrl && contextTraceData
    ? contextTraceData
    : data;
  const loadingState = traceFromUrl && traceIdFromUrl === traceFromUrl
    ? contextLoading
    : loading;
  const errorState = traceFromUrl && traceIdFromUrl === traceFromUrl
    ? contextError
    : error;

  const doFetch = useCallback(
    async (tid: string, mode: "live" | "replay") => {
      const base = `/api/traces/${encodeURIComponent(tid)}`;
      const url = mode === "replay" ? `${base}/replay` : base;
      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok) return { error: json.error ?? `Request failed (${res.status})` };
      if (mode === "replay" && json.traceId) {
        return { data: replayToTraceResponse(json as TraceReplayResult) };
      }
      return { data: json as TraceResponse };
    },
    []
  );

  useEffect(() => {
    if (traceFromUrl) {
      setTraceId(traceFromUrl);
      setActiveTraceId(traceFromUrl);
      document.getElementById("trace-timeline")?.scrollIntoView({ behavior: "smooth" });
      // When trace is in URL, TraceProvider fetches — don't duplicate. Use context data.
      if (traceIdFromUrl !== traceFromUrl) return;
      if (contextTraceData) {
        const events = contextTraceData.events ?? [];
        const lastId = events.length > 0 ? events.at(-1)!.id : null;
        if (lastId) setExpandedIds(new Set([lastId]));
      }
    }
  }, [traceFromUrl, traceIdFromUrl, contextTraceData, setActiveTraceId]);

  // Only fetch when user manually loads a different trace (not from URL)
  useEffect(() => {
    if (traceFromUrl && traceIdFromUrl === traceFromUrl) return;
    if (traceFromUrl && viewMode === "replay") {
      setLoading(true);
      setError(null);
      doFetch(traceFromUrl, viewMode)
        .then((out) => {
          if (out.error) {
            setError(out.error);
            return;
          }
          if (out.data) {
            setData(out.data);
            const events = out.data.events ?? [];
            const lastId = events.length > 0 ? events.at(-1)!.id : null;
            if (lastId) setExpandedIds(new Set([lastId]));
          }
        })
        .catch(() => setError("Failed to fetch trace"))
        .finally(() => setLoading(false));
    }
  }, [traceFromUrl, traceIdFromUrl, viewMode, doFetch]);

  const copy = useCallback((text: string) => {
    if (text && text !== "—") navigator.clipboard.writeText(text);
  }, []);

  const copyTraceDeepLink = useCallback(
    (tid: string) => {
      if (!tid.trim()) return;
      const origin =
        typeof globalThis.location !== "undefined"
          ? globalThis.location.origin
          : "";
      const url = `${origin}/activity?trace=${encodeURIComponent(tid.trim())}`;
      navigator.clipboard.writeText(url);
    },
    []
  );

  const fetchTrace = useCallback(async () => {
    const tid = traceId.trim();
    if (!tid) {
      setError("Enter a traceId");
      return;
    }
    setLoading(true);
    setError(null);
    setData(null);
    setExpandedIds(new Set());
    try {
      const out = await doFetch(tid, viewMode);
      if (out.error) {
        setError(out.error);
        return;
      }
      if (out.data) {
        setData(out.data);
        setActiveTraceId(tid);
        const events = out.data.events ?? [];
        const lastId = events.length > 0 ? events.at(-1)!.id : null;
        if (lastId) setExpandedIds(new Set([lastId]));
      }
    } catch {
      setError("Failed to fetch trace");
    } finally {
      setLoading(false);
    }
  }, [traceId, viewMode, doFetch, setActiveTraceId]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const copyTraceSummary = useCallback(() => {
    if (!dataSource) return;
    const primaryEv = (dataSource.events ?? [])[0] as TraceEvent | undefined;
    const correlationId = primaryEv?.correlationId;
    const eventLines = (dataSource.events ?? []).map(
      (e) => `- ${e.status} | ${e.kind} | ${e.title ?? e.summary ?? "(untitled)"}`
    );
    const codeApplyActions = (dataSource.actions ?? []).filter((a) => a.kind === "code.apply");
    const receiptLines = codeApplyActions.flatMap((a) => [
      `- commit: ${a.commitHash ?? "—"}`,
      `  rollback: ${a.rollbackCommand ?? "—"}`,
    ]);
    const pathLines = dataSource.artifactPaths ?? [];
    const policyLines = (dataSource.policyDecisions ?? []).map(
      (pd) => `- ${pd.decision} | ${pd.rule} | ${pd.reason}`
    );
    const lines = [
      `traceId: ${dataSource.traceId}`,
      ...(correlationId ? [`correlationId: ${correlationId}`] : []),
      `dateKey: ${dataSource.dateKey}`,
      "",
      "## Events",
      ...eventLines,
      ...(policyLines.length > 0 ? ["", "## Policy decisions", ...policyLines] : []),
      ...(receiptLines.length > 0 ? ["", "## code.apply receipts", ...receiptLines] : []),
      ...(pathLines.length > 0 ? ["", "## Artifact paths", ...pathLines] : []),
    ];
    copy(lines.join("\n"));
  }, [dataSource, copy]);

  const openPath = useCallback(async (path: string, app: "finder" | "cursor") => {
    if (!path || path === "—") return;
    try {
      await fetch("/api/os/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, app }),
      });
    } catch {
      // ignore
    }
  }, []);

  const sortedEvents = useMemo(() => {
    const ev = dataSource?.events ?? [];
    return [...ev].sort((a, b) => {
      const ta = a.executedAt ?? a.createdAt ?? "";
      const tb = b.executedAt ?? b.createdAt ?? "";
      return ta.localeCompare(tb) || a.createdAt.localeCompare(b.createdAt);
    });
  }, [dataSource?.events]);

  const primaryEvent = sortedEvents[0];
  const primaryPolicy = useMemo(() => {
    const pd = dataSource?.policyDecisions ?? [];
    return pd.at(-1);
  }, [dataSource?.policyDecisions]);
  const primaryReceipt = useMemo(() => {
    const actions = dataSource?.actions ?? [];
    if (!primaryEvent) return actions[0];
    return actions.find((a) => a.approvalId === primaryEvent.id) ?? actions[0];
  }, [dataSource?.actions, primaryEvent]);

  const primaryReconciliation = useMemo(() => {
    const rec = dataSource?.reconciliations ?? [];
    return rec.at(-1);
  }, [dataSource?.reconciliations]);

  const executionOutcome = useMemo((): TraceExecutionOutcome | null => {
    if (!primaryEvent) return null;
    const fromApi = dataSource?.executionOutcome;
    if (fromApi) return fromApi;
    const act =
      primaryReceipt && primaryReceipt.approvalId === primaryEvent.id
        ? primaryReceipt
        : null;
    return deriveTraceExecutionOutcome({
      event: primaryEvent,
      policy: primaryPolicy ?? null,
      action: act,
    });
  }, [dataSource?.executionOutcome, primaryEvent, primaryPolicy, primaryReceipt]);

  const decisionReplayLine = useMemo(() => {
    if (!primaryEvent) return null;
    const denied = !!primaryEvent.rejectedAt || primaryEvent.status === "denied";
    const pending = !denied && primaryEvent.status === "pending";
    return buildDecisionReplayLine({
      proposerLabel:
        primaryEvent.actorLabel?.trim() ||
        primaryEvent.actorId?.trim() ||
        primaryEvent.agent?.trim() ||
        "Unknown proposer",
      kind: primaryEvent.kind,
      eventStatus: denied ? "denied" : pending ? "pending" : "approved",
      rejectedAt: primaryEvent.rejectedAt,
      approvedAt: primaryEvent.approvedAt,
      executed: primaryEvent.executed === true,
      failedAt: primaryEvent.failedAt,
      approvalActorLabel: primaryEvent.approvalActorLabel,
      approvalActorId: primaryEvent.approvalActorId,
      rejectionActorLabel: primaryEvent.rejectionActorLabel,
      rejectionActorId: primaryEvent.rejectionActorId,
      sessionExecuteSucceeded: false,
      executionOutcome,
    });
  }, [primaryEvent, executionOutcome]);

  const traceHealth = useMemo(() => {
    if (!primaryEvent || !executionOutcome) return null;
    const eo = executionOutcome;
    const status =
      eo.status === "completed"
        ? "COMPLETED"
        : eo.status === "failed"
          ? "FAILED"
          : eo.status === "blocked"
            ? "BLOCKED"
            : eo.status === "pending"
              ? "PENDING"
              : "NO_EXEC";
    const execution =
      eo.status === "completed"
        ? "COMPLETED"
        : eo.status === "failed"
          ? "FAILED"
          : eo.status === "blocked"
            ? "BLOCKED"
            : eo.status === "pending"
              ? "PENDING"
              : "N/A";
    const reconciliation =
      primaryReconciliation?.status === "verified"
        ? "VERIFIED"
        : primaryReconciliation?.status === "drift_detected"
          ? "DRIFT"
          : "PENDING";
    return {
      status,
      policy: primaryPolicy ? primaryPolicy.decision.toUpperCase() : "—",
      execution,
      executionReason: eo.reason,
      reconciliation,
    };
  }, [primaryEvent, primaryPolicy, primaryReconciliation, executionOutcome]);

  const hasReceiptForPrimary = useMemo(() => {
    if (!primaryEvent) return false;
    const actions = dataSource?.actions ?? [];
    return actions.some((a) => a.approvalId === primaryEvent.id);
  }, [dataSource?.actions, primaryEvent]);

  /** Single-line lifecycle for operators: propose → approve → execute → receipt (with times). */
  const endToEndSequence = useMemo(() => {
    if (!primaryEvent) return null;
    const parts: string[] = [];
    const pAt = primaryEvent.proposedAt ?? primaryEvent.createdAt;
    parts.push(`Proposed · ${formatTime(pAt)}`);
    if (primaryEvent.rejectedAt) {
      parts.push(`Rejected · ${formatTime(primaryEvent.rejectedAt)}`);
      return parts.join(" → ");
    }
    if (primaryEvent.approvedAt) {
      parts.push(`Approved · ${formatTime(primaryEvent.approvedAt)}`);
    } else if (primaryEvent.status === "approved" || primaryEvent.executed) {
      parts.push("Approved");
    } else {
      parts.push("Awaiting approval");
    }
    if (
      primaryPolicy?.decision === "deny" &&
      !primaryEvent.executed &&
      !primaryEvent.failedAt
    ) {
      parts.push(`Policy blocked execution · ${formatTime(primaryPolicy.timestamp)}`);
      return parts.join(" → ");
    }
    if (primaryEvent.failedAt) {
      parts.push(`Execute failed · ${formatTime(primaryEvent.failedAt)}`);
      return parts.join(" → ");
    }
    if (primaryEvent.executedAt) {
      parts.push(`Executed successfully · ${formatTime(primaryEvent.executedAt)}`);
    } else if (
      primaryEvent.approvedAt &&
      primaryPolicy?.decision !== "deny"
    ) {
      parts.push("Awaiting execution");
    }
    if (primaryEvent.executed) {
      if (hasReceiptForPrimary && primaryReceipt?.at) {
        parts.push(`Receipt · ${formatTime(primaryReceipt.at)}`);
      } else {
        parts.push("Receipt (pending or missing)");
      }
    }
    return parts.join(" → ");
  }, [
    primaryEvent,
    primaryPolicy,
    hasReceiptForPrimary,
    primaryReceipt,
  ]);

  const actorSummary = useMemo(() => {
    if (!primaryEvent) return null;
    const coordinator =
      primaryEvent.actorLabel ??
      primaryEvent.actorId ??
      primaryEvent.agent ??
      primaryEvent.source?.connector ??
      "—";
    const builder = primaryEvent.builder?.trim() ? primaryEvent.builder : "—";
    const provider = primaryEvent.provider?.trim() ? primaryEvent.provider : "—";
    const model = primaryEvent.model?.trim() ? primaryEvent.model : "—";
    const approver = primaryEvent.rejectedAt
      ? (primaryEvent.rejectionActorLabel ??
        primaryEvent.rejectionActorId ??
        "—")
      : primaryEvent.approvedAt || primaryEvent.executed
        ? (primaryEvent.approvalActorLabel ??
          primaryEvent.approvalActorId ??
          "—")
        : "(pending approval)";
    const executor =
      primaryReceipt?.actors?.executor?.actorLabel ??
      primaryReceipt?.actors?.executor?.actorId ??
      primaryEvent.executionActorLabel ??
      primaryEvent.executionActorId ??
      (primaryEvent.executed ? "—" : "(after execute)");
    return { coordinator, builder, provider, model, approver, executor };
  }, [primaryEvent, primaryReceipt]);

  type StageId = "proposal" | "approval" | "policy" | "execution" | "receipt" | "reconciliation";

  const lifecycleSteps = useMemo(() => {
    const steps: { id: string; label: string; icon: string; iconClass: string; lines: string[]; state: "done" | "missing" | "pending" }[] = [];
    if (!primaryEvent) return steps;
    const coordinatorDisplay =
      primaryEvent.actorLabel ??
      primaryEvent.actorId ??
      primaryEvent.source?.connector ??
      primaryEvent.agent ??
      "agent";
    const builderLine =
      primaryEvent.builder?.trim() ?
        `Builder: ${primaryEvent.builder.trim()}`
      : null;
    const providerLine =
      primaryEvent.provider?.trim() ?
        `Provider: ${primaryEvent.provider.trim()}`
      : null;
    const modelLine =
      primaryEvent.model?.trim() ?
        `Model: ${primaryEvent.model.trim()}`
      : null;
    const kind = primaryEvent.kind ?? "—";
    const pd = primaryPolicy;
    const executed = primaryEvent.executed || !!primaryEvent.failedAt;
    const approved = !!primaryEvent.approvedAt || primaryEvent.status === "approved" || primaryEvent.executed;
    const rejected = !!primaryEvent.rejectedAt;
    const eo = executionOutcome;

    const stageDefs: {
      id: StageId;
      step: {
        id: string;
        label: string;
        icon: string;
        iconClass: string;
        lines: string[];
        state: "done" | "missing" | "pending";
        rowAccent?: "success" | "policy-block" | "failed" | "pending" | "neutral";
      };
    }[] = [];

    stageDefs.push({
      id: "proposal",
      step: {
        id: "proposal",
        label: "Proposal",
        icon: "●",
        iconClass: "text-emerald-500",
        state: "done",
        lines: [
          `Coordinator: ${coordinatorDisplay}${primaryEvent.actorType ? ` (${primaryEvent.actorType})` : ""}`,
          ...(builderLine ? [builderLine] : []),
          ...(providerLine ? [providerLine] : []),
          ...(modelLine ? [modelLine] : []),
          `Kind: ${kind}`,
          `Time: ${formatTime(primaryEvent.createdAt)}`,
        ],
      },
    });

    if (rejected) {
      stageDefs.push({
        id: "approval",
        step: {
          id: "approval",
          label: "Approval",
          icon: "✗",
          iconClass: "text-red-500",
          state: "done",
          lines: [
            `Rejected by: ${primaryEvent.rejectionActorLabel ?? primaryEvent.rejectionActorId ?? "Human"}`,
            `Time: ${formatTime(primaryEvent.rejectedAt)}`,
          ],
        },
      });
    } else if (approved) {
      stageDefs.push({
        id: "approval",
        step: {
          id: "approval",
          label: "Approval",
          icon: "✓",
          iconClass: "text-emerald-500",
          state: "done",
          lines: [
            `Approved by: ${primaryEvent.approvalActorLabel ?? primaryEvent.approvalActorId ?? "Human"}`,
            `Time: ${formatTime(primaryEvent.approvedAt ?? primaryEvent.createdAt)}`,
          ],
        },
      });
    } else {
      stageDefs.push({
        id: "approval",
        step: {
          id: "approval",
          label: "Approval",
          icon: "○",
          iconClass: "text-amber-500",
          state: "pending",
          lines: ["Awaiting approval", "—"],
        },
      });
    }

    if (pd) {
      stageDefs.push({
        id: "policy",
        step: {
          id: "policy",
          label: "Policy",
          icon: pd.decision === "allow" ? "✓" : "✗",
          iconClass: pd.decision === "allow" ? "text-emerald-500" : "text-red-500",
          state: "done",
          lines: [
            `Effect: ${policyEffectLabel(pd.decision)}`,
            `Policy: ${pd.decision.toUpperCase()}`,
            `Rule: ${pd.rule}`,
            `Reason: ${policyReasonDisplay(pd.reason)}`,
            `Time: ${formatTime(pd.timestamp)}`,
          ],
        },
      });
    } else if (approved) {
      stageDefs.push({
        id: "policy",
        step: {
          id: "policy",
          label: "Policy",
          icon: "○",
          iconClass: "text-zinc-500",
          state: "pending",
          lines: ["Not yet evaluated", "Execute to trigger policy gate"],
        },
      });
    } else {
      stageDefs.push({
        id: "policy",
        step: {
          id: "policy",
          label: "Policy",
          icon: "—",
          iconClass: "text-zinc-400",
          state: "missing",
          lines: ["No policy decision", "Runs at execute time"],
        },
      });
    }

    if (eo) {
      if (eo.status === "completed") {
        const path = primaryReceipt?.outputPath ?? primaryReceipt?.artifactPath ?? "";
        const logPath = path ? path.split("/").slice(-2).join("/") : "—";
        const execActor =
          primaryReceipt?.actors?.executor?.actorLabel ??
          primaryReceipt?.actors?.executor?.actorId ??
          primaryEvent.executionActorLabel ??
          primaryEvent.executionActorId ??
          "—";
        stageDefs.push({
          id: "execution",
          step: {
            id: "execution",
            label: "Execution",
            icon: "✓",
            iconClass: "text-emerald-600",
            state: "done",
            rowAccent: "success",
            lines: [
              eo.headline,
              eo.reason,
              eo.transitionLine,
              `Executor: ${execActor}`,
              `Adapter: ${primaryReceipt?.kind ?? primaryEvent.kind ?? "—"}`,
              `Time: ${formatTime(primaryEvent.executedAt)}`,
              logPath,
            ],
          },
        });
      } else if (eo.status === "failed") {
        stageDefs.push({
          id: "execution",
          step: {
            id: "execution",
            label: "Execution",
            icon: "✗",
            iconClass: "text-red-600",
            state: "done",
            rowAccent: "failed",
            lines: [eo.headline, eo.reason, eo.transitionLine],
          },
        });
      } else if (eo.status === "blocked") {
        stageDefs.push({
          id: "execution",
          step: {
            id: "execution",
            label: "Execution",
            icon: "✗",
            iconClass: "text-red-600",
            state: "done",
            rowAccent: "policy-block",
            lines: [eo.headline, eo.reason, eo.transitionLine],
          },
        });
      } else if (eo.status === "pending") {
        stageDefs.push({
          id: "execution",
          step: {
            id: "execution",
            label: "Execution",
            icon: "○",
            iconClass: "text-amber-500",
            state: "pending",
            rowAccent: "pending",
            lines: [eo.headline, eo.reason, eo.transitionLine],
          },
        });
      } else {
        stageDefs.push({
          id: "execution",
          step: {
            id: "execution",
            label: "Execution",
            icon: "—",
            iconClass: "text-zinc-400",
            state: "missing",
            rowAccent: "neutral",
            lines: [eo.headline, eo.reason, eo.transitionLine],
          },
        });
      }
    } else if (primaryEvent.failedAt) {
      stageDefs.push({
        id: "execution",
        step: {
          id: "execution",
          label: "Execution",
          icon: "✗",
          iconClass: "text-red-600",
          state: "done",
          rowAccent: "failed",
          lines: ["Execution failed", `Time: ${formatTime(primaryEvent.failedAt)}`],
        },
      });
    } else if (executed) {
      const path = primaryReceipt?.outputPath ?? primaryReceipt?.artifactPath ?? "";
      const logPath = path ? path.split("/").slice(-2).join("/") : "—";
      const execActor =
        primaryReceipt?.actors?.executor?.actorLabel ??
        primaryReceipt?.actors?.executor?.actorId ??
        primaryEvent.executionActorLabel ??
        primaryEvent.executionActorId ??
        "—";
      stageDefs.push({
        id: "execution",
        step: {
          id: "execution",
          label: "Execution",
          icon: "✓",
          iconClass: "text-emerald-500",
          state: "done",
          rowAccent: "success",
          lines: [
            `Executor: ${execActor}`,
            `Adapter: ${primaryReceipt?.kind ?? primaryEvent.kind ?? "—"}`,
            `Time: ${formatTime(primaryEvent.executedAt)}`,
            logPath,
          ],
        },
      });
    } else if (approved && pd?.decision !== "deny") {
      stageDefs.push({
        id: "execution",
        step: {
          id: "execution",
          label: "Execution",
          icon: "○",
          iconClass: "text-amber-500",
          state: "pending",
          lines: ["Ready to execute", "—"],
        },
      });
    } else {
      stageDefs.push({
        id: "execution",
        step: {
          id: "execution",
          label: "Execution",
          icon: "—",
          iconClass: "text-zinc-400",
          state: "missing",
          lines: ["No execution", "—"],
        },
      });
    }

    if (hasReceiptForPrimary && executed) {
      const rec = primaryReceipt ?? dataSource?.actions?.find((a) => a.approvalId === primaryEvent.id);
      const path = rec?.outputPath ?? rec?.artifactPath ?? "";
      const logPath = path ? path.split("/").slice(-2).join("/") : `actions/${dataSource?.dateKey ?? ""}.jsonl`;
      const actorLines: string[] = [];
      if (rec?.actors?.proposer) {
        actorLines.push(
          `Proposer: ${rec.actors.proposer.actorLabel ?? rec.actors.proposer.actorId}`
        );
      }
      if (rec?.actors?.approver) {
        actorLines.push(
          `Approver: ${rec.actors.approver.actorLabel ?? rec.actors.approver.actorId}`
        );
      }
      if (rec?.actors?.executor) {
        actorLines.push(
          `Executor: ${rec.actors.executor.actorLabel ?? rec.actors.executor.actorId}`
        );
      }
      stageDefs.push({
        id: "receipt",
        step: {
          id: "receipt",
          label: "Receipt",
          icon: "✓",
          iconClass: "text-emerald-500",
          state: "done",
          lines: ["Receipt recorded", ...actorLines, logPath],
        },
      });
    } else if (executed) {
      stageDefs.push({
        id: "receipt",
        step: {
          id: "receipt",
          label: "Receipt",
          icon: "⚠",
          iconClass: "text-amber-500",
          state: "missing",
          lines: ["No receipt found", "Executed but no action log entry linked"],
        },
      });
    } else {
      stageDefs.push({
        id: "receipt",
        step: {
          id: "receipt",
          label: "Receipt",
          icon: "—",
          iconClass: "text-zinc-400",
          state: "missing",
          lines: ["No receipt", "Written after execution"],
        },
      });
    }

    if (primaryReconciliation) {
      const rec = primaryReconciliation;
      const icon = rec.status === "verified" ? "✓" : rec.status === "drift_detected" ? "⚠" : "○";
      const iconClass =
        rec.status === "verified"
          ? "text-emerald-500"
          : rec.status === "drift_detected"
            ? "text-amber-500"
            : "text-zinc-500";
      stageDefs.push({
        id: "reconciliation",
        step: {
          id: "reconciliation",
          label: "Reconciliation",
          icon,
          iconClass,
          state: rec.status === "verified" ? "done" : rec.status === "drift_detected" ? "missing" : "pending",
          lines: [`Status: ${rec.status}`, rec.reason, `Time: ${formatTime(rec.timestamp)}`],
        },
      });
    } else if (executed) {
      stageDefs.push({
        id: "reconciliation",
        step: {
          id: "reconciliation",
          label: "Reconciliation",
          icon: "○",
          iconClass: "text-zinc-500",
          state: "pending",
          lines: ["Pending", "Not yet reconciled"],
        },
      });
    } else {
      stageDefs.push({
        id: "reconciliation",
        step: {
          id: "reconciliation",
          label: "Reconciliation",
          icon: "—",
          iconClass: "text-zinc-400",
          state: "missing",
          lines: ["Not applicable", "Runs after execution"],
        },
      });
    }

    return stageDefs.map((d) => d.step);
  }, [
    primaryEvent,
    primaryPolicy,
    primaryReconciliation,
    primaryReceipt,
    dataSource?.dateKey,
    dataSource?.actions,
    hasReceiptForPrimary,
    executionOutcome,
  ]);

  const getLinkedReceipts = useCallback(
    (eventId: string) => {
      const actions = dataSource?.actions ?? [];
      const tid = dataSource?.traceId ?? "";
      return actions.filter((a) => {
        if (a.approvalId !== eventId) return false;
        if (a.traceId != null && a.traceId !== tid) return false;
        return true;
      });
    },
    [dataSource?.actions, dataSource?.traceId]
  );

  return (
    <div
      id="trace-timeline"
      className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h2 className="mb-3 text-lg font-semibold">Activity Timeline</h2>
      <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
        Reconstruct a trace end-to-end. Read-only. No automation. Open directly:{" "}
        <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">
          /activity?trace=&lt;traceId&gt;
        </code>
      </p>
      <div className="mb-3 rounded border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800/60">
        <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
            Recent traces
          </span>
          <span className="text-[10px] text-zinc-500 dark:text-zinc-450">
            Last {TRACE_SCAN_DAY_WINDOW} days
          </span>
        </div>
        {recentLoading ? (
          <p className="text-xs text-zinc-500">Loading…</p>
        ) : recentTraces.length === 0 ? (
          <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            No recent traces found. Create an action or open{" "}
            <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">
              /activity?trace=&lt;id&gt;
            </code>
            .
          </p>
        ) : (
          <>
            <ul className="max-h-44 space-y-0.5 overflow-y-auto">
              {recentTraces.map((row) => (
                <li key={row.traceId}>
                  <button
                    type="button"
                    onClick={() => openTraceDeepLink(row.traceId)}
                    className="w-full rounded border border-transparent px-1.5 py-1.5 text-left transition-colors hover:border-zinc-300 hover:bg-white dark:hover:border-zinc-600 dark:hover:bg-zinc-900"
                  >
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <code className="font-mono text-[11px] text-zinc-800 dark:text-zinc-200">
                        {row.traceId.length > 12
                          ? `${row.traceId.slice(0, 8)}…${row.traceId.slice(-4)}`
                          : row.traceId}
                      </code>
                      <span className="text-[10px] text-zinc-500">
                        {formatTime(row.lastActivityAt)}
                      </span>
                    </div>
                    {row.summary ? (
                      <div className="mt-0.5 truncate text-[11px] text-zinc-600 dark:text-zinc-400">
                        {row.summary}
                      </div>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[10px] text-zinc-500 dark:text-zinc-450">
              Showing traces from the last {TRACE_SCAN_DAY_WINDOW} days (events
              + receipts on disk).
            </p>
          </>
        )}
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div className="flex rounded border border-zinc-200 dark:border-zinc-700 p-0.5">
          <button
            type="button"
            onClick={() => setViewMode("live")}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              viewMode === "live"
                ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-600 dark:text-zinc-100"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            Live View
          </button>
          <button
            type="button"
            onClick={() => setViewMode("replay")}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              viewMode === "replay"
                ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-600 dark:text-zinc-100"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            Replay View
          </button>
        </div>
        <div className="flex flex-1 min-w-0 gap-2">
        <input
          type="text"
          placeholder="Paste traceId"
          value={traceId}
          onChange={(e) => setTraceId(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchTrace()}
          className="flex-1 rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
        />
        <button
          type="button"
          onClick={fetchTrace}
          disabled={loadingState || !traceId.trim()}
          className="rounded bg-zinc-200 px-4 py-2 text-sm font-medium hover:bg-zinc-300 disabled:opacity-50 dark:bg-zinc-700 dark:hover:bg-zinc-600"
        >
          {loadingState ? "Fetching…" : "Fetch"}
        </button>
        </div>
      </div>
      {errorState && (
        <div className="mb-3 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200">
          {errorState}
        </div>
      )}
      {dataSource && (
        <div className="space-y-4">
          {/* Trace control record — forensic identity block */}
          <div className="rounded border-2 border-zinc-300 bg-zinc-50 px-4 py-3 dark:border-zinc-600 dark:bg-zinc-800/80">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-450">
              Trace control record
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded border border-zinc-200 bg-white/60 px-2.5 py-2 dark:border-zinc-600 dark:bg-zinc-900/60">
                <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">Trace ID</div>
                <div className="mt-0.5 flex flex-wrap items-center gap-2">
                  <code className="font-mono text-sm text-zinc-800 dark:text-zinc-200">{dataSource.traceId}</code>
                  <button
                    type="button"
                    onClick={() => copy(dataSource.traceId)}
                    className="rounded border border-zinc-300 px-1.5 py-0.5 text-[10px] hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-700"
                  >
                    Copy ID
                  </button>
                  <button
                    type="button"
                    onClick={() => copyTraceDeepLink(dataSource.traceId)}
                    className="rounded border border-zinc-300 px-1.5 py-0.5 text-[10px] hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-700"
                  >
                    Copy link
                  </button>
                </div>
              </div>
              {actorSummary && (
                <div className="sm:col-span-2 lg:col-span-3 grid grid-cols-1 gap-2 border-t border-zinc-200 pt-2 dark:border-zinc-600 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded border border-zinc-200 bg-white/60 px-2.5 py-2 dark:border-zinc-600 dark:bg-zinc-900/60">
                    <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                      Coordinator
                    </div>
                    <div className="mt-0.5 text-xs text-zinc-800 dark:text-zinc-200">
                      {actorSummary.coordinator}
                    </div>
                  </div>
                  <div className="rounded border border-zinc-200 bg-white/60 px-2.5 py-2 dark:border-zinc-600 dark:bg-zinc-900/60">
                    <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                      Builder
                    </div>
                    <div className="mt-0.5 text-xs text-zinc-800 dark:text-zinc-200">
                      {actorSummary.builder}
                    </div>
                  </div>
                  <div className="rounded border border-zinc-200 bg-white/60 px-2.5 py-2 dark:border-zinc-600 dark:bg-zinc-900/60">
                    <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                      Provider
                    </div>
                    <div className="mt-0.5 text-xs text-zinc-800 dark:text-zinc-200">
                      {actorSummary.provider}
                    </div>
                  </div>
                  <div className="rounded border border-zinc-200 bg-white/60 px-2.5 py-2 dark:border-zinc-600 dark:bg-zinc-900/60">
                    <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                      Model
                    </div>
                    <div className="mt-0.5 truncate text-xs text-zinc-800 dark:text-zinc-200" title={actorSummary.model}>
                      {actorSummary.model}
                    </div>
                  </div>
                  <div className="rounded border border-zinc-200 bg-white/60 px-2.5 py-2 dark:border-zinc-600 dark:bg-zinc-900/60">
                    <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                      Approver
                    </div>
                    <div className="mt-0.5 text-xs text-zinc-800 dark:text-zinc-200">
                      {actorSummary.approver}
                    </div>
                  </div>
                  <div className="rounded border border-zinc-200 bg-white/60 px-2.5 py-2 dark:border-zinc-600 dark:bg-zinc-900/60">
                    <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                      Executor
                    </div>
                    <div className="mt-0.5 text-xs text-zinc-800 dark:text-zinc-200">
                      {actorSummary.executor}
                    </div>
                  </div>
                </div>
              )}
              {primaryEvent?.correlationId && (
                <div className="rounded border border-zinc-200 bg-white/60 px-2.5 py-2 dark:border-zinc-600 dark:bg-zinc-900/60">
                  <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">Correlation ID</div>
                  <code className="mt-0.5 block truncate font-mono text-xs text-zinc-700 dark:text-zinc-300">{primaryEvent.correlationId}</code>
                </div>
              )}
              {primaryEvent?.source?.connector && (
                <div className="rounded border border-zinc-200 bg-white/60 px-2.5 py-2 dark:border-zinc-600 dark:bg-zinc-900/60">
                  <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">Connector</div>
                  <div className="mt-0.5 text-sm text-zinc-700 dark:text-zinc-300">
                    {primaryEvent.source.connector}
                    {primaryEvent.source.verified && <span className="ml-1 text-emerald-600 dark:text-emerald-400">verified</span>}
                  </div>
                </div>
              )}
              {primaryEvent?.source?.requestId && (
                <div className="rounded border border-zinc-200 bg-white/60 px-2.5 py-2 dark:border-zinc-600 dark:bg-zinc-900/60">
                  <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">Request ID</div>
                  <code className="mt-0.5 block truncate font-mono text-xs text-zinc-700 dark:text-zinc-300">{primaryEvent.source.requestId}</code>
                </div>
              )}
              {primaryEvent?.source?.sessionId && (
                <div className="rounded border border-zinc-200 bg-white/60 px-2.5 py-2 dark:border-zinc-600 dark:bg-zinc-900/60">
                  <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">Session ID</div>
                  <code className="mt-0.5 block truncate font-mono text-xs text-zinc-700 dark:text-zinc-300">{primaryEvent.source.sessionId}</code>
                </div>
              )}
              <div className="rounded border border-zinc-200 bg-white/60 px-2.5 py-2 dark:border-zinc-600 dark:bg-zinc-900/60">
                <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">Date · Proposed</div>
                <div className="mt-0.5 text-xs text-zinc-700 dark:text-zinc-300">
                  {dataSource.dateKey}
                  {primaryEvent?.proposedAt && ` · ${formatTime(primaryEvent.proposedAt)}`}
                </div>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={copyTraceSummary}
                className="rounded border border-zinc-300 px-2 py-1 text-[10px] hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-700"
              >
                Copy trace summary
              </button>
            </div>
          </div>

          {/* Legacy identity block - remove duplicated content; trace header is now above */}
          <div className="hidden rounded border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800">
            <div className="flex flex-wrap items-center gap-3 border-b border-zinc-200 pb-3 dark:border-zinc-700">
              <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                Trace ID
              </span>
              <code className="text-sm font-mono text-zinc-800 dark:text-zinc-200">{dataSource.traceId}</code>
              <button
                type="button"
                onClick={() => copy(dataSource.traceId)}
                className="rounded border border-zinc-300 px-2 py-0.5 text-xs hover:bg-zinc-200 dark:border-zinc-600 dark:hover:bg-zinc-700"
              >
                Copy
              </button>
              <span className="text-xs text-zinc-500">{dataSource.dateKey}</span>
              <button
                type="button"
                onClick={copyTraceSummary}
                className="ml-auto rounded border border-zinc-300 px-2 py-0.5 text-xs hover:bg-zinc-200 dark:border-zinc-600 dark:hover:bg-zinc-700"
              >
                Copy Trace Summary
              </button>
            </div>
            {(primaryEvent?.correlationId ||
              primaryEvent?.source?.connector ||
              primaryEvent?.source?.requestId) && (
              <div className="mt-3 grid gap-x-6 gap-y-1.5 text-xs sm:grid-cols-2 lg:grid-cols-4">
                {primaryEvent?.correlationId && (
                  <div>
                    <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                      Correlation ID
                    </div>
                    <code className="font-mono text-zinc-700 dark:text-zinc-300">
                      {primaryEvent.correlationId}
                    </code>
                  </div>
                )}
                {primaryEvent?.source?.connector && (
                  <div>
                    <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                      Connector
                    </div>
                    <span className="text-zinc-700 dark:text-zinc-300">{primaryEvent.source.connector}</span>
                    {primaryEvent.source.verified && (
                      <span className="ml-1 text-emerald-600 dark:text-emerald-400">(verified)</span>
                    )}
                  </div>
                )}
                {primaryEvent?.source?.requestId && (
                  <div>
                    <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                      Request ID
                    </div>
                    <code className="font-mono text-zinc-700 dark:text-zinc-300">
                      {primaryEvent.source.requestId}
                    </code>
                  </div>
                )}
                {primaryEvent?.source?.sessionId && (
                  <div>
                    <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                      Session ID
                    </div>
                    <code className="font-mono text-zinc-700 dark:text-zinc-300">
                      {primaryEvent.source.sessionId}
                    </code>
                  </div>
                )}
              </div>
            )}
            {primaryEvent?.proposedAt && (
              <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                Proposed at: {formatTime(primaryEvent.proposedAt)}
              </div>
            )}
          </div>

          {/* Trace health header */}
          {primaryEvent?.recovery && (
            <div className="rounded border border-amber-600/40 bg-amber-50/30 px-4 py-3 dark:border-amber-500/30 dark:bg-amber-950/20">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-400">
                  Recovery summary
                </span>
                {primaryReceipt && (
                  <>
                    {(primaryReceipt as { verificationStatus?: string }).verificationStatus === "verified" && (
                      <span className="rounded border border-emerald-600/60 bg-emerald-100/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-800 dark:border-emerald-500/50 dark:bg-emerald-950/40 dark:text-emerald-400">
                        Verified
                      </span>
                    )}
                    {(primaryReceipt as { verificationStatus?: string }).verificationStatus === "failed" && (
                      <span className="rounded border border-red-600/60 bg-red-100/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-red-800 dark:border-red-500/50 dark:bg-red-950/40 dark:text-red-400">
                        Failed
                      </span>
                    )}
                    {((primaryReceipt as { verificationStatus?: string }).verificationStatus === "pending" ||
                      !(primaryReceipt as { verificationStatus?: string }).verificationStatus) && (
                      <span className="rounded border border-amber-600/40 bg-amber-100/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-800 dark:border-amber-500/40 dark:bg-amber-950/30 dark:text-amber-400">
                        Pending
                      </span>
                    )}
                  </>
                )}
              </div>
              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="font-medium text-zinc-500">Class</dt>
                  <dd className="font-mono text-xs text-zinc-800 dark:text-zinc-200">{primaryEvent.recovery.class}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="font-medium text-zinc-500">Symptom</dt>
                  <dd className="text-zinc-800 dark:text-zinc-200">{primaryEvent.recovery.symptom || "—"}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="font-medium text-zinc-500">Verification</dt>
                  <dd className="text-zinc-800 dark:text-zinc-200">{primaryEvent.recovery.verificationCheck || "—"}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="font-medium text-zinc-500">Fallback</dt>
                  <dd className="text-zinc-800 dark:text-zinc-200">{primaryEvent.recovery.fallbackIfFailed || "—"}</dd>
                </div>
                {primaryReceipt && (
                  <div className="sm:col-span-2">
                    <dt className="font-medium text-zinc-500">Outcome</dt>
                    <dd className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                          (primaryReceipt as TraceAction).verificationStatus === "verified"
                            ? "border-emerald-600/60 bg-emerald-100/80 text-emerald-800 dark:border-emerald-500/50 dark:bg-emerald-950/40 dark:text-emerald-400"
                            : (primaryReceipt as TraceAction).verificationStatus === "failed"
                              ? "border-red-600/60 bg-red-100/80 text-red-800 dark:border-red-500/50 dark:bg-red-950/40 dark:text-red-400"
                              : "border-amber-600/40 bg-amber-100/60 text-amber-800 dark:border-amber-500/40 dark:bg-amber-950/30 dark:text-amber-400"
                        }`}
                      >
                        {(primaryReceipt as TraceAction).verificationStatus ?? "pending"}
                      </span>
                      {((primaryReceipt as TraceAction).verificationStatus ?? "pending") === "pending" &&
                        primaryEvent?.id && (
                          <>
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  const res = await fetch("/api/recovery/verify", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ approvalId: primaryEvent.id, status: "verified" }),
                                  });
                                  if (res.ok) {
                                    const out = await doFetch(dataSource!.traceId, viewMode);
                                    if (out.data) setData(out.data);
                                    window.dispatchEvent(new CustomEvent("jarvis-refresh"));
                                  }
                                } catch {
                                  /* ignore */
                                }
                              }}
                              className="rounded border border-emerald-600 px-2 py-0.5 text-xs text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-900/30"
                            >
                              Mark verified
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  const res = await fetch("/api/recovery/verify", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ approvalId: primaryEvent.id, status: "failed" }),
                                  });
                                  if (res.ok) {
                                    const out = await doFetch(dataSource!.traceId, viewMode);
                                    if (out.data) setData(out.data);
                                    window.dispatchEvent(new CustomEvent("jarvis-refresh"));
                                  }
                                } catch {
                                  /* ignore */
                                }
                              }}
                              className="rounded border border-red-600 px-2 py-0.5 text-xs text-red-700 hover:bg-red-50 dark:border-red-500 dark:text-red-400 dark:hover:bg-red-900/30"
                            >
                              Mark failed
                            </button>
                          </>
                        )}
                    </dd>
                  </div>
                )}
              </dl>
              {primaryReceipt && (primaryReceipt.outputPath ?? primaryReceipt.artifactPath) && (
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-amber-600/30 pt-2 dark:border-amber-500/20">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">Runbook:</span>
                  <code className="flex-1 min-w-0 truncate rounded bg-zinc-100 px-2 py-1 text-xs dark:bg-zinc-800">
                    {primaryReceipt.outputPath ?? primaryReceipt.artifactPath}
                  </code>
                  <button
                    type="button"
                    onClick={() => copy(primaryReceipt?.outputPath ?? primaryReceipt?.artifactPath ?? "")}
                    className="rounded border border-zinc-300 px-2 py-0.5 text-xs hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-700"
                  >
                    Copy
                  </button>
                  <button
                    type="button"
                    onClick={() => openPath(primaryReceipt.outputPath ?? primaryReceipt.artifactPath ?? "", "finder")}
                    className="rounded border border-zinc-300 px-2 py-0.5 text-xs hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-700"
                  >
                    Finder
                  </button>
                </div>
              )}
            </div>
          )}

          {decisionReplayLine && (
            <div className="rounded border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900/40">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                Decision replay
              </div>
              <p className="mt-1 text-xs leading-relaxed text-zinc-800 dark:text-zinc-200">
                {decisionReplayLine}
              </p>
            </div>
          )}

          {dataSource ? (
            <ApprovalTimePreflightSnapshotSection
              snapshot={dataSource.approvalPreflightSnapshot ?? null}
              loading={false}
            />
          ) : null}

          {executionOutcome && (
            <div
              className={
                executionOutcome.status === "completed"
                  ? "rounded border border-emerald-200 border-l-4 border-l-emerald-600 bg-emerald-50/90 px-3 py-2 dark:border-emerald-900/50 dark:border-l-emerald-500 dark:bg-emerald-950/35"
                  : executionOutcome.status === "failed"
                    ? "rounded border border-red-200 border-l-4 border-l-red-700 bg-red-50/95 px-3 py-2 dark:border-red-900/50 dark:border-l-red-500 dark:bg-red-950/40"
                    : executionOutcome.status === "blocked"
                      ? "rounded border border-amber-200 border-l-4 border-l-amber-600 bg-amber-50/95 px-3 py-2 dark:border-amber-900/50 dark:border-l-amber-500 dark:bg-amber-950/35"
                      : executionOutcome.status === "pending"
                        ? "rounded border border-amber-200 border-l-4 border-l-amber-500 bg-amber-50/70 px-3 py-2 dark:border-amber-900/40 dark:border-l-amber-500 dark:bg-amber-950/25"
                        : "rounded border border-zinc-200 border-l-4 border-l-zinc-500 bg-zinc-100/90 px-3 py-2 dark:border-zinc-700 dark:border-l-zinc-500 dark:bg-zinc-900/50"
              }
            >
              <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400">
                Execution truth · {executionOutcome.status} · {executionOutcome.stage}
              </div>
              <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {executionOutcome.headline}
              </p>
              <p className="mt-1 font-mono text-xs leading-snug text-zinc-800 dark:text-zinc-200">
                {executionOutcome.reason}
              </p>
              {executionOutcome.reasonCode ? (
                <p className="mt-1 text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                  Reason code: <span className="font-mono">{executionOutcome.reasonCode}</span>
                </p>
              ) : null}
              <p className="mt-1 text-[11px] text-zinc-600 dark:text-zinc-400">
                {executionOutcome.transitionLine}
              </p>
            </div>
          )}

          {endToEndSequence && (
            <div className="rounded border border-zinc-200 bg-zinc-50/90 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800/50">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                Lifecycle (chronological)
              </div>
              <p className="mt-1 text-xs leading-relaxed text-zinc-800 dark:text-zinc-200">
                {endToEndSequence}
              </p>
            </div>
          )}

          {traceHealth && (
            <div className="flex flex-wrap gap-3 rounded border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Status: <span className="font-semibold text-zinc-800 dark:text-zinc-200">{traceHealth.status}</span>
              </span>
              <span className="min-w-0 max-w-full flex-[1_1_14rem] text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Policy: <span className="font-semibold text-zinc-800 dark:text-zinc-200">{traceHealth.policy}</span>
                {primaryPolicy ? policyHealthSecondaryLine(primaryPolicy, traceHealth.status) : null}
              </span>
              <span className="min-w-0 max-w-full flex-[1_1_16rem] text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Execution: <span className="font-semibold text-zinc-800 dark:text-zinc-200">{traceHealth.execution}</span>
                <span className="mt-0.5 block font-mono text-[11px] font-normal text-zinc-700 dark:text-zinc-300">
                  {traceHealth.executionReason}
                </span>
              </span>
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Reconciliation: <span className="font-semibold text-zinc-800 dark:text-zinc-200">{traceHealth.reconciliation}</span>
              </span>
            </div>
          )}

          {/* Control-plane lifecycle — all 6 stages, missing/pending surfaced */}
          {lifecycleSteps.length > 0 && (
            <div>
              <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                Control-plane detail
              </h3>
              <p className="mb-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                Proposal → approval → policy → execution → receipt → reconciliation
              </p>
              <div className="space-y-0 rounded border border-zinc-300 dark:border-zinc-600 overflow-hidden">
                {lifecycleSteps.map((step, idx) => {
                  const state = (step as { state?: "done" | "missing" | "pending" }).state ?? "done";
                  const rowAccent = (step as { rowAccent?: string }).rowAccent;
                  const rowBg =
                    rowAccent === "success"
                      ? "border-l-4 border-l-emerald-600 bg-emerald-50/50 dark:border-l-emerald-500 dark:bg-emerald-950/25"
                      : rowAccent === "policy-block"
                        ? "border-l-4 border-l-amber-600 bg-amber-50/60 dark:border-l-amber-500 dark:bg-amber-950/30"
                        : rowAccent === "failed"
                          ? "border-l-4 border-l-red-700 bg-red-50/70 dark:border-l-red-500 dark:bg-red-950/35"
                          : rowAccent === "pending"
                            ? "border-l-4 border-l-amber-500 bg-amber-50/40 dark:border-l-amber-500 dark:bg-amber-950/20"
                            : rowAccent === "neutral"
                              ? "border-l-4 border-l-zinc-500 bg-zinc-100/50 dark:border-l-zinc-500 dark:bg-zinc-900/35"
                              : state === "missing"
                                ? "bg-zinc-100/60 dark:bg-zinc-800/40"
                                : state === "pending"
                                  ? "bg-amber-50/30 dark:bg-amber-950/20"
                                  : "";
                  return (
                    <div
                      key={step.id}
                      className={`flex gap-3 px-3 py-2.5 ${rowBg} ${
                        idx < lifecycleSteps.length - 1
                          ? "border-b border-zinc-200 dark:border-zinc-700"
                          : ""
                      }`}
                    >
                      <div className={`flex h-5 w-5 shrink-0 items-center justify-center text-sm ${step.iconClass}`}>
                        {step.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                          {step.label}
                        </div>
                        <div className="mt-0.5 space-y-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                          {step.lines.map((line, i) => (
                            <div key={i}>{line}</div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Policy decisions from log — one or more (single decision must still show reason) */}
          {(dataSource.policyDecisions?.length ?? 0) >= 1 && (
            <div className="rounded border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800">
              <h3 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Policy {dataSource.policyDecisions!.length === 1 ? "decision" : "decisions"}
              </h3>
              <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
                Why execution was allowed or blocked (same text as policy log)
              </p>
              <div className="space-y-2">
                {dataSource.policyDecisions!.map((pd, i) => (
                  <div
                    key={`${pd.timestamp}-${i}`}
                    className="flex flex-wrap items-center gap-2 rounded border border-zinc-200 bg-white p-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                  >
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${
                        pd.decision === "allow"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                          : "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                      }`}
                    >
                      {pd.decision}
                    </span>
                    <span className="font-mono text-xs text-zinc-600 dark:text-zinc-400">
                      {pd.rule}
                    </span>
                    <span className="text-zinc-500 dark:text-zinc-400">{pd.reason}</span>
                    <span className="ml-auto text-xs text-zinc-400">
                      {formatTime(pd.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline */}
          <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
            Timeline
          </h3>
          <div className="relative">
            {sortedEvents.map((event, idx) => {
              const isExpanded = expandedIds.has(event.id);
              const linkedReceipts = getLinkedReceipts(event.id);
              const lifecycle = normalizeProposalLifecycle(event as ProposalLifecycleEvent);
              const displayStatus = event.proposalStatus ?? event.status;
              const { badge, dot } = statusStyles(displayStatus);
              const isLast = idx === sortedEvents.length - 1;
              const eventLifecycleSteps = formatEventLifecycle(lifecycle);

              return (
                <div key={event.id} className="relative flex gap-3">
                  {/* Vertical line + dot */}
                  <div className="flex w-4 shrink-0 flex-col items-center">
                    <div
                      className={`mt-2.5 h-2 w-2 shrink-0 rounded-full ${dot}`}
                      aria-hidden
                    />
                    {!isLast && (
                      <div
                        className="mt-0.5 min-h-[2rem] flex-1 w-px bg-zinc-300 dark:bg-zinc-600"
                        aria-hidden
                      />
                    )}
                  </div>

                  {/* Event content */}
                  <div className="min-w-0 flex-1 pb-4">
                    <button
                      type="button"
                      onClick={() => toggleExpand(event.id)}
                      className="w-full rounded border border-zinc-200 bg-zinc-50 p-3 text-left hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-750"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-medium ${badge}`}
                        >
                          {lifecycle.proposalStatus}
                        </span>
                        <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                          {event.kind}
                        </span>
                        {event.source?.connector && (
                          <span
                            className="rounded border border-zinc-400 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:border-zinc-500 dark:text-zinc-400"
                            title="Source connector"
                          >
                            {event.source.connector}
                            {event.source.verified ? " (verified)" : ""}
                          </span>
                        )}
                        <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                          {event.title ?? event.summary ?? "(untitled)"}
                        </span>
                        <span className="ml-auto text-zinc-400">
                          {isExpanded ? "▼" : "▶"}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                        <span>Created {formatTime(event.createdAt)}</span>
                        {event.executedAt && (
                          <span>Executed {formatTime(event.executedAt)}</span>
                        )}
                        <span title={event.id}>
                          {event.id.slice(0, 8)}…
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            copy(event.id);
                          }}
                          className="rounded border px-1.5 py-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                        >
                          Copy approvalId
                        </button>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="mt-2 ml-1 space-y-3 border-l-2 border-zinc-200 pl-4 dark:border-zinc-700">
                        {eventLifecycleSteps !== "pending_approval" && (
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            Lifecycle: {eventLifecycleSteps}
                          </p>
                        )}
                        {lifecycle.proposalStatus === "executed" && linkedReceipts.length === 0 && (
                          <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            No receipts found for this execution.
                          </p>
                        )}
                        {linkedReceipts.map((receipt) => (
                          <div
                            key={receipt.id}
                            className="rounded border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-medium text-zinc-600 dark:text-zinc-400">
                                {receipt.kind}
                              </span>
                              <span className="text-zinc-500">·</span>
                              <span>{receipt.status}</span>
                              <span className="text-zinc-500">·</span>
                              <span className="text-xs text-zinc-500">
                                {formatTime(receipt.at)}
                              </span>
                            </div>
                            <div className="mt-2">
                              <span className="text-xs text-zinc-500">Path:</span>
                              <div className="mt-0.5 flex flex-wrap items-center gap-1">
                                <code className="flex-1 truncate rounded bg-zinc-100 px-2 py-1 text-xs dark:bg-zinc-700">
                                  {receipt.outputPath ?? receipt.artifactPath ?? "—"}
                                </code>
                                <button
                                  type="button"
                                  onClick={() =>
                                    copy(receipt.outputPath ?? receipt.artifactPath ?? "")
                                  }
                                  className="rounded border border-zinc-300 px-2 py-0.5 text-xs hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
                                >
                                  Copy
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    openPath(
                                      receipt.outputPath ?? receipt.artifactPath ?? "",
                                      "finder"
                                    )
                                  }
                                  disabled={!receipt.outputPath && !receipt.artifactPath}
                                  className="rounded border border-zinc-300 px-2 py-0.5 text-xs hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
                                >
                                  Finder
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    openPath(
                                      receipt.outputPath ?? receipt.artifactPath ?? "",
                                      "cursor"
                                    )
                                  }
                                  disabled={!receipt.outputPath && !receipt.artifactPath}
                                  className="rounded border border-zinc-300 px-2 py-0.5 text-xs hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
                                >
                                  Cursor
                                </button>
                              </div>
                            </div>
                            {receipt.kind === "code.apply" && (
                              <div className="mt-3 space-y-2 border-t border-zinc-200 pt-2 dark:border-zinc-700">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-zinc-500">Commit:</span>
                                  <code className="text-xs">
                                    {receipt.commitHash ?? "—"}
                                  </code>
                                  {receipt.commitHash && (
                                    <button
                                      type="button"
                                      onClick={() => copy(receipt.commitHash ?? "")}
                                      className="rounded border px-1.5 py-0.5 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-700"
                                    >
                                      Copy
                                    </button>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-zinc-500">Rollback:</span>
                                  <code className="text-xs">
                                    {receipt.rollbackCommand ?? "—"}
                                  </code>
                                  {receipt.rollbackCommand && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        copy(receipt.rollbackCommand ?? "")
                                      }
                                      className="rounded border px-1.5 py-0.5 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-700"
                                    >
                                      Copy
                                    </button>
                                  )}
                                </div>
                                {(receipt.repoHeadBefore || receipt.repoHeadAfter) && (
                                  <p className="text-xs text-zinc-500">
                                    Head: {receipt.repoHeadBefore ?? "—"} →{" "}
                                    {receipt.repoHeadAfter ?? "—"}
                                  </p>
                                )}
                                {(receipt.statsText || receipt.statsJson) && (
                                  <div>
                                    {receipt.statsJson && (
                                      <p className="text-xs text-zinc-600 dark:text-zinc-400">
                                        {formatStatsJson(receipt.statsJson)}
                                      </p>
                                    )}
                                    {receipt.statsText && (
                                      <details className="mt-1">
                                        <summary className="cursor-pointer text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-400">
                                          Full stats
                                        </summary>
                                        <pre className="mt-1 max-h-24 overflow-y-auto rounded bg-zinc-100 p-2 text-xs dark:bg-zinc-700">
                                          {receipt.statsText}
                                        </pre>
                                      </details>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
