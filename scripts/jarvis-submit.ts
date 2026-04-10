#!/usr/bin/env node
/**
 * Normalize proposal JSON and POST to Jarvis OpenClaw ingress.
 * Run: pnpm jarvis:submit --file path/to/proposal.json
 *
 * Env:
 *   JARVIS_BASE_URL or JARVIS_HUD_BASE_URL (default http://localhost:3000)
 *   JARVIS_INGRESS_OPENCLAW_SECRET (≥32 chars for signed ingress)
 */

import { readFile } from "node:fs/promises";
import { normalizeProposal } from "../src/jarvis/normalizeProposal";
import { submitProposal } from "../src/jarvis/submitProposal";

function parseArgs(argv: string[]) {
  let file: string | null = null;
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--file" && argv[i + 1]) {
      file = argv[++i];
    } else if (argv[i] === "--help" || argv[i] === "-h") {
      file = null;
      break;
    }
  }
  return { file };
}

async function main() {
  const { file } = parseArgs(process.argv);
  if (!file) {
    console.error("Usage: pnpm jarvis:submit --file <path-to-proposal.json>");
    process.exit(1);
  }

  let rawText: string;
  try {
    rawText = await readFile(file, "utf8");
  } catch (e) {
    const err = e instanceof Error ? e.message : e;
    console.error("Cannot read file:", file, err);
    process.exit(1);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    console.error("Invalid JSON in", file);
    process.exit(1);
  }

  const norm = normalizeProposal(parsed);
  if (!norm.ok) {
    console.error("normalizeProposal:", norm.error, norm.field ? `(field: ${norm.field})` : "");
    process.exit(1);
  }

  const secret = process.env.JARVIS_INGRESS_OPENCLAW_SECRET;
  if (!secret || secret.length < 32) {
    console.error(
      "JARVIS_INGRESS_OPENCLAW_SECRET is missing or shorter than 32 characters.\n" +
        "Export the same secret your Jarvis server uses (e.g. from jarvis-hud/.env.local or scripts/demo-env.sh), then retry.\n" +
        "If Jarvis runs on port 3001, also set JARVIS_BASE_URL=http://localhost:3001"
    );
    process.exit(1);
  }

  const { status, bodyText } = await submitProposal(norm.body);

  let json: { ok?: boolean; id?: string; traceId?: string; status?: string; error?: string } | null;
  try {
    json = JSON.parse(bodyText) as typeof json;
  } catch {
    json = null;
  }

  if (status >= 200 && status < 300 && json?.ok === true) {
    console.log("Submitted OK");
    console.log("id:", json.id);
    console.log("traceId:", json.traceId);
    console.log("status:", json.status);
    console.log("");
    console.log("→ Open Jarvis HUD: approve manually, then execute there only.");
    return;
  }

  console.error("Submit failed:", status, json?.error ?? bodyText);
  if (status === 401) {
    console.error("→ Check secret / signing. See docs/security/openclaw-ingress-signing.md");
  } else if (status === 403) {
    console.error("→ Check JARVIS_INGRESS_OPENCLAW_ENABLED, allowlist, secret");
  }
  process.exit(1);
}

main().catch((err: unknown) => {
  console.error("Error:", err instanceof Error ? err.message : err);
  process.exit(1);
});
