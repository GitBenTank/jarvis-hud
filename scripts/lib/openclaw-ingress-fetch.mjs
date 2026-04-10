/**
 * Shared OpenClaw-signed POST to Jarvis `POST /api/ingress/openclaw`.
 * Same HMAC contract as `docs/security/openclaw-ingress-signing.md` and legacy smoke scripts.
 */

import { createHmac, randomUUID } from "node:crypto";

export function signOpenClawIngress(secret, timestamp, nonce, rawBody) {
  const message = `${timestamp}.${nonce}.${rawBody}`;
  return createHmac("sha256", secret).update(message, "utf8").digest("hex");
}

/**
 * @param {string} baseUrl e.g. http://localhost:3000 (no trailing slash required)
 * @param {string} secret JARVIS_INGRESS_OPENCLAW_SECRET
 * @param {Record<string, unknown>} bodyObject JSON-serializable ingress body
 */
export async function postOpenClawIngress(baseUrl, secret, bodyObject) {
  const rawBody = JSON.stringify(bodyObject);
  const timestamp = String(Date.now());
  const nonce = randomUUID();
  const signature = signOpenClawIngress(secret, timestamp, nonce, rawBody);
  const base = baseUrl.replace(/\/$/, "");
  return fetch(`${base}/api/ingress/openclaw`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Jarvis-Timestamp": timestamp,
      "X-Jarvis-Nonce": nonce,
      "X-Jarvis-Signature": signature,
    },
    body: rawBody,
  });
}
