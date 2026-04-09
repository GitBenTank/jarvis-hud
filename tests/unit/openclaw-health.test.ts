/**
 * OpenClaw connector health — route shape and core logic (light).
 */
import path from "node:path";
import os from "node:os";
import { promises as fs } from "node:fs";
import { describe, it, expect, vi, afterEach } from "vitest";

const TEST_ROOT = path.join(os.tmpdir(), `jarvis-openclaw-health-${Date.now()}`);
process.env.JARVIS_ROOT = TEST_ROOT;

describe("computeOpenClawHealth", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns disconnected when ingress disabled", async () => {
    vi.stubEnv("JARVIS_INGRESS_OPENCLAW_ENABLED", "false");
    const { computeOpenClawHealth } = await import("@/lib/openclaw-health");
    const h = await computeOpenClawHealth();
    expect(h.status).toBe("disconnected");
    expect(h.lastSeenAt).toBeNull();
    expect(h.lastError).toMatch(/disabled/i);
  });

  it("returns degraded when secret missing but ingress enabled", async () => {
    vi.stubEnv("JARVIS_INGRESS_OPENCLAW_ENABLED", "true");
    vi.stubEnv("JARVIS_INGRESS_OPENCLAW_SECRET", "");
    vi.stubEnv("JARVIS_INGRESS_ALLOWLIST_CONNECTORS", "openclaw");
    const { computeOpenClawHealth } = await import("@/lib/openclaw-health");
    const h = await computeOpenClawHealth();
    expect(h.status).toBe("degraded");
    expect(h.lastError).toMatch(/secret/i);
  });

  it("returns connected when recent openclaw event exists and config ok", async () => {
    vi.stubEnv("JARVIS_INGRESS_OPENCLAW_ENABLED", "true");
    vi.stubEnv("JARVIS_INGRESS_OPENCLAW_SECRET", "01234567890123456789012345678901");
    vi.stubEnv("JARVIS_INGRESS_ALLOWLIST_CONNECTORS", "openclaw");

    const { getDateKey, getEventsFilePath } = await import("@/lib/storage");
    const dk = getDateKey();
    const fp = getEventsFilePath(dk);
    await fs.mkdir(path.dirname(fp), { recursive: true });
    const now = new Date().toISOString();
    await fs.writeFile(
      fp,
      JSON.stringify(
        [
          {
            id: "x",
            traceId: "t",
            type: "proposed_action",
            createdAt: now,
            source: { connector: "openclaw", receivedAt: now },
            payload: { kind: "system.note", title: "t", summary: "s" },
          },
        ],
        null,
        2
      ),
      "utf-8"
    );

    const { computeOpenClawHealth } = await import("@/lib/openclaw-health");
    const h = await computeOpenClawHealth();
    expect(h.status).toBe("connected");
    expect(h.lastSeenAt).toBeTruthy();
    expect(h.lastProposalAt).toBe(h.lastSeenAt);
  });
});

describe("GET /api/connectors/openclaw/health", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns JSON with required shape", async () => {
    vi.stubEnv("JARVIS_INGRESS_OPENCLAW_ENABLED", "false");
    const { GET } = await import(
      "@/app/api/connectors/openclaw/health/route"
    );
    const res = await GET();
    expect(res.status).toBe(200);
    const json = (await res.json()) as Record<string, unknown>;
    expect(["connected", "degraded", "disconnected"]).toContain(json.status);
    expect(json).toHaveProperty("lastSeenAt");
    if (json.lastSeenAt !== null) {
      expect(typeof json.lastSeenAt).toBe("string");
    }
  });
});
