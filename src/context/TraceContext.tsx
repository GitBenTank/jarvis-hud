"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useSearchParams } from "next/navigation";
import type { ReasonDetail } from "@/lib/reason-taxonomy";
import type { ReceiptActors } from "@/lib/actor-identity";
import type { TraceExecutionOutcome } from "@/lib/execution-truth";
import type { ApprovalPreflightSnapshotRecord } from "@/lib/approval-preflight-snapshot-shared";

export type TraceEvent = {
  id: string;
  traceId?: string;
  kind: string;
  agent?: string;
  status: string;
  createdAt: string;
  executedAt?: string;
  executed?: boolean;
  summary?: string;
  title?: string;
  source?: {
    connector: string;
    verified?: boolean;
    sessionId?: string;
    agentId?: string;
    requestId?: string;
  };
  correlationId?: string;
  proposedAt?: string;
  proposalStatus?: string;
  approvedAt?: string;
  rejectedAt?: string;
  failedAt?: string;
  recovery?: {
    class: string;
    symptom: string;
    verificationCheck: string;
    fallbackIfFailed: string;
  };
  actorId?: string;
  actorType?: "human" | "agent";
  actorLabel?: string;
  approvalActorId?: string;
  approvalActorType?: "human" | "agent";
  approvalActorLabel?: string;
  rejectionActorId?: string;
  rejectionActorType?: "human" | "agent";
  rejectionActorLabel?: string;
  executionActorId?: string;
  executionActorType?: "human" | "agent";
  executionActorLabel?: string;
  /** OpenClaw builder agent (e.g. forge); metadata only. */
  builder?: string;
  provider?: string;
  model?: string;
};

export type TraceAction = {
  id: string;
  traceId?: string;
  at: string;
  kind: string;
  approvalId: string;
  status: string;
  summary: string;
  outputPath?: string;
  artifactPath?: string;
  commitHash?: string | null;
  rollbackCommand?: string | null;
  verificationStatus?: "pending" | "verified" | "failed";
  statsText?: string | null;
  statsJson?: { filesChangedCount: number; insertions: number; deletions: number } | null;
  repoHeadBefore?: string | null;
  repoHeadAfter?: string | null;
  actors?: ReceiptActors;
};

export type TracePolicyDecision = {
  traceId: string;
  decision: "allow" | "deny";
  rule: string;
  reason: string;
  timestamp: string;
};

export type TraceReconciliation = {
  traceId: string;
  status: "verified" | "drift_detected" | "not_reconcilable_yet";
  reason: string;
  timestamp: string;
};

export type TracePipelineStage = {
  id: "proposal" | "approval" | "policy" | "execution" | "receipt" | "reconciliation";
  label: string;
  status: "done" | "active" | "pending" | "blocked";
  timestamp?: string;
  summary: string;
  evidence: string[];
  reason?: ReasonDetail;
};

export type TracePipeline = {
  stages: TracePipelineStage[];
  currentStage: TracePipelineStage["id"];
  blockedReason?: string;
};

export type TraceResponse = {
  traceId: string;
  dateKey: string;
  events: TraceEvent[];
  actions: TraceAction[];
  policyDecisions?: TracePolicyDecision[];
  reconciliations?: TraceReconciliation[];
  artifactPaths: string[];
  pipeline?: TracePipeline;
  /** Derived execution posture for operators; client may re-derive if absent. */
  executionOutcome?: TraceExecutionOutcome;
  /** Persisted approval-time preflight; absent on older traces. */
  approvalPreflightSnapshot?: ApprovalPreflightSnapshotRecord | null;
};

type TraceContextValue = {
  activeTraceId: string | null;
  setActiveTraceId: (traceId: string | null) => void;
  traceIdFromUrl: string | null;
  traceData: TraceResponse | null;
  loading: boolean;
  error: string | null;
  refreshTrace: () => void;
};

const TraceContext = createContext<TraceContextValue | null>(null);

export function TraceProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const traceParam = searchParams.get("trace");
  const traceIdFromUrl =
    traceParam && traceParam.trim() ? traceParam.trim() : null;
  const [activeTraceId, setActiveTraceId] = useState<string | null>(null);

  const [traceData, setTraceData] = useState<TraceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTrace = useCallback(async () => {
    const tid = activeTraceId ?? traceIdFromUrl;
    if (!tid) {
      setTraceData(null);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/traces/${encodeURIComponent(tid)}`, {
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          setError(
            "Session required — Establish session (System status → Security), then reload."
          );
        } else {
          setError(json.error ?? `Request failed (${res.status})`);
        }
        setTraceData(null);
        return;
      }
      setTraceData(json as TraceResponse);
    } catch {
      setError("Failed to fetch trace");
      setTraceData(null);
    } finally {
      setLoading(false);
    }
  }, [activeTraceId, traceIdFromUrl]);

  useEffect(() => {
    if (traceIdFromUrl) {
      setActiveTraceId(traceIdFromUrl);
    } else {
      setActiveTraceId(null);
    }
  }, [traceIdFromUrl]);

  useEffect(() => {
    queueMicrotask(() => fetchTrace());
  }, [fetchTrace]);

  useEffect(() => {
    const handler = () => fetchTrace();
    globalThis.addEventListener("jarvis-refresh", handler);
    return () => globalThis.removeEventListener("jarvis-refresh", handler);
  }, [fetchTrace]);

  const value: TraceContextValue = {
    activeTraceId,
    setActiveTraceId,
    traceIdFromUrl,
    traceData,
    loading,
    error,
    refreshTrace: fetchTrace,
  };

  return (
    <TraceContext.Provider value={value}>{children}</TraceContext.Provider>
  );
}

export function useTraceContext(): TraceContextValue {
  const ctx = useContext(TraceContext);
  if (!ctx) {
    return {
      activeTraceId: null,
      setActiveTraceId: () => {},
      traceIdFromUrl: null,
      traceData: null,
      loading: false,
      error: null,
      refreshTrace: () => {},
    };
  }
  return ctx;
}
