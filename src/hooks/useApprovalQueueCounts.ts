"use client";

import { useCallback, useEffect, useState } from "react";
import {
  isApprovedAwaitingExecution,
  isPendingApproval,
  type ProposalLifecycleEvent,
} from "@/lib/proposal-lifecycle";

type ApprovalsAllResponse = {
  approvals?: ProposalLifecycleEvent[];
};

export type ApprovalQueueCounts = {
  pendingApproval: number;
  awaitingExecute: number;
  loading: boolean;
  refresh: () => void;
};

/**
 * Shared counts for pending approval vs approved-but-not-done (includes executing).
 * One GET with status=all; same semantics as /api/approvals filters.
 */
export function useApprovalQueueCounts(): ApprovalQueueCounts {
  const [pendingApproval, setPendingApproval] = useState(0);
  const [awaitingExecute, setAwaitingExecute] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchCounts = useCallback(async () => {
    try {
      const res = await fetch("/api/approvals?status=all");
      const json = (await res.json()) as ApprovalsAllResponse;
      const list = Array.isArray(json.approvals) ? json.approvals : [];
      let p = 0;
      let a = 0;
      for (const e of list) {
        if (isPendingApproval(e)) p += 1;
        else if (isApprovedAwaitingExecution(e)) a += 1;
      }
      setPendingApproval(p);
      setAwaitingExecute(a);
    } catch {
      setPendingApproval(0);
      setAwaitingExecute(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = setInterval(fetchCounts, 5000);
    queueMicrotask(() => fetchCounts());
    return () => clearInterval(id);
  }, [fetchCounts]);

  useEffect(() => {
    const handler = () => fetchCounts();
    globalThis.addEventListener("jarvis-refresh", handler);
    return () => globalThis.removeEventListener("jarvis-refresh", handler);
  }, [fetchCounts]);

  return {
    pendingApproval,
    awaitingExecute,
    loading,
    refresh: fetchCounts,
  };
}
