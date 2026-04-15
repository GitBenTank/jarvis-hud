import type { ToolClassification } from "./types";

export const GOVERNANCE_BLOCK_MESSAGE =
  "GOVERNANCE_BLOCK: strict mode — route through Jarvis";

/** Thrown when a governed-mutation tool is invoked while OPENCLAW_STRICT_GOVERNED=true. */
export class GovernanceBlockError extends Error {
  readonly code = "GOVERNANCE_BLOCK" as const;

  constructor() {
    super(GOVERNANCE_BLOCK_MESSAGE);
    this.name = "GovernanceBlockError";
  }
}

/** True when strict governed mode is enabled (env string "true"). */
export function strictGovernedModeEnabled(): boolean {
  return process.env.OPENCLAW_STRICT_GOVERNED === "true";
}

/**
 * Single choke point: block direct governed mutations in strict mode.
 * Call from every tool dispatcher before running a handler whose classification is governed-mutation.
 */
export function assertGovernedMutationAllowed(classification: ToolClassification): void {
  if (strictGovernedModeEnabled() && classification === "governed-mutation") {
    throw new GovernanceBlockError();
  }
}

/**
 * Startup / registration-time guard: in strict mode, no agent-visible tool may be
 * classified as direct `governed-mutation`. Misconfiguration fails loud (no silent drift).
 * OpenClaw should pass the full agent tool list after registration.
 */
export class StrictModeViolationError extends Error {
  readonly code = "STRICT_MODE_VIOLATION" as const;

  constructor(message: string) {
    super(message);
    this.name = "StrictModeViolationError";
  }
}

export function assertNoUnsafeGovernedToolsInStrictMode(
  tools: ReadonlyArray<{ id: string; classification: ToolClassification }>
): void {
  if (!strictGovernedModeEnabled()) return;
  const unsafe = tools.filter((t) => t.classification === "governed-mutation");
  if (unsafe.length === 0) return;
  const ids = unsafe.map((t) => t.id).join(", ");
  throw new StrictModeViolationError(
    `STRICT_MODE_VIOLATION: agent-visible governed-mutation tools are not allowed (${ids}). Remove them, wrap with Jarvis ingress (jarvis-proposal), or disable strict mode.`
  );
}
