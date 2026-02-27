import { describe, it, expect } from "vitest";
import { normalizeAction } from "@/lib/normalize";

describe("normalizeAction", () => {
  it("non-object payload => { kind:'unknown', summary:'Unknown action' }", () => {
    expect(normalizeAction(null)).toEqual({
      kind: "unknown",
      summary: "Unknown action",
    });
    expect(normalizeAction(undefined)).toEqual({
      kind: "unknown",
      summary: "Unknown action",
    });
    expect(normalizeAction(42)).toEqual({
      kind: "unknown",
      summary: "Unknown action",
    });
    expect(normalizeAction("string")).toEqual({
      kind: "unknown",
      summary: "Unknown action",
    });
  });

  it("publish payload shape A: { kind:'content.publish', channel, title, body, dryRun:false } => kind content.publish + correct fields + dryRun preserved", () => {
    const result = normalizeAction({
      kind: "content.publish",
      channel: "blog",
      title: "My Post",
      body: "Post body text",
      dryRun: false,
    });
    expect(result.kind).toBe("content.publish");
    expect(result.channel).toBe("blog");
    expect(result.title).toBe("My Post");
    expect(result.body).toBe("Post body text");
    expect(result.dryRun).toBe(false);
    expect(result.summary).toBe("My Post");
  });

  it("publish payload shape B: { action:'publish', target:'blog', title:'hello' } => kind content.publish + channel blog + title hello + dryRun defaults true", () => {
    const result = normalizeAction({
      action: "publish",
      target: "blog",
      title: "hello",
    });
    expect(result.kind).toBe("content.publish");
    expect(result.channel).toBe("blog");
    expect(result.title).toBe("hello");
    expect(result.body).toBe("");
    expect(result.dryRun).toBe(true);
    expect(result.summary).toBe("hello");
  });

  it("generic payload: { kind:'x', message:'hi' } => kind 'x', summary 'hi'", () => {
    const result = normalizeAction({ kind: "x", message: "hi" });
    expect(result.kind).toBe("x");
    expect(result.summary).toBe("hi");
  });

  it("generic payload: { action:'doThing', title:'T' } => kind 'doThing', summary 'T'", () => {
    const result = normalizeAction({ action: "doThing", title: "T" });
    expect(result.kind).toBe("doThing");
    expect(result.summary).toBe("T");
  });
});
