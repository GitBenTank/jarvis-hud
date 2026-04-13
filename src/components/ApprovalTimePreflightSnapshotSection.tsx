"use client";

import type {
  ApprovalPreflightSnapshotRecord,
  ApprovalPreflightReadiness,
} from "@/lib/approval-preflight-snapshot-shared";
import { approvalPreflightSnapshotBlockerLine } from "@/lib/approval-preflight-snapshot-shared";

function readinessLabel(r: ApprovalPreflightReadiness): string {
  if (r === "ready") return "READY";
  if (r === "will_block") return "WILL BLOCK";
  return "UNKNOWN";
}

/** Display-only formatting of persisted `capturedAt` ISO string (does not change stored value). */
function formatCapturedAtDisplay(iso: string): string {
  const t = iso?.trim();
  if (!t) return "—";
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return t;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day} ${h}:${min}`;
}

function SnapshotPresenceBadge({
  loading,
  hasSnapshot,
}: Readonly<{ loading: boolean; hasSnapshot: boolean }>) {
  if (loading) {
    return (
      <span
        className="shrink-0 rounded border border-zinc-300 bg-zinc-100/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-600 dark:border-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-400"
        aria-label="Snapshot status loading"
      >
        Checking…
      </span>
    );
  }
  if (hasSnapshot) {
    return (
      <span
        className="shrink-0 rounded border border-emerald-500/40 bg-emerald-100/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-900 dark:border-emerald-500/35 dark:bg-emerald-950/50 dark:text-emerald-300"
        aria-label="Approval-time snapshot recorded"
      >
        Snapshot recorded
      </span>
    );
  }
  return (
    <span
      className="shrink-0 rounded border border-zinc-300 bg-zinc-100/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-600 dark:border-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-400"
      aria-label="No approval-time snapshot"
    >
      No snapshot
    </span>
  );
}

type Props = Readonly<{
  snapshot: ApprovalPreflightSnapshotRecord | null;
  loading?: boolean;
}>;

export default function ApprovalTimePreflightSnapshotSection({ snapshot, loading }: Props) {
  const isLoading = loading === true;
  const snap = snapshot;

  return (
    <div className="mt-3 rounded border border-zinc-200 bg-zinc-50/90 px-3 py-2 text-xs dark:border-zinc-600 dark:bg-zinc-900/45">
      <div className="flex flex-wrap items-start justify-between gap-2 gap-y-1">
        <h3 className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
          Approval-time safety snapshot
        </h3>
        <SnapshotPresenceBadge loading={isLoading} hasSnapshot={snap !== null} />
      </div>

      {!isLoading && snap ? (
        <p className="mt-1.5 font-mono text-[11px] font-medium text-zinc-800 dark:text-zinc-200">
          Captured at {formatCapturedAtDisplay(snap.capturedAt)}
        </p>
      ) : null}

      {!isLoading && !snap ? (
        <p className="mt-1.5 text-zinc-600 dark:text-zinc-400">
          No approval-time snapshot recorded.
        </p>
      ) : null}

      {!isLoading && snap ? (
        <dl className="mt-2 space-y-1.5 text-zinc-800 dark:text-zinc-200">
          <div className="flex flex-wrap gap-x-2 gap-y-0.5">
            <dt className="font-medium text-zinc-500 dark:text-zinc-400">Risk</dt>
            <dd className="font-semibold uppercase">{snap.riskLevel}</dd>
          </div>
          <div className="flex flex-wrap gap-x-2 gap-y-0.5">
            <dt className="font-medium text-zinc-500 dark:text-zinc-400">Readiness</dt>
            <dd className="font-semibold">{readinessLabel(snap.readiness)}</dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-500 dark:text-zinc-400">Reason</dt>
            <dd className="mt-0.5">
              {approvalPreflightSnapshotBlockerLine(snap)}
              {snap.reasonDetails.length > 1
                ? ` (+${snap.reasonDetails.length - 1} more)`
                : null}
            </dd>
          </div>
          {snap.expectedOutputs.length > 0 ? (
            <div>
              <dt className="font-medium text-zinc-500 dark:text-zinc-400">
                Expected outputs
              </dt>
              <dd className="mt-0.5">{snap.expectedOutputs.join(" · ")}</dd>
            </div>
          ) : null}
          {snap.notes && snap.notes.length > 0 ? (
            <div>
              <dt className="font-medium text-zinc-500 dark:text-zinc-400">Notes</dt>
              <dd className="mt-0.5 text-zinc-600 dark:text-zinc-400">
                {snap.notes.join(" ")}
              </dd>
            </div>
          ) : null}
        </dl>
      ) : null}
    </div>
  );
}
