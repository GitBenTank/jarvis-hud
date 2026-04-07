"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ActivityEvent } from "@/lib/activity-types";

function formatTime(ts: string): string {
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  } catch {
    return ts;
  }
}

function formatDateTime(ts: string): string {
  try {
    const d = new Date(ts);
    return d.toLocaleString();
  } catch {
    return ts;
  }
}

function verbClass(verb: ActivityEvent["verb"]): string {
  if (verb === "Blocked") return "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300";
  if (verb === "Approved") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300";
  if (verb === "Executed") return "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300";
  if (verb === "Waiting") return "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300";
  return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
}

function traceShort(traceId: string): string {
  return traceId.length > 12 ? `${traceId.slice(0, 12)}...` : traceId;
}

export default function AgentActivityPanel() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchActivity = async () => {
      try {
        const res = await fetch("/api/activity/stream");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as ActivityEvent[];
        if (!mounted) return;
        const sorted = [...data].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
        setEvents(sorted);
        setError(null);
      } catch {
        if (!mounted) return;
        setError("Failed to load activity stream.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    queueMicrotask(() => fetchActivity());
    const id = setInterval(fetchActivity, 5000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, ActivityEvent[]>();
    for (const event of events) {
      const current = map.get(event.traceId) ?? [];
      current.push(event);
      map.set(event.traceId, current);
    }
    return Array.from(map.entries()).map(([traceId, list]) => ({ traceId, events: list }));
  }, [events]);

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-3 text-lg font-semibold">Agent Activity</h2>
      <div className="space-y-4 border-t border-zinc-200 pt-3 dark:border-zinc-700">
        {loading && events.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading activity...</p>
        ) : null}
        {error ? (
          <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
        ) : null}
        {!loading && !error && grouped.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No control story yet.</p>
        ) : null}

        {grouped.map((group) => (
          <div key={group.traceId} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Trace {traceShort(group.traceId)}
              </div>
              <Link
                href={`/?trace=${encodeURIComponent(group.traceId)}`}
                className="text-xs font-medium text-amber-600 hover:text-amber-500 dark:text-amber-400 dark:hover:text-amber-300"
              >
                Open trace
              </Link>
            </div>

            <div className="space-y-2 border-l-2 border-zinc-200 pl-3 dark:border-zinc-700">
              {group.events.map((event) => (
                <article key={event.id} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`rounded px-2 py-0.5 text-[11px] font-semibold ${verbClass(event.verb)}`}>
                      {event.verb}
                    </span>
                    <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                      {event.label}
                    </span>
                    <span
                      className="text-xs tabular-nums text-zinc-500 dark:text-zinc-400"
                      title={formatDateTime(event.timestamp)}
                    >
                      {formatTime(event.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">{event.summary}</p>
                  {event.reason ? (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Why: <span className="font-medium">{event.reason.label}</span> - {event.reason.summary}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
