/**
 * Demo-only outbound email: single allowlisted recipient (thesis: governed execution).
 * Ingress + execute enforce this; do not widen without policy review.
 */
export const SEND_EMAIL_DEMO_ALLOWED_TO = "devhousehsv@gmail.com";

export const SEND_EMAIL_SUBJECT_MAX = 200;
export const SEND_EMAIL_BODY_MAX = 50_000;

export type SendEmailPayload = {
  to: string;
  subject: string;
  body: string;
};

export function parseSendEmailPayload(payload: unknown):
  | { ok: true; value: SendEmailPayload }
  | { ok: false; message: string; field?: string } {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { ok: false, message: "send_email requires payload (object)", field: "payload" };
  }
  const p = payload as Record<string, unknown>;
  const inner =
    p.payload != null && typeof p.payload === "object" && !Array.isArray(p.payload)
      ? (p.payload as Record<string, unknown>)
      : p;
  const to = typeof inner.to === "string" ? inner.to.trim() : "";
  const subject = typeof inner.subject === "string" ? inner.subject.trim() : "";
  const body = typeof inner.body === "string" ? inner.body : "";
  if (!to) {
    return { ok: false, message: "send_email requires payload.to (non-empty string)", field: "payload.to" };
  }
  if (to !== SEND_EMAIL_DEMO_ALLOWED_TO) {
    return {
      ok: false,
      message: `send_email demo mode: payload.to must be exactly ${SEND_EMAIL_DEMO_ALLOWED_TO}`,
      field: "payload.to",
    };
  }
  if (!subject) {
    return { ok: false, message: "send_email requires payload.subject (non-empty string)", field: "payload.subject" };
  }
  if (subject.length > SEND_EMAIL_SUBJECT_MAX) {
    return {
      ok: false,
      message: `send_email payload.subject must be ≤ ${SEND_EMAIL_SUBJECT_MAX} chars`,
      field: "payload.subject",
    };
  }
  if (!body.trim()) {
    return { ok: false, message: "send_email requires payload.body (non-empty string)", field: "payload.body" };
  }
  if (body.length > SEND_EMAIL_BODY_MAX) {
    return {
      ok: false,
      message: `send_email payload.body must be ≤ ${SEND_EMAIL_BODY_MAX} chars`,
      field: "payload.body",
    };
  }
  return { ok: true, value: { to, subject, body } };
}
