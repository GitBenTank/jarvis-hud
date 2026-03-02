import { NextRequest, NextResponse } from "next/server";
import {
  getDateKey,
  getEventsFilePath,
  readJson,
  writeJson,
} from "@/lib/storage";
import {
  isAuthEnabled,
  getSessionFromCookie,
  isStepUpValid,
} from "@/lib/auth";
import {
  appendActionLog,
  writePublishArtifact,
} from "@/lib/action-log";
import { writeYoutubePackage, validateYoutubePackage } from "@/lib/youtube-package";
import { writeReflection } from "@/lib/reflection";
import { writeSystemNote } from "@/lib/system-note";
import { writeCodeDiffBundle } from "@/lib/code-diff";
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
  request: NextRequest,
  { params }: { params: Promise<{ approvalId: string }> }
) {
  try {
    if (isAuthEnabled()) {
      const cookie = request.headers.get("cookie");
      const session = getSessionFromCookie(cookie);
      if (!session) {
        return NextResponse.json(
          { error: "Session required" },
          { status: 401 }
        );
      }
      if (!isStepUpValid(session)) {
        return NextResponse.json(
          { error: "Step-up required to execute", code: "STEP_UP_REQUIRED" },
          { status: 403 }
        );
      }
    }

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
      normalized.kind !== "system.note" &&
      normalized.kind !== "code.diff"
    ) {
      return NextResponse.json(
        {
          error:
            "Only content.publish, reflection.note, system.note, and code.diff actions can be executed",
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
    let tagsCount: number | undefined;

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
    } else if (normalized.kind === "code.diff") {
      const p = event.payload as Record<string, unknown>;
      const codePayload = p?.code as Record<string, unknown> | undefined;
      outputPath = await writeCodeDiffBundle({
        approvalId,
        dateKey,
        title: normalized.title ?? "(untitled)",
        createdAt: executedAt,
        code: codePayload
          ? {
              baseRef:
                typeof codePayload.baseRef === "string"
                  ? codePayload.baseRef
                  : undefined,
              targetRef:
                typeof codePayload.targetRef === "string"
                  ? codePayload.targetRef
                  : undefined,
              diffText:
                typeof codePayload.diffText === "string"
                  ? codePayload.diffText
                  : undefined,
              files: Array.isArray(codePayload.files)
                ? codePayload.files.filter(
                    (f): f is string => typeof f === "string"
                  )
                : undefined,
              summary:
                typeof codePayload.summary === "string"
                  ? codePayload.summary
                  : undefined,
            }
          : undefined,
      });
      executionKind = "code.diff";
      await appendActionLog({
        id: crypto.randomUUID(),
        at: executedAt,
        kind: "code.diff",
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
        return NextResponse.json(
          { error: validation.error, reasons: validation.reasons ?? [validation.error] },
          { status: 400 }
        );
      }
      const result = await writeYoutubePackage(youtubeInput);
      outputPath = result.outputPath;
      readyForUpload = result.readyForUpload;
      videoFilePath = result.videoFilePath;
      tagsCount = result.tagsCount;
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
      response.tagsCount = tagsCount;
    }
    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      { error: "Failed to execute" },
      { status: 500 }
    );
  }
}
