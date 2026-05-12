"use client";

import { useCallback, useContext, useEffect, useState } from "react";
import {
  ApprovalQueueCountsContext,
} from "@/components/ApprovalQueueCountsProvider";
import ApprovalsPanel from "./ApprovalsPanel";
import ExecutionTimeline from "./ExecutionTimeline";

type OperationsRowProps = Readonly<{
  /** Activity page: proposals only; pipeline lives in `ActivityProofRail`. */
  layout?: "default" | "activity";
}>;

export default function OperationsRow({
  layout = "default",
}: OperationsRowProps) {
  const shared = useContext(ApprovalQueueCountsContext);
  const [pendingCountLocal, setPendingCountLocal] = useState(0);

  const fetchPending = useCallback(async () => {
    try {
      const res = await fetch("/api/approvals?status=pending");
      const json = await res.json();
      setPendingCountLocal(
        Array.isArray(json.approvals) ? json.approvals.length : 0
      );
    } catch {
      setPendingCountLocal(0);
    }
  }, []);

  useEffect(() => {
    if (shared) return;
    const id = setInterval(fetchPending, 5000);
    queueMicrotask(() => fetchPending());
    return () => clearInterval(id);
  }, [fetchPending, shared]);

  useEffect(() => {
    if (shared) return;
    const handler = () => fetchPending();
    globalThis.addEventListener("jarvis-refresh", handler);
    return () => globalThis.removeEventListener("jarvis-refresh", handler);
  }, [fetchPending, shared]);

  const pendingCount = shared ? shared.pendingApproval : pendingCountLocal;
  const hasPending = pendingCount > 0;

  const proposalsBlock = (
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
          <span
            className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/50 dark:text-amber-200"
            title="Not yet approved — distinct from awaiting execution"
          >
            Pending approval ({pendingCount})
          </span>
        )}
      </div>
      <ApprovalsPanel />
    </div>
  );

  if (layout === "activity") {
    return <div className="min-w-0">{proposalsBlock}</div>;
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {proposalsBlock}
      <div className="min-h-[200px]">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
          Execution Pipeline
        </h2>
        <ExecutionTimeline />
      </div>
    </div>
  );
}
