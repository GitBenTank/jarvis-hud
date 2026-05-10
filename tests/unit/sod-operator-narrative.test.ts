import { describe, it, expect } from "vitest";
import {
  sodPolicyDecisionToOperatorNote,
  collectSodOperatorNotesFromPolicyDecisions,
  buildSodPrincipalSplitNoteFromLifecycle,
  parsePolicyDecisionRows,
} from "@/lib/sod-operator-narrative";
import type { PolicyDecisionEntry } from "@/lib/policy-decision-log";
import { buildExecutionTraceView } from "@/lib/execution-trace-view";
import type { TraceReplayResult } from "@/lib/trace-replay";

function row(
  partial: Partial<PolicyDecisionEntry> & Pick<PolicyDecisionEntry, "traceId" | "rule" | "reason">
): PolicyDecisionEntry {
  return {
    decision: "deny",
    timestamp: "2026-05-09T12:00:00.000Z",
    ...partial,
  };
}

describe("sodPolicyDecisionToOperatorNote", () => {
  it("maps sod.same_principal", () => {
    const n = sodPolicyDecisionToOperatorNote(
      row({ traceId: "t", rule: "sod.same_principal", reason: "sod_same_principal" })
    );
    expect(n).toContain("same bound principal");
  });

  it("ignores allow rows", () => {
    expect(
      sodPolicyDecisionToOperatorNote({
        traceId: "t",
        decision: "allow",
        rule: "sod.x",
        reason: "x",
        timestamp: "2026-05-09T12:00:00.000Z",
      })
    ).toBeNull();
  });
});

describe("buildSodPrincipalSplitNoteFromLifecycle", () => {
  it("describes different principals when executed", () => {
    const n = buildSodPrincipalSplitNoteFromLifecycle({
      executed: true,
      approvalPrincipalIss: "https://idp.example",
      approvalPrincipalSub: "alice",
      executionPrincipalIss: "https://idp.example/",
      executionPrincipalSub: "bob",
    });
    expect(n).toContain("different OIDC subjects");
  });

  it("describes same principal when executed", () => {
    const n = buildSodPrincipalSplitNoteFromLifecycle({
      executed: true,
      approvalPrincipalIss: "https://idp.example",
      approvalPrincipalSub: "alice",
      executionPrincipalIss: "https://idp.example",
      executionPrincipalSub: "alice",
    });
    expect(n).toContain("same OIDC subject");
  });

  it("returns null when principals incomplete", () => {
    expect(
      buildSodPrincipalSplitNoteFromLifecycle({
        executed: true,
        approvalPrincipalIss: "https://x",
        approvalPrincipalSub: "a",
      })
    ).toBeNull();
  });
});

describe("parsePolicyDecisionRows", () => {
  it("parses valid rows and skips junk", () => {
    const out = parsePolicyDecisionRows([
      { traceId: "t1", decision: "deny", rule: "sod.same_principal", reason: "x", timestamp: "2026-01-01T00:00:00.000Z" },
      { bad: true },
      { traceId: "t2", decision: "nope", rule: "r", reason: "", timestamp: "2026-01-01T00:00:00.000Z" },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].rule).toBe("sod.same_principal");
  });
});

describe("collectSodOperatorNotesFromPolicyDecisions", () => {
  it("dedupes repeated sod denials", () => {
    const notes = collectSodOperatorNotesFromPolicyDecisions([
      row({ traceId: "t", rule: "sod.same_principal", reason: "sod_same_principal" }),
      row({ traceId: "t", rule: "sod.same_principal", reason: "sod_same_principal" }),
    ]);
    expect(notes).toHaveLength(1);
  });
});

describe("buildExecutionTraceView + sodOperatorNotes", () => {
  it("appends sod operator lines to resultSummary", () => {
    const replay: TraceReplayResult = {
      traceId: "trace-1",
      dateKey: "2026-05-09",
      proposal: {
        id: "e1",
        kind: "system.note",
        summary: "test",
        createdAt: "2026-05-09T10:00:00.000Z",
      },
      approval: {
        status: "approved",
        approvedAt: "2026-05-09T10:01:00.000Z",
        executed: false,
      },
      policyDecisions: [],
      execution: null,
      receipts: [
        {
          id: "r1",
          traceId: "trace-1",
          at: "2026-05-09T10:02:00.000Z",
          kind: "system.note",
          approvalId: "e1",
          status: "executed",
          summary: "done",
        },
      ],
      reconciliation: [],
      sodOperatorNotes: ["SoD: execution was denied because the same bound principal cannot approve and execute this proposal while separation of duties is enabled."],
    };
    const vm = buildExecutionTraceView(replay);
    expect(vm?.resultSummary).toContain("same bound principal");
  });
});
