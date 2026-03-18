/**
 * Client-safe recovery utilities.
 * No Node.js or storage imports — safe for browser/client components.
 */

/** Initial recovery classes. */
export const RECOVERY_CLASSES = [
  "recovery.heartbeat.restart",
  "recovery.approvals.cleanup",
  "recovery.connector.resync",
  "recovery.monitor.verify",
] as const;

export type RecoveryClass = (typeof RECOVERY_CLASSES)[number];

export function isRecoveryClass(kind: string): kind is RecoveryClass {
  return (RECOVERY_CLASSES as readonly string[]).includes(kind);
}

export type RecoveryProposal = {
  recoveryClass: string;
  symptom: string;
  suspectedCause: string;
  recoveryAction: string;
  verificationCheck: string;
  fallbackIfFailed: string;
};
