"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ConfigJson = {
  jarvisHudBaseUrl?: string | null;
};

/**
 * When `JARVIS_HUD_BASE_URL` is set but its origin differs from where the HUD is actually
 * loaded (`globalThis.location.origin`), show a non-blocking operator hint (local dev drift).
 */
export default function HudOriginMismatchBanner() {
  const [mismatch, setMismatch] = useState<{
    viewedOrigin: string;
    configuredBaseUrl: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/config", { credentials: "include" });
        if (!res.ok || cancelled) return;
        const cfg = (await res.json()) as ConfigJson;
        const configured = cfg.jarvisHudBaseUrl?.trim();
        if (!configured) return;
        let configuredOrigin: string;
        try {
          configuredOrigin = new URL(configured).origin;
        } catch {
          return;
        }
        const viewed = globalThis.location.origin;
        if (configuredOrigin === viewed) return;
        if (cancelled) return;
        setMismatch({ viewedOrigin: viewed, configuredBaseUrl: configured });
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!mismatch) return null;

  return (
    <aside
      aria-live="polite"
      className="border-b border-amber-400/40 bg-amber-50 px-3 py-2 text-xs text-amber-950 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-100"
    >
      <p className="font-medium">Origin mismatch</p>
      <dl className="mt-1.5 space-y-0.5 font-mono text-[11px] leading-snug text-amber-950 dark:text-amber-100">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <dt className="w-20 shrink-0 font-sans text-[10px] font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300/90">
            Viewed
          </dt>
          <dd className="min-w-0 break-all">{mismatch.viewedOrigin}</dd>
        </div>
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <dt className="w-20 shrink-0 font-sans text-[10px] font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300/90">
            Configured
          </dt>
          <dd className="min-w-0 break-all">{mismatch.configuredBaseUrl}</dd>
        </div>
      </dl>
      <p className="mt-2 leading-relaxed">
        <code className="rounded bg-amber-100/80 px-1 py-0.5 font-mono text-[11px] dark:bg-amber-900/50">
          JARVIS_HUD_BASE_URL
        </code>{" "}
        does not match where this tab is loaded. <strong className="font-semibold">Runtime wins</strong>{" "}
        — align OpenClaw, scripts, and local env to the <span className="font-medium">Viewed</span>{" "}
        origin.
      </p>
      <p className="mt-1.5 text-[11px] text-amber-900/90 dark:text-amber-200/90">
        Reference:{" "}
        <Link
          href="/docs/setup/local-dev-truth-map"
          className="font-medium underline underline-offset-2 hover:text-amber-950 dark:hover:text-amber-50"
        >
          Local dev truth map
        </Link>
      </p>
    </aside>
  );
}
