"use client";

import { useOpenClawHealth } from "@/lib/use-openclaw-health";

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

export default function OpenClawHealthBadge() {
  const { data, loading, error, refresh } = useOpenClawHealth();

  if (loading && !data) {
    return (
      <div className="mb-4 inline-flex items-center gap-2 rounded border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
        <span>OpenClaw: …</span>
      </div>
    );
  }

  const status = data?.status ?? "disconnected";
  const lastSeenText =
    data?.lastSeenAt != null
      ? `Last seen ${formatLastSeen(data.lastSeenAt)}`
      : null;
  const detailText =
    error && !data ? error : data?.lastError ?? null;

  return (
    <div className="mb-4 flex flex-wrap items-start gap-2">
      <div
        className={`inline-flex max-w-full flex-col gap-0.5 rounded border px-3 py-1.5 text-xs font-medium ${badgeClass[status]}`}
      >
        <span>{labelForStatus[status]}</span>
        {data?.version ? (
          <span className="text-[10px] font-normal opacity-90">
            Version: {data.version}
          </span>
        ) : null}
        {lastSeenText ? (
          <span className="text-[10px] font-normal opacity-90">
            {lastSeenText}
          </span>
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
    </div>
  );
}
