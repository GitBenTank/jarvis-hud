import { describe, it, expect } from "vitest";
import { appendCommitTrailers } from "@/lib/commit-trailers";

describe("appendCommitTrailers", () => {
  const trailers = {
    traceId: "trace-123",
    approvalId: "approval-456",
    receiptPath: "/path/to/receipt",
    patchSha256: "a".repeat(64),
    treeBefore: "tree-before-abc",
    treeAfter: "tree-after-def",
  };

  it("appends all six trailers to message", () => {
    const result = appendCommitTrailers("Subject\n\nBody", trailers);
    expect(result).toContain("Jarvis-Trace: trace-123");
    expect(result).toContain("Jarvis-Approval: approval-456");
    expect(result).toContain("Jarvis-Receipt: /path/to/receipt");
    expect(result).toContain("Jarvis-Patch-SHA256: " + "a".repeat(64));
    expect(result).toContain("Jarvis-Tree-Before: tree-before-abc");
    expect(result).toContain("Jarvis-Tree-After: tree-after-def");
  });

  it("preserves original message content", () => {
    const base = "Subject\n\nBody line";
    const result = appendCommitTrailers(base, trailers);
    expect(result).toMatch(/^Subject\n\nBody line/);
  });

  it("adds blank line before trailers when message does not end with newline", () => {
    const result = appendCommitTrailers("Subject", trailers);
    const firstTrailerIndex = result.indexOf("Jarvis-Trace");
    const beforeTrailers = result.slice(0, firstTrailerIndex);
    expect(beforeTrailers).toMatch(/\n\n$/);
    expect(result).toContain("Subject");
  });

  it("handles null treeBefore as empty string in trailer", () => {
    const result = appendCommitTrailers("Subject", {
      ...trailers,
      treeBefore: null,
    });
    expect(result).toContain("Jarvis-Tree-Before: ");
  });

  it("handles null treeAfter as empty string in trailer", () => {
    const result = appendCommitTrailers("Subject", {
      ...trailers,
      treeAfter: null,
    });
    expect(result).toContain("Jarvis-Tree-After: ");
  });

  it("ends with newline", () => {
    const result = appendCommitTrailers("Subject", trailers);
    expect(result.endsWith("\n")).toBe(true);
  });
});
