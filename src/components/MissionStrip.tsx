"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { normalizeAction } from "@/lib/normalize";
import { riskTierForKind, requiresIrreversibleConfirmation } from "@/lib/risk";

type Event = {
  id: string;
  payload: unknown;
  status: string;
  executed?: boolean;
};

type GateState = "green" | "amber" | "red";

function riskTierToOrder(tier: string): number {
  if (tier === "CRITICAL") return 4;
  if (tier === "HIGH") return 3;
  if (tier === "MEDIUM") return 2;
  if (tier === "LOW") return 1;
  return 0;
}

function formatTimeAgo(ts: string): string {
  try {
    const then = new Date(ts).getTime();
    const now = Date.now();
    const sec = Math.floor((now - then) / 1000);
    if (sec < 5) return "just now";
    if (sec < 60) return `${sec}s ago`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    return `${hr}h ago`;
  } catch {
    return "—";
  }
}

/** Compact age string for oldest pending, e.g. "47m" or "2h" */
function formatOldestAge(ms: number): string {
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return "<1m";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const d = Math.floor(hr / 24);
  return `${d}d`;
}

const OLDEST_LOW_MS = 15 * 60 * 1000;   // 15 min
const OLDEST_HIGH_MS = 60 * 60 * 1000;  // 1 hr

function oldestSeverity(ms: number): "low" | "medium" | "high" {
  if (ms < OLDEST_LOW_MS) return "low";
  if (ms < OLDEST_HIGH_MS) return "medium";
  return "high";
}

function computeGateState(
  pending: Event[],
  approved: Event[]
): GateState {
  const approvedNotExecuted = approved.filter((e) => !e.executed);
  const allRelevant = [...pending, ...approvedNotExecuted];
  const count = allRelevant.length;

  if (count === 0) return "green";

  let highestTier = "LOW";
  let anyHighNeedsConfirm = false;
  for (const ev of allRelevant) {
    const n = normalizeAction(ev.payload);
    const tier = riskTierForKind(n.kind);
    if (riskTierToOrder(tier) > riskTierToOrder(highestTier)) {
      highestTier = tier;
    }
    if (
      ev.status === "approved" &&
      !ev.executed &&
      requiresIrreversibleConfirmation(n.kind)
    ) {
      anyHighNeedsConfirm = true;
    }
  }

  if (anyHighNeedsConfirm || highestTier === "HIGH" || highestTier === "CRITICAL") {
    return "red";
  }
  return "amber";
}

type MissionStripData = {
  agentStatus: "ACTIVE" | "IDLE";
  pendingCount: number;
  oldestPendingMs: number | null;
  lastTraceId: string | null;
  lastReceiptAt: string | null;
  gateState: GateState;
};

