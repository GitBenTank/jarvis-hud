/**
 * Append-only disk storage for approval-time preflight snapshots.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import {
  ensurePathSafe,
  ensureDir,
  getApprovalPreflightSnapshotPath,
} from "@/lib/storage";
import { listTraceScanDateKeys } from "@/lib/trace-scan";
import type { ApprovalPreflightSnapshotRecord } from "@/lib/approval-preflight-snapshot-shared";

export async function appendApprovalPreflightSnapshot(
  dateKey: string,
  record: ApprovalPreflightSnapshotRecord
): Promise<void> {
  const filePath = getApprovalPreflightSnapshotPath(dateKey);
  ensurePathSafe(filePath);
  await ensureDir(path.dirname(filePath));
  const line = JSON.stringify(record) + "\n";
  await fs.appendFile(filePath, line, "utf-8");
}

async function readSnapshotsInFile(
  filePath: string
): Promise<ApprovalPreflightSnapshotRecord[]> {
  ensurePathSafe(filePath);
  try {
    const content = await fs.readFile(filePath, "utf-8");
    const out: ApprovalPreflightSnapshotRecord[] = [];
    for (const line of content.split("\n")) {
      const t = line.trim();
      if (!t) continue;
      try {
        out.push(JSON.parse(t) as ApprovalPreflightSnapshotRecord);
      } catch {
        // skip corrupt line
      }
    }
    return out;
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && err.code === "ENOENT") {
      return [];
    }
    throw err;
  }
}

/** Latest snapshot for approvalId in a single date file (last matching line wins). */
export async function readApprovalPreflightSnapshotInDateKey(
  dateKey: string,
  approvalId: string
): Promise<ApprovalPreflightSnapshotRecord | null> {
  const filePath = getApprovalPreflightSnapshotPath(dateKey);
  const rows = await readSnapshotsInFile(filePath);
  const matches = rows.filter((r) => r.approvalId === approvalId);
  if (matches.length === 0) return null;
  return matches.at(-1) ?? null;
}

/**
 * Find persisted snapshot for an approval, preferring a known event date (trace scan hit).
 */
export async function findApprovalPreflightSnapshot(
  approvalId: string,
  preferDateKey?: string | null
): Promise<ApprovalPreflightSnapshotRecord | null> {
  if (preferDateKey) {
    const hit = await readApprovalPreflightSnapshotInDateKey(preferDateKey, approvalId);
    if (hit) return hit;
  }
  for (const dk of listTraceScanDateKeys()) {
    if (dk === preferDateKey) continue;
    const hit = await readApprovalPreflightSnapshotInDateKey(dk, approvalId);
    if (hit) return hit;
  }
  return null;
}
