import { promises as fs } from "node:fs";
import { resolveUnderGovernedRoot } from "../governed-paths";

export type ApplyPatchDirectInput = {
  /** Relative path under governed repo root. */
  relativePath: string;
  content: string;
};

export type ApplyPatchDirectResult = {
  wrote: string;
};

/**
 * Simulates a raw mutation tool (e.g. direct file write / patch apply).
 * In OPENCLAW_STRICT_GOVERNED mode this handler must never run — the registry blocks it first.
 */
export async function applyPatchDirect(
  input: ApplyPatchDirectInput
): Promise<ApplyPatchDirectResult> {
  const rel = typeof input.relativePath === "string" ? input.relativePath.trim() : "";
  if (!rel) throw new Error("applyPatchDirect: relativePath is required");
  const full = resolveUnderGovernedRoot(rel);
  await fs.writeFile(full, input.content, "utf-8");
  return { wrote: full };
}
