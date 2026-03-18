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

export type TraceEvent = {
  id: string;
  traceId?: string;
  kind: string;
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
};

export type TracePolicyDecision = {
  traceId: string;
  decision: "allow" | "deny";
  rule: string;
  reason: string;
  timestamp: string;
};

export type TraceResponse = {
  traceId: string;
  dateKey: string;
  events: TraceEvent[];
  actions: TraceAction[];
  policyDecisions?: TracePolicyDecision[];
  reconciliations?: unknown[];
  artifactPaths: string[];
};

type TraceContextValue = {
  traceIdFromUrl: string | null;
  traceData: TraceResponse | null;
  loading: boolean;
  error: string | null;
  refreshTrace: () => void;
};

const TraceContext = createContext<TraceContextValue | null>(null);

export function TraceProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const traceIdFromUrl = searchParams.get("trace")?.trim() ?? null;

  const [traceData, setTraceData] = useState<TraceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTrace = useCallback(async () => {
    const tid = traceIdFromUrl;
    if (!tid) {
      setTraceData(null);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/traces/${encodeURIComponent(tid)}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? `Request failed (${res.status})`);
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
  }, [traceIdFromUrl]);

  useEffect(() => {
    fetchTrace();
  }, [fetchTrace]);

  useEffect(() => {
    const handler = () => fetchTrace();
    globalThis.addEventListener("jarvis-refresh", handler);
    return () => globalThis.removeEventListener("jarvis-refresh", handler);
  }, [fetchTrace]);

  const value: TraceContextValue = {
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
      traceIdFromUrl: null,
      traceData: null,
      loading: false,
      error: null,
      refreshTrace: () => {},
    };
  }
  return ctx;
}
