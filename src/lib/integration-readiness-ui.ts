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
  OPENCLAW_STALE: "OPENCLAW: no recent activity (5+ minutes)",
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

/** Rule line when only operational/stale signal (weaker — does not prove ingress is down). */
export const INTEGRATION_RULE_STALE_OR_SIGNAL =
  "Integration appears disconnected or stale. Verify OpenClaw before relying on proposals or execution.";
