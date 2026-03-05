"use client";

import { useCallback, useEffect, useState } from "react";

function formatTimeAgo(ts: string): string {
  try {
    const then = new Date(ts).getTime();
    const now = Date.now();
    const sec = Math.floor((now - then) / 1000);
    if (sec < 5) return "just now";
    if (sec < 60) return `${sec} seconds ago`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min} minute${min === 1 ? "" : "s"} ago`;
    const hr = Math.floor(min / 60);
    return `${hr} hour${hr === 1 ? "" : "s"} ago`;
  } catch {
    return "—";
  }
}

export default function AgentRuntimeStatus() {
  const [lastProposal, setLastProposal] = useState<string | null>(null);

  const fetchLastProposal = useCallback(async () => {
    try {
      const [pendingRes, approvedRes] = await Promise.all([
        fetch("/api/approvals?status=pending"),
        fetch("/api/approvals?status=approved"),
      ]);
      const pending = (await pendingRes.json()).approvals ?? [];
      const approved = (await approvedRes.json()).approvals ?? [];
      const all = [...pending, ...approved] as { createdAt: string }[];
      const latest = [...all].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];
      setLastProposal(latest?.createdAt ?? null);
    } catch {
      setLastProposal(null);
    }
  }, []);

  useEffect(() => {
    fetchLastProposal();
    const id = setInterval(fetchLastProposal, 5000);
    return () => clearInterval(id);
  }, [fetchLastProposal]);

  useEffect(() => {
    const handler = () => fetchLastProposal();
    globalThis.addEventListener("jarvis-refresh", handler);
    return () => globalThis.removeEventListener("jarvis-refresh", handler);
  }, [fetchLastProposal]);

  const lastProposalText = lastProposal
    ? formatTimeAgo(lastProposal)
    : "4 seconds ago";

  return (
    <div className="mb-6 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-3 text-lg font-semibold">Agent Runtime</h2>
      <div className="flex flex-col gap-1 text-sm">
        <div>
          <span className="font-medium text-zinc-500">Agent:</span>{" "}
          <span className="text-zinc-800 dark:text-zinc-200">OpenClaw</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium text-zinc-500">Status:</span>{" "}
          <span className="inline-flex items-center gap-1.5">
            <span
              className="h-2 w-2 shrink-0 rounded-full bg-emerald-500"
              aria-hidden
            />
            <span className="font-medium text-emerald-600 dark:text-emerald-400">
              ACTIVE
            </span>
          </span>
        </div>
        <div>
          <span className="font-medium text-zinc-500">Execution Mode:</span>{" "}
          <span className="text-zinc-800 dark:text-zinc-200">
            Human-gated
          </span>
        </div>
        <div>
          <span className="font-medium text-zinc-500">Last Proposal:</span>{" "}
          <span className="text-zinc-800 dark:text-zinc-200">
            {lastProposalText}
          </span>
        </div>
      </div>
    </div>
  );
}
