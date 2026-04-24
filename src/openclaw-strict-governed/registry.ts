import {
  assertGovernedMutationAllowed,
  GovernanceBlockError,
  strictGovernedModeEnabled,
} from "./enforcement";
import type { StrictGovernedToolName, ToolClassification } from "./types";
import { applyPatchDirect, type ApplyPatchDirectInput } from "./tools/applyPatchDirect";
import {
  proposeCodeApply,
  type ProposeCodeApplyInput,
  type ProposeCodeApplyResult,
} from "./tools/proposeCodeApply";
import {
  proposeResearchSystemNote,
  type ProposeResearchSystemNoteInput,
  type ProposeResearchSystemNoteResult,
} from "./tools/proposeResearchSystemNote";
import {
  readGovernedFile,
  type ReadGovernedFileInput,
  type ReadGovernedFileResult,
} from "./tools/readGovernedFile";

type ToolEntry = {
  classification: ToolClassification;
  invoke: (args: unknown) => Promise<unknown>;
};

function buildDefaultRegistry(): Map<StrictGovernedToolName, ToolEntry> {
  const m = new Map<StrictGovernedToolName, ToolEntry>();

  m.set("readGovernedFile", {
    classification: "read-only",
    invoke: (args) =>
      readGovernedFile(args as ReadGovernedFileInput) as Promise<ReadGovernedFileResult>,
  });

  m.set("proposeCodeApply", {
    classification: "jarvis-proposal",
    invoke: (args) =>
      proposeCodeApply(args as ProposeCodeApplyInput) as Promise<ProposeCodeApplyResult>,
  });

  m.set("proposeResearchSystemNote", {
    classification: "jarvis-proposal",
    invoke: (args) =>
      proposeResearchSystemNote(
        args as ProposeResearchSystemNoteInput
      ) as Promise<ProposeResearchSystemNoteResult>,
  });

  m.set("applyPatchDirect", {
    classification: "governed-mutation",
    invoke: (args) =>
      applyPatchDirect(args as ApplyPatchDirectInput) as Promise<{ wrote: string }>,
  });

  return m;
}

export type StrictGovernedRegistry = {
  /**
   * Single choke point for strict mode. Checks classification before dispatch.
   * No fallback to another tool on block.
   */
  invoke(name: StrictGovernedToolName, args: unknown): Promise<unknown>;
  /** Tools registered for this registry (for introspection / OpenClaw wiring). */
  readonly registeredNames: StrictGovernedToolName[];
};

/**
 * Strict-governed tool registry.
 * - readGovernedFile, proposeCodeApply, applyPatchDirect always registered.
 * - In strict mode, applyPatchDirect throws GovernanceBlockError before its handler runs.
 */
export function createStrictGovernedRegistry(): StrictGovernedRegistry {
  const tools = buildDefaultRegistry();

  return {
    get registeredNames(): StrictGovernedToolName[] {
      if (strictGovernedModeEnabled()) {
        return ["readGovernedFile", "proposeCodeApply", "proposeResearchSystemNote"];
      }
      return [...tools.keys()];
    },
    async invoke(name, args) {
      const entry = tools.get(name);
      if (!entry) {
        throw new Error(`Unknown strict-governed tool: ${name}`);
      }
      assertGovernedMutationAllowed(entry.classification);
      return entry.invoke(args);
    },
  };
}

export { GovernanceBlockError };
