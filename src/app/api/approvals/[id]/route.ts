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
  traceId?: string;
  type: "proposed_action" | "log" | "snapshot";
  agent: string;
  payload: unknown;
  requiresApproval?: boolean;
  status: "pending" | "approved" | "denied";
  createdAt: string;
  executed?: boolean;
  executedAt?: string;
};

type ApprovalBody = { action: "approve" | "deny" };

function isApprovalBody(body: unknown): body is ApprovalBody {
  if (!body || typeof body !== "object") return false;
  const o = body as Record<string, unknown>;
  return o.action === "approve" || o.action === "deny";
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const body = await request.json();
    if (!isApprovalBody(body)) {
      return NextResponse.json(
        { error: "Invalid body: action must be 'approve' or 'deny'" },
        { status: 400 }
      );
    }

    const dateKey = getDateKey();
    const filePath = getEventsFilePath(dateKey);
    const events = await readJson<Event[]>(filePath);

    if (!events) {
      return NextResponse.json(
        { error: "Events not found" },
        { status: 404 }
      );
    }

    const index = events.findIndex((e) => e.id === id);
    if (index === -1) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    const event = events[index];
    if (event.requiresApproval !== true) {
      return NextResponse.json(
        { error: "Event does not require approval" },
        { status: 400 }
      );
    }
    if (event.status !== "pending") {
      return NextResponse.json(
        { error: "Event is not pending approval" },
        { status: 400 }
      );
    }

    const newStatus = body.action === "approve" ? "approved" : "denied";
    const updated: Event = { ...event, status: newStatus };
    events[index] = updated;
    await writeJson(filePath, events);

    return NextResponse.json(updated);
  } catch (err: unknown) {
    if (err instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to process approval" },
      { status: 500 }
    );
  }
}
