import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import {
  getDateKey,
  getEventsFilePath,
  readJson,
  writeJson,
} from "@/lib/storage";
import { agentActorFromAgentField } from "@/lib/actor-identity";

type Event = {
  id: string;
  traceId: string;
  type: "proposed_action" | "log" | "snapshot";
  agent: string;
  payload: unknown;
  requiresApproval?: boolean;
  status: "pending" | "approved" | "denied";
  createdAt: string;
  actorId: string;
  actorType: "human" | "agent";
  actorLabel?: string;
};

type EventInput = {
  type: "proposed_action" | "log" | "snapshot";
  agent: string;
  payload: unknown;
  requiresApproval?: boolean;
};

function isEventInput(body: unknown): body is EventInput {
  if (!body || typeof body !== "object") return false;
  const o = body as Record<string, unknown>;
  return (
    (o.type === "proposed_action" || o.type === "log" || o.type === "snapshot") &&
    typeof o.agent === "string" &&
    o.payload !== undefined
  );
}

export async function GET() {
  try {
    const dateKey = getDateKey();
    const filePath = getEventsFilePath(dateKey);
    const events = await readJson<Event[]>(filePath);
    return NextResponse.json(events ?? []);
  } catch {
    return NextResponse.json(
      { error: "Failed to read events" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!isEventInput(body)) {
      return NextResponse.json(
        { error: "Invalid body: type, agent, and payload are required" },
        { status: 400 }
      );
    }

    const status =
      body.requiresApproval === true ? "pending" : "approved";

    const proposer = agentActorFromAgentField(body.agent);
    const event: Event = {
      id: crypto.randomUUID(),
      traceId: crypto.randomUUID(),
      type: body.type,
      agent: body.agent,
      payload: body.payload,
      requiresApproval: body.requiresApproval,
      status,
      createdAt: new Date().toISOString(),
      actorId: proposer.actorId,
      actorType: proposer.actorType,
      actorLabel: proposer.actorLabel,
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
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}
