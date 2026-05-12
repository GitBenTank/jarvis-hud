import { describe, expect, it } from "vitest";
import { shouldOpenActivityDiagnosticsDisclosure } from "@/lib/activity-diagnostics-disclosure-open";

describe("shouldOpenActivityDiagnosticsDisclosure", () => {
  it("opens when integration issues non-empty", () => {
    expect(
      shouldOpenActivityDiagnosticsDisclosure({
        integrationIssues: ["INGRESS_DISABLED"],
        ingressOpenclawEnabled: true,
        openclawAllowed: true,
        authEnabled: false,
      })
    ).toBe(true);
  });

  it("closed when healthy minimal payload", () => {
    expect(
      shouldOpenActivityDiagnosticsDisclosure({
        integrationIssues: [],
        ingressOpenclawEnabled: true,
        openclawAllowed: true,
        authEnabled: false,
        trustPosture: {},
        runtimePosture: { latestBlockReason: null },
      })
    ).toBe(false);
  });

  it("opens when ingress not enabled", () => {
    expect(
      shouldOpenActivityDiagnosticsDisclosure({
        integrationIssues: [],
        ingressOpenclawEnabled: false,
        openclawAllowed: true,
      })
    ).toBe(true);
  });

  it("opens when openclaw not allowlisted", () => {
    expect(
      shouldOpenActivityDiagnosticsDisclosure({
        integrationIssues: [],
        ingressOpenclawEnabled: true,
        openclawAllowed: false,
      })
    ).toBe(true);
  });

  it("opens when auth on and step-up invalid", () => {
    expect(
      shouldOpenActivityDiagnosticsDisclosure({
        integrationIssues: [],
        ingressOpenclawEnabled: true,
        openclawAllowed: true,
        authEnabled: true,
        trustPosture: { stepUpValid: false },
      })
    ).toBe(true);
  });

  it("does not open for step-up null when auth on (cookieless / N/A)", () => {
    expect(
      shouldOpenActivityDiagnosticsDisclosure({
        integrationIssues: [],
        ingressOpenclawEnabled: true,
        openclawAllowed: true,
        authEnabled: true,
        trustPosture: { stepUpValid: null },
      })
    ).toBe(false);
  });

  it("opens when SoD enabled but role maps not ready", () => {
    expect(
      shouldOpenActivityDiagnosticsDisclosure({
        integrationIssues: [],
        ingressOpenclawEnabled: true,
        openclawAllowed: true,
        authEnabled: false,
        trustPosture: {
          sodEnabled: true,
          sodRoleMapsReady: false,
        },
      })
    ).toBe(true);
  });

  it("opens when runtime has latest policy block reason", () => {
    expect(
      shouldOpenActivityDiagnosticsDisclosure({
        integrationIssues: [],
        ingressOpenclawEnabled: true,
        openclawAllowed: true,
        authEnabled: false,
        runtimePosture: { latestBlockReason: "policy denied" },
      })
    ).toBe(true);
  });

  it("opens when control UI probe failed", () => {
    expect(
      shouldOpenActivityDiagnosticsDisclosure({
        integrationIssues: [],
        ingressOpenclawEnabled: true,
        openclawAllowed: true,
        authEnabled: false,
        openclawControlUiProbe: { ok: false, ms: 100, error: "timeout" },
      })
    ).toBe(true);
  });

  it("opens on malformed top-level (pessimistic)", () => {
    expect(shouldOpenActivityDiagnosticsDisclosure(null)).toBe(true);
    expect(shouldOpenActivityDiagnosticsDisclosure("x")).toBe(true);
  });
});
