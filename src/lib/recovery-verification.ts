/**
 * Recovery verification status — human-gated closed loop.
 * proposed → approved → executed → verified | failed
 *
 * Operators mark recovery outcomes after following the runbook.
 * No autonomous recovery logic.
 */

import { getRecoveryVerificationsPath, readJson, writeJson } from "./storage";

export type RecoveryVerificationStatus = "pending" | "verified" | "failed";

export type RecoveryVerificationEntry = {
  status: "verified" | "failed";
  markedAt: string;
};

export type RecoveryVerificationsMap = Record<string, RecoveryVerificationEntry>;

/** Single file: {JARVIS_ROOT}/recovery-verifications.json */
export async function readRecoveryVerifications(): Promise<RecoveryVerificationsMap> {
  const p = getRecoveryVerificationsPath();
  const data = await readJson<RecoveryVerificationsMap>(p);
  return data ?? {};
}

export async function writeRecoveryVerification(
  approvalId: string,
  status: "verified" | "failed"
): Promise<void> {
  const p = getRecoveryVerificationsPath();
  const existing = await readRecoveryVerifications();
  existing[approvalId] = { status, markedAt: new Date().toISOString() };
  await writeJson(p, existing);
}
