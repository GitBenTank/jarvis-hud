/**
 * Minimal Jarvis OpenClaw ingress client — signs and POSTs only.
 * Does not claim execution; returns HTTP status + parsed ingress JSON when possible.
 * Signing contract: docs/security/openclaw-ingress-signing.md
 */

import { createHmac, randomUUID } from "node:crypto";

function sign(secret: string, timestamp: string, nonce: string, rawBody: string): string {
  const message = `${timestamp}.${nonce}.${rawBody}`;
  return createHmac("sha256", secret).update(message, "utf8").digest("hex");
}

function baseUrl(): string {
  const raw =
    process.env.JARVIS_BASE_URL ??
    process.env.JARVIS_HUD_BASE_URL ??
    "http://localhost:3000";
  return raw.replace(/\/$/, "");
}

export type IngressSuccess = {
  ok: true;
  status: number;
  id: string;
  traceId: string;
  proposalStatus: string;
  rawBody: string;
};

export type IngressFailure = {
  ok: false;
  status: number;
  error: string;
  rawBody: string;
};

export type SubmitOpenClawIngressResult = IngressSuccess | IngressFailure;

/**
 * POST body to /api/ingress/openclaw with HMAC when JARVIS_INGRESS_OPENCLAW_SECRET (≥32) is set.
 * Never performs local git or file mutations.
 */
export async function submitOpenClawIngress(
  body: Record<string, unknown>
): Promise<SubmitOpenClawIngressResult> {
  const url = `${baseUrl()}/api/ingress/openclaw`;
  const rawBody = JSON.stringify(body);
  const secret = process.env.JARVIS_INGRESS_OPENCLAW_SECRET;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (secret && secret.length >= 32) {
    const timestamp = String(Date.now());
    const nonce = randomUUID();
    headers["X-Jarvis-Timestamp"] = timestamp;
    headers["X-Jarvis-Nonce"] = nonce;
    headers["X-Jarvis-Signature"] = sign(secret, timestamp, nonce, rawBody);
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: rawBody,
  });

  const text = await res.text();
  let parsed: Record<string, unknown> | null = null;
  try {
    parsed = JSON.parse(text) as Record<string, unknown>;
  } catch {
    parsed = null;
  }

  if (res.ok && parsed && parsed.ok === true && typeof parsed.id === "string") {
    return {
      ok: true,
      status: res.status,
      id: parsed.id,
      traceId: typeof parsed.traceId === "string" ? parsed.traceId : "",
      proposalStatus: typeof parsed.status === "string" ? parsed.status : "pending",
      rawBody: text,
    };
  }

  const errMsg =
    parsed && typeof parsed.error === "string"
      ? parsed.error
      : `Ingress HTTP ${res.status}`;

  return {
    ok: false,
    status: res.status,
    error: errMsg,
    rawBody: text,
  };
}
