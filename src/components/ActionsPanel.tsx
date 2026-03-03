"use client";

import { useCallback, useEffect, useState } from "react";
import Badge from "./Badge";

type ActionEntry = {
  id: string;
  traceId?: string;
  at: string;
  kind: string;
  approvalId: string;
  status: string;
  summary: string;
  outputPath?: string;
  artifactPath?: string;
};

type ActionsResponse = {
  dateKey: string;
  actions: ActionEntry[];
};

export default function ActionsPanel() {
  const [data, setData] = useState<ActionsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchActions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/actions");
      const json = await res.json();
      setData(json);
    } catch {
      setData({ dateKey: "", actions: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActions();
    const id = setInterval(fetchActions, 5000);
    return () => clearInterval(id);
  }, [fetchActions]);

  useEffect(() => {
    const handler = () => fetchActions();
    window.addEventListener("jarvis-refresh", handler);
    return () => window.removeEventListener("jarvis-refresh", handler);
  }, [fetchActions]);

  const actions = data?.actions ?? [];

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          Executed Actions (Receipts) {data?.dateKey && `(${data.dateKey})`}
        </h2>
        <button
          onClick={fetchActions}
          disabled={loading}
          className="rounded bg-zinc-200 px-3 py-1.5 text-sm hover:bg-zinc-300 disabled:opacity-50 dark:bg-zinc-700 dark:hover:bg-zinc-600"
        >
          Refresh
        </button>
      </div>

      {loading && actions.length === 0 && (
        <p className="text-sm text-zinc-500">Loading…</p>
      )}
      {!loading && actions.length === 0 && (
        <>
          <p className="text-sm text-zinc-500">No executed actions yet.</p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Every execution produces an artifact and an auditable log entry.
          </p>
        </>
      )}
      {actions.length > 0 && (
        <>
          <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
            Every execution produces an artifact and an auditable log entry.
          </p>
          <ul className="space-y-2">
          {actions.map((action) => (
            <li
              key={action.id}
              className="flex items-center justify-between gap-2 rounded border border-zinc-200 p-3 text-sm dark:border-zinc-700"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{action.kind}</span>
                  <span className="text-zinc-500">·</span>
                  <span className="text-zinc-600 dark:text-zinc-400">
                    {action.summary || "(no summary)"}
                  </span>
                  <Badge variant="dry_run">DRY RUN</Badge>
                </div>
                <p className="mt-1 text-xs text-zinc-400">
                  {action.at} · {action.status}
                </p>
              </div>
            </li>
          ))}
        </ul>
        </>
      )}
    </div>
  );
}
