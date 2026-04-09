"use client";

import { useCallback, useEffect, useState } from "react";
import type { OpenClawHealthPayload } from "@/lib/openclaw-health";

export type UseOpenClawHealthResult = {
  data: OpenClawHealthPayload | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
};

export function useOpenClawHealth(): UseOpenClawHealthResult {
  const [data, setData] = useState<OpenClawHealthPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch("/api/connectors/openclaw/health")
      .then(async (res) => {
        const json = (await res.json()) as OpenClawHealthPayload & {
          error?: string;
        };
        if (
          json.status === "connected" ||
          json.status === "degraded" ||
          json.status === "disconnected"
        ) {
          setData(json);
          setError(!res.ok ? json.lastError ?? "Health check failed" : null);
          return;
        }
        setData(null);
        setError(json.error ?? `HTTP ${res.status}`);
      })
      .catch(() => {
        setData(null);
        setError("Failed to fetch OpenClaw health");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    queueMicrotask(() => fetchHealth());
  }, [fetchHealth]);

  return { data, loading, error, refresh: fetchHealth };
}
