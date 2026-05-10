import { describe, expect, it } from "vitest";
import { isLoopbackHostname, originsAlignedForLocalHud } from "@/lib/hud-origin-alignment";

describe("isLoopbackHostname", () => {
  it("recognizes common loopback names", () => {
    expect(isLoopbackHostname("localhost")).toBe(true);
    expect(isLoopbackHostname("127.0.0.1")).toBe(true);
    expect(isLoopbackHostname("::1")).toBe(true);
    expect(isLoopbackHostname("[::1]")).toBe(true);
    expect(isLoopbackHostname("192.168.1.1")).toBe(false);
  });
});

describe("originsAlignedForLocalHud", () => {
  it("returns true for identical origins", () => {
    expect(originsAlignedForLocalHud("http://127.0.0.1:3000", "http://127.0.0.1:3000")).toBe(true);
  });

  it("treats localhost and 127.0.0.1 as aligned when scheme and port match", () => {
    expect(originsAlignedForLocalHud("http://localhost:3000", "http://127.0.0.1:3000")).toBe(true);
    expect(originsAlignedForLocalHud("http://127.0.0.1:3000", "http://localhost:3000")).toBe(true);
  });

  it("does not align different ports", () => {
    expect(originsAlignedForLocalHud("http://localhost:3000", "http://127.0.0.1:3001")).toBe(false);
  });

  it("does not align non-loopback hosts", () => {
    expect(originsAlignedForLocalHud("http://localhost:3000", "http://example.com:3000")).toBe(
      false,
    );
  });
});
