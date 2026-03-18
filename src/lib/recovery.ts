/**
 * Recovery proposal structure and runbook writer.
 * Governed self-healing: Alfred/OpenClaw propose structured recovery actions.
 * Execution produces a human-readable runbook; no autonomous remediation.
 *
 * Client-safe types (RECOVERY_CLASSES, isRecoveryClass) live in recovery-shared.ts
 * to avoid pulling Node.js fs into client bundles.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import {
  ensurePathSafe,
  ensureDir,
  getRecoveryRunbookFilePath,
  getRecoveryRunbookManifestPath,
} from "./storage";
import type { RecoveryProposal } from "./recovery-shared";

export { RECOVERY_CLASSES, isRecoveryClass } from "./recovery-shared";
export type { RecoveryClass, RecoveryProposal } from "./recovery-shared";

export type RecoveryRunbookInput = RecoveryProposal & {
  approvalId: string;
  dateKey: string;
  title: string;
  createdAt: string;
};

export async function writeRecoveryRunbook(
  input: RecoveryRunbookInput
): Promise<string> {
  const mdPath = getRecoveryRunbookFilePath(input.dateKey, input.approvalId);
  const jsonPath = getRecoveryRunbookManifestPath(input.dateKey, input.approvalId);

  ensurePathSafe(mdPath);
  ensurePathSafe(jsonPath);
  await ensureDir(path.dirname(mdPath));

  const md = [
    `# Recovery Runbook: ${input.title}`,
    "",
    `**Class:** \`${input.recoveryClass}\``,
    `**Created:** ${input.createdAt}`,
    "",
    "---",
    "",
    "## Symptom",
    input.symptom,
    "",
    "## Suspected Cause",
    input.suspectedCause,
    "",
    "## Recovery Action",
    input.recoveryAction,
    "",
    "## Verification Check",
    input.verificationCheck,
    "",
    "## Fallback if Failed",
    input.fallbackIfFailed,
    "",
  ].join("\n");

  await fs.writeFile(mdPath, md, "utf-8");

  const manifest = {
    id: input.approvalId,
    dateKey: input.dateKey,
    createdAt: input.createdAt,
    recoveryClass: input.recoveryClass,
    title: input.title,
  };
  await fs.writeFile(
    jsonPath,
    JSON.stringify(manifest, null, 2),
    "utf-8"
  );

  return mdPath;
}
