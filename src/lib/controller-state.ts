/**
 * Controller state — finds traces that need reconciliation.
 * Approved + executed + not yet verified.
 */

import { readJson, getEventsFilePath } from "./storage";
import { readActionLogByTraceId } from "./action-log";
import { readReconciliationByTraceId } from "./reconciliation-log";
import { normalizeAction } from "./normalize";

function toDateKey(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export type ReconciliationCandidate = {
  traceId: string;
  approvalId: string;
  dateKey: string;
  kind: "system.note";
  expected: { kind: string; title?: string; note?: string };
  observed: { artifactPath: string };
};

/**
 * Find approved, executed system.note traces that have no reconciliation entry.
 */
export async function findReconciliationCandidates(): Promise<ReconciliationCandidate[]> {
  const candidates: ReconciliationCandidate[] = [];
  const dateKeys = Array.from({ length: 7 }, (_, i) => toDateKey(i));

  for (const dateKey of dateKeys) {
    const events = await readJson<Array<{
      id: string;
      traceId?: string;
      status: string;
      executed?: boolean;
      payload: unknown;
    }>>(getEventsFilePath(dateKey));

    if (!events) continue;

    const systemNoteEvents = events.filter(
      (e) =>
        e.status === "approved" &&
        e.executed === true &&
        (e.traceId ?? e.id) &&
        normalizeAction(e.payload).kind === "system.note"
    );

    for (const event of systemNoteEvents) {
      const traceId = event.traceId ?? event.id;
      const existing = await readReconciliationByTraceId(dateKey, traceId);
      if (existing.length > 0) continue;

      const actions = await readActionLogByTraceId(dateKey, traceId);
      const receipt = actions.find(
        (a) => a.approvalId === event.id && a.kind === "system.note"
      );
      const artifactPath = receipt?.outputPath ?? receipt?.artifactPath;
      if (!artifactPath) continue;

      const normalized = normalizeAction(event.payload);
      candidates.push({
        traceId,
        approvalId: event.id,
        dateKey,
        kind: "system.note",
        expected: {
          kind: "system.note",
          title: normalized.title ?? "(untitled)",
          note: normalized.note ?? "",
        },
        observed: { artifactPath },
      });
    }
  }

  return candidates;
}
