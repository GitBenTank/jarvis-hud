import { describe, it, expect } from "vitest";
import {
  buildIntegrationHeadline,
  buildQueueHeadline,
  buildServerTrustOperatorHeadline,
  formatLatestLedgerPulse,
} from "@/lib/governance-headline";

describe("governance-headline", () => {
  it("formatLatestLedgerPulse prefers newer proposal over older receipt", () => {
    const line = formatLatestLedgerPulse({
      latestAction: { at: "2026-01-01T00:00:00.000Z", status: "executed", kind: "system.note" },
      latestEvent: {
        status: "pending",
        payload: { kind: "code.apply", title: "x", summary: "y", patch: "diff --git a/x b/x\n" },
        createdAt: "2026-01-02T00:00:00.000Z",
      },
    });
    expect(line).toContain("awaiting approval");
    expect(line).toContain("code.apply");
  });

  it("formatLatestLedgerPulse uses receipt when newer than proposal", () => {
    const line = formatLatestLedgerPulse({
      latestAction: { at: "2026-01-02T00:00:00.000Z", status: "executed", kind: "send_email" },
      latestEvent: {
        status: "approved",
        payload: { kind: "system.note", title: "t", summary: "s", note: "n" },
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    });
    expect(line).toContain("Latest receipt");
    expect(line).toContain("send_email");
  });

  it("formatLatestLedgerPulse maps denied and authorized", () => {
    expect(
      formatLatestLedgerPulse({
        latestAction: null,
        latestEvent: { status: "denied", payload: { kind: "system.note", title: "t", summary: "s", note: "n" } },
      })
    ).toContain("denied");
    expect(
      formatLatestLedgerPulse({
        latestAction: null,
        latestEvent: { status: "approved", payload: { kind: "system.note", title: "t", summary: "s", note: "n" } },
      })
    ).toContain("authorized");
  });

  it("buildQueueHeadline uses authorized wording", () => {
    expect(buildQueueHeadline(2, 1, 3)).toBe(
      "Queue: 2 pending · 1 authorized (not executed) · 3 executed"
    );
  });

  it("buildServerTrustOperatorHeadline surfaces ingress failure first", () => {
    expect(
      buildServerTrustOperatorHeadline({
        ingressOpenclawEnabled: false,
        openclawAllowed: true,
        authEnabled: false,
        stepUpValid: null,
        sodEnabled: false,
        sodRoleMapsReady: true,
        codeApplyBlockReasons: [],
      })
    ).toMatch(/cannot arrive/i);
  });

  it("buildIntegrationHeadline flags config blockers", () => {
    expect(
      buildIntegrationHeadline({
        ingressOpenclawEnabled: true,
        openclawAllowed: true,
        originAligned: true,
        issues: ["SECRET_INVALID"],
        healthStatus: "connected",
        healthSessionBlocked: false,
      })
    ).toMatch(/configuration errors/i);
  });
});
