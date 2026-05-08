import { describe, it, expect } from "vitest";
import { computeWorkflowLineage } from "@/lib/trace-replay";
import type { ActionLogEntry } from "@/lib/action-log";

function receipt(partial: Partial<ActionLogEntry> & Pick<ActionLogEntry, "id" | "at" | "kind" | "approvalId" | "summary">): ActionLogEntry {
  return {
    traceId: "t",
    status: "executed",
    ...partial,
  };
}

describe("computeWorkflowLineage", () => {
  it("orders child receipts by workflowStepIndex and builds narrative", () => {
    const parentId = "parent-uuid";
    const sorted: ActionLogEntry[] = [
      receipt({
        id: "1",
        at: "2026-05-07T12:00:01.000Z",
        kind: "system.note",
        approvalId: `${parentId}__wf_1`,
        summary: "B",
        parentApprovalId: parentId,
        workflowStepIndex: 1,
        outputPath: "/jarvis/notes/day/a.md",
      }),
      receipt({
        id: "2",
        at: "2026-05-07T12:00:00.000Z",
        kind: "system.note",
        approvalId: `${parentId}__wf_0`,
        summary: "A",
        parentApprovalId: parentId,
        workflowStepIndex: 0,
      }),
      receipt({
        id: "3",
        at: "2026-05-07T12:00:02.000Z",
        kind: "workflow.plan",
        approvalId: parentId,
        summary: "Workflow completed 2 step(s)",
        workflowChildCount: 2,
      }),
    ];
    sorted.sort((a, b) => a.at.localeCompare(b.at));
    const wl = computeWorkflowLineage(sorted, parentId);
    expect(wl.steps.map((s) => s.summary)).toEqual(["A", "B"]);
    expect(wl.childReceipts).toHaveLength(2);
    expect(wl.parentReceipt?.kind).toBe("workflow.plan");
    expect(wl.narrative).toContain("one human approval");
  });
});
