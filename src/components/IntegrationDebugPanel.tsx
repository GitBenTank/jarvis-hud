"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactElement } from "react";
import {
  INTEGRATION_ISSUE_LABELS,
  hasIntegrationConfigBlocker,
  type IntegrationIssueCode,
} from "@/lib/integration-readiness-ui";
import type { OpenClawHealthPayload } from "@/lib/openclaw-health";

type ConfigPayload = {
  serverTime?: string;
  jarvisHudBaseUrl?: string | null;
  openclawControlUiUrl?: string | null;
  ingressOpenclawEnabled?: boolean;
  openclawAllowed?: boolean;
  ingressValidationEnabled?: boolean;
  connectorAllowlist?: string[];
  integrationIssues?: string[];
  integrationDebugEnabled?: boolean;
  demoEmailConfigured?: boolean;
  openclawControlUiProbe?: {
    ok: boolean;
    ms: number;
    httpStatus?: number;
    error?: string;
  } | null;
  trustPosture?: {
    executionSurfaceLabel?: string;
    stepUpValid?: boolean | null;
    codeApplyBlockReasons?: string[];
  };
};

function normalizeOrigin(href: string): string {
  try {
    return new URL(href).origin;
  } catch {
    return href.replace(/\/$/, "");
  }
}

function statusPill(
  kind: "ok" | "warn" | "bad" | "neutral",
  label: string
): ReactElement {
  const cls =
    kind === "ok"
      ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200"
      : kind === "warn"
        ? "border-amber-500/50 bg-amber-500/10 text-amber-900 dark:text-amber-200"
        : kind === "bad"
          ? "border-red-500/50 bg-red-500/10 text-red-900 dark:text-red-200"
          : "border-zinc-400/40 bg-zinc-500/10 text-zinc-700 dark:text-zinc-300";
  return (
    <span
      className={`inline-flex shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${cls}`}
    >
      {label}
    </span>
  );
}

