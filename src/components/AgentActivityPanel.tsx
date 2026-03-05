"use client";

import { useEffect, useState } from "react";

type ActivityEvent = {
  id: string;
  at: string;
  message: string;
};

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

const MOCK_EVENTS: Omit<ActivityEvent, "at">[] = [
  { id: "1", message: "LLM reasoning" },
  { id: "2", message: "OpenClaw proposes action" },
  { id: "3", message: "Jarvis verifies signature" },
  { id: "4", message: "Awaiting human approval" },
];

export default function AgentActivityPanel() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);

  useEffect(() => {
    const base = Date.now() - 10000;
    const initial: ActivityEvent[] = MOCK_EVENTS.map((e, i) => ({
      ...e,
      at: new Date(base + i * 1000).toISOString(),
    }));
    setEvents(initial);

    const handler = () => {
      setEvents((prev) => [
        ...prev,
        {
          id: `ex-${Date.now()}`,
          at: new Date().toISOString(),
          message: "Execution complete",
        },
      ]);
    };
    window.addEventListener("jarvis-refresh", handler);
    return () => window.removeEventListener("jarvis-refresh", handler);
  }, []);

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-3 text-lg font-semibold">Agent Activity</h2>
      <div className="space-y-1 border-t border-zinc-200 pt-3 dark:border-zinc-700">
        {events.map((e) => (
          <div
            key={e.id}
            className="flex items-baseline gap-3 font-mono text-sm"
          >
            <span className="shrink-0 tabular-nums text-zinc-500 dark:text-zinc-400">
              {formatTime(e.at)}
            </span>
            <span className="text-zinc-700 dark:text-zinc-300">{e.message}</span>
          </div>
        ))}
        <div
          className="flex items-baseline gap-3 font-mono text-sm text-zinc-500 dark:text-zinc-400"
          aria-hidden
        >
          <span className="w-8 shrink-0" />
          <span className="inline-flex items-baseline">
            <span className="animate-pulse">_</span>
          </span>
        </div>
      </div>
    </div>
  );
}
