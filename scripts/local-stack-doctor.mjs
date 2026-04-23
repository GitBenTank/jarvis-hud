#!/usr/bin/env node
/**
 * Preflight for Jarvis HUD + OpenClaw local stack (ports + config URL alignment).
 * Usage: from jarvis-hud — pnpm local:stack:doctor
 * Loads optional OPENCLAW_CONTROL_UI_URL from .env.local (no dependency on dotenv).
 */
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.JARVIS_HUD_BASE_URL ?? "http://127.0.0.1:3000";

const DEFAULT_OPENCLAW_STATE = join(homedir(), ".openclaw-dev");

function loadOpenclawUrlFromEnvLocal() {
  const p = resolve(ROOT, ".env.local");
  if (!existsSync(p)) return null;
  const text = readFileSync(p, "utf8");
  const m = text.match(/^\s*OPENCLAW_CONTROL_UI_URL=(.+)$/m);
  if (!m) return null;
  return m[1].trim().replace(/^["']|["']$/g, "");
}

/** Non-secret: whether jarvis-hud `.env.local` sets a non-empty OPENAI_API_KEY. */
function jarvisEnvLocalHasOpenAiKey() {
  const p = resolve(ROOT, ".env.local");
  if (!existsSync(p)) return false;
  const text = readFileSync(p, "utf8");
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const m = t.match(/^OPENAI_API_KEY\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[1].trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    return v.length >= 8;
  }
  return false;
}

/**
 * Best-effort: embedded OpenClaw agent reads `auth-profiles.json`, not only process env.
 * Never log file contents.
 */
function openclawAuthProfilesLooksLikeOpenAiConfigured(filePath) {
  if (!existsSync(filePath)) return { status: "missing" };
  const raw = readFileSync(filePath, "utf8").trim();
  if (!raw || raw === "{}" || raw === "[]") return { status: "empty" };
  try {
    const j = JSON.parse(raw);
    if (jsonLooksLikeOpenAiConfigured(j)) return { status: "ok" };
    return { status: "no_openai_detected" };
  } catch {
    return { status: "invalid_json" };
  }
}

function credentialHasOpenAiSecret(cred) {
  if (!cred || typeof cred !== "object") return false;
  const prov = String(cred.provider ?? "").toLowerCase();
  if (prov !== "openai") return false;
  if (typeof cred.key === "string" && cred.key.length > 0) return true;
  if (typeof cred.apiKey === "string" && cred.apiKey.length > 0) return true;
  return false;
}

function jsonLooksLikeOpenAiConfigured(j) {
  if (!j || typeof j !== "object") return false;
  /** OpenClaw v1 store: { version, profiles: { "openai:default": { type, provider, key } } } */
  if (j.profiles && typeof j.profiles === "object" && !Array.isArray(j.profiles)) {
    for (const cred of Object.values(j.profiles)) {
      if (credentialHasOpenAiSecret(cred)) return true;
    }
  }
  if (j.openai && typeof j.openai === "object") {
    if (
      Object.values(j.openai).some((v) => typeof v === "string" && v.length > 0)
    ) {
      return true;
    }
  }
  if (j.providers?.openai && typeof j.providers.openai === "object") {
    if (
      Object.values(j.providers.openai).some(
        (v) => typeof v === "string" && v.length > 0
      )
    ) {
      return true;
    }
  }
  if (Array.isArray(j.profiles)) {
    return j.profiles.some((p) => {
      const prov = String(p?.provider ?? "").toLowerCase();
      if (prov !== "openai") return false;
      const c = p?.credentials ?? p?.credential ?? p;
      if (c && typeof c === "object") {
        return Object.values(c).some((v) => typeof v === "string" && v.length > 0);
      }
      return typeof p?.apiKey === "string" && p.apiKey.length > 0;
    });
  }
  return false;
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

/** First IPv4 LISTEN row from lsof → PID (prefer 127.0.0.1 over ::1). */
function listenerPidForPort(port) {
  const out = lsofListeners(port);
  if (!out) return null;
  const dataLines = out
    .split("\n")
    .filter((l) => l.includes("LISTEN") && !/^COMMAND\s/.test(l));
  const prefer = dataLines.find((l) => l.includes("127.0.0.1") || l.includes("*:" + port));
  const line = prefer ?? dataLines[0];
  if (!line) return null;
  const pid = line.trim().split(/\s+/)[1];
  if (!pid || !/^\d+$/.test(pid)) return null;
  return pid;
}

/** PID + full args (who really owns the port). args null if ps failed (permissions). */
function listenerInfoForPort(port) {
  const pid = listenerPidForPort(port);
  if (!pid) return null;
  try {
    const args = execFileSync("ps", ["-ww", "-p", pid, "-o", "args="], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    return { pid, args };
  } catch {
    return { pid, args: null };
  }
}

/** Classify gateway process for blessed jarvis-hud + openclaw-runtime flow. */
function gatewayVerdict(args) {
  if (!args) return null;
  if (
    args.includes("openclaw-runtime") ||
    /pnpm\s+(\S+\s+)?gateway:dev\b/.test(args) ||
    /node\s+.*\/openclaw[^/]*\/.*gateway/.test(args)
  ) {
    return {
      level: "ok",
      text: "Checkout gateway (openclaw-runtime / gateway:dev) — matches docs/setup/local-stack-startup.md.",
    };
  }
  if (args.includes("/Documents/openclaw") && !args.includes("/opt/homebrew")) {
    return {
      level: "ok",
      text: "Checkout under ~/Documents/openclaw — OK if intentional (hacking clone); blessed Phase 1 default is openclaw-runtime.",
    };
  }
  if (args.includes("/opt/homebrew") && /openclaw/i.test(args)) {
    return {
      level: "warn",
      text: "Homebrew path in command — global install may use ~/.openclaw (not .openclaw-dev). Stop brew/LaunchAgent if you want only pnpm openclaw:dev from jarvis-hud.",
    };
  }
  if (/^openclaw-gateway(\s|$)/.test(args)) {
    return {
      level: "warn",
      text: "openclaw-gateway entrypoint (often Homebrew). If logs spam Missing config from /opt/homebrew, use checkout only.",
    };
  }
  return {
    level: "info",
    text: "Could not classify — inspect full command; expect node + your clone path when using pnpm openclaw:dev.",
  };
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
    if (listen) {
      console.log(`✓ Something is listening on port ${p} (matches OPENCLAW_CONTROL_UI_URL port).`);
    } else {
      console.log(
        `⚠ No listener on ${p} — gateway may be down, or URL should match the port from gateway logs.`
      );
    }
  }
}

const listenInfo = listenerInfoForPort(controlPort);
if (listenInfo) {
  const { pid, args } = listenInfo;
  console.log("");
  console.log(`Process listening on port ${controlPort}: PID ${pid}`);
  if (args) {
    const maxLen = 500;
    const shown = args.length > maxLen ? `${args.slice(0, maxLen - 1)}…` : args;
    console.log("  Command:");
    console.log(`    ${shown}`);
    const v = gatewayVerdict(args);
    if (v) {
      let prefix = "ℹ";
      if (v.level === "ok") prefix = "✓";
      else if (v.level === "warn") prefix = "⚠";
      console.log(`  ${prefix} ${v.text}`);
    }
  } else {
    console.log(
      "  (Could not read command line — run locally:) ps -ww -p",
      pid,
      "-o args=",
    );
  }
  console.log("");
  console.log("  Manual check: ps -ww -p", pid, "-o args=");
}

const stateDir = process.env.OPENCLAW_STATE_DIR
  ? resolve(process.env.OPENCLAW_STATE_DIR)
  : DEFAULT_OPENCLAW_STATE;
const authProfilesPath = join(stateDir, "agents/dev/agent/auth-profiles.json");
const authProbe = openclawAuthProfilesLooksLikeOpenAiConfigured(authProfilesPath);
const jarvisHasOpenAi = jarvisEnvLocalHasOpenAiKey();

console.log("");
console.log("OpenClaw embedded agent (Control UI chat) — OpenAI:");
console.log("  OPENCLAW_STATE_DIR:", stateDir);
console.log("  auth store:", authProfilesPath);
console.log("  OPENAI_API_KEY in jarvis-hud .env.local:", jarvisHasOpenAi ? "set (non-empty)" : "not set");
if (authProbe.status === "ok") {
  console.log(
    "  ✓ auth-profiles.json looks like it contains OpenAI credentials (chat can still fail if the key is invalid or the account is over quota)."
  );
} else if (authProbe.status === "missing") {
  console.log(
    "  ⚠ auth-profiles.json missing — embedded chat often errors with: No API key found for provider \"openai\"."
  );
  if (jarvisHasOpenAi) {
    console.log(
    "    You have OPENAI_API_KEY in .env.local (injected into the gateway process), but OpenClaw still stores agent keys separately. Configure the dev agent, e.g. openclaw --profile dev agents add <id> (see gateway log), or set the key in Control UI → Environment and restart the gateway."
  );
  } else {
    console.log(
    "    Set OPENAI_API_KEY in jarvis-hud .env.local for pnpm openclaw:dev, then add provider auth for the dev agent (CLI or Control UI) so auth-profiles.json is written."
    );
  }
} else if (authProbe.status === "empty" || authProbe.status === "invalid_json") {
  console.log(
    `  ⚠ auth-profiles.json exists but is ${authProbe.status} — re-run OpenClaw agent auth setup (CLI or Control UI).`
  );
} else {
  console.log(
    "  ⚠ auth-profiles.json present but doctor did not detect OpenAI credentials — if chat fails, configure openai in Control UI or: openclaw --profile dev agents add <id>"
  );
}
console.log(
  "  Quota: if the gateway log shows “exceeded your current quota”, that is the OpenAI account/plan — not Jarvis."
);

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
