#!/usr/bin/env node
/**
 * Merge OPENAI_API_KEY into OpenClaw's dev agent auth store (auth-profiles.json).
 * OpenClaw embedded chat resolves API keys from this file, not only process env.
 *
 * Profile shape matches openclaw-runtime (see src/agents/auth-profiles): openai:default.
 *
 * Env: OPENAI_API_KEY (optional if present in jarvis-hud .env.local)
 *      OPENCLAW_STATE_DIR (default ~/.openclaw-dev)
 *      OPENCLAW_AGENT_ID (default dev) → agents/<id>/agent/auth-profiles.json
 *      JARVIS_HUD_ENV_FILE — override path to .env.local
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync, chmodSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const AUTH_VERSION = 1;
const OPENAI_DEFAULT_PROFILE_ID = "openai:default";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ENV_PATH = process.env.JARVIS_HUD_ENV_FILE ?? resolve(ROOT, ".env.local");

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

function resolveOpenAiKey() {
  const fromEnv = process.env.OPENAI_API_KEY?.trim();
  if (fromEnv && fromEnv.length >= 8) return fromEnv;
  if (!existsSync(ENV_PATH)) {
    console.error(`sync-openclaw-openai-auth: missing ${ENV_PATH} and OPENAI_API_KEY`);
    process.exit(1);
  }
  const env = parseEnvLocal(readFileSync(ENV_PATH, "utf8"));
  const k = env.OPENAI_API_KEY?.trim();
  if (k && k.length >= 8) return k;
  console.error(
    "sync-openclaw-openai-auth: set OPENAI_API_KEY in .env.local or export OPENAI_API_KEY",
  );
  process.exit(1);
}

const stateDir = process.env.OPENCLAW_STATE_DIR
  ? resolve(process.env.OPENCLAW_STATE_DIR)
  : join(homedir(), ".openclaw-dev");
const agentId = (process.env.OPENCLAW_AGENT_ID ?? "dev").trim() || "dev";
const agentAgentDir = join(stateDir, "agents", agentId, "agent");
const authPath = join(agentAgentDir, "auth-profiles.json");

const apiKey = resolveOpenAiKey();

mkdirSync(agentAgentDir, { recursive: true });

/** @type {{ version: number; profiles: Record<string, unknown> }} */
let store = { version: AUTH_VERSION, profiles: {} };
if (existsSync(authPath)) {
  try {
    const raw = readFileSync(authPath, "utf8").trim();
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        store = {
          version: typeof parsed.version === "number" ? parsed.version : AUTH_VERSION,
          profiles:
            parsed.profiles && typeof parsed.profiles === "object" && !Array.isArray(parsed.profiles)
              ? { ...parsed.profiles }
              : {},
        };
      }
    }
  } catch (e) {
    console.error("sync-openclaw-openai-auth: could not parse existing auth-profiles.json:", e);
    process.exit(1);
  }
}

store.version = AUTH_VERSION;
store.profiles[OPENAI_DEFAULT_PROFILE_ID] = {
  type: "api_key",
  provider: "openai",
  key: apiKey,
};

writeFileSync(authPath, `${JSON.stringify(store, null, 2)}\n`, "utf8");
try {
  chmodSync(authPath, 0o600);
} catch {
  /* windows / sandbox */
}

console.log(
  `sync-openclaw-openai-auth: wrote ${OPENAI_DEFAULT_PROFILE_ID} to ${authPath} (merged existing profiles: ${Object.keys(store.profiles).length})`,
);
