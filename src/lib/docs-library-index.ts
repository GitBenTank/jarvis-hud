import fs from "node:fs/promises";
import path from "node:path";
import { stripFrontmatter } from "@/lib/docs-content";

/** Markdown under docs/ is the full corpus; the /docs UI defaults to a curated subset (see docs/README.md — “What appears in the docs UI”). */
const DOCS_ROOT = path.join(process.cwd(), "docs");

export type DocsLibraryEntry = {
  href: string;
  /** URL segments under docs, e.g. ['setup','local-stack-startup'] */
  segments: string[];
  title: string;
  pathLabel: string;
};

export type DocsLibraryCategory = {
  id: string;
  label: string;
  description: string;
  entries: DocsLibraryEntry[];
};

export type DocsLibraryStartItem = {
  href: string;
  title: string;
  description: string;
};

export type DocsLibraryBuild = {
  /** Curated default index (omits internal research drafts, prompt fragments, etc.) */
  publicCategories: DocsLibraryCategory[];
  /** Every markdown file under docs/, grouped */
  fullCategories: DocsLibraryCategory[];
  stats: {
    totalFiles: number;
    listedInPublicIndex: number;
    hiddenFromPublicIndex: number;
  };
  newcomers: DocsLibraryStartItem[];
  investors: DocsLibraryStartItem[];
  trust: DocsLibraryStartItem[];
  operators: DocsLibraryStartItem[];
};

const ROOT_INTEGRATION = new Set([
  "openclaw-integration-verification",
  "openclaw-agent-identity",
  "local-verification-openclaw-jarvis",
  "jarvis-proposal-submit",
  "cursor-prompt-openclaw-ingress",
  "connectors",
]);

const ROOT_ARCHITECTURE = new Set([
  "execution-scope",
  "trust-boundary",
  "traces",
]);

const ROOT_DEMOS = new Set([
  "demo-governed-execution-checklist",
  "live-demo-reliability-checklist",
]);

const ROOT_NARRATIVE = new Set(["interview-prep-jarvis"]);

const ROOT_REFERENCE = new Set(["audit-export"]);

type CategoryId =
  | "setup"
  | "integration"
  | "narrative"
  | "architecture"
  | "security"
  | "product"
  | "demos"
  | "research"
  | "marketing"
  | "reference";

const CATEGORY_META: Record<
  CategoryId,
  { label: string; description: string; order: number }
> = {
  setup: {
    label: "Setup & operations",
    description:
      "Environment, local stack, OpenClaw Control UI, checklists, and day-one runbooks.",
    order: 1,
  },
  integration: {
    label: "OpenClaw & Jarvis integration",
    description:
      "Ingress, verification, connectors, and the boundary between capability and control plane.",
    order: 2,
  },
  narrative: {
    label: "Strategy & narrative",
    description:
      "Thesis, positioning, pitch materials, operator briefs, and batch workflows.",
    order: 3,
  },
  architecture: {
    label: "Architecture",
    description:
      "Control plane, trust model, reconciliation, executor strategy, and system overviews.",
    order: 4,
  },
  security: {
    label: "Security",
    description:
      "Ingress signing, execution model, trusted ingress, and policy enforcement.",
    order: 5,
  },
  product: {
    label: "Roadmaps & decisions",
    description:
      "ADRs, technical roadmap, operator phases, and production milestone docs.",
    order: 6,
  },
  demos: {
    label: "Video, demos & runbooks",
    description:
      "Investor runbooks, episode artifacts, proof demos, and reliability checklists.",
    order: 7,
  },
  research: {
    label: "Research",
    description:
      "Video insights, secure-setup notes, and exploratory writeups.",
    order: 8,
  },
  marketing: {
    label: "Go-to-market",
    description:
      "Distribution and social copy aligned with the narrative.",
    order: 9,
  },
  reference: {
    label: "Reference",
    description:
      "Receipts examples, audit export, and other supporting artifacts.",
    order: 10,
  },
};

/**
 * Files that stay in the repo but are omitted from the default docs index so the
 * browse UI stays investor- and newcomer-friendly. Direct URLs still work.
 * Policy: docs/README.md → "What appears in the docs UI".
 */
export function isExcludedFromPublicLibraryIndex(segments: string[]): boolean {
  const pathStr = segments.join("/");
  const leaf = segments[segments.length - 1] ?? "";

  if (segments[0] === "archive") return true;

  if (pathStr === "marketing/social-copy") return true;
  if (pathStr === "cursor-prompt-openclaw-ingress") return true;
  if (pathStr === "interview-prep-jarvis") return true;

  if (segments[0] === "research" && segments[1] === "video-insights") {
    if (leaf === "insight-index" || leaf === "README") return false;
    return true;
  }

  if (segments[0] === "video") {
    if (leaf.startsWith("MISSION-LOG")) return true;
    if (leaf === "EPISODE2-RUNBOOK") return true;
    if (leaf === "episode-02-artifacts") return true;
    if (leaf === "episode-02-film-checklist") return true;
  }

  return false;
}

