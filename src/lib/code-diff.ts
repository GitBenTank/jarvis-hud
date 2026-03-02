import path from "node:path";
import { promises as fs } from "node:fs";
import { getCodeDiffDir, ensureDir, ensurePathSafe } from "./storage";

export type CodeDiffPayload = {
  baseRef?: string;
  targetRef?: string;
  diffText?: string;
  files?: string[];
  summary?: string;
};

export type WriteCodeDiffBundleInput = {
  approvalId: string;
  dateKey: string;
  title: string;
  createdAt: string;
  code?: CodeDiffPayload;
};

const SUMMARY_TEMPLATE = `# Code Diff Bundle

**Approval ID:** {{approvalId}}
**Created:** {{createdAt}}
**Dry run:** Yes — no changes applied.

## Overview

{{summary}}

## Output

- manifest.json — metadata
- patch.diff — proposed diff (or placeholder)
- files.json — touched files
- summary.md — this file
`;

export function getCodeDiffDirPath(dateKey: string, approvalId: string): string {
  return getCodeDiffDir(dateKey, approvalId);
}

export async function writeCodeDiffBundle(
  input: WriteCodeDiffBundleInput
): Promise<string> {
  const { approvalId, dateKey, title, createdAt, code } = input;
  const dirPath = getCodeDiffDir(dateKey, approvalId);
  ensurePathSafe(dirPath);
  await ensureDir(dirPath);

  const diffText = code?.diffText?.trim() ?? "";
  const patchContent =
    diffText || "(diff not provided — placeholder bundle)";
  const summaryText =
    code?.summary?.trim() ||
    `Dry-run change bundle for: ${title || approvalId}`;
  const files: string[] = Array.isArray(code?.files)
    ? code.files.filter((f): f is string => typeof f === "string")
    : [];

  const manifest = {
    kind: "code.diff",
    approvalId,
    createdAt,
    dateKey,
    dryRun: true,
    outputPath: dirPath,
    title: title || "(untitled)",
  };

  const summaryMd = SUMMARY_TEMPLATE.replace("{{approvalId}}", approvalId)
    .replace("{{createdAt}}", createdAt)
    .replace("{{summary}}", summaryText);

  await fs.writeFile(
    path.join(dirPath, "manifest.json"),
    JSON.stringify(manifest, null, 2),
    "utf-8"
  );
  await fs.writeFile(
    path.join(dirPath, "summary.md"),
    summaryMd,
    "utf-8"
  );
  await fs.writeFile(
    path.join(dirPath, "patch.diff"),
    patchContent,
    "utf-8"
  );
  await fs.writeFile(
    path.join(dirPath, "files.json"),
    JSON.stringify(files, null, 2),
    "utf-8"
  );

  return dirPath;
}
