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
  authEnabled?: boolean;
};

type AlfredStatusData = {
  latestScanAt: string | null;
  proposalsCreatedLastScan: number;
  proposalsSuppressedLastScan: number;
  nextScanAt: string | null;
  outcome: "created" | "suppressed" | "none" | "unknown";
};

type IncidentItem = {
  approvalId: string;
  traceId: string;
  recoveryClass: string;
  symptom: string;
  status: "pending" | "failed";
  at: string;
};

type IncidentGroup = {
  recoveryClass: string;
  items: IncidentItem[];
};

type AuthStatusData = {
  authEnabled: boolean;
  hasSession: boolean;
  stepUpValid: boolean;
};

function formatFreshness(ms: number): string {
  const sec = Math.floor((Date.now() - ms) / 1000);
  if (sec < 5) return "just now";
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  return `${min}m ago`;
}

function formatAlfredTime(iso: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    const diffMin = Math.round(diffMs / 60_000);
    if (diffMin < 0) return "past";
    if (diffMin < 1) return "soon";
    if (diffMin < 60) return `in ${diffMin}m`;
    const h = Math.floor(diffMin / 60);
    return `in ${h}h`;
  } catch {
    return iso;
  }
}

function formatAlfredTimestamp(iso: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatIncidentAge(at: string): string {
  try {
    const then = new Date(at).getTime();
    const diffSec = Math.floor((Date.now() - then) / 1000);
    if (diffSec < 60) return "just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m`;
    const diffHr = Math.floor(diffMin / 60);
    const remainderMin = diffMin % 60;
    if (diffHr < 24) return `${diffHr}h ${remainderMin}m`;
    const diffDay = Math.floor(diffHr / 24);
    const remainderHr = diffHr % 24;
    return `${diffDay}d ${remainderHr}h`;
  } catch {
    return "—";
  }
}

export default function SystemStatus() {
  const [data, setData] = useState<StatusData | null>(null);
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<number | null>(null);
  const [, setNow] = useState(Date.now());
  const [authStatus, setAuthStatus] = useState<AuthStatusData | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [resetModal, setResetModal] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetResult, setResetResult] = useState<ResetResult | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [alfredStatus, setAlfredStatus] = useState<AlfredStatusData | null>(null);
  const [incidentsData, setIncidentsData] = useState<{ incidents: IncidentGroup[] } | null>(null);

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

      try {
        const alfredRes = await fetch("/api/alfred/status");
        if (alfredRes.ok) {
          const alfredData = await alfredRes.json();
          if (!alfredData.error) setAlfredStatus(alfredData);
          else setAlfredStatus(null);
        } else {
          setAlfredStatus(null);
        }
      } catch {
        setAlfredStatus(null);
      }

      try {
        const incidentsRes = await fetch("/api/incidents");
        if (incidentsRes.ok) {
          const incidentsJson = await incidentsRes.json();
          if (!incidentsJson.error) setIncidentsData(incidentsJson);
          else setIncidentsData(null);
        } else {
          setIncidentsData(null);
        }
      } catch {
        setIncidentsData(null);
      }

      setConfig(configData.jarvisRoot ? configData : null);

      if (configData.authEnabled) {
        try {
          const authRes = await fetch("/api/auth/status", { credentials: "include" });
          const authData = await authRes.json();
          setAuthStatus(authData);
        } catch {
          setAuthStatus(null);
        }
      } else {
        setAuthStatus(null);
      }

      const approvedReady = (approved.approvals ?? []).filter(
        (e: { executed?: boolean }) => !e.executed
      ).length;

      setData({
        dateKey: pending.dateKey ?? approved.dateKey ?? actions.dateKey ?? "-",
        pendingCount: (pending.approvals ?? []).length,
        approvedReadyCount: approvedReady,
        actionsCount: (actions.actions ?? []).length,
      });
      setLastRefreshedAt(Date.now());
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

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(id);
  }, []);

  const handleAuthInit = useCallback(async () => {
    setAuthLoading(true);
    try {
      const res = await fetch("/api/auth/init", {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        fetchStatus();
      }
    } finally {
      setAuthLoading(false);
    }
  }, [fetchStatus]);

  const handleStepUp = useCallback(async () => {
    setAuthLoading(true);
    try {
      const res = await fetch("/api/auth/step-up", {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        fetchStatus();
        globalThis.dispatchEvent(new CustomEvent("jarvis-refresh"));
      }
    } finally {
      setAuthLoading(false);
    }
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
        <div className="mt-3 space-y-4">
          <div>
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-500">
              Runtime
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {typeof window !== "undefined" && (
                <div>
                  <span className="font-medium text-zinc-500">Server:</span>{" "}
                  <span className="font-mono text-xs text-zinc-700 dark:text-zinc-300">
                    {window.location.origin}
                  </span>
                </div>
              )}
              {config?.jarvisRoot && (
                <div>
                  <span className="font-medium text-zinc-500">JARVIS_ROOT:</span>{" "}
                  <span className="font-mono text-xs text-zinc-600 dark:text-zinc-400" title="JARVIS_ROOT">
                    {config.jarvisRoot}
                  </span>
                </div>
              )}
              <div>
                <span className="font-medium text-zinc-500">Date:</span>{" "}
                <span className="text-zinc-800 dark:text-zinc-200">{data.dateKey}</span>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-500">
              Governance
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
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
          </div>

          <div>
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-500">
              Security
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              {config?.authEnabled ? (
                <>
                  <div>
                    <span className="font-medium text-zinc-500">Auth:</span>{" "}
                    <span className="text-zinc-800 dark:text-zinc-200">ON</span>
                  </div>
                  <div>
                    <span className="font-medium text-zinc-500">Step-up:</span>{" "}
                    <span className="text-zinc-800 dark:text-zinc-200">
                      {authStatus?.stepUpValid ? "valid" : "expired"}
                    </span>
                  </div>
                  {!authStatus?.hasSession && (
                    <button
                      type="button"
                      onClick={handleAuthInit}
                      disabled={authLoading}
                      className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800 disabled:opacity-50"
                    >
                      {authLoading ? "…" : "Establish session"}
                    </button>
                  )}
                  {authStatus?.hasSession && !authStatus?.stepUpValid && (
                    <button
                      type="button"
                      onClick={handleStepUp}
                      disabled={authLoading}
                      className="rounded border border-blue-500 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-900/30 disabled:opacity-50"
                    >
                      {authLoading ? "…" : "Step up"}
                    </button>
                  )}
                </>
              ) : (
                config && (
                  <div>
                    <span className="font-medium text-zinc-500">Auth:</span>{" "}
                    <span className="text-zinc-800 dark:text-zinc-200">OFF</span>
                  </div>
                )
              )}
            </div>
          </div>

          <div>
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-500">
              Automation (Alfred)
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {alfredStatus ? (
                <>
                  <div>
                    <span className="font-medium text-zinc-500">Last scan:</span>{" "}
                    <span className="font-mono text-xs text-zinc-700 dark:text-zinc-300">
                      {formatAlfredTimestamp(alfredStatus.latestScanAt)}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-zinc-500">Outcome:</span>{" "}
                    <span className="text-zinc-800 dark:text-zinc-200">
                      {alfredStatus.outcome === "created"
                        ? `${alfredStatus.proposalsCreatedLastScan} created`
                        : alfredStatus.outcome === "suppressed"
                          ? `${alfredStatus.proposalsSuppressedLastScan} suppressed`
                          : alfredStatus.outcome === "none"
                            ? "none"
                            : "—"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-zinc-500">Next scan:</span>{" "}
                    <span className="font-mono text-xs text-zinc-600 dark:text-zinc-400">
                      {formatAlfredTime(alfredStatus.nextScanAt)}
                    </span>
                  </div>
                </>
              ) : (
                <div>
                  <span className="font-medium text-zinc-500">Status:</span>{" "}
                  <span className="text-zinc-500 dark:text-zinc-500">No scans yet</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-500">
              Active Incidents
            </div>
            {incidentsData?.incidents && incidentsData.incidents.length > 0 ? (
              <div className="space-y-2">
                {incidentsData.incidents.map((group) => (
                  <div
                    key={group.recoveryClass}
                    className="rounded border border-amber-600/30 bg-amber-50/20 py-2 px-3 dark:border-amber-500/20 dark:bg-amber-950/10"
                  >
                    <div className="text-xs font-medium text-amber-800 dark:text-amber-400">
                      {group.recoveryClass}
                    </div>
                    <ul className="mt-1 space-y-1">
                      {group.items.map((item) => (
                        <li
                          key={item.approvalId}
                          className="flex flex-wrap items-start gap-x-2 gap-y-0.5 text-xs"
                        >
                          <span
                            className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                              item.status === "failed"
                                ? "border-red-600/50 bg-red-100/80 text-red-800 dark:border-red-500/50 dark:bg-red-950/40 dark:text-red-400"
                                : "border-amber-600/40 bg-amber-100/60 text-amber-800 dark:border-amber-500/40 dark:bg-amber-950/30 dark:text-amber-400"
                            }`}
                          >
                            {item.status}
                          </span>
                          <span className="shrink-0 text-[10px] text-zinc-500 dark:text-zinc-450">
                            {formatIncidentAge(item.at)}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-zinc-600 dark:text-zinc-400" title={item.symptom}>
                            {item.symptom || "—"}
                          </span>
                          <code className="shrink-0 font-mono text-[10px] text-zinc-500" title={item.approvalId}>
                            {item.approvalId.slice(0, 8)}…
                          </code>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-zinc-500 dark:text-zinc-500">
                No active incidents
              </div>
            )}
          </div>

          {lastRefreshedAt !== null && (
            <div className="pt-1 text-[10px] text-zinc-400 dark:text-zinc-500">
              Refreshed {formatFreshness(lastRefreshedAt)}
            </div>
          )}
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
