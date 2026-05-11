#!/usr/bin/env node
/**
 * Open Jarvis HUD and OpenClaw Control UI in the default browser (macOS/Linux/Windows).
 * Use after dev servers are listening — avoids empty / about:blank tabs from ad-hoc clicks.
 *
 * Usage: pnpm local:stack:open
 * Honors JARVIS_HUD_BASE_URL / JARVIS_BASE_URL / PORT / OPENCLAW_GATEWAY_PORT from env or .env.local.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvLocal() {
  const p = join(ROOT, ".env.local");
  if (!existsSync(p)) return {};
  const out = {};
  for (const line of readFileSync(p, "utf8").split("\n")) {
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

function pickHudOrigin(fileEnv, procEnv) {
  const raw =
    procEnv.JARVIS_HUD_BASE_URL ||
    procEnv.JARVIS_BASE_URL ||
    fileEnv.JARVIS_HUD_BASE_URL ||
    fileEnv.JARVIS_BASE_URL;
  if (raw && String(raw).trim()) {
    try {
      return new URL(String(raw).trim()).origin;
    } catch {
      /* fall through */
    }
  }
  const port = procEnv.PORT || fileEnv.PORT || "3000";
  return `http://127.0.0.1:${port}`;
}

function pickOpenclawOrigin(fileEnv, procEnv) {
  const raw = procEnv.OPENCLAW_CONTROL_UI_URL || fileEnv.OPENCLAW_CONTROL_UI_URL;
  if (raw && String(raw).trim()) {
    try {
      return new URL(String(raw).trim()).origin;
    } catch {
      /* fall through */
    }
  }
  const p = procEnv.OPENCLAW_GATEWAY_PORT || fileEnv.OPENCLAW_GATEWAY_PORT || "19001";
  return `http://127.0.0.1:${p}`;
}

function openUrl(url) {
  const platform = process.platform;
  if (platform === "darwin") {
    spawnSync("open", [url], { stdio: "inherit" });
    return;
  }
  if (platform === "win32") {
    spawnSync("cmd", ["/c", "start", "", url], { stdio: "ignore", shell: false });
    return;
  }
  spawnSync("xdg-open", [url], { stdio: "inherit" });
}

const fileEnv = loadEnvLocal();
const hud = pickHudOrigin(fileEnv, process.env);
const openclaw = pickOpenclawOrigin(fileEnv, process.env);

console.log("local-stack-open-browsers: opening (default system browser)");
console.log(`  HUD:               ${hud}`);
console.log(`  OpenClaw Control:  ${openclaw}`);
console.log("");
console.log("If a tab stays on about:blank, paste one of the URLs above manually.");

openUrl(hud);
openUrl(openclaw);
