"use client";

import { useCallback, useEffect, useState } from "react";

function tri(v: boolean | null, on: string, off: string): string {
  if (v === null) return "…";
  return v ? on : off;
}

/** Parsed from `trustPosture` only; `undefined` means the key was absent (do not render that pill). */
type TrustPosturePayload = {
  stepUpValid: boolean | null | undefined;
  executionScopeEnforced: boolean | undefined;
  executionSurfaceLabel: string | undefined;
  codeApplyBlockReasons: string[] | undefined;
};

function readStepUpValid(o: Record<string, unknown>): boolean | null | undefined {
  if (!("stepUpValid" in o)) return undefined;
  if (o.stepUpValid === null) return null;
  if (typeof o.stepUpValid === "boolean") return o.stepUpValid;
  return undefined;
}

function readOptionalBoolean(o: Record<string, unknown>, key: string): boolean | undefined {
  if (!(key in o)) return undefined;
  return typeof o[key] === "boolean" ? o[key] : undefined;
}

function readOptionalString(o: Record<string, unknown>, key: string): string | undefined {
  if (!(key in o)) return undefined;
  return typeof o[key] === "string" ? o[key] : undefined;
}

function readOptionalStringArray(o: Record<string, unknown>, key: string): string[] | undefined {
  if (!(key in o)) return undefined;
  const v = o[key];
  if (!Array.isArray(v) || !v.every((x) => typeof x === "string")) return undefined;
  return v;
}

function parseTrustPosture(json: Record<string, unknown>): TrustPosturePayload | null {
  const raw = json.trustPosture;
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  return {
    stepUpValid: readStepUpValid(o),
    executionScopeEnforced: readOptionalBoolean(o, "executionScopeEnforced"),
    executionSurfaceLabel: readOptionalString(o, "executionSurfaceLabel"),
    codeApplyBlockReasons: readOptionalStringArray(o, "codeApplyBlockReasons"),
  };
}

function formatStepUpWhenAuthOn(v: boolean | null | undefined): string {
  if (v === undefined) return "";
  if (v === null) return "…";
  if (v) return "Valid";
  return "Required";
}

function readLatestBlockReason(json: Record<string, unknown>): string | null {
  const rp = json.runtimePosture;
  if (!rp || typeof rp !== "object") return null;
  const r = (rp as Record<string, unknown>).latestBlockReason;
  if (typeof r !== "string" || !r.trim()) return null;
  return r.trim();
}

function readOptionalTopLevelBool(json: Record<string, unknown>, key: string): boolean | null {
  const v = json[key];
  if (typeof v === "boolean") return v;
  return null;
}

const pillBase =
  "rounded border border-zinc-300 bg-zinc-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-700 dark:border-zinc-600 dark:bg-zinc-900/80 dark:text-zinc-300";

function applyTrustConfigJson(
  json: Record<string, unknown>,
  setters: {
    setIngressOpenclawEnabled: (v: boolean | null) => void;
    setOpenclawAllowed: (v: boolean | null) => void;
    setAuthEnabled: (v: boolean | null) => void;
    setCodeApplyAvailable: (v: boolean | null) => void;
    setLatestBlockReason: (v: string | null) => void;
    setTrustPosture: (v: TrustPosturePayload | null) => void;
  },
): void {
  setters.setIngressOpenclawEnabled(readOptionalTopLevelBool(json, "ingressOpenclawEnabled"));
  setters.setOpenclawAllowed(readOptionalTopLevelBool(json, "openclawAllowed"));
  setters.setAuthEnabled(readOptionalTopLevelBool(json, "authEnabled"));
  setters.setCodeApplyAvailable(readOptionalTopLevelBool(json, "codeApplyAvailable"));
  setters.setLatestBlockReason(readLatestBlockReason(json));
  setters.setTrustPosture(parseTrustPosture(json));
}

