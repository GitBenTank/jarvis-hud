import { describe, it, expect } from "vitest";
import { computePatchSha256 } from "@/lib/audit-hashes";

describe("computePatchSha256", () => {
  it("returns 64-char hex string for empty input", () => {
    const hash = computePatchSha256("");
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("returns deterministic hash for same input", () => {
    const patch = "diff --git a/foo b/foo\n--- a/foo\n+++ b/foo\n@@ -1 +1,2 @@\n x\n+y\n";
    expect(computePatchSha256(patch)).toBe(computePatchSha256(patch));
  });

  it("returns different hashes for different inputs", () => {
    const a = computePatchSha256("a");
    const b = computePatchSha256("b");
    expect(a).not.toBe(b);
  });

  it("matches known sha256 for empty string", () => {
    const hash = computePatchSha256("");
    expect(hash).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    );
  });

  it("uses UTF-8 encoding", () => {
    const hash = computePatchSha256("hello");
    expect(hash).toBe(
      "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"
    );
  });
});
