"use client";

import { useCallback, useEffect, useState } from "react";

function tri(v: boolean | null, on: string, off: string): string {
  if (v === null) return "…";
  return v ? on : off;
}

function stepUpPill(stepUpValid: boolean | null): string {
  if (stepUpValid === null) return "…";
  return stepUpValid ? "OK" : "REQUIRED";
}

export default function ModePills() {
  const [authEnabled, setAuthEnabled] = useState<boolean | null>(null);
  const [safetyConfirmOn, setSafetyConfirmOn] = useState<boolean | null>(null);
  const [ingressValidationOn, setIngressValidationOn] = useState<boolean | null>(null);
  const [executionLabel, setExecutionLabel] = useState<string | null>(null);
  const [stepUpValid, setStepUpValid] = useState<boolean | null>(null);
  const [scopeEnforced, setScopeEnforced] = useState<boolean | null>(null);

  const fetchConfig = useCallback(async () => {
    const clearUnknown = () => {
      setAuthEnabled(null);
      setSafetyConfirmOn(null);
      setIngressValidationOn(null);
      setExecutionLabel(null);
      setStepUpValid(null);
      setScopeEnforced(null);
    };

    try {
      const res = await fetch("/api/config", { credentials: "include" });
      let json: Record<string, unknown>;
      try {
        json = (await res.json()) as Record<string, unknown>;
      } catch {
        clearUnknown();
        return;
      }
      if (!res.ok) {
        clearUnknown();
        return;
      }
      setAuthEnabled(typeof json.authEnabled === "boolean" ? json.authEnabled : null);
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
      const tp = json.trustPosture as
        | {
            executionSurfaceLabel?: string;
            stepUpValid?: boolean | null;
            executionScopeEnforced?: boolean;
          }
        | undefined;
      setExecutionLabel(
        typeof tp?.executionSurfaceLabel === "string" ? tp.executionSurfaceLabel : null
      );
      setStepUpValid(typeof tp?.stepUpValid === "boolean" ? tp.stepUpValid : null);
      setScopeEnforced(
        typeof tp?.executionScopeEnforced === "boolean" ? tp.executionScopeEnforced : null
      );
    } catch {
      clearUnknown();
    }
  }, []);

  useEffect(() => {
    const id = setInterval(fetchConfig, 5000);
    queueMicrotask(() => fetchConfig());
    return () => clearInterval(id);
  }, [fetchConfig]);

  return (
    <div className="flex shrink-0 items-center gap-2 px-4 py-1.5 sm:pr-4">
      <div className="flex flex-wrap gap-2">
        <span
          className="rounded border border-zinc-700 bg-zinc-900/50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400"
          title="From Jarvis execute path: dryRun false only for code.apply"
        >
          Execute: {executionLabel ?? "…"}
        </span>
        <span className="rounded border border-zinc-700 bg-zinc-900/50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
          Auth: {tri(authEnabled, "ON", "OFF")}
        </span>
        {authEnabled === true ? (
          <span className="rounded border border-zinc-700 bg-zinc-900/50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
            Step-up: {stepUpPill(stepUpValid)}
          </span>
        ) : null}
        <span className="rounded border border-zinc-700 bg-zinc-900/50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
          Scope: {tri(scopeEnforced, "ENFORCED", "OFF")}
        </span>
        <span className="rounded border border-zinc-700 bg-zinc-900/50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
          Safety: {tri(safetyConfirmOn, "ON", "OFF")}
        </span>
        <span className="rounded border border-zinc-700 bg-zinc-900/50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
          Ingress Validation: {tri(ingressValidationOn, "ON", "OFF")}
        </span>
      </div>
    </div>
  );
}