export default function TrustPostureStrip() {
  const [ingressOpenclawEnabled, setIngressOpenclawEnabled] = useState<boolean | null>(null);
  const [openclawAllowed, setOpenclawAllowed] = useState<boolean | null>(null);
  const [authEnabled, setAuthEnabled] = useState<boolean | null>(null);
  const [codeApplyAvailable, setCodeApplyAvailable] = useState<boolean | null>(null);
  const [latestBlockReason, setLatestBlockReason] = useState<string | null>(null);
  const [trustPosture, setTrustPosture] = useState<TrustPosturePayload | null>(null);

  const fetchConfig = useCallback(async () => {
    const clear = () => {
      setIngressOpenclawEnabled(null);
      setOpenclawAllowed(null);
      setAuthEnabled(null);
      setCodeApplyAvailable(null);
      setLatestBlockReason(null);
      setTrustPosture(null);
    };

    try {
      const res = await fetch("/api/config", { credentials: "include" });
      let json: Record<string, unknown>;
      try {
        json = (await res.json()) as Record<string, unknown>;
      } catch {
        clear();
        return;
      }
      if (!res.ok) {
        clear();
        return;
      }

      applyTrustConfigJson(json, {
        setIngressOpenclawEnabled,
        setOpenclawAllowed,
        setAuthEnabled,
        setCodeApplyAvailable,
        setLatestBlockReason,
        setTrustPosture,
      });
    } catch {
      clear();
    }
  }, []);

  useEffect(() => {
    const id = setInterval(fetchConfig, 5000);
    queueMicrotask(() => fetchConfig());
    return () => clearInterval(id);
  }, [fetchConfig]);

  const tp = trustPosture;
  const showStepUpAuthOn = authEnabled === true && tp?.stepUpValid !== undefined;
  const stepUpLabelAuthOn = formatStepUpWhenAuthOn(tp?.stepUpValid);
  const showStepUpNa = Boolean(tp) && authEnabled === false;
  const scopeEnforced = tp?.executionScopeEnforced;
  const showScope = scopeEnforced !== undefined;
  const execLabel = tp?.executionSurfaceLabel;
  const showExecute = Boolean(execLabel?.length);
  const reasons = tp?.codeApplyBlockReasons;
  const showApplyReasons = Boolean(reasons?.length);

  return (
    <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-2 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span className="shrink-0 text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-500">
          Trust posture
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <span className={pillBase} title="OpenClaw ingress enabled (secret + env)">
            Ingress: {tri(ingressOpenclawEnabled, "Enabled", "Disabled")}
          </span>
          <span className={pillBase} title="Connector allowlist includes openclaw">
            Connector: {tri(openclawAllowed, "Trusted", "Untrusted")}
          </span>
          <span className={pillBase} title="HUD auth requirement">
            Auth: {tri(authEnabled, "On", "Off")}
          </span>
          <span className={pillBase} title="code.apply execution path available">
            Apply: {tri(codeApplyAvailable, "Available", "Blocked")}
          </span>
          {latestBlockReason ? (
            <span
              className={`${pillBase} max-w-[min(100%,28rem)] truncate border-amber-800/40 bg-amber-950/20 text-amber-200`}
              title={latestBlockReason}
            >
              Block: {latestBlockReason}
            </span>
          ) : null}

          {showStepUpAuthOn ? (
            <span className={pillBase} title="Step-up session (cookie); trustPosture.stepUpValid">
              Step-up: {stepUpLabelAuthOn}
            </span>
          ) : null}
          {showStepUpNa ? (
            <span className={pillBase} title="Auth off; step-up not applicable">
              Step-up: N/A
            </span>
          ) : null}
          {showScope ? (
            <span className={pillBase} title="JARVIS_EXECUTION_ALLOWED_ROOTS non-empty">
              Scope: {scopeEnforced ? "Enforced" : "Open"}
            </span>
          ) : null}
          {showExecute && execLabel ? (
            <span className={pillBase} title="From trustPosture.executionSurfaceLabel">
              Execute: {execLabel}
            </span>
          ) : null}
          {showApplyReasons && reasons ? (
            <span className={pillBase} title={reasons.join("\n\n")}>
              Apply detail: {reasons.length} reason{reasons.length === 1 ? "" : "s"}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
