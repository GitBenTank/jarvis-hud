import { describe, it, expect } from "vitest";
import {
  buildApprovalPreflightSnapshotWire,
  validateApprovalPreflightSnapshotWire,
} from "@/lib/approval-preflight-snapshot-shared";

describe("buildApprovalPreflightSnapshotWire", () => {
  it("mirrors ready preflight exactly", () => {
    const wire = buildApprovalPreflightSnapshotWire({
      kind: "code.apply",
      preflightLoading: false,
      preflight: {
        kind: "code.apply",
        status: "ready",
        riskLevel: "high",
        expectedOutputs: ["Artifact", "Receipt"],
        preflight: {
          willBlock: false,
          reasons: [],
          reasonDetails: [],
          notes: [],
        },
      },
    });
    expect(wire.readiness).toBe("ready");
    expect(wire.riskLevel).toBe("high");
    expect(wire.expectedOutputs).toEqual(["Artifact", "Receipt"]);
    expect(wire.reasonDetails).toEqual([]);
  });

  it("records will_block with reason rows", () => {
    const wire = buildApprovalPreflightSnapshotWire({
      kind: "code.apply",
      preflightLoading: false,
      preflight: {
        kind: "code.apply",
        status: "will_block",
        riskLevel: "high",
        expectedOutputs: ["X"],
        preflight: {
          willBlock: true,
          reasons: ["r1"],
          reasonDetails: [
            {
              code: "REPO_ROOT_MISSING",
              label: "Repo root missing",
              summary: "JARVIS_REPO_ROOT is missing or invalid",
            },
          ],
          notes: [],
        },
      },
    });
    expect(wire.readiness).toBe("will_block");
    expect(wire.reasonDetails).toHaveLength(1);
    expect(wire.reasonDetails[0].summary).toBe("JARVIS_REPO_ROOT is missing or invalid");
  });

  it("uses unknown when preflight missing", () => {
    const wire = buildApprovalPreflightSnapshotWire({
      kind: "system.note",
      preflight: null,
      preflightLoading: false,
    });
    expect(wire.readiness).toBe("unknown");
    expect(wire.notes?.[0]).toContain("did not complete");
  });
});

describe("validateApprovalPreflightSnapshotWire", () => {
  it("rejects kind mismatch", () => {
    const r = validateApprovalPreflightSnapshotWire(
      {
        kind: "system.note",
        riskLevel: "low",
        readiness: "ready",
        reasonDetails: [],
        expectedOutputs: [],
      },
      "code.apply"
    );
    expect(r.ok).toBe(false);
  });

  it("accepts valid wire", () => {
    const r = validateApprovalPreflightSnapshotWire(
      {
        kind: "system.note",
        riskLevel: "low",
        readiness: "unknown",
        reasonDetails: [],
        expectedOutputs: ["A"],
        notes: ["n1"],
      },
      "system.note"
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.wire.expectedOutputs).toEqual(["A"]);
  });
});
