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
