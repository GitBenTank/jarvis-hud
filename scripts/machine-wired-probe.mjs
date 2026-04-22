#!/usr/bin/env node
/**
 * Phase 1 machine-wired probe: pass/fail against the blessed stack (no interpretation).
 * Expects jarvis-hud `.env.local` and running Jarvis + OpenClaw gateway for full pass.
 *
 * Usage: from jarvis-hud — pnpm machine-wired
 * Optional: JARVIS_HUD_ENV_FILE=/path/.env.local
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

function normOrigin(u) {
  if (!u) return "";
  const x = new URL(u);
  return `${x.protocol}//${x.host}`;
}

function fail(step, msg) {
  console.error(`FAIL [${step}] ${msg}`);
  process.exit(1);
}

function ok(step, msg) {
  console.log(`OK   [${step}] ${msg}`);
}

console.log("Machine-wired probe (Phase 1 blessed stack)");
console.log("─".repeat(48));

if (!existsSync(ENV_PATH)) {
  fail("env", `missing ${ENV_PATH} — create from README / local-stack-startup`);
}

const envFile = parseEnvLocal(readFileSync(ENV_PATH, "utf8"));
const secret = envFile.JARVIS_INGRESS_OPENCLAW_SECRET;
const controlUrl = envFile.OPENCLAW_CONTROL_UI_URL;
const baseRaw =
  envFile.JARVIS_HUD_BASE_URL ?? envFile.JARVIS_BASE_URL ?? "http://127.0.0.1:3000";
let base;
try {
  base = normOrigin(baseRaw);
} catch {
  fail("env", `invalid JARVIS_HUD_BASE_URL / JARVIS_BASE_URL: ${baseRaw}`);
}

ok("env", `.env.local present at ${ENV_PATH}`);

if (!secret || secret.length < 32) {
  fail("secret", "JARVIS_INGRESS_OPENCLAW_SECRET missing or shorter than 32 chars in .env.local");
}
ok("secret", `JARVIS_INGRESS_OPENCLAW_SECRET length ${secret.length} (threshold ≥32)`);

if (!controlUrl?.trim()) {
  fail(
    "control-ui",
    "OPENCLAW_CONTROL_UI_URL unset in .env.local — set to gateway Control UI origin (see local-stack-startup.md)"
  );
}
let fileControl;
try {
  fileControl = normOrigin(controlUrl);
} catch {
  fail("control-ui", `invalid OPENCLAW_CONTROL_UI_URL: ${controlUrl}`);
}
ok("control-ui", `OPENCLAW_CONTROL_UI_URL=${fileControl}`);

if (baseRaw.includes("localhost") && !baseRaw.includes("127.0.0.1")) {
  console.warn(
    "WARN [origin] JARVIS base uses `localhost`; blessed stack prefers 127.0.0.1 to avoid origin drift — see operating-assumptions §1"
  );
}

let cfg;
try {
  const res = await fetch(`${base}/api/config`, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) {
    fail("jarvis", `GET ${base}/api/config → HTTP ${res.status} (start pnpm dev?)`);
  }
  cfg = await res.json();
} catch (e) {
  fail("jarvis", `Jarvis not reachable at ${base} — ${e.message}`);
}
ok("jarvis", `GET /api/config OK`);

if (!cfg.ingressOpenclawEnabled) {
  fail("ingress", "server reports ingressOpenclawEnabled=false — set JARVIS_INGRESS_OPENCLAW_ENABLED=true and restart");
}
if (!cfg.openclawAllowed) {
  fail("allowlist", "server reports openclawAllowed=false — add openclaw to JARVIS_INGRESS_ALLOWLIST_CONNECTORS and restart");
}
ok("ingress", "ingressOpenclawEnabled + openclawAllowed");

let serverControl = "";
if (cfg.openclawControlUiUrl) {
  try {
    serverControl = normOrigin(cfg.openclawControlUiUrl);
  } catch {
    fail("drift", `server returned invalid openclawControlUiUrl: ${cfg.openclawControlUiUrl}`);
  }
}
if (fileControl && !serverControl) {
  fail(
    "drift",
    "OPENCLAW_CONTROL_UI_URL is in .env.local but server openclawControlUiUrl is null — restart pnpm dev so Next loads env"
  );
}
if (serverControl && fileControl && serverControl !== fileControl) {
  fail(
    "drift",
    `OPENCLAW_CONTROL_UI_URL (${fileControl}) ≠ server openclawControlUiUrl (${serverControl}) — fix .env.local and restart pnpm dev`
  );
}
ok("drift", "Control UI URL matches live server config");

try {
  const u = new URL(controlUrl);
  const probeUrl = `${u.origin}/`;
  const res = await fetch(probeUrl, {
    method: "GET",
    redirect: "follow",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (res.status >= 500) {
    fail("gateway", `Control UI ${probeUrl} returned HTTP ${res.status}`);
  }
  ok("gateway", `Control UI reachable (${probeUrl} → ${res.status})`);
} catch (e) {
  fail("gateway", `Control UI not reachable at ${fileControl} — ${e.message}`);
}

console.log("");
console.log("PASS — host matches Phase 1 wiring expectations for Jarvis + Control UI.");
console.log("Tip: pnpm local:stack:doctor for listener PIDs and port detail.");
