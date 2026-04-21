import path from "node:path";
import { getPublishArtifactPath } from "./action-log";
import { isRecoveryClass } from "./recovery-shared";
import {
  getCodeApplyDir,
  getCodeDiffDir,
  getReflectionDir,
  getRecoveryRunbookFilePath,
  getSystemNoteFilePath,
  getYoutubePackageDir,
} from "./storage";

export type ExecutionScopeTarget = { path: string; label: string };

export type ExecutionScopeCheckResult =
  | { ok: true }
  | {
      ok: false;
      code: "execution_scope_denied" | "invalid_target_path";
      reason: string;
      targetPath?: string;
      label?: string;
    };

function splitEnvList(raw: string | undefined): string[] {
  if (!raw || typeof raw !== "string") return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Allowed filesystem roots for adapter execution (blast-radius control).
 * Merges JARVIS_EXEC_ALLOWED_ROOTS and JARVIS_EXEC_ALLOWED_REPOS; duplicates removed after resolve.
 * Empty → enforcement is off (backward compatible for local dev).
 */
export function loadExecutionAllowedRoots(): string[] {
  const merged = [
    ...splitEnvList(process.env.JARVIS_EXEC_ALLOWED_ROOTS),
    ...splitEnvList(process.env.JARVIS_EXEC_ALLOWED_REPOS),
  ];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const entry of merged) {
    const resolved = path.resolve(entry);
    if (!seen.has(resolved)) {
      seen.add(resolved);
      out.push(resolved);
    }
  }
  return out;
}

/**
 * True if resolvedCandidate is equal to or under one of allowedRoots (prefix-safe).
 */
export function isPathWithinAllowedScope(
  resolvedCandidate: string,
  allowedRoots: string[]
): boolean {
  const normalized = path.normalize(resolvedCandidate);
  for (const root of allowedRoots) {
    const resolvedRoot = path.normalize(path.resolve(root));
    const rel = path.relative(resolvedRoot, normalized);
    if (rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel))) {
      return true;
    }
  }
  return false;
}

export function validateExecutionScopeTargets(
  targets: ExecutionScopeTarget[],
  allowedRoots: string[]
): ExecutionScopeCheckResult {
  if (allowedRoots.length === 0) {
    return { ok: true };
  }
  const roots = allowedRoots.map((r) => path.normalize(path.resolve(r)));

  for (const t of targets) {
    if (typeof t.path !== "string" || !t.path.trim()) {
      return {
        ok: false,
        code: "invalid_target_path",
        reason: `Empty or invalid path (${t.label})`,
        targetPath: t.path,
        label: t.label,
      };
    }
    const resolved = path.resolve(t.path.trim());
    if (!isPathWithinAllowedScope(resolved, roots)) {
      return {
        ok: false,
        code: "execution_scope_denied",
        reason: `Path not under allowed execution roots (${t.label})`,
        targetPath: resolved,
        label: t.label,
      };
    }
  }
  return { ok: true };
}

/**
 * Paths adapters will touch for this execution (before any adapter runs).
 * Does not include control-plane-only writes (e.g. events.json) — only listed adapter surfaces.
 */
export function collectExecutionScopeTargets(params: {
  kind: string;
  channel?: string;
  dateKey: string;
  approvalId: string;
  payload: unknown;
  repoRoot: string | null;
}): ExecutionScopeTarget[] {
  const { kind, channel, dateKey, approvalId, payload, repoRoot } = params;
  const p =
    payload && typeof payload === "object"
      ? (payload as Record<string, unknown>)
      : {};

  if (kind === "send_email") {
    return [];
  }

  if (kind === "system.note") {
    return [
      {
        path: getSystemNoteFilePath(dateKey, approvalId),
        label: "system.note.output",
      },
    ];
  }

  if (kind === "reflection.note") {
    return [
      {
        path: getReflectionDir(dateKey, approvalId),
        label: "reflection.bundleDir",
      },
    ];
  }

  if (isRecoveryClass(kind)) {
    return [
      {
        path: getRecoveryRunbookFilePath(dateKey, approvalId),
        label: "recovery.runbook",
      },
    ];
  }

  if (kind === "code.diff") {
    return [
      {
        path: getCodeDiffDir(dateKey, approvalId),
        label: "code.diff.bundleDir",
      },
    ];
  }

  if (kind === "code.apply") {
    const targets: ExecutionScopeTarget[] = [
      {
        path: getCodeApplyDir(dateKey, approvalId),
        label: "code.apply.bundleDir",
      },
    ];
    if (repoRoot) {
      targets.unshift({ path: repoRoot, label: "code.apply.repoRoot" });
    }
    return targets;
  }

  if (kind === "content.publish" && channel === "youtube") {
    const targets: ExecutionScopeTarget[] = [
      {
        path: getYoutubePackageDir(dateKey, approvalId),
        label: "youtube.bundleDir",
      },
    ];
    const yt = p.youtube as Record<string, unknown> | undefined;
    const v =
      typeof yt?.videoFilePath === "string" ? yt.videoFilePath.trim() : "";
    if (v) {
      targets.push({ path: v, label: "youtube.videoFilePath" });
    }
    return targets;
  }

  return [
    {
      path: getPublishArtifactPath(dateKey, approvalId),
      label: "content.publish.artifact",
    },
  ];
}

/**
 * Single-path helper for tests or narrow checks. When allowedRoots is omitted, loads from env.
 * For code.apply, pass repoRoot so the git working tree is checked in addition to targetPath when provided.
 */
export function validateExecutionScope(
  kind: string,
  targetPath: string | undefined,
  repoRoot?: string | null,
  allowedRoots?: string[]
): ExecutionScopeCheckResult {
  const roots = allowedRoots ?? loadExecutionAllowedRoots();
  if (roots.length === 0) return { ok: true };

  const targets: ExecutionScopeTarget[] = [];
  if (kind === "code.apply" && repoRoot?.trim()) {
    targets.push({ path: repoRoot.trim(), label: "code.apply.repoRoot" });
  }
  if (targetPath?.trim()) {
    targets.push({ path: targetPath.trim(), label: `${kind}.target` });
  }
  if (targets.length === 0) return { ok: true };
  return validateExecutionScopeTargets(targets, roots);
}

export function logExecutionScopeEvent(opts: {
  level: "warn" | "error";
  code: string;
  approvalId: string;
  traceId?: string;
  kind: string;
  targetPath?: string;
  reason: string;
}): void {
  const line = `[execution-scope] ${opts.code} approvalId=${opts.approvalId} traceId=${opts.traceId ?? ""} kind=${opts.kind} targetPath=${opts.targetPath ?? ""} ${opts.reason}`;
  if (opts.level === "error") {
    console.error(line);
  } else {
    console.warn(line);
  }
}
