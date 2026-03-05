#!/usr/bin/env node
/**
 * Verify an OpenClaw request signature using Jarvis's exact logic.
 * Use when debugging 401 Invalid signature.
 *
 * Run OpenClaw smoke with JARVIS_DEBUG=1, then:
 *   JARVIS_INGRESS_OPENCLAW_SECRET="your-secret" \
 *   node scripts/verify-ingress-signature.mjs <timestamp> <nonce> '<rawBody>'
 *
 * Or with env vars:
 *   TIMESTAMP=... NONCE=... RAW_BODY='...' JARVIS_INGRESS_OPENCLAW_SECRET=... node scripts/verify-ingress-signature.mjs
 */

import { createHmac, timingSafeEqual } from "node:crypto";

const secret = process.env.JARVIS_INGRESS_OPENCLAW_SECRET;
const timestamp = process.env.TIMESTAMP ?? process.argv[2];
const nonce = process.env.NONCE ?? process.argv[3];
const rawBody = process.env.RAW_BODY ?? process.argv[4];

if (!secret || secret.length < 32) {
  console.error("JARVIS_INGRESS_OPENCLAW_SECRET required (min 32 chars)");
  process.exit(1);
}
if (!timestamp || !nonce || !rawBody) {
  console.error("Usage: TIMESTAMP=... NONCE=... RAW_BODY='...' JARVIS_INGRESS_OPENCLAW_SECRET=... node scripts/verify-ingress-signature.mjs");
  console.error("   Or: node scripts/verify-ingress-signature.mjs <timestamp> <nonce> '<rawBody>'");
  process.exit(1);
}

const message = `${timestamp}.${nonce}.${rawBody}`;
const expected = createHmac("sha256", secret).update(message, "utf8").digest("hex");

console.log("secretLen:", secret.length);
console.log("rawBodyLen:", rawBody.length);
console.log("messageLen:", message.length);
console.log("expectedSig:", expected.slice(0, 8) + "..." + expected.slice(-8));
console.log("");

console.log("To test: pass the signature from OpenClaw as SIG env var:");
console.log("  SIG=<openclaw-signature> ... node scripts/verify-ingress-signature.mjs ...");
const provided = process.env.SIG;
if (provided) {
  const ok = expected.length === provided.length && timingSafeEqual(
    Buffer.from(expected, "hex"),
    Buffer.from(provided, "hex")
  );
  console.log("Match:", ok ? "YES" : "NO");
  process.exit(ok ? 0 : 1);
}
