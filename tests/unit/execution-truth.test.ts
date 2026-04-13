import { describe, it, expect } from "vitest";
import { deriveTraceExecutionOutcome, sortEventsForPrimaryEvent } from "@/lib/execution-truth";

describe("deriveTraceExecutionOutcome", () => {
  const baseEvent = {
    id: "e1",
    createdAt: "2026-01-01T00:00:00.000Z",
  };

  it("completed when executed without failure", () => {
    const o = deriveTraceExecutionOutcome({
      event: {
        ...baseEvent,
        approvedAt: "2026-01-01T00:01:00.000Z",
        executed: true,
        executedAt: "2026-01-01T00:02:00.000Z",
      },
      policy: { decision: "allow", rule: "kind.allowlist", reason: "ok" },
    });
    expect(o.status).toBe("completed");
    expect(o.reasonCode).toBeNull();
    expect(o.headline).toContain("successfully");
    expect(o.stage).toBe("execution");
  });

  it("blocked by policy with preflight-failed when rule is code.apply.preflight", () => {
    const o = deriveTraceExecutionOutcome({
      event: {
        ...baseEvent,
        approvedAt: "2026-01-01T00:01:00.000Z",
        executed: false,
      },
      policy: {
        decision: "deny",
        rule: "code.apply.preflight",
        reason: "dirty_worktree",
      },
    });
    expect(o.status).toBe("blocked");
    expect(o.reasonCode).toBe("preflight-failed");
    expect(o.reason).toContain("preflight-failed");
    expect(o.reason).toMatch(/uncommitted|dirty/i);
  });

  it("blocked by policy-denied for non-preflight rules", () => {
    const o = deriveTraceExecutionOutcome({
      event: {
        ...baseEvent,
        approvedAt: "2026-01-01T00:01:00.000Z",
        executed: false,
      },
      policy: {
        decision: "deny",
        rule: "step_up",
        reason: "reauthenticate_required",
      },
    });
    expect(o.status).toBe("blocked");
    expect(o.reasonCode).toBe("policy-denied");
  });

  it("failed when failedAt set", () => {
    const o = deriveTraceExecutionOutcome({
      event: {
        ...baseEvent,
        approvedAt: "2026-01-01T00:01:00.000Z",
        failedAt: "2026-01-01T00:03:00.000Z",
        executed: false,
      },
      policy: { decision: "allow", rule: "x", reason: "y" },
      action: {
        approvalId: "e1",
        status: "failed",
        summary: "adapter blew up",
      },
    });
    expect(o.status).toBe("failed");
    expect(o.reasonCode).toBe("execution-error");
    expect(o.reason).toContain("adapter blew up");
  });

  it("missing-approval when not approved", () => {
    const o = deriveTraceExecutionOutcome({
      event: { ...baseEvent, proposalStatus: "pending_approval" },
    });
    expect(o.status).toBe("blocked");
    expect(o.reasonCode).toBe("missing-approval");
  });

  it("not_applicable when rejected", () => {
    const o = deriveTraceExecutionOutcome({
      event: {
        ...baseEvent,
        rejectedAt: "2026-01-01T00:01:00.000Z",
        proposalStatus: "rejected",
      },
    });
    expect(o.status).toBe("not_applicable");
    expect(o.reasonCode).toBe("approval-rejected");
    expect(o.headline).toBe("Rejected — execution did not run");
  });

  it("pending when approved but not executed and policy allows", () => {
    const o = deriveTraceExecutionOutcome({
      event: {
        ...baseEvent,
        approvedAt: "2026-01-01T00:01:00.000Z",
        executed: false,
      },
      policy: { decision: "allow", rule: "kind.allowlist", reason: "ok" },
    });
    expect(o.status).toBe("pending");
    expect(o.headline).toBe("Awaiting execution");
  });

  it("ignores action when approvalId mismatches event", () => {
    const o = deriveTraceExecutionOutcome({
      event: {
        ...baseEvent,
        approvedAt: "t",
        failedAt: "t2",
        executed: false,
      },
      action: { approvalId: "other", status: "failed", summary: "wrong" },
    });
    expect(o.reason).not.toContain("wrong");
    expect(o.reason).toContain("execution-error");
  });
});

describe("sortEventsForPrimaryEvent", () => {
  it("orders ascending by executedAt ?? createdAt (primary = earliest)", () => {
    const sorted = sortEventsForPrimaryEvent([
      { id: "a", createdAt: "2026-01-01T00:00:00.000Z" },
      { id: "b", createdAt: "2026-01-02T00:00:00.000Z", executedAt: "2026-01-03T00:00:00.000Z" },
    ]);
    expect(sorted[0].id).toBe("a");
  });
});
