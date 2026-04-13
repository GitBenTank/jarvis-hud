import { describe, it, expect } from "vitest";
import {
  buildDecisionReplayLine,
  firstPreflightBlockerLine,
  PREFLIGHT_BLOCKS_EXECUTION_FALLBACK,
} from "@/lib/decision-replay";

describe("firstPreflightBlockerLine", () => {
  it("prefers reasonDetails over reasons", () => {
    expect(
      firstPreflightBlockerLine({
        preflight: {
          willBlock: true,
          reasons: ["raw"],
          reasonDetails: [
            {
              code: "REPO_ROOT_MISSING",
              label: "Repo",
              summary: "missing root",
              severity: "critical",
              source: "policy",
            },
          ],
        },
      })
    ).toBe("Repo: missing root");
  });

  it("falls back to first reason string", () => {
    expect(
      firstPreflightBlockerLine({
        preflight: {
          willBlock: true,
          reasons: ["JARVIS_REPO_ROOT unset"],
          reasonDetails: [],
        },
      })
    ).toBe("JARVIS_REPO_ROOT unset");
  });

  it("falls back to canonical vocabulary when reasons and details are empty", () => {
    expect(
      firstPreflightBlockerLine({
        preflight: { willBlock: true, reasons: [], reasonDetails: [] },
      })
    ).toBe(PREFLIGHT_BLOCKS_EXECUTION_FALLBACK);
  });
});

describe("buildDecisionReplayLine", () => {
  it("pending approval", () => {
    expect(
      buildDecisionReplayLine({
        proposerLabel: "Alfred",
        kind: "code.apply",
        eventStatus: "pending",
        preflight: { loading: false, data: null },
      })
    ).toBe("Alfred proposed code.apply → awaiting approval");
  });

  it("rejected with actor", () => {
    expect(
      buildDecisionReplayLine({
        proposerLabel: "Alfred",
        kind: "code.apply",
        eventStatus: "denied",
        rejectionActorLabel: "Local user",
        preflight: { loading: false, data: null },
      })
    ).toBe("Alfred proposed code.apply → rejected by Local user");
  });

  it("approved awaiting execution when preflight ready", () => {
    expect(
      buildDecisionReplayLine({
        proposerLabel: "Alfred",
        kind: "code.apply",
        eventStatus: "approved",
        approvalActorLabel: "Local user",
        preflight: {
          loading: false,
          data: {
            preflight: { willBlock: false, reasons: [], reasonDetails: [] },
          },
        },
      })
    ).toBe("Alfred proposed code.apply → approved by Local user → awaiting execution");
  });

  it("execution blocked from preflight willBlock", () => {
    expect(
      buildDecisionReplayLine({
        proposerLabel: "Alfred",
        kind: "code.apply",
        eventStatus: "approved",
        approvalActorLabel: "Local user",
        preflight: {
          loading: false,
          data: {
            preflight: {
              willBlock: true,
              reasons: [],
              reasonDetails: [
                {
                  code: "REPO_ROOT_MISSING",
                  label: "Repo root missing",
                  summary: "JARVIS_REPO_ROOT is missing or invalid",
                  severity: "critical",
                  source: "policy",
                },
              ],
            },
          },
        },
      })
    ).toBe(
      "Alfred proposed code.apply → approved by Local user → execution blocked (Repo root missing: JARVIS_REPO_ROOT is missing or invalid)"
    );
  });

  it("checking readiness while preflight loads", () => {
    expect(
      buildDecisionReplayLine({
        proposerLabel: "Alfred",
        kind: "code.apply",
        eventStatus: "approved",
        approvalActorLabel: "Local user",
        preflight: { loading: true, data: null },
      })
    ).toBe("Alfred proposed code.apply → approved by Local user → checking execution readiness");
  });

  it("executed successfully", () => {
    expect(
      buildDecisionReplayLine({
        proposerLabel: "Alfred",
        kind: "system.note",
        eventStatus: "approved",
        executed: true,
        preflight: { loading: false, data: null },
      })
    ).toBe("Alfred proposed system.note → approved by Local user → executed successfully");
  });

  it("session execute success", () => {
    expect(
      buildDecisionReplayLine({
        proposerLabel: "Alfred",
        kind: "system.note",
        eventStatus: "approved",
        sessionExecuteSucceeded: true,
        preflight: { loading: false, data: null },
      })
    ).toBe("Alfred proposed system.note → approved by Local user → executed successfully");
  });

  it("execution failed", () => {
    expect(
      buildDecisionReplayLine({
        proposerLabel: "Alfred",
        kind: "code.apply",
        eventStatus: "approved",
        failedAt: "2026-01-01T00:00:00.000Z",
        preflight: { loading: false, data: null },
      })
    ).toBe("Alfred proposed code.apply → approved by Local user → execution failed");
  });

  it("awaiting execution when executionOutcome is pending (trace)", () => {
    expect(
      buildDecisionReplayLine({
        proposerLabel: "Alfred",
        kind: "code.apply",
        eventStatus: "approved",
        approvalActorLabel: "Local user",
        preflight: undefined,
        executionOutcome: {
          status: "pending",
          reason: "awaiting execution (use Execute when ready)",
          reasonCode: null,
        },
      })
    ).toBe("Alfred proposed code.apply → approved by Local user → awaiting execution");
  });

  it("uses executionOutcome blocked when no preflight", () => {
    expect(
      buildDecisionReplayLine({
        proposerLabel: "Alfred",
        kind: "code.apply",
        eventStatus: "approved",
        preflight: undefined,
        executionOutcome: {
          status: "blocked",
          reason: "policy-denied: step-up required",
          reasonCode: "policy-denied",
        },
      })
    ).toBe(
      "Alfred proposed code.apply → approved by Local user → execution blocked (policy-denied: step-up required)"
    );
  });

  it("awaiting execution when trace preflight omitted and no execution outcome", () => {
    expect(
      buildDecisionReplayLine({
        proposerLabel: "Alfred",
        kind: "code.apply",
        eventStatus: "approved",
        approvalActorLabel: "Local user",
        preflight: undefined,
        executionOutcome: null,
      })
    ).toBe(
      "Alfred proposed code.apply → approved by Local user → awaiting execution (readiness unknown)"
    );
  });
});
