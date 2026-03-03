#!/usr/bin/env node
/**
 * Smoke test: validate OpenClaw ingress end-to-end without OpenClaw.
 * Run with: pnpm ingress:smoke
 * Requires: JARVIS_INGRESS_OPENCLAW_SECRET (min 32 chars)
 *           JARVIS_INGRESS_OPENCLAW_ENABLED=true
 *           JARVIS_INGRESS_ALLOWLIST_CONNECTORS=openclaw
 *           Dev server on port 3000 (or set JARVIS_HUD_BASE_URL)
 */

import { createHmac, randomUUID } from "node:crypto";

const BASE = process.env.JARVIS_HUD_BASE_URL ?? "http://127.0.0.1:3000";
const SECRET = process.env.JARVIS_INGRESS_OPENCLAW_SECRET;

function sign(secret, timestamp, nonce, rawBody) {
  const message = `${timestamp}.${nonce}.${rawBody}`;
  return createHmac("sha256", secret).update(message, "utf8").digest("hex");
}

async function main() {
  if (!SECRET || SECRET.length < 32) {
    console.error("JARVIS_INGRESS_OPENCLAW_SECRET required (min 32 chars)");
    process.exit(1);
  }

  const body = {
    kind: "system.note",
    title: "Ingress smoke test",
    summary: "Created by pnpm ingress:smoke",
    payload: { note: "Smoke test note" },
    source: { connector: "openclaw" },
  };

  const rawBody = JSON.stringify(body);
  const timestamp = String(Date.now());
  const nonce = randomUUID();
  const signature = sign(SECRET, timestamp, nonce, rawBody);

  const res = await fetch(`${BASE}/api/ingress/openclaw`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Jarvis-Timestamp": timestamp,
      "X-Jarvis-Nonce": nonce,
      "X-Jarvis-Signature": signature,
    },
    body: rawBody,
  });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }

  if (res.ok && json?.ok === true) {
    console.log("Ingress smoke OK");
    console.log("id:", json.id);
    console.log("traceId:", json.traceId);
    console.log("status:", json.status);
    return;
  }

  console.error("Ingress smoke failed:", res.status, json?.error ?? text);
  if (res.status === 401) {
    console.error("→ Check signature (secret, timestamp, body). See docs/security/openclaw-ingress-signing.md");
  } else if (res.status === 403) {
    console.error("→ Check JARVIS_INGRESS_OPENCLAW_ENABLED, JARVIS_INGRESS_OPENCLAW_SECRET, JARVIS_INGRESS_ALLOWLIST_CONNECTORS");
  } else if (res.status === 429) {
    console.error("→ Rate limit exceeded. Wait and retry.");
  }
  process.exit(1);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
