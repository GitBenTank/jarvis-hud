/**
 * Operator Media Engine — sample `system.note` proposal payloads for rehearsal.
 *
 * - Does NOT POST to Jarvis or any HTTP endpoint.
 * - Does NOT read or print .env.local or any secret-bearing env vars.
 * - Does NOT send email or call external APIs.
 *
 * Optional local inputs (best-effort): latest `git log -1` subject, a short
 * excerpt from an in-repo architecture doc — only non-secret paths/strings.
 *
 * Usage:
 *   pnpm operator:media:rehearsal
 *   pnpm operator:media:rehearsal -- --out-dir=artifacts/operator-media-engine
 */

import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = process.cwd();
const DOC_SNIPPET_PATH = join(
  REPO_ROOT,
  "docs/architecture/openclaw-jarvis-trust-contract.md"
);

type MediaProposalPayload = {
  agent: string;
  builder: string;
  kind: "system.note";
  title: string;
  summary: string;
  evidenceStatus: "sourced" | "inferred" | "speculative" | "user_provided" | "unknown";
  uncertaintySummary: string;
  source: { connector: "openclaw"; agentId: string };
  payload: { note: string };
};

const SOURCE_AGENT_ID = "operator-media-engine-rehearsal-v1";

function buildNoteBody(parts: {
  context: string;
  proposed: string;
  evidence: string;
  decision: string;
}): string {
  return [
    "## Context",
    parts.context,
    "",
    "## Proposed content",
    parts.proposed,
    "",
    "## Evidence / source notes",
    parts.evidence,
    "",
    "## Operator decision needed",
    parts.decision,
  ].join("\n");
}

