import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
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
  AuthConfigError,
} from "@/lib/auth";
import {
  appendActionLog,
  writePublishArtifact,
} from "@/lib/action-log";
import { writeYoutubePackage, validateYoutubePackage } from "@/lib/youtube-package";
import { writeReflection } from "@/lib/reflection";
import { writeSystemNote } from "@/lib/system-note";
import { writeCodeDiffBundle } from "@/lib/code-diff";
import {
  writeCodeApplyBundle,
  CodeApplyError,
  getCodeApplyBlockReasons,
} from "@/lib/code-apply";
import { normalizeAction } from "@/lib/normalize";
import { evaluateExecutePolicy } from "@/lib/policy";

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ approvalId: string }> }
) {
  try {
    let authEnabled = false;
    let stepUpValid = true;
    try {
      authEnabled = isAuthEnabled();
    } catch (authErr) {
      if (authErr instanceof AuthConfigError) {
        return NextResponse.json(
          { error: authErr.message },
          { status: 500 }
        );
      }
      throw authErr;
    }
    if (authEnabled) {
      const cookie = request.headers.get("cookie");
      const session = getSessionFromCookie(cookie);
      if (!session) {
        return NextResponse.json(
          { error: "Session required" },
          { status: 401 }
        );
      }
      stepUpValid = isStepUpValid(session);
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

    if (event.requiresApproval !== true) {
      return NextResponse.json(
        { error: "Event did not require approval; execution blocked" },
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
    const codeApplyBlockReasons =
      normalized.kind === "code.apply" ? getCodeApplyBlockReasons() : undefined;
    const policyResult = evaluateExecutePolicy({
      kind: normalized.kind,
      authEnabled,
      stepUpValid,
      codeApplyBlockReasons,
    });
    if (!policyResult.ok) {
      return NextResponse.json(
        {
          error: policyResult.reasons[0] ?? "Execution blocked by policy",
          reasons: policyResult.reasons,
        },
        { status: policyResult.status }
      );
    }

    const executedAt = new Date().toISOString();
    const actionStatus = "executed";
    const traceId = event.traceId ?? event.id;
    const channel = normalized.channel ?? "unknown";

    let artifactPath: string | null = null;
    let outputPath: string | null = null;
    let executionKind = "content.publish";
    let readyForUpload: boolean | undefined;
    let videoFilePath: string | null | undefined;
    let tagsCount: number | undefined;
    let codeApplyCommitHash: string | null = null;
    let codeApplyRollbackCommand: string | null = null;
    let codeApplyNoChangesApplied = false;
    let codeApplyFilesChanged: string[] = [];
    let codeApplyStatsText: string | null = null;
    let codeApplyStatsJson: { filesChangedCount: number; insertions: number; deletions: number } | null = null;
    let codeApplyRepoHeadBefore: string | null = null;
    let codeApplyRepoHeadAfter: string | null = null;

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
        traceId,
        at: executedAt,
        kind: "system.note",
        approvalId,
        status: actionStatus,
        summary: normalized.summary,
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
        traceId,
        at: executedAt,
        kind: "reflection.note",
        approvalId,
        status: actionStatus,
        summary: normalized.summary,
        outputPath,
      });
    } else if (normalized.kind === "code.apply") {
      const p = event.payload as Record<string, unknown>;
      const codePayload = p?.code as Record<string, unknown> | undefined;
      const diffText = typeof codePayload?.diffText === "string" ? codePayload.diffText : "";
      if (!diffText.trim()) {
        return NextResponse.json(
          { error: "code.diffText is required for code.apply" },
          { status: 400 }
        );
      }
      const result = await writeCodeApplyBundle({
        approvalId,
        traceId,
        dateKey,
        title: normalized.title ?? "(untitled)",
        createdAt: executedAt,
        code: {
          diffText: diffText.trim(),
          files: Array.isArray(codePayload?.files)
            ? codePayload.files.filter((f): f is string => typeof f === "string")
            : undefined,
          summary:
            typeof codePayload?.summary === "string" ? codePayload.summary : undefined,
        },
      });
      outputPath = result.outputPath;
      executionKind = "code.apply";
      codeApplyCommitHash = result.commitHash;
      codeApplyRollbackCommand = result.rollbackCommand;
      codeApplyNoChangesApplied = result.noChangesApplied;
      codeApplyFilesChanged = result.filesChanged;
      codeApplyStatsText = result.statsText;
      codeApplyStatsJson = result.statsJson;
      codeApplyRepoHeadBefore = result.repoHeadBefore;
      codeApplyRepoHeadAfter = result.repoHeadAfter;
      await appendActionLog({
        id: crypto.randomUUID(),
        traceId,
        at: executedAt,
        kind: "code.apply",
        approvalId,
        status: actionStatus,
        summary: normalized.summary,
        outputPath,
        commitHash: result.commitHash,
        rollbackCommand: result.rollbackCommand,
        noChangesApplied: result.noChangesApplied,
        filesChanged: result.filesChanged,
        statsText: result.statsText,
        statsJson: result.statsJson,
        repoHeadBefore: result.repoHeadBefore,
        repoHeadAfter: result.repoHeadAfter,
      });
    } else if (normalized.kind === "code.diff") {
      const p = event.payload as Record<string, unknown>;
      const codePayload = p?.code as Record<string, unknown> | undefined;
      outputPath = await writeCodeDiffBundle({
        approvalId,
        traceId,
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
        traceId,
        at: executedAt,
        kind: "code.diff",
        approvalId,
        status: actionStatus,
        summary: normalized.summary,
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
        traceId,
        at: executedAt,
        kind: "youtube.package",
        approvalId,
        status: actionStatus,
        summary: normalized.summary,
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
        traceId,
        at: executedAt,
        kind: "content.publish",
        approvalId,
        status: "written",
        summary: normalized.summary,
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
      dryRun: executionKind !== "code.apply",
      status: actionStatus,
    };
    if (executionKind === "code.apply") {
      response.commitHash = codeApplyCommitHash;
      response.rollbackCommand = codeApplyRollbackCommand;
      response.noChangesApplied = codeApplyNoChangesApplied;
      response.filesChanged = codeApplyFilesChanged;
      response.statsText = codeApplyStatsText;
      response.statsJson = codeApplyStatsJson;
      response.repoHeadBefore = codeApplyRepoHeadBefore;
      response.repoHeadAfter = codeApplyRepoHeadAfter;
    }
    if (executionKind === "youtube.package") {
      response.readyForUpload = readyForUpload;
      response.videoFilePath = videoFilePath ?? null;
      response.tagsCount = tagsCount;
    }
    return NextResponse.json(response);
  } catch (err) {
    if (err instanceof CodeApplyError && err.code === "DIRTY_WORKTREE") {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    return NextResponse.json(
      { error: "Failed to execute" },
      { status: 500 }
    );
  }
}
