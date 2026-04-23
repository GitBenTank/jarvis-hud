"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  INTEGRATION_ISSUE_LABELS,
  INTEGRATION_RULE_CONFIG_BLOCKED,
  INTEGRATION_RULE_OPENCLAW_RECENCY_SIGNAL,
  hasIntegrationConfigBlocker,
  type IntegrationIssueCode,
} from "@/lib/integration-readiness-ui";
import { isHudChromelessPath } from "@/lib/hud-chromeless-routes";

type ConfigJson = {
  integrationIssues?: string[];
  openclawControlUiUrl?: string | null;
};

function isIssueCode(s: string): s is IntegrationIssueCode {
  return s in INTEGRATION_ISSUE_LABELS;
}

/**
 * Mismatch-only: shows when server-known OpenClaw ingress integration checks fail.
 * No “all green” state — absence of this banner means nothing to fix here.
 */
export default function HudIntegrationReadinessBanner() {
  const pathname = usePathname();
  const chromeless = isHudChromelessPath(pathname);

  const [state, setState] = useState<{
    issues: IntegrationIssueCode[];
    openclawControlUiUrl: string | null;
  } | null>(null);

  useEffect(() => {
    if (chromeless) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/config", { credentials: "include" });
        if (!res.ok || cancelled) return;
        const cfg = (await res.json()) as ConfigJson;
        const raw = cfg.integrationIssues;
        if (!Array.isArray(raw) || raw.length === 0) {
          if (!cancelled) setState(null);
          return;
        }
        const issues = raw.filter(isIssueCode);
        if (issues.length === 0) {
          if (!cancelled) setState(null);
          return;
        }
        const u = cfg.openclawControlUiUrl;
        const openclawControlUiUrl =
          typeof u === "string" && u.trim() ? u.trim() : null;
        if (!cancelled) setState({ issues, openclawControlUiUrl });
      } catch {
        if (!cancelled) setState(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chromeless]);

  if (chromeless) return null;
  if (!state || state.issues.length === 0) return null;

  const configBlocked = hasIntegrationConfigBlocker(state.issues);
  const onlyRecencySignal =
    !configBlocked && state.issues.every((c) => c === "OPENCLAW_STALE");

  const ruleText = configBlocked
    ? INTEGRATION_RULE_CONFIG_BLOCKED
    : INTEGRATION_RULE_OPENCLAW_RECENCY_SIGNAL;

  const panelClass = onlyRecencySignal
    ? "border-b border-amber-500/45 bg-amber-50 px-3 py-2 text-xs text-amber-950 dark:border-amber-500/35 dark:bg-amber-950/30 dark:text-amber-50"
    : "border-b border-red-400/50 bg-red-50 px-3 py-2 text-xs text-red-950 dark:border-red-500/35 dark:bg-red-950/35 dark:text-red-100";

  const bodyClass = onlyRecencySignal
    ? "text-amber-950 dark:text-amber-50"
    : "text-red-950 dark:text-red-100";

  const linkClass = onlyRecencySignal
    ? "font-medium underline underline-offset-2 hover:text-amber-950 dark:hover:text-amber-100"
    : "font-medium underline underline-offset-2 hover:text-red-950 dark:hover:text-red-50";

  return (
    <aside aria-live="polite" className={panelClass}>
      <ul className={`list-none space-y-0.5 font-mono text-[11px] leading-snug ${bodyClass}`}>
        {state.issues.map((code) => (
          <li key={code}>{INTEGRATION_ISSUE_LABELS[code]}</li>
        ))}
      </ul>
      <p className={`mt-2 font-medium leading-relaxed ${bodyClass}`}>{ruleText}</p>
      <p
        className={`mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] ${
          onlyRecencySignal
            ? "text-amber-900/90 dark:text-amber-100/85"
            : "text-red-900/95 dark:text-red-200/90"
        }`}
      >
        <Link href="/docs/setup/env" className={linkClass}>
          Environment variables
        </Link>
        <Link href="/docs/local-verification-openclaw-jarvis" className={linkClass}>
          Verify OpenClaw + Jarvis
        </Link>
        {state.openclawControlUiUrl ? (
          <a
            href={state.openclawControlUiUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            Open OpenClaw Control
          </a>
        ) : null}
      </p>
    </aside>
  );
}
