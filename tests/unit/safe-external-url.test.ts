import { describe, expect, it } from "vitest";
import { openClawControlUiBrowserUrl, safeExternalHttpUrl } from "@/lib/safe-external-url";

describe("safeExternalHttpUrl", () => {
  it("accepts http and strips trailing slash", () => {
    expect(safeExternalHttpUrl("http://127.0.0.1:19001/")).toBe("http://127.0.0.1:19001");
  });

  it("accepts https", () => {
    expect(safeExternalHttpUrl("https://example.com/path/")).toBe("https://example.com/path");
  });

  it("rejects empty, non-strings, and non-http schemes", () => {
    expect(safeExternalHttpUrl("")).toBeNull();
    expect(safeExternalHttpUrl("   ")).toBeNull();
    expect(safeExternalHttpUrl(null)).toBeNull();
    expect(safeExternalHttpUrl(undefined)).toBeNull();
    expect(safeExternalHttpUrl("about:blank")).toBeNull();
    expect(safeExternalHttpUrl("javascript:alert(1)")).toBeNull();
  });
});

describe("openClawControlUiBrowserUrl", () => {
  it("appends /overview when only an origin is configured", () => {
    expect(openClawControlUiBrowserUrl("http://127.0.0.1:19001")).toBe("http://127.0.0.1:19001/overview");
    expect(openClawControlUiBrowserUrl("http://127.0.0.1:19001/")).toBe("http://127.0.0.1:19001/overview");
  });

  it("preserves non-root paths", () => {
    expect(openClawControlUiBrowserUrl("http://127.0.0.1:19001/overview")).toBe(
      "http://127.0.0.1:19001/overview",
    );
    expect(openClawControlUiBrowserUrl("http://127.0.0.1:19001/custom/path")).toBe(
      "http://127.0.0.1:19001/custom/path",
    );
  });

  it("inherits safeExternalHttpUrl rejection", () => {
    expect(openClawControlUiBrowserUrl("about:blank")).toBeNull();
    expect(openClawControlUiBrowserUrl("")).toBeNull();
  });
});
