import { describe, expect, it } from "vitest";
import {
  buildExecutionCapabilities,
  executionCapabilitiesShortLabel,
  NON_DRY_RUN_EXECUTE_KINDS,
} from "@/lib/execution-surface";

describe("execution-surface", () => {
  it("declares code.apply as non-dry-run execute kind", () => {
    expect(NON_DRY_RUN_EXECUTE_KINDS).toContain("code.apply");
  });

  it("declares send_email as non-dry-run execute kind", () => {
    expect(NON_DRY_RUN_EXECUTE_KINDS).toContain("send_email");
  });

  it("buildExecutionCapabilities matches execute route invariant", () => {
    const c = buildExecutionCapabilities();
    expect(c.nonDryRunExecuteKinds).toEqual(["code.apply", "send_email"]);
    expect(c.dryRunDefaultForOtherKinds).toBe(true);
    expect(c.invariant).toContain("dryRun: false");
    expect(c.invariant).toContain("send_email");
  });

  it("executionCapabilitiesShortLabel is mixed when live kinds exist", () => {
    const c = buildExecutionCapabilities();
    expect(executionCapabilitiesShortLabel(c)).toContain("MIXED");
    expect(executionCapabilitiesShortLabel(c)).toContain("code.apply");
    expect(executionCapabilitiesShortLabel(c)).toContain("send_email");
  });
});
