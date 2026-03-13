/**
 * Policy decision log — records why execution was allowed or denied.
 * Mirrors action log pattern. Enables: "Why was it allowed?"
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { ensurePathSafe, ensureDir, getDateKey, getPolicyDecisionsFilePath } from "./storage";

export type PolicyDecisionEntry = {
  traceId: string;
  decision: "allow" | "deny";
  rule: string;
  reason: string;
  timestamp: string;
};

export async function appendPolicyDecision(entry: PolicyDecisionEntry): Promise<void> {
  const dateKey = getDateKey();
  const filePath = getPolicyDecisionsFilePath(dateKey);
  ensurePathSafe(filePath);
  await ensureDir(path.dirname(filePath));
  const line = JSON.stringify(entry) + "\n";
  await fs.appendFile(filePath, line, "utf-8");
}

/**
 * Read policy decision entries filtered by traceId.
 * Returns entries in chronological order (oldest first).
 */
export async function readPolicyDecisionsByTraceId(
  dateKey: string,
  traceId: string
): Promise<PolicyDecisionEntry[]> {
  const filePath = getPolicyDecisionsFilePath(dateKey);
  ensurePathSafe(filePath);
  try {
    const content = await fs.readFile(filePath, "utf-8");
    const lines = content
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const entries = lines.map((line) => JSON.parse(line) as PolicyDecisionEntry);
    return entries.filter((e) => e.traceId === traceId);
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && err.code === "ENOENT") {
      return [];
    }
    throw err;
  }
}
