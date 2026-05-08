#!/usr/bin/env node
/**
 * v0.2a Golden loop: signed ingress (system.note) → pending → approve → execute
 * → receipt/trace → audit export + replay (CI-safe isolated JARVIS_ROOT).
 *
 * Usage:
 *   pnpm golden-loop
 *
 * Default: spawns `next start` on 127.0.0.1 with a fresh JARVIS_ROOT under
 * `.golden-loop-tmp/` in the repo (gitignored). **Requires a fresh `pnpm build`** (`.next/BUILD_ID`).
 *
 * Use GOLDEN_LOOP_USE_EXISTING=1 to hit a server you already started (`pnpm dev`); that path is not isolated.
 *
 * **Real outbound email (v0.2b):** `pnpm golden-loop:email` — gated; never runs in CI by default.
 *
 * Secrets: use a throwaway secret for ingress; never commit `.env` / `.env.local`.
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

function fail(msg) {
  console.error(`\ngolden-loop FAILED: ${msg}\n`);
  process.exit(1);
}

async function main() {
  const useExisting = process.env.GOLDEN_LOOP_USE_EXISTING === "1";
  const port = pickPort();
  const baseUrl = (
    process.env.JARVIS_HUD_BASE_URL ||
    (useExisting ? `http://127.0.0.1:3000` : `http://127.0.0.1:${port}`)
  ).replace(/\/$/, "");

  let jarvisRoot = process.env.JARVIS_ROOT;
  let secret = process.env.JARVIS_INGRESS_OPENCLAW_SECRET;
  let serverProc = null;

  if (useExisting) {
    secret = ensureSecret(secret);
    console.log(`golden-loop: GOLDEN_LOOP_USE_EXISTING=1 → ${baseUrl} (JARVIS_ROOT=${jarvisRoot ?? "(process default ~/jarvis)"})`);
    await waitForServer(baseUrl);
  } else {
    const parent =
      process.env.GOLDEN_LOOP_JARVIS_PARENT ||
      join(REPO_ROOT, ".golden-loop-tmp");
    mkdirSync(parent, { recursive: true });
    jarvisRoot = mkdtempSync(join(parent, "jarvis-golden-"));
    secret = ensureSecret(secret || DEFAULT_CI_SECRET);
    const spawned = spawnNextServer({ port, jarvisRoot, secret });
    serverProc = spawned.proc;
    serverProc.on("error", (err) => fail(`spawn failed: ${err.message}`));

    console.log(`golden-loop: JARVIS_ROOT=${jarvisRoot}`);
    console.log(`golden-loop: starting Next (${spawned.mode}) on ${baseUrl}`);

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

  const marker = `golden-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const ingressBody = {
    kind: "system.note",
    title: `Golden loop v0.2a ${marker}`,
    summary: "CI golden path system.note",
    payload: { note: `Receipt lineage test ${marker}` },
    agent: "golden-loop",
    source: { connector: "openclaw" },
  };

  try {
    await runIngressApproveExecuteTraceExport({
      baseUrl,
      secret,
      ingressBody,
      successLabel: "v0.2a system.note",
      fail,
      requireProviderMessageId: false,
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
