import { describe, it, expect } from "vitest";
import {
  parseWorkflowPlanPayload,
  WORKFLOW_PLAN_MIN_STEPS,
  childApprovalIdForWorkflowStep,
} from "@/lib/workflow-plan";

function validStep(note: string) {
  return {
    kind: "system.note" as const,
    title: "T",
    summary: "S",
    payload: { note },
  };
}

describe("parseWorkflowPlanPayload", () => {
  it("accepts two system.note steps", () => {
    const r = parseWorkflowPlanPayload({
      steps: [validStep("a"), validStep("b")],
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.steps).toHaveLength(2);
      expect(r.steps[0].note).toBe("a");
    }
  });

  it(`requires at least ${WORKFLOW_PLAN_MIN_STEPS} steps`, () => {
    const r = parseWorkflowPlanPayload({
      steps: [validStep("only")],
    });
    expect(r.ok).toBe(false);
  });

  it("rejects non-system.note step kind", () => {
    const r = parseWorkflowPlanPayload({
      steps: [
        validStep("a"),
        {
          kind: "send_email",
          title: "T",
          summary: "S",
          payload: { note: "x" },
        },
      ],
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.field).toContain("kind");
  });

  it("rejects unknown keys on step", () => {
    const r = parseWorkflowPlanPayload({
      steps: [
        { ...validStep("a"), extra: 1 },
        validStep("b"),
      ],
    });
    expect(r.ok).toBe(false);
  });
});

describe("childApprovalIdForWorkflowStep", () => {
  it("suffixes parent id with step index", () => {
    expect(childApprovalIdForWorkflowStep("abc", 0)).toBe("abc__wf_0");
    expect(childApprovalIdForWorkflowStep("abc", 2)).toBe("abc__wf_2");
  });
});
