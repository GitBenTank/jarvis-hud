import { promises as fs } from "node:fs";
import { resolveUnderGovernedRoot } from "../governed-paths";

export type ReadGovernedFileInput = {
  /** Path relative to governed repo root, or absolute path already under root. */
  path: string;
};

export type ReadGovernedFileResult = {
  content: string;
  resolvedPath: string;
};

/**
 * Read-only: returns UTF-8 file contents under the governed repo root only.
 */
export async function readGovernedFile(
  input: ReadGovernedFileInput
): Promise<ReadGovernedFileResult> {
  const p = typeof input.path === "string" ? input.path.trim() : "";
  if (!p) {
    throw new Error("readGovernedFile: path is required");
  }
  const resolvedPath = resolveUnderGovernedRoot(p);
  const content = await fs.readFile(resolvedPath, "utf-8");
  return { content, resolvedPath };
}
