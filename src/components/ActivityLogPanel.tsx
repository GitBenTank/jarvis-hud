"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

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
  commitHash?: string | null;
  rollbackCommand?: string | null;
  filesChanged?: string[];
  statsText?: string | null;
  statsJson?: { filesChangedCount: number; insertions: number; deletions: number } | null;
  repoHeadBefore?: string | null;
  repoHeadAfter?: string | null;
};

type ActionsResponse = {
  dateKey: string;
  actions: ActionEntry[];
};

function formatTimestamp(at: string): string {
  try {
    const d = new Date(at);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return at;
  }
}

export default function ActivityLogPanel() {
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
    queueMicrotask(() => fetchActions());
    const id = setInterval(fetchActions, 5000);
    return () => clearInterval(id);
  }, [fetchActions]);

  useEffect(() => {
    const handler = () => fetchActions();
    globalThis.addEventListener("jarvis-refresh", handler);
    return () => globalThis.removeEventListener("jarvis-refresh", handler);
  }, [fetchActions]);

  const actions = data?.actions ?? [];

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-3 text-lg font-semibold">Today&apos;s Activity (Receipts)</h2>

      {loading && actions.length === 0 && (
        <p className="text-sm text-zinc-500">Loading…</p>
      )}
      {!loading && actions.length === 0 && (
        <p className="text-sm text-zinc-500">No receipts yet today.</p>
      )}
      {actions.length > 0 && (
        <ul className="space-y-3">
          {actions.map((action) => (
            <li
              key={action.id}
              className="rounded border border-zinc-200 p-3 text-sm dark:border-zinc-700"
            >
              <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                <span>{formatTimestamp(action.at)}</span>
                <span>·</span>
                <span className="font-medium">{action.kind}</span>
                <span>·</span>
                <span>{action.status}</span>
                {action.traceId && (
                  <>
                    <span>·</span>
                    <Link
                      href={`/?trace=${encodeURIComponent(action.traceId)}`}
                      className="font-mono underline hover:text-zinc-300"
                    >
                      {action.traceId.slice(0, 8)}…
                    </Link>
                  </>
                )}
              </div>
              {action.summary && (
                <p className="mt-1.5 text-zinc-700 dark:text-zinc-300">{action.summary}</p>
              )}
              {(action.outputPath ?? action.artifactPath) && (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <code className="flex-1 truncate rounded bg-zinc-100 px-2 py-1 text-xs dark:bg-zinc-800">
                      {action.outputPath ?? action.artifactPath}
                    </code>
                    <button
                      type="button"
                      onClick={() =>
                        navigator.clipboard.writeText(action.outputPath ?? action.artifactPath ?? "")
                      }
                      className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
                    >
                      Copy
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await fetch("/api/os/open", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              path: action.outputPath ?? action.artifactPath,
                              app: "finder",
                            }),
                          });
                        } catch {
                          // ignore
                        }
                      }}
                      className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
                    >
                      Open in Finder
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await fetch("/api/os/open", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              path: action.outputPath ?? action.artifactPath,
                              app: "cursor",
                            }),
                          });
                        } catch {
                          // ignore
                        }
                      }}
                      className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
                    >
                      Open in Cursor
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
