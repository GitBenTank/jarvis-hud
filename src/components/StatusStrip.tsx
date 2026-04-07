"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type StatusStripData = {
  dateKey: string | null;
  pendingCount: number;
  approvedCount: number;
  executedCount: number;
  lastProposalAt: string | null;
  activeTraceId: string | null;
  agentLastSeen: string | null;
  latestDecisionSummary: string;
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
      const configRes = await fetch("/api/config");
      const config = await configRes.json();
      const posture = config.runtimePosture as {
        activeTraceId: string | null;
        lastProposalAt: string | null;
        pendingCount: number;
        approvedCount: number;
        executedCount: number;
        agentLastSeen: string | null;
        latestDecisionSummary: string;
      };

      const lastActivityAt = posture.agentLastSeen
        ? new Date(posture.agentLastSeen).getTime()
        : 0;
      const minutesSinceActivity = lastActivityAt > 0 ? (Date.now() - lastActivityAt) / 60_000 : 999;
      const agentStatus =
        posture.pendingCount > 0 || minutesSinceActivity < 30 ? "ACTIVE" : "IDLE";

      setData({
        dateKey: typeof config.serverTime === "string" ? config.serverTime.slice(0, 10) : null,
        pendingCount: posture.pendingCount,
        approvedCount: posture.approvedCount,
        executedCount: posture.executedCount,
        lastProposalAt: posture.lastProposalAt,
        activeTraceId: posture.activeTraceId,
        agentLastSeen: posture.agentLastSeen,
        latestDecisionSummary: posture.latestDecisionSummary,
        agentStatus,
      });
    } catch {
      setData(null);
    }
  }, []);

  useEffect(() => {
    const id = setInterval(fetchStatus, 5000);
    queueMicrotask(() => fetchStatus());
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

  const traceShort = data.activeTraceId ? data.activeTraceId.slice(0, 8) : null;

  return (
    <div className="border-b border-zinc-800 bg-zinc-950 px-4 py-2">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 text-xs tracking-wide text-zinc-400">
        <span>
          Pending: <span className="font-medium text-zinc-300">{data.pendingCount}</span>
        </span>
        <span>
          Approved: <span className="font-medium text-zinc-300">{data.approvedCount}</span>
        </span>
        <span>
          Executed: <span className="font-medium text-zinc-300">{data.executedCount}</span>
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
          Last proposal: {data.lastProposalAt ? formatTimeAgo(data.lastProposalAt) : "—"}
        </span>
        <span>
          Last seen: {data.agentLastSeen ? formatTimeAgo(data.agentLastSeen) : "—"}
        </span>
        {traceShort && (
          <span>
            Trace:{" "}
            <Link
              href={`/?trace=${encodeURIComponent(data.activeTraceId!)}`}
              className="font-mono text-zinc-300 underline hover:text-zinc-200"
            >
              {traceShort}
            </Link>
          </span>
        )}
        <span title={data.latestDecisionSummary}>
          Decision: <span className="text-zinc-300">{data.latestDecisionSummary}</span>
        </span>
        <span className="text-zinc-500">{data.dateKey ?? "-"}</span>
      </div>
    </div>
  );
}
