/**
 * Activity event types for the Activity Stream.
 * Used by /api/activity/stream and visualization layers.
 */

export const ACTIVITY_EVENT_TYPES = [
  "proposal_received",
  "ingress_verified",
  "awaiting_approval",
  "approved",
  "rejected",
  "policy_allowed",
  "policy_blocked",
  "execution_started",
  "execution_completed",
  "execution_failed",
  "receipt_written",
] as const;

export type ActivityEventType = (typeof ACTIVITY_EVENT_TYPES)[number];

export type ActivityVerb =
  | "Proposed"
  | "Waiting"
  | "Approved"
  | "Blocked"
  | "Executed"
  | "Recorded";

export type ActivityEvent = {
  id: string;
  traceId: string;
  timestamp: string;
  actor: string;
  type: ActivityEventType;
  status: string;
  verb: ActivityVerb;
  summary: string;
  label: string;
  reason?: {
    code: string;
    label: string;
    summary: string;
    severity: "info" | "warning" | "critical";
    source: "ingress" | "approval" | "policy" | "execution";
  };
  approvalId?: string;
  kind?: string;
};
