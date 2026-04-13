/**
 * OpenClaw logical agent resolution (ingress identity contract).
 */
import { describe, it, expect } from "vitest";
import {
  OPENCLAW_INGRESS_UNKNOWN_PROPOSER_AGENT,
  resolveOpenClawLogicalAgent,
} from "@/lib/ingress/openclaw-proposal-identity";

describe("resolveOpenClawLogicalAgent", () => {
  it("uses explicit body.agent when non-empty", () => {
    expect(resolveOpenClawLogicalAgent("alfred", "main")).toBe("alfred");
  });

  it("trims body.agent", () => {
    expect(resolveOpenClawLogicalAgent("  alfred  ", "main")).toBe("alfred");
  });

  it("falls back to source.agentId when body.agent missing", () => {
    expect(resolveOpenClawLogicalAgent(undefined, "main")).toBe("main");
  });

  it("falls back to source.agentId when body.agent whitespace-only", () => {
    expect(resolveOpenClawLogicalAgent("   ", "runtime-1")).toBe("runtime-1");
  });

  it("does not use builder here (caller must not pass builder)", () => {
    expect(resolveOpenClawLogicalAgent(undefined, "upstream-id")).toBe("upstream-id");
  });

  it("uses unknown-proposer when neither agent nor source.agentId", () => {
    expect(resolveOpenClawLogicalAgent(undefined, undefined)).toBe(
      OPENCLAW_INGRESS_UNKNOWN_PROPOSER_AGENT
    );
    expect(resolveOpenClawLogicalAgent("", "")).toBe(OPENCLAW_INGRESS_UNKNOWN_PROPOSER_AGENT);
  });

  it("ignores non-string body.agent", () => {
    expect(resolveOpenClawLogicalAgent(123 as unknown as string, "sid")).toBe("sid");
  });

  it("ignores non-string source.agentId for fallback", () => {
    expect(resolveOpenClawLogicalAgent(undefined, 123 as unknown as string)).toBe(
      OPENCLAW_INGRESS_UNKNOWN_PROPOSER_AGENT
    );
  });
});
