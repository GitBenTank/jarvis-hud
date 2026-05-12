"use client";

import { createContext, useContext, type ReactNode } from "react";
import {
  useApprovalQueueCounts,
  type ApprovalQueueCounts,
} from "@/hooks/useApprovalQueueCounts";

const ApprovalQueueCountsContext = createContext<ApprovalQueueCounts | null>(
  null
);

export { ApprovalQueueCountsContext };

export function ApprovalQueueCountsProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const value = useApprovalQueueCounts();
  return (
    <ApprovalQueueCountsContext.Provider value={value}>
      {children}
    </ApprovalQueueCountsContext.Provider>
  );
}

/** Use under ApprovalQueueCountsProvider (Activity + home queue sections). */
export function useApprovalQueueCountsFromContext(): ApprovalQueueCounts {
  const ctx = useContext(ApprovalQueueCountsContext);
  if (!ctx) {
    throw new Error(
      "useApprovalQueueCountsFromContext must be used within ApprovalQueueCountsProvider"
    );
  }
  return ctx;
}
