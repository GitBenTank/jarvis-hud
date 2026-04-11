"use client";

import { useCallback, useEffect, useState } from "react";

function tri(v: boolean | null, on: string, off: string): string {
  if (v === null) return "…";
  return v ? on : off;
}

/** Transitional: trust signals live on TrustPostureStrip; this row keeps env toggles not duplicated there. */
export default function ModePills() {
  const [safetyConfirmOn, setSafetyConfirmOn] = useState<boolean | null>(null);
  const [ingressValidationOn, setIngressValidationOn] = useState<boolean | null>(null);

  const fetchConfig = useCallback(async () => {
    const clearUnknown = () => {
      setSafetyConfirmOn(null);
      setIngressValidationOn(null);
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
        <span className="rounded border border-zinc-700 bg-zinc-900/50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
          Safety: {tri(safetyConfirmOn, "ON", "OFF")}
        </span>
        <span className="rounded border border-zinc-700 bg-zinc-900/50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
          Ingress validation: {tri(ingressValidationOn, "ON", "OFF")}
        </span>
      </div>
    </div>
  );
}
