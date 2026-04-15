import path from "node:path";

/**
 * Governed repo root: same semantic as Jarvis `JARVIS_REPO_ROOT` for code.apply.
 * Prefer OPENCLAW_GOVERNED_REPO_ROOT when set so OpenClaw can point at the slice explicitly.
 */
export function getGovernedRepoRoot(): string | null {
  const raw =
    process.env.OPENCLAW_GOVERNED_REPO_ROOT?.trim() ||
    process.env.JARVIS_REPO_ROOT?.trim();
  if (!raw) return null;
  return path.resolve(raw);
}

/**
 * Resolve `filePath` (relative to repo root or absolute under root) to an absolute path.
 * Rejects paths that escape the governed root (symlink hardening: use for read-only in v1).
 */
export function resolveUnderGovernedRoot(filePath: string): string {
  const root = getGovernedRepoRoot();
  if (!root) {
    throw new Error(
      "Governed repo root not configured: set OPENCLAW_GOVERNED_REPO_ROOT or JARVIS_REPO_ROOT"
    );
  }
  const resolved = path.isAbsolute(filePath)
    ? path.resolve(filePath)
    : path.resolve(root, filePath);
  const rootResolved = path.resolve(root);
  const relative = path.relative(rootResolved, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Path escapes governed repo root");
  }
  return resolved;
}
