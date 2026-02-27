"use client";

import { useCallback, useEffect, useState } from "react";

type StatusData = {
  dateKey: string;
  pendingCount: number;
  approvedReadyCount: number;
  actionsCount: number;
};

type ResetResult = {
  dateKey: string;
  archived: {
    archiveDir?: string;
    events?: string;
    actions?: string;
    publishQueueDir?: string;
  };
};

type ConfigData = {
  jarvisRoot: string;
};

export default function SystemStatus() {
  const [data, setData] = useState<StatusData | null>(null);
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [resetModal, setResetModal] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetResult, setResetResult] = useState<ResetResult | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const [pendingRes, approvedRes, actionsRes, configRes] = await Promise.all([
        fetch("/api/approvals?status=pending"),
        fetch("/api/approvals?status=approved"),
        fetch("/api/actions"),
        fetch("/api/config"),
      ]);
      const pending = await pendingRes.json();
      const approved = await approvedRes.json();
      const actions = await actionsRes.json();
      const configData = await configRes.json();

      setConfig(configData.jarvisRoot ? configData : null);

      const approvedReady = (approved.approvals ?? []).filter(
        (e: { executed?: boolean }) => !e.executed
      ).length;

      setData({
        dateKey: pending.dateKey ?? approved.dateKey ?? actions.dateKey ?? "-",
        pendingCount: (pending.approvals ?? []).length,
        approvedReadyCount: approvedReady,
        actionsCount: (actions.actions ?? []).length,
      });
    } catch {
      setData(null);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const id = setInterval(fetchStatus, 5000);
    return () => clearInterval(id);
  }, [fetchStatus]);

  useEffect(() => {
    const handler = () => fetchStatus();
    window.addEventListener("jarvis-refresh", handler);
    return () => window.removeEventListener("jarvis-refresh", handler);
  }, [fetchStatus]);

  const handleResetConfirm = useCallback(async () => {
    setResetting(true);
    setResetError(null);
    try {
      const res = await fetch("/api/reset/today", {
        method: "POST",
        headers: { "x-jarvis-reset": "YES" },
      });
      const json = await res.json();
      if (res.ok) {
        setResetResult(json);
        setResetModal(false);
        window.dispatchEvent(new CustomEvent("jarvis-refresh"));
        setTimeout(() => setResetResult(null), 5000);
      } else {
        setResetError(json.error ?? "Reset failed");
      }
    } catch {
      setResetError("Reset failed");
    } finally {
      setResetting(false);
    }
  }, []);

  if (!data) {
    return (
      <div className="mb-6 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold">System Status</h2>
        <p className="mt-2 text-sm text-zinc-500">Loading…</p>
      </div>
    );
  }

  const archivePaths = resetResult?.archived
    ? Object.entries(resetResult.archived)
        .filter(([, v]) => v)
        .map(([k, v]) => v as string)
    : [];

  return (
    <>
      <div className="mb-6 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">System Status</h2>
          <button
            type="button"
            onClick={() => setResetModal(true)}
            className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
          >
            Reset today (archive)
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-sm">
          {typeof window !== "undefined" && (
            <div>
              <span className="font-medium text-zinc-500">Server:</span>{" "}
              <span className="font-mono text-xs text-zinc-700 dark:text-zinc-300">
                {window.location.origin}
              </span>
              {config?.jarvisRoot && (
                <>
                  {" · "}
                  <span className="font-mono text-xs text-zinc-600 dark:text-zinc-400" title="JARVIS_ROOT">
                    {config.jarvisRoot}
                  </span>
                </>
              )}
            </div>
          )}
          <div>
            <span className="font-medium text-zinc-500">Date:</span>{" "}
            <span className="text-zinc-800 dark:text-zinc-200">{data.dateKey}</span>
          </div>
          <div>
            <span className="font-medium text-zinc-500">Proposals awaiting:</span>{" "}
            <span className="text-zinc-800 dark:text-zinc-200">{data.pendingCount}</span>
          </div>
          <div>
            <span className="font-medium text-zinc-500">Authorized awaiting:</span>{" "}
            <span className="text-zinc-800 dark:text-zinc-200">{data.approvedReadyCount}</span>
          </div>
          <div>
            <span className="font-medium text-zinc-500">Actions today:</span>{" "}
            <span className="text-zinc-800 dark:text-zinc-200">{data.actionsCount}</span>
          </div>
        </div>

        {resetResult && (
          <div className="mt-3 rounded border border-emerald-200 bg-emerald-50 p-3 text-sm dark:border-emerald-800 dark:bg-emerald-900/30">
            <p className="font-medium">Archived successfully</p>
            {archivePaths.length > 0 && (
              <ul className="mt-1 list-inside list-disc text-zinc-600 dark:text-zinc-400">
                {archivePaths.map((p) => (
                  <li key={p} className="truncate font-mono text-xs">
                    {p}
                  </li>
                ))}
              </ul>
            )}
            {resetResult.archived?.archiveDir && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    await fetch("/api/os/open", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        path: resetResult.archived.archiveDir,
                        app: "finder",
                      }),
                    });
                  } catch {
                    // ignore
                  }
                }}
                className="mt-2 rounded border border-emerald-600 px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-100 dark:border-emerald-500 dark:text-emerald-300 dark:hover:bg-emerald-900/50"
              >
                Open archive folder
              </button>
            )}
          </div>
        )}
      </div>

      {resetModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          role="presentation"
        >
          <div
            className="relative max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
            role="dialog"
            aria-modal="true"
          >
            <h3 className="text-lg font-semibold">Reset today?</h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              This archives today&apos;s demo data. Nothing is deleted.
            </p>
            {resetError && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                {resetError}
              </p>
            )}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setResetModal(false);
                  setResetError(null);
                }}
                disabled={resetting}
                className="rounded border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetConfirm}
                disabled={resetting}
                className="rounded bg-amber-600 px-4 py-2 text-sm text-white hover:bg-amber-700 disabled:opacity-50"
              >
                {resetting ? "Archiving…" : "Archive"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
