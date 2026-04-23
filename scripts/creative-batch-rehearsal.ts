/**
 * Phase 5 v1: N × system.note (creative markdown template), shared batch.id, N separate ingress POSTs (default N=3).
 *
 * Contract: docs/strategy/creative-batch-workflow-v1.md
 *
 *   pnpm rehearsal:creative-batch
 *
 * Pressure test (same as research):
 *   CREATIVE_BATCH_ITEM_COUNT=5 pnpm rehearsal:creative-batch
 *
 * Uses `tsx --env-file=.env.local` (see package.json).
 *
 * Then in HUD: confirm review container(s), approve as needed, execute ONE item only
 * (unless you deliberately vary), verify receipt + trace for that id.
 */

import { randomUUID } from "node:crypto";
import { INGRESS_BATCH_MAX_ITEM_COUNT } from "../src/lib/proposal-batch";
import { submitProposal } from "../src/jarvis/submitProposal";

const VARIANTS_PER_ITEM = 3;

function resolveItemCount(): number {
  const raw = process.env.CREATIVE_BATCH_ITEM_COUNT?.trim();
  if (!raw) return 3;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 3 || n > INGRESS_BATCH_MAX_ITEM_COUNT) {
    console.error(
      `CREATIVE_BATCH_ITEM_COUNT must be an integer 3…${INGRESS_BATCH_MAX_ITEM_COUNT} (got ${raw})`
    );
    process.exit(1);
  }
  return n;
}

function buildCreativeNote(itemIndex: number, itemCount: number): string {
  const variants = Array.from({ length: VARIANTS_PER_ITEM }, (_, v) => {
    const k = v + 1;
    return `### Variant ${k}\nRehearsal placeholder copy ${itemIndex + 1}.${k} — no side effects.`;
  }).join("\n\n");

  return [
    "## Brief",
    `Rehearsal creative item ${itemIndex + 1} of ${itemCount}: sample campaign angle (dry run).`,
    "",
    "## Audience",
    "Operators rehearsing Phase 5; internal / demo only.",
    "",
    "## Angle",
    "Trust-through-clarity: governance-first messaging.",
    "",
    "## Variants",
    variants,
    "",
    "## Risks / notes",
    "None for rehearsal — replace with real sensitivities in production-shaped batches.",
    "",
    "## Sources",
    "- https://example.com/creative-rehearsal-input",
  ].join("\n");
}

async function main() {
  const secret = process.env.JARVIS_INGRESS_OPENCLAW_SECRET;
  if (!secret || secret.length < 32) {
    console.error(
      "JARVIS_INGRESS_OPENCLAW_SECRET required (≥32 chars). Try: source scripts/demo-env.sh"
    );
    process.exit(1);
  }

  const base =
    process.env.JARVIS_BASE_URL ?? process.env.JARVIS_HUD_BASE_URL ?? "http://127.0.0.1:3000";
  console.log("Base URL:", base.replace(/\/$/, ""));
  const itemCount = resolveItemCount();
  console.log("Item count:", itemCount);
  console.log("");

  const batchId = randomUUID();
  const stamp = new Date().toISOString().slice(0, 16).replace("T", " ");
  const idFrag = batchId.slice(0, 8);
  const batch = {
    id: batchId,
    title: `Creative batch — rehearsal — ${stamp} (${idFrag})`,
    summary: `Dry run: ${itemCount} creative items (system.note), shared batch; execute at most one in HUD.`,
    itemCount,
  } as const;

  const results: { itemIndex: number; id?: string; traceId?: string; error?: string }[] = [];

  for (let itemIndex = 0; itemIndex < itemCount; itemIndex++) {
    const body: Record<string, unknown> = {
      kind: "system.note",
      title: `Creative rehearsal ${itemIndex + 1}: variant set (${idFrag})`,
      summary: `Item ${itemIndex + 1} one-line hook for queue scan.`,
      payload: {
        note: buildCreativeNote(itemIndex, itemCount),
      },
      source: { connector: "openclaw" },
      agent: "creative-rehearsal-runner",
      batch: {
        ...batch,
        itemIndex,
      },
    };

    const { status, bodyText } = await submitProposal(body);
    type SubmitJson = {
      ok?: boolean;
      id?: string;
      traceId?: string;
      error?: string;
    };
    let json: SubmitJson | null = null;
    try {
      json = JSON.parse(bodyText) as SubmitJson;
    } catch {
      /* ignore */
    }

    if (status >= 200 && status < 300 && json?.ok === true) {
      console.log(`Item ${itemIndex}: OK id=${json.id} traceId=${json.traceId}`);
      results.push({ itemIndex, id: json.id, traceId: json.traceId });
    } else {
      console.error(`Item ${itemIndex}: FAIL`, status, json?.error ?? bodyText);
      results.push({ itemIndex, error: json?.error ?? bodyText });
    }
  }

  console.log("");
  console.log("batch.id:", batchId);
  console.log("Submitted ids:", results.map((r) => r.id).filter(Boolean).join(", ") || "(none)");
  const failed = results.filter((r) => r.error);
  if (failed.length > 0) {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
