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
  sodEnabled?: boolean | undefined;
  sodRoleMapsReady?: boolean | undefined;
  /** Server-built TL;DR from GET /api/config (same dialect as pills). */
  operatorHeadline?: string | undefined;
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
    sodEnabled: readOptionalBoolean(o, "sodEnabled"),
    sodRoleMapsReady: readOptionalBoolean(o, "sodRoleMapsReady"),
    operatorHeadline: readOptionalString(o, "operatorHeadline"),
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

type AuthStatusPayload = {
  authEnabled: boolean;
  hasSession: boolean;
  stepUpValid: boolean;
  identityBindingRequired: boolean;
  identityBound: boolean;
};

function formatBindingPill(auth: AuthStatusPayload | null): {
  label: string;
  title: string;
  kind: "neutral" | "warn" | "ok" | "muted";
} {
  if (!auth || !auth.authEnabled) {
    return {
      label: "Binding: N/A",
      title: "Auth is off — identity binding is not enforced for HUD session.",
      kind: "muted",
    };
  }
  if (!auth.identityBindingRequired) {
    return {
      label: "Binding: Not required",
      title: "JARVIS_IDENTITY_BINDING_REQUIRED is not set — OIDC bind is optional.",
      kind: "muted",
    };
  }
  if (auth.identityBound) {
    return {
      label: "Binding: Bound",
      title: "Session has OIDC iss/sub (identity binding satisfied for this session).",
      kind: "ok",
    };
  }
  if (auth.hasSession) {
    return {
      label: "Binding: Missing",
      title:
        "Binding is required but this session has no OIDC bind — use stub-bind or real OIDC before approve/execute.",
      kind: "warn",
    };
  }
  return {
    label: "Binding: —",
    title: "Binding is required — sign in (session), then complete OIDC bind.",
    kind: "neutral",
  };
}

function formatSodPill(tp: TrustPosturePayload | null): {
  label: string;
  title: string;
  kind: "neutral" | "warn" | "ok" | "muted";
} | null {
  if (!tp || tp.sodEnabled === undefined) return null;
  if (!tp.sodEnabled) {
    return {
      label: "SoD: Off",
      title: "JARVIS_SOD_ENABLED is not set — approver/executor lists are not enforced.",
      kind: "muted",
    };
  }
  if (tp.sodRoleMapsReady === true) {
    return {
      label: "SoD: On · ready",
      title: "SoD is on and both JARVIS_SOD_APPROVER_PRINCIPALS and JARVIS_SOD_EXECUTOR_PRINCIPALS are non-empty.",
      kind: "ok",
    };
  }
  return {
    label: "SoD: On · incomplete",
    title:
      "SoD is on but an approver or executor principal list is empty — approve/execute return 503 sod_role_map_incomplete.",
    kind: "warn",
  };
}

function buildPostureWarningLine(args: {
  auth: AuthStatusPayload | null;
  tp: TrustPosturePayload | null;
  latestPolicyDenyReason: string | null;
}): string | null {
  const parts: string[] = [];
  const { auth, tp, latestPolicyDenyReason } = args;

  if (
    auth?.authEnabled &&
    auth.identityBindingRequired &&
    !auth.identityBound
  ) {
    parts.push(
      auth.hasSession
        ? "Identity binding required — OIDC not bound on this session (complete bind before governed actions)."
        : "Identity binding required — sign in, then bind OIDC on the session."
    );
  }

  if (tp?.sodEnabled === true && tp.sodRoleMapsReady === false) {
    parts.push(
      "SoD is on but role maps are incomplete (expect 503 on approve/execute until both JARVIS_SOD_* lists are set)."
    );
  }

  if (latestPolicyDenyReason?.trim()) {
    parts.push(`Latest policy deny: ${latestPolicyDenyReason.trim()}`);
  }

  if (!parts.length) return null;
  return parts.join(" · ");
}

function sessionPillClass(kind: "neutral" | "warn" | "ok" | "muted"): string {
  if (kind === "warn") {
    return `${pillBase} border-amber-600/50 bg-amber-500/15 text-amber-950 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100`;
  }
  if (kind === "ok") {
    return `${pillBase} border-emerald-600/40 bg-emerald-500/10 text-emerald-950 dark:border-emerald-500/35 dark:bg-emerald-500/10 dark:text-emerald-100`;
  }
  if (kind === "muted") {
    return `${pillBase} opacity-80`;
  }
  return pillBase;
}

