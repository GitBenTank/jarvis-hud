import { NextResponse } from "next/server";

export const runtime = "nodejs";
import { promises as fs } from "node:fs";
import {
  getDateKey,
  getEventsFilePath,
  getActionsFilePath,
  readJson,
} from "@/lib/storage";
import { normalizeAction } from "@/lib/normalize";
import type { ActivityEvent } from "@/lib/activity-types";

type StoredEvent = {
  id: string;
  traceId?: string;
  type?: string;
  agent?: string;
  payload?: unknown;
  status?: string;
  createdAt?: string;
  executed?: boolean;
  executedAt?: string;
  approvedAt?: string;
  proposalStatus?: string;
};

type ActionLogEntry = {
  id: string;
  traceId?: string;
  at: string;
  kind: string;
  approvalId: string;
  status: string;
  summary?: string;
};

async function readActionLogChronological(dateKey: string): Promise<ActionLogEntry[]> {
  const filePath = getActionsFilePath(dateKey);
  try {
    const content = await fs.readFile(filePath, "utf-8");
    const lines = content
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    return lines.map((line) => JSON.parse(line) as ActionLogEntry);
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "ENOENT") {
      return [];
    }
    throw err;
  }
}

function toActivityEvents(
  events: StoredEvent[],
  actions: ActionLogEntry[]
): ActivityEvent[] {
  const out: ActivityEvent[] = [];

  for (const e of events) {
    const traceId = e.traceId ?? e.id;
    const agent = (e.agent ?? "openclaw") as string;

    out.push({
      traceId,
      timestamp: e.createdAt ?? new Date().toISOString(),
      actor: agent,
      type: "proposal_created",
      status: e.status ?? "pending",
      approvalId: e.id,
      kind: e.payload ? normalizeAction(e.payload).kind : undefined,
    });

    if (e.approvedAt) {
      out.push({
        traceId,
        timestamp: e.approvedAt,
        actor: "human",
        type: "proposal_approved",
        status: "approved",
        approvalId: e.id,
      });
    }

    if (e.executedAt) {
      out.push({
        traceId,
        timestamp: e.executedAt,
        actor: "jarvis",
        type: "execution_completed",
        status: "success",
        approvalId: e.id,
        kind: e.payload ? normalizeAction(e.payload).kind : undefined,
      });
    }
  }

  for (const a of actions) {
    const traceId = a.traceId ?? "";
    if (!traceId) continue;

    out.push({
      traceId,
      timestamp: a.at,
      actor: "jarvis",
      type: "receipt_created",
      status: a.status,
      approvalId: a.approvalId,
      kind: a.kind,
    });
  }

  return out;
}

export async function GET() {
  try {
    const dateKey = getDateKey();
    const events = (await readJson<StoredEvent[]>(getEventsFilePath(dateKey))) ?? [];
    const actions = await readActionLogChronological(dateKey);

    const activityEvents = toActivityEvents(events, actions);
    activityEvents.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    return NextResponse.json(activityEvents);
  } catch (err) {
    console.error("[activity/stream]", (err as Error)?.message);
    return NextResponse.json(
      { error: "Failed to load activity stream" },
      { status: 500 }
    );
  }
}
