#!/usr/bin/env node
/**
 * Organizational lint for docs (all Markdown under docs/ except archive):
 * - Hard fail: missing at least one first-level Markdown title line (`# `, not `##`).
 * - Warn: heuristic folder mismatch vs content signals; mixed intent.
 *
 * Paths use POSIX `docs/...` (same as repo tree under docs/).
 *
 * TODO: Visibility drift checks should wait until visibility has a single source of truth
 * shared with the docs UI/index policy (`src/lib/docs-library-index.ts` and related).
 */

import fs from "node:fs/promises";
import path from "node:path";

const DOCS_ROOT = path.join(process.cwd(), "docs");

const VERBOSE = process.argv.includes("--verbose") || process.argv.includes("-v");

/** Paths that intentionally break heuristics (hub, cross-cutting, integrations under docs/). */
const ALLOWLIST = new Set([
  "docs/README.md",
  "docs/system/full-ecosystem-tree.md",
  "docs/getting-started/welcome.md",
  "docs/decisions/README.md",
  "docs/strategy/pitch-deck/README.md",
  // Root-level docs under docs/: placement is deliberate.
  "docs/openclaw-integration-verification.md",
  "docs/openclaw-agent-identity.md",
  "docs/local-verification-openclaw-jarvis.md",
  "docs/jarvis-proposal-submit.md",
  "docs/cursor-prompt-openclaw-ingress.md",
  "docs/connectors.md",
  "docs/traces.md",
  "docs/trust-boundary.md",
  "docs/execution-scope.md",
  "docs/audit-export.md",
  "docs/live-demo-reliability-checklist.md",
  "docs/demo-governed-execution-checklist.md",
  "docs/interview-prep-jarvis.md",
]);

/** Mentioning investor/narrative from architecture / ADRs — suppress strategy misplaced. */
const STRATEGY_EXEMPT_PREFIXES = ["docs/architecture/", "docs/decisions/", "docs/security/", "docs/roadmap/"];

/**
 * Heuristic mismatch is often OK in nearby trees (cross-domain references).
 */
const MISPLACED_SUPPRESS = {
  "strategy-or-system":
    /^docs\/(setup|getting-started|strategy|system|marketing|video|architecture|research)\//,
  setup: /^docs\/(setup|getting-started|architecture|strategy|video|roadmap|decisions|marketing|research|security)\//,
  architecture:
    /^docs\/(architecture|strategy|decisions|roadmap|security|setup|video|marketing|getting-started|research)\//,
  security:
    /^docs\/(architecture|security|strategy|setup|video|decisions|roadmap|marketing|research)\//,
  "decisions-roadmap":
    /^docs\/(decisions|roadmap|architecture|strategy|setup|security|marketing|receipts)\//,
  "video-demos":
    /^docs\/(video|strategy|setup|architecture|decisions|roadmap|marketing)\//,
  research:
    /^docs\/(research|architecture|strategy|marketing|setup|security)\//,
  marketing:
    /^docs\/(marketing|strategy|architecture|roadmap|setup)\//,
};

function posixRel(fromRoot) {
  return fromRoot.replaceAll(path.sep, "/");
}

