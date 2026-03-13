/**
 * Reconciliation Controller — continuously checks whether approved intent
 * has been achieved and whether drift needs to be recorded.
 *
 * Shifts Jarvis from approve→execute once to approve→controller reconciles
 * until reality matches.
 */

import {
  reconcileSystemNote,
  appendReconciliationLog,
} from "./reconciliation-log";
import { findReconciliationCandidates } from "./controller-state";

const CONTROLLER_INTERVAL_MS = 5000;

/**
 * Run a single reconciliation pass: find candidates, reconcile each, log results.
 */
export async function runControllerPass(): Promise<void> {
  const candidates = await findReconciliationCandidates();

  for (const candidate of candidates) {
    if (candidate.kind === "system.note") {
      const result = await reconcileSystemNote({
        traceId: candidate.traceId,
        expected: candidate.expected,
        observed: candidate.observed,
      });
      await appendReconciliationLog(result);
    }
  }
}

/**
 * Start the controller loop. Runs every 5 seconds.
 * Only runs when JARVIS_CONTROLLER_ENABLED=1 (for dev/self-hosted).
 */
export function startControllerLoop(): void {
  const enabled =
    process.env.JARVIS_CONTROLLER_ENABLED === "1" ||
    process.env.NODE_ENV === "development";

  if (!enabled) return;

  runControllerPass().catch((err) => {
    console.error("[jarvis:controller]", err);
  });
  setInterval(() => {
    runControllerPass().catch((err) => {
      console.error("[jarvis:controller]", err);
    });
  }, CONTROLLER_INTERVAL_MS);
}
