/**
 * Operator-facing proposal lifecycle labels (badges, trace-adjacent copy).
 * Keeps "proposal vs execution" and "deny vs execute" language consistent across HUD surfaces.
 */

import { normalizeAction } from "@/lib/normalize";
import type { ProposalStatus } from "@/lib/proposal-lifecycle";

const SHORT_LABELS: Record<ProposalStatus, string> = {
  proposed: "PROPOSED",
  validated: "VALIDATED",
  pending_approval: "AWAITING APPROVAL",
  approved: "AUTHORIZED",
  executing: "EXECUTING",
  executed: "EXECUTED",
  rejected: "DENIED",
  failed: "FAILED",
  archived: "ARCHIVED",
};

export function proposalStatusShortLabel(s: ProposalStatus): string {
  return SHORT_LABELS[s] ?? s.toUpperCase();
}

/** Workflow parent rows — unmistakable parent vs step state (not raw enum names). */
export function workflowPlanStatusOperatorLabel(s: ProposalStatus): string {
  switch (s) {
    case "pending_approval":
    case "proposed":
    case "validated":
      return "Workflow · awaiting approval";
    case "approved":
      return "Workflow · approved · steps not run yet";
    case "executing":
      return "Workflow · running steps";
    case "executed":
      return "Workflow · completed";
    case "failed":
      return "Workflow · failed";
    case "rejected":
      return "Workflow · denied";
    case "archived":
      return "Workflow · archived";
    default:
      return `Workflow · ${proposalStatusShortLabel(s)}`;
  }
}

/** Badge text: workflow plans get a full phrase; other kinds use short uppercase labels. */
export function operatorLifecycleBadgeLabel(payload: unknown, proposalStatus: ProposalStatus): string {
  if (normalizeAction(payload).kind === "workflow.plan") {
    return workflowPlanStatusOperatorLabel(proposalStatus);
  }
  return proposalStatusShortLabel(proposalStatus);
}
