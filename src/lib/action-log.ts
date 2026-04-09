import { promises as fs } from "node:fs";
import path from "node:path";
import {
  ensurePathSafe,
  ensureDir,
  getDateKey,
  getActionsFilePath,
  getPublishQueueDir,
} from "./storage";
import type { ReasonDetail } from "./reason-taxonomy";
import type { ReceiptActors } from "./actor-identity";

/**
 * Action log entry — receipt metadata only.
 * Never log raw diffs, content bodies, or credentials in JSONL.
 * Richer payload lives in the bundle (manifest, patch.diff, etc.).
 */
export type ActionLogEntry = {
  id: string;
  traceId: string;
  at: string;
  kind: string;
  approvalId: string;
  status: string;
  summary: string;
  outputPath?: string;
  artifactPath?: string;
  /** Adapter-specific: code.apply */
  commitHash?: string | null;
  rollbackCommand?: string | null;
  noChangesApplied?: boolean;
  filesChanged?: string[];
  statsText?: string | null;
  statsJson?: { filesChangedCount: number; insertions: number; deletions: number } | null;
  repoHeadBefore?: string | null;
  repoHeadAfter?: string | null;
  reasonDetails?: ReasonDetail[];
  /** Proposer, approver, executor for this receipt (Phase 1 identity). */
  actors?: ReceiptActors;
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
    const lines = content
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
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

/**
 * Read action log entries filtered by traceId.
 * Returns entries in chronological order (oldest first).
 */
export async function readActionLogByTraceId(
  dateKey: string,
  traceId: string
): Promise<ActionLogEntry[]> {
  const filePath = getActionsFilePath(dateKey);
  ensurePathSafe(filePath);
  try {
    const content = await fs.readFile(filePath, "utf-8");
    const lines = content
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const entries = lines.map((line) => JSON.parse(line) as ActionLogEntry & { traceId?: string });
    return entries.filter((e) => e.traceId === traceId);
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
