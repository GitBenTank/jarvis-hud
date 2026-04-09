/**
 * Phase 3 — read-only audit export: bundle events, receipts, policy, reconciliation
 * for a calendar date range. No new persistence; uses existing disk layouts only.
 */

import { promises as fs } from "node:fs";
import {
  readJson,
  getEventsFilePath,
  getActionsFilePath,
  getPolicyDecisionsFilePath,
  getReconciliationFilePath,
  ensurePathSafe,
} from "./storage";

/** Inclusive range must not exceed this many calendar days (abuse / memory guard). */
export const AUDIT_EXPORT_MAX_RANGE_DAYS = 90;

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

export type AuditExportBundle = {
  range: { start: string; end: string };
  generatedAt: string;
  summary: {
    events: number;
    receipts: number;
    traces: number;
    policyDecisions: number;
    reconciliation: number;
  };
  events: unknown[];
  receipts: unknown[];
  policyDecisions: unknown[];
  reconciliation: unknown[];
  index: {
    traceIds: string[];
    approvalIds: string[];
  };
};

export type AuditExportValidationError = {
  ok: false;
  code: string;
  message: string;
  status: number;
};

export type AuditExportValidationOk = {
  ok: true;
  start: string;
  end: string;
  dateKeys: string[];
};

export function isValidDateKey(key: string): boolean {
  if (!DATE_KEY_RE.test(key)) return false;
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

/** Next calendar day as YYYY-MM-DD (UTC). */
export function nextDateKey(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + 1);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function validateAuditDateRange(
  start: string | null,
  end: string | null
): AuditExportValidationOk | AuditExportValidationError {
  if (!start?.trim() || !end?.trim()) {
    return {
      ok: false,
      code: "missing_params",
      message: "Query params 'start' and 'end' are required (YYYY-MM-DD)",
      status: 400,
    };
  }
  const s = start.trim();
  const e = end.trim();
  if (!isValidDateKey(s)) {
    return {
      ok: false,
      code: "invalid_start_date",
      message: "Invalid start date; use YYYY-MM-DD",
      status: 400,
    };
  }
  if (!isValidDateKey(e)) {
    return {
      ok: false,
      code: "invalid_end_date",
      message: "Invalid end date; use YYYY-MM-DD",
      status: 400,
    };
  }
  if (s > e) {
    return {
      ok: false,
      code: "inverted_range",
      message: "start must be on or before end",
      status: 400,
    };
  }

  const dateKeys: string[] = [];
  let cur = s;
  while (true) {
    dateKeys.push(cur);
    if (dateKeys.length > AUDIT_EXPORT_MAX_RANGE_DAYS) {
      return {
        ok: false,
        code: "range_too_large",
        message: `Date range must be at most ${AUDIT_EXPORT_MAX_RANGE_DAYS} days`,
        status: 400,
      };
    }
    if (cur === e) break;
    cur = nextDateKey(cur);
    if (cur > e) break;
  }

  return { ok: true, start: s, end: e, dateKeys };
}

async function readJsonlFile(filePath: string): Promise<unknown[]> {
  ensurePathSafe(filePath);
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return content
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line) as unknown);
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && err.code === "ENOENT") {
      return [];
    }
    throw err;
  }
}

function traceIdFromEvent(ev: Record<string, unknown>): string | undefined {
  const tid = ev.traceId;
  if (typeof tid === "string" && tid.trim()) return tid.trim();
  const id = ev.id;
  if (typeof id === "string" && id.trim()) return id.trim();
  return undefined;
}

function collectIndex(
  events: unknown[],
  receipts: unknown[],
  policyDecisions: unknown[],
  reconciliation: unknown[]
): { traceIds: string[]; approvalIds: string[] } {
  const traceSet = new Set<string>();
  const approvalSet = new Set<string>();

  for (const row of events) {
    if (!row || typeof row !== "object") continue;
    const o = row as Record<string, unknown>;
    const t = traceIdFromEvent(o);
    if (t) traceSet.add(t);
    if (typeof o.id === "string" && o.id.trim()) approvalSet.add(o.id.trim());
  }

  for (const row of receipts) {
    if (!row || typeof row !== "object") continue;
    const o = row as Record<string, unknown>;
    if (typeof o.traceId === "string" && o.traceId.trim()) traceSet.add(o.traceId.trim());
    if (typeof o.approvalId === "string" && o.approvalId.trim())
      approvalSet.add(o.approvalId.trim());
  }

  for (const row of policyDecisions) {
    if (!row || typeof row !== "object") continue;
    const o = row as Record<string, unknown>;
    if (typeof o.traceId === "string" && o.traceId.trim()) traceSet.add(o.traceId.trim());
  }

  for (const row of reconciliation) {
    if (!row || typeof row !== "object") continue;
    const o = row as Record<string, unknown>;
    if (typeof o.traceId === "string" && o.traceId.trim()) traceSet.add(o.traceId.trim());
  }

  return {
    traceIds: [...traceSet].sort(),
    approvalIds: [...approvalSet].sort(),
  };
}

/**
 * Build export bundle for inclusive date range [start, end].
 * Rows are stored records as-is (including optional actor fields).
 */
export async function buildAuditExportBundle(
  validated: AuditExportValidationOk
): Promise<AuditExportBundle> {
  const { start, end, dateKeys } = validated;

  const events: unknown[] = [];
  const receipts: unknown[] = [];
  const policyDecisions: unknown[] = [];
  const reconciliation: unknown[] = [];

  for (const dateKey of dateKeys) {
    const evs = await readJson<unknown[]>(getEventsFilePath(dateKey));
    if (Array.isArray(evs)) {
      for (const item of evs) events.push(item);
    }

    receipts.push(...(await readJsonlFile(getActionsFilePath(dateKey))));
    policyDecisions.push(
      ...(await readJsonlFile(getPolicyDecisionsFilePath(dateKey)))
    );
    reconciliation.push(
      ...(await readJsonlFile(getReconciliationFilePath(dateKey)))
    );
  }

  const index = collectIndex(events, receipts, policyDecisions, reconciliation);

  return {
    range: { start, end },
    generatedAt: new Date().toISOString(),
    summary: {
      events: events.length,
      receipts: receipts.length,
      traces: index.traceIds.length,
      policyDecisions: policyDecisions.length,
      reconciliation: reconciliation.length,
    },
    events,
    receipts,
    policyDecisions,
    reconciliation,
    index,
  };
}
