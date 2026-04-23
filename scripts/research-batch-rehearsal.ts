/**
 * Live rehearsal: N × system.note, shared batch.id, N separate ingress POSTs (default N=3).
 *
 * Requires Jarvis dev server (`pnpm dev`) and `.env.local` with ingress secret + `JARVIS_HUD_BASE_URL`
 * (default base http://127.0.0.1:3000 if unset — match Phase 1).
 *   pnpm rehearsal:research-batch
 *   pnpm rehearsal:serious-mode-ingress   # same entrypoint — blessed batch ingress for serious-mode rehearsal (docs/setup/serious-mode-rehearsal-checklist.md)
 *
 * Pressure test (Phase 4): set item count 5–7 (same shape, shared batch.id):
 *   RESEARCH_BATCH_ITEM_COUNT=6 pnpm rehearsal:research-batch
 *
 * Uses `tsx --env-file=.env.local` (see package.json). If you omit `.env.local`, export
 * `JARVIS_INGRESS_OPENCLAW_SECRET` and `JARVIS_HUD_BASE_URL` yourself.
 *
 * Then in HUD: confirm review container(s), approve as needed, execute ONE item only
 * (unless you deliberately vary), verify receipt + trace for that id.
 */

import { randomUUID } from "node:crypto";
import { INGRESS_BATCH_MAX_ITEM_COUNT } from "../src/lib/proposal-batch";
import { submitProposal } from "../src/jarvis/submitProposal";

function resolveItemCount(): number {
  const raw = process.env.RESEARCH_BATCH_ITEM_COUNT?.trim();
  if (!raw) return 3;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 3 || n > INGRESS_BATCH_MAX_ITEM_COUNT) {
    console.error(
      `RESEARCH_BATCH_ITEM_COUNT must be an integer 3…${INGRESS_BATCH_MAX_ITEM_COUNT} (got ${raw})`
    );
    process.exit(1);
  }
  return n;
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
  // Phase 3a: batch title must disambiguate runs (see docs/strategy/research-batch-workflow-v1.md).
  const stamp = new Date().toISOString().slice(0, 16).replace("T", " ");
  const idFrag = batchId.slice(0, 8);
  const batch = {
    id: batchId,
    title: `Rehearsal batch — research only — ${stamp} (${idFrag})`,
    summary: `Dry run: ${itemCount} items, shared batch; execute at most one in HUD.`,
    itemCount,
  } as const;

  const results: { itemIndex: number; id?: string; traceId?: string; error?: string }[] = [];

  for (let itemIndex = 0; itemIndex < itemCount; itemIndex++) {
    const body: Record<string, unknown> = {
      kind: "system.note",
      title: `Research rehearsal ${itemIndex + 1}: sample finding (${idFrag})`,
      summary: `Item ${itemIndex + 1} one-line takeaway for queue scan.`,
      payload: {
        note: [
          "## Finding",
          `Rehearsal body for item ${itemIndex + 1}. No side effects.`,
          "",
          "## Sources",
          `- https://example.com/rehearsal-${itemIndex + 1}`,
        ].join("\n"),
      },
      source: { connector: "openclaw" },
      agent: "rehearsal-runner",
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
