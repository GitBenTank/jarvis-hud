/**
 * OpenClaw → Jarvis: logical `agent` string for stored proposals and UI.
 *
 * Identity semantics (see docs/architecture/openclaw-proposal-identity-and-contract.md):
 * - Wire `agent` = optional human coordinator / logical proposer label.
 * - Wire `source.agentId` = raw upstream runtime identity (preserved separately on the event).
 * - Wire `builder` = optional drafting metadata only; never substitutes for `agent`.
 */

/**
 * Used only when neither `body.agent` nor `source.agentId` yields a non-empty string
 * after trim. This is an explicit, auditable sentinel — not a silent product default like
 * `"openclaw"`, which implied a specific connector brand rather than “identity unknown”.
 */
export const OPENCLAW_INGRESS_UNKNOWN_PROPOSER_AGENT = "unknown-proposer" as const;

/**
 * Resolves the logical proposing agent string stored on `event.agent` and used for UI.
 *
 * **Intentional fallback rule (v1):**
 * 1. If `body.agent` is a non-empty string after trim → use it (explicit coordinator / label).
 * 2. Else if `source.agentId` is a non-empty string after trim → use it (logical agent mirrors
 *    upstream runtime id when the client did not send a separate display name).
 * 3. Else → {@link OPENCLAW_INGRESS_UNKNOWN_PROPOSER_AGENT}.
 *
 * `builder` is never consulted here.
 */
export function resolveOpenClawLogicalAgent(
  bodyAgent: unknown,
  sourceAgentId: unknown
): string {
  if (typeof bodyAgent === "string") {
    const t = bodyAgent.trim();
    if (t) return t;
  }
  if (typeof sourceAgentId === "string") {
    const t = sourceAgentId.trim();
    if (t) return t;
  }
  return OPENCLAW_INGRESS_UNKNOWN_PROPOSER_AGENT;
}
