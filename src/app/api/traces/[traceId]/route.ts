import { NextResponse } from "next/server";

export const runtime = "nodejs";
import { readJson, getEventsFilePath, getDateKey } from "@/lib/storage";
import { readActionLogByTraceId, type ActionLogEntry } from "@/lib/action-log";
import { normalizeAction } from "@/lib/normalize";

type StoredEvent = {
  id: string;
  traceId?: string;
  type: string;
  agent: string;
  payload: unknown;
  requiresApproval?: boolean;
  status: string;
  createdAt: string;
  executed?: boolean;
  executedAt?: string;
  source?: { connector: string; verified?: boolean };
};

function toDateKey(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ traceId: string }> }
) {
  const { traceId } = await params;
  if (!traceId || typeof traceId !== "string" || !traceId.trim()) {
    return NextResponse.json(
      { error: "traceId is required" },
      { status: 400 }
    );
  }

  const tid = traceId.trim();
  const dateKeys = Array.from({ length: 7 }, (_, i) => toDateKey(i));

  let foundDateKey: string | null = null;
  const matchedEvents: StoredEvent[] = [];
  const matchedActions: ActionLogEntry[] = [];

  for (const dateKey of dateKeys) {
    const events = await readJson<StoredEvent[]>(getEventsFilePath(dateKey));
    const eventMatches =
      events?.filter(
        (e) => (e.traceId ?? e.id) === tid
      ) ?? [];

    const actions = await readActionLogByTraceId(dateKey, tid);

    if (eventMatches.length > 0 || actions.length > 0) {
      if (!foundDateKey) foundDateKey = dateKey;
      matchedEvents.push(...eventMatches);
      matchedActions.push(...actions);
    }
  }

  if (matchedEvents.length === 0 && matchedActions.length === 0) {
    return NextResponse.json(
      { error: "Trace not found", traceId: tid },
      { status: 404 }
    );
  }

  const events = matchedEvents.map((e) => {
    const normalized = normalizeAction(e.payload);
    return {
      id: e.id,
      traceId: e.traceId ?? e.id,
      kind: normalized.kind,
      status: e.status,
      createdAt: e.createdAt,
      executedAt: e.executedAt ?? undefined,
      summary: normalized.summary,
      title: normalized.title,
      source: e.source ?? undefined,
    };
  });

  const artifactPaths = Array.from(
    new Set(
      matchedActions.flatMap((a) => {
        const paths: string[] = [];
        if (a.outputPath) paths.push(a.outputPath);
        if (a.artifactPath) paths.push(a.artifactPath);
        return paths;
      })
    )
  );

  return NextResponse.json({
    traceId: tid,
    dateKey: foundDateKey ?? getDateKey(),
    events,
    actions: matchedActions,
    artifactPaths,
  });
}
