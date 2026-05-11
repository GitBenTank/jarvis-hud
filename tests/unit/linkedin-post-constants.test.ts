import { describe, expect, it } from "vitest";
import {
  LINKEDIN_ACCOUNT_LABEL_MAX,
  LINKEDIN_POST_BODY_MAX,
  parseLinkedInPostPayload,
} from "@/lib/linkedin-post-constants";

describe("parseLinkedInPostPayload", () => {
  it("accepts top-level payload fields", () => {
    const r = parseLinkedInPostPayload({
      body: "Hello network",
      visibility: "PUBLIC",
      accountLabel: "Personal profile",
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.body).toBe("Hello network");
      expect(r.value.visibility).toBe("PUBLIC");
      expect(r.value.accountLabel).toBe("Personal profile");
    }
  });

  it("accepts nested payload.payload object", () => {
    const r = parseLinkedInPostPayload({
      payload: {
        body: "Nested",
        visibility: "connections",
        accountLabel: "Org page",
      },
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.body).toBe("Nested");
      expect(r.value.visibility).toBe("CONNECTIONS");
      expect(r.value.accountLabel).toBe("Org page");
    }
  });

  it("rejects empty body", () => {
    const r = parseLinkedInPostPayload({
      body: "   ",
      visibility: "PUBLIC",
      accountLabel: "x",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.field).toBe("payload.body");
  });

  it("rejects invalid visibility", () => {
    const r = parseLinkedInPostPayload({
      body: "Hi",
      visibility: "FOLLOWERS",
      accountLabel: "x",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.field).toBe("payload.visibility");
  });

  it("rejects missing accountLabel", () => {
    const r = parseLinkedInPostPayload({
      body: "Hi",
      visibility: "PUBLIC",
      accountLabel: "",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.field).toBe("payload.accountLabel");
  });

  it("rejects body over max length", () => {
    const r = parseLinkedInPostPayload({
      body: "x".repeat(LINKEDIN_POST_BODY_MAX + 1),
      visibility: "PUBLIC",
      accountLabel: "x",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.field).toBe("payload.body");
  });

  it("rejects accountLabel over max length", () => {
    const r = parseLinkedInPostPayload({
      body: "Hi",
      visibility: "PUBLIC",
      accountLabel: "x".repeat(LINKEDIN_ACCOUNT_LABEL_MAX + 1),
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.field).toBe("payload.accountLabel");
  });
});
