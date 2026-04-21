#!/usr/bin/env node
/**
 * Emit bash `export VAR='...'` lines for OpenClaw gateway from jarvis-hud .env.local.
 * Used by scripts/openclaw-gateway-dev.sh — keeps JARVIS_BASE_URL / secret / OPENAI in one file.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ENV_PATH = process.env.JARVIS_HUD_ENV_FILE ?? resolve(ROOT, ".env.local");

function bashSingleQuoted(s) {
  return `'${String(s).replace(/'/g, `'\\''`)}'`;
}

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

if (!existsSync(ENV_PATH)) {
  console.error(`openclaw-gateway-env-from-jarvis: missing ${ENV_PATH}`);
  process.exit(1);
}

const raw = readFileSync(ENV_PATH, "utf8");
const env = parseEnvLocal(raw);

const jarvisBase = env.JARVIS_BASE_URL ?? env.JARVIS_HUD_BASE_URL;
const secret = env.JARVIS_INGRESS_OPENCLAW_SECRET;
const openai = env.OPENAI_API_KEY;

const exports = [];
if (jarvisBase) exports.push(`export JARVIS_BASE_URL=${bashSingleQuoted(jarvisBase)}`);
if (secret) exports.push(`export JARVIS_INGRESS_OPENCLAW_SECRET=${bashSingleQuoted(secret)}`);
if (openai) exports.push(`export OPENAI_API_KEY=${bashSingleQuoted(openai)}`);

if (!jarvisBase) {
  console.error("openclaw-gateway-env-from-jarvis: set JARVIS_HUD_BASE_URL or JARVIS_BASE_URL in .env.local");
  process.exit(1);
}
if (!secret || secret.length < 32) {
  console.error("openclaw-gateway-env-from-jarvis: JARVIS_INGRESS_OPENCLAW_SECRET missing or < 32 chars in .env.local");
  process.exit(1);
}

console.log(exports.join("\n"));
