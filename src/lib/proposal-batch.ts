/**
 * Proposal batch v0 — review container metadata on per-item approval events.
 * @see docs/decisions/0005-agent-team-batch-v0-per-item-execute.md
 *
 * Each executable proposal remains a separate event with its own approval + execute + receipt.
 * Optional `batch` on the event groups items for UI triage only.
 */

export type ProposalBatchItemContext = {
  /** Shared id for all items in the same batch (ingress-generated). */
  id: string;
  title?: string;
  summary?: string;
  itemIndex: number;
  itemCount: number;
};

/** OpenClaw wire / stored batch object (strict ingress). */
export const INGRESS_BATCH_ALLOWED_KEYS = new Set([
  "id",
  "title",
  "summary",
  "itemIndex",
  "itemCount",
]);

export const INGRESS_BATCH_ID_MAX_LEN = 128;
export const INGRESS_BATCH_TITLE_MAX_LEN = 200;
export const INGRESS_BATCH_SUMMARY_MAX_LEN = 2000;
/** Caps fuzzy "whole batch" claims; each item still has its own approval id. */
export const INGRESS_BATCH_MAX_ITEM_COUNT = 100;

export type StrictIngressBatchResult =
  | { ok: true; batch: ProposalBatchItemContext }
  | { ok: false; message: string; field: string };

/**
 * Reject malformed or ambiguous batch payloads at ingress (OpenClaw).
 * Unknown keys, wrong types, non-integers, and out-of-range counts fail closed.
 */
export function strictValidateIngressBatch(raw: unknown): StrictIngressBatchResult {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, message: "batch must be a plain object", field: "batch" };
  }

  const o = raw as Record<string, unknown>;
  for (const key of Object.keys(o)) {
    if (!INGRESS_BATCH_ALLOWED_KEYS.has(key)) {
      return {
        ok: false,
        message: `Unknown batch field: ${key} (allowed: ${[...INGRESS_BATCH_ALLOWED_KEYS].sort().join(", ")})`,
        field: `batch.${key}`,
      };
    }
  }

  if (typeof o.id !== "string") {
    return { ok: false, message: "batch.id is required and must be a string", field: "batch.id" };
  }
  const id = o.id.trim();
  if (!id) {
    return { ok: false, message: "batch.id must be non-empty", field: "batch.id" };
  }
  if (id.length > INGRESS_BATCH_ID_MAX_LEN) {
    return {
      ok: false,
      message: `batch.id must be ≤ ${INGRESS_BATCH_ID_MAX_LEN} chars`,
      field: "batch.id",
    };
  }

  if (o.title !== undefined) {
    if (typeof o.title !== "string") {
      return { ok: false, message: "batch.title must be a string when provided", field: "batch.title" };
    }
    if (o.title.trim().length > INGRESS_BATCH_TITLE_MAX_LEN) {
      return {
        ok: false,
        message: `batch.title must be ≤ ${INGRESS_BATCH_TITLE_MAX_LEN} chars`,
        field: "batch.title",
      };
    }
  }

  if (o.summary !== undefined) {
    if (typeof o.summary !== "string") {
      return {
        ok: false,
        message: "batch.summary must be a string when provided",
        field: "batch.summary",
      };
    }
    if (o.summary.trim().length > INGRESS_BATCH_SUMMARY_MAX_LEN) {
      return {
        ok: false,
        message: `batch.summary must be ≤ ${INGRESS_BATCH_SUMMARY_MAX_LEN} chars`,
        field: "batch.summary",
      };
    }
  }

  if (!("itemIndex" in o)) {
    return { ok: false, message: "batch.itemIndex is required", field: "batch.itemIndex" };
  }
  if (!("itemCount" in o)) {
    return { ok: false, message: "batch.itemCount is required", field: "batch.itemCount" };
  }

  const itemIndex = o.itemIndex;
  const itemCount = o.itemCount;

  if (typeof itemIndex !== "number" || !Number.isInteger(itemIndex) || itemIndex < 0) {
    return {
      ok: false,
      message: "batch.itemIndex must be a non-negative integer",
      field: "batch.itemIndex",
    };
  }
  if (typeof itemCount !== "number" || !Number.isInteger(itemCount) || itemCount < 1) {
    return {
      ok: false,
      message: "batch.itemCount must be a positive integer",
      field: "batch.itemCount",
    };
  }
  if (itemCount > INGRESS_BATCH_MAX_ITEM_COUNT) {
    return {
      ok: false,
      message: `batch.itemCount must be ≤ ${INGRESS_BATCH_MAX_ITEM_COUNT}`,
      field: "batch.itemCount",
    };
  }
  if (itemIndex >= itemCount) {
    return {
      ok: false,
      message: "batch.itemIndex must be strictly less than batch.itemCount",
      field: "batch.itemIndex",
    };
  }

  const title = typeof o.title === "string" ? o.title.trim() : undefined;
  const summary = typeof o.summary === "string" ? o.summary.trim() : undefined;

  const batch: ProposalBatchItemContext = {
    id,
    itemIndex,
    itemCount,
    ...(title ? { title } : {}),
    ...(summary ? { summary } : {}),
  };

  return { ok: true, batch };
}

