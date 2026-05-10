/**
 * Honest description of execute-time dry-run vs durable adapter output.
 * Must stay aligned with POST /api/execute/[approvalId] (dryRun in JSON response).
 *
 * `dryRun: false` means the execute response represents persisted artifacts / outbound
 * effects operators treat as the real run (not preview-only).
 */

export const NON_DRY_RUN_EXECUTE_KINDS = [
  "code.apply",
  "send_email",
  "system.note",
  "reflection.note",
  "workflow.plan",
] as const;

export function isNonDryRunExecuteKind(kind: string): boolean {
  return (NON_DRY_RUN_EXECUTE_KINDS as readonly string[]).includes(kind);
}

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
      "POST /api/execute returns dryRun: false for code.apply, send_email, system.note, reflection.note, and workflow.plan; other kinds use preview / bundle-only adapter behavior.",
  };
}

/** Compact label for HUD pills (not a substitute for per-kind preflight). */
export function executionCapabilitiesShortLabel(caps: ExecutionCapabilities): string {
  if (caps.nonDryRunExecuteKinds.length === 0) {
    return "DRY RUN ONLY";
  }
  return `MIXED · ${caps.nonDryRunExecuteKinds.join(", ")} live`;
}
