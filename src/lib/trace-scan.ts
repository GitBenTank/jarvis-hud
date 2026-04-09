/**
 * Shared trace disk scan window and recent-trace discovery from events + receipts.
 * No new persistence — reads existing JSON / JSONL only.
 */

import { promises as fs } from "node:fs";
import {
  readJson,
  getEventsFilePath,
  getActionsFilePath,
  ensurePathSafe,
} from "./storage";
import { normalizeAction } from "./normalize";
import { TRACE_SCAN_DAY_WINDOW } from "./trace-constants";

export { TRACE_SCAN_DAY_WINDOW } from "./trace-constants";

function toDateKey(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Date keys from today backward, length {@link TRACE_SCAN_DAY_WINDOW}. */
export function listTraceScanDateKeys(): string[] {
  return Array.from({ length: TRACE_SCAN_DAY_WINDOW }, (_, i) => toDateKey(i));
}

export type RecentTraceSummary = {
  traceId: string;
  lastActivityAt: string;
  summary: string;
};

/** Normalize `trace` query value: trim; empty → null. */
export function parseTraceUrlParam(trace: string | null | undefined): string | null {
  const t = trace?.trim();
  return t ? t : null;
}

async function readAllActionTimestamps(
  dateKey: string
): Promise<{ traceId: string; at: string }[]> {
  const filePath = getActionsFilePath(dateKey);
  ensurePathSafe(filePath);
  try {
    const content = await fs.readFile(filePath, "utf-8");
    const out: { traceId: string; at: string }[] = [];
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const e = JSON.parse(trimmed) as { traceId?: string; at?: string };
        if (typeof e.traceId === "string" && e.traceId.trim() && typeof e.at === "string") {
          out.push({ traceId: e.traceId.trim(), at: e.at });
        }
      } catch {
        // skip bad line
      }
    }
    return out;
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && err.code === "ENOENT") {
      return [];
    }
    throw err;
  }
}

/**
 * Recent traces: merge events (proposal rows) and action-log lines by traceId,
 * sort by latest activity (ISO string compare).
 */
export async function getRecentTraces(limit: number): Promise<RecentTraceSummary[]> {
  const cap = Math.min(Math.max(limit, 1), 100);
  const dateKeys = listTraceScanDateKeys();
  const map = new Map<string, { lastActivityAt: string; summary: string }>();

  function note(tid: string, iso: string, summary?: string) {
    if (!tid.trim() || !iso.trim()) return;
    const cur = map.get(tid);
    const nextSummary =
      summary !== undefined && summary.trim()
        ? summary.trim()
        : (cur?.summary ?? "");
    if (!cur || iso > cur.lastActivityAt) {
      map.set(tid, { lastActivityAt: iso, summary: nextSummary });
    } else if (cur && !cur.summary && summary?.trim()) {
      map.set(tid, { ...cur, summary: summary.trim() });
    }
  }

  for (const dk of dateKeys) {
    const events = await readJson<
      Array<{
        id?: string;
        traceId?: string;
        createdAt?: string;
        approvedAt?: string;
        executedAt?: string;
        rejectedAt?: string;
        failedAt?: string;
        payload?: unknown;
      }>
    >(getEventsFilePath(dk));

    for (const e of events ?? []) {
      const tid = String(e.traceId ?? e.id ?? "").trim();
      if (!tid) continue;
      const created = typeof e.createdAt === "string" ? e.createdAt : "";
      let latest = created;
      for (const k of ["approvedAt", "executedAt", "rejectedAt", "failedAt"] as const) {
        const v = e[k];
        if (typeof v === "string" && v > latest) latest = v;
      }
      const iso = latest || created;
      if (!iso) continue;
      let summary = "";
      if (e.payload !== undefined && e.payload !== null) {
        try {
          summary = normalizeAction(e.payload).summary ?? "";
        } catch {
          summary = "";
        }
      }
      note(tid, iso, summary);
    }

    const actionRows = await readAllActionTimestamps(dk);
    for (const row of actionRows) {
      note(row.traceId, row.at);
    }
  }

  return [...map.entries()]
    .map(([traceId, v]) => ({
      traceId,
      lastActivityAt: v.lastActivityAt,
      summary: v.summary,
    }))
    .sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt))
    .slice(0, cap);
}
