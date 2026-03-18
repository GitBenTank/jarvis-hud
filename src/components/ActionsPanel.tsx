"use client";

import { useCallback, useEffect, useState } from "react";
import { isRecoveryClass } from "@/lib/recovery-shared";
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
  verificationStatus?: "pending" | "verified" | "failed";
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

  const handleMarkVerification = useCallback(
    async (approvalId: string, status: "verified" | "failed") => {
      try {
        const res = await fetch("/api/recovery/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ approvalId, status }),
        });
        if (res.ok) {
          fetchActions();
          window.dispatchEvent(new CustomEvent("jarvis-refresh"));
        }
      } catch {
        // ignore
      }
    },
    [fetchActions]
  );

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
          {actions.map((action) => {
            const isRecovery = isRecoveryClass(action.kind);
            const runbookPath = action.outputPath ?? action.artifactPath ?? null;
            const vStatus = action.verificationStatus ?? "pending";
            return (
              <li
                key={action.id}
                className={`flex items-center justify-between gap-2 rounded border p-3 text-sm ${
                  isRecovery
                    ? "border-amber-600/40 bg-amber-50/30 dark:border-amber-500/30 dark:bg-amber-950/20"
                    : "border-zinc-200 dark:border-zinc-700"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {isRecovery && (
                      <span className="rounded border border-amber-600/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:border-amber-500/50 dark:text-amber-400">
                        Recovery
                      </span>
                    )}
                    {isRecovery && (
                      <span
                        className={`rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                          vStatus === "verified"
                            ? "border-emerald-600/60 bg-emerald-100/80 text-emerald-800 dark:border-emerald-500/50 dark:bg-emerald-950/40 dark:text-emerald-400"
                            : vStatus === "failed"
                              ? "border-red-600/60 bg-red-100/80 text-red-800 dark:border-red-500/50 dark:bg-red-950/40 dark:text-red-400"
                              : "border-amber-600/40 bg-amber-100/60 text-amber-800 dark:border-amber-500/40 dark:bg-amber-950/30 dark:text-amber-400"
                        }`}
                      >
                        {vStatus}
                      </span>
                    )}
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
                  {isRecovery && (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-450">
                        Runbook:
                      </span>
                      <code className="flex-1 min-w-0 truncate rounded bg-zinc-100 px-2 py-1 text-xs dark:bg-zinc-800">
                        {runbookPath ?? "—"}
                      </code>
                      {runbookPath && (
                        <button
                          type="button"
                          onClick={() => navigator.clipboard.writeText(runbookPath)}
                          className="rounded border border-zinc-300 px-2 py-0.5 text-xs hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-700"
                        >
                          Copy
                        </button>
                      )}
                    </div>
                  )}
                  {isRecovery && vStatus === "pending" && (
                    <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-amber-600/30 pt-2 dark:border-amber-500/20">
                      <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-450">
                        Mark outcome:
                      </span>
                      <button
                        type="button"
                        onClick={() => handleMarkVerification(action.approvalId, "verified")}
                        className="rounded border border-emerald-600 px-2 py-0.5 text-xs text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                      >
                        Verified
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMarkVerification(action.approvalId, "failed")}
                        className="rounded border border-red-600 px-2 py-0.5 text-xs text-red-700 hover:bg-red-50 dark:border-red-500 dark:text-red-400 dark:hover:bg-red-950/30"
                      >
                        Failed
                      </button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        </>
      )}
    </div>
  );
}
