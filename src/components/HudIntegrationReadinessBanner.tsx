"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  INTEGRATION_ISSUE_LABELS,
  INTEGRATION_RULE_CONFIG_BLOCKED,
  INTEGRATION_RULE_STALE_OR_SIGNAL,
  hasIntegrationConfigBlocker,
  type IntegrationIssueCode,
} from "@/lib/integration-readiness-ui";

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
  const isDemoPath =
    pathname === "/demo" || (pathname?.startsWith("/demo/") ?? false);

  const [state, setState] = useState<{
    issues: IntegrationIssueCode[];
    openclawControlUiUrl: string | null;
  } | null>(null);

  useEffect(() => {
    if (isDemoPath) return;
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
  }, [isDemoPath]);

  if (isDemoPath) return null;
  if (!state || state.issues.length === 0) return null;

  const ruleText = hasIntegrationConfigBlocker(state.issues)
    ? INTEGRATION_RULE_CONFIG_BLOCKED
    : INTEGRATION_RULE_STALE_OR_SIGNAL;

  return (
    <aside
      aria-live="polite"
      className="border-b border-red-400/50 bg-red-50 px-3 py-2 text-xs text-red-950 dark:border-red-500/35 dark:bg-red-950/35 dark:text-red-100"
    >
      <ul className="list-none space-y-0.5 font-mono text-[11px] leading-snug text-red-950 dark:text-red-100">
        {state.issues.map((code) => (
          <li key={code}>{INTEGRATION_ISSUE_LABELS[code]}</li>
        ))}
      </ul>
      <p className="mt-2 font-medium leading-relaxed text-red-950 dark:text-red-100">
        {ruleText}
      </p>
      <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-red-900/95 dark:text-red-200/90">
        <Link
          href="/docs/setup/env"
          className="font-medium underline underline-offset-2 hover:text-red-950 dark:hover:text-red-50"
        >
          Environment variables
        </Link>
        <Link
          href="/docs/local-verification-openclaw-jarvis"
          className="font-medium underline underline-offset-2 hover:text-red-950 dark:hover:text-red-50"
        >
          Verify OpenClaw + Jarvis
        </Link>
        {state.openclawControlUiUrl ? (
          <a
            href={state.openclawControlUiUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline underline-offset-2 hover:text-red-950 dark:hover:text-red-50"
          >
            Open OpenClaw Control
          </a>
        ) : null}
      </p>
    </aside>
  );
}
