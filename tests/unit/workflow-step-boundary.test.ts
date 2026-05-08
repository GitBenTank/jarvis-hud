import { describe, it, expect } from "vitest";
import {
  workflowStepBoundaryClass,
  workflowStepBoundaryLabel,
} from "@/lib/workflow-step-boundary";

describe("workflowStepBoundaryLabel", () => {
  it("maps kinds to boring boundary phrases", () => {
    expect(workflowStepBoundaryLabel("system.note")).toBe("Internal state");
    expect(workflowStepBoundaryLabel("send_email")).toBe("External consequence");
    expect(workflowStepBoundaryLabel("code.apply")).toBe("High consequence");
    expect(workflowStepBoundaryLabel("content.publish")).toBe("Read-only");
  });

  it("classifies unknown kinds as internal_state", () => {
    expect(workflowStepBoundaryClass("future.kind")).toBe("internal_state");
  });
});
