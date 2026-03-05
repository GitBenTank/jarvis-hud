/**
 * Activity event types for the Activity Stream.
 * Used by /api/activity/stream and visualization layers.
 */

export const ACTIVITY_EVENT_TYPES = [
  "proposal_created",
  "proposal_validated",
  "proposal_approved",
  "execution_started",
  "execution_completed",
  "receipt_created",
] as const;

export type ActivityEventType = (typeof ACTIVITY_EVENT_TYPES)[number];

export type ActivityEvent = {
  traceId: string;
  timestamp: string;
  actor: "openclaw" | "human" | "jarvis" | string;
  type: ActivityEventType;
  status: string;
  approvalId?: string;
  kind?: string;
};