export default function IntegrationDebugPanel() {
  const [cfg, setCfg] = useState<ConfigPayload | null>(null);
  const [health, setHealth] = useState<OpenClawHealthPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<number | null>(null);
  /** Set after mount only — avoids SSR vs client mismatch on `window.location`. */
  const [browserOrigin, setBrowserOrigin] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cRes, hRes] = await Promise.all([
        fetch("/api/config", { credentials: "include" }),
        fetch("/api/connectors/openclaw/health", { credentials: "include" }),
      ]);
      if (!cRes.ok) {
        setError(`GET /api/config → ${cRes.status}`);
        setCfg(null);
        setHealth(null);
        return;
      }
      const cJson = (await cRes.json()) as ConfigPayload;
      setCfg(cJson);
      if (hRes.ok) {
        setHealth((await hRes.json()) as OpenClawHealthPayload);
      } else {
        setHealth(null);
      }
      setFetchedAt(Date.now());
    } catch {
      setError("Network error loading debug data");
      setCfg(null);
      setHealth(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setBrowserOrigin(globalThis.location.origin);
  }, []);

  const cfgBase = cfg?.jarvisHudBaseUrl?.trim() || "";
  const originAligned =
    browserOrigin === null ||
    !cfgBase ||
    normalizeOrigin(cfgBase) === normalizeOrigin(browserOrigin);

  const issues = (cfg?.integrationIssues ?? []).filter(
    (c): c is IntegrationIssueCode => c in INTEGRATION_ISSUE_LABELS
  );

  return (
    <details className="group mt-4 rounded-lg border border-zinc-300 bg-white text-sm dark:border-zinc-600 dark:bg-zinc-900">
      <summary className="cursor-pointer list-none px-3 py-2 font-medium text-zinc-800 dark:text-zinc-200 [&::-webkit-details-marker]:hidden">
        <span className="inline-flex items-center gap-2">
          <span className="text-amber-700 dark:text-amber-300">Integration debug</span>
          <span className="text-[10px] font-normal uppercase tracking-wide text-zinc-500">
            operator
          </span>
          {loading ? statusPill("neutral", "loading") : statusPill("neutral", "ready")}
        </span>
      </summary>
      <div className="space-y-3 border-t border-zinc-200 px-3 py-3 dark:border-zinc-700">
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          Read-only checklist: where OpenClaw → Jarvis can break (ingress, allowlist, origin drift,
          activity signal, Control UI reachability). No secrets or proposal bodies are shown.
        </p>
        {error && (
          <p className="rounded border border-red-300 bg-red-50 px-2 py-1 text-xs text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-100">
            {error}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="rounded border border-zinc-400 px-2 py-1 text-xs font-medium hover:bg-zinc-100 dark:border-zinc-500 dark:hover:bg-zinc-800"
          >
            Refresh
          </button>
          {fetchedAt && (
            <span className="text-[11px] text-zinc-500">
              Updated {new Date(fetchedAt).toLocaleTimeString()}
            </span>
          )}
          <Link
            href="/docs/local-verification-openclaw-jarvis"
            className="text-xs font-medium text-amber-700 underline underline-offset-2 hover:text-amber-600 dark:text-amber-400"
          >
            Verification doc
          </Link>
        </div>

        <ul className="space-y-2 text-xs">
          <li className="flex flex-wrap items-start gap-2 border-b border-zinc-100 pb-2 dark:border-zinc-800">
            {statusPill(cfg?.ingressOpenclawEnabled ? "ok" : "bad", "ingress")}
            <div className="min-w-0 flex-1">
              <p className="font-medium text-zinc-800 dark:text-zinc-200">
                OpenClaw ingress on Jarvis
              </p>
              <p className="text-zinc-600 dark:text-zinc-400">
                {cfg?.ingressOpenclawEnabled
                  ? "JARVIS_INGRESS_OPENCLAW_ENABLED and a valid secret (≥32 chars) are set."
                  : "Ingress disabled or secret missing — signed POST /api/ingress/openclaw will fail."}
              </p>
            </div>
          </li>

          <li className="flex flex-wrap items-start gap-2 border-b border-zinc-100 pb-2 dark:border-zinc-800">
            {statusPill(cfg?.openclawAllowed ? "ok" : "bad", "allowlist")}
            <div className="min-w-0 flex-1">
              <p className="font-medium text-zinc-800 dark:text-zinc-200">Connector allowlist</p>
              <p className="break-all text-zinc-600 dark:text-zinc-400">
                {(cfg?.connectorAllowlist?.length ?? 0) > 0
                  ? (cfg?.connectorAllowlist ?? []).join(", ")
                  : "empty — openclaw not allowed"}
              </p>
            </div>
          </li>

          <li className="flex flex-wrap items-start gap-2 border-b border-zinc-100 pb-2 dark:border-zinc-800">
            {statusPill(originAligned ? "ok" : "warn", "origin")}
            <div className="min-w-0 flex-1">
              <p className="font-medium text-zinc-800 dark:text-zinc-200">HUD origin vs env</p>
              <p className="text-zinc-600 dark:text-zinc-400">
                Browser:{" "}
                <code className="text-[11px]">{browserOrigin ?? "—"}</code>
                {cfgBase ? (
                  <>
                    {" "}
                    · JARVIS_HUD_BASE_URL:{" "}
                    <code className="text-[11px]">{cfgBase}</code>
                  </>
                ) : (
                  " · JARVIS_HUD_BASE_URL not set (optional; set to catch drift)"
                )}
              </p>
              {!originAligned && (
                <p className="mt-1 text-amber-800 dark:text-amber-200">
                  Origins differ — OpenClaw must use the same base URL you use in the browser (port
                  and host matter).
                </p>
              )}
            </div>
          </li>

          <li className="flex flex-wrap items-start gap-2 border-b border-zinc-100 pb-2 dark:border-zinc-800">
            {statusPill(
              issues.length === 0
                ? "ok"
                : hasIntegrationConfigBlocker(issues)
                  ? "bad"
                  : "warn",
              "issues"
            )}
            <div className="min-w-0 flex-1">
              <p className="font-medium text-zinc-800 dark:text-zinc-200">
                Integration issues (from server)
              </p>
              {issues.length === 0 ? (
                <p className="text-zinc-600 dark:text-zinc-400">None reported.</p>
              ) : (
                <ul className="mt-1 list-inside list-disc space-y-0.5 text-zinc-600 dark:text-zinc-400">
                  {issues.map((code) => (
                    <li key={code}>{INTEGRATION_ISSUE_LABELS[code]}</li>
                  ))}
                </ul>
              )}
            </div>
          </li>

          <li className="flex flex-wrap items-start gap-2 border-b border-zinc-100 pb-2 dark:border-zinc-800">
            {statusPill(
              health?.status === "connected"
                ? "ok"
                : health?.status === "degraded"
                  ? "warn"
                  : "neutral",
              "signal"
            )}
            <div className="min-w-0 flex-1">
              <p className="font-medium text-zinc-800 dark:text-zinc-200">
                OpenClaw activity signal (disk)
              </p>
              {health ? (
                <p className="text-zinc-600 dark:text-zinc-400">
                  Status: <strong>{health.status}</strong>
                  {health.lastProposalAt && (
                    <>
                      {" "}
                      · last proposal: {health.lastProposalAt}
                    </>
                  )}
                  {health.lastError && (
                    <>
                      {" "}
                      · <span className="text-amber-800 dark:text-amber-200">{health.lastError}</span>
                    </>
                  )}
                </p>
              ) : (
                <p className="text-zinc-600 dark:text-zinc-400">Could not load /api/connectors/openclaw/health.</p>
              )}
              <p className="mt-1 text-[11px] text-zinc-500">
                This reflects recent proposals on disk, not whether the Control UI port responds.
              </p>
            </div>
          </li>

          <li className="flex flex-wrap items-start gap-2 border-b border-zinc-100 pb-2 dark:border-zinc-800">
            {cfg?.openclawControlUiUrl
              ? statusPill("neutral", "link")
              : statusPill("warn", "link")}
            <div className="min-w-0 flex-1">
              <p className="font-medium text-zinc-800 dark:text-zinc-200">Control UI URL (HUD link)</p>
              <p className="break-all text-zinc-600 dark:text-zinc-400">
                {cfg?.openclawControlUiUrl ?? "OPENCLAW_CONTROL_UI_URL not set — HUD link hidden."}
              </p>
              {cfg?.integrationDebugEnabled && cfg.openclawControlUiProbe && (
                <p className="mt-1 text-zinc-600 dark:text-zinc-400">
                  Probe (JARVIS_DEBUG_INTEGRATION):{" "}
                  {cfg.openclawControlUiProbe.ok ? (
                    <>
                      reachable · {cfg.openclawControlUiProbe.ms}ms · HTTP{" "}
                      {cfg.openclawControlUiProbe.httpStatus ?? "—"}
                    </>
                  ) : (
                    <span className="text-red-800 dark:text-red-200">
                      not reachable · {cfg.openclawControlUiProbe.ms}ms —{" "}
                      {cfg.openclawControlUiProbe.error ?? "error"}
                    </span>
                  )}
                </p>
              )}
              {cfg?.integrationDebugEnabled && !cfg?.openclawControlUiUrl && (
                <p className="mt-1 text-[11px] text-zinc-500">
                  Set OPENCLAW_CONTROL_UI_URL to run the Control UI reachability probe.
                </p>
              )}
              {!cfg?.integrationDebugEnabled && (
                <p className="mt-1 text-[11px] text-zinc-500">
                  Set JARVIS_DEBUG_INTEGRATION=true to probe OPENCLAW_CONTROL_UI_URL from the server
                  (local dev only).
                </p>
              )}
            </div>
          </li>

          <li className="flex flex-wrap items-start gap-2 border-b border-zinc-100 pb-2 dark:border-zinc-800">
            {statusPill(cfg?.demoEmailConfigured ? "ok" : "neutral", "email")}
            <div className="min-w-0 flex-1">
              <p className="font-medium text-zinc-800 dark:text-zinc-200">send_email env</p>
              <p className="text-zinc-600 dark:text-zinc-400">
                {cfg?.demoEmailConfigured
                  ? "DEMO_EMAIL_USER and DEMO_EMAIL_PASS are set (execute can send)."
                  : "Demo Gmail vars not both set — execute send_email will error until configured."}
              </p>
            </div>
          </li>

          <li className="flex flex-wrap items-start gap-2">
            {statusPill("neutral", "exec")}
            <div className="min-w-0 flex-1">
              <p className="font-medium text-zinc-800 dark:text-zinc-200">Execution surface</p>
              <p className="text-zinc-600 dark:text-zinc-400">
                {cfg?.trustPosture?.executionSurfaceLabel ?? "—"}
              </p>
              {cfg?.ingressValidationEnabled === false && (
                <p className="mt-1 text-amber-800 dark:text-amber-200">
                  Strict ingress validation is off (JARVIS_INGRESS_OPENCLAW_VALIDATE=false).
                </p>
              )}
            </div>
          </li>
        </ul>
      </div>
    </details>
  );
}
