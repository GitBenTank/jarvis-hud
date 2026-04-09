import { describe, expect, it } from "vitest";
import {
  validateExecutionPreconditions,
  type ExecutionGateEvent,
} from "@/lib/execution-gate";

const baseApproved: ExecutionGateEvent = {
  id: "approval-1",
  traceId: "trace-uuid-1",
  status: "approved",
  requiresApproval: true,
  executed: false,
  actorId: "openclaw",
  actorType: "agent",
  approvalActorId: "local-user",
  approvalActorType: "human",
};

describe("validateExecutionPreconditions", () => {
  it("returns ok with traceId when chain is valid", () => {
    const r = validateExecutionPreconditions({
      event: baseApproved,
      approvalId: "approval-1",
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.traceId).toBe("trace-uuid-1");
  });

  it("uses event.id as traceId when traceId omitted", () => {
    const ev = { ...baseApproved, traceId: undefined };
    const r = validateExecutionPreconditions({
      event: ev,
      approvalId: "approval-1",
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.traceId).toBe("approval-1");
  });

  it("proposal_not_found when event missing", () => {
    const r = validateExecutionPreconditions({
      event: null,
      approvalId: "x",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.code).toBe("proposal_not_found");
      expect(r.status).toBe(404);
    }
  });

  it("proposal_not_found when id mismatch", () => {
    const r = validateExecutionPreconditions({
      event: baseApproved,
      approvalId: "wrong-id",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("proposal_not_found");
  });

  it("proposal_not_approved when pending", () => {
    const r = validateExecutionPreconditions({
      event: { ...baseApproved, status: "pending" },
      approvalId: "approval-1",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("proposal_not_approved");
  });

  it("missing_approval when requiresApproval false", () => {
    const r = validateExecutionPreconditions({
      event: { ...baseApproved, requiresApproval: false },
      approvalId: "approval-1",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("missing_approval");
  });

  it("already_executed when executed true", () => {
    const r = validateExecutionPreconditions({
      event: { ...baseApproved, executed: true },
      approvalId: "approval-1",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("already_executed");
  });

  it("missing_trace_id when traceId and id empty", () => {
    const r = validateExecutionPreconditions({
      event: {
        ...baseApproved,
        traceId: "",
        id: "",
      },
      approvalId: "",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("missing_trace_id");
  });

  it("missing_trace_id when trace resolves empty", () => {
    const r = validateExecutionPreconditions({
      event: {
        ...baseApproved,
        traceId: "   ",
      },
      approvalId: "approval-1",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("missing_trace_id");
  });

  it("missing_actor_chain without proposer actorId", () => {
    const r = validateExecutionPreconditions({
      event: { ...baseApproved, actorId: undefined },
      approvalId: "approval-1",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("missing_actor_chain");
  });

  it("missing_actor_chain without proposer actorType", () => {
    const r = validateExecutionPreconditions({
      event: { ...baseApproved, actorType: undefined },
      approvalId: "approval-1",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("missing_actor_chain");
  });

  it("missing_approval_actor without approver", () => {
    const r = validateExecutionPreconditions({
      event: { ...baseApproved, approvalActorId: undefined },
      approvalId: "approval-1",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("missing_approval_actor");
  });
});
