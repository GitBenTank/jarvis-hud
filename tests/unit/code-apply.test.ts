import { describe, it, expect } from "vitest";
import {
  getRepoRoot,
  isCodeApplyAvailable,
  CodeApplyError,
} from "@/lib/code-apply";

describe("code-apply", () => {
  it("getRepoRoot returns null when JARVIS_REPO_ROOT is unset", () => {
    const original = process.env.JARVIS_REPO_ROOT;
    delete process.env.JARVIS_REPO_ROOT;
    expect(getRepoRoot()).toBeNull();
    if (original !== undefined) process.env.JARVIS_REPO_ROOT = original;
  });

  it("CodeApplyError has name and code", () => {
    const err = new CodeApplyError("test", "DIRTY_WORKTREE");
    expect(err.name).toBe("CodeApplyError");
    expect(err.code).toBe("DIRTY_WORKTREE");
  });

  it("isCodeApplyAvailable returns false when JARVIS_REPO_ROOT is unset", () => {
    const original = process.env.JARVIS_REPO_ROOT;
    delete process.env.JARVIS_REPO_ROOT;
    expect(isCodeApplyAvailable()).toBe(false);
    if (original !== undefined) process.env.JARVIS_REPO_ROOT = original;
  });
});
