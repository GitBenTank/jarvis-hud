#!/usr/bin/env node
/**
 * Preflight for Jarvis HUD + OpenClaw local stack (ports + config URL alignment).
 * Usage: from jarvis-hud — pnpm local:stack:doctor
 * Loads optional OPENCLAW_CONTROL_UI_URL from .env.local (no dependency on dotenv).
 */
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.JARVIS_HUD_BASE_URL ?? "http://127.0.0.1:3000";

function loadOpenclawUrlFromEnvLocal() {
  const p = resolve(ROOT, ".env.local");
  if (!existsSync(p)) return null;
  const text = readFileSync(p, "utf8");
  const m = text.match(/^\s*OPENCLAW_CONTROL_UI_URL=(.+)$/m);
  if (!m) return null;
  return m[1].trim().replace(/^["']|["']$/g, "");
}

function lsofListeners(port) {
  if (process.platform !== "darwin" && process.platform !== "linux") {
    return null;
  }
  try {
    const out = execFileSync("lsof", ["-nP", `-iTCP:${port}`, "-sTCP:LISTEN"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return out.trim();
  } catch {
    return "";
  }
}

function portFromOrigin(urlStr) {
  try {
    const u = new URL(urlStr);
    return u.port || (u.protocol === "https:" ? "443" : "80");
  } catch {
    return null;
  }
}

/** First LISTEN row from lsof → PID → full args (who really owns the port). */
function listenerArgsForPort(port) {
  const out = lsofListeners(port);
  if (!out) return null;
  const line = out.split("\n").find((l) => l.includes("LISTEN") && !/^COMMAND\s/.test(l));
  if (!line) return null;
  const pid = line.trim().split(/\s+/)[1];
  if (!pid || !/^\d+$/.test(pid)) return null;
  try {
    return execFileSync("ps", ["-ww", "-p", pid, "-o", "args="], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
}

/** Extra OpenClaw-related processes under Homebrew (often crash-loop → "Missing config" in UI logs). */
function homebrewOpenclawPsLines() {
  if (process.platform !== "darwin") return [];
  try {
    const out = execFileSync("ps", ["aux"], {
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
      stdio: ["ignore", "pipe", "ignore"],
    });
    return out
      .split("\n")
      .filter(
        (l) =>
          l.includes("/opt/homebrew") &&
          (/openclaw/i.test(l) || /node_modules\/openclaw/i.test(l))
      );
  } catch {
    return [];
  }
}

console.log("Local stack doctor (Jarvis + OpenClaw)");
console.log("─".repeat(44));
console.log("Jarvis base:", BASE);
console.log("");

const envUrl = process.env.OPENCLAW_CONTROL_UI_URL ?? loadOpenclawUrlFromEnvLocal();
if (envUrl) {
  console.log("OPENCLAW_CONTROL_UI_URL (.env or .env.local):", envUrl);
} else {
  console.log("OPENCLAW_CONTROL_UI_URL: (not set — HUD link to Control UI may be missing)");
}
console.log("");

for (const port of ["3000", "19001", "18789"]) {
  const lines = lsofListeners(port);
  if (lines) {
    console.log(`Port ${port} LISTEN:`);
    console.log(lines.split("\n").slice(0, 5).join("\n"));
    if (lines.split("\n").length > 4) console.log("  …");
  } else {
    console.log(`Port ${port} LISTEN: (nothing)`);
  }
  console.log("");
}

let controlPort = envUrl ? portFromOrigin(envUrl) : null;
if (!controlPort) controlPort = "19001";

if (envUrl) {
  const p = portFromOrigin(envUrl);
  if (p) {
    const listen = lsofListeners(p);
    if (!listen) {
      console.log(
        `⚠ No listener on ${p} — gateway may be down, or URL should match the port from gateway logs.`
      );
    } else {
      console.log(`✓ Something is listening on port ${p} (matches OPENCLAW_CONTROL_UI_URL port).`);
    }
  }
}

const listenCmd = listenerArgsForPort(controlPort);
if (listenCmd) {
  console.log("");
  console.log(`Process listening on ${controlPort}:`);
  console.log(" ", listenCmd.length > 200 ? `${listenCmd.slice(0, 197)}…` : listenCmd);
  if (listenCmd.includes("/opt/homebrew") && listenCmd.includes("openclaw")) {
    console.log(
      "  ⚠ Homebrew OpenClaw owns this port — if you use checkout + .openclaw-dev, stop brew/LaunchAgent and use pnpm openclaw:dev only."
    );
  } else if (listenCmd.includes("Documents/openclaw") || listenCmd.includes("gateway:dev")) {
    console.log("  ✓ Looks like checkout gateway:dev (canonical).");
  } else if (/^openclaw-gateway(\s|$)/.test(listenCmd)) {
    console.log(
      "  ℹ Command is `openclaw-gateway` (often Homebrew). If UI logs spam “Missing config” from /opt/homebrew, stop brew/LaunchAgent and use `pnpm openclaw:dev`."
    );
  }
}

const brewOc = homebrewOpenclawPsLines();
if (brewOc.length) {
  console.log("");
  console.log(
    "⚠ Homebrew OpenClaw process(es) still running — these often spam “Missing config” in Control UI logs while Overview stays OK:"
  );
  for (const row of brewOc.slice(0, 3)) {
    console.log(" ", row.length > 160 ? `${row.slice(0, 157)}…` : row);
  }
  if (brewOc.length > 3) console.log(`  … +${brewOc.length - 3} more`);
  console.log("  Fix: brew services list → stop openclaw; check ~/Library/LaunchAgents; docs/setup/local-stack-startup.md");
}

let cfgOk = false;
try {
  const res = await fetch(`${BASE}/api/config`);
  if (res.ok) {
    const cfg = await res.json();
    cfgOk = true;
    console.log("");
    console.log("GET /api/config:");
    console.log("  openclawControlUiUrl:", cfg.openclawControlUiUrl ?? "(null)");
    if (envUrl && cfg.openclawControlUiUrl && cfg.openclawControlUiUrl !== envUrl.replace(/\/$/, "")) {
      console.log("  ⚠ differs from OPENCLAW_CONTROL_UI_URL — restart pnpm dev after .env.local changes.");
    }
  }
} catch {
  console.log("");
  console.log("Jarvis: not reachable at", BASE, "— start pnpm dev in jarvis-hud.");
}

console.log("");
console.log("Canonical startup: docs/setup/local-stack-startup.md");
console.log("OpenClaw gateway helper: scripts/openclaw-gateway-dev.sh");
if (!cfgOk) {
  process.exitCode = 1;
}
