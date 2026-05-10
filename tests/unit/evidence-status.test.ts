import { describe, it, expect } from "vitest";
import {
  EVIDENCE_STATUS_VALUES,
  isEvidenceStatus,
  parseOptionalEvidenceStatus,
  UNCERTAINTY_SUMMARY_MAX_CHARS,
} from "@/lib/evidence-status";

describe("evidence-status", () => {
  it("isEvidenceStatus accepts allowlisted values", () => {
    for (const v of EVIDENCE_STATUS_VALUES) {
      expect(isEvidenceStatus(v)).toBe(true);
    }
  });

  it("isEvidenceStatus rejects unknown strings", () => {
    expect(isEvidenceStatus("made_up")).toBe(false);
    expect(isEvidenceStatus("")).toBe(false);
  });

  it("parseOptionalEvidenceStatus trims and ignores invalid", () => {
    expect(parseOptionalEvidenceStatus(undefined)).toBeUndefined();
    expect(parseOptionalEvidenceStatus(null)).toBeUndefined();
    expect(parseOptionalEvidenceStatus("")).toBeUndefined();
    expect(parseOptionalEvidenceStatus("   ")).toBeUndefined();
    expect(parseOptionalEvidenceStatus("  inferred  ")).toBe("inferred");
    expect(parseOptionalEvidenceStatus("bad")).toBeUndefined();
    expect(parseOptionalEvidenceStatus(1)).toBeUndefined();
  });

  it("UNCERTAINTY_SUMMARY_MAX_CHARS is stable contract", () => {
    expect(UNCERTAINTY_SUMMARY_MAX_CHARS).toBe(280);
  });
});
