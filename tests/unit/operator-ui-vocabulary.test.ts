/**
 * Drift guard: canonical operator-facing phrases for governed execution.
 * If a test fails after an intentional copy change, update expectations here (single place).
 */
import { describe, it, expect } from "vitest";
import {
  buildDecisionReplayLine,
  PREFLIGHT_BLOCKS_EXECUTION_FALLBACK,
} from "@/lib/decision-replay";
import { deriveTraceExecutionOutcome } from "@/lib/execution-truth";

describe("operator UI vocabulary", () => {
  it("preflight fallback when no structured blocker (state only)", () => {
    expect(PREFLIGHT_BLOCKS_EXECUTION_FALLBACK).toBe("Preflight will block execution");
  });

  it("decision replay: awaiting approval", () => {
    expect(
      buildDecisionReplayLine({
        proposerLabel: "A",
        kind: "system.note",
        eventStatus: "pending",
        preflight: { loading: false, data: null },
      })
    ).toMatch(/→ awaiting approval$/);
  });

  it("decision replay: awaiting execution", () => {
    expect(
      buildDecisionReplayLine({
        proposerLabel: "A",
        kind: "system.note",
        eventStatus: "approved",
        approvalActorLabel: "Local user",
        preflight: {
          loading: false,
          data: {
            preflight: { willBlock: false, reasons: [], reasonDetails: [] },
          },
        },
      })
    ).toMatch(/→ awaiting execution$/);
  });

  it("decision replay: executed · receipt recorded", () => {
    expect(
      buildDecisionReplayLine({
        proposerLabel: "A",
        kind: "system.note",
        eventStatus: "approved",
        executed: true,
        preflight: { loading: false, data: null },
      })
    ).toMatch(/→ executed · receipt recorded$/);
  });

  it("decision replay: execution blocked wraps preflight fallback", () => {
    expect(
      buildDecisionReplayLine({
        proposerLabel: "A",
        kind: "code.apply",
        eventStatus: "approved",
        approvalActorLabel: "Local user",
        preflight: {
          loading: false,
          data: {
            preflight: { willBlock: true, reasons: [], reasonDetails: [] },
          },
        },
      })
    ).toBe(
      `A proposed code.apply → approved by Local user → execution blocked (${PREFLIGHT_BLOCKS_EXECUTION_FALLBACK})`
    );
  });

  it("decision replay: denied (no actor)", () => {
    expect(
      buildDecisionReplayLine({
        proposerLabel: "A",
        kind: "code.apply",
        eventStatus: "denied",
        preflight: { loading: false, data: null },
      })
    ).toMatch(/→ denied$/);
  });

  const baseEvent = { id: "e1", createdAt: "2026-01-01T00:00:00.000Z" };

  it("execution truth: Authorized · awaiting execution", () => {
    const o = deriveTraceExecutionOutcome({
      event: { ...baseEvent, approvedAt: "2026-01-01T00:01:00.000Z", executed: false },
      policy: { decision: "allow", rule: "kind.allowlist", reason: "ok" },
    });
    expect(o.headline).toBe("Authorized · awaiting execution");
  });

  it("execution truth: Executed · receipt recorded", () => {
    const o = deriveTraceExecutionOutcome({
      event: {
        ...baseEvent,
        approvedAt: "2026-01-01T00:01:00.000Z",
        executed: true,
        executedAt: "2026-01-01T00:02:00.000Z",
      },
      policy: { decision: "allow", rule: "kind.allowlist", reason: "ok" },
    });
    expect(o.headline).toBe("Executed · receipt recorded");
  });

  it("execution truth: Execution blocked (policy)", () => {
    const o = deriveTraceExecutionOutcome({
      event: { ...baseEvent, approvedAt: "2026-01-01T00:01:00.000Z", executed: false },
      policy: { decision: "deny", rule: "step_up", reason: "reauthenticate_required" },
    });
    expect(o.headline).toBe("Execution blocked (policy)");
  });

  it("execution truth: Execution blocked — no approval", () => {
    const o = deriveTraceExecutionOutcome({
      event: { ...baseEvent, proposalStatus: "pending_approval" },
    });
    expect(o.headline).toBe("Execution blocked — no approval recorded");
  });

  it("execution truth: Denied — execution did not run", () => {
    const o = deriveTraceExecutionOutcome({
      event: {
        ...baseEvent,
        rejectedAt: "2026-01-01T00:01:00.000Z",
        proposalStatus: "rejected",
      },
    });
    expect(o.headline).toBe("Denied — execution did not run");
  });
});
