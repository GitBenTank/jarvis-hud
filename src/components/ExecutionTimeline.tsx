"use client";

import { useCallback, useEffect, useState } from "react";

type TimelineEntry = {
  id: string;
  at: string;
  label: string;
  status: "llm" | "agent" | "jarvis" | "approval" | "executed";
};

function formatTime(ts: string): string {
  try {
    return new Date(ts).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  } catch {
    return ts;
  }
}

const STATUS_DOT: Record<string, string> = {
  llm: "bg-sky-500",
  agent: "bg-amber-500",
  jarvis: "bg-emerald-500",
  approval: "bg-blue-500",
  executed: "bg-purple-500",
};

type ApprovalLike = {
  id: string;
  traceId?: string;
  createdAt: string;
  status: string;
  executed?: boolean;
  executedAt?: string;
};

type ActionLike = {
  approvalId: string;
  at: string;
};

export default function ExecutionTimeline() {
  const [entries, setEntries] = useState<TimelineEntry[]>([]);

  const buildTimeline = useCallback(
    (
      pending: ApprovalLike[],
      approved: ApprovalLike[],
      actions: ActionLike[]
    ): TimelineEntry[] => {
      const all = [...pending, ...approved];
      const latest = all.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];

      if (!latest) {
        const base = Date.now() - 60000;
        return [
          {
            id: "1",
            at: new Date(base).toISOString(),
            label: "LLM decides action",
            status: "llm",
          },
          {
            id: "2",
            at: new Date(base + 1000).toISOString(),
            label: "OpenClaw proposes",
            status: "agent",
          },
          {
            id: "3",
            at: new Date(base + 2000).toISOString(),
            label: "Jarvis verifies signature",
            status: "jarvis",
          },
          {
            id: "4",
            at: new Date(base + 3000).toISOString(),
            label: "Awaiting approval",
            status: "approval",
          },
        ];
      }

      const created = new Date(latest.createdAt).getTime();
      const execAction = actions.find((a) => a.approvalId === latest.id);
      const executedAt = latest.executedAt ?? execAction?.at;

      const lines: TimelineEntry[] = [
        {
          id: "1",
          at: latest.createdAt,
          label: "LLM decides action",
          status: "llm",
        },
        {
          id: "2",
          at: latest.createdAt,
          label: "OpenClaw proposes",
          status: "agent",
        },
        {
          id: "3",
          at: latest.createdAt,
          label: "Jarvis verifies signature",
          status: "jarvis",
        },
        {
          id: "4",
          at: latest.createdAt,
          label: "Awaiting approval",
          status: "approval",
        },
      ];

      if (latest.status === "approved") {
        lines.push({
          id: "5",
          at: new Date(created + 5000).toISOString(),
          label: "Human approved",
          status: "approval",
        });
      }
      if (latest.executed && executedAt) {
        lines.push({
          id: "6",
          at: executedAt,
          label: "Executed",
          status: "executed",
        });
      }

      return lines;
    },
    []
  );

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
      setEntries(buildTimeline(pending, approved, actions));
    } catch {
      const base = Date.now() - 60000;
      setEntries([
        {
          id: "1",
          at: new Date(base).toISOString(),
          label: "LLM decides action",
          status: "llm",
        },
        {
          id: "2",
          at: new Date(base + 1000).toISOString(),
          label: "OpenClaw proposes",
          status: "agent",
        },
        {
          id: "3",
          at: new Date(base + 2000).toISOString(),
          label: "Jarvis verifies signature",
          status: "jarvis",
        },
        {
          id: "4",
          at: new Date(base + 3000).toISOString(),
          label: "Awaiting approval",
          status: "approval",
        },
      ]);
    }
  }, [buildTimeline]);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 5000);
    return () => clearInterval(id);
  }, [fetchData]);

  useEffect(() => {
    const handler = () => fetchData();
    window.addEventListener("jarvis-refresh", handler);
    return () => window.removeEventListener("jarvis-refresh", handler);
  }, [fetchData]);

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-3 text-lg font-semibold">Execution Timeline</h2>
      <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
        AI proposes → Human approves → Jarvis executes
      </p>
      <div className="relative">
        {entries.map((e, i) => (
          <div key={`${e.id}-${i}`} className="relative flex gap-3">
            <div className="flex w-4 shrink-0 flex-col items-center">
              <div
                className={`mt-2 h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[e.status] ?? "bg-zinc-400"}`}
              />
              {i < entries.length - 1 && (
                <div
                  className="mt-0.5 min-h-[1.5rem] w-px flex-1 bg-zinc-300 dark:bg-zinc-600"
                  aria-hidden
                />
              )}
            </div>
            <div className="min-w-0 flex-1 pb-4">
              <span className="tabular-nums text-xs text-zinc-500 dark:text-zinc-400">
                {formatTime(e.at)}
              </span>
              <span className="ml-2 text-sm text-zinc-700 dark:text-zinc-300">
                {e.label}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