function tryLatestGitSubject(): string | null {
  try {
    const s = execSync("git log -1 --format=%h%n%s", {
      encoding: "utf8",
      cwd: REPO_ROOT,
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    return s || null;
  } catch {
    return null;
  }
}

function readDocExcerptSync(maxChars: number): { path: string; excerpt: string } | null {
  if (!existsSync(DOC_SNIPPET_PATH)) return null;
  try {
    const raw = readFileSync(DOC_SNIPPET_PATH, "utf8");
    const excerpt = raw.replace(/\r\n/g, "\n").slice(0, maxChars).trim();
    return { path: "docs/architecture/openclaw-jarvis-trust-contract.md", excerpt };
  } catch {
    return null;
  }
}

function buildProposals(): MediaProposalPayload[] {
  const gitRef = tryLatestGitSubject();
  const doc = readDocExcerptSync(1200);

  const linkedInNote = buildNoteBody({
    context:
      "Operator Media Engine v1 rehearsal — turning recent shipping activity into a short LinkedIn update. No auto-post.",
    proposed:
      "Draft hook + 2 short paragraphs: what shipped, why it matters for governed AI work, CTA to learn more (manual link paste only).",
    evidence: gitRef
      ? [
          "Concrete local input (this clone):",
          "```",
          gitRef,
          "```",
          "",
          "## Sources",
          "- `git log -1` output from this workspace (rehearsal run)",
        ].join("\n")
      : [
          "No local `git` subject captured in this environment.",
          "",
          "## Sources",
          "- (none — treat proposed lines as narrative only until you attach a real commit reference)",
        ].join("\n"),
    decision:
      "Approve if the angle matches what you are willing to say publicly; edit body before any manual post. Execute as system.note to retain receipt only — still no LinkedIn API.",
  });

  const blogNote = buildNoteBody({
    context:
      "Blog draft proposal derived from in-repo trust / ingress documentation (excerpt only).",
    proposed:
      "800–1200 word post: how Jarvis + OpenClaw keep approval and execution separate; cite trust contract; tie to Operator Media Engine as business-use proof loop.",
    evidence: doc
      ? [
          "Excerpt from local file (truncated for rehearsal):",
          "```",
          doc.excerpt,
          "```",
          "",
          "## Sources",
          `- Repository file: \`${doc.path}\` (first ~1200 chars, rehearsal excerpt)`,
        ].join("\n")
      : [
          "Architecture doc excerpt unavailable.",
          "## Sources",
          "- (none)",
        ].join("\n"),
    decision:
      "Verify excerpt still matches current doc before publishing; expand Sources with links/sections you ship in the final post.",
  });

  const devHouseEmailNote = buildNoteBody({
    context:
      "DevHouse follow-up after a build/debug session — text draft only; Jarvis does not send mail in this workflow.",
    proposed:
      "Subject: [DevHouse] Jarvis trace polish + governed media loop\n\nBody: thank organizers, one concrete takeaway from the session, offer a 20m call to compare notes on operator-grade agent HUDs.\n\n## Growth / revenue (speculative)\nA thoughtful follow-up *might* open consulting or pilot conversations — no pipeline stage or MRR is implied; track outcomes manually outside Jarvis.",
    evidence:
      "Hypothesis-level outreach angle only; no CRM row, attendee list, or revenue number is embedded in this rehearsal file.",
    decision:
      "Edit recipients, dates, and outcomes manually; send only from your mail client. Do not treat growth bullets as verified forecasts.",
  });

  const videoScriptNote = buildNoteBody({
    context:
      "Short demo or explainer video — beats only; inferred from recent engineering themes (governance, receipts, Activity trace).",
    proposed:
      "0:00 hook — 'approval is not execution'\n0:20 HUD queue + Approve\n0:45 Execute system.note\n1:05 Activity trace — Executed · receipt recorded\n1:25 CTA — Jarvis governs, you publish",
    evidence:
      "Beats inferred from recent engineering themes (governance, receipts, Activity trace wording). Not tied to a specific build log file in this payload.",
    decision:
      "Approve if script matches your next recording; attach real session notes to Sources before claiming a sourced rehearsal.",
  });

  const proposals: MediaProposalPayload[] = [
    {
      agent: "operator-media",
      builder: "rehearsal",
      kind: "system.note",
      title: "LinkedIn — ship note from latest commit (rehearsal)",
      summary:
        "Short professional update proposal grounded in local git subject when available; otherwise explicitly unsourced until you add one.",
      evidenceStatus: gitRef ? "sourced" : "inferred",
      uncertaintySummary:
        gitRef
          ? "Opening lines extrapolate tone from commit message; audience reaction and competitive framing are not verified."
          : "No git one-liner captured; proposed copy is illustrative until you attach a real commit reference in Sources.",
      source: { connector: "openclaw", agentId: SOURCE_AGENT_ID },
      payload: { note: linkedInNote },
    },
    {
      agent: "operator-media",
      builder: "rehearsal",
      kind: "system.note",
      title: "Blog draft — trust boundary (architecture excerpt)",
      summary:
        "Longer post proposal anchored on a real in-repo doc excerpt when available; requires full read before external publish.",
      evidenceStatus: doc ? "sourced" : "inferred",
      uncertaintySummary:
        doc
          ? "Excerpt is truncated; final claims must be checked against the full document and current product behavior."
          : "Without file excerpt, body is outline-only — add Sources before treating as sourced.",
      source: { connector: "openclaw", agentId: SOURCE_AGENT_ID },
      payload: { note: blogNote },
    },
    {
      agent: "operator-media",
      builder: "rehearsal",
      kind: "system.note",
      title: "DevHouse follow-up — email draft (no send)",
      summary:
        "Polite follow-up template; operator must insert real names, dates, and outcomes.",
      evidenceStatus: "speculative",
      uncertaintySummary:
        "Outreach template and growth angle are hypothetical; no attendee list, deal stage, or revenue figure is included. Confirm facts before send.",
      source: { connector: "openclaw", agentId: SOURCE_AGENT_ID },
      payload: { note: devHouseEmailNote },
    },
    {
      agent: "operator-media",
      builder: "rehearsal",
      kind: "system.note",
      title: "Short video script — governed path beat sheet",
      summary:
        "Speculative beats for an explainer; timing and visuals are placeholders.",
      evidenceStatus: "inferred",
      uncertaintySummary:
        "Script is a rehearsal scaffold inferred from product vocabulary; not validated against a recorded run or audience testing.",
      source: { connector: "openclaw", agentId: SOURCE_AGENT_ID },
      payload: { note: videoScriptNote },
    },
  ];

  // Fourth item: add explicit speculative revenue line only in uncertainty for email — user asked speculative for growth/revenue — video already speculative. Add second speculative in devHouse - good.

  return proposals;
}

function parseOutDir(argv: string[]): string | null {
  const joined = argv.join(" ");
  const m = joined.match(/--out-dir=(\S+)/);
  return m ? m[1].trim() : null;
}

function main(): void {
  const argv = process.argv.slice(2);
  const outDir = parseOutDir(argv);

  const proposals = buildProposals();

  if (outDir) {
    const abs = join(REPO_ROOT, outDir.replace(/^\//, ""));
    mkdirSync(abs, { recursive: true });
    const names = [
      "01-linkedin-from-commit.json",
      "02-blog-from-architecture-doc.json",
      "03-devhouse-follow-up-email.json",
      "04-video-script-build-session.json",
    ];
    for (let i = 0; i < proposals.length; i++) {
      const p = join(abs, names[i] ?? `proposal-${i + 1}.json`);
      writeFileSync(p, `${JSON.stringify(proposals[i], null, 2)}\n`, "utf8");
    }
    console.error(`Wrote ${proposals.length} files under ${abs} (no secrets, no network).`);
    return;
  }

  for (let i = 0; i < proposals.length; i++) {
    const label = ["LinkedIn", "Blog", "DevHouse email", "Video script"][i] ?? `Proposal ${i + 1}`;
    console.log(`\n--- Operator Media Engine sample / ${label} ---\n`);
    console.log(JSON.stringify(proposals[i], null, 2));
  }
  console.log(
    "\n--- End samples ---\nSubmit with: pnpm jarvis:submit --file <path> (you provide secret in env; never commit .env.local)\n"
  );
}

main();
