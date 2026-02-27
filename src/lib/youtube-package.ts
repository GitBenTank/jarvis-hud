import { promises as fs } from "node:fs";
import path from "node:path";
import { ensurePathSafe, ensureDir, getYoutubePackageDir } from "./storage";

export type YoutubePackageInput = {
  approvalId: string;
  dateKey: string;
  channel: string;
  title?: string;
  body?: string;
  createdAt: string;
  youtube?: {
    description?: string;
    chapters?: string;
    tags?: string;
    pinned_comment?: string;
    shorts_hook?: string;
    thumbnail_text?: string;
  };
};

function deriveTags(title: string, body: string): string {
  const text = `${title} ${body}`.toLowerCase();
  const words = text.split(/\W+/).filter((w) => w.length > 2);
  const deterministic = [
    "jarvis",
    "hud",
    "agent",
    "control-plane",
    "runtime",
    "approval",
    "execution",
    "thesis",
    "dry-run",
    "receipts",
    "authority",
    "governance",
    "ai",
    "llm",
  ];
  const fromText = [...new Set(words.slice(0, 10))];
  const combined = [...new Set([...fromText, ...deterministic])].slice(0, 20);
  return combined.join(", ");
}

function deriveChapters(title: string): string {
  return `00:00 - Introduction
01:00 - Main Points
02:00 - Demo
03:00 - Conclusion
04:00 - Closing`;
}

function deriveThumbnailText(title: string): string {
  const words = title.split(/\s+/).filter(Boolean);
  const opt1 = words.slice(0, 3).join(" ") || title.slice(0, 25);
  const opt2 = words.slice(0, 2).join(" ");
  const opt3 = title.slice(0, 20);
  const opt4 = words[0] ?? "Jarvis HUD";
  return [opt1, opt2, opt3, opt4].filter(Boolean).join("\n");
}

export async function writeYoutubePackage(input: YoutubePackageInput): Promise<string> {
  const dir = getYoutubePackageDir(input.dateKey, input.approvalId);
  ensurePathSafe(dir);
  await ensureDir(dir);

  const title = input.title ?? "";
  const body = input.body ?? "";
  const yt = input.youtube ?? {};

  const description = yt.description ?? (body.trim() || title);
  const chapters = yt.chapters ?? deriveChapters(title);
  const tags = yt.tags ?? deriveTags(title, body);
  const pinned_comment = yt.pinned_comment ?? "Discussion and feedback welcome.";
  const shorts_hook = yt.shorts_hook ?? (body.trim().split("\n")[0]?.slice(0, 100) ?? title);
  const thumbnail_text = yt.thumbnail_text ?? deriveThumbnailText(title);

  const manifest = {
    approvalId: input.approvalId,
    dateKey: input.dateKey,
    createdAt: input.createdAt,
    dryRun: true,
    kind: "youtube.package",
    channel: "youtube",
    outputPath: dir,
  };

  await fs.writeFile(path.join(dir, "manifest.json"), JSON.stringify(manifest, null, 2), "utf-8");
  await fs.writeFile(path.join(dir, "title.txt"), title, "utf-8");
  await fs.writeFile(path.join(dir, "description.md"), description, "utf-8");
  await fs.writeFile(path.join(dir, "chapters.md"), chapters, "utf-8");
  await fs.writeFile(path.join(dir, "tags.txt"), tags, "utf-8");
  await fs.writeFile(path.join(dir, "pinned_comment.md"), pinned_comment, "utf-8");
  await fs.writeFile(path.join(dir, "shorts_hook.md"), shorts_hook, "utf-8");
  await fs.writeFile(path.join(dir, "thumbnail_text.txt"), thumbnail_text, "utf-8");

  return dir;
}
