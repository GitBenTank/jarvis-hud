"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type StatusStripData = {
  dateKey: string;
  pendingCount: number;
  approvedReadyCount: number;
  actionsCount: number;
  lastProposalAt: string | null;
  lastTraceId: string | null;
  agentStatus: "ACTIVE" | "IDLE";
};

function formatTimeAgo(ts: string): string {
  try {
    const then = new Date(ts).getTime();
    const now = Date.now();
    const sec = Math.floor((now - then) / 1000);
    if (sec < 5) return "just now";
    if (sec < 60) return `${sec}s ago`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    return `${hr}h ago`;
  } catch {
    return "—";
  }
}

export default function StatusStrip() {
  const [data, setData] = useState<StatusStripData | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const [pendingRes, approvedRes, actionsRes] = await Promise.all([
        fetch("/api/approvals?status=pending"),
        fetch("/api/approvals?status=approved"),
        fetch("/api/actions"),
      ]);
      const pendingJson = await pendingRes.json();
      const approvedJson = await approvedRes.json();
      const actionsJson = await actionsRes.json();

      const pending = pendingJson.approvals ?? [];
      const approved = approvedJson.approvals ?? [];
      const actions = actionsJson.actions ?? [];
      const dateKey = pendingJson.dateKey ?? approvedJson.dateKey ?? actionsJson.dateKey ?? "-";

      const approvedReady = approved.filter(
        (e: { executed?: boolean }) => !e.executed
      ).length;

      const allItems = [...pending, ...approved] as { createdAt?: string; traceId?: string; id?: string; executedAt?: string }[];
      const latestProposal = [...allItems].sort(
        (a, b) =>
          new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
      )[0];

      const itemsWithTrace: { traceId: string; at: number }[] = [];
      for (const e of pending as { traceId?: string; id?: string; createdAt?: string }[]) {
        const tid = e.traceId ?? e.id;
        const at = e.createdAt ? new Date(e.createdAt).getTime() : 0;
        if (tid) itemsWithTrace.push({ traceId: String(tid), at });
      }
      for (const e of approved as { traceId?: string; id?: string; createdAt?: string; executedAt?: string }[]) {
        const tid = e.traceId ?? e.id;
        const at = (e.executedAt ?? e.createdAt)
          ? new Date(e.executedAt ?? e.createdAt ?? 0).getTime()
          : 0;
        if (tid) itemsWithTrace.push({ traceId: String(tid), at });
      }
      for (const a of actions as { traceId?: string; at?: string }[]) {
        const tid = a.traceId ?? "";
        const at = a.at ? new Date(a.at).getTime() : 0;
        if (tid) itemsWithTrace.push({ traceId: tid, at });
      }
      const latestTrace = [...itemsWithTrace].sort((a, b) => b.at - a.at)[0];

      const lastActivityAt = itemsWithTrace.length > 0 ? Math.max(...itemsWithTrace.map((i) => i.at)) : 0;
      const minutesSinceActivity = lastActivityAt > 0 ? (Date.now() - lastActivityAt) / 60_000 : 999;
      const agentStatus =
        pending.length > 0 || minutesSinceActivity < 30 ? "ACTIVE" : "IDLE";

      setData({
        dateKey: typeof dateKey === "string" ? dateKey : "-",
        pendingCount: pending.length,
        approvedReadyCount: approvedReady,
        actionsCount: actions.length,
        lastProposalAt: latestProposal?.createdAt ?? null,
        lastTraceId: latestTrace?.traceId ?? null,
        agentStatus,
      });
    } catch {
      setData(null);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const id = setInterval(fetchStatus, 5000);
    return () => clearInterval(id);
  }, [fetchStatus]);

  useEffect(() => {
    const handler = () => fetchStatus();
    globalThis.addEventListener("jarvis-refresh", handler);
    return () => globalThis.removeEventListener("jarvis-refresh", handler);
  }, [fetchStatus]);

  if (!data) {
    return (
      <div className="border-b border-zinc-800 bg-zinc-950 px-4 py-2">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 text-xs text-zinc-500">
          <span>Loading…</span>
        </div>
      </div>
    );
  }

  const traceShort = data.lastTraceId ? data.lastTraceId.slice(0, 8) : null;

  return (
    <div className="border-b border-zinc-800 bg-zinc-950 px-4 py-2">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 text-xs tracking-wide text-zinc-400">
        <span>
          Pending: <span className="font-medium text-zinc-300">{data.pendingCount}</span>
        </span>
        <span>
          Ready: <span className="font-medium text-zinc-300">{data.approvedReadyCount}</span>
        </span>
        <span>
          Receipts: <span className="font-medium text-zinc-300">{data.actionsCount}</span>
        </span>
        <span>
          Agent:{" "}
          <span
            className={`font-medium ${
              data.agentStatus === "ACTIVE" ? "text-emerald-400" : "text-zinc-500"
            }`}
          >
            {data.agentStatus}
          </span>
        </span>
        <span>
          Last: {data.lastProposalAt ? formatTimeAgo(data.lastProposalAt) : "—"}
        </span>
        {traceShort && (
          <span>
            Trace:{" "}
            <Link
              href={`/?trace=${encodeURIComponent(data.lastTraceId!)}`}
              className="font-mono text-zinc-300 underline hover:text-zinc-200"
            >
              {traceShort}
            </Link>
          </span>
        )}
        <span className="text-zinc-500">{data.dateKey}</span>
      </div>
    </div>
  );
}
