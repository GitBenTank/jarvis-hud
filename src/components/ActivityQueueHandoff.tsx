"use client";

import Link from "next/link";
import { useMemo } from "react";
import { buildOperatorAttentionMessage } from "@/lib/operator-attention-message";
import { useApprovalQueueCountsFromContext } from "@/components/ApprovalQueueCountsProvider";

/**
 * Home (/) handoff to /activity during duplicate-queue transition.
 * Surfaces the same attention line as Activity without hiding the overview story.
 */
export default function ActivityQueueHandoff() {
  const { pendingApproval, awaitingExecute, loading } =
    useApprovalQueueCountsFromContext();

  const message = useMemo(() => {
    if (loading) return "Checking approval queue…";
    return buildOperatorAttentionMessage(pendingApproval, awaitingExecute);
  }, [loading, pendingApproval, awaitingExecute]);

  const needsAttention = pendingApproval + awaitingExecute > 0;

  return (
    <div
      className={`mb-4 rounded-lg border px-4 py-3 ${
        needsAttention
          ? "border-amber-500/40 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-950/30"
          : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60"
      }`}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Operator queue
          </p>
          <p
            role="status"
            aria-live="polite"
            className={`text-sm font-medium ${
              needsAttention
                ? "text-amber-950 dark:text-amber-100"
                : "text-zinc-700 dark:text-zinc-300"
            }`}
          >
            {message}
          </p>
        </div>
        <Link
          href="/activity"
          className={`shrink-0 text-sm font-semibold underline-offset-2 hover:underline ${
            needsAttention
              ? "text-amber-800 dark:text-amber-200"
              : "text-amber-600 dark:text-amber-400"
          }`}
        >
          Open Activity →
        </Link>
      </div>
    </div>
  );
}
