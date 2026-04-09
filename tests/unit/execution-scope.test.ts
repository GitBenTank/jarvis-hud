import { afterEach, describe, expect, it, vi } from "vitest";
import path from "node:path";
import {
  collectExecutionScopeTargets,
  isPathWithinAllowedScope,
  loadExecutionAllowedRoots,
  validateExecutionScope,
  validateExecutionScopeTargets,
} from "@/lib/execution-scope";

describe("execution-scope", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("loadExecutionAllowedRoots", () => {
    it("returns empty when env unset", () => {
      vi.stubEnv("JARVIS_EXEC_ALLOWED_ROOTS", "");
      vi.stubEnv("JARVIS_EXEC_ALLOWED_REPOS", "");
      expect(loadExecutionAllowedRoots()).toEqual([]);
    });

    it("merges and dedupes roots from both env vars", () => {
      const a = path.resolve("/tmp/jarvis-scope-a");
      const b = path.resolve("/tmp/jarvis-scope-b");
      vi.stubEnv("JARVIS_EXEC_ALLOWED_ROOTS", `${a}, ${b}`);
      vi.stubEnv("JARVIS_EXEC_ALLOWED_REPOS", `${b}`);
      expect(loadExecutionAllowedRoots()).toEqual([a, b]);
    });

    it("trims whitespace and skips empty segments", () => {
      const r = path.resolve("/allowed");
      vi.stubEnv("JARVIS_EXEC_ALLOWED_ROOTS", `  ${r}  ,  ,`);
      expect(loadExecutionAllowedRoots()).toEqual([r]);
    });
  });

  describe("isPathWithinAllowedScope", () => {
    const root = path.resolve("/workspace/project");

    it("allows path equal to root", () => {
      expect(isPathWithinAllowedScope(root, [root])).toBe(true);
    });

    it("allows nested path under root", () => {
      const nested = path.join(root, "src", "foo.ts");
      expect(isPathWithinAllowedScope(nested, [root])).toBe(true);
    });

    it("rejects sibling path outside root", () => {
      const sibling = path.resolve("/workspace/other-repo/file");
      expect(isPathWithinAllowedScope(sibling, [root])).toBe(false);
    });

    it("rejects traversal that escapes via ..", () => {
      const evil = path.resolve(root, "..", "other-repo", "x");
      expect(isPathWithinAllowedScope(evil, [root])).toBe(false);
    });

    it("allows path under any of multiple roots", () => {
      const r1 = path.resolve("/a");
      const r2 = path.resolve("/b");
      expect(isPathWithinAllowedScope(path.join(r2, "x"), [r1, r2])).toBe(true);
    });
  });

  describe("validateExecutionScopeTargets", () => {
    it("passes when allowed roots empty (enforcement off)", () => {
      expect(
        validateExecutionScopeTargets(
          [{ path: "/anywhere/x", label: "x" }],
          []
        )
      ).toEqual({ ok: true });
    });

    it("rejects empty path with invalid_target_path", () => {
      const root = path.resolve("/allowed");
      const r = validateExecutionScopeTargets(
        [{ path: "   ", label: "bad" }],
        [root]
      );
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.code).toBe("invalid_target_path");
      }
    });

    it("rejects out-of-scope path with execution_scope_denied", () => {
      const root = path.resolve("/allowed");
      const r = validateExecutionScopeTargets(
        [{ path: "/etc/passwd", label: "evil" }],
        [root]
      );
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.code).toBe("execution_scope_denied");
        expect(r.targetPath).toBe(path.resolve("/etc/passwd"));
      }
    });

    it("summary counts implied: all targets must pass", () => {
      const root = path.resolve("/allowed");
      const okPath = path.join(root, "ok");
      const r = validateExecutionScopeTargets(
        [
          { path: okPath, label: "a" },
          { path: "/nope", label: "b" },
        ],
        [root]
      );
      expect(r.ok).toBe(false);
    });
  });

  describe("collectExecutionScopeTargets", () => {
    const dateKey = "2026-04-02";
    const approvalId = "approval-uuid";

    it("includes repo root and bundle dir for code.apply", () => {
      const repo = path.resolve("/repos/app");
      const targets = collectExecutionScopeTargets({
        kind: "code.apply",
        dateKey,
        approvalId,
        payload: {},
        repoRoot: repo,
      });
      const labels = targets.map((t) => t.label);
      expect(labels).toContain("code.apply.repoRoot");
      expect(labels).toContain("code.apply.bundleDir");
      expect(targets.find((t) => t.label === "code.apply.repoRoot")?.path).toBe(
        repo
      );
    });

    it("includes optional youtube video path", () => {
      const vid = path.resolve("/media/video.mp4");
      const targets = collectExecutionScopeTargets({
        kind: "content.publish",
        channel: "youtube",
        dateKey,
        approvalId,
        payload: { youtube: { videoFilePath: vid } },
        repoRoot: null,
      });
      expect(targets.some((t) => t.label === "youtube.videoFilePath")).toBe(
        true
      );
    });
  });

  describe("validateExecutionScope", () => {
    it("passes when roots empty", () => {
      vi.stubEnv("JARVIS_EXEC_ALLOWED_ROOTS", "");
      expect(
        validateExecutionScope("code.apply", "/x", "/y")
      ).toEqual({ ok: true });
    });

    it("preserves actor-agnostic path check for repo + target", () => {
      const root = path.resolve("/mono");
      const sub = path.join(root, "pkg");
      const r = validateExecutionScope(
        "code.apply",
        sub,
        root,
        [root]
      );
      expect(r).toEqual({ ok: true });
    });
  });
});
