"use client";

import { useCallback, useEffect, useState } from "react";

type ModePillsProps = Readonly<{
  executionMode?: "DRY RUN" | "LIVE";
}>;

export default function ModePills({ executionMode = "DRY RUN" }: ModePillsProps) {
  const [authEnabled, setAuthEnabled] = useState<boolean | null>(null);
  const [safetyConfirmOn, setSafetyConfirmOn] = useState<boolean | null>(null);
  const [ingressValidationOn, setIngressValidationOn] = useState<boolean | null>(null);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/config");
      const json = await res.json();
      setAuthEnabled(json.authEnabled === true);
      setSafetyConfirmOn(
        typeof json.irreversibleConfirmEnabled === "boolean"
          ? json.irreversibleConfirmEnabled
          : null
      );
      setIngressValidationOn(
        typeof json.ingressValidationEnabled === "boolean"
          ? json.ingressValidationEnabled
          : null
      );
    } catch {
      setAuthEnabled(false);
      setSafetyConfirmOn(null);
      setIngressValidationOn(null);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
    const id = setInterval(fetchConfig, 5000);
    return () => clearInterval(id);
  }, [fetchConfig]);

  return (
    <div className="flex shrink-0 items-center gap-2 px-4 py-1.5 sm:pr-4">
      <div className="flex flex-wrap gap-2">
        <span className="rounded border border-zinc-700 bg-zinc-900/50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
          Execution: {executionMode}
        </span>
        <span className="rounded border border-zinc-700 bg-zinc-900/50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
          Auth: {authEnabled === null ? "…" : authEnabled ? "ON" : "OFF"}
        </span>
        <span className="rounded border border-zinc-700 bg-zinc-900/50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
          Safety: {safetyConfirmOn === null ? "…" : safetyConfirmOn ? "ON" : "OFF"}
        </span>
        <span className="rounded border border-zinc-700 bg-zinc-900/50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
          Ingress Validation: {ingressValidationOn === null ? "…" : ingressValidationOn ? "ON" : "OFF"}
        </span>
      </div>
    </div>
  );
}
