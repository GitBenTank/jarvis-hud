"use client";

import { useMemo } from "react";
import { buildOperatorAttentionMessage } from "@/lib/operator-attention-message";
import { useApprovalQueueCountsFromContext } from "@/components/ApprovalQueueCountsProvider";

/**
 * Above-the-fold operator sentence for /activity (queue-first hierarchy).
 */
export default function OperatorAttentionBanner() {
  const { pendingApproval, awaitingExecute, loading } =
    useApprovalQueueCountsFromContext();

  const message = useMemo(() => {
    if (loading) return "Checking approval queue…";
    return buildOperatorAttentionMessage(pendingApproval, awaitingExecute);
  }, [loading, pendingApproval, awaitingExecute]);

  const needsAttention = pendingApproval + awaitingExecute > 0;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`mb-4 rounded-lg border px-4 py-3 ${
        needsAttention
          ? "border-amber-500/40 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-950/30"
          : "border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900/80"
      }`}
    >
      <p
        className={`text-sm font-medium ${
          needsAttention
            ? "text-amber-950 dark:text-amber-100"
            : "text-zinc-700 dark:text-zinc-300"
        }`}
      >
        {message}
      </p>
    </div>
  );
}
