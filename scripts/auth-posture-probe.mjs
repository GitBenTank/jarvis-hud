#!/usr/bin/env node
/**
 * Phase 2 — auth / human-authority probe (cookieless, pass/fail where applicable).
 * Does not replace machine-wired; run both when validating a host.
 *
 * Usage: from jarvis-hud — pnpm auth-posture
 * Optional: JARVIS_EXPECT_AUTH=true — fail if server has auth disabled (serious-mode guard)
 * Optional: JARVIS_HUD_ENV_FILE, JARVIS_HUD_BASE_URL / JARVIS_BASE_URL
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ENV_PATH = process.env.JARVIS_HUD_ENV_FILE ?? resolve(ROOT, ".env.local");
const FETCH_TIMEOUT_MS = 8000;

function parseEnvLocal(text) {
  /** @type {Record<string, string>} */
  const out = {};
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function normBase(raw) {
  const u = new URL(raw);
  return `${u.protocol}//${u.host}`;
}

function fail(step, msg) {
  console.error(`FAIL [${step}] ${msg}`);
  process.exit(1);
}

function ok(step, msg) {
  console.log(`OK   [${step}] ${msg}`);
}

console.log("Auth posture probe (Phase 2)");
console.log("─".repeat(44));

const expectSerious = process.env.JARVIS_EXPECT_AUTH === "true";

let envFile = {};
const haveEnvFile = existsSync(ENV_PATH);
if (haveEnvFile) {
  envFile = parseEnvLocal(readFileSync(ENV_PATH, "utf8"));
  ok("env", `.env.local read (${ENV_PATH})`);
} else {
  console.log(`WARN [env] no ${ENV_PATH} — drift vs file skipped; secret checks use process env`);
}

const fileWantsAuth =
  (haveEnvFile ? envFile.JARVIS_AUTH_ENABLED : process.env.JARVIS_AUTH_ENABLED) === "true";
const fileSecret =
  envFile.JARVIS_AUTH_SECRET ?? process.env.JARVIS_AUTH_SECRET ?? "";
const ingressOn =
  envFile.JARVIS_INGRESS_OPENCLAW_ENABLED === "true" ||
  process.env.JARVIS_INGRESS_OPENCLAW_ENABLED === "true";

const baseRaw =
  envFile.JARVIS_HUD_BASE_URL ??
  envFile.JARVIS_BASE_URL ??
  process.env.JARVIS_HUD_BASE_URL ??
  process.env.JARVIS_BASE_URL ??
  "http://127.0.0.1:3000";

let base;
try {
  base = normBase(baseRaw);
} catch {
  fail("env", `invalid base URL: ${baseRaw}`);
}

let res;
try {
  res = await fetch(`${base}/api/config`, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
} catch (e) {
  fail("jarvis", `GET /api/config failed — ${e.message}`);
}

if (res.status === 500) {
  let msg = "HTTP 500";
  try {
    const j = await res.json();
    if (j.error) msg = j.error;
  } catch {
    /* ignore */
  }
  fail("config", msg);
}

if (!res.ok) {
  fail("config", `GET /api/config → HTTP ${res.status}`);
}

const cfg = await res.json();
const serverAuth = cfg.authEnabled === true;

if (haveEnvFile && Object.prototype.hasOwnProperty.call(envFile, "JARVIS_AUTH_ENABLED")) {
  if (fileWantsAuth !== serverAuth) {
    fail(
      "drift",
      `JARVIS_AUTH_ENABLED in .env.local (${fileWantsAuth}) ≠ live authEnabled (${serverAuth}) — restart pnpm dev`
    );
  }
  ok("drift", `file and server agree: authEnabled=${serverAuth}`);
} else if (!haveEnvFile) {
  console.log(`SKIP [drift] no .env.local — live authEnabled=${serverAuth}`);
} else {
  ok("drift", `JARVIS_AUTH_ENABLED not set in file — live authEnabled=${serverAuth} (add explicit true/false to catch drift)`);
}

if (expectSerious && !serverAuth) {
  fail(
    "expect",
    "JARVIS_EXPECT_AUTH=true but auth is off — not acceptable for declared serious mode"
  );
}

if (serverAuth) {
  if (!fileSecret || fileSecret.length < 16) {
    fail("secret", "JARVIS_AUTH_ENABLED but JARVIS_AUTH_SECRET missing or < 16 chars in .env.local");
  }
  ok("secret", `JARVIS_AUTH_SECRET length ${fileSecret.length} (threshold ≥16)`);

  const su = cfg.trustPosture?.stepUpValid;
  if (su === true) {
    ok("step-up", "cookieless fetch saw stepUpValid=true (unexpected; ignoring)");
  } else if (su === false) {
    ok(
      "step-up",
      "stepUpValid=false without browser cookies — expected for this probe; humans use HUD session + step-up for execute"
    );
  } else {
    ok("step-up", `stepUpValid=${su} — see GET /api/config trust contract`);
  }
} else {
  console.log("");
  console.log(
    "MODE [convenience] JARVIS_AUTH_ENABLED is off — HUD approve/execute in the browser is not gated by Jarvis session."
  );
  console.log(
    "         Ingress is still gated by HMAC + allowlist: possession of JARVIS_INGRESS_OPENCLAW_SECRET can submit proposals."
  );
  console.log(
    "         That secret proves shared capability, not human identity — see operating-assumptions §2."
  );
  if (ingressOn) {
    console.log(
      "         OpenClaw ingress is enabled — treat the secret like a capability token; rotate if leaked."
    );
  }
}

console.log("");
console.log("PASS — auth posture probe complete (see MODE lines above).");
console.log("Ref: docs/strategy/operating-assumptions.md §2 · pnpm machine-wired for stack wiring");
