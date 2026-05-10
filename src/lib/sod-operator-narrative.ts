/**
 * Operator-facing lines for SoD: map policy rows and lifecycle principals to plain language.
 * Read-only; safe on export / trace / replay.
 */

import { normalizeIssuerUrl } from "./auth";
import type { PolicyDecisionEntry } from "./policy-decision-log";

/** Best-effort parse of JSONL / JSON rows from disk into policy entries. */
export function parsePolicyDecisionRows(rows: unknown[]): PolicyDecisionEntry[] {
  const out: PolicyDecisionEntry[] = [];
  for (const r of rows) {
    if (!r || typeof r !== "object") continue;
    const o = r as Record<string, unknown>;
    if (typeof o.traceId !== "string" || typeof o.rule !== "string") continue;
    if (typeof o.timestamp !== "string") continue;
    if (o.decision !== "allow" && o.decision !== "deny") continue;
    out.push({
      traceId: o.traceId,
      decision: o.decision,
      rule: o.rule,
      reason: typeof o.reason === "string" ? o.reason : "",
      timestamp: o.timestamp,
    });
  }
  return out;
}

const SOD_POLICY_NOTE_MAX = 50;

/** Map a logged policy row to a short sentence (deny paths only). */
export function sodPolicyDecisionToOperatorNote(
  entry: PolicyDecisionEntry
): string | null {
  if (entry.decision !== "deny") return null;
  const rule = entry.rule ?? "";
  if (!rule.startsWith("sod.")) return null;
  const reason = entry.reason ?? "";

  switch (rule) {
    case "sod.same_principal":
      return "SoD: execution was denied because the same bound principal cannot approve and execute this proposal while separation of duties is enabled.";
    case "sod.approver_role":
      return "SoD: approval was denied because this principal is not listed in JARVIS_SOD_APPROVER_PRINCIPALS.";
    case "sod.executor_role":
      return "SoD: execution was denied because this principal is not listed in JARVIS_SOD_EXECUTOR_PRINCIPALS.";
    case "sod.bound_principal_required":
      return "SoD: this action requires a bound OIDC principal (not local-user) while separation of duties is enabled.";
    case "sod.missing_approval_principal":
      return "SoD: execution was denied because the proposal row has no persisted approval issuer/subject to compare against.";
    case "sod.config":
      return reason === "sod_role_map_incomplete"
        ? "SoD: misconfiguration — approver or executor principal list is empty while JARVIS_SOD_ENABLED=true (HTTP 503)."
        : "SoD: configuration blocked this action (see policy reason).";
    default:
      return `SoD policy row: rule=${rule} reason=${reason}`;
  }
}

function dedupeStrings(lines: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of lines) {
    const t = line.trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

/** Collect operator notes from policy decisions (deduped; capped for large exports). */
export function collectSodOperatorNotesFromPolicyDecisions(
  entries: PolicyDecisionEntry[]
): string[] {
  const notes: string[] = [];
  for (const e of entries) {
    const n = sodPolicyDecisionToOperatorNote(e);
    if (n) notes.push(n);
  }
  return dedupeStrings(notes).slice(0, SOD_POLICY_NOTE_MAX);
}

/**
 * Plain-language principal split for a completed proposal row (when iss/sub exist for both roles).
 */
export function buildSodPrincipalSplitNoteFromLifecycle(
  ev: {
    executed?: boolean;
    approvalPrincipalIss?: string;
    approvalPrincipalSub?: string;
    executionPrincipalIss?: string;
    executionPrincipalSub?: string;
  } | null | undefined
): string | null {
  if (!ev?.executed) return null;
  const aiss = ev.approvalPrincipalIss?.trim();
  const asub = ev.approvalPrincipalSub?.trim();
  const eiss = ev.executionPrincipalIss?.trim();
  const esub = ev.executionPrincipalSub?.trim();
  if (!aiss || !asub || !eiss || !esub) return null;

  const same =
    normalizeIssuerUrl(aiss) === normalizeIssuerUrl(eiss) && asub === esub;
  if (same) {
    return "Principal split: approver and executor are the same OIDC subject on this completed row. With JARVIS_SOD_ENABLED=true, execute would be denied (sod_same_principal).";
  }
  return "Principal split: approver and executor are different OIDC subjects (split-principal / SoD-friendly path).";
}

export function mergeSodOperatorNotes(
  ...groups: Array<string[] | undefined | null>
): string[] {
  const flat = groups.flatMap((g) => g ?? []);
  return dedupeStrings(flat);
}
