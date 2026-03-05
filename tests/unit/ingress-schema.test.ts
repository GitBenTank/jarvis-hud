/**
 * Unit tests for ingress schema validation
 */
import { describe, it, expect } from "vitest";
import {
  validateRawBodySize,
  validateIngressBody,
} from "@/lib/ingress-schema";

const BASE = {
  kind: "system.note",
  title: "Test",
  summary: "Summary",
  source: { connector: "openclaw" },
};

describe("validateRawBodySize", () => {
  it("accepts body under 1MB", () => {
    const small = JSON.stringify(BASE);
    expect(validateRawBodySize(small)).toBeNull();
  });

  it("rejects body over 1MB", () => {
    const huge = "x".repeat(1024 * 1024 + 1);
    const err = validateRawBodySize(huge);
    expect(err).not.toBeNull();
    expect(err?.code).toBe("BODY_TOO_LARGE");
    expect(err?.message).toMatch(/exceeds|bytes|large/i);
  });
});

describe("validateIngressBody", () => {
  it("accepts valid system.note payload", () => {
    const body = { ...BASE, payload: { note: "body" } };
    const r = validateIngressBody(body);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.body.kind).toBe("system.note");
      expect(r.body.title).toBe("Test");
    }
  });

  it("accepts valid code.apply with top-level patch", () => {
    const body = {
      kind: "code.apply",
      title: "Apply fix",
      summary: "Fix bug",
      patch: "diff --git a/a b/a\n--- a/a\n+++ b/a\n@@ -1 +1 @@\n-x\n+y",
      source: { connector: "openclaw" },
    };
    const r = validateIngressBody(body);
    expect(r.ok).toBe(true);
  });

  it("accepts valid code.apply with payload.code.diffText", () => {
    const body = {
      kind: "code.apply",
      title: "Apply fix",
      summary: "Fix bug",
      payload: {
        code: { diffText: "diff --git a/a b/a\n--- a/a\n+++ b/a\n@@ -1 +1 @@\n-x\n+y" },
      },
      source: { connector: "openclaw" },
    };
    const r = validateIngressBody(body);
    expect(r.ok).toBe(true);
  });

  it("accepts optional payload, patch, markdown, confidence", () => {
    const body = {
      ...BASE,
      payload: { note: "ok" },
      patch: undefined,
      markdown: "# Hello",
      confidence: 0.9,
    };
    const r = validateIngressBody(body);
    expect(r.ok).toBe(true);
  });

  it("rejects unknown top-level keys", () => {
    const body = { ...BASE, payload: {}, _secret: "leak", extra: 1 };
    const r = validateIngressBody(body);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.length).toBeGreaterThanOrEqual(2);
      const unknownFields = r.errors.filter((e) => e.code === "UNKNOWN_FIELD");
      expect(unknownFields.some((e) => e.field === "_secret")).toBe(true);
      expect(unknownFields.some((e) => e.field === "extra")).toBe(true);
    }
  });

  it("rejects missing kind", () => {
    const body = { title: "T", summary: "S", source: { connector: "openclaw" } };
    const r = validateIngressBody(body);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.some((e) => e.code === "MISSING_FIELD" && e.field === "kind")).toBe(true);
    }
  });

  it("rejects missing title", () => {
    const body = {
      kind: "system.note",
      summary: "S",
      source: { connector: "openclaw" },
    };
    const r = validateIngressBody(body);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.some((e) => e.code === "MISSING_FIELD" && e.field === "title")).toBe(true);
    }
  });

  it("rejects missing summary", () => {
    const body = {
      kind: "system.note",
      title: "T",
      source: { connector: "openclaw" },
    };
    const r = validateIngressBody(body);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.some((e) => e.code === "MISSING_FIELD" && e.field === "summary")).toBe(true);
    }
  });

  it("rejects missing source", () => {
    const body = { kind: "system.note", title: "T", summary: "S" };
    const r = validateIngressBody(body);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.some((e) => e.code === "MISSING_FIELD" && e.field === "source")).toBe(true);
    }
  });

  it("rejects non-object body", () => {
    expect(validateIngressBody(null).ok).toBe(false);
    expect(validateIngressBody(undefined).ok).toBe(false);
    expect(validateIngressBody("string").ok).toBe(false);
  });

  it("rejects title over 120 chars", () => {
    const body = {
      ...BASE,
      title: "x".repeat(121),
    };
    const r = validateIngressBody(body);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.some((e) => e.code === "FIELD_TOO_LONG" && e.field === "title")).toBe(true);
    }
  });

  it("rejects summary over 2000 chars", () => {
    const body = {
      ...BASE,
      summary: "x".repeat(2001),
    };
    const r = validateIngressBody(body);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.some((e) => e.code === "FIELD_TOO_LONG" && e.field === "summary")).toBe(true);
    }
  });

  it("rejects code.apply without patch", () => {
    const body = {
      kind: "code.apply",
      title: "No patch",
      summary: "Missing",
      source: { connector: "openclaw" },
    };
    const r = validateIngressBody(body);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.some((e) => e.code === "PATCH_REQUIRED")).toBe(true);
    }
  });

  it("rejects system.note with patch", () => {
    const body = {
      ...BASE,
      payload: { note: "ok" },
      patch: "diff --git",
    };
    const r = validateIngressBody(body);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(
        r.errors.some(
          (e) => e.code === "PATCH_NOT_ALLOWED" && e.message?.includes("system.note")
        )
      ).toBe(true);
    }
  });

  it("rejects patch when kind is not code.apply", () => {
    const body = {
      kind: "content.publish",
      title: "T",
      summary: "S",
      patch: "diff",
      source: { connector: "openclaw" },
    };
    const r = validateIngressBody(body);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.some((e) => e.code === "PATCH_NOT_ALLOWED")).toBe(true);
    }
  });

  it("rejects patch over 1MB", () => {
    const body = {
      kind: "code.apply",
      title: "Huge",
      summary: "S",
      patch: "x".repeat(1024 * 1024 + 1),
      source: { connector: "openclaw" },
    };
    const r = validateIngressBody(body);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.some((e) => e.code === "PATCH_TOO_LARGE")).toBe(true);
    }
  });

  it("rejects patch with null bytes", () => {
    const body = {
      kind: "code.apply",
      title: "Binary",
      summary: "S",
      patch: "diff\x00binary",
      source: { connector: "openclaw" },
    };
    const r = validateIngressBody(body);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.some((e) => e.code === "PATCH_BINARY")).toBe(true);
    }
  });

  it("errors do not leak secrets", () => {
    const body = { ...BASE, payload: { apiKey: "secret123" }, _secret: "leak" };
    const r = validateIngressBody(body);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      const errStr = JSON.stringify(r.errors);
      expect(errStr).not.toContain("secret123");
      expect(errStr).not.toContain("apiKey");
    }
  });
});