function formatSessionPill(
  s: AuthStatusPayload | null,
): { label: string; title: string; kind: "neutral" | "warn" | "ok" | "muted" } {
  if (s === null) {
    return {
      label: "Session: …",
      title: "Loading session state from GET /api/auth/status",
      kind: "neutral",
    };
  }
  if (!s.authEnabled) {
    return {
      label: "Session: N/A",
      title: "Auth is off — API detail routes are not session-gated.",
      kind: "muted",
    };
  }
  if (!s.hasSession) {
    return {
      label: "Session: None",
      title:
        "No HUD session cookie — approvals, activity, traces, and connector health return 401 until you Establish session (System status → Security). Use the same host as JARVIS_HUD_BASE_URL (e.g. 127.0.0.1).",
      kind: "warn",
    };
  }
  if (!s.stepUpValid) {
    return {
      label: "Session: Limited",
      title:
        "Session cookie present — gated lists and APIs load. Step-up still required for execute (System status → Security) when policy demands it.",
      kind: "neutral",
    };
  }
  return {
    label: "Session: Ready",
    title: "Signed in and step-up valid — session-gated APIs and execute (when policy allows) are unblocked by auth.",
    kind: "ok",
  };
}

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

type TrustPostureStripProps = Readonly<{
  /** Max-width wrapper inside the strip (home vs Activity column width). */
  innerMaxClassName?: string;
}>;

export default function TrustPostureStrip({
  innerMaxClassName = "mx-auto max-w-5xl",
}: TrustPostureStripProps) {
  const [ingressOpenclawEnabled, setIngressOpenclawEnabled] = useState<boolean | null>(null);
  const [openclawAllowed, setOpenclawAllowed] = useState<boolean | null>(null);
  const [authEnabled, setAuthEnabled] = useState<boolean | null>(null);
  const [codeApplyAvailable, setCodeApplyAvailable] = useState<boolean | null>(null);
  const [latestBlockReason, setLatestBlockReason] = useState<string | null>(null);
  const [trustPosture, setTrustPosture] = useState<TrustPosturePayload | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatusPayload | null>(null);

  const fetchAuthStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/status", { credentials: "include" });
      if (!res.ok) {
        setAuthStatus(null);
        return;
      }
      const json = (await res.json()) as Record<string, unknown>;
      if (typeof json.authEnabled !== "boolean") {
        setAuthStatus(null);
        return;
      }
      setAuthStatus({
        authEnabled: json.authEnabled,
        hasSession: json.hasSession === true,
        stepUpValid: json.stepUpValid === true,
        identityBindingRequired: json.identityBindingRequired === true,
        identityBound: json.identityBound === true,
      });
    } catch {
      setAuthStatus(null);
    }
  }, []);

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
    const tick = () => {
      void fetchConfig();
      void fetchAuthStatus();
    };
    const id = setInterval(tick, 5000);
    queueMicrotask(tick);
    return () => clearInterval(id);
  }, [fetchConfig, fetchAuthStatus]);

  useEffect(() => {
    const handler = () => void fetchAuthStatus();
    globalThis.addEventListener("jarvis-refresh", handler);
    return () => globalThis.removeEventListener("jarvis-refresh", handler);
  }, [fetchAuthStatus]);

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
  const sessionPill = formatSessionPill(authStatus);
  const bindingPill = formatBindingPill(authStatus);
  const sodPill = formatSodPill(tp);
  const postureWarningLine = buildPostureWarningLine({
    auth: authStatus,
    tp,
    latestPolicyDenyReason: latestBlockReason,
  });

  const innerMax = innerMaxClassName;

  return (
    <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-2 dark:border-zinc-800 dark:bg-zinc-950">
      <div className={`${innerMax} flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between`}>
        <div className="flex min-w-0 flex-col gap-1">
          <span className="shrink-0 text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-500">
            Trust posture
          </span>
          {tp?.operatorHeadline ? (
            <p className="max-w-full text-xs font-medium leading-snug text-zinc-800 dark:text-zinc-100">
              {tp.operatorHeadline}
            </p>
          ) : null}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:items-end">
          <div className="flex flex-wrap items-center justify-end gap-2">
          <span className={pillBase} title="OpenClaw ingress enabled (secret + env)">
            Ingress: {tri(ingressOpenclawEnabled, "Enabled", "Disabled")}
          </span>
          <span className={pillBase} title="Connector allowlist includes openclaw">
            Connector: {tri(openclawAllowed, "Trusted", "Untrusted")}
          </span>
          <span className={pillBase} title="HUD auth requirement">
            Auth: {tri(authEnabled, "On", "Off")}
          </span>
          <span className={sessionPillClass(bindingPill.kind)} title={bindingPill.title}>
            {bindingPill.label}
          </span>
          {sodPill ? (
            <span className={sessionPillClass(sodPill.kind)} title={sodPill.title}>
              {sodPill.label}
            </span>
          ) : null}
          <span className={sessionPillClass(sessionPill.kind)} title={sessionPill.title}>
            {sessionPill.label}
          </span>
          <span className={pillBase} title="code.apply execution path available">
            Apply: {tri(codeApplyAvailable, "Available", "Blocked")}
          </span>

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
          {postureWarningLine ? (
            <div
              className="max-w-full rounded border border-amber-700/35 bg-amber-500/10 px-2 py-1 text-left text-[11px] leading-snug text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-50"
              title={postureWarningLine}
            >
              {postureWarningLine}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
