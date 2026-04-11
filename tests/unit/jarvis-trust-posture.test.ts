import { describe, expect, it } from "vitest";
import type { ExecutionCapabilities } from "@/lib/execution-surface";
import {
  evaluateTrustPostureForProposedKind,
  type JarvisConfigPosturePayload,
} from "@/jarvis/trust-posture";

const caps: ExecutionCapabilities = {
  nonDryRunExecuteKinds: ["code.apply"],
  dryRunDefaultForOtherKinds: true,
  invariant: "test",
};

function payload(over: Partial<JarvisConfigPosturePayload> = {}): JarvisConfigPosturePayload {
  return {
    authEnabled: false,
    ingressOpenclawEnabled: true,
    openclawAllowed: true,
    trustPosture: {
      stepUpValid: null,
      executionScopeEnforced: false,
      codeApplyBlockReasons: [],
      executionCapabilities: caps,
      executionSurfaceLabel: "MIXED · code.apply live",
    },
    ...over,
  };
}

describe("evaluateTrustPostureForProposedKind", () => {
  it("flags ingress likely rejected when OpenClaw not allowed", () => {
    const ev = evaluateTrustPostureForProposedKind(
      "system.note",
      payload({ openclawAllowed: false })
    );
    expect(ev.ingressLikelyRejected).toBe(true);
    expect(ev.messages.some((m) => /allowlisted/i.test(m))).toBe(true);
  });

  it("flags code.apply blocked when Jarvis lists block reasons", () => {
    const ev = evaluateTrustPostureForProposedKind(
      "code.apply",
      payload({
        trustPosture: {
          stepUpValid: null,
          executionScopeEnforced: false,
          codeApplyBlockReasons: ["DIRTY_WORKTREE"],
          executionCapabilities: caps,
          executionSurfaceLabel: "x",
        },
      })
    );
    expect(ev.codeApplyLikelyBlockedAtExecute).toBe(true);
    expect(ev.messages.some((m) => m.includes("DIRTY_WORKTREE"))).toBe(true);
  });

  it("flags executeRequiresStepUp when auth on and stepUp false", () => {
    const ev = evaluateTrustPostureForProposedKind(
      "system.note",
      payload({
        authEnabled: true,
        trustPosture: {
          stepUpValid: false,
          executionScopeEnforced: false,
          codeApplyBlockReasons: [],
          executionCapabilities: caps,
          executionSurfaceLabel: "x",
        },
      })
    );
    expect(ev.executeRequiresStepUp).toBe(true);
  });

  it("does not treat stepUp null as failed when auth off", () => {
    const ev = evaluateTrustPostureForProposedKind("system.note", payload());
    expect(ev.executeRequiresStepUp).toBe(false);
  });
});
