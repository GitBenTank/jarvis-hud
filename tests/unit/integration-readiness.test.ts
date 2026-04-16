/**
 * OpenClaw integration readiness — config + stale health signal.
 */
import path from "node:path";
import os from "node:os";
import { promises as fs } from "node:fs";
import { describe, it, expect, vi, afterEach } from "vitest";

const TEST_ROOT = path.join(os.tmpdir(), `jarvis-integration-readiness-${Date.now()}`);
process.env.JARVIS_ROOT = TEST_ROOT;

describe("hasIntegrationConfigBlocker", () => {
  it("is true when any config blocker is present", async () => {
    const { hasIntegrationConfigBlocker } = await import("@/lib/integration-readiness-ui");
    expect(hasIntegrationConfigBlocker(["INGRESS_DISABLED"])).toBe(true);
    expect(hasIntegrationConfigBlocker(["SECRET_INVALID"])).toBe(true);
    expect(hasIntegrationConfigBlocker(["ALLOWLIST_OPENCLAW"])).toBe(true);
    expect(
      hasIntegrationConfigBlocker(["SECRET_INVALID", "OPENCLAW_STALE"])
    ).toBe(true);
  });

  it("is false for OPENCLAW_STALE alone", async () => {
    const { hasIntegrationConfigBlocker } = await import("@/lib/integration-readiness-ui");
    expect(hasIntegrationConfigBlocker(["OPENCLAW_STALE"])).toBe(false);
  });
});

describe("computeIntegrationIssues", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns INGRESS_DISABLED when ingress env is not true", async () => {
    vi.stubEnv("JARVIS_INGRESS_OPENCLAW_ENABLED", "false");
    const { computeIntegrationIssues } = await import("@/lib/integration-readiness");
    const issues = await computeIntegrationIssues();
    expect(issues).toEqual(["INGRESS_DISABLED"]);
  });

  it("returns SECRET_INVALID when ingress on but secret missing", async () => {
    vi.stubEnv("JARVIS_INGRESS_OPENCLAW_ENABLED", "true");
    vi.stubEnv("JARVIS_INGRESS_OPENCLAW_SECRET", "");
    vi.stubEnv("JARVIS_INGRESS_ALLOWLIST_CONNECTORS", "openclaw");
    const { computeIntegrationIssues } = await import("@/lib/integration-readiness");
    const issues = await computeIntegrationIssues();
    expect(issues).toEqual(["SECRET_INVALID"]);
  });

  it("returns ALLOWLIST_OPENCLAW when openclaw not in allowlist", async () => {
    vi.stubEnv("JARVIS_INGRESS_OPENCLAW_ENABLED", "true");
    vi.stubEnv("JARVIS_INGRESS_OPENCLAW_SECRET", "01234567890123456789012345678901");
    vi.stubEnv("JARVIS_INGRESS_ALLOWLIST_CONNECTORS", "other");
    const { computeIntegrationIssues } = await import("@/lib/integration-readiness");
    const issues = await computeIntegrationIssues();
    expect(issues).toEqual(["ALLOWLIST_OPENCLAW"]);
  });

  it("returns empty when config ok and no proposals yet (cold start)", async () => {
    vi.stubEnv("JARVIS_INGRESS_OPENCLAW_ENABLED", "true");
    vi.stubEnv("JARVIS_INGRESS_OPENCLAW_SECRET", "01234567890123456789012345678901");
    vi.stubEnv("JARVIS_INGRESS_ALLOWLIST_CONNECTORS", "openclaw");
    const { computeIntegrationIssues } = await import("@/lib/integration-readiness");
    const issues = await computeIntegrationIssues();
    expect(issues).toEqual([]);
  });

  it("returns OPENCLAW_STALE when last proposal is older than stale window", async () => {
    vi.stubEnv("JARVIS_INGRESS_OPENCLAW_ENABLED", "true");
    vi.stubEnv("JARVIS_INGRESS_OPENCLAW_SECRET", "01234567890123456789012345678901");
    vi.stubEnv("JARVIS_INGRESS_ALLOWLIST_CONNECTORS", "openclaw");

    const { getDateKey, getEventsFilePath } = await import("@/lib/storage");
    const dk = getDateKey();
    const fp = getEventsFilePath(dk);
    await fs.mkdir(path.dirname(fp), { recursive: true });
    const stale = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    await fs.writeFile(
      fp,
      JSON.stringify(
        [
          {
            id: "x",
            traceId: "t",
            type: "proposed_action",
            createdAt: stale,
            source: { connector: "openclaw", receivedAt: stale },
            payload: { kind: "system.note", title: "t", summary: "s" },
          },
        ],
        null,
        2
      ),
      "utf-8"
    );

    const { computeIntegrationIssues } = await import("@/lib/integration-readiness");
    const issues = await computeIntegrationIssues();
    expect(issues).toEqual(["OPENCLAW_STALE"]);
  });
});
