import { describe, it, expect } from "vitest";
import { normalizeProposal } from "@/jarvis/normalizeProposal";

describe("normalizeProposal", () => {
  it("accepts flat Jarvis-shaped system.note", () => {
    const r = normalizeProposal({
      kind: "system.note",
      title: "T",
      summary: "S",
      source: { connector: "openclaw" },
      payload: { note: "hello" },
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.body.kind).toBe("system.note");
    expect(r.body.agent).toBe("alfred");
    expect(r.body.builder).toBe("forge");
    expect(r.body.provider).toBe("openai");
    expect(r.body.model).toBe("openai/gpt-4o");
    expect(r.body.source).toEqual({ connector: "openclaw" });
    expect(r.body.payload).toEqual({ note: "hello" });
  });

  it("flattens nested proposal and maps content to payload.note", () => {
    const r = normalizeProposal({
      agent: "alfred",
      proposal: {
        kind: "system.note",
        content: "OpenClaw to Jarvis pipeline is now live.",
      },
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.body.kind).toBe("system.note");
    expect(r.body.payload).toEqual({ note: "OpenClaw to Jarvis pipeline is now live." });
    expect(String(r.body.title).length).toBeGreaterThan(0);
    expect(String(r.body.summary).length).toBeGreaterThan(0);
    expect(r.body).not.toHaveProperty("proposal");
    expect(r.body).not.toHaveProperty("content");
  });

  it("strips unknown top-level keys", () => {
    const r = normalizeProposal({
      kind: "system.note",
      title: "T",
      summary: "S",
      payload: { note: "n" },
      evil: "no",
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.body).not.toHaveProperty("evil");
  });

  it("rejects missing kind", () => {
    const r = normalizeProposal({
      title: "T",
      summary: "S",
      payload: {},
    });
    expect(r.ok).toBe(false);
  });

  it("rejects non-object payload", () => {
    const r = normalizeProposal({
      kind: "system.note",
      title: "T",
      summary: "S",
      payload: "bad",
    });
    expect(r.ok).toBe(false);
  });
});
