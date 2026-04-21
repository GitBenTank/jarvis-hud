/**
 * Honest description of execute-time dry-run vs side effects.
 * Must stay aligned with POST /api/execute/[approvalId] (dryRun in JSON response).
 */

export const NON_DRY_RUN_EXECUTE_KINDS = ["code.apply", "send_email"] as const;

export type ExecutionCapabilities = {
  /** Kinds for which execute returns dryRun: false (may mutate repo / non-simulated path). */
  nonDryRunExecuteKinds: readonly string[];
  /** Other allowed kinds use dry-run or artifact-only behavior in adapters. */
  dryRunDefaultForOtherKinds: true;
  /** Stable string for agents and audit exports. */
  invariant: string;
};

export function buildExecutionCapabilities(): ExecutionCapabilities {
  return {
    nonDryRunExecuteKinds: [...NON_DRY_RUN_EXECUTE_KINDS],
    dryRunDefaultForOtherKinds: true,
    invariant:
      "POST /api/execute returns dryRun: false for code.apply and send_email; other kinds use dry-run or artifact-only adapter behavior.",
  };
}

/** Compact label for HUD pills (not a substitute for per-kind preflight). */
export function executionCapabilitiesShortLabel(caps: ExecutionCapabilities): string {
  if (caps.nonDryRunExecuteKinds.length === 0) {
    return "DRY RUN ONLY";
  }
  return `MIXED · ${caps.nonDryRunExecuteKinds.join(", ")} live`;
}
