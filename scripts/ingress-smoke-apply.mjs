#!/usr/bin/env node
/**
 * Smoke test: validate code.apply ingress end-to-end.
 * Run with: pnpm jarvis:smoke:apply
 * Requires: JARVIS_INGRESS_OPENCLAW_SECRET (min 32 chars)
 *           JARVIS_INGRESS_OPENCLAW_ENABLED=true
 *           JARVIS_INGRESS_ALLOWLIST_CONNECTORS=openclaw
 *           Dev server on port 3000 (or set JARVIS_HUD_BASE_URL)
 *
 * Sends a tiny unified diff that would add a comment line (does not execute).
 */

import { postOpenClawIngressWithRetry } from "./lib/openclaw-ingress-fetch.mjs";

const BASE = process.env.JARVIS_HUD_BASE_URL ?? "http://localhost:3000";
const SECRET = process.env.JARVIS_INGRESS_OPENCLAW_SECRET;

const TINY_PATCH = `diff --git a/README.md b/README.md
index 1234567..abcdefg 100644
--- a/README.md
+++ b/README.md
@@ -1,3 +1,4 @@
 # Jarvis HUD
+
 Smoke test: code.apply ingress.
`;

async function main() {
  if (!SECRET || SECRET.length < 32) {
    console.error("JARVIS_INGRESS_OPENCLAW_SECRET required (min 32 chars)");
    process.exit(1);
  }

  const body = {
    kind: "code.apply",
    title: "Add RuntimeTelemetryStrip smoke line",
    summary: "Smoke test: validates code.apply ingress accepts top-level patch",
    patch: TINY_PATCH,
    source: { connector: "openclaw" },
  };

  const res = await postOpenClawIngressWithRetry(BASE, SECRET, body);

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }

  if (res.ok && json?.ok === true) {
    console.log("code.apply ingress smoke OK");
    console.log("id:", json.id);
    console.log("traceId:", json.traceId);
    console.log("status:", json.status);
    console.log("");
    console.log("→ Pending proposal created. Open Jarvis HUD to approve and execute.");
    return;
  }

  console.error("code.apply ingress smoke failed:", res.status, json?.error ?? text);
  if (res.status === 400 && json?.error) {
    console.error("→ Check: patch required, max 1MB, no binary (null bytes)");
  } else if (res.status === 401) {
    console.error("→ Check signature. See docs/security/openclaw-ingress-signing.md");
  } else if (res.status === 403) {
    console.error("→ Check JARVIS_INGRESS_OPENCLAW_ENABLED, secret, allowlist");
  }
  process.exit(1);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
