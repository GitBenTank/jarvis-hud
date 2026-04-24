/**
 * OpenClaw strict-governed reference implementation (first slice).
 * Thesis: governed repo mutations go only through Jarvis after approve + execute.
 *
 * @see docs/architecture/openclaw-strict-mode-enforcement.md
 * @see docs/trust-boundary.md
 */

export {
  strictGovernedModeEnabled,
  assertGovernedMutationAllowed,
  assertNoUnsafeGovernedToolsInStrictMode,
  GovernanceBlockError,
  GOVERNANCE_BLOCK_MESSAGE,
  StrictModeViolationError,
} from "./enforcement";
export { getGovernedRepoRoot, resolveUnderGovernedRoot } from "./governed-paths";
export { submitOpenClawIngress, type SubmitOpenClawIngressResult } from "./jarvisClient";
export { createStrictGovernedRegistry, type StrictGovernedRegistry } from "./registry";
export { readGovernedFile } from "./tools/readGovernedFile";
export { proposeCodeApply } from "./tools/proposeCodeApply";
export {
  proposeAlfredIntakeSystemNote,
  proposeResearchSystemNote,
  FLAGSHIP_FLOW_1_ALFRED_INTAKE_GREP_ANCHOR,
  FLAGSHIP_FLOW_1_BUNDLE_CORRELATION_ID,
  FLAGSHIP_FLOW_1_GREP_ANCHOR,
} from "./tools/proposeResearchSystemNote";
export { applyPatchDirect } from "./tools/applyPatchDirect";
export type {
  ToolClassification,
  StrictGovernedToolName,
} from "./types";
