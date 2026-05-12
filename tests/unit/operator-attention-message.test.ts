import { describe, expect, it } from "vitest";
import { buildOperatorAttentionMessage } from "@/lib/operator-attention-message";

describe("buildOperatorAttentionMessage", () => {
  it("returns idle copy when both counts are zero", () => {
    expect(buildOperatorAttentionMessage(0, 0)).toBe(
      "Nothing needs your decision right now."
    );
  });

  it("singular pending", () => {
    expect(buildOperatorAttentionMessage(1, 0)).toBe(
      "1 proposal needs your approval"
    );
  });

  it("plural pending", () => {
    expect(buildOperatorAttentionMessage(2, 0)).toBe(
      "2 proposals need your approval"
    );
  });

  it("singular awaiting execute", () => {
    expect(buildOperatorAttentionMessage(0, 1)).toBe(
      "1 approved item awaits execute"
    );
  });

  it("plural awaiting execute", () => {
    expect(buildOperatorAttentionMessage(0, 3)).toBe(
      "3 approved items await execute"
    );
  });

  it("combines both with separator", () => {
    expect(buildOperatorAttentionMessage(2, 1)).toBe(
      "2 proposals need your approval · 1 approved item awaits execute"
    );
  });
});
