"use client";

import Link from "next/link";
import { normalizeAction } from "@/lib/normalize";
import { normalizeProposalLifecycle, type ProposalStatus } from "@/lib/proposal-lifecycle";
import Badge from "./Badge";

export type ProposalEvent = {
  id: string;
  traceId?: string;
  type?: "proposed_action" | "log" | "snapshot";
  agent: string;
  payload: unknown;
  status: "pending" | "approved" | "denied";
  executed?: boolean;
  executedAt?: string;
  createdAt: string;
  proposalStatus?: ProposalStatus;
  approvedAt?: string;
  rejectedAt?: string;
  failedAt?: string;
  source?: { connector: string; verified?: boolean };
  trustedIngress?: { ok: boolean };
};

function formatRelativeTime(iso: string): string {
  try {
    const d = new Date(iso);
    const now = Date.now();
    const diff = now - d.getTime();
    if (diff < 60_000) return "just now";
    if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`;
    return `${Math.floor(diff / 86400_000)}d ago`;
  } catch {
    return iso;
  }
}

function getCardSummary(payload: unknown): string {
  const n = normalizeAction(payload);
  if (n.kind === "content.publish" && n.channel && n.title) {
    return `${n.channel} · ${n.title}`;
  }
  if (n.kind === "reflection.note") return n.summary || "Reflection note";
  if (n.kind === "system.note") return n.summary || "System note";
  if (n.kind === "code.diff") return n.summary || "Code diff (dry-run)";
  if (n.kind === "code.apply") return n.summary || "Code apply (git commit)";
  return n.summary || "(no summary)";
}

function proposalStatusToVariant(
  s: ProposalStatus
): "pending" | "approved" | "executed" | "rejected" | "failed" | "executing" {
  if (s === "executed") return "executed";
  if (s === "approved" || s === "executing") return s === "executing" ? "executing" : "approved";
  if (s === "rejected" || s === "failed") return s;
  return "pending";
}

function proposalStatusToLabel(s: ProposalStatus): string {
  const labels: Record<ProposalStatus, string> = {
    proposed: "PROPOSED",
    validated: "VALIDATED",
    pending_approval: "PENDING",
    approved: "APPROVED",
    executing: "EXECUTING",
    executed: "EXECUTED",
    rejected: "REJECTED",
    failed: "FAILED",
    archived: "ARCHIVED",
  };
  return labels[s] ?? s.toUpperCase();
}

function StatusBadge({ event }: { event: ProposalEvent }) {
  const n = normalizeProposalLifecycle(event);
  const variant = proposalStatusToVariant(n.proposalStatus);
  return <Badge variant={variant}>{proposalStatusToLabel(n.proposalStatus)}</Badge>;
}

type AgentProposalsFeedProps = Readonly<{
  pendingApprovals: ProposalEvent[];
  approvedNotExecuted: ProposalEvent[];
  lastExecutedProposal?: ProposalEvent | null;
  loading: boolean;
  dateKey?: string;
  onDetails: (event: ProposalEvent) => void;
  onApprove: (id: string) => void;
  onDeny: (id: string) => void;
  onRefresh: () => void;
}>;

function ProposalCard({
  event,
  variant,
  onDetails,
  onApprove,
  onDeny,
}: {
  event: ProposalEvent;
  variant: "pending" | "approved" | "executed";
  onDetails: (e: ProposalEvent) => void;
  onApprove: (id: string) => void;
  onDeny: (id: string) => void;
}) {
  const normalized = normalizeAction(event.payload);
  const traceShort = event.traceId?.slice(0, 8) ?? event.id.slice(0, 8);

  const borderClass =
    variant === "pending"
      ? "border-amber-300/80 bg-amber-50/30 dark:border-amber-600/60 dark:bg-amber-950/20"
      : variant === "approved"
        ? "border-blue-300/80 bg-blue-50/30 dark:border-blue-600/60 dark:bg-blue-950/20"
        : "border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50";

  return (
    <li
      className={`rounded-lg border p-4 ${borderClass}`}
    >
      <div className="mb-3">
        <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
          {event.agent}
        </div>
        <div className="font-mono text-xs text-zinc-600 dark:text-zinc-400">
          {normalized.kind}
        </div>
        <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
          &quot;{getCardSummary(event.payload)}&quot;
        </p>
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-zinc-500 dark:text-zinc-400">
          Trace:{" "}
          <Link
            href={`/?trace=${encodeURIComponent(event.traceId ?? event.id)}`}
            className="font-mono text-blue-600 underline hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            title="View activity timeline"
          >
            {traceShort}
          </Link>
        </span>
        <span className="text-zinc-400">·</span>
        <span>
          Status: <StatusBadge event={event} />
        </span>
        {variant === "executed" && event.executedAt && (
          <>
            <span className="text-zinc-400">·</span>
            <span
              className="text-zinc-500 dark:text-zinc-400"
              title={event.executedAt}
            >
              {formatRelativeTime(event.executedAt)}
            </span>
          </>
        )}
        {event.source?.connector === "openclaw" && (
          <>
            <span className="rounded border border-zinc-400 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:text-zinc-500">
              OpenClaw{event.source.verified ? " ✓" : ""}
            </span>
            {event.trustedIngress && (
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                  event.trustedIngress.ok
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                    : "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                }`}
              >
                Ingress: {event.trustedIngress.ok ? "passed" : "failed"}
              </span>
            )}
          </>
        )}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onDetails(event)}
          className="rounded border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
        >
          Details
        </button>
        {variant === "pending" && (
          <>
            <button
              onClick={() => onDeny(event.id)}
              className="rounded border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
            >
              Reject
            </button>
            <button
              onClick={() => onApprove(event.id)}
              className="rounded bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-700"
            >
              Approve
            </button>
          </>
        )}
        {variant === "approved" && !event.executed && (
          <button
            onClick={() => onDetails(event)}
            className="rounded border border-blue-300 px-3 py-1.5 text-sm dark:border-blue-600 dark:bg-blue-900/30 dark:hover:bg-blue-900/50"
          >
            Details / Execute (dry run)
          </button>
        )}
        {variant === "executed" && (
          <button
            onClick={() => onDetails(event)}
            className="rounded border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
          >
            Details
          </button>
        )}
      </div>
    </li>
  );
}

