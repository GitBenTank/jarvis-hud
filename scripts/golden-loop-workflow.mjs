#!/usr/bin/env node
/**
 * v0.3 Golden loop: workflow.plan (2× system.note) → pending → approve → execute
 * sequential steps → child receipts + parent receipt → trace + replay + audit export.
 *
 * Usage:
 *   pnpm golden-loop:workflow
 *
 * Same environment and isolation as `pnpm golden-loop` (see golden-loop-smoke.mjs).
 */

import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import {
  REPO_ROOT,
  DEFAULT_CI_SECRET,
  pickPort,
  ensureSecret,
  waitForServer,
  spawnNextServer,
  killServer,
  runIngressApproveExecuteTraceExport,
} from "./lib/golden-loop-shared.mjs";

function fail(msg) {
  console.error(`\ngolden-loop:workflow FAILED: ${msg}\n`);
  process.exit(1);
}

async function main() {
  const useExisting = process.env.GOLDEN_LOOP_USE_EXISTING === "1";
  const port = pickPort();
  const baseUrl = (
    process.env.JARVIS_HUD_BASE_URL ||
    (useExisting ? `http://127.0.0.1:3000` : `http://127.0.0.1:${port}`)
  ).replace(/\/$/, "");

  let jarvisRoot = process.env.JARVIS_ROOT;
  let secret = process.env.JARVIS_INGRESS_OPENCLAW_SECRET;
  let serverProc = null;

  if (useExisting) {
    secret = ensureSecret(secret);
    console.log(
      `golden-loop:workflow: GOLDEN_LOOP_USE_EXISTING=1 → ${baseUrl} (JARVIS_ROOT=${jarvisRoot ?? "(process default ~/jarvis)"})`
    );
    await waitForServer(baseUrl);
  } else {
    const parent =
      process.env.GOLDEN_LOOP_JARVIS_PARENT ||
      join(REPO_ROOT, ".golden-loop-tmp");
    mkdirSync(parent, { recursive: true });
    jarvisRoot = mkdtempSync(join(parent, "jarvis-golden-workflow-"));
    secret = ensureSecret(secret || DEFAULT_CI_SECRET);
    const spawned = spawnNextServer({ port, jarvisRoot, secret });
    serverProc = spawned.proc;
    serverProc.on("error", (err) => fail(`spawn failed: ${err.message}`));

    console.log(`golden-loop:workflow: JARVIS_ROOT=${jarvisRoot}`);
    console.log(`golden-loop:workflow: starting Next (${spawned.mode}) on ${baseUrl}`);

    try {
      await waitForServer(baseUrl);
    } catch (e) {
      console.error(serverProc.logTail?.() ?? "");
      await killServer(serverProc);
      try {
        rmSync(jarvisRoot, { recursive: true, force: true });
      } catch {
        /* ignore */
      }
      fail(e instanceof Error ? e.message : String(e));
    }
  }

  const marker = `wf-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const ingressBody = {
    kind: "workflow.plan",
    title: `Golden workflow v0.3 ${marker}`,
    summary: "CI governed workflow.plan (2 × system.note)",
    payload: {
      steps: [
        {
          kind: "system.note",
          title: `Step A ${marker}`,
          summary: "First note in workflow",
          payload: { note: `Receipt A ${marker}` },
        },
        {
          kind: "system.note",
          title: `Step B ${marker}`,
          summary: "Second note in workflow",
          payload: { note: `Receipt B ${marker}` },
        },
      ],
    },
    agent: "golden-loop-workflow",
    source: { connector: "openclaw" },
  };

  try {
    await runIngressApproveExecuteTraceExport({
      baseUrl,
      secret,
      ingressBody,
      successLabel: "v0.3 workflow.plan",
      fail,
      requireProviderMessageId: false,
      afterReplay: ({ replayJson, approvalId }) => {
        if (replayJson.proposal?.kind !== "workflow.plan") {
          fail("replay: expected proposal.kind workflow.plan");
        }
        const receipts = replayJson.receipts ?? [];
        if (receipts.length < 3) {
          fail(`replay: expected ≥3 receipts (2 children + parent), got ${receipts.length}`);
        }
        const children = receipts.filter((r) => r && r.parentApprovalId === approvalId);
        if (children.length !== 2) {
          fail(`replay: expected 2 child receipts for parent ${approvalId}`);
        }
        if (!children.every((r) => r.kind === "system.note")) {
          fail("replay: child receipts must be system.note");
        }
        const idxOk = children.every(
          (r) =>
            typeof r.workflowStepIndex === "number" &&
            r.workflowStepIndex >= 0 &&
            r.workflowStepIndex < 2
        );
        if (!idxOk) fail("replay: child receipts must have workflowStepIndex 0..1");
        const parentRec = receipts.find(
          (r) => r && r.kind === "workflow.plan" && r.approvalId === approvalId
        );
        if (!parentRec) fail("replay: missing parent workflow.plan receipt");
        if (replayJson.execution?.kind !== "workflow.plan") {
          fail("replay: execution summary should be parent workflow.plan");
        }
        const lin = replayJson.workflowLineage;
        if (!lin || !Array.isArray(lin.childReceipts) || lin.childReceipts.length !== 2) {
          fail("replay: workflowLineage.childReceipts should list 2 receipts");
        }
      },
    });
  } catch (e) {
    if (serverProc?.logTail) console.error(serverProc.logTail());
    fail(e instanceof Error ? e.message : String(e));
  } finally {
    await killServer(serverProc);
    if (!useExisting && jarvisRoot) {
      try {
        rmSync(jarvisRoot, { recursive: true, force: true });
      } catch {
        /* ignore */
      }
    }
  }
}

main();
