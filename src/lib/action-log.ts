import { promises as fs } from "node:fs";
import path from "node:path";
import {
  ensurePathSafe,
  ensureDir,
  getDateKey,
  getActionsFilePath,
  getPublishQueueDir,
} from "./storage";

export type ActionLogEntry = {
  id: string;
  at: string;
  kind: string;
  approvalId: string;
  status: string;
  summary: string;
  payload: unknown;
  outputPath?: string;
};

export async function appendActionLog(entry: ActionLogEntry): Promise<void> {
  const dateKey = getDateKey();
  const filePath = getActionsFilePath(dateKey);
  ensurePathSafe(filePath);
  await ensureDir(path.dirname(filePath));
  const line = JSON.stringify(entry) + "\n";
  await fs.appendFile(filePath, line, "utf-8");
}

export async function readActionLog(dateKey?: string): Promise<ActionLogEntry[]> {
  const key = dateKey ?? getDateKey();
  const filePath = getActionsFilePath(key);
  ensurePathSafe(filePath);
  try {
    const content = await fs.readFile(filePath, "utf-8");
    const lines = content.trim().split("\n").filter(Boolean);
    const entries = lines.map((line) => JSON.parse(line) as ActionLogEntry);
    const reversed = [...entries].reverse();
    return reversed.slice(0, 100);
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && err.code === "ENOENT") {
      return [];
    }
    throw err;
  }
}

export function getPublishArtifactPath(dateKey: string, approvalId: string): string {
  const dir = getPublishQueueDir(dateKey);
  return path.join(dir, `${approvalId}.json`);
}

export async function writePublishArtifact(
  approvalId: string,
  data: { channel: string; title?: string; body?: string; dryRun?: boolean; createdAt: string }
): Promise<string> {
  const dateKey = getDateKey();
  const dir = getPublishQueueDir(dateKey);
  const filePath = path.join(dir, `${approvalId}.json`);
  ensurePathSafe(filePath);
  await ensureDir(dir);
  const payload = { ...data, dryRun: true };
  await fs.writeFile(filePath, JSON.stringify(payload, null, 2), "utf-8");
  return filePath;
}
