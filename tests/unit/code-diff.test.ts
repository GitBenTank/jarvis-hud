import { describe, it, expect } from "vitest";
import { getCodeDiffDirPath } from "@/lib/code-diff";

describe("code-diff", () => {
  it("getCodeDiffDirPath returns path containing code-diffs, dateKey, approvalId", () => {
    const path = getCodeDiffDirPath("2026-02-25", "abc-123");
    expect(path).toContain("code-diffs");
    expect(path).toContain("2026-02-25");
    expect(path).toContain("abc-123");
  });
});
