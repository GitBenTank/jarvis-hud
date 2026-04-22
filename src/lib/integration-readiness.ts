/**
 * OpenClaw integration readiness — derived from env + existing OpenClaw health (disk-based).
 * Used by GET /api/config; UI shows a banner only when this list is non-empty.
 *
 * Client components must import from `integration-readiness-ui.ts` only — this module
 * pulls disk-backed health (Node `fs`) via `openclaw-health`.
 */

import {
  isIngressEnabled,
  getIngressSecret,
  getConnectorAllowlist,
} from "@/lib/ingress-openclaw";
import { computeOpenClawHealth, type OpenClawHealthPayload } from "@/lib/openclaw-health";
import type { IntegrationIssueCode } from "@/lib/integration-readiness-ui";

export type { IntegrationIssueCode } from "@/lib/integration-readiness-ui";
export {
  INTEGRATION_ISSUE_CODES,
  INTEGRATION_ISSUE_LABELS,
  INTEGRATION_CONFIG_BLOCKERS,
  hasIntegrationConfigBlocker,
  INTEGRATION_RULE_CONFIG_BLOCKED,
  INTEGRATION_RULE_OPENCLAW_RECENCY_SIGNAL,
  INTEGRATION_RULE_STALE_OR_SIGNAL,
} from "@/lib/integration-readiness-ui";

/**
 * Returns issue codes in stable order. Empty means no banner (no "all green" UI — absence of issues).
 */
export async function computeIntegrationIssues(
  nowMs: number = Date.now()
): Promise<IntegrationIssueCode[]> {
  const issues: IntegrationIssueCode[] = [];

  const ingressOn = isIngressEnabled();
  if (!ingressOn) {
    issues.push("INGRESS_DISABLED");
  }

  if (ingressOn && getIngressSecret() === null) {
    issues.push("SECRET_INVALID");
  }

  const allowlist = getConnectorAllowlist();
  const openclawAllowed = allowlist.has("openclaw");
  if (ingressOn && getIngressSecret() !== null && !openclawAllowed) {
    issues.push("ALLOWLIST_OPENCLAW");
  }

  if (issues.length > 0) {
    return issues;
  }

  const health = await computeOpenClawHealth(nowMs);
  if (shouldFlagOpenClawStale(health)) {
    issues.push("OPENCLAW_STALE");
  }

  return issues;
}

/** Cold start (no proposals yet) is not a misconfiguration — Jarvis can still receive. */
function shouldFlagOpenClawStale(health: OpenClawHealthPayload): boolean {
  if (health.status === "connected") return false;
  if (health.status === "idle") return true;
  if (health.status === "degraded") return false;
  const err = health.lastError ?? "";
  if (
    err.includes("No OpenClaw proposals in the recent event window") ||
    err.includes("connector may be idle or not sending")
  ) {
    return false;
  }
  if (err.includes("No OpenClaw activity in the last 5 minutes")) {
    return true;
  }
  return false;
}
