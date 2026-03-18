"use client";

import Link from "next/link";
import { normalizeAction } from "@/lib/normalize";
import { normalizeProposalLifecycle, type ProposalStatus } from "@/lib/proposal-lifecycle";
import { isRecoveryClass } from "@/lib/recovery-shared";
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
  const isRecovery = isRecoveryClass(normalized.kind);
  const traceShort = event.traceId?.slice(0, 8) ?? event.id.slice(0, 8);
  const sourceLabel = event.source?.connector ?? event.agent;

  const isPending = variant === "pending";
  const isApproved = variant === "approved" && !event.executed;

  const borderClass = isRecovery
    ? "border-2 border-amber-600/50 bg-amber-50/30 dark:border-amber-500/40 dark:bg-amber-950/20"
    : isPending
      ? "border-2 border-amber-500/70 bg-amber-50/40 dark:border-amber-400/50 dark:bg-amber-950/25 shadow-sm"
      : variant === "approved"
        ? "border border-blue-400/50 bg-blue-50/20 dark:border-blue-500/40 dark:bg-blue-950/15"
        : "border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50";

  return (
    <li className={`rounded-lg border ${borderClass} ${isPending ? "p-5" : "p-4"}`}>
      {isPending && (
        <div className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-400">
          Authority required
        </div>
      )}

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span className="text-zinc-500 dark:text-zinc-400">
            <span className="font-medium text-zinc-600 dark:text-zinc-500">Source:</span>{" "}
            <span className="font-medium text-zinc-800 dark:text-zinc-200">{sourceLabel}</span>
            {event.source?.verified && (
              <span className="ml-1 text-emerald-600 dark:text-emerald-400">verified</span>
            )}
          </span>
          <span className="text-zinc-400">|</span>
          <span className="font-mono text-zinc-600 dark:text-zinc-400">
            <span className="text-zinc-500 dark:text-zinc-500">Kind:</span> {normalized.kind}
          </span>
          {isRecovery && (
            <span className="rounded border border-amber-600/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:border-amber-500/50 dark:text-amber-400">
              Recovery
            </span>
          )}
        </div>

        <p className={`font-medium text-zinc-800 dark:text-zinc-200 ${isPending || isRecovery ? "text-base" : "text-sm"}`}>
          {getCardSummary(event.payload)}
        </p>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-zinc-500 dark:text-zinc-450">
          <span>
            Trace:{" "}
            <Link
              href={`/?trace=${encodeURIComponent(event.traceId ?? event.id)}`}
              className="font-mono text-blue-600 underline hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              title="View trace"
            >
              {traceShort}
            </Link>
          </span>
          <span className="text-zinc-400">·</span>
          <StatusBadge event={event} />
          {variant === "executed" && event.executedAt && (
            <>
              <span className="text-zinc-400">·</span>
              <span title={event.executedAt}>{formatRelativeTime(event.executedAt)}</span>
            </>
          )}
          {event.source?.connector === "openclaw" && event.trustedIngress && (
            <>
              <span className="text-zinc-400">·</span>
              <span
                className={
                  event.trustedIngress.ok
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400"
                }
              >
                Ingress: {event.trustedIngress.ok ? "passed" : "failed"}
              </span>
            </>
          )}
        </div>
      </div>

      <div
        className={`mt-4 flex flex-wrap items-center gap-2 ${isPending ? "border-t border-amber-400/30 pt-4 dark:border-amber-500/20" : "mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700"}`}
      >
        {isPending && (
          <>
            <button
              onClick={() => onApprove(event.id)}
              className="rounded border-2 border-emerald-600 bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 hover:border-emerald-700 dark:border-emerald-500 dark:bg-emerald-600 dark:hover:bg-emerald-700"
            >
              Approve
            </button>
            <button
              onClick={() => onDeny(event.id)}
              className="rounded border-2 border-red-400/80 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 dark:border-red-500/60 dark:text-red-400 dark:hover:bg-red-950/30"
            >
              Reject
            </button>
            <button
              onClick={() => onDetails(event)}
              className="rounded border border-zinc-400 px-3 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              Details
            </button>
          </>
        )}
        {isApproved && (
          <>
            <button
              onClick={() => onDetails(event)}
              className="rounded border-2 border-blue-500 bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 dark:border-blue-500 dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              Execute
            </button>
            <button
              onClick={() => onDetails(event)}
              className="rounded border border-zinc-400 px-3 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              Details
            </button>
          </>
        )}
        {variant === "executed" && (
          <button
            onClick={() => onDetails(event)}
            className="rounded border border-zinc-400 px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Details
          </button>
        )}
        {variant === "approved" && event.executed && (
          <button
            onClick={() => onDetails(event)}
            className="rounded border border-zinc-400 px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-800"
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
          <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
            The agent may propose. Execution authority originates with a human.
          </p>
          <ul className="space-y-4">
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
