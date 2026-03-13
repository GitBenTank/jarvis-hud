/**
 * Reconciliation log — records whether execution matched approved intent.
 * Answers: did reality match intent?
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { ensurePathSafe, ensureDir, getDateKey, getReconciliationFilePath } from "./storage";

export type ReconciliationStatus = "verified" | "drift_detected" | "not_reconcilable_yet";

export type ReconciliationEntry = {
  traceId: string;
  status: ReconciliationStatus;
  expected?: { kind: string; title?: string };
  observed?: { artifactPath?: string; exists?: boolean };
  reason: string;
  timestamp: string;
};

export async function appendReconciliationLog(entry: ReconciliationEntry): Promise<void> {
  const dateKey = getDateKey();
  const filePath = getReconciliationFilePath(dateKey);
  ensurePathSafe(filePath);
  await ensureDir(path.dirname(filePath));
  const line = JSON.stringify(entry) + "\n";
  await fs.appendFile(filePath, line, "utf-8");
}

/**
 * Read reconciliation entries filtered by traceId.
 * Returns entries in chronological order (oldest first).
 */
export async function readReconciliationByTraceId(
  dateKey: string,
  traceId: string
): Promise<ReconciliationEntry[]> {
  const filePath = getReconciliationFilePath(dateKey);
  ensurePathSafe(filePath);
  try {
    const content = await fs.readFile(filePath, "utf-8");
    const lines = content
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const entries = lines.map((line) => JSON.parse(line) as ReconciliationEntry);
    return entries.filter((e) => e.traceId === traceId);
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && err.code === "ENOENT") {
      return [];
    }
    throw err;
  }
}

export type ReconcileSystemNoteInput = {
  traceId: string;
  expected: { kind: string; title?: string; note?: string };
  observed: { artifactPath: string };
};

/**
 * Reconcile system.note execution: compare approved intent vs observed artifact.
 */
export async function reconcileSystemNote(input: ReconcileSystemNoteInput): Promise<ReconciliationEntry> {
  const timestamp = new Date().toISOString();
  const { traceId, expected, observed } = input;

  try {
    await fs.access(observed.artifactPath);
  } catch {
    return {
      traceId,
      status: "drift_detected",
      expected: { kind: expected.kind, title: expected.title },
      observed: { artifactPath: observed.artifactPath, exists: false },
      reason: "artifact_missing",
      timestamp,
    };
  }

  let contentMatches = true;
  if (expected.note !== undefined) {
    try {
      const actual = await fs.readFile(observed.artifactPath, "utf-8");
      if (actual !== expected.note) {
        contentMatches = false;
      }
    } catch {
      contentMatches = false;
    }
  }

  if (!contentMatches) {
    return {
      traceId,
      status: "drift_detected",
      expected: { kind: expected.kind, title: expected.title },
      observed: { artifactPath: observed.artifactPath, exists: true },
      reason: "content_mismatch",
      timestamp,
    };
  }

  return {
    traceId,
    status: "verified",
    expected: { kind: expected.kind, title: expected.title },
    observed: { artifactPath: observed.artifactPath, exists: true },
    reason: "artifact_matches_expected",
    timestamp,
  };
}
