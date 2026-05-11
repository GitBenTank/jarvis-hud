import { promises as fs } from "fs";
import path from "path";
import os from "os";

/**
 * Runtime-resolved Jarvis data root. Kept behind a function so bundlers do not
 * treat a module-level `path.resolve(homedir…/jarvis)` as a static filesystem root
 * over the whole project tree (Turbopack file trace warnings).
 */
let jarvisRootCache: string | undefined;

function resolveJarvisRoot(): string {
  const raw = process.env.JARVIS_ROOT;
  if (raw != null) {
    return path.resolve(raw);
  }
  return path.join(os.homedir(), "jarvis");
}

export function getJarvisRoot(): string {
  if (jarvisRootCache === undefined) {
    jarvisRootCache = resolveJarvisRoot();
  }
  return jarvisRootCache;
}

/** Path is allowed if under jarvis root or project root (cwd). */
export function ensurePathAllowed(targetPath: string): void {
  const resolved = path.resolve(targetPath);
  const roots = [getJarvisRoot(), process.cwd()];
  const underAny = roots.some((r) => {
    const rel = path.relative(r, resolved);
    return !rel.startsWith("..") && !path.isAbsolute(rel);
  });
  if (!underAny) {
    throw new Error("Path not under allowed roots");
  }
}

export function ensurePathSafe(targetPath: string): void {
  const resolved = path.resolve(targetPath);
  const rootResolved = getJarvisRoot();
  const relative = path.relative(rootResolved, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Path escapes jarvis root");
  }
}

export async function ensureDir(dirPath: string): Promise<void> {
  ensurePathSafe(dirPath);
  await fs.mkdir(dirPath, { recursive: true });
}

export async function readJson<T>(filePath: string): Promise<T | null> {
  ensurePathSafe(filePath);
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content) as T;
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && err.code === "ENOENT") {
      return null;
    }
    throw err;
  }
}

export async function writeJson(filePath: string, data: unknown): Promise<void> {
  ensurePathSafe(filePath);
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

export function getEventsFilePath(dateKey: string): string {
  return path.join(getJarvisRoot(), "events", `${dateKey}.json`);
}

export function getDailyMetricsPath(dateKey: string): string {
  return path.join(getJarvisRoot(), "daily", `${dateKey}.json`);
}

export function getActionsFilePath(dateKey: string): string {
  return path.join(getJarvisRoot(), "actions", `${dateKey}.jsonl`);
}

export function getPolicyDecisionsFilePath(dateKey: string): string {
  return path.join(getJarvisRoot(), "policy-decisions", `${dateKey}.jsonl`);
}

/** Append-only approval-time preflight snapshots (one line per approval, keyed by approvalId). */
export function getApprovalPreflightSnapshotPath(dateKey: string): string {
  return path.join(getJarvisRoot(), "approval-preflight", `${dateKey}.jsonl`);
}

export function getReconciliationFilePath(dateKey: string): string {
  return path.join(getJarvisRoot(), "reconciliation", `${dateKey}.jsonl`);
}

export function getPublishQueueDir(dateKey: string): string {
  return path.join(getJarvisRoot(), "publish-queue", dateKey);
}

export function getArchiveDir(dateKey: string): string {
  return path.join(getJarvisRoot(), "_archive", dateKey);
}

export function getYoutubePackageDir(dateKey: string, approvalId: string): string {
  return path.join(getJarvisRoot(), "youtube-packages", dateKey, approvalId);
}

export function getReflectionDir(dateKey: string, reflectionId: string): string {
  return path.join(getJarvisRoot(), "reflections", dateKey, reflectionId);
}

export function getCodeDiffDir(dateKey: string, approvalId: string): string {
  return path.join(getJarvisRoot(), "code-diffs", dateKey, approvalId);
}

export function getCodeApplyDir(dateKey: string, approvalId: string): string {
  return path.join(getJarvisRoot(), "code-applies", dateKey, approvalId);
}

export function getSystemNoteDir(dateKey: string): string {
  return path.join(getJarvisRoot(), "system-notes", dateKey);
}

export function getSystemNoteFilePath(dateKey: string, approvalId: string): string {
  return path.join(getSystemNoteDir(dateKey), `${approvalId}.md`);
}

export function getSystemNoteManifestPath(dateKey: string, approvalId: string): string {
  return path.join(getSystemNoteDir(dateKey), `${approvalId}.json`);
}

export function getSendEmailReceiptDir(dateKey: string): string {
  return path.join(getJarvisRoot(), "email-demonstrations", dateKey);
}

/** Receipt JSON for governed send_email demo executions. */
export function getSendEmailReceiptPath(dateKey: string, approvalId: string): string {
  return path.join(getSendEmailReceiptDir(dateKey), `${approvalId}.json`);
}

/** Markdown artifact: governed LinkedIn post body (v1 dry-run — no API). */
export function getLinkedInPostArtifactPath(dateKey: string, approvalId: string): string {
  return path.join(getJarvisRoot(), "linkedin-posts", dateKey, `${approvalId}.md`);
}

/** JSON receipt for linkedin.post executions. */
export function getLinkedInPostReceiptPath(dateKey: string, approvalId: string): string {
  return path.join(getJarvisRoot(), "linkedin-posts", dateKey, `${approvalId}.json`);
}

export function getRecoveryRunbookDir(dateKey: string): string {
  return path.join(getJarvisRoot(), "recovery-runbooks", dateKey);
}

export function getRecoveryRunbookFilePath(dateKey: string, approvalId: string): string {
  return path.join(getRecoveryRunbookDir(dateKey), `${approvalId}.md`);
}

export function getRecoveryRunbookManifestPath(dateKey: string, approvalId: string): string {
  return path.join(getRecoveryRunbookDir(dateKey), `${approvalId}.json`);
}

/** Recovery verification status — approvalId → { status, markedAt }. Single file across dates. */
export function getRecoveryVerificationsPath(): string {
  return path.join(getJarvisRoot(), "recovery-verifications.json");
}

export function getAlfredOrchestratorLogPath(): string {
  return path.join(getJarvisRoot(), "logs", "alfred_orchestrator.jsonl");
}

export function getDateKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
