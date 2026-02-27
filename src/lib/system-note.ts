import { promises as fs } from "node:fs";
import path from "node:path";
import {
  ensurePathSafe,
  ensureDir,
  getSystemNoteFilePath,
  getSystemNoteManifestPath,
} from "./storage";

export type SystemNoteInput = {
  approvalId: string;
  dateKey: string;
  title: string;
  note: string;
  tags?: string[];
  createdAt: string;
};

export async function writeSystemNote(input: SystemNoteInput): Promise<string> {
  const mdPath = getSystemNoteFilePath(input.dateKey, input.approvalId);
  const jsonPath = getSystemNoteManifestPath(input.dateKey, input.approvalId);

  ensurePathSafe(mdPath);
  ensurePathSafe(jsonPath);
  await ensureDir(path.dirname(mdPath));

  await fs.writeFile(mdPath, input.note, "utf-8");

  const manifest = {
    id: input.approvalId,
    dateKey: input.dateKey,
    createdAt: input.createdAt,
    kind: "system.note",
    title: input.title,
    tags: input.tags ?? [],
  };
  await fs.writeFile(
    jsonPath,
    JSON.stringify(manifest, null, 2),
    "utf-8"
  );

  return mdPath;
}
