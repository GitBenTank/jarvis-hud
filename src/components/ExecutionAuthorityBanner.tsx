"use client";

import { useCallback, useEffect, useState } from "react";

type ExecutionAuthorityBannerProps = Readonly<{
  pendingProposalsCount?: number;
}>;

export default function ExecutionAuthorityBanner({
  pendingProposalsCount: countProp,
}: ExecutionAuthorityBannerProps) {
  const [fetchedCount, setFetchedCount] = useState<number | null>(null);

  const fetchPending = useCallback(async () => {
    try {
      const res = await fetch("/api/approvals?status=pending");
      const json = await res.json();
      const count = Array.isArray(json.approvals)
        ? json.approvals.length
        : 0;
      setFetchedCount(count);
    } catch {
      setFetchedCount(0);
    }
  }, []);

  useEffect(() => {
    if (countProp === undefined) {
      fetchPending();
      const id = setInterval(fetchPending, 5000);
      return () => clearInterval(id);
    }
  }, [countProp, fetchPending]);

  useEffect(() => {
    const handler = () => fetchPending();
    globalThis.addEventListener("jarvis-refresh", handler);
    return () => globalThis.removeEventListener("jarvis-refresh", handler);
  }, [fetchPending]);

  const pendingCount =
    countProp !== undefined ? countProp : (fetchedCount ?? 0);
  const hasPending = pendingCount > 0;

  const label = hasPending
    ? "EXECUTION AUTHORITY: AWAITING HUMAN APPROVAL"
    : "EXECUTION AUTHORITY: HUMAN GATED";

  return (
    <div
      className="flex-1 min-w-0 px-4 py-2 sm:py-1.5"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-medium uppercase tracking-widest text-zinc-300">
          {label}
          {hasPending && (
            <span className="ml-2 text-amber-400">({pendingCount})</span>
          )}
        </span>
        <span className="text-[10px] italic text-zinc-500 dark:text-zinc-400">
          Autonomy in thinking. Authority in action.
        </span>
      </div>
    </div>
  );
}
