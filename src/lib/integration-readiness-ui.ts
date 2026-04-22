/**
 * Client-safe integration readiness labels and helpers.
 * Do not import server-only modules (openclaw-health, storage) from this file.
 */

export const INTEGRATION_ISSUE_CODES = [
  "INGRESS_DISABLED",
  "SECRET_INVALID",
  "ALLOWLIST_OPENCLAW",
  "OPENCLAW_STALE",
] as const;

export type IntegrationIssueCode = (typeof INTEGRATION_ISSUE_CODES)[number];

/** Human-readable fact lines for the readiness banner (facts-only; no “green” copy). */
export const INTEGRATION_ISSUE_LABELS: Record<IntegrationIssueCode, string> = {
  INGRESS_DISABLED: "INGRESS: disabled",
  SECRET_INVALID: "SECRET: missing or invalid",
  ALLOWLIST_OPENCLAW: "ALLOWLIST: not configured",
  OPENCLAW_STALE:
    "OPENCLAW: idle signal — no new proposals in ~5 minutes (ingress path may still be healthy)",
};

/** Env/config failures — ingress cannot accept signed OpenClaw traffic as configured. */
export const INTEGRATION_CONFIG_BLOCKERS: readonly IntegrationIssueCode[] = [
  "INGRESS_DISABLED",
  "SECRET_INVALID",
  "ALLOWLIST_OPENCLAW",
] as const;

const CONFIG_BLOCKER_SET = new Set<IntegrationIssueCode>(INTEGRATION_CONFIG_BLOCKERS);

export function hasIntegrationConfigBlocker(
  issues: readonly IntegrationIssueCode[]
): boolean {
  return issues.some((c) => CONFIG_BLOCKER_SET.has(c));
}

/** Rule line when a config blocker is present (strong). */
export const INTEGRATION_RULE_CONFIG_BLOCKED =
  "Integration is not ready. Jarvis cannot receive or execute OpenClaw proposals.";

/**
 * Rule line when only the disk-backed recency signal fires (ingress configured; prior proposals may exist).
 * Not equivalent to “integration broken.”
 */
export const INTEGRATION_RULE_OPENCLAW_RECENCY_SIGNAL =
  "Ingress is configured. The line above is a recency signal from stored events—not proof that OpenClaw is disconnected. If you expected live traffic, verify the gateway; otherwise proposals and traces on disk remain the source of truth.";

/** @deprecated Use INTEGRATION_RULE_OPENCLAW_RECENCY_SIGNAL */
export const INTEGRATION_RULE_STALE_OR_SIGNAL = INTEGRATION_RULE_OPENCLAW_RECENCY_SIGNAL;
