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

type DraftContentBody = {
  channel: string;
  title: string;
  body?: string;
  note?: string;
  tags?: string[];
  youtube?: { videoFilePath?: string; tags?: string };
  code?: {
    action?: "diff" | "apply";
    diffText?: string;
    files?: string[] | string;
    summary?: string;
  };
};

function isDraftContentBody(body: unknown): body is DraftContentBody {
  if (!body || typeof body !== "object") return false;
  const o = body as Record<string, unknown>;
  if (typeof o.channel !== "string" || typeof o.title !== "string") return false;
  if (o.channel === "system") {
    return typeof o.note === "string";
  }
  if (o.channel === "code") {
    return true;
  }
  return typeof o.body === "string";
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

    let payload: Record<string, unknown>;
    if (body.channel === "system") {
      payload = {
        kind: "system.note",
        title: body.title,
        note: body.note,
        tags: Array.isArray(body.tags) ? body.tags : undefined,
      };
    } else if (body.channel === "code") {
      const action = body.code?.action === "apply" ? "apply" : "diff";
      const diffText = typeof body.code?.diffText === "string" ? body.code.diffText : "";
      if (action === "apply" && !diffText.trim()) {
        return NextResponse.json(
          { error: "code.diffText is required for code.apply" },
          { status: 400 }
        );
      }
      const filesRaw = body.code?.files;
      const files: string[] = Array.isArray(filesRaw)
        ? filesRaw.filter((f): f is string => typeof f === "string")
        : typeof filesRaw === "string"
          ? filesRaw
              .split(/[\n,]+/)
              .map((s) => s.trim())
              .filter(Boolean)
          : [];
      payload = {
        kind: action === "apply" ? "code.apply" : "code.diff",
        title: body.title,
        code: {
          diffText: diffText || undefined,
          files: files.length > 0 ? files : undefined,
          summary: body.code?.summary,
        },
      };
    } else {
      payload = {
        kind: "content.publish",
        channel: body.channel,
        title: body.title,
        body: body.body ?? "",
        dryRun: true,
      };
      if (body.channel === "youtube" && body.youtube) {
        const yt: Record<string, string> = {};
        if (body.youtube.videoFilePath) yt.videoFilePath = body.youtube.videoFilePath;
        if (body.youtube.tags) yt.tags = body.youtube.tags;
        if (Object.keys(yt).length > 0) payload.youtube = yt;
      }
    }
    const event: Event = {
      id: crypto.randomUUID(),
      traceId: crypto.randomUUID(),
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
