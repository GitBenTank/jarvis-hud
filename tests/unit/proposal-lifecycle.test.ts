import { describe, it, expect } from "vitest";
import {
  normalizeProposalLifecycle,
  isPendingApproval,
  isApprovedAwaitingExecution,
  isExecuted,
  isRejected,
} from "@/lib/proposal-lifecycle";

describe("proposal-lifecycle", () => {
  describe("normalizeProposalLifecycle", () => {
    it("maps executed=true to proposalStatus executed", () => {
      const n = normalizeProposalLifecycle({
        id: "1",
        agent: "x",
        payload: {},
        status: "approved",
        createdAt: "2025-01-01T00:00:00Z",
        executed: true,
        executedAt: "2025-01-01T00:01:00Z",
      });
      expect(n.proposalStatus).toBe("executed");
      expect(n.executedAt).toBe("2025-01-01T00:01:00Z");
    });

    it("maps status=approved and !executed to approved", () => {
      const n = normalizeProposalLifecycle({
        id: "2",
        agent: "x",
        payload: {},
        status: "approved",
        createdAt: "2025-01-01T00:00:00Z",
      });
      expect(n.proposalStatus).toBe("approved");
    });

    it("maps status=denied to rejected", () => {
      const n = normalizeProposalLifecycle({
        id: "3",
        agent: "x",
        payload: {},
        status: "denied",
        createdAt: "2025-01-01T00:00:00Z",
      });
      expect(n.proposalStatus).toBe("rejected");
    });

    it("maps status=pending to pending_approval", () => {
      const n = normalizeProposalLifecycle({
        id: "4",
        agent: "x",
        payload: {},
        status: "pending",
        createdAt: "2025-01-01T00:00:00Z",
      });
      expect(n.proposalStatus).toBe("pending_approval");
    });

    it("preserves proposalStatus=executing when status=approved", () => {
      const n = normalizeProposalLifecycle({
        id: "5",
        agent: "x",
        payload: {},
        status: "approved",
        proposalStatus: "executing",
        createdAt: "2025-01-01T00:00:00Z",
      });
      expect(n.proposalStatus).toBe("executing");
    });

    it("preserves proposalStatus=failed", () => {
      const n = normalizeProposalLifecycle({
        id: "6",
        agent: "x",
        payload: {},
        status: "approved",
        proposalStatus: "failed",
        failedAt: "2025-01-01T00:02:00Z",
        createdAt: "2025-01-01T00:00:00Z",
      });
      expect(n.proposalStatus).toBe("failed");
    });

    it("uses updatedAt as fallback for createdAt", () => {
      const n = normalizeProposalLifecycle({
        id: "7",
        agent: "x",
        payload: {},
        status: "approved",
        executed: true,
        updatedAt: "2025-01-01T00:01:00Z",
      } as { id: string; agent: string; payload: object; status: string; executed: boolean; updatedAt: string });
      expect(n.executedAt).toBe("2025-01-01T00:01:00Z");
    });
  });

  describe("isPendingApproval", () => {
    it("returns true for pending_approval", () => {
      expect(
        isPendingApproval({
          id: "1",
          agent: "x",
          payload: {},
          status: "pending",
          createdAt: "",
        })
      ).toBe(true);
    });

    it("returns false for executed", () => {
      expect(
        isPendingApproval({
          id: "1",
          agent: "x",
          payload: {},
          status: "approved",
          createdAt: "",
          executed: true,
        })
      ).toBe(false);
    });
  });

  describe("isApprovedAwaitingExecution", () => {
    it("returns true for approved and not executed", () => {
      expect(
        isApprovedAwaitingExecution({
          id: "1",
          agent: "x",
          payload: {},
          status: "approved",
          createdAt: "",
        })
      ).toBe(true);
    });

    it("returns false for executed", () => {
      expect(
        isApprovedAwaitingExecution({
          id: "1",
          agent: "x",
          payload: {},
          status: "approved",
          createdAt: "",
          executed: true,
        })
      ).toBe(false);
    });
  });

  describe("isExecuted", () => {
    it("returns true when executed=true", () => {
      expect(
        isExecuted({
          id: "1",
          agent: "x",
          payload: {},
          status: "approved",
          createdAt: "",
          executed: true,
        })
      ).toBe(true);
    });
  });

  describe("isRejected", () => {
    it("returns true when status=denied", () => {
      expect(
        isRejected({
          id: "1",
          agent: "x",
          payload: {},
          status: "denied",
          createdAt: "",
        })
      ).toBe(true);
    });
  });
});