export default function MissionStrip() {
  const [data, setData] = useState<MissionStripData | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [pendingRes, approvedRes, actionsRes] = await Promise.all([
        fetch("/api/approvals?status=pending"),
        fetch("/api/approvals?status=approved"),
        fetch("/api/actions"),
      ]);
      const pending = (await pendingRes.json()).approvals ?? [];
      const approved = (await approvedRes.json()).approvals ?? [];
      const actions = (await actionsRes.json()).actions ?? [];

      const itemsWithTrace: { traceId: string; at: number }[] = [];
      for (const e of pending as { traceId?: string; id?: string; createdAt?: string }[]) {
        const tid = e.traceId ?? e.id;
        const at = e.createdAt ? new Date(e.createdAt).getTime() : 0;
        if (tid) itemsWithTrace.push({ traceId: String(tid), at });
      }
      for (const e of approved as { traceId?: string; id?: string; createdAt?: string; executedAt?: string }[]) {
        const tid = e.traceId ?? e.id;
        const at = (e.executedAt ?? e.createdAt)
          ? new Date(e.executedAt ?? e.createdAt ?? 0).getTime()
          : 0;
        if (tid) itemsWithTrace.push({ traceId: String(tid), at });
      }
      for (const a of actions as { traceId?: string; at?: string }[]) {
        const tid = (a as { traceId?: string }).traceId ?? "";
        const at = (a as { at?: string }).at ? new Date((a as { at: string }).at).getTime() : 0;
        if (tid) itemsWithTrace.push({ traceId: tid, at });
      }

      const latestTrace = [...itemsWithTrace].sort((a, b) => b.at - a.at)[0];
      const lastActivityAt =
        itemsWithTrace.length > 0 ? Math.max(...itemsWithTrace.map((i) => i.at)) : 0;
      const minutesSinceActivity =
        lastActivityAt > 0 ? (Date.now() - lastActivityAt) / 60_000 : 999;
      const agentStatus =
        pending.length > 0 || minutesSinceActivity < 30 ? "ACTIVE" : "IDLE";

      const latestAction = [...(actions as { at?: string }[])]
        .filter((a) => a.at)
        .sort((a, b) => new Date(b.at ?? 0).getTime() - new Date(a.at ?? 0).getTime())[0];

      const now = Date.now();
      let oldestPendingMs: number | null = null;
      for (const e of pending as { createdAt?: string }[]) {
        if (e.createdAt) {
          const age = now - new Date(e.createdAt).getTime();
          if (age > 0 && (oldestPendingMs === null || age > oldestPendingMs)) {
            oldestPendingMs = age;
          }
        }
      }

      setData({
        agentStatus,
        pendingCount: pending.length,
        oldestPendingMs,
        lastTraceId: latestTrace?.traceId ?? null,
        lastReceiptAt: latestAction?.at ?? null,
        gateState: computeGateState(pending as Event[], approved as Event[]),
      });
    } catch {
      setData(null);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 5000);
    return () => clearInterval(id);
  }, [fetchData]);

  useEffect(() => {
    const handler = () => fetchData();
    globalThis.addEventListener("jarvis-refresh", handler);
    return () => globalThis.removeEventListener("jarvis-refresh", handler);
  }, [fetchData]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  if (!data) {
    return (
      <div className="border-b border-zinc-900 bg-zinc-950 px-4 py-1.5">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-1 text-[10px] uppercase tracking-wider text-zinc-500">
          <span>Loading…</span>
        </div>
      </div>
    );
  }

  const traceShort = data.lastTraceId ? data.lastTraceId.slice(0, 8) : null;
  const hasPending = data.pendingCount > 0;
  const isAmberOrRed = data.gateState === "amber" || data.gateState === "red";
  const traceSecondary = hasPending && traceShort;

  const gateBadge = {
    green: "text-emerald-400",
    amber: "text-amber-400",
    red: "text-red-400",
  };

  const stripContainerClasses = [
    "border-b px-4 py-1.5",
    isAmberOrRed
      ? data.gateState === "red"
        ? "border-red-900/40 bg-red-950/5"
        : "border-amber-900/40 bg-amber-950/5"
      : "border-zinc-900 bg-zinc-950",
  ].join(" ");

  return (
    <div
      className={stripContainerClasses}
      role="status"
      aria-label="Mission strip"
    >
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-1 text-[10px] uppercase tracking-wider text-zinc-500">
        <span>
          Agent:{" "}
          <span
            className={`font-medium ${
              data.agentStatus === "ACTIVE" ? "text-emerald-400" : "text-zinc-500"
            }`}
          >
            {data.agentStatus}
          </span>
        </span>

        <button
          type="button"
          onClick={() => scrollTo("operations-row")}
          className={
            hasPending
              ? "rounded border border-amber-600/50 bg-amber-950/20 px-2 py-0.5 hover:border-amber-500/60 hover:bg-amber-950/30 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
              : "hover:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-500 rounded"
          }
        >
          Queue:{" "}
          <span
            className={
              hasPending ? "font-semibold text-amber-300" : "font-medium text-zinc-300"
            }
          >
            {data.pendingCount}
          </span>
          {hasPending && (
            <>
              {" · "}
              <span
                className={
                  data.oldestPendingMs === null
                    ? "text-zinc-500"
                    : (() => {
                        const sev = oldestSeverity(data.oldestPendingMs);
                        if (sev === "low") return "text-zinc-400";
                        if (sev === "medium") return "text-amber-400";
                        return "text-red-400";
                      })()
                }
              >
                OLDEST {data.oldestPendingMs === null ? "—" : formatOldestAge(data.oldestPendingMs)}
              </span>
            </>
          )}
        </button>

        {traceShort ? (
          <span className={traceSecondary ? "text-zinc-600" : ""}>
            Trace:{" "}
            <Link
              href={`/?trace=${encodeURIComponent(data.lastTraceId!)}`}
              className={`font-mono underline hover:text-zinc-200 ${
                traceSecondary ? "text-zinc-500" : "text-zinc-300"
              }`}
            >
              {traceShort}
            </Link>
          </span>
        ) : (
          <span>Trace: <span className="font-mono text-zinc-600">—</span></span>
        )}

        <button
          type="button"
          onClick={() => scrollTo("actions-panel")}
          className="hover:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-500 rounded"
        >
          Receipt:{" "}
          {data.lastReceiptAt ? (
            <span className="text-zinc-300">{formatTimeAgo(data.lastReceiptAt)}</span>
          ) : (
            <span className="text-zinc-600">—</span>
          )}
        </button>

        <span>
          Mode: <span className="text-zinc-400">DRY RUN</span>
        </span>

        <span>
          Gate:{" "}
          <span className={`font-medium ${gateBadge[data.gateState]}`}>
            {data.gateState.toUpperCase()}
          </span>
        </span>
      </div>
    </div>
  );
}
