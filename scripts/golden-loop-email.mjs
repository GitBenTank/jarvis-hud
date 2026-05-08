#!/usr/bin/env node
/**
 * v0.2b Golden loop (send_email): same spine as v0.2a but exercises real Gmail send.
 *
 * **Gated — does not run in CI.** Requires explicit operator intent + demo-safe allowlist.
 *
 * Prerequisites:
 *   DEMO_EMAIL_ENABLED=1
 *   DEMO_EMAIL_TO=<exact allowlist address — must match src/lib/send-email-constants.ts>
 *   DEMO_EMAIL_USER / DEMO_EMAIL_PASS (Gmail app password) — passed through to the Next server
 *
 * **Shell env:** This file is a Node entrypoint; it only reads `DEMO_EMAIL_*` from the **shell process**.
 * If values live in `.env.local`, source before running: `set -a && source .env.local && set +a && DEMO_EMAIL_ENABLED=1 pnpm golden-loop:email`
 *
 * Usage:
 *   pnpm build
 *   DEMO_EMAIL_ENABLED=1 DEMO_EMAIL_TO=devhousehsv@gmail.com DEMO_EMAIL_USER=… DEMO_EMAIL_PASS=… pnpm golden-loop:email
 *
 * Attach to running `pnpm dev` (uses your JARVIS_ROOT — not isolated):
 *   GOLDEN_LOOP_USE_EXISTING=1 JARVIS_HUD_BASE_URL=http://127.0.0.1:3000 \\
 *     JARVIS_INGRESS_OPENCLAW_SECRET=… \\
 *     DEMO_EMAIL_ENABLED=1 DEMO_EMAIL_TO=… DEMO_EMAIL_USER=… DEMO_EMAIL_PASS=… \\
 *     pnpm golden-loop:email
 *
 * Source of truth: docs/video/investor-demo-full-runbook.md
 */

import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import {
  REPO_ROOT,
  DEFAULT_CI_SECRET,
  pickPort,
  ensureSecret,
  waitForServer,
  spawnNextServer,
  killServer,
  runIngressApproveExecuteTraceExport,
} from "./lib/golden-loop-shared.mjs";

/** Keep in sync with `src/lib/send-email-constants.ts` SEND_EMAIL_DEMO_ALLOWED_TO */
const SEND_EMAIL_DEMO_ALLOWED_TO = "devhousehsv@gmail.com";

function fail(msg) {
  console.error(`\ngolden-loop:email FAILED: ${msg}\n`);
  process.exit(1);
}

function requireDemoGates() {
  if (process.env.DEMO_EMAIL_ENABLED !== "1") {
    console.error(
      "golden-loop:email: set DEMO_EMAIL_ENABLED=1 to run (sends one real email to the demo allowlist)."
    );
    process.exit(1);
  }
  const to = process.env.DEMO_EMAIL_TO?.trim();
  if (!to) {
    console.error("golden-loop:email: DEMO_EMAIL_TO is required (must match send-email policy allowlist).");
    process.exit(1);
  }
  if (to !== SEND_EMAIL_DEMO_ALLOWED_TO) {
    console.error(
      `golden-loop:email: DEMO_EMAIL_TO must be exactly ${SEND_EMAIL_DEMO_ALLOWED_TO} (demo allowlist in code).`
    );
    process.exit(1);
  }
  const user = process.env.DEMO_EMAIL_USER?.trim();
  const pass = process.env.DEMO_EMAIL_PASS?.trim();
  if (!user || !pass) {
    console.error(
      "golden-loop:email: DEMO_EMAIL_USER and DEMO_EMAIL_PASS must be set (server executes real send)."
    );
    process.exit(1);
  }
}

async function main() {
  requireDemoGates();

  const useExisting = process.env.GOLDEN_LOOP_USE_EXISTING === "1";
  const port = pickPort();
  const baseUrl = (
    process.env.JARVIS_HUD_BASE_URL ||
    (useExisting ? `http://127.0.0.1:3000` : `http://127.0.0.1:${port}`)
  ).replace(/\/$/, "");

  const demoTo = process.env.DEMO_EMAIL_TO.trim();
  const extraEnv = {
    DEMO_EMAIL_USER: process.env.DEMO_EMAIL_USER.trim(),
    DEMO_EMAIL_PASS: process.env.DEMO_EMAIL_PASS.trim(),
  };
  if (process.env.DEMO_EMAIL_FROM?.trim()) {
    extraEnv.DEMO_EMAIL_FROM = process.env.DEMO_EMAIL_FROM.trim();
  }

  let jarvisRoot = process.env.JARVIS_ROOT;
  let secret = process.env.JARVIS_INGRESS_OPENCLAW_SECRET;
  let serverProc = null;

  if (useExisting) {
    secret = ensureSecret(secret);
    console.log(`golden-loop:email: GOLDEN_LOOP_USE_EXISTING=1 → ${baseUrl}`);
    await waitForServer(baseUrl);
  } else {
    const parent =
      process.env.GOLDEN_LOOP_JARVIS_PARENT ||
      join(REPO_ROOT, ".golden-loop-tmp");
    mkdirSync(parent, { recursive: true });
    jarvisRoot = mkdtempSync(join(parent, "jarvis-golden-email-"));
    secret = ensureSecret(secret || DEFAULT_CI_SECRET);
    const spawned = spawnNextServer({ port, jarvisRoot, secret, extraEnv });
    serverProc = spawned.proc;
    serverProc.on("error", (err) => fail(`spawn failed: ${err.message}`));

    console.log(`golden-loop:email: JARVIS_ROOT=${jarvisRoot}`);
    console.log(`golden-loop:email: starting Next (${spawned.mode}) on ${baseUrl}`);

    try {
      await waitForServer(baseUrl);
    } catch (e) {
      console.error(serverProc.logTail?.() ?? "");
      await killServer(serverProc);
      try {
        rmSync(jarvisRoot, { recursive: true, force: true });
      } catch {
        /* ignore */
      }
      fail(e instanceof Error ? e.message : String(e));
    }
  }

  const marker = `golden-email-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const ingressBody = {
    kind: "send_email",
    title: `Golden loop v0.2b ${marker}`,
    summary: "Governed send_email proof",
    payload: {
      to: demoTo,
      subject: `Jarvis golden-loop v0.2b ${marker}`,
      body: `One governed outbound message.\nMarker: ${marker}\n`,
    },
    agent: "golden-loop-email",
    source: { connector: "openclaw" },
  };

  try {
    await runIngressApproveExecuteTraceExport({
      baseUrl,
      secret,
      ingressBody,
      successLabel: "v0.2b send_email (real provider receipt)",
      fail,
      requireProviderMessageId: true,
    });
  } catch (e) {
    if (serverProc?.logTail) console.error(serverProc.logTail());
    fail(e instanceof Error ? e.message : String(e));
  } finally {
    await killServer(serverProc);
    if (!useExisting && jarvisRoot) {
      try {
        rmSync(jarvisRoot, { recursive: true, force: true });
      } catch {
        /* ignore */
      }
    }
  }
}

main();
