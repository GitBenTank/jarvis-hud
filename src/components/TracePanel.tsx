"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  normalizeProposalLifecycle,
  type ProposalLifecycleEvent,
} from "@/lib/proposal-lifecycle";

type TraceEvent = {
  id: string;
  traceId?: string;
  kind: string;
  status: string;
  createdAt: string;
  executedAt?: string;
  executed?: boolean;
  summary?: string;
  title?: string;
  source?: { connector: string; verified?: boolean };
  proposalStatus?: string;
  approvedAt?: string;
  rejectedAt?: string;
  failedAt?: string;
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
  commitHash?: string | null;
  rollbackCommand?: string | null;
  statsText?: string | null;
  statsJson?: { filesChangedCount: number; insertions: number; deletions: number } | null;
  repoHeadBefore?: string | null;
  repoHeadAfter?: string | null;
};

type TraceResponse = {
  traceId: string;
  dateKey: string;
  events: TraceEvent[];
  actions: TraceAction[];
  artifactPaths: string[];
};

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

function buildLifecycleSteps(lifecycle: {
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

export default function TracePanel() {
  const searchParams = useSearchParams();
  const traceFromUrl = searchParams.get("trace")?.trim() ?? "";
  const [traceId, setTraceId] = useState("");
  const [data, setData] = useState<TraceResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (traceFromUrl) {
      setTraceId(traceFromUrl);
      setLoading(true);
      setError(null);
      setData(null);
      setExpandedIds(new Set());
      fetch(`/api/traces/${encodeURIComponent(traceFromUrl)}`)
        .then((res) => res.json())
        .then((json) => {
          if (json.error) {
            setError(json.error ?? "Trace not found");
            return;
          }
          const d = json as TraceResponse;
          setData(d);
          const events = d.events ?? [];
          const lastId = events.length > 0 ? events.at(-1)!.id : null;
          if (lastId) setExpandedIds(new Set([lastId]));
        })
        .catch(() => setError("Failed to fetch trace"))
        .finally(() => setLoading(false));
      document.getElementById("trace-timeline")?.scrollIntoView({ behavior: "smooth" });
    }
  }, [traceFromUrl]);

  const copy = useCallback((text: string) => {
    if (text && text !== "—") navigator.clipboard.writeText(text);
  }, []);

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
      const res = await fetch(`/api/traces/${encodeURIComponent(tid)}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? `Request failed (${res.status})`);
        return;
      }
      const d = json as TraceResponse;
      setData(d);
      const events = d.events ?? [];
      const lastId = events.length > 0 ? events.at(-1)!.id : null;
      if (lastId) setExpandedIds(new Set([lastId]));
    } catch {
      setError("Failed to fetch trace");
    } finally {
      setLoading(false);
    }
  }, [traceId]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const copyTraceSummary = useCallback(() => {
    if (!data) return;
    const eventLines = (data.events ?? []).map(
      (e) => `- ${e.status} | ${e.kind} | ${e.title ?? e.summary ?? "(untitled)"}`
    );
    const codeApplyActions = (data.actions ?? []).filter((a) => a.kind === "code.apply");
    const receiptLines = codeApplyActions.flatMap((a) => [
      `- commit: ${a.commitHash ?? "—"}`,
      `  rollback: ${a.rollbackCommand ?? "—"}`,
    ]);
    const pathLines = data.artifactPaths ?? [];
    const lines = [
      `traceId: ${data.traceId}`,
      `dateKey: ${data.dateKey}`,
      "",
      "## Events",
      ...eventLines,
      ...(receiptLines.length > 0 ? ["", "## code.apply receipts", ...receiptLines] : []),
      ...(pathLines.length > 0 ? ["", "## Artifact paths", ...pathLines] : []),
    ];
    copy(lines.join("\n"));
  }, [data, copy]);

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
    const ev = data?.events ?? [];
    return [...ev].sort((a, b) => {
      const ta = a.executedAt ?? a.createdAt ?? "";
      const tb = b.executedAt ?? b.createdAt ?? "";
      return ta.localeCompare(tb) || a.createdAt.localeCompare(b.createdAt);
    });
  }, [data?.events]);

  const getLinkedReceipts = useCallback(
    (eventId: string) => {
      const actions = data?.actions ?? [];
      const tid = data?.traceId ?? "";
      return actions.filter((a) => {
        if (a.approvalId !== eventId) return false;
        if (a.traceId != null && a.traceId !== tid) return false;
        return true;
      });
    },
    [data?.actions, data?.traceId]
  );

  return (
    <div
      id="trace-timeline"
      className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h2 className="mb-3 text-lg font-semibold">Activity Timeline</h2>
      <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
        Reconstruct a trace end-to-end. Read-only. No automation.
      </p>
      <div className="mb-3 flex gap-2">
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
          disabled={loading || !traceId.trim()}
          className="rounded bg-zinc-200 px-4 py-2 text-sm font-medium hover:bg-zinc-300 disabled:opacity-50 dark:bg-zinc-700 dark:hover:bg-zinc-600"
        >
          {loading ? "Fetching…" : "Fetch"}
        </button>
      </div>
      {error && (
        <div className="mb-3 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200">
          {error}
        </div>
      )}
      {data && (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 pb-3 dark:border-zinc-700">
            <code className="text-sm font-mono text-zinc-700 dark:text-zinc-300">
              {data.traceId}
            </code>
            <button
              type="button"
              onClick={() => copy(data.traceId)}
              className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
            >
              Copy
            </button>
            <span className="text-xs text-zinc-500">{data.dateKey}</span>
            <button
              type="button"
              onClick={copyTraceSummary}
              className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
            >
              Copy Trace Summary
            </button>
          </div>

          {/* Timeline */}
          <div className="relative">
            {sortedEvents.map((event, idx) => {
              const isExpanded = expandedIds.has(event.id);
              const linkedReceipts = getLinkedReceipts(event.id);
              const lifecycle = normalizeProposalLifecycle(event as ProposalLifecycleEvent);
              const displayStatus = event.proposalStatus ?? event.status;
              const { badge, dot } = statusStyles(displayStatus);
              const isLast = idx === sortedEvents.length - 1;
              const lifecycleSteps = buildLifecycleSteps(lifecycle);

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
                        {lifecycleSteps !== "pending_approval" && (
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            Lifecycle: {lifecycleSteps}
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
