/**
 * Environment-wide separation of duties (SoD) and two-role RBAC (approver / executor).
 * When JARVIS_SOD_ENABLED=true, principals are matched against env allowlists and
 * the same bound (iss, sub) cannot both approve and execute a proposal.
 */

import { normalizeIssuerUrl } from "./auth";
import { appendPolicyDecision } from "./policy-decision-log";
import type { GovernedHumanPrincipal } from "./governed-human-principal";

export function isSodEnabled(): boolean {
  return process.env.JARVIS_SOD_ENABLED === "true";
}

/**
 * Comma-separated entries: `iss|sub` (first `|` splits issuer from subject).
 * Issuer must not contain `|`; values are trimmed. Issuers are compared with
 * {@link normalizeIssuerUrl} like the rest of Jarvis OIDC handling.
 */
export function parseSodPrincipalList(raw: string | undefined): Array<{
  iss: string;
  sub: string;
}> {
  if (!raw?.trim()) return [];
  const out: Array<{ iss: string; sub: string }> = [];
  for (const segment of raw.split(",")) {
    const p = segment.trim();
    if (!p) continue;
    const bar = p.indexOf("|");
    if (bar <= 0 || bar >= p.length - 1) continue;
    const iss = p.slice(0, bar).trim();
    const sub = p.slice(bar + 1).trim();
    if (!iss || !sub) continue;
    out.push({ iss, sub });
  }
  return out;
}

export function loadSodApproverPrincipals(): Array<{ iss: string; sub: string }> {
  return parseSodPrincipalList(process.env.JARVIS_SOD_APPROVER_PRINCIPALS);
}

export function loadSodExecutorPrincipals(): Array<{ iss: string; sub: string }> {
  return parseSodPrincipalList(process.env.JARVIS_SOD_EXECUTOR_PRINCIPALS);
}

function sodRoleMapsIncomplete(): boolean {
  return loadSodApproverPrincipals().length === 0 || loadSodExecutorPrincipals().length === 0;
}

function principalInSodList(
  principal: GovernedHumanPrincipal,
  list: Array<{ iss: string; sub: string }>
): boolean {
  if (principal.kind !== "bound") return false;
  const nIss = normalizeIssuerUrl(principal.principalIss);
  const sub = principal.principalSub.trim();
  return list.some(
    (e) => normalizeIssuerUrl(e.iss) === nIss && e.sub.trim() === sub
  );
}

export type SodGateFailure = {
  ok: false;
  status: 403 | 503;
  code: string;
  message: string;
  policyRule: string;
};

export type SodGateOk = { ok: true };

export type SodGateResult = SodGateOk | SodGateFailure;

export async function logSodPolicyDeny(args: {
  traceId: string;
  rule: string;
  reason: string;
}): Promise<void> {
  await appendPolicyDecision({
    traceId: args.traceId,
    decision: "deny",
    rule: args.rule,
    reason: args.reason,
    timestamp: new Date().toISOString(),
  });
}

/** Approve or deny path: caller must be in the approver role map (when SoD is enabled). */
export function assertSodApprovalAllowed(
  principal: GovernedHumanPrincipal
): SodGateResult {
  if (!isSodEnabled()) return { ok: true };
  if (sodRoleMapsIncomplete()) {
    return {
      ok: false,
      status: 503,
      code: "sod_role_map_incomplete",
      message:
        "SoD is enabled but JARVIS_SOD_APPROVER_PRINCIPALS or JARVIS_SOD_EXECUTOR_PRINCIPALS is empty or invalid. Both comma-separated iss|sub lists are required.",
      policyRule: "sod.config",
    };
  }
  if (principal.kind !== "bound") {
    return {
      ok: false,
      status: 403,
      code: "sod_requires_bound_principal",
      message:
        "Separation of duties requires a bound OIDC principal for approval actions. Enable identity binding and sign in with OIDC, or disable JARVIS_SOD_ENABLED.",
      policyRule: "sod.bound_principal_required",
    };
  }
  if (!principalInSodList(principal, loadSodApproverPrincipals())) {
    return {
      ok: false,
      status: 403,
      code: "sod_not_approver",
      message:
        "This principal is not in the approver role map (JARVIS_SOD_APPROVER_PRINCIPALS).",
      policyRule: "sod.approver_role",
    };
  }
  return { ok: true };
}

export type SodApprovalEventSlice = {
  approvalPrincipalIss?: string;
  approvalPrincipalSub?: string;
};

/** Execute path: caller must be in executor map and must not be the same principal as the recorded approver. */
export function assertSodExecuteAllowed(
  principal: GovernedHumanPrincipal,
  event: SodApprovalEventSlice
): SodGateResult {
  if (!isSodEnabled()) return { ok: true };
  if (sodRoleMapsIncomplete()) {
    return {
      ok: false,
      status: 503,
      code: "sod_role_map_incomplete",
      message:
        "SoD is enabled but JARVIS_SOD_APPROVER_PRINCIPALS or JARVIS_SOD_EXECUTOR_PRINCIPALS is empty or invalid. Both comma-separated iss|sub lists are required.",
      policyRule: "sod.config",
    };
  }
  if (principal.kind !== "bound") {
    return {
      ok: false,
      status: 403,
      code: "sod_requires_bound_principal",
      message:
        "Separation of duties requires a bound OIDC principal for execution. Enable identity binding and sign in with OIDC, or disable JARVIS_SOD_ENABLED.",
      policyRule: "sod.bound_principal_required",
    };
  }
  if (!principalInSodList(principal, loadSodExecutorPrincipals())) {
    return {
      ok: false,
      status: 403,
      code: "sod_not_executor",
      message:
        "This principal is not in the executor role map (JARVIS_SOD_EXECUTOR_PRINCIPALS).",
      policyRule: "sod.executor_role",
    };
  }

  const apprIss = event.approvalPrincipalIss?.trim();
  const apprSub = event.approvalPrincipalSub?.trim();
  if (!apprIss || !apprSub) {
    return {
      ok: false,
      status: 403,
      code: "sod_missing_approval_principal",
      message:
        "Cannot enforce SoD: this proposal has no persisted approval principal (iss/sub). Re-approve with identity binding enabled.",
      policyRule: "sod.missing_approval_principal",
    };
  }

  const sameIss =
    normalizeIssuerUrl(apprIss) === normalizeIssuerUrl(principal.principalIss);
  const sameSub = apprSub === principal.principalSub.trim();
  if (sameIss && sameSub) {
    return {
      ok: false,
      status: 403,
      code: "sod_same_principal",
      message:
        "The same bound principal cannot approve and execute when SoD is enabled. Use a different executor principal.",
      policyRule: "sod.same_principal",
    };
  }

  return { ok: true };
}
