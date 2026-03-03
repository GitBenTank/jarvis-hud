import path from "node:path";
import { promises as fs } from "node:fs";
import { execSync, type ExecSyncOptionsWithStringEncoding } from "node:child_process";
import {
  getCodeApplyDir,
  ensureDir,
  ensurePathSafe,
  getJarvisRoot,
} from "./storage";

export class CodeApplyError extends Error {
  constructor(
    message: string,
    public readonly code?: "DIRTY_WORKTREE"
  ) {
    super(message);
    this.name = "CodeApplyError";
  }
}

export type CodeApplyPayload = {
  diffText?: string;
  files?: string[];
  summary?: string;
};

export type WriteCodeApplyBundleInput = {
  approvalId: string;
  traceId: string;
  dateKey: string;
  title: string;
  createdAt: string;
  code: CodeApplyPayload;
};

const REPO_ROOT = process.env.JARVIS_REPO_ROOT;

export function getRepoRoot(): string | null {
  if (!REPO_ROOT || typeof REPO_ROOT !== "string" || !REPO_ROOT.trim()) {
    return null;
  }
  return path.resolve(REPO_ROOT.trim());
}

export function isCodeApplyAvailable(): boolean {
  const root = getRepoRoot();
  if (!root) return false;
  try {
    execSync("git rev-parse --is-inside-work-tree", {
      cwd: root,
      encoding: "utf-8",
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Returns human-readable reasons why code.apply would be blocked.
 * Call before writeCodeApplyBundle to surface policy errors.
 */
export function getCodeApplyBlockReasons(): string[] {
  const reasons: string[] = [];
  const root = getRepoRoot();
  if (!root) {
    reasons.push("JARVIS_REPO_ROOT is required for code.apply. Set it to the git repo path.");
    return reasons;
  }
  const isInside = runGitAllowFail(root, ["rev-parse", "--is-inside-work-tree"]);
  if (!isInside.ok || isInside.output !== "true") {
    reasons.push(`JARVIS_REPO_ROOT (${root}) is not a git repository.`);
    return reasons;
  }
  const statusResult = runGitAllowFail(root, ["status", "--porcelain"]);
  if (statusResult.ok && statusResult.output.trim().length > 0) {
    reasons.push(
      "Working tree is dirty. Stash or commit changes before executing code.apply. Example: git stash"
    );
  }
  return reasons;
}

function runGit(cwd: string, args: string[]): string {
  return execSync(`git ${args.join(" ")}`, {
    cwd,
    encoding: "utf-8",
  }).trim();
}

function runGitAllowFail(cwd: string, args: string[]): { ok: boolean; output: string } {
  try {
    const output = execSync(`git ${args.join(" ")}`, {
      cwd,
      encoding: "utf-8",
    }).trim();
    return { ok: true, output };
  } catch (err: unknown) {
    const message = err && typeof err === "object" && "stdout" in err
      ? String((err as { stdout?: string }).stdout ?? "")
      : err instanceof Error ? err.message : String(err);
    return { ok: false, output: message };
  }
}

export type CodeApplyStatsJson = {
  filesChangedCount: number;
  insertions: number;
  deletions: number;
};

export type CodeApplyResult = {
  outputPath: string;
  commitHash: string | null;
  rollbackCommand: string | null;
  filesChanged: string[];
  statsText: string | null;
  statsJson: CodeApplyStatsJson | null;
  repoHeadBefore: string | null;
  repoHeadAfter: string | null;
  noChangesApplied: boolean;
};

export async function writeCodeApplyBundle(
  input: WriteCodeApplyBundleInput
): Promise<CodeApplyResult> {
  const { approvalId, traceId, dateKey, title, createdAt, code } = input;
  const diffText = code?.diffText?.trim() ?? "";
  if (!diffText) {
    throw new Error("code.diffText is required for code.apply");
  }

  const root = getRepoRoot();
  if (!root) {
    throw new Error(
      "JARVIS_REPO_ROOT is required for code.apply. Set it to the git repo path."
    );
  }

  const isInside = runGitAllowFail(root, ["rev-parse", "--is-inside-work-tree"]);
  if (!isInside.ok || isInside.output !== "true") {
    throw new Error(
      `JARVIS_REPO_ROOT (${root}) is not a git repository. Run: git rev-parse --is-inside-work-tree`
    );
  }

  const statusResult = runGitAllowFail(root, ["status", "--porcelain"]);
  if (statusResult.ok && statusResult.output.trim().length > 0) {
    throw new CodeApplyError(
      "Working tree is dirty. Stash or commit changes before executing code.apply. Example: git stash",
      "DIRTY_WORKTREE"
    );
  }

  const headBefore = runGitAllowFail(root, ["rev-parse", "HEAD"]);
  const repoHeadBefore = headBefore.ok && headBefore.output.trim() ? headBefore.output.trim() : null;

  const checkResult = runGitWithInput(root, ["apply", "--check"], diffText);
  if (!checkResult.ok) {
    throw new Error(`Diff does not apply cleanly: ${checkResult.output}`);
  }

  runGitWithInputSync(root, ["apply"], diffText);
  runGit(root, ["add", "-A"]);

  const diffCached = runGitAllowFail(root, ["diff", "--cached", "--quiet"]);
  const hasStagedChanges = !diffCached.ok;

  let commitHash: string | null = null;
  let rollbackCommand: string | null = null;
  let statsText: string | null = null;
  let statsJson: CodeApplyStatsJson | null = null;
  const filesChanged: string[] = [];

  if (hasStagedChanges) {
    const filesResult = runGitAllowFail(root, ["diff", "--cached", "--name-only"]);
    if (filesResult.ok && filesResult.output.trim()) {
      filesChanged.push(...filesResult.output.trim().split("\n"));
    }
    const numstatResult = runGitAllowFail(root, ["diff", "--cached", "--numstat"]);
    if (numstatResult.ok && numstatResult.output.trim()) {
      let insertions = 0;
      let deletions = 0;
      for (const line of numstatResult.output.trim().split("\n")) {
        const parts = line.split(/\s+/);
        if (parts.length >= 2) {
          const add = parseInt(parts[0], 10);
          const del = parseInt(parts[1], 10);
          if (!Number.isNaN(add)) insertions += add;
          if (!Number.isNaN(del)) deletions += del;
        }
      }
      statsJson = {
        filesChangedCount: filesChanged.length,
        insertions,
        deletions,
      };
    }

    const subject = `jarvis: apply ${approvalId} — ${title || "(untitled)"}`;
    const body = [
      code.summary?.trim() || "Applied via Jarvis HUD code.apply",
      "",
      `Timestamp: ${createdAt}`,
      `Approval ID: ${approvalId}`,
      `Receipts: ${path.join(getJarvisRoot(), "code-applies", dateKey, approvalId)}`,
      `Rollback: git revert <hash>`,
    ].join("\n");
    const message = `${subject}\n\n${body}`;
    runGitWithInputSync(root, ["commit", "-F", "-"], message);
    const hash = runGitAllowFail(root, ["rev-parse", "HEAD"]);
    if (hash.ok && hash.output) {
      commitHash = hash.output.trim();
      rollbackCommand = `git revert ${commitHash}`;
      const showResult = runGitAllowFail(root, [
        "show",
        "--stat",
        "--oneline",
        "--no-patch",
        "HEAD",
      ]);
      if (showResult.ok && showResult.output.trim()) {
        statsText = showResult.output.trim();
      }
    }
  }

  const repoHeadAfter = commitHash ?? repoHeadBefore;

  const dirPath = getCodeApplyDir(dateKey, approvalId);
  ensurePathSafe(dirPath);
  await ensureDir(dirPath);

  const jarvisRoot = getJarvisRoot();
  const receiptsPath = path.join(
    jarvisRoot,
    "code-applies",
    dateKey,
    approvalId
  );

  const manifest = {
    kind: "code.apply",
    traceId,
    approvalId,
    createdAt,
    dateKey,
    dryRun: false,
    outputPath: dirPath,
    title: title || "(untitled)",
    repoRoot: root,
    commitHash,
    rollbackCommand,
    filesChanged,
    statsText,
    statsJson,
    repoHeadBefore,
    repoHeadAfter,
    noChangesApplied: !hasStagedChanges,
  };

  const summaryLines = [
    `# Code Apply Bundle`,
    ``,
    `**Approval ID:** ${approvalId}`,
    `**Created:** ${createdAt}`,
    `**Commit:** ${commitHash ?? "none (no changes applied)"}`,
    `**Repo head before:** ${repoHeadBefore ?? "—"}`,
    `**Repo head after:** ${repoHeadAfter ?? "—"}`,
    ``,
    `## Overview`,
    ``,
    code.summary?.trim() || "Applied via Jarvis HUD",
    ``,
    `## Rollback`,
    ``,
    rollbackCommand ? `\`${rollbackCommand}\`` : "No commit was created.",
    ``,
  ];
  if (statsText) {
    summaryLines.push(`## Stats`, ``, "```", statsText, "```", ``);
  }
  summaryLines.push(`## Receipts`, ``, receiptsPath);
  const summaryMd = summaryLines.join("\n");

  await fs.writeFile(
    path.join(dirPath, "manifest.json"),
    JSON.stringify(manifest, null, 2),
    "utf-8"
  );
  await fs.writeFile(path.join(dirPath, "summary.md"), summaryMd, "utf-8");
  await fs.writeFile(path.join(dirPath, "patch.diff"), diffText, "utf-8");
  await fs.writeFile(
    path.join(dirPath, "files.json"),
    JSON.stringify(filesChanged, null, 2),
    "utf-8"
  );

  return {
    outputPath: dirPath,
    commitHash,
    rollbackCommand,
    filesChanged,
    statsText,
    statsJson,
    repoHeadBefore,
    repoHeadAfter,
    noChangesApplied: !hasStagedChanges,
  };
}

function runGitWithInput(
  cwd: string,
  args: string[],
  stdin: string
): { ok: boolean; output: string } {
  try {
    const output = execSync(`git ${args.join(" ")}`, {
      cwd,
      encoding: "utf-8",
      input: stdin,
    } as ExecSyncOptionsWithStringEncoding).trim();
    return { ok: true, output };
  } catch (err: unknown) {
    const message =
      err && typeof err === "object" && "stderr" in err
        ? String((err as { stderr?: string }).stderr ?? "")
        : err instanceof Error
          ? err.message
          : String(err);
    return { ok: false, output: message };
  }
}

function runGitWithInputSync(cwd: string, args: string[], stdin: string): void {
  execSync(`git ${args.join(" ")}`, {
    cwd,
    encoding: "utf-8",
    input: stdin,
  } as ExecSyncOptionsWithStringEncoding);
}
