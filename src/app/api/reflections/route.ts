import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import {
  getDateKey,
  getEventsFilePath,
  readJson,
  writeJson,
} from "@/lib/storage";

type Event = {
  id: string;
  traceId: string;
  type: "proposed_action" | "log" | "snapshot";
  agent: string;
  payload: unknown;
  requiresApproval?: boolean;
  status: "pending" | "approved" | "denied";
  createdAt: string;
};

type ReflectionBody = {
  sourceKind: string;
  sourceApprovalId: string;
  sourceOutputPath: string;
};

function isReflectionBody(body: unknown): body is ReflectionBody {
  if (!body || typeof body !== "object") return false;
  const o = body as Record<string, unknown>;
  return (
    typeof o.sourceKind === "string" &&
    typeof o.sourceApprovalId === "string" &&
    typeof o.sourceOutputPath === "string"
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!isReflectionBody(body)) {
      return NextResponse.json(
        { error: "Invalid body: sourceKind, sourceApprovalId, sourceOutputPath required" },
        { status: 400 }
      );
    }

    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    const event: Event = {
      id,
      traceId: crypto.randomUUID(),
      type: "proposed_action",
      agent: "reflection-ui",
      payload: {
        kind: "reflection.note",
        status: "pending",
        createdAt,
        sourceKind: body.sourceKind,
        sourceApprovalId: body.sourceApprovalId,
        sourceOutputPath: body.sourceOutputPath,
      },
      requiresApproval: true,
      status: "pending",
      createdAt,
    };

    const dateKey = getDateKey();
    const filePath = getEventsFilePath(dateKey);
    const existing = await readJson<Event[]>(filePath);
    const events = [...(existing ?? []), event];
    await writeJson(filePath, events);

    return NextResponse.json(event, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create reflection proposal" },
      { status: 500 }
    );
  }
}
