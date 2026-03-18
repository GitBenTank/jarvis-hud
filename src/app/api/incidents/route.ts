/**
 * Active incidents — recovery actions not yet verified.
 * Derived from action log + recovery-verifications.json.
 * No changes to existing recovery logic.
 */

import { NextResponse } from "next/server";

export const runtime = "nodejs";

import { readActionLog } from "@/lib/action-log";
import { readRecoveryVerifications } from "@/lib/recovery-verification";
import { readJson, getEventsFilePath } from "@/lib/storage";
import { isRecoveryClass } from "@/lib/recovery-shared";
import { normalizeAction } from "@/lib/normalize";

function toDateKey(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export type IncidentItem = {
  approvalId: string;
  traceId: string;
  recoveryClass: string;
  symptom: string;
  status: "pending" | "failed";
  at: string;
};

export type IncidentGroup = {
  recoveryClass: string;
  items: IncidentItem[];
};

export type IncidentsResponse = {
  incidents: IncidentGroup[];
};

export async function GET(): Promise<NextResponse<IncidentsResponse | { error: string }>> {
  try {
    const verifications = await readRecoveryVerifications();

    const allRecoveryActions: Array<Awaited<ReturnType<typeof readActionLog>>[number] & { dateKey: string }> = [];
    const dateKeys = Array.from({ length: 7 }, (_, i) => toDateKey(i));

    for (const dateKey of dateKeys) {
      const actions = await readActionLog(dateKey);
      for (const a of actions) {
        if (isRecoveryClass(a.kind)) {
          const vStatus = verifications[a.approvalId]?.status ?? "pending";
          if (vStatus !== "verified") {
            allRecoveryActions.push({ ...a, dateKey });
          }
        }
      }
    }

    const symptomByApprovalId = new Map<string, string>();
    const dateKeysNeeded = [...new Set(allRecoveryActions.map((a) => a.dateKey))];
    for (const dateKey of dateKeysNeeded) {
      const events = await readJson<Array<{ id: string; payload?: unknown }>>(getEventsFilePath(dateKey));
      if (events) {
        for (const e of events) {
          const n = normalizeAction(e.payload ?? {});
          const symptom = typeof (n as { symptom?: string }).symptom === "string"
            ? (n as { symptom: string }).symptom
            : "";
          symptomByApprovalId.set(e.id, symptom);
        }
      }
    }

    const items: IncidentItem[] = allRecoveryActions.map((a) => ({
      approvalId: a.approvalId,
      traceId: a.traceId ?? "",
      recoveryClass: a.kind,
      symptom: symptomByApprovalId.get(a.approvalId) ?? a.summary ?? "—",
      status: (verifications[a.approvalId]?.status === "failed" ? "failed" : "pending") as "pending" | "failed",
      at: a.at,
    }));

    const byClass = new Map<string, IncidentItem[]>();
    for (const item of items) {
      const list = byClass.get(item.recoveryClass) ?? [];
      list.push(item);
      byClass.set(item.recoveryClass, list);
    }

    const incidents: IncidentGroup[] = [...byClass.entries()].map(([recoveryClass, groupItems]) => ({
      recoveryClass,
      items: groupItems.sort((a, b) => b.at.localeCompare(a.at)),
    }));

    return NextResponse.json({ incidents });
  } catch (err) {
    console.error("[incidents]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load incidents" },
      { status: 500 }
    );
  }
}
