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
 * Attach to an already-running server (uses YOUR disk + env — not CI-isolated):
 *   GOLDEN_LOOP_USE_EXISTING=1 JARVIS_HUD_BASE_URL=http://127.0.0.1:3000 \\
 *     JARVIS_INGRESS_OPENCLAW_SECRET=… pnpm golden-loop
 *
 * Secrets: use a throwaway secret for this script; never commit `.env` / `.env.local`.
 * If a real ingress secret was ever exposed, rotate it before serious use.
 */

import { spawn } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { postOpenClawIngressWithRetry } from "./lib/openclaw-ingress-fetch.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");

const DEFAULT_CI_SECRET = "ci-golden-loop-openclaw-secret-32c-min";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function pickPort() {
  const fromEnv = process.env.GOLDEN_LOOP_PORT;
  if (fromEnv && /^\d+$/.test(fromEnv)) return Number(fromEnv);
  return 31000 + Math.floor(Math.random() * 900);
}

function ensureSecret(s) {
  if (!s || String(s).length < 32) {
    console.error(
      "golden-loop: JARVIS_INGRESS_OPENCLAW_SECRET must be ≥32 chars (set in env or use spawned-server default)."
    );
    process.exit(1);
  }
  return String(s);
}

async function waitForServer(baseUrl, maxAttempts = 90, delayMs = 500) {
  for (let i = 1; i <= maxAttempts; i++) {
    try {
      const res = await fetch(`${baseUrl}/api/config`, { signal: AbortSignal.timeout(8000) });
      if (res.ok) return;
    } catch {
      /* retry */
    }
    if (i === maxAttempts) {
      throw new Error(`Server not ready at ${baseUrl}/api/config after ${maxAttempts} attempts`);
    }
    await sleep(delayMs);
  }
}

