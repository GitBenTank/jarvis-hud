import { describe, expect, it } from "vitest";
import { activityTraceHref } from "@/lib/activity-trace-href";

describe("activityTraceHref", () => {
  it("builds Activity URL with encoded trace id", () => {
    expect(activityTraceHref("abc/def")).toBe("/activity?trace=abc%2Fdef");
  });

  it("returns bare Activity path for empty input", () => {
    expect(activityTraceHref("")).toBe("/activity");
    expect(activityTraceHref("   ")).toBe("/activity");
  });
});
