import { promises as fs } from "fs";
import path from "path";
import os from "os";

const ROOT =
  process.env.JARVIS_ROOT ?? path.join(os.homedir(), "jarvis");

export function getJarvisRoot(): string {
  return ROOT;
}

/** Path is allowed if under jarvis root or project root (cwd). */
export function ensurePathAllowed(targetPath: string): void {
  const resolved = path.resolve(targetPath);
  const roots = [path.resolve(ROOT), path.resolve(process.cwd())];
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
  const rootResolved = path.resolve(ROOT);
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
  return path.join(ROOT, "events", `${dateKey}.json`);
}

export function getDailyMetricsPath(dateKey: string): string {
  return path.join(ROOT, "daily", `${dateKey}.json`);
}

export function getActionsFilePath(dateKey: string): string {
  return path.join(ROOT, "actions", `${dateKey}.jsonl`);
}

export function getPublishQueueDir(dateKey: string): string {
  return path.join(ROOT, "publish-queue", dateKey);
}

export function getArchiveDir(dateKey: string): string {
  return path.join(ROOT, "_archive", dateKey);
}

export function getYoutubePackageDir(dateKey: string, approvalId: string): string {
  return path.join(ROOT, "youtube-packages", dateKey, approvalId);
}

export function getReflectionDir(dateKey: string, reflectionId: string): string {
  return path.join(ROOT, "reflections", dateKey, reflectionId);
}

export function getDateKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
