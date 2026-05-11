/**
 * Governed LinkedIn post proposals — v1 dry-run only (no live API).
 * Execute writes a ready-to-post artifact + receipt; manual publish outside Jarvis.
 */

export const LINKEDIN_POST_BODY_MAX = 12_000;
export const LINKEDIN_ACCOUNT_LABEL_MAX = 120;

/** Visibility labels for operator UX; v1 does not call LinkedIn. */
export const LINKEDIN_POST_VISIBILITY = ["PUBLIC", "CONNECTIONS"] as const;
export type LinkedInPostVisibility = (typeof LINKEDIN_POST_VISIBILITY)[number];

export type LinkedInPostPayload = {
  body: string;
  visibility: LinkedInPostVisibility;
  /** Operator-facing label (e.g. profile or org); not verified against API in v1. */
  accountLabel: string;
};

const VISIBILITY_SET = new Set<string>(LINKEDIN_POST_VISIBILITY);

export function parseLinkedInPostPayload(payload: unknown):
  | { ok: true; value: LinkedInPostPayload }
  | { ok: false; message: string; field?: string } {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { ok: false, message: "linkedin.post requires payload (object)", field: "payload" };
  }
  const p = payload as Record<string, unknown>;
  const inner =
    p.payload != null && typeof p.payload === "object" && !Array.isArray(p.payload)
      ? (p.payload as Record<string, unknown>)
      : p;

  const body = typeof inner.body === "string" ? inner.body : "";
  const visibilityRaw = typeof inner.visibility === "string" ? inner.visibility.trim().toUpperCase() : "";
  const accountLabel =
    typeof inner.accountLabel === "string" ? inner.accountLabel.trim() : "";

  if (!body.trim()) {
    return { ok: false, message: "linkedin.post requires payload.body (non-empty string)", field: "payload.body" };
  }
  if (body.length > LINKEDIN_POST_BODY_MAX) {
    return {
      ok: false,
      message: `linkedin.post payload.body must be ≤ ${LINKEDIN_POST_BODY_MAX} chars`,
      field: "payload.body",
    };
  }

  if (!visibilityRaw || !VISIBILITY_SET.has(visibilityRaw)) {
    return {
      ok: false,
      message: `linkedin.post requires payload.visibility as one of: ${LINKEDIN_POST_VISIBILITY.join(", ")}`,
      field: "payload.visibility",
    };
  }

  if (!accountLabel) {
    return {
      ok: false,
      message: "linkedin.post requires payload.accountLabel (non-empty string)",
      field: "payload.accountLabel",
    };
  }
  if (accountLabel.length > LINKEDIN_ACCOUNT_LABEL_MAX) {
    return {
      ok: false,
      message: `linkedin.post payload.accountLabel must be ≤ ${LINKEDIN_ACCOUNT_LABEL_MAX} chars`,
      field: "payload.accountLabel",
    };
  }

  return {
    ok: true,
    value: {
      body,
      visibility: visibilityRaw as LinkedInPostVisibility,
      accountLabel,
    },
  };
}
