/**
 * Single-line operator copy for trust / queue / integration surfaces.
 * Keep wording aligned with decision replay and approvals vocabulary (denied, authorized, not executed).
 */

import { normalizeAction } from "@/lib/normalize";
import { hasIntegrationConfigBlocker, type IntegrationIssueCode } from "@/lib/integration-readiness-ui";

export type LedgerPulseAction = { at?: string; status: string; kind: string };
export type LedgerPulseEvent = {
  status?: string;
  payload?: unknown;
  createdAt?: string;
};

/** Compare newest action log row vs newest proposal row; pick the fresher pulse for the status strip. */
export function formatLatestLedgerPulse(args: {
  latestAction: LedgerPulseAction | null;
  latestEvent: LedgerPulseEvent | null;
}): string {
  const { latestAction, latestEvent } = args;
  const actionAt = latestAction?.at ? new Date(latestAction.at).getTime() : 0;
  const eventAt = latestEvent?.createdAt ? new Date(latestEvent.createdAt).getTime() : 0;

  const useAction =
    latestAction &&
    (!latestEvent?.createdAt || (Number.isFinite(actionAt) && actionAt >= eventAt));

  if (useAction && latestAction) {
    const s = String(latestAction.status ?? "").toLowerCase();
    const k = latestAction.kind || "action";
    if (s === "executed" || s === "written") {
      return `Latest receipt: ${k} · execution logged`;
    }
    return `Latest receipt: ${s} · ${k}`;
  }

  if (latestEvent?.payload) {
    const st = latestEvent.status ?? "pending";
    const kind = normalizeAction(latestEvent.payload).kind;
    if (st === "pending") return `Latest proposal: awaiting approval · ${kind}`;
    if (st === "approved") return `Latest proposal: authorized · not executed · ${kind}`;
    if (st === "denied") return `Latest proposal: denied · ${kind}`;
    return `Latest proposal: ${st} · ${kind}`;
  }

  return "No decisions yet";
}

export function buildQueueHeadline(pending: number, authorized: number, executed: number): string {
  return `Queue: ${pending} pending · ${authorized} authorized (not executed) · ${executed} executed`;
}

/**
 * Cookie-aware trust summary for GET /api/config (same object agents read).
 * Does not include browser session binding — that stays on /api/auth/status + TrustPostureStrip pills.
 */
export function buildServerTrustOperatorHeadline(p: {
  ingressOpenclawEnabled: boolean;
  openclawAllowed: boolean;
  authEnabled: boolean;
  stepUpValid: boolean | null;
  sodEnabled: boolean;
  sodRoleMapsReady: boolean;
  codeApplyBlockReasons: string[];
}): string {
  if (!p.ingressOpenclawEnabled) {
    return "Trust: OpenClaw ingress disabled or secret missing — proposals cannot arrive.";
  }
  if (!p.openclawAllowed) {
    return "Trust: allowlist excludes `openclaw` — proposals rejected at the boundary.";
  }
  if (p.sodEnabled && !p.sodRoleMapsReady) {
    return "Trust: SoD on but role maps incomplete — approve/execute may return 503 until both lists are set.";
  }

  const applyBlocked = p.codeApplyBlockReasons.length > 0;
  const applyFrag = applyBlocked ? ` code.apply blocked (${p.codeApplyBlockReasons.length}).` : "";

  if (p.authEnabled) {
    if (p.stepUpValid === false) {
      return `Trust: ingress ready · auth on · step-up not valid for this request — execute may be gated.${applyFrag}`.trim();
    }
    if (p.stepUpValid === true) {
      return `Trust: ingress ready · auth on · step-up valid for this browser session.${applyFrag}`.trim();
    }
    return `Trust: ingress ready · auth on · step-up N/A (cookieless or session not evaluated).${applyFrag}`.trim();
  }

  return `Trust: ingress ready · auth off (convenience) · proposals may arrive.${applyFrag}`.trim();
}

export function buildIntegrationHeadline(p: {
  ingressOpenclawEnabled?: boolean;
  openclawAllowed?: boolean;
  originAligned: boolean;
  issues: IntegrationIssueCode[];
  healthStatus?: string | null;
  healthSessionBlocked: boolean;
}): string {
  if (p.ingressOpenclawEnabled === false || p.openclawAllowed === false) {
    return "Integration: receive path not ready (ingress or allowlist).";
  }
  if (hasIntegrationConfigBlocker(p.issues)) {
    return "Integration: configuration errors — expand checklist.";
  }
  if (p.issues.length > 0) {
    return `Integration: ${p.issues.length} issue(s) — expand checklist.`;
  }
  if (!p.originAligned) {
    return "Integration: HUD origin may drift from JARVIS_HUD_BASE_URL — fix before signing.";
  }
  if (p.healthSessionBlocked) {
    return "Integration: OpenClaw health blocked (no session); last ingress time still on config.";
  }
  if (p.healthStatus === "connected") return "Integration: signal connected · origins OK.";
  if (p.healthStatus === "idle") return "Integration: signal idle (no recent OpenClaw proposals on disk).";
  if (p.healthStatus === "degraded") return "Integration: signal degraded — expand checklist.";
  if (p.healthStatus === "disconnected") return "Integration: signal disconnected — expand checklist.";
  return "Integration: expand checklist for full read.";
}