function isNonNegativeInt(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n) && n >= 0;
}

function isPositiveInt(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n) && n >= 1;
}

/**
 * Parse `batch` wire shape from a stored event. Invalid or partial payloads are rejected (standalone item).
 */
export function parseProposalBatchItemContext(raw: unknown): ProposalBatchItemContext | null {
  if (raw === null || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = typeof o.id === "string" ? o.id.trim() : "";
  if (!id) return null;

  if (!isNonNegativeInt(o.itemIndex)) return null;
  if (!isPositiveInt(o.itemCount)) return null;
  if (o.itemIndex >= o.itemCount) return null;

  const title = typeof o.title === "string" ? o.title.trim() : undefined;
  const summary = typeof o.summary === "string" ? o.summary.trim() : undefined;

  return {
    id,
    ...(title ? { title } : {}),
    ...(summary ? { summary } : {}),
    itemIndex: o.itemIndex,
    itemCount: o.itemCount,
  };
}

export function getProposalBatchItemContextFromEvent(event: {
  batch?: unknown;
}): ProposalBatchItemContext | null {
  return parseProposalBatchItemContext(event.batch);
}

/** Appended to activity stream summaries when `batch` is present. */
export function proposalBatchActivitySuffix(batchField: unknown): string {
  const b = parseProposalBatchItemContext(batchField);
  if (!b) return "";
  const title = b.title?.trim();
  return ` · Batch ${b.itemIndex + 1}/${b.itemCount}${title ? `: ${title}` : ""}`;
}

export type ProposalBatchGroup<T> = {
  batchId: string;
  title?: string;
  summary?: string;
  itemCount: number;
  items: T[];
};

/**
 * Group events that carry the same valid `batch.id`. Others stay in `standalone`.
 * Order: groups by earliest `createdAt`, items within a group by `itemIndex`.
 */
export function groupEventsByProposalBatch<
  T extends { batch?: unknown; id: string; createdAt?: string },
>(events: readonly T[]): { groups: ProposalBatchGroup<T>[]; standalone: T[] } {
  const standalone: T[] = [];
  const map = new Map<
    string,
    { items: T[]; title?: string; summary?: string; itemCount: number }
  >();

  for (const ev of events) {
    const ctx = parseProposalBatchItemContext(ev.batch);
    if (!ctx) {
      standalone.push(ev);
      continue;
    }
    let g = map.get(ctx.id);
    if (!g) {
      g = {
        items: [],
        itemCount: ctx.itemCount,
        ...(ctx.title ? { title: ctx.title } : {}),
        ...(ctx.summary ? { summary: ctx.summary } : {}),
      };
    }
    g.items.push(ev);
    g.itemCount = Math.max(g.itemCount, ctx.itemCount);
    if (ctx.title?.trim()) g.title = ctx.title.trim();
    if (ctx.summary?.trim()) g.summary = ctx.summary.trim();
    map.set(ctx.id, g);
  }

  const groups: ProposalBatchGroup<T>[] = Array.from(map.entries()).map(([batchId, g]) => {
    const sorted = [...g.items].sort((a, b) => {
      const ia = parseProposalBatchItemContext(a.batch)?.itemIndex ?? 0;
      const ib = parseProposalBatchItemContext(b.batch)?.itemIndex ?? 0;
      return ia - ib;
    });
    return {
      batchId,
      title: g.title,
      summary: g.summary,
      itemCount: g.itemCount,
      items: sorted,
    };
  });

  groups.sort((a, b) => {
    const ta = minCreatedIso(a.items);
    const tb = minCreatedIso(b.items);
    return ta.localeCompare(tb);
  });

  return { groups, standalone };
}

/** Short stable fragment for review-container headers (disambiguate colliding titles; not sensitive). */
export function shortProposalBatchIdFragment(batchId: string): string {
  const t = batchId.trim();
  if (!t) return "—";
  const compact = t.replace(/-/g, "");
  if (compact.length >= 8) return compact.slice(0, 8);
  return t.length > 8 ? `${t.slice(0, 8)}…` : t;
}

function minCreatedIso<T extends { createdAt?: string }>(items: readonly T[]): string {
  let min = "\uffff";
  for (const it of items) {
    const c = it.createdAt ?? "";
    if (c && c < min) min = c;
  }
  return min === "\uffff" ? "" : min;
}