/** True if raw file has at least one `# ` line that is not `##` (Marp slide titles count). */
function hasMarkdownH1(raw) {
  const n = raw.replace(/^\ufeff/, "");
  return /(?:^|\r?\n)(?!#{2})#\s+[^\s#][^\r\n]+/.test(n);
}

function canonicalDocsPath(relFromDocsRoot) {
  const norm = posixRel(relFromDocsRoot);
  if (norm.startsWith("docs/")) return norm;
  return `docs/${norm}`;
}

/** Labels first path segment under docs/ — files directly under docs/ resolve to root. */
function folderIntentLabel(canon) {
  const inTree = /^docs\/([^/]+)\//.exec(canon);
  if (inTree) return inTree[1];
  const rootMd = /^docs\/([^/]+\.md)$/.exec(canon);
  return rootMd ? "root" : "docs";
}

const HEURISTICS = [
  {
    id: "strategy-or-system",
    expectedPrefixes: ["docs/strategy/", "docs/system/"],
    test(t) {
      return (
        /\bpitch\b/.test(t) ||
        /\binvestor\b/.test(t) ||
        /\bpositioning\b/.test(t) ||
        /\bnarrative\b/.test(t) ||
        /\bthesis\b/.test(t) ||
        /\becosystem\b/.test(t) ||
        /\bagent\s+team\b/.test(t)
      );
    },
  },
  {
    id: "setup",
    expectedPrefixes: ["docs/setup/", "docs/getting-started/"],
    test(t) {
      return (
        /\bpnpm\s+dev\b/.test(t) ||
        /\blocal\s+stack\b/.test(t) ||
        /\.env\b/.test(t) ||
        /\boperator\s+checklist\b/.test(t) ||
        /\brehearsal\b/.test(t) ||
        (/\bchecklist\b/.test(t) && /\blocal\b/.test(t)) ||
        /\bopenclaw\s+control\b/.test(t) ||
        /\breturn\s+after\s+a\s+pause\b/.test(t)
      );
    },
  },
  {
    id: "architecture",
    expectedPrefixes: ["docs/architecture/"],
    test(t) {
      return (
        /\barchitecture\b/.test(t) ||
        /\bcontrol\s+plane\b/.test(t) ||
        /\btrust\s+model\b/.test(t) ||
        /\bexecutor\b/.test(t) ||
        /\btrust\s+contract\b/.test(t) ||
        /\bruntime\b/.test(t)
      );
    },
  },
  {
    id: "security",
    expectedPrefixes: ["docs/security/"],
    test(t) {
      return (
        (/\bingress\b/.test(t) && /\b(signing|signature|hmac)\b/.test(t)) ||
        /\btrusted\s+ingress\b/.test(t) ||
        (/\brisks?\b/.test(t) &&
          /\b(execution\s+surface|privileged|boundary)\b/.test(t))
      );
    },
  },
  {
    id: "decisions-roadmap",
    expectedPrefixes: ["docs/decisions/", "docs/roadmap/"],
    test(txt) {
      const u = txt.toUpperCase();
      const t = txt.toLowerCase();
      return (
        /\bADR\b/.test(u) ||
        /\barchitecture\s+decision\b/.test(t) ||
        /\bdecision\s+log\b/.test(t) ||
        /\broadmap\b/.test(t) ||
        /\bphase\s*\d\b/.test(t) ||
        /\bmaster\s+plan\b/.test(t)
      );
    },
  },
  {
    id: "video-demos",
    expectedPrefixes: ["docs/video/"],
    test(t) {
      return (
        (/\binvestor[-\s]demo[^\n]{0,40}runbook\b/i.test(t) || /\bjarvis-demo-recording\b/i.test(t)) ||
        (/\bmulti[-\s]cam|\brecording\s+workflow\b|\bscreen\s+(capture|recording)\b/i.test(t) &&
          /\bdemo\b/.test(t)) ||
        /\bmission\s+log\b/.test(t) ||
        ((/\bdemo\b/.test(t) || /\bpitch\b/.test(t)) && /\binvestor\b/.test(t))
      );
    },
  },
  {
    id: "research",
    expectedPrefixes: ["docs/research/"],
    test(t) {
      return (
        (/\bvideo\s+insights\b/.test(t) && /\binsight\b/.test(t)) ||
        /\bintake\s+notes\b/.test(t) ||
        /\bresearch\/video\b/.test(t)
      );
    },
  },
  {
    id: "marketing",
    expectedPrefixes: ["docs/marketing/"],
    test(t) {
      return (
        /\bdistribution\s+(checklist|plan)\b/i.test(t) ||
        /\bsocial\s+copy\b/.test(t) ||
        (/\bcopy\b/.test(t) && /\b(gtm|marketing)\b/.test(t))
      );
    },
  },
];

/** Mixed-intent probes (narrow to reduce false positives). */
const INTENT_BUCKETS = {
  investorNarrative: (t) =>
    /\b(pitch|fundraising|investor\s+read|investor\s+pack\b)/i.test(t),
  operatorSetup: (t) =>
    /\b(pnpm\s+(dev|machine|test)|machine-wired|\blocal\s+stack\b|\bpnpm\s+openclaw)/i.test(
      t,
    ),
  architectureDiligence: (t) =>
    /\b(control\s+plane|executor\b.*\bjarvis|trust\s+model)/i.test(t),
  goToMarketCopy: (t) =>
    /\b(distribution|social)\s+copy\b|\bgtm\b|\bmarketing\s+copy\b/i.test(t),
  researchIntel: (t) =>
    /\bvideo\s+insights\b|\binsight\s+index\b/i.test(t),
};

async function collectMdFiles(dir, relParts = []) {
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  const out = [];
  for (const d of dirents) {
    if (d.name.startsWith(".")) continue;
    const next = [...relParts, d.name];
    const full = path.join(dir, d.name);
    if (d.isDirectory()) {
      if (d.name === "archive") continue;
      out.push(...(await collectMdFiles(full, next)));
    } else if (d.name.endsWith(".md")) {
      const relUnix = posixRel(path.relative(DOCS_ROOT, full));
      if (relUnix.startsWith("archive/")) continue;
      out.push(relUnix);
    }
  }
  return out.sort();
}

function pathStartsWithAny(canonicalRel, prefixes) {
  return prefixes.some((p) => canonicalRel.startsWith(p));
}

function runMultiIntent(txt, canon) {
  const hits = [];
  for (const [name, fn] of Object.entries(INTENT_BUCKETS)) {
    if (fn(txt)) hits.push(name);
  }
  const criticalPairs = [
    ["investorNarrative", "operatorSetup"],
    ["architectureDiligence", "goToMarketCopy"],
    ["researchIntel", "investorNarrative"],
  ];
  const set = new Set(hits);
  for (const [a, b] of criticalPairs) {
    if (!(set.has(a) && set.has(b))) continue;
    const key = `${a}+${b}`;
    if (
      key === "investorNarrative+operatorSetup" &&
      /^docs\/(setup|video|strategy)\//.test(canon)
    ) {
      continue;
    }
    if (
      key === "architectureDiligence+goToMarketCopy" &&
      /^docs\/(marketing|roadmap|strategy)\//.test(canon)
    ) {
      continue;
    }
    return { warn: true, hits, pair: `${a} + ${b}` };
  }
  if (hits.length >= 5) return { warn: true, hits, pair: "many buckets" };
  return { warn: false, hits };
}

/** @returns {'correct'|'missing title'|'review suggested'} */
function placementLine(missingH1, warningCountForFile) {
  if (missingH1) return "missing title";
  if (warningCountForFile > 0) return "review suggested";
  return "correct";
}

async function main() {
  const files = await collectMdFiles(DOCS_ROOT);
  /** @type {{ file: string, kind: string, detail: string, expected?: string }[]} */
  const warnings = [];

  /** @type {Map<string, { missingH1: boolean, ws: typeof warnings, intent: string, allowlisted: boolean }>} */
  const byFile = new Map();

  function ensure(file) {
    if (!byFile.has(file))
      byFile.set(file, {
        missingH1: false,
        ws: [],
        intent: folderIntentLabel(file),
        allowlisted: ALLOWLIST.has(file),
      });
    return byFile.get(file);
  }

  let failures = 0;

  for (const rel of files) {
    const fp = path.join(DOCS_ROOT, rel);
    const raw = await fs.readFile(fp, "utf-8");
    const canon = canonicalDocsPath(rel);
    const st = ensure(canon);

    if (!hasMarkdownH1(raw)) {
      st.missingH1 = true;
      failures++;
      const w = {
        kind: "missing-title",
        detail: `Missing Markdown H1 (\`# Title\`)`,
      };
      warnings.push({ file: canon, ...w });
      st.ws.push(w);
      continue;
    }

    if (ALLOWLIST.has(canon)) continue;

    const lower = raw.toLowerCase();

    for (const h of HEURISTICS) {
      if (!h.test(lower)) continue;
      const ok = pathStartsWithAny(canon, h.expectedPrefixes);
      if (ok) continue;
      if (
        h.id === "strategy-or-system" &&
        STRATEGY_EXEMPT_PREFIXES.some((p) => canon.startsWith(p))
      ) {
        continue;
      }
      const suppress = MISPLACED_SUPPRESS[h.id];
      if (suppress && suppress.test(canon)) {
        continue;
      }
      const w = {
        kind: "misplaced-heuristic",
        detail: `Content matches heuristic "${h.id}".`,
        expected: h.expectedPrefixes.join(" · "),
      };
      warnings.push({ file: canon, ...w });
      ensure(canon).ws.push(w);
    }

    const mix = runMultiIntent(raw, canon);
    if (mix.warn) {
      const w = {
        kind: "multi-intent",
        detail:
          mix.pair === "many buckets"
            ? `Many intent buckets flagged: ${mix.hits.join(", ")}`
            : `Possible mixed intent (${mix.pair}); split or narrow scope.`,
      };
      warnings.push({ file: canon, ...w });
      ensure(canon).ws.push(w);
    }
  }

  if (!VERBOSE) {
    for (const w of warnings) {
      if (w.kind === "missing-title") {
        console.error(`❌ ${w.file}\n   ${w.detail}`);
      } else {
        console.warn(
          `⚠ ${w.file}\n   ${w.detail}${w.expected ? `\n   Suggested: ${w.expected}` : ""}`,
        );
      }
    }
  }

  let intentional = 0;

  for (const rel of files) {
    const canon = canonicalDocsPath(rel);
    const st = ensure(canon);

    const fileWarnNonH1Count = st.ws.filter((x) => x.kind !== "missing-title")
      .length;

    const place = placementLine(st.missingH1, fileWarnNonH1Count);

    if (VERBOSE) {
      const icon = st.missingH1 ? "❌" : fileWarnNonH1Count ? "⚠" : "✅";

      console.log(`${icon} ${canon}`);
      console.log(`   Intent: ${st.intent}`);
      console.log(`   Placement: ${place}`);
      if (!st.missingH1 && fileWarnNonH1Count) {
        for (const ww of st.ws.filter((x) => x.kind !== "missing-title")) {
          console.log(`   • ${ww.detail}`);
        }
      }
    }

    if (!st.missingH1 && fileWarnNonH1Count === 0) intentional++;
  }

  /** Count placement vs mixed-intent (excludes missing-title). */
  const misplacedHeuristicCount = warnings.filter(
    (w) => w.kind === "misplaced-heuristic",
  ).length;
  const mixedIntentCount = warnings.filter(
    (w) => w.kind === "multi-intent",
  ).length;

  const headline =
    failures > 0
      ? `❌ Docs organization check finished`
      : `✅ Docs organization check complete`;

  if (VERBOSE || (!VERBOSE && warnings.length > 0)) console.log("");
  console.log(headline);
  console.log(`Summary:`);
  console.log(`- ${files.length} files scanned`);
  console.log(`- ${failures} failure${failures !== 1 ? "s" : ""}`);
  console.log(
    `- ${misplacedHeuristicCount} placement suggestion${misplacedHeuristicCount !== 1 ? "s" : ""}`,
  );
  console.log(
    `- ${mixedIntentCount} mixed-intent warning${mixedIntentCount !== 1 ? "s" : ""}`,
  );
  console.log(`- ${intentional} intentional placement${intentional !== 1 ? "s" : ""}`);
  console.log(`System health: ${failures > 0 ? "ATTENTION" : "GOOD"}`);
  console.log(
    VERBOSE
      ? "Mode: verbose (per-file confirmations above)"
      : "Mode: quiet (use pnpm lint:docs -- --verbose for per-file detail)",
  );

  process.exit(failures > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
