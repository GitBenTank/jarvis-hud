/**
 * Canonical Jarvis posture from GET /api/config (trustPosture + flags).
 * OpenClaw / Alfred should fetch this before ingress when following openclaw-v1-contract.md.
 */

import type { ExecutionCapabilities } from "@/lib/execution-surface";

export type JarvisTrustPosture = {
  stepUpValid: boolean | null;
  executionScopeEnforced: boolean;
  codeApplyBlockReasons: string[];
  executionCapabilities: ExecutionCapabilities;
  executionSurfaceLabel: string;
};

export type JarvisConfigPosturePayload = {
  authEnabled?: boolean;
  ingressOpenclawEnabled?: boolean;
  openclawAllowed?: boolean;
  trustPosture?: JarvisTrustPosture;
  error?: string;
};

export type TrustPostureEvaluation = {
  fetchOk: boolean;
  httpStatus?: number;
  /** Jarvis returned JSON but trustPosture missing or malformed */
  parseOk: boolean;
  payload?: JarvisConfigPosturePayload;
  /** Human / agent-facing lines (append to proposal narrative or logs) */
  messages: string[];
  /** Ingress POST will likely fail (connector off, allowlist, etc.) */
  ingressLikelyRejected: boolean;
  /** If approved, code.apply execute would hit policy preflight blocks today */
  codeApplyLikelyBlockedAtExecute: boolean;
  /** Execute path requires step-up; ingress may still succeed */
  executeRequiresStepUp: boolean;
};

function baseUrl(): string {
  const raw =
    process.env.JARVIS_BASE_URL ??
    process.env.JARVIS_HUD_BASE_URL ??
    "http://127.0.0.1:3000";
  return raw.replace(/\/$/, "");
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function parseTrustPosture(raw: unknown): JarvisTrustPosture | null {
  if (!isRecord(raw)) return null;
  const stepUp = raw.stepUpValid;
  const scope = raw.executionScopeEnforced;
  const reasons = raw.codeApplyBlockReasons;
  const caps = raw.executionCapabilities;
  const label = raw.executionSurfaceLabel;
  if (typeof scope !== "boolean") return null;
  if (stepUp !== null && typeof stepUp !== "boolean") return null;
  if (!Array.isArray(reasons) || !reasons.every((r) => typeof r === "string")) return null;
  if (!isRecord(caps)) return null;
  const nd = caps.nonDryRunExecuteKinds;
  if (!Array.isArray(nd) || !nd.every((k) => typeof k === "string")) return null;
  if (caps.dryRunDefaultForOtherKinds !== true) return null;
  if (typeof caps.invariant !== "string") return null;
  if (typeof label !== "string") return null;
  return {
    stepUpValid: stepUp === null || stepUp === undefined ? null : stepUp,
    executionScopeEnforced: scope,
    codeApplyBlockReasons: reasons,
    executionCapabilities: {
      nonDryRunExecuteKinds: nd,
      dryRunDefaultForOtherKinds: true,
      invariant: caps.invariant,
    },
    executionSurfaceLabel: label,
  };
}

/**
 * Fetch GET /api/config and parse trustPosture. No cookies (Node); stepUpValid is only meaningful
 * for browser sessions — when auth is off, Jarvis returns null for stepUpValid.
 */
export async function fetchJarvisConfigPosture(
  hudBaseUrl: string = baseUrl()
): Promise<{ ok: boolean; status: number; json: JarvisConfigPosturePayload }> {
  const url = `${hudBaseUrl.replace(/\/$/, "")}/api/config`;
  try {
    const res = await fetch(url, { method: "GET" });
    const text = await res.text();
    let json: JarvisConfigPosturePayload = {};
    try {
      json = JSON.parse(text) as JarvisConfigPosturePayload;
    } catch {
      json = { error: "Non-JSON config response" };
    }
    return { ok: res.ok, status: res.status, json };
  } catch (e) {
    return {
      ok: false,
      status: 0,
      json: { error: e instanceof Error ? e.message : "fetch failed" },
    };
  }
}

/**
 * Evaluate posture for a proposed ingress kind. Does not mutate; safe for Alfred to call before submit.
 */
export function evaluateTrustPostureForProposedKind(
  kind: string,
  payload: JarvisConfigPosturePayload
): TrustPostureEvaluation {
  const messages: string[] = [];
  const tp = payload.trustPosture ? parseTrustPosture(payload.trustPosture) : null;
  const parseOk = tp !== null;

  if (!parseOk && !payload.error) {
    messages.push("Jarvis trustPosture missing or invalid in /api/config — treat posture as unknown.");
  }
  if (payload.error) {
    messages.push(`Jarvis config error: ${payload.error}`);
  }

  const ingressLikelyRejected =
    payload.ingressOpenclawEnabled === false ||
    payload.openclawAllowed === false;

  if (ingressLikelyRejected) {
    messages.push(
      "Ingress likely rejected: OpenClaw ingress disabled or connector not allowlisted on Jarvis."
    );
  }

  const codeApplyLikelyBlockedAtExecute =
    kind === "code.apply" &&
    parseOk &&
    Array.isArray(tp!.codeApplyBlockReasons) &&
    tp!.codeApplyBlockReasons.length > 0;

  if (codeApplyLikelyBlockedAtExecute) {
    messages.push(
      "code.apply would likely be blocked at execute under current Jarvis posture: " +
        tp!.codeApplyBlockReasons.join("; ")
    );
  }

  const executeRequiresStepUp =
    payload.authEnabled === true && parseOk && tp!.stepUpValid === false;

  if (payload.authEnabled === true && parseOk && tp!.stepUpValid === null) {
    messages.push(
      "Auth is on but step-up state is not applicable in this client context (no session cookie) — do not claim step-up status."
    );
  }

  if (executeRequiresStepUp) {
    messages.push(
      "Execute path will require valid step-up in the browser before policy allows execution."
    );
  }

  if (parseOk) {
    messages.push(`Jarvis execution surface: ${tp!.executionSurfaceLabel}`);
  }

  return {
    fetchOk: true,
    parseOk,
    payload,
    messages,
    ingressLikelyRejected,
    codeApplyLikelyBlockedAtExecute,
    executeRequiresStepUp,
  };
}

/**
 * Full preflight: fetch + evaluate. Use from Alfred / CLI before submitProposal.
 */
export async function preflightTrustPostureForKind(
  kind: string,
  hudBaseUrl?: string
): Promise<TrustPostureEvaluation & { httpStatus: number }> {
  const { ok, status, json } = await fetchJarvisConfigPosture(hudBaseUrl);
  if (!ok) {
    return {
      fetchOk: false,
      httpStatus: status,
      parseOk: false,
      payload: json,
      messages: [
        `GET /api/config failed (HTTP ${status || "?"}) — Jarvis posture unknown; do not claim ingress, execute, or safety.`,
        ...(json.error ? [String(json.error)] : []),
      ],
      ingressLikelyRejected: false,
      codeApplyLikelyBlockedAtExecute: false,
      executeRequiresStepUp: false,
    };
  }
  const ev = evaluateTrustPostureForProposedKind(kind, json);
  return { ...ev, httpStatus: status };
}
