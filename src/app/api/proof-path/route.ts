import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import {
  readJson,
  getDateKey,
  getEventsFilePath,
  getPublishQueueDir,
  getArchiveDir,
} from "@/lib/storage";
import { readActionLog } from "@/lib/action-log";
import { normalizeAction } from "@/lib/normalize";

type Event = {
  id: string;
  payload: unknown;
  status: string;
  requiresApproval?: boolean;
  executed?: boolean;
};

async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function dirFileCount(dirPath: string): Promise<number> {
  try {
    const entries = await fs.readdir(dirPath);
    return entries.length;
  } catch {
    return 0;
  }
}

export async function GET() {
  try {
    const dateKey = getDateKey();
    const events = (await readJson<Event[]>(getEventsFilePath(dateKey))) ?? [];

    const publishContentEvents = events.filter((e) => {
      const n = normalizeAction(e.payload);
      return n.kind === "content.publish" && e.requiresApproval;
    });
    const pendingPublish = publishContentEvents.filter((e) => e.status === "pending");
    const approvedNotExecuted = publishContentEvents.filter(
      (e) => e.status === "approved" && !e.executed
    );
    const executedPublish = events.filter(
      (e) => e.executed && normalizeAction(e.payload).kind === "content.publish"
    );

    const actions = await readActionLog();
    const hasExecutedAction = actions.some((a) => a.kind === "content.publish");

    const publishQueueDir = getPublishQueueDir(dateKey);
    const artifactCount = await dirFileCount(publishQueueDir);

    const archiveDir = getArchiveDir(dateKey);
    const archived = await pathExists(archiveDir);

    const pendingIds = pendingPublish.map((e) => e.id).slice(0, 3);
    const approvedIds = approvedNotExecuted.map((e) => e.id).slice(0, 3);
    const executedIds = executedPublish.map((e) => e.id).slice(0, 3);

    const steps = {
      draftCreated: pendingPublish.length > 0,
      approved: approvedNotExecuted.length > 0,
      executed: executedPublish.length > 0 || hasExecutedAction,
      artifactExists: artifactCount > 0,
      archived,
    };

    function getHint(step: keyof typeof steps): string {
      if (steps[step]) return "PASS";
      switch (step) {
        case "draftCreated":
          return "Click “Demo: Seed Example Draft” then “Create approval”.";
        case "approved":
          return "Click “Details” on a pending item, then “Approve”.";
        case "executed":
          return "Click “Details / Execute (dry run)” then “Execute (dry run)”.";
        case "artifactExists":
          return "Execute creates artifact in publish-queue.";
        case "archived":
          return "Click “Reset today (archive)” to archive demo data.";
        default:
          return "";
      }
    }

    const hints = {
      draftCreated: getHint("draftCreated"),
      approved: getHint("approved"),
      executed: getHint("executed"),
      artifactExists: getHint("artifactExists"),
      archived: getHint("archived"),
    };

    return NextResponse.json({
      dateKey,
      steps,
      hints,
      pendingIds,
      approvedIds,
      executedIds,
      actionsCount: actions.length,
      publishQueueCount: artifactCount,
      archivePath: archived ? archiveDir : null,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to compute proof path" },
      { status: 500 }
    );
  }
}
