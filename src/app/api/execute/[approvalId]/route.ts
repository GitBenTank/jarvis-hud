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
import { writeYoutubePackage, validateYoutubePackage } from "@/lib/youtube-package";
import { writeReflection } from "@/lib/reflection";
import { writeSystemNote } from "@/lib/system-note";
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

    if (
      normalized.kind !== "content.publish" &&
      normalized.kind !== "reflection.note" &&
      normalized.kind !== "system.note"
    ) {
      return NextResponse.json(
        {
          error: "Only content.publish, reflection.note, and system.note actions can be executed",
        },
        { status: 400 }
      );
    }

    const executedAt = new Date().toISOString();
    const actionStatus = "executed";
    const channel = normalized.channel ?? "unknown";

    let artifactPath: string | null = null;
    let outputPath: string | null = null;
    let executionKind = "content.publish";
    let readyForUpload: boolean | undefined;
    let videoFilePath: string | null | undefined;

    if (normalized.kind === "system.note") {
      outputPath = await writeSystemNote({
        approvalId,
        dateKey,
        title: normalized.title ?? "(untitled)",
        note: normalized.note ?? "",
        tags: normalized.tags,
        createdAt: executedAt,
      });
      executionKind = "system.note";
      await appendActionLog({
        id: crypto.randomUUID(),
        at: executedAt,
        kind: "system.note",
        approvalId,
        status: actionStatus,
        summary: normalized.summary,
        payload: event.payload,
        outputPath,
      });
    } else if (normalized.kind === "reflection.note") {
      const p = event.payload as Record<string, unknown>;
      const sourceKind = String(p.sourceKind ?? "unknown");
      const sourceApprovalId = String(p.sourceApprovalId ?? "");
      const sourceOutputPath = String(p.sourceOutputPath ?? "");
      outputPath = await writeReflection({
        reflectionId: approvalId,
        dateKey,
        sourceKind,
        sourceApprovalId,
        sourceOutputPath,
        createdAt: executedAt,
      });
      executionKind = "reflection.note";
      await appendActionLog({
        id: crypto.randomUUID(),
        at: executedAt,
        kind: "reflection.note",
        approvalId,
        status: actionStatus,
        summary: normalized.summary,
        payload: event.payload,
        outputPath,
      });
    } else if (channel === "youtube") {
      const youtubePayload = (event.payload as Record<string, unknown>)?.youtube as Record<string, unknown> | undefined;
      const youtubeInput = {
        approvalId,
        dateKey,
        channel: "youtube",
        title: normalized.title,
        body: normalized.body,
        createdAt: executedAt,
        youtube: youtubePayload
          ? {
              videoFilePath: typeof youtubePayload.videoFilePath === "string" ? youtubePayload.videoFilePath : undefined,
              tags: typeof youtubePayload.tags === "string" ? youtubePayload.tags : undefined,
              description: typeof youtubePayload.description === "string" ? youtubePayload.description : undefined,
            }
          : undefined,
      };
      const validation = validateYoutubePackage(youtubeInput);
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }
      const result = await writeYoutubePackage(youtubeInput);
      outputPath = result.outputPath;
      readyForUpload = result.readyForUpload;
      videoFilePath = result.videoFilePath;
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
        artifactPath,
      });
    }

    const updated: Event = {
      ...event,
      executed: true,
      executedAt,
    };
    events[index] = updated;
    await writeJson(filePath, events);

    const response: Record<string, unknown> = {
      ok: true,
      approvalId,
      executedAt,
      kind: executionKind,
      artifactPath,
      outputPath,
      dryRun: true,
      status: actionStatus,
    };
    if (executionKind === "youtube.package") {
      response.readyForUpload = readyForUpload;
      response.videoFilePath = videoFilePath ?? null;
    }
    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      { error: "Failed to execute" },
      { status: 500 }
    );
  }
}
