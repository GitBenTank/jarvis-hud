"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useOpenClawHealth } from "@/lib/use-openclaw-health";

type ConfigIngressSlice = {
  ingressOpenclawEnabled?: boolean;
  openclawAllowed?: boolean;
  openclawControlUiUrl?: string | null;
};

function formatLastSeen(iso: string | null): string | null {
  if (!iso) return null;
  const ms = Date.now() - Date.parse(iso);
  if (!Number.isFinite(ms) || ms < 0) return "just now";
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}s ago`;
  const m = Math.floor(sec / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const labelForStatus = {
  connected: "OpenClaw: Connected",
  degraded: "OpenClaw: Degraded",
  disconnected: "OpenClaw: Disconnected",
} as const;

const badgeClass = {
  connected:
    "border-emerald-600/50 bg-emerald-50 text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-950/40 dark:text-emerald-200",
  degraded:
    "border-amber-600/50 bg-amber-50 text-amber-950 dark:border-amber-500/40 dark:bg-amber-950/30 dark:text-amber-200",
  disconnected:
    "border-red-600/50 bg-red-50 text-red-950 dark:border-red-500/40 dark:bg-red-950/30 dark:text-red-200",
} as const;

export type OpenClawHealthBadgeProps = {
  /** When true, show how proposals reach Jarvis (HTTP API, not the browser). */
  showDataPathExplainer?: boolean;
  /** When true, wrap in a bordered card (main HUD). */
  variant?: "plain" | "card";
};

export default function OpenClawHealthBadge({
  showDataPathExplainer = false,
  variant = "plain",
}: OpenClawHealthBadgeProps) {
  const { data, loading, error, refresh } = useOpenClawHealth();
  const [cfg, setCfg] = useState<ConfigIngressSlice | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/config", { credentials: "include" })
      .then((res) => res.json() as Promise<ConfigIngressSlice>)
      .then((json) => {
        if (cancelled) return;
        const u = json.openclawControlUiUrl;
        setCfg({
          ingressOpenclawEnabled: json.ingressOpenclawEnabled,
          openclawAllowed: json.openclawAllowed,
          openclawControlUiUrl: typeof u === "string" && u.trim() ? u.trim() : null,
        });
      })
      .catch(() => {
        if (!cancelled) setCfg(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const openclawControlUiUrl = cfg?.openclawControlUiUrl ?? null;
  const ingressReady =
    cfg?.ingressOpenclawEnabled === true && cfg?.openclawAllowed === true;

  let receivePathReadyLine = "…";
  if (cfg !== null) {
    receivePathReadyLine = ingressReady
      ? "yes (ingress on + openclaw allowlisted)"
      : "no — fix Trust posture or env (see docs)";
  }

  const status = data?.status ?? "disconnected";
  const lastSeenAt = data?.lastSeenAt;
  const lastSeenText = lastSeenAt ? `Last seen ${formatLastSeen(lastSeenAt)}` : null;
  const detailText = error && !data ? error : data?.lastError ?? null;

  const inner = (
    <>
      {showDataPathExplainer ? (
        <div className="mb-3 space-y-1.5 text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400">
          <p className="m-0">
            <strong className="font-medium text-zinc-700 dark:text-zinc-300">How it connects:</strong> OpenClaw sends
            signed proposals to this Jarvis process at{" "}
            <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[10px] dark:bg-zinc-800">
              POST /api/ingress/openclaw
            </code>
            {" "}
            — The OpenClaw Control UI is only for operating the gateway; it does not proxy proposals into Jarvis.
          </p>
          <p className="m-0 font-mono text-[10px] text-zinc-500 dark:text-zinc-500">
            Receive path ready: {receivePathReadyLine}
          </p>
        </div>
      ) : null}

      {loading && !data ? (
        <div className="inline-flex items-center gap-2 rounded border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
          <span>OpenClaw signal: loading…</span>
        </div>
      ) : (
        <div className="flex flex-wrap items-start gap-2">
          <div
            className={`inline-flex max-w-full flex-col gap-0.5 rounded border px-3 py-1.5 text-xs font-medium ${badgeClass[status]}`}
          >
            <span>{labelForStatus[status]}</span>
            {data?.version ? (
              <span className="text-[10px] font-normal opacity-90">Version: {data.version}</span>
            ) : null}
            {lastSeenText ? (
              <span className="text-[10px] font-normal opacity-90">{lastSeenText}</span>
            ) : null}
            {detailText ? (
              <span className="text-[10px] font-normal opacity-90">{detailText}</span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => refresh()}
            className="rounded border border-zinc-300 px-2 py-1 text-[10px] text-zinc-600 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Refresh
          </button>
          {openclawControlUiUrl ? (
            <a
              href={openclawControlUiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded border border-amber-600/40 bg-amber-950/20 px-2 py-1 text-[10px] font-medium text-amber-800 hover:bg-amber-950/40 dark:border-amber-500/30 dark:text-amber-200"
            >
              Open OpenClaw Control
            </a>
          ) : null}
          <Link
            href="/docs/local-verification-openclaw-jarvis"
            className="rounded border border-zinc-300 px-2 py-1 text-[10px] text-zinc-600 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Verify integration
          </Link>
        </div>
      )}
    </>
  );

  if (variant === "card") {
    return (
      <div className="mb-6 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
          OpenClaw ↔ Jarvis
        </h2>
        {inner}
      </div>
    );
  }

  return <div className="mb-4">{inner}</div>;
}
