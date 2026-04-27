#!/usr/bin/env node
/**
 * Normal two-terminal dev stack — prints exact commands; does not start both processes.
 * Optional: --start-jarvis  →  runs `pnpm dev` in this repo after checks (OpenClaw still manual).
 * Usage: pnpm dev:stack   |   pnpm dev:stack --start-jarvis
 */
import { spawn } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const EXPECTED = "http://127.0.0.1:3000";

const argv = process.argv.slice(2);
const flags = new Set(argv);
const startJarvis = flags.has("--start-jarvis");
if (flags.has("--help") || flags.has("-h")) {
  console.log(`Usage: pnpm dev:stack [--start-jarvis]

Prints the two-terminal workflow for normal dev (pnpm dev + openclaw:dev).
Does not start OpenClaw.

  --start-jarvis   After checks, run pnpm dev in this directory (foreground).
  --help           This text.
`);
  process.exit(0);
}

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

/** @param {string | undefined} raw */
function analyzeBaseUrl(raw, label) {
  if (raw == null || String(raw).trim() === "") {
    return { ok: false, kind: "missing", detail: `${label} is not set in .env.local` };
  }
  let u;
  try {
    u = new URL(raw);
  } catch {
    return { ok: false, kind: "bad", detail: `${label} is not a valid URL: ${raw}` };
  }
  const port = u.port || (u.protocol === "https:" ? "443" : "80");
  if (port === "3001") {
    return {
      ok: false,
      kind: "demo_port",
      detail: `${label} uses port 3001 (demo / demo:boot). Normal dev is ${EXPECTED}.`,
    };
  }
  if (port !== "3000") {
    return {
      ok: false,
      kind: "port",
      detail: `${label} is ${raw} — expected port 3000 for pnpm dev.`,
    };
  }
  if (u.hostname === "localhost") {
    return {
      ok: false,
      kind: "localhost",
      detail: `${label} uses localhost — prefer 127.0.0.1 (same host as pnpm dev; avoids cookie / CSRF surprises).`,
    };
  }
  if (u.hostname !== "127.0.0.1") {
    return {
      ok: false,
      kind: "host",
      detail: `${label} is ${raw} — expected host 127.0.0.1 for local stack docs.`,
    };
  }
  if (u.protocol !== "http:") {
    return {
      ok: false,
      kind: "protocol",
      detail: `${label} should be http: for local dev.`,
    };
  }
  return { ok: true, detail: raw };
}

function pickOpenclawRoot(envLocal, processEnv) {
  const fromEnv = processEnv.OPENCLAW_ROOT || envLocal.OPENCLAW_ROOT;
  const home = homedir();
  const candidates = [
    join(home, "Documents", "openclaw-runtime"),
    join(home, "Dev", "openclaw-runtime"),
  ];
  if (fromEnv && String(fromEnv).trim()) {
    return resolve(resolveExpanded(fromEnv.trim()));
  }
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  return candidates[0];
}

/** Best-effort ~ expansion */
function resolveExpanded(p) {
  if (p.startsWith("~/")) return join(homedir(), p.slice(2));
  return resolve(p);
}

function analyzeOpenclawRoot(absPath) {
  const warnings = [];
  if (!existsSync(absPath)) {
    warnings.push(
      `OPENCLAW_ROOT path does not exist: ${absPath}\n  Clone: docs/setup/local-stack-startup.md (One-time: runtime clone).`
    );
    return warnings;
  }
  const norm = absPath.replace(/[/\\]+$/, "");
  const leaf = norm.split(/[/\\]/).pop() ?? "";
  if (leaf === "openclaw") {
    warnings.push(
      `OPENCLAW_ROOT ends with "openclaw" (hacking tree). For stable gateway:dev prefer a clean openclaw-runtime clone: OPENCLAW_ROOT=…/openclaw-runtime.`
    );
  }
  return warnings;
}

function main() {
  const fileEnv = loadEnvLocal();
  const warnings = [];

  const home = homedir();
  if (ROOT.startsWith(join(home, "Documents")) || ROOT.includes("/Documents/")) {
    warnings.push(
      `This repo is under ~/Documents — iCloud sync can cause Next ENOENT under .next/dev. Consider ~/Dev/jarvis-hud (see docs/setup/local-stack-startup.md).`
    );
  }

  if (!existsSync(join(ROOT, ".env.local"))) {
    warnings.push("No .env.local — copy env.example; set JARVIS_BASE_URL / JARVIS_HUD_BASE_URL for OpenClaw.");
  }

  const effective = (k) => process.env[k] || fileEnv[k];
  const jBase = analyzeBaseUrl(effective("JARVIS_BASE_URL"), "JARVIS_BASE_URL");
  const hudBase = analyzeBaseUrl(effective("JARVIS_HUD_BASE_URL"), "JARVIS_HUD_BASE_URL");

  for (const r of [jBase, hudBase]) {
    if (!r.ok) warnings.push(`⚠ ${r.detail}`);
  }

  const ocRoot = pickOpenclawRoot(fileEnv, process.env);
  warnings.push(...analyzeOpenclawRoot(ocRoot));

  if (warnings.length) {
    console.log("Warnings:\n");
    for (const w of warnings) console.log(`  • ${w}\n`);
  }

  console.log("✅ Jarvis HUD — normal dev (two terminals, two real processes)\n");
  console.log("Terminal 1:");
  console.log(`cd ${ROOT}`);
  console.log("pnpm dev");
  console.log("");
  console.log("Terminal 2:");
  console.log(`cd ${ROOT}`);
  console.log(`OPENCLAW_ROOT=${ocRoot} pnpm openclaw:dev`);
  console.log("");
  console.log("Expected Jarvis URL:");
  console.log(EXPECTED);
  console.log("");
  console.log("Then: pnpm local:stack:doctor\n");

  if (!startJarvis) process.exit(0);

  console.log("→ Starting Jarvis only: pnpm dev (use Terminal 2 for OpenClaw)\n");
  const child = spawn("pnpm", ["dev"], {
    cwd: ROOT,
    stdio: "inherit",
    env: process.env,
    shell: false,
  });
  child.on("exit", (code, signal) => {
    if (signal) process.exit(1);
    process.exit(code ?? 1);
  });
}

main();
