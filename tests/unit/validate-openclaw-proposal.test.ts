/**
 * Unit tests for validate-openclaw-proposal
 */
import { describe, it, expect } from "vitest";
import { validateOpenClawProposal } from "@/lib/ingress/validate-openclaw-proposal";
import { ALLOWED_KINDS } from "@/lib/policy";

const ALLOWED = [...ALLOWED_KINDS];
const MAX_BYTES = 1024 * 1024;

describe("validateOpenClawProposal", () => {
  it("accepts valid system.note", () => {
    const body = {
      kind: "system.note",
      title: "Test note",
      summary: "Test summary",
      payload: { note: "body" },
      source: { connector: "openclaw" },
    };
    const r = validateOpenClawProposal({
      rawBody: JSON.stringify(body),
      parsed: body,
      maxBytes: MAX_BYTES,
      allowedKinds: ALLOWED,
    });
    expect(r.ok).toBe(true);
  });

  it("accepts valid code.apply with patch", () => {
    const body = {
      kind: "code.apply",
      title: "Apply fix",
      summary: "Fix bug",
      patch: "diff --git a/a b/a\n--- a/a\n+++ b/a\n@@ -1 +1 @@\n-x\n+y",
      source: { connector: "openclaw" },
    };
    const r = validateOpenClawProposal({
      rawBody: JSON.stringify(body),
      parsed: body,
      maxBytes: MAX_BYTES,
      allowedKinds: ALLOWED,
    });
    expect(r.ok).toBe(true);
  });

  it("accepts patch with --- and +++ (unified) without diff --git", () => {
    const body = {
      kind: "code.apply",
      title: "Apply",
      summary: "Fix",
      patch: "--- a/file.txt\n+++ b/file.txt\n@@ -1 +1 @@\n-old\n+new",
      source: { connector: "openclaw" },
    };
    const r = validateOpenClawProposal({
      rawBody: JSON.stringify(body),
      parsed: body,
      maxBytes: MAX_BYTES,
      allowedKinds: ALLOWED,
    });
    expect(r.ok).toBe(true);
  });

  it("rejects patch too large", () => {
    const hugePatch = "diff --git a/x b/x\n" + "x".repeat(1_000_001);
    const body = {
      kind: "code.apply",
      title: "Huge",
      summary: "S",
      patch: hugePatch,
      source: { connector: "openclaw" },
    };
    const r = validateOpenClawProposal({
      rawBody: JSON.stringify(body),
      parsed: body,
      maxBytes: MAX_BYTES,
      allowedKinds: ALLOWED,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.code).toBe("payload_too_large");
      expect(r.field).toBe("patch");
    }
  });

  it("rejects raw body too large", () => {
    const body = {
      kind: "system.note",
      title: "T",
      summary: "S",
      source: { connector: "openclaw" },
    };
    const rawBody = JSON.stringify(body) + "x".repeat(MAX_BYTES + 1);
    const r = validateOpenClawProposal({
      rawBody,
      parsed: body,
      maxBytes: MAX_BYTES,
      allowedKinds: ALLOWED,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.code).toBe("payload_too_large");
    }
  });

  it("rejects missing source.connector", () => {
    const body = {
      kind: "system.note",
      title: "T",
      summary: "S",
      source: { connector: "other" },
    };
    const r = validateOpenClawProposal({
      rawBody: JSON.stringify(body),
      parsed: body,
      maxBytes: MAX_BYTES,
      allowedKinds: ALLOWED,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.code).toBe("bad_request");
      expect(r.message).toContain("openclaw");
    }
  });

  it("rejects unsupported kind", () => {
    const body = {
      kind: "evil.script",
      title: "T",
      summary: "S",
      source: { connector: "openclaw" },
    };
    const r = validateOpenClawProposal({
      rawBody: JSON.stringify(body),
      parsed: body,
      maxBytes: MAX_BYTES,
      allowedKinds: ALLOWED,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.code).toBe("unsupported_kind");
      expect(r.field).toBe("kind");
    }
  });

  it("rejects unknown extra key", () => {
    const body = {
      kind: "system.note",
      title: "T",
      summary: "S",
      source: { connector: "openclaw" },
      _injection: "malicious",
    };
    const r = validateOpenClawProposal({
      rawBody: JSON.stringify(body),
      parsed: body,
      maxBytes: MAX_BYTES,
      allowedKinds: ALLOWED,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.code).toBe("bad_request");
      expect(r.field).toBe("_injection");
    }
  });

  it("rejects binary patch marker GIT binary patch", () => {
    const body = {
      kind: "code.apply",
      title: "Binary",
      summary: "S",
      patch: "diff --git a/x b/x\nGIT binary patch\nliteral 123",
      source: { connector: "openclaw" },
    };
    const r = validateOpenClawProposal({
      rawBody: JSON.stringify(body),
      parsed: body,
      maxBytes: MAX_BYTES,
      allowedKinds: ALLOWED,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.code).toBe("bad_request");
      expect(r.message).toContain("binary");
    }
  });

  it("rejects patch with null bytes", () => {
    const body = {
      kind: "code.apply",
      title: "Null",
      summary: "S",
      patch: "diff --git a/x b/x\n--- a/x\n+++ b/x\n\x00binary",
      source: { connector: "openclaw" },
    };
    const r = validateOpenClawProposal({
      rawBody: JSON.stringify(body),
      parsed: body,
      maxBytes: MAX_BYTES,
      allowedKinds: ALLOWED,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.code).toBe("bad_request");
      expect(r.message).toContain("binary");
    }
  });

  it("rejects binary patch marker literal ", () => {
    const body = {
      kind: "code.apply",
      title: "Literal",
      summary: "S",
      patch: "diff --git a/x b/x\nliteral \n",
      source: { connector: "openclaw" },
    };
    const r = validateOpenClawProposal({
      rawBody: JSON.stringify(body),
      parsed: body,
      maxBytes: MAX_BYTES,
      allowedKinds: ALLOWED,
    });
    expect(r.ok).toBe(false);
  });

  it("rejects summary over 500 chars", () => {
    const body = {
      kind: "system.note",
      title: "T",
      summary: "x".repeat(501),
      source: { connector: "openclaw" },
    };
    const r = validateOpenClawProposal({
      rawBody: JSON.stringify(body),
      parsed: body,
      maxBytes: MAX_BYTES,
      allowedKinds: ALLOWED,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.code).toBe("bad_request");
      expect(r.field).toBe("summary");
    }
  });

  it("rejects title over 120 chars", () => {
    const body = {
      kind: "system.note",
      title: "x".repeat(121),
      summary: "S",
      source: { connector: "openclaw" },
    };
    const r = validateOpenClawProposal({
      rawBody: JSON.stringify(body),
      parsed: body,
      maxBytes: MAX_BYTES,
      allowedKinds: ALLOWED,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.field).toBe("title");
    }
  });

  it("accepts optional confidence 0-1", () => {
    const body = {
      kind: "system.note",
      title: "T",
      summary: "S",
      source: { connector: "openclaw" },
      confidence: 0.9,
    };
    const r = validateOpenClawProposal({
      rawBody: JSON.stringify(body),
      parsed: body,
      maxBytes: MAX_BYTES,
      allowedKinds: ALLOWED,
    });
    expect(r.ok).toBe(true);
  });

  it("rejects confidence out of range", () => {
    const body = {
      kind: "system.note",
      title: "T",
      summary: "S",
      source: { connector: "openclaw" },
      confidence: 1.5,
    };
    const r = validateOpenClawProposal({
      rawBody: JSON.stringify(body),
      parsed: body,
      maxBytes: MAX_BYTES,
      allowedKinds: ALLOWED,
    });
    expect(r.ok).toBe(false);
  });
});
