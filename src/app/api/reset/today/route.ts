import { NextResponse } from "next/server";

export const runtime = "nodejs";
import { promises as fs } from "node:fs";
import path from "node:path";
import {
  ensurePathSafe,
  ensureDir,
  getDateKey,
  getArchiveDir,
  getEventsFilePath,
  getActionsFilePath,
  getPublishQueueDir,
} from "@/lib/storage";

export async function POST(request: Request) {
  const header = request.headers.get("x-jarvis-reset");
  if (header !== "YES") {
    return NextResponse.json(
      { error: "Missing or invalid x-jarvis-reset header" },
      { status: 403 }
    );
  }

  try {
    const dateKey = getDateKey();
    const archiveDir = getArchiveDir(dateKey);
    ensurePathSafe(archiveDir);
    await ensureDir(archiveDir);

    const archived: {
      archiveDir?: string;
      events?: string;
      actions?: string;
      publishQueueDir?: string;
    } = { archiveDir: archiveDir };

    const eventsPath = getEventsFilePath(dateKey);
    const eventsArchivePath = path.join(archiveDir, "events.json");
    try {
      await fs.rename(eventsPath, eventsArchivePath);
      archived.events = eventsArchivePath;
    } catch (err: unknown) {
      const code = err && typeof err === "object" && "code" in err ? err.code : null;
      if (code !== "ENOENT") throw err;
    }

    const actionsPath = getActionsFilePath(dateKey);
    const actionsArchivePath = path.join(archiveDir, "actions.jsonl");
    try {
      await fs.rename(actionsPath, actionsArchivePath);
      archived.actions = actionsArchivePath;
    } catch (err: unknown) {
      const code = err && typeof err === "object" && "code" in err ? err.code : null;
      if (code !== "ENOENT") throw err;
    }

    const publishQueuePath = getPublishQueueDir(dateKey);
    const publishQueueArchivePath = path.join(archiveDir, "publish-queue");
    try {
      const destExists = await fs.access(publishQueueArchivePath).then(() => true).catch(() => false);
      if (destExists) {
        await fs.rm(publishQueueArchivePath, { recursive: true });
      }
      await fs.rename(publishQueuePath, publishQueueArchivePath);
      archived.publishQueueDir = publishQueueArchivePath;
    } catch (err: unknown) {
      const code = err && typeof err === "object" && "code" in err ? err.code : null;
      if (code !== "ENOENT") throw err;
    }

    return NextResponse.json({ dateKey, archived });
  } catch {
    return NextResponse.json(
      { error: "Failed to archive" },
      { status: 500 }
    );
  }
}
