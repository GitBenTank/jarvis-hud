/**
 * Boring, non-predictive labels for workflow steps: what class of boundary the step crosses.
 * UI-only; not “AI risk scoring.”
 */

export type WorkflowStepBoundaryClass =
  | "read_only"
  | "internal_state"
  | "external_consequence"
  | "high_consequence";

const LABEL: Record<WorkflowStepBoundaryClass, string> = {
  read_only: "Read-only",
  internal_state: "Internal state",
  external_consequence: "External consequence",
  high_consequence: "High consequence",
};

/**
 * Classify a step kind for display next to planned steps in the approval modal.
 */
export function workflowStepBoundaryClass(kind: string): WorkflowStepBoundaryClass {
  if (kind === "code.apply") return "high_consequence";
  if (kind === "send_email") return "external_consequence";
  if (kind === "content.publish") return "read_only";
  if (kind === "system.note" || kind === "reflection.note") return "internal_state";
  if (kind === "code.diff" || kind.startsWith("recovery.") || kind === "youtube.package") {
    return "internal_state";
  }
  return "internal_state";
}

export function workflowStepBoundaryLabel(kind: string): string {
  return LABEL[workflowStepBoundaryClass(kind)];
}