export default function AgentProposalsFeed({
  pendingApprovals,
  approvedNotExecuted,
  lastExecutedProposal,
  loading,
  dateKey,
  onDetails,
  onApprove,
  onDeny,
  onRefresh,
}: AgentProposalsFeedProps) {
  const hasNothingToShow =
    pendingApprovals.length === 0 && approvedNotExecuted.length === 0;
  const showLastProposal = hasNothingToShow && lastExecutedProposal;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          Agent Proposals {dateKey && `(${dateKey})`}
        </h2>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="rounded bg-zinc-200 px-3 py-1.5 text-sm hover:bg-zinc-300 disabled:opacity-50 dark:bg-zinc-700 dark:hover:bg-zinc-600"
        >
          Refresh
        </button>
      </div>

      {loading && hasNothingToShow && !lastExecutedProposal && (
        <p className="text-sm text-zinc-500">Loading…</p>
      )}
      {!loading && hasNothingToShow && !lastExecutedProposal && (
        <>
          <p className="text-sm text-zinc-500">No proposals awaiting authorization.</p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            The agent may propose. Execution authority originates with a human.
          </p>
        </>
      )}

      {showLastProposal && (
        <>
          <h3 className="mb-2 font-medium">Last Proposal</h3>
          <ul className="space-y-3">
            <ProposalCard
              key={lastExecutedProposal.id}
              event={lastExecutedProposal}
              variant="executed"
              onDetails={onDetails}
              onApprove={onApprove}
              onDeny={onDeny}
            />
          </ul>
        </>
      )}

      {pendingApprovals.length > 0 && (
        <>
          <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
            The agent may propose. Execution authority originates with a human.
          </p>
          <ul className="space-y-3">
            {pendingApprovals.map((event) => (
              <ProposalCard
                key={event.id}
                event={event}
                variant="pending"
                onDetails={onDetails}
                onApprove={onApprove}
                onDeny={onDeny}
              />
            ))}
          </ul>
        </>
      )}

      {approvedNotExecuted.length > 0 && (
        <>
          <h3 className="mb-2 mt-6 font-medium">Authorized (Awaiting Execution)</h3>
          <ul className="space-y-3">
            {approvedNotExecuted.map((event) => (
              <ProposalCard
                key={event.id}
                event={event}
                variant="approved"
                onDetails={onDetails}
                onApprove={onApprove}
                onDeny={onDeny}
              />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
