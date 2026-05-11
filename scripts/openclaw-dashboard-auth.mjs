#!/usr/bin/env node
/**
 * Print Control UI connection hints + gateway.auth.token for the SAME state dir
 * the jarvis-hud gateway wrapper uses — without running `openclaw dashboard`
 * (which tries to bind a port and fails with EADDRINUSE when the stack is up).
 *
 * Aligns with: https://docs.openclaw.ai/web/dashboard (token from gateway.auth.token)
 * and https://docs.openclaw.ai/cli/dashboard
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ENV_PATH = process.env.JARVIS_HUD_ENV_FILE ?? join(ROOT, ".env.local");

function loadEnvLocal() {
  if (!existsSync(ENV_PATH)) return {};
  const out = {};
  for (const line of readFileSync(ENV_PATH, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const m = t.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    out[m[1]] = v;
  }
  return out;
}

function resolveOpenclawRoot(fileEnv) {
  const fromFile = fileEnv.OPENCLAW_ROOT?.trim();
  if (fromFile) return fromFile;
  const fromProc = process.env.OPENCLAW_ROOT?.trim();
  if (fromProc) return fromProc;
  const r1 = join(homedir(), "Documents/openclaw-runtime");
  const r2 = join(homedir(), "Documents/openclaw");
  if (existsSync(join(r1, "package.json"))) return r1;
  if (existsSync(join(r2, "package.json"))) return r2;
  return r1;
}

const fileEnv = loadEnvLocal();
const OPENCLAW_ROOT = resolveOpenclawRoot(fileEnv);
const OPENCLAW_STATE_DIR =
  process.env.OPENCLAW_STATE_DIR?.trim() ||
  fileEnv.OPENCLAW_STATE_DIR?.trim() ||
  join(homedir(), ".openclaw-dev");
const portRaw =
  process.env.OPENCLAW_GATEWAY_PORT?.trim() ||
  fileEnv.OPENCLAW_GATEWAY_PORT?.trim() ||
  "19001";
const port = /^\d+$/.test(portRaw) ? portRaw : "19001";

const urlHint = process.env.OPENCLAW_CONTROL_UI_URL?.trim() || fileEnv.OPENCLAW_CONTROL_UI_URL?.trim();

/** Match src/lib/safe-external-url openClawControlUiBrowserUrl — default /overview for origin-only env. */
function controlUiBrowserEntryUrl() {
  const raw = urlHint || `http://127.0.0.1:${port}`;
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("not http(s)");
    const path = u.pathname.replace(/\/$/, "") || "/";
    if (path === "/") u.pathname = "/overview";
    return u.href.replace(/\/$/, "");
  } catch {
    return `http://127.0.0.1:${port}/overview`;
  }
}

const controlBrowserUrl = controlUiBrowserEntryUrl();
let wsPort = port;
try {
  wsPort = new URL(controlBrowserUrl).port || port;
} catch {
  /* keep port */
}

if (!existsSync(join(OPENCLAW_ROOT, "package.json"))) {
  console.error(`openclaw-dashboard-auth: OPENCLAW_ROOT has no package.json: ${OPENCLAW_ROOT}`);
  console.error("  Set OPENCLAW_ROOT in .env.local or export it to your OpenClaw clone.");
  process.exit(1);
}

const openclawMjs = join(OPENCLAW_ROOT, "openclaw.mjs");
if (!existsSync(openclawMjs)) {
  console.error(`openclaw-dashboard-auth: missing ${openclawMjs} (need OpenClaw repo root).`);
  process.exit(1);
}

console.log("OpenClaw Control UI — auth helper (jarvis-hud)");
console.log("");
console.log("Upstream docs default to http://127.0.0.1:18789/ ; this stack uses OPENCLAW_GATEWAY_PORT");
console.log("so the Homebrew gateway does not fight the dev checkout on the same port.");
console.log("");
console.log(`  OPENCLAW_ROOT:       ${OPENCLAW_ROOT}`);
console.log(`  OPENCLAW_STATE_DIR:  ${OPENCLAW_STATE_DIR}`);
console.log(`  Control UI (browser): ${controlBrowserUrl}`);
console.log(`  WebSocket (typical): ws://127.0.0.1:${wsPort}`);
console.log("");
console.log("Do not run `openclaw dashboard` while this gateway is already listening — it tries");
console.log("to start a second listener and hits EADDRINUSE. With the stack up, paste below.");
console.log("");

function tryReadPlainTokenFromStateDir(stateDir) {
  const candidates = [join(stateDir, "openclaw.json"), join(stateDir, "config.json")];
  for (const p of candidates) {
    if (!existsSync(p)) continue;
    try {
      const j = JSON.parse(readFileSync(p, "utf8"));
      const t = j.gateway?.auth?.token;
      if (typeof t === "string" && t.length >= 8 && !t.includes("OPENCLAW_REDACTED")) {
        return t;
      }
    } catch {
      /* ignore */
    }
  }
  return null;
}

const r = spawnSync(
  process.execPath,
  [openclawMjs, "config", "get", "gateway.auth.token"],
  {
    cwd: OPENCLAW_ROOT,
    env: { ...process.env, OPENCLAW_STATE_DIR },
    encoding: "utf8",
  }
);

let tokenOut = (r.stdout || "").trim();
const errOut = (r.stderr || "").trim();

if (
  !tokenOut ||
  tokenOut.includes("__OPENCLAW_REDACTED__") ||
  tokenOut.includes("OPENCLAW_REDACTED")
) {
  const fromDisk = tryReadPlainTokenFromStateDir(OPENCLAW_STATE_DIR);
  if (fromDisk) {
    tokenOut = fromDisk;
    console.log("(CLI redacts this value; read plaintext token from openclaw.json under OPENCLAW_STATE_DIR.)");
    console.log("");
  }
}

if (!tokenOut) {
  console.error("Could not resolve gateway.auth.token (CLI redacted and no plaintext in state dir JSON).");
  if (errOut) console.error(errOut);
  if (r.status !== 0) console.error(`openclaw.mjs config get exited ${r.status}`);
  console.log("");
  console.log("Manual recovery (OpenClaw docs):");
  console.log(`  cd "${OPENCLAW_ROOT}" && OPENCLAW_STATE_DIR="${OPENCLAW_STATE_DIR}" node openclaw.mjs doctor --generate-gateway-token`);
  console.log("  Then restart the gateway and run: pnpm openclaw:dashboard-auth");
  process.exit(1);
}

console.log("Gateway token (paste into Control UI → Gateway Token, then Connect):");
console.log("");
console.log(tokenOut);
console.log("");
