/**
 * POST a normalized ingress body to Jarvis OpenClaw ingress.
 * Uses HMAC signing when JARVIS_INGRESS_OPENCLAW_SECRET is set (same contract as smoke scripts).
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

export type SubmitResult = {
  status: number;
  bodyText: string;
};

/**
 * POST `body` to `${JARVIS_BASE_URL}/api/ingress/openclaw` (with JARVIS_HUD_BASE_URL fallback).
 * If JARVIS_INGRESS_OPENCLAW_SECRET exists and length ≥ 32, adds signing headers; otherwise logs and sends unsigned JSON only.
 */
export async function submitProposal(body: Record<string, unknown>): Promise<SubmitResult> {
  const url = `${baseUrl()}/api/ingress/openclaw`;
  const rawBody = JSON.stringify(body);
  const secret = process.env.JARVIS_INGRESS_OPENCLAW_SECRET;

  /** @type {Record<string, string>} */
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (secret && secret.length >= 32) {
    const timestamp = String(Date.now());
    const nonce = randomUUID();
    headers["X-Jarvis-Timestamp"] = timestamp;
    headers["X-Jarvis-Nonce"] = nonce;
    headers["X-Jarvis-Signature"] = sign(secret, timestamp, nonce, rawBody);
  } else {
    console.warn(
      "[jarvis] JARVIS_INGRESS_OPENCLAW_SECRET missing or short; sending without HMAC (ingress will likely reject)."
    );
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: rawBody,
  });

  const bodyText = await res.text();
  console.log("[jarvis] submit status:", res.status);
  console.log("[jarvis] submit response:", bodyText);

  return { status: res.status, bodyText };
}
