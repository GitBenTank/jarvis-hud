/**
 * Execute JSON `dryRun` vs adapter behavior (C3 — trust language).
 *
 * **`dryRun: false`** — the governed adapter path for this `executionKind` wrote **durable**
 * receipts/artifacts/runbooks (or real outbound for `send_email`) as the primary outcome.
 * Not a preview-only simulation.
 *
 * **`dryRun: true`** — preview / simulation / explicitly dry adapter (e.g. **`linkedin.post` v1**),
 * even when receipts or markdown artifacts are persisted for audit.
 *
 * Must stay aligned with `POST /api/execute/[approvalId]` (`dryRun: !isNonDryRunExecuteKind(executionKind)`).
 */
import { RECOVERY_CLASSES } from "@/lib/recovery-shared";

export const NON_DRY_RUN_EXECUTE_KINDS = [
  "code.apply",
  "code.diff",
  "send_email",
  "system.note",
  "reflection.note",
  "workflow.plan",
  "content.publish",
  "youtube.package",
  ...RECOVERY_CLASSES,
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
      "POST /api/execute returns dryRun: false for kinds in NON_DRY_RUN_EXECUTE_KINDS (durable adapter primary outcome). linkedin.post v1 stays dryRun: true (simulated post + persisted receipt/artifact).",
  };
}

/** Compact label for HUD pills (not a substitute for per-kind preflight). */
export function executionCapabilitiesShortLabel(caps: ExecutionCapabilities): string {
  if (caps.nonDryRunExecuteKinds.length === 0) {
    return "DRY RUN ONLY";
  }
  return `MIXED · ${caps.nonDryRunExecuteKinds.join(", ")} live`;
}
