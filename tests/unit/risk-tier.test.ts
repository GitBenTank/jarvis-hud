/**
 * Unit tests for risk tier classifier and irreversible confirmation
 */
import { describe, it, expect } from "vitest";
import {
  getRiskTier,
  requiresIrreversibleConfirmation,
  getConfirmationPhrase,
  describeRiskNarrative,
} from "@/lib/risk-tier";

describe("getRiskTier", () => {
  it("returns CRITICAL for code.apply", () => {
    expect(getRiskTier("code.apply")).toBe("CRITICAL");
  });

  it("returns LOW for content.publish, youtube.package, system.note, etc.", () => {
    expect(getRiskTier("content.publish")).toBe("LOW");
    expect(getRiskTier("youtube.package")).toBe("LOW");
    expect(getRiskTier("system.note")).toBe("LOW");
    expect(getRiskTier("reflection.note")).toBe("LOW");
    expect(getRiskTier("code.diff")).toBe("LOW");
  });

  it("returns LOW for unknown kinds", () => {
    expect(getRiskTier("unknown")).toBe("LOW");
    expect(getRiskTier("custom.kind")).toBe("LOW");
  });
});

describe("requiresIrreversibleConfirmation", () => {
  it("returns true for CRITICAL risk kinds", () => {
    expect(requiresIrreversibleConfirmation("code.apply")).toBe(true);
  });

  it("returns false for LOW risk kinds", () => {
    expect(requiresIrreversibleConfirmation("content.publish")).toBe(false);
    expect(requiresIrreversibleConfirmation("youtube.package")).toBe(false);
    expect(requiresIrreversibleConfirmation("system.note")).toBe(false);
    expect(requiresIrreversibleConfirmation("reflection.note")).toBe(false);
    expect(requiresIrreversibleConfirmation("code.diff")).toBe(false);
  });
});

describe("describeRiskNarrative", () => {
  it("matches high / medium / low tiers", () => {
    expect(describeRiskNarrative("code.apply")).toContain("High risk");
    expect(describeRiskNarrative("code.diff")).toContain("Medium risk");
    expect(describeRiskNarrative("system.note")).toContain("Low risk");
  });
});

describe("getConfirmationPhrase", () => {
  it("returns APPLY for code.apply", () => {
    expect(getConfirmationPhrase("code.apply")).toBe("APPLY");
  });

  it("returns CONFIRM for other kinds", () => {
    expect(getConfirmationPhrase("content.publish")).toBe("CONFIRM");
    expect(getConfirmationPhrase("system.note")).toBe("CONFIRM");
    expect(getConfirmationPhrase("unknown")).toBe("CONFIRM");
  });
});
