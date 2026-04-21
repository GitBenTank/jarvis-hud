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

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Same as postOpenClawIngress but retries on transient failures (cold server, 429, 502/503/504).
 * Each attempt uses a fresh timestamp/nonce/signature.
 */
export async function postOpenClawIngressWithRetry(baseUrl, secret, bodyObject, options = {}) {
  const maxAttempts = options.maxAttempts ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 600;
  let lastRes = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      lastRes = await postOpenClawIngress(baseUrl, secret, bodyObject);
      const retryable =
        lastRes.status === 429 ||
        lastRes.status === 502 ||
        lastRes.status === 503 ||
        lastRes.status === 504;
      if (!retryable || attempt === maxAttempts) {
        return lastRes;
      }
      const extra = lastRes.status === 429 ? 1000 : 0;
      await sleep(baseDelayMs * attempt + extra);
    } catch {
      if (attempt === maxAttempts) {
        throw new Error(
          `Ingress POST failed after ${maxAttempts} attempts (connection error — is Jarvis running on ${baseUrl}?)`
        );
      }
      await sleep(baseDelayMs * attempt);
    }
  }
  return lastRes;
}