function spawnNextServer({ port, jarvisRoot, secret }) {
  if (!existsSync(join(REPO_ROOT, ".next", "BUILD_ID"))) {
    console.error(
      "golden-loop: missing `.next/BUILD_ID` — run `pnpm build` first, or use GOLDEN_LOOP_USE_EXISTING=1 with your own `pnpm dev`."
    );
    process.exit(1);
  }
  const mode = "start";
  const args = ["exec", "next", "start", "-H", "127.0.0.1", "-p", String(port)];
  const proc = spawn("pnpm", args, {
    cwd: REPO_ROOT,
    env: {
      ...process.env,
      NODE_ENV: "production",
      JARVIS_ROOT: jarvisRoot,
      JARVIS_INGRESS_OPENCLAW_ENABLED: "true",
      JARVIS_INGRESS_OPENCLAW_SECRET: secret,
      JARVIS_INGRESS_ALLOWLIST_CONNECTORS: "openclaw",
      JARVIS_AUTH_ENABLED: "false",
      PORT: String(port),
      HOSTNAME: "127.0.0.1",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  let tail = "";
  const collect = (chunk) => {
    tail = (tail + chunk.toString()).slice(-4000);
  };
  proc.stdout?.on("data", collect);
  proc.stderr?.on("data", collect);
  proc.logTail = () => tail;
  return { proc, mode };
}

async function awaitChildExit(proc, ms) {
  return new Promise((resolve) => {
    const t = setTimeout(() => resolve(false), ms);
    proc.once("exit", () => {
      clearTimeout(t);
      resolve(true);
    });
  });
}

async function killServer(proc) {
  if (!proc || proc.exitCode != null) return;
  proc.kill("SIGTERM");
  const exited = await awaitChildExit(proc, 8000);
  if (!exited) {
    try {
      proc.kill("SIGKILL");
    } catch {
      /* ignore */
    }
  }
}

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
    const ingRes = await postOpenClawIngressWithRetry(baseUrl, secret, ingressBody, {
      maxAttempts: 5,
      baseDelayMs: 400,
    });
    const ingText = await ingRes.text();
    let ingJson;
    try {
      ingJson = JSON.parse(ingText);
    } catch {
      ingJson = null;
    }
    if (!ingRes.ok || !ingJson?.ok || !ingJson.id || !ingJson.traceId) {
      if (serverProc?.logTail) console.error(serverProc.logTail());
      fail(`ingress: HTTP ${ingRes.status} ${ingJson?.error ?? ingText}`);
    }

    const approvalId = ingJson.id;
    const traceId = ingJson.traceId;
    console.log(`golden-loop: ingress OK id=${approvalId} traceId=${traceId}`);

    let dateKey;
    for (let attempt = 1; attempt <= 30; attempt++) {
      const listRes = await fetch(`${baseUrl}/api/approvals?status=pending`);
      const listJson = await listRes.json().catch(() => null);
      dateKey = listJson?.dateKey;
      const pending = Array.isArray(listJson?.approvals) ? listJson.approvals : [];
      if (pending.some((a) => a.id === approvalId)) break;
      if (attempt === 30) fail("proposal never appeared in GET /api/approvals?status=pending");
      await sleep(200);
    }

    const apprRes = await fetch(`${baseUrl}/api/approvals/${approvalId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve" }),
    });
    if (!apprRes.ok) {
      const t = await apprRes.text();
      fail(`approve: HTTP ${apprRes.status} ${t}`);
    }
    console.log("golden-loop: approve OK");

    const execRes = await fetch(`${baseUrl}/api/execute/${approvalId}`, { method: "POST" });
    const execText = await execRes.text();
    let execJson;
    try {
      execJson = JSON.parse(execText);
    } catch {
      execJson = null;
    }
    if (!execRes.ok || !execJson?.ok) {
      fail(`execute: HTTP ${execRes.status} ${execJson?.error ?? execText}`);
    }
    console.log("golden-loop: execute OK");

    const traceRes = await fetch(`${baseUrl}/api/traces/${encodeURIComponent(traceId)}`);
    if (!traceRes.ok) fail(`trace: HTTP ${traceRes.status} ${await traceRes.text()}`);
    const traceJson = await traceRes.json();
    if (!traceJson || traceJson.traceId !== traceId) {
      fail("trace: response missing or traceId mismatch");
    }
    console.log("golden-loop: trace GET OK");

    const replayRes = await fetch(`${baseUrl}/api/traces/${encodeURIComponent(traceId)}/replay`);
    if (!replayRes.ok) fail(`replay: HTTP ${replayRes.status} ${await replayRes.text()}`);
    const replayJson = await replayRes.json();
    if (!replayJson?.traceId || replayJson.traceId !== traceId) {
      fail("replay: traceId mismatch");
    }
    if (!replayJson.proposal) fail("replay: missing proposal");
    if (!Array.isArray(replayJson.receipts) || replayJson.receipts.length < 1) {
      fail("replay: expected at least one receipt");
    }
    if (!replayJson.execution) fail("replay: missing execution summary");
    console.log("golden-loop: replay OK");

    const exportUrl = `${baseUrl}/api/audit/export?start=${encodeURIComponent(dateKey)}&end=${encodeURIComponent(dateKey)}`;
    const expRes = await fetch(exportUrl);
    if (!expRes.ok) fail(`audit export: HTTP ${expRes.status} ${await expRes.text()}`);
    const bundle = await expRes.json();
    const ids = new Set(bundle?.index?.approvalIds ?? []);
    const traces = new Set(bundle?.index?.traceIds ?? []);
    if (!ids.has(approvalId)) fail(`audit export: approvalId ${approvalId} not in index.approvalIds`);
    if (!traces.has(traceId)) fail(`audit export: traceId ${traceId} not in index.traceIds`);
    const evMatch = (bundle.events ?? []).some(
      (e) => e && typeof e === "object" && e.id === approvalId
    );
    if (!evMatch) fail("audit export: event row not found for approvalId");
    console.log("golden-loop: audit export OK");

    console.log("\ngolden-loop: ALL STEPS PASSED (v0.2a system.note)\n");
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
