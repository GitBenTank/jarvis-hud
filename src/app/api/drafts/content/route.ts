import { NextRequest, NextResponse } from "next/server";
import {
  getDateKey,
  getEventsFilePath,
  readJson,
  writeJson,
} from "@/lib/storage";

type Event = {
  id: string;
  type: "proposed_action" | "log" | "snapshot";
  agent: string;
  payload: unknown;
  requiresApproval?: boolean;
  status: "pending" | "approved" | "denied";
  createdAt: string;
};

type DraftContentBody = {
  channel: string;
  title: string;
  body: string;
  youtube?: { videoFilePath?: string };
};

function isDraftContentBody(body: unknown): body is DraftContentBody {
  if (!body || typeof body !== "object") return false;
  const o = body as Record<string, unknown>;
  return (
    typeof o.channel === "string" &&
    typeof o.title === "string" &&
    typeof o.body === "string"
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!isDraftContentBody(body)) {
      return NextResponse.json(
        { error: "Invalid body: channel, title, and body are required" },
        { status: 400 }
      );
    }

    const payload: Record<string, unknown> = {
      kind: "content.publish",
      channel: body.channel,
      title: body.title,
      body: body.body,
      dryRun: true,
    };
    if (body.channel === "youtube" && body.youtube?.videoFilePath) {
      payload.youtube = { videoFilePath: body.youtube.videoFilePath };
    }
    const event: Event = {
      id: crypto.randomUUID(),
      type: "proposed_action",
      agent: "drafts-ui",
      payload,
      requiresApproval: true,
      status: "pending",
      createdAt: new Date().toISOString(),
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
      { error: "Failed to create draft" },
      { status: 500 }
    );
  }
}
