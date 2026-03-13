import { describe, it, expect } from "vitest";
import {
  isAllowedKind,
  evaluateExecutePolicy,
  ALLOWED_KINDS,
} from "@/lib/policy";

describe("policy", () => {
  describe("isAllowedKind", () => {
    it("returns true for allowed kinds", () => {
      for (const kind of ALLOWED_KINDS) {
        expect(isAllowedKind(kind)).toBe(true);
      }
    });

    it("returns false for unknown kind", () => {
      expect(isAllowedKind("unknown")).toBe(false);
      expect(isAllowedKind("gmail.send")).toBe(false);
      expect(isAllowedKind("")).toBe(false);
    });
  });

  describe("evaluateExecutePolicy", () => {
    it("blocks unknown kind with 400", async () => {
      const result = await evaluateExecutePolicy({
        kind: "gmail.send",
        authEnabled: false,
        stepUpValid: true,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(400);
        expect(result.reasons.length).toBeGreaterThan(0);
        expect(result.reasons[0]).toContain("not in the execution allowlist");
      }
    });

    it("blocks code.apply without repo root", async () => {
      const result = await evaluateExecutePolicy({
        kind: "code.apply",
        authEnabled: false,
        stepUpValid: true,
        codeApplyBlockReasons: [
          "JARVIS_REPO_ROOT is required for code.apply. Set it to the git repo path.",
        ],
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(400);
        expect(result.reasons).toContain(
          "JARVIS_REPO_ROOT is required for code.apply. Set it to the git repo path."
        );
      }
    });

    it("blocks when auth enabled without step-up", async () => {
      const result = await evaluateExecutePolicy({
        kind: "content.publish",
        authEnabled: true,
        stepUpValid: false,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(403);
        expect(result.reasons[0]).toContain("Step-up required");
      }
    });

    it("allows when auth enabled with step-up", async () => {
      const result = await evaluateExecutePolicy({
        kind: "content.publish",
        authEnabled: true,
        stepUpValid: true,
      });
      expect(result.ok).toBe(true);
    });

    it("allows when auth disabled", async () => {
      const result = await evaluateExecutePolicy({
        kind: "code.diff",
        authEnabled: false,
        stepUpValid: false,
      });
      expect(result.ok).toBe(true);
    });

    it("allows code.apply when no block reasons", async () => {
      const result = await evaluateExecutePolicy({
        kind: "code.apply",
        authEnabled: false,
        stepUpValid: true,
        codeApplyBlockReasons: [],
      });
      expect(result.ok).toBe(true);
    });
  });
});
