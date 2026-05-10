import { describe, it, expect } from "vitest";
import {
  operatorLifecycleBadgeLabel,
  proposalStatusShortLabel,
} from "@/lib/proposal-status-operator-ui";

describe("proposal-status-operator-ui", () => {
  it("maps rejected to DENIED for non-workflow payloads", () => {
    expect(proposalStatusShortLabel("rejected")).toBe("DENIED");
    expect(proposalStatusShortLabel("pending_approval")).toBe("AWAITING APPROVAL");
    expect(proposalStatusShortLabel("approved")).toBe("AUTHORIZED");
  });

  it("uses workflow phrasing for workflow.plan payloads", () => {
    const payload = { kind: "workflow.plan", steps: [], title: "x", summary: "y" };
    expect(operatorLifecycleBadgeLabel(payload, "rejected")).toBe("Workflow · denied");
    expect(operatorLifecycleBadgeLabel(payload, "pending_approval")).toBe("Workflow · awaiting approval");
  });

  it("uses short labels for other kinds", () => {
    expect(operatorLifecycleBadgeLabel({ kind: "system.note", note: "n" }, "pending_approval")).toBe(
      "AWAITING APPROVAL"
    );
  });
});
