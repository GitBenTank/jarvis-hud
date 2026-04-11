#!/usr/bin/env tsx
/**
 * Truthful proposal loop demo (jarvis-hud side).
 *
 * OpenClaw may later mirror this as `openclaw/src/demos/system-note-runner.ts` calling the same
 * stages. Here we simulate "Alfred orchestrate" as: normalize → classify → validate → trust → submit.
 *
 * Usage:
 *   pnpm demo:system-note
 *   pnpm demo:system-note -- --no-submit
 *   pnpm demo:system-note -- --scenario=missing-kind
 *   pnpm demo:system-note -- --scenario=bad-kind
 *   pnpm demo:system-note -- --scenario=wrong-connector
 *   pnpm demo:system-note -- --scenario=unknown-field
 *   pnpm demo:system-note -- --scenario=code-apply-blocked
 *
 * Env: JARVIS_BASE_URL, JARVIS_INGRESS_OPENCLAW_SECRET (for submit), same as jarvis:submit.
 */

import { ALLOWED_KINDS } from "../../src/lib/policy";
import { validateOpenClawProposal } from "../../src/lib/ingress/validate-openclaw-proposal";
import { normalizeProposal } from "../../src/jarvis/normalizeProposal";
import { preflightTrustPostureForKind } from "../../src/jarvis/trust-posture";
import { submitProposal } from "../../src/jarvis/submitProposal";

const MAX_BYTES = 1024 * 1024;

/** Nested shape common when coordinators wrap Forge output */
const HARD_CODED_SYSTEM_NOTE_DRAFT = {
  proposal: {
    kind: "system.note",
    title: "Demo system note",
    summary: "Hardcoded runner payload for governed proposal boundary demo.",
    payload: {
      note: "Trace this line from runner → ingress → approval → receipt.",
    },
    source: {
      connector: "openclaw",
      sessionId: "demo-session",
    },
  },
  correlationId: "runner-demo-001",
} as const;

function parseArgs() {
  const argv = process.argv.slice(2);
  let noSubmit = false;
  let scenario = "default";
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--no-submit") noSubmit = true;
    else if (argv[i]?.startsWith("--scenario=")) scenario = argv[i]!.slice("--scenario=".length);
    else if (argv[i] === "--scenario" && argv[i + 1]) scenario = argv[++i]!;
  }
  return { noSubmit, scenario };
}

function draftForScenario(scenario: string): { draft: unknown; skipNormalize: boolean } {
  switch (scenario) {
    case "missing-kind":
      return {
        draft: {
          title: "No kind",
          summary: "Should fail at normalize",
          payload: { note: "x" },
          source: { connector: "openclaw" },
        },
        skipNormalize: false,
      };
    case "bad-kind":
      return {
        draft: {
          kind: "not.supported.kind",
          title: "Bad kind",
          summary: "Should fail at validate",
          payload: { note: "x" },
          source: { connector: "openclaw" },
        },
        skipNormalize: false,
      };
    case "wrong-connector":
      return {
        draft: {
          kind: "system.note",
          title: "Wrong connector",
          summary: "Validate only — normalize would coerce connector",
          payload: { note: "x" },
          source: { connector: "telegram" },
        },
        skipNormalize: true,
      };
    case "unknown-field":
      return {
        draft: {
          kind: "system.note",
          title: "t",
          summary: "s",
          payload: { note: "n" },
          source: { connector: "openclaw" },
          illegalTopLevel: true,
        } as Record<string, unknown>,
        skipNormalize: true,
      };
    case "code-apply-blocked":
      return {
        draft: {
          kind: "code.apply",
          title: "Patch demo",
          summary: "May be blocked at trust preflight / execute",
          payload: {
            code: {
              diffText: "--- a/x\n+++ b/x\n@@ -0,0 +1 @@\n+ok\n",
              summary: "demo",
            },
          },
          source: { connector: "openclaw" },
        },
        skipNormalize: false,
      };
    default:
      return { draft: HARD_CODED_SYSTEM_NOTE_DRAFT, skipNormalize: false };
  }
}

function printSection(title: string) {
  console.log("\n──", title, "──\n");
}

async function main() {
  const { noSubmit, scenario } = parseArgs();
  const { draft, skipNormalize } = draftForScenario(scenario);

  printSection("1) Draft (hardcoded input)");
  console.log(JSON.stringify(draft, null, 2));

  printSection("2) Orchestrate (local: normalize + classify)");
  let body: Record<string, unknown>;
  if (skipNormalize) {
    console.log("(skipped normalize — scenario needs raw invalid shape)");
    body = draft as Record<string, unknown>;
  } else {
    const norm = normalizeProposal(draft);
    if (!norm.ok) {
      console.log("classification: BLOCKED (normalize)");
      console.log("error:", norm.error, norm.field ? `field=${norm.field}` : "");
      process.exitCode = 1;
      return;
    }
    body = norm.body;
    console.log("classification: OK");
    console.log("kind:", body.kind);
    console.log("title:", body.title);
    console.log("agent:", body.agent, "builder:", body.builder);
  }

  printSection("3) Normalized ingress body");
  console.log(JSON.stringify(body, null, 2));

  printSection("4) Local ingress validator (same rules as Jarvis)");
  const rawBody = JSON.stringify(body);
  const v = validateOpenClawProposal({
    rawBody,
    parsed: body,
    maxBytes: MAX_BYTES,
    allowedKinds: [...ALLOWED_KINDS],
  });
  if (!v.ok) {
    console.log("validator: FAIL");
    console.log(v.code, v.message, v.field ? `field=${v.field}` : "");
    process.exitCode = 1;
    return;
  }
  console.log("validator: PASS");

  const kind = typeof body.kind === "string" ? body.kind : "";
  printSection("5) Trust preflight (GET /api/config)");
  const pre = await preflightTrustPostureForKind(kind);
  console.log("fetchOk:", pre.fetchOk, "parseOk:", pre.parseOk, "http:", pre.httpStatus);
  console.log("ingressLikelyRejected:", pre.ingressLikelyRejected);
  console.log("codeApplyLikelyBlockedAtExecute:", pre.codeApplyLikelyBlockedAtExecute);
  console.log("executeRequiresStepUp:", pre.executeRequiresStepUp);
  console.log("messages:");
  for (const m of pre.messages) console.log(" -", m);

  if (noSubmit) {
    printSection("6) Submit");
    console.log("(skipped --no-submit)");
    return;
  }

  printSection("6) Submit (trustPreflight + optional aborts)");
  const result = await submitProposal(body, {
    trustPreflight: true,
    abortIfIngressLikelyRejected: scenario === "default",
    abortIfCodeApplyLikelyBlocked: scenario === "code-apply-blocked",
  });
  console.log("status:", result.status);
  console.log("body:", result.bodyText);
  if (result.trustPreflightMessages?.length) {
    console.log("trustPreflightMessages:", result.trustPreflightMessages);
  }
  if (result.status === 0 || result.status >= 400) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
