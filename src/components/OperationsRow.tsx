"use client";

import { useCallback, useEffect, useState } from "react";
import ApprovalsPanel from "./ApprovalsPanel";
import ExecutionTimeline from "./ExecutionTimeline";

export default function OperationsRow() {
  const [pendingCount, setPendingCount] = useState(0);

  const fetchPending = useCallback(async () => {
    try {
      const res = await fetch("/api/approvals?status=pending");
      const json = await res.json();
      setPendingCount(Array.isArray(json.approvals) ? json.approvals.length : 0);
    } catch {
      setPendingCount(0);
    }
  }, []);

  useEffect(() => {
    const id = setInterval(fetchPending, 5000);
    queueMicrotask(() => fetchPending());
    return () => clearInterval(id);
  }, [fetchPending]);

  useEffect(() => {
    const handler = () => fetchPending();
    globalThis.addEventListener("jarvis-refresh", handler);
    return () => globalThis.removeEventListener("jarvis-refresh", handler);
  }, [fetchPending]);

  const hasPending = pendingCount > 0;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div
        className={`min-h-[200px] rounded-lg ${
          hasPending
            ? "ring-2 ring-amber-500/60 ring-offset-2 ring-offset-zinc-50 dark:ring-offset-zinc-950"
            : ""
        }`}
      >
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
            Agent Proposals
          </h2>
          {hasPending && (
            <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
              {pendingCount} awaiting
            </span>
          )}
        </div>
        <ApprovalsPanel />
      </div>
      <div className="min-h-[200px]">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
          Execution Pipeline
        </h2>
        <ExecutionTimeline />
      </div>
    </div>
  );
}
