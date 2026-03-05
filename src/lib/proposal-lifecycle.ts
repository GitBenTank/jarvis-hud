/**
 * Proposal lifecycle — backward-compatible status and normalization.
 * Maps legacy event shape to unified ProposalStatus at read time.
 */

export type ProposalStatus =
  | "proposed"
  | "validated"
  | "pending_approval"
  | "approved"
  | "executing"
  | "executed"
  | "rejected"
  | "failed"
  | "archived";

export type ProposalLifecycleEvent = {
  id: string;
  traceId?: string;
  type?: string;
  agent?: string;
  payload?: unknown;
  requiresApproval?: boolean;
  status?: "pending" | "approved" | "denied" | string;
  createdAt?: string;
  executed?: boolean;
  executedAt?: string;
  proposalStatus?: ProposalStatus;
  validatedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  failedAt?: string;
  archivedAt?: string;
  [key: string]: unknown;
};

export type NormalizedProposal = {
  proposalStatus: ProposalStatus;
  createdAt: string;
  validatedAt: string | null;
  approvedAt: string | null;
  executedAt: string | null;
  rejectedAt: string | null;
  failedAt: string | null;
  archivedAt: string | null;
};

/**
 * Normalize legacy event to proposal lifecycle.
 * Call at read time so stored data without new fields still works.
 */
export function normalizeProposalLifecycle(
  event: ProposalLifecycleEvent
): NormalizedProposal {
  const createdAt =
    event.createdAt ??
    (event as { updatedAt?: string }).updatedAt ??
    new Date().toISOString();

  if (event.executed === true) {
    const executedAt =
      event.executedAt ??
      (event as { updatedAt?: string }).updatedAt ??
      createdAt;
    return {
      proposalStatus: "executed",
      createdAt,
      validatedAt: event.validatedAt ?? null,
      approvedAt: event.approvedAt ?? null,
      executedAt,
      rejectedAt: event.rejectedAt ?? null,
      failedAt: event.failedAt ?? null,
      archivedAt: event.archivedAt ?? null,
    };
  }

  if (event.proposalStatus === "failed") {
    return {
      proposalStatus: "failed",
      createdAt,
      validatedAt: event.validatedAt ?? null,
      approvedAt: event.approvedAt ?? null,
      executedAt: event.executedAt ?? null,
      rejectedAt: event.rejectedAt ?? null,
      failedAt: event.failedAt ?? null,
      archivedAt: event.archivedAt ?? null,
    };
  }

  const status = event.status ?? "pending";
  if (status === "approved") {
    return {
      proposalStatus: event.proposalStatus === "executing" ? "executing" : "approved",
      createdAt,
      validatedAt: event.validatedAt ?? null,
      approvedAt: event.approvedAt ?? null,
      executedAt: event.executedAt ?? null,
      rejectedAt: event.rejectedAt ?? null,
      failedAt: event.failedAt ?? null,
      archivedAt: event.archivedAt ?? null,
    };
  }

  if (status === "denied") {
    return {
      proposalStatus: "rejected",
      createdAt,
      validatedAt: event.validatedAt ?? null,
      approvedAt: event.approvedAt ?? null,
      executedAt: event.executedAt ?? null,
      rejectedAt: event.rejectedAt ?? null,
      failedAt: event.failedAt ?? null,
      archivedAt: event.archivedAt ?? null,
    };
  }

  const legacyPending = status === "pending";
  const newPending =
    event.proposalStatus === "pending_approval" ||
    event.proposalStatus === "proposed" ||
    event.proposalStatus === "validated";

  if (legacyPending || newPending) {
    return {
      proposalStatus: (event.proposalStatus as ProposalStatus) ?? "pending_approval",
      createdAt,
      validatedAt: event.validatedAt ?? null,
      approvedAt: event.approvedAt ?? null,
      executedAt: event.executedAt ?? null,
      rejectedAt: event.rejectedAt ?? null,
      failedAt: event.failedAt ?? null,
      archivedAt: event.archivedAt ?? null,
    };
  }

  return {
    proposalStatus: "proposed",
    createdAt,
    validatedAt: event.validatedAt ?? null,
    approvedAt: event.approvedAt ?? null,
    executedAt: event.executedAt ?? null,
    rejectedAt: event.rejectedAt ?? null,
    failedAt: event.failedAt ?? null,
    archivedAt: event.archivedAt ?? null,
  };
}

/** True if event should appear in "pending approval" list */
export function isPendingApproval(event: ProposalLifecycleEvent): boolean {
  const n = normalizeProposalLifecycle(event);
  return (
    n.proposalStatus === "pending_approval" ||
    n.proposalStatus === "proposed" ||
    n.proposalStatus === "validated"
  );
}

/** True if event is approved and awaiting execution */
export function isApprovedAwaitingExecution(event: ProposalLifecycleEvent): boolean {
  const n = normalizeProposalLifecycle(event);
  return n.proposalStatus === "approved" || n.proposalStatus === "executing";
}

/** True if event is executed */
export function isExecuted(event: ProposalLifecycleEvent): boolean {
  const n = normalizeProposalLifecycle(event);
  return n.proposalStatus === "executed";
}

/** True if event is rejected */
export function isRejected(event: ProposalLifecycleEvent): boolean {
  const n = normalizeProposalLifecycle(event);
  return n.proposalStatus === "rejected";
}
