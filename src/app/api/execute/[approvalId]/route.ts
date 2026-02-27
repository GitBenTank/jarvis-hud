import { NextResponse } from "next/server";
import {
  getDateKey,
  getEventsFilePath,
  readJson,
  writeJson,
} from "@/lib/storage";
import {
  appendActionLog,
  writePublishArtifact,
} from "@/lib/action-log";
import { writeYoutubePackage } from "@/lib/youtube-package";
import { normalizeAction } from "@/lib/normalize";

type Event = {
  id: string;
  type: "proposed_action" | "log" | "snapshot";
  agent: string;
  payload: unknown;
  requiresApproval?: boolean;
  status: "pending" | "approved" | "denied";
  createdAt: string;
  executed?: boolean;
  executedAt?: string;
};

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ approvalId: string }> }
) {
  try {
    const { approvalId } = await params;

    const dateKey = getDateKey();
    const filePath = getEventsFilePath(dateKey);
    const events = await readJson<Event[]>(filePath);

    if (!events) {
      return NextResponse.json(
        { error: "Events not found" },
        { status: 404 }
      );
    }

    const index = events.findIndex((e) => e.id === approvalId);
    if (index === -1) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    const event = events[index];
    if (event.status !== "approved") {
      return NextResponse.json(
        { error: "Event is not approved" },
        { status: 400 }
      );
    }

    if (event.executed === true) {
      return NextResponse.json(
        { error: "Already executed" },
        { status: 409 }
      );
    }

    const normalized = normalizeAction(event.payload);

    if (normalized.kind !== "content.publish") {
      return NextResponse.json(
        { error: "Only content.publish actions can be executed" },
        { status: 400 }
      );
    }

    const executedAt = new Date().toISOString();
    const actionStatus = "executed";
    const channel = normalized.channel ?? "unknown";

    let artifactPath: string | null = null;
    let outputPath: string | null = null;
    let executionKind = "content.publish";

    if (channel === "youtube") {
      outputPath = await writeYoutubePackage({
        approvalId,
        dateKey,
        channel: "youtube",
        title: normalized.title,
        body: normalized.body,
        createdAt: executedAt,
        youtube: (event.payload as Record<string, unknown>)?.youtube as Record<string, string> | undefined,
      });
      executionKind = "youtube.package";
      await appendActionLog({
        id: crypto.randomUUID(),
        at: executedAt,
        kind: "youtube.package",
        approvalId,
        status: actionStatus,
        summary: normalized.summary,
        payload: event.payload,
        outputPath,
      });
    } else {
      artifactPath = await writePublishArtifact(approvalId, {
        channel,
        title: normalized.title,
        body: normalized.body,
        dryRun: true,
        createdAt: executedAt,
      });
      await appendActionLog({
        id: crypto.randomUUID(),
        at: executedAt,
        kind: "content.publish",
        approvalId,
        status: "written",
        summary: normalized.summary,
        payload: event.payload,
      });
    }

    const updated: Event = {
      ...event,
      executed: true,
      executedAt,
    };
    events[index] = updated;
    await writeJson(filePath, events);

    return NextResponse.json({
      ok: true,
      approvalId,
      executedAt,
      kind: executionKind,
      artifactPath,
      outputPath,
      dryRun: true,
      status: actionStatus,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to execute" },
      { status: 500 }
    );
  }
}
