/**
 * OpenClaw strict-governed slice — tool classification for OPENCLAW_STRICT_GOVERNED.
 * @see docs/architecture/openclaw-strict-mode-enforcement.md
 */

/** Read-only access under governed repo root. */
export type ToolClassificationReadOnly = "read-only";

/**
 * Direct mutation of governed repo (patch/write/apply) — blocked in strict mode;
 * must use jarvis-proposal tools instead.
 */
export type ToolClassificationGovernedMutation = "governed-mutation";

/** Submits a proposal via POST /api/ingress/openclaw — allowed in strict mode (no local repo write). */
export type ToolClassificationJarvisProposal = "jarvis-proposal";

export type ToolClassification =
  | ToolClassificationReadOnly
  | ToolClassificationGovernedMutation
  | ToolClassificationJarvisProposal;

export type StrictGovernedToolName =
  | "readGovernedFile"
  | "proposeCodeApply"
  | "applyPatchDirect";
