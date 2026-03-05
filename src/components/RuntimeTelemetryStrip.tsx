"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type Telemetry = {
  pendingCount: number;
  executionsToday: number;
  agentStatus: "ACTIVE" | "IDLE";
  lastTraceId: string | null;
};

type HighlightKey = "pendingCount" | "executionsToday" | "agentStatus" | "lastTraceId";

export default function RuntimeTelemetryStrip() {
  const [data, setData] = useState<Telemetry | null>(null);
  const [highlightedFields, setHighlightedFields] = useState<Set<HighlightKey>>(new Set());
  const [copied, setCopied] = useState(false);
  const prevDataRef = useRef<Telemetry | null>(null);
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchTelemetry = useCallback(async () => {
    try {
      const [pendingRes, approvedRes, actionsRes] = await Promise.all([
        fetch("/api/approvals?status=pending"),
        fetch("/api/approvals?status=approved"),
        fetch("/api/actions"),
      ]);
      const pending = (await pendingRes.json()).approvals ?? [];
      const approved = (await approvedRes.json()).approvals ?? [];
      const actions = (await actionsRes.json()).actions ?? [];

      const pendingCount = pending.length;
      const executionsToday = actions.length;

      const itemsWithTrace: { traceId: string; at: number }[] = [];
      for (const e of pending as { traceId?: string; id?: string; createdAt?: string }[]) {
        const tid = e.traceId ?? e.id;
        const at = e.createdAt ? new Date(e.createdAt).getTime() : 0;
        if (tid) itemsWithTrace.push({ traceId: tid, at });
      }
      for (const e of approved as { traceId?: string; id?: string; createdAt?: string; executedAt?: string }[]) {
        const tid = e.traceId ?? e.id;
        const at = (e.executedAt ?? e.createdAt)
          ? new Date(e.executedAt ?? e.createdAt ?? 0).getTime()
          : 0;
        if (tid) itemsWithTrace.push({ traceId: tid, at });
      }
      for (const a of actions as { traceId?: string; at?: string }[]) {
        const tid = a.traceId ?? "";
        const at = a.at ? new Date(a.at).getTime() : 0;
        if (tid) itemsWithTrace.push({ traceId: tid, at });
      }
      const latest = [...itemsWithTrace].sort((a, b) => b.at - a.at)[0];
      const lastTraceId = latest?.traceId ?? null;

      const lastActivityAt =
        itemsWithTrace.length > 0 ? Math.max(...itemsWithTrace.map((i) => i.at)) : 0;
      const minutesSinceActivity =
        lastActivityAt > 0 ? (Date.now() - lastActivityAt) / 60_000 : 999;
      const agentStatus =
        pendingCount > 0 || minutesSinceActivity < 30 ? "ACTIVE" : "IDLE";

      const newData: Telemetry = {
        pendingCount,
        executionsToday,
        agentStatus,
        lastTraceId,
      };

      const prev = prevDataRef.current;
      const changed: HighlightKey[] = [];
      if (prev) {
        if (prev.pendingCount !== newData.pendingCount) changed.push("pendingCount");
        if (prev.executionsToday !== newData.executionsToday) changed.push("executionsToday");
        if (prev.agentStatus !== newData.agentStatus) changed.push("agentStatus");
        if (prev.lastTraceId !== newData.lastTraceId) changed.push("lastTraceId");
      }
      prevDataRef.current = newData;
      setData(newData);

      if (changed.length > 0) {
        if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
        setHighlightedFields(new Set(changed));
        highlightTimeoutRef.current = setTimeout(() => {
          setHighlightedFields(new Set());
          highlightTimeoutRef.current = null;
        }, 800);
      }
    } catch {
      setData(null);
    }
  }, []);

  useEffect(() => {
    fetchTelemetry();
    const id = setInterval(fetchTelemetry, 5000);
    return () => clearInterval(id);
  }, [fetchTelemetry]);

  useEffect(() => {
    const handler = () => fetchTelemetry();
    globalThis.addEventListener("jarvis-refresh", handler);
    return () => globalThis.removeEventListener("jarvis-refresh", handler);
  }, [fetchTelemetry]);

  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
    };
  }, []);

  const handleCopyTrace = useCallback((traceId: string) => {
    if (!traceId) return;
    navigator.clipboard.writeText(traceId);
    if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
    setCopied(true);
    copiedTimeoutRef.current = setTimeout(() => {
      setCopied(false);
      copiedTimeoutRef.current = null;
    }, 1000);
  }, []);

  if (!data) {
    return (
      <div className="border-b border-zinc-800 bg-zinc-950 px-4 py-2">
        <div className="mx-auto flex max-w-2xl gap-4 text-xs tracking-wide text-zinc-400">
          <span>Loading…</span>
        </div>
      </div>
    );
  }

  const traceShort = data.lastTraceId
    ? data.lastTraceId.slice(0, 8)
    : "—";

  const highlightClass = "rounded border border-zinc-700 bg-zinc-900/50 px-1.5 py-0.5 transition-colors";

  return (
    <div className="border-b border-zinc-800 bg-zinc-950 px-4 py-2">
      <div className="mx-auto flex max-w-2xl flex-wrap items-center gap-4 text-xs tracking-wide text-zinc-400">
        <span className={highlightedFields.has("pendingCount") ? highlightClass : ""}>
          Pending: <span className="font-medium text-zinc-300">{data.pendingCount}</span>
        </span>
        <span className={highlightedFields.has("executionsToday") ? highlightClass : ""}>
          Executions today:{" "}
          <span className="font-medium text-zinc-300">{data.executionsToday}</span>
        </span>
        <span
          className={`flex items-center gap-1.5 ${highlightedFields.has("agentStatus") ? highlightClass : ""}`}
        >
          Agent:{" "}
          <span
            className={`font-medium ${
              data.agentStatus === "ACTIVE"
                ? "text-emerald-400"
                : "text-zinc-500"
            }`}
          >
            {data.agentStatus}
          </span>
        </span>
        <span
          className={`flex items-center gap-1 ${highlightedFields.has("lastTraceId") ? highlightClass : ""}`}
        >
          Last trace:{" "}
          {data.lastTraceId ? (
            <>
              <Link
                href={`/?trace=${encodeURIComponent(data.lastTraceId)}`}
                className="font-mono text-zinc-300 underline hover:text-zinc-200"
              >
                {traceShort}
              </Link>
              <button
                type="button"
                onClick={() => handleCopyTrace(data.lastTraceId!)}
                className="relative rounded border border-zinc-600 px-1.5 py-0.5 text-[10px] hover:bg-zinc-800"
                title="Copy trace ID"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </>
          ) : (
            <span className="font-mono text-zinc-500">—</span>
          )}
        </span>
      </div>
    </div>
  );
}
