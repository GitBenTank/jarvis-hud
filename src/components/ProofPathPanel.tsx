"use client";

import { useCallback, useEffect, useState } from "react";

type ProofPathData = {
  dateKey: string;
  steps: {
    draftCreated: boolean;
    approved: boolean;
    executed: boolean;
    artifactExists: boolean;
    archived: boolean;
  };
  hints: {
    draftCreated: string;
    approved: string;
    executed: string;
    artifactExists: string;
    archived: string;
  };
  pendingIds?: string[];
  approvedIds?: string[];
  executedIds?: string[];
  actionsCount?: number;
  publishQueueCount?: number;
  archivePath?: string | null;
};

const STEP_LABELS: Record<keyof ProofPathData["steps"], string> = {
  draftCreated: "A) Draft created today?",
  approved: "B) Approved?",
  executed: "C) Executed (dry run)?",
  artifactExists: "D) Artifact exists?",
  archived: "E) Archived?",
};

export default function ProofPathPanel() {
  const [data, setData] = useState<ProofPathData | null>(null);

  const fetchProofPath = useCallback(async () => {
    try {
      const res = await fetch("/api/proof-path");
      const json = await res.json();
      setData(json);
    } catch {
      setData(null);
    }
  }, []);

  useEffect(() => {
    fetchProofPath();
    const id = setInterval(fetchProofPath, 3000);
    return () => clearInterval(id);
  }, [fetchProofPath]);

  useEffect(() => {
    const handler = () => fetchProofPath();
    window.addEventListener("jarvis-refresh", handler);
    return () => window.removeEventListener("jarvis-refresh", handler);
  }, [fetchProofPath]);

  if (!data) {
    return (
      <div className="mb-6 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold">Proof Path</h2>
        <p className="mt-2 text-sm text-zinc-500">Loading…</p>
      </div>
    );
  }

  const steps = [
    "draftCreated",
    "approved",
    "executed",
    "artifactExists",
    "archived",
  ] as const;

  const idsParts = [
    data.pendingIds?.length
      ? `pending: ${data.pendingIds.join(", ")}`
      : null,
    data.approvedIds?.length
      ? `approved: ${data.approvedIds.join(", ")}`
      : null,
    (data.executedIds?.length ?? 0) > 0
      ? `executed: ${data.executedIds!.join(", ")}`
      : data.actionsCount != null
        ? `actions: ${data.actionsCount}`
        : null,
    data.publishQueueCount != null
      ? `queue: ${data.publishQueueCount}`
      : null,
  ].filter(Boolean);

  return (
    <div className="mb-6 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-lg font-semibold">Proof Path</h2>
      <p className="mt-1 text-xs text-zinc-500">
        Demo checklist ({data.dateKey})
      </p>
      {(idsParts.length > 0 || data.archivePath) && (
        <div className="mt-2 space-y-1">
          {idsParts.length > 0 && (
            <p className="truncate rounded bg-zinc-100 px-2 py-1 font-mono text-xs dark:bg-zinc-800">
              {idsParts.join(" | ")}
            </p>
          )}
          {data.archivePath && (
            <p
              className="truncate rounded bg-zinc-100 px-2 py-1 font-mono text-xs dark:bg-zinc-800"
              title={data.archivePath}
            >
              archive: {data.archivePath}
            </p>
          )}
        </div>
      )}
      <ul className="mt-3 space-y-2">
        {steps.map((key) => {
          const pass = data.steps[key];
          const hint = data.hints[key];
          return (
            <li
              key={key}
              className="flex items-start gap-2 rounded border border-zinc-200 p-2 text-sm dark:border-zinc-700"
            >
              <span
                className={`shrink-0 font-medium ${
                  pass
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-amber-600 dark:text-amber-400"
                }`}
              >
                {pass ? "PASS" : "WAIT"}
              </span>
              <div className="min-w-0">
                <span className="font-medium">{STEP_LABELS[key]}</span>
                {!pass && hint && (
                  <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                    {hint}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