function humanizeSlug(slug: string): string {
  return slug
    .split(/[-_/]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function categorize(segments: string[]): CategoryId {
  if (segments.length === 1) {
    const slug = segments[0];
    if (slug === "README") return "setup";
    if (ROOT_INTEGRATION.has(slug)) return "integration";
    if (ROOT_ARCHITECTURE.has(slug)) return "architecture";
    if (ROOT_DEMOS.has(slug)) return "demos";
    if (ROOT_NARRATIVE.has(slug)) return "narrative";
    if (ROOT_REFERENCE.has(slug)) return "reference";
    return "reference";
  }
  const top = segments[0];
  switch (top) {
    case "getting-started":
      return "setup";
    case "setup":
      return "setup";
    case "strategy":
      return "narrative";
    case "architecture":
      return "architecture";
    case "security":
      return "security";
    case "decisions":
    case "roadmap":
      return "product";
    case "video":
      return "demos";
    case "research":
      return "research";
    case "marketing":
      return "marketing";
    case "receipts":
      return "reference";
    default:
      return "reference";
  }
}

async function collectMarkdownFiles(
  dir: string,
  rel: string[],
): Promise<string[][]> {
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  const out: string[][] = [];
  for (const d of dirents) {
    if (d.name.startsWith(".")) continue;
    const nextRel = [...rel, d.name];
    const full = path.join(dir, d.name);
    if (d.isDirectory()) {
      out.push(...(await collectMarkdownFiles(full, nextRel)));
    } else if (d.name.endsWith(".md")) {
      out.push(nextRel);
    }
  }
  return out;
}

function relToSegments(rel: string[]): string[] {
  if (rel.length === 0) return [];
  const last = rel[rel.length - 1];
  if (!last.endsWith(".md")) return rel;
  const stem = last.slice(0, -3);
  return [...rel.slice(0, -1), stem];
}

async function titleFromFile(filePath: string, segments: string[]): Promise<string> {
  const raw = await fs.readFile(filePath, "utf-8");
  const body = stripFrontmatter(raw);
  const heading = body.match(/^#\s+(.+)$/m);
  if (heading) return heading[1].trim();
  const base = path.basename(filePath, ".md");
  if (base.toLowerCase() === "readme" && segments.length >= 2) {
    return humanizeSlug(segments[segments.length - 2]);
  }
  return humanizeSlug(base);
}

function groupByCategory(
  items: { category: CategoryId; entry: DocsLibraryEntry }[],
): DocsLibraryCategory[] {
  const byCat = new Map<CategoryId, DocsLibraryEntry[]>();
  for (const id of Object.keys(CATEGORY_META) as CategoryId[]) {
    byCat.set(id, []);
  }
  for (const { category, entry } of items) {
    byCat.get(category)!.push(entry);
  }
  for (const list of byCat.values()) {
    list.sort((a, b) =>
      a.title.localeCompare(b.title, undefined, { sensitivity: "base" }),
    );
  }
  return (Object.keys(CATEGORY_META) as CategoryId[])
    .sort((a, b) => CATEGORY_META[a].order - CATEGORY_META[b].order)
    .map((id) => ({
      id,
      label: CATEGORY_META[id].label,
      description: CATEGORY_META[id].description,
      entries: byCat.get(id) ?? [],
    }))
    .filter((c) => c.entries.length > 0);
}

/** Plain language — no stack assumptions */
export const DOCS_NEWCOMERS: DocsLibraryStartItem[] = [
  {
    href: "/docs/getting-started/welcome",
    title: "Welcome — what is Jarvis?",
    description:
      "Plain-language overview, glossary, and where to go next by role.",
  },
  {
    href: "/about",
    title: "About (in the app)",
    description: "Short product surface inside the HUD—not a markdown file.",
  },
  {
    href: "/demo",
    title: "Guided demo",
    description: "The story we tell in the room—slides and live proof.",
  },
];

/** Narrative & diligence — still readable without running code */
export const DOCS_INVESTORS: DocsLibraryStartItem[] = [
  {
    href: "/docs/tati",
    title: "Investor read pack (canonical four)",
    description: "Fixed 15-minute order: pitch, room, Thesis Lock, flagship team.",
  },
  {
    href: "/docs/strategy/gener8tor-pitch",
    title: "Investor pitch (slides + demo)",
    description: "Five-slide, consequence-first narrative.",
  },
  {
    href: "/docs/strategy/room-playbook-v1",
    title: "Room playbook",
    description: "Opener, 30-second pitch, and objections.",
  },
  {
    href: "/docs/video/investor-demo-full-runbook",
    title: "Investor demo runbook",
    description: "Operator checklist for a clean live proof.",
  },
  {
    href: "/docs/video/90s-proof-demo",
    title: "90-second proof",
    description: "Ultra-short script when time is tight.",
  },
  {
    href: "/docs/strategy/competitive-landscape-2026",
    title: "Competitive landscape",
    description: "Positioning versus alternatives (2026).",
  },
  {
    href: "/docs/strategy/pitch-narrative-outline",
    title: "Pitch narrative outline",
    description: "Deck storyline and messaging spine.",
  },
];

/** Governance story — trust without implementation detail */
export const DOCS_TRUST: DocsLibraryStartItem[] = [
  {
    href: "/docs/decisions/0001-thesis-lock",
    title: "Thesis Lock (ADR)",
    description:
      "Non-negotiables: human approval, receipts, the model is not a principal.",
  },
  {
    href: "/docs/strategy/jarvis-hud-video-thesis",
    title: "Video thesis (canonical spec)",
    description: "Full narrative spec—read after the one-pagers.",
  },
  {
    href: "/docs/architecture/jarvis-openclaw-system-overview",
    title: "System map",
    description: "How capability (tools/agents) and authority (Jarvis) connect.",
  },
  {
    href: "/docs/architecture/security-model",
    title: "Security model",
    description: "Execution risk, ingress, and what we enforce.",
  },
];

/** Operators & integrators — day-to-day truth */
export const DOCS_OPERATORS: DocsLibraryStartItem[] = [
  {
    href: "/docs/README",
    title: "Documentation hub",
    description:
      "Map of every doc by job: startup, verification, contracts.",
  },
  {
    href: "/docs/setup/local-stack-startup",
    title: "Local stack startup",
    description: "Jarvis + OpenClaw routine, ports, doctor, recovery.",
  },
  {
    href: "/docs/setup/openclaw-jarvis-operator-checklist",
    title: "Operator checklist",
    description: "Authority split, anti-patterns, failure modes.",
  },
  {
    href: "/docs/setup/openclaw-ingress-for-humans",
    title: "Ingress for humans",
    description:
      "Plain language: what ingress proves, proposals vs approve vs execute.",
  },
  {
    href: "/docs/setup/return-after-pause",
    title: "Return after a pause",
    description: "Pick the stack back up without re-deriving ports and state.",
  },
  {
    href: "/docs/setup/serious-mode-rehearsal-checklist",
    title: "Serious-mode rehearsal",
    description:
      "Auth on: machine-wired, auth-posture with expect flag, batched approve/execute.",
  },
  {
    href: "/docs/local-verification-openclaw-jarvis",
    title: "Local verification",
    description: "Ordered proof: gateway, UI, ingress, receipts.",
  },
  {
    href: "/docs/openclaw-integration-verification",
    title: "Integration verification",
    description: "Protocol detail, HTTP codes, threat model.",
  },
  {
    href: "/docs/strategy/operating-assumptions",
    title: "Operating assumptions",
    description: "Frozen deployment and auth defaults.",
  },
  {
    href: "/docs/strategy/agent-team-contract-v1",
    title: "Agent team contract v1",
    description:
      "Alfred + specialists: routing, handoffs, Jarvis kinds, one-proposal-per-consent.",
  },
  {
    href: "/docs/strategy/flagship-team-bundle-v1",
    title: "Flagship team bundle v1",
    description:
      "Alfred + Research + Creative: intake, evidence, variants, Jarvis proposals — no Operator v1.",
  },
  {
    href: "/docs/strategy/research-agent-v1",
    title: "Research agent v1",
    description:
      "Evidence specialist: citations, system.note capture, handoffs — no silent execution.",
  },
  {
    href: "/docs/strategy/creative-agent-v1",
    title: "Creative agent v1",
    description:
      "Messaging specialist: variants, content.publish drafts — no send/post without Jarvis.",
  },
];

export async function buildDocsLibrary(): Promise<DocsLibraryBuild> {
  const relFiles = await collectMarkdownFiles(DOCS_ROOT, []);
  const jobs = relFiles.map(async (rel) => {
    const segments = relToSegments(rel);
    if (segments.length === 0) return null;
    const filePath = path.join(DOCS_ROOT, ...rel);
    const title = await titleFromFile(filePath, segments);
    const href = `/docs/${segments.join("/")}`;
    const pathLabel = `${segments.join("/")}.md`;
    const category = categorize(segments);
    return {
      category,
      entry: { href, segments, title, pathLabel },
    };
  });

  const resolved = (await Promise.all(jobs)).filter(
    (x): x is NonNullable<typeof x> => x != null,
  );

  const publicResolved = resolved.filter(
    (x) => !isExcludedFromPublicLibraryIndex(x.entry.segments),
  );

  return {
    publicCategories: groupByCategory(publicResolved),
    fullCategories: groupByCategory(resolved),
    stats: {
      totalFiles: resolved.length,
      listedInPublicIndex: publicResolved.length,
      hiddenFromPublicIndex: resolved.length - publicResolved.length,
    },
    newcomers: DOCS_NEWCOMERS,
    investors: DOCS_INVESTORS,
    trust: DOCS_TRUST,
    operators: DOCS_OPERATORS,
  };
}

/** @deprecated Prefer buildDocsLibrary(); kept for tests or callers that only need one list */
export async function loadDocsLibraryIndex(): Promise<DocsLibraryCategory[]> {
  const { publicCategories } = await buildDocsLibrary();
  return publicCategories;
}
