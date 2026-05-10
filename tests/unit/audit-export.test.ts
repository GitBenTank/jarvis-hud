import path from "node:path";
import os from "node:os";
import { promises as fs } from "node:fs";
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";

const TEST_ROOT = path.join(os.tmpdir(), `jarvis-audit-export-${Date.now()}`);

beforeAll(async () => {
  process.env.JARVIS_ROOT = TEST_ROOT;
});

afterAll(async () => {
  try {
    await fs.rm(TEST_ROOT, { recursive: true });
  } catch {
    // ignore
  }
});

describe("validateAuditDateRange", () => {
  it("rejects missing params", async () => {
    const { validateAuditDateRange } = await import("@/lib/audit-export");
    const r = validateAuditDateRange(null, "2026-01-01");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("missing_params");
  });

  it("rejects invalid date format", async () => {
    const { validateAuditDateRange } = await import("@/lib/audit-export");
    const r = validateAuditDateRange("01-02-2026", "2026-01-02");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("invalid_start_date");
  });

  it("rejects inverted range", async () => {
    const { validateAuditDateRange } = await import("@/lib/audit-export");
    const r = validateAuditDateRange("2026-01-10", "2026-01-01");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("inverted_range");
  });

  it("accepts single day", async () => {
    const { validateAuditDateRange } = await import("@/lib/audit-export");
    const r = validateAuditDateRange("2026-04-01", "2026-04-01");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.dateKeys).toEqual(["2026-04-01"]);
      expect(r.start).toBe("2026-04-01");
      expect(r.end).toBe("2026-04-01");
    }
  });

  it("rejects range over max days", async () => {
    const {
      validateAuditDateRange,
      nextDateKey,
      AUDIT_EXPORT_MAX_RANGE_DAYS,
    } = await import("@/lib/audit-export");
    const start = "2026-01-01";
    let end = start;
    for (let i = 0; i < AUDIT_EXPORT_MAX_RANGE_DAYS; i++) {
      end = nextDateKey(end);
    }
    const r = validateAuditDateRange(start, end);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("range_too_large");
  });
});

describe("buildAuditExportBundle", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("aggregates events and receipts with linkage and actors preserved", async () => {
    const { getEventsFilePath, getActionsFilePath } = await import("@/lib/storage");
    const {
      validateAuditDateRange,
      buildAuditExportBundle,
    } = await import("@/lib/audit-export");

    const dk = "2026-04-09";
    const eventsDir = path.join(TEST_ROOT, "events");
    const actionsDir = path.join(TEST_ROOT, "actions");
    await fs.mkdir(eventsDir, { recursive: true });
    await fs.mkdir(actionsDir, { recursive: true });

    const eventRow = {
      id: "evt-audit-1",
      traceId: "trace-audit-1",
      status: "approved",
      actorId: "openclaw",
      actorType: "agent",
      approvalActorId: "local-user",
      approvalActorType: "human",
    };
    await fs.writeFile(
      getEventsFilePath(dk),
      JSON.stringify([eventRow], null, 2),
      "utf-8"
    );

    const receiptRow = {
      id: "rec-1",
      traceId: "trace-audit-1",
      approvalId: "evt-audit-1",
      at: "2026-04-09T12:00:00.000Z",
      kind: "system.note",
      status: "executed",
      summary: "x",
      actors: {
        proposer: { actorId: "openclaw", actorType: "agent" },
        approver: { actorId: "local-user", actorType: "human" },
        executor: { actorId: "local-user", actorType: "human" },
      },
    };
    await fs.writeFile(
      getActionsFilePath(dk),
      JSON.stringify(receiptRow) + "\n",
      "utf-8"
    );

    const v = validateAuditDateRange(dk, dk);
    expect(v.ok).toBe(true);
    if (!v.ok) throw new Error("validation failed");

    const bundle = await buildAuditExportBundle(v);

    expect(bundle.summary.events).toBe(1);
    expect(bundle.summary.receipts).toBe(1);
    expect(bundle.summary.traces).toBe(1);
    expect(bundle.index.traceIds).toContain("trace-audit-1");
    expect(bundle.index.approvalIds).toContain("evt-audit-1");

    const ev = bundle.events[0] as Record<string, unknown>;
    expect(ev.id).toBe("evt-audit-1");
    expect(ev.traceId).toBe("trace-audit-1");
    expect(ev.actorId).toBe("openclaw");

    const rec = bundle.receipts[0] as Record<string, unknown>;
    expect(rec.approvalId).toBe("evt-audit-1");
    expect(rec.traceId).toBe("trace-audit-1");
    const actors = rec.actors as Record<string, Record<string, string>>;
    expect(actors.proposer.actorId).toBe("openclaw");

    const hp = ev.humanPrincipals as Record<string, Record<string, string>>;
    expect(hp.approval.actorId).toBe("local-user");
    expect(hp.approval.principalIss).toBeUndefined();
  });

  it("rejects bundle when identity binding is required and approval lacks principals", async () => {
    vi.stubEnv("JARVIS_IDENTITY_BINDING_REQUIRED", "true");
    const { getEventsFilePath, getActionsFilePath } = await import("@/lib/storage");
    const {
      validateAuditDateRange,
      buildAuditExportBundle,
    } = await import("@/lib/audit-export");

    const dk = "2026-04-10";
    await fs.mkdir(path.join(TEST_ROOT, "events"), { recursive: true });
    await fs.mkdir(path.join(TEST_ROOT, "actions"), { recursive: true });

    const eventRow = {
      id: "evt-bind-bad",
      traceId: "trace-bind-bad",
      status: "approved",
      approvalActorId: "local-user",
      approvalActorType: "human",
    };
    await fs.writeFile(
      getEventsFilePath(dk),
      JSON.stringify([eventRow], null, 2),
      "utf-8"
    );
    await fs.writeFile(
      getActionsFilePath(dk),
      JSON.stringify({
        id: "r1",
        traceId: "trace-bind-bad",
        approvalId: "evt-bind-bad",
        at: "2026-04-10T12:00:00.000Z",
        kind: "system.note",
        status: "executed",
        summary: "x",
      }) + "\n",
      "utf-8"
    );

    const v = validateAuditDateRange(dk, dk);
    expect(v.ok).toBe(true);
    if (!v.ok) throw new Error("validation failed");

    await expect(buildAuditExportBundle(v)).rejects.toThrow(/approvalPrincipalIss/);
  });

  it("includes bound principals in humanPrincipals when binding is required", async () => {
    vi.stubEnv("JARVIS_IDENTITY_BINDING_REQUIRED", "true");
    const { getEventsFilePath, getActionsFilePath } = await import("@/lib/storage");
    const {
      validateAuditDateRange,
      buildAuditExportBundle,
    } = await import("@/lib/audit-export");

    const dk = "2026-04-11";
    await fs.mkdir(path.join(TEST_ROOT, "events"), { recursive: true });
    await fs.mkdir(path.join(TEST_ROOT, "actions"), { recursive: true });

    const eventRow = {
      id: "evt-bind-ok",
      traceId: "trace-bind-ok",
      status: "approved",
      approvalActorId: "oidc1:https://issuer:alice",
      approvalActorType: "human",
      approvalPrincipalIss: "https://issuer",
      approvalPrincipalSub: "alice",
    };
    await fs.writeFile(
      getEventsFilePath(dk),
      JSON.stringify([eventRow], null, 2),
      "utf-8"
    );
    await fs.writeFile(
      getActionsFilePath(dk),
      JSON.stringify({
        id: "r2",
        traceId: "trace-bind-ok",
        approvalId: "evt-bind-ok",
        at: "2026-04-11T12:00:00.000Z",
        kind: "system.note",
        status: "executed",
        summary: "x",
      }) + "\n",
      "utf-8"
    );

    const v = validateAuditDateRange(dk, dk);
    expect(v.ok).toBe(true);
    if (!v.ok) throw new Error("validation failed");

    const bundle = await buildAuditExportBundle(v);
    const ev = bundle.events[0] as Record<string, unknown>;
    const hp = ev.humanPrincipals as Record<string, Record<string, string>>;
    expect(hp.approval.principalSub).toBe("alice");
  });

  it("includes sodOperatorGuide when JARVIS_SOD_ENABLED is true", async () => {
    vi.stubEnv("JARVIS_SOD_ENABLED", "true");
    const { getEventsFilePath } = await import("@/lib/storage");
    const {
      validateAuditDateRange,
      buildAuditExportBundle,
    } = await import("@/lib/audit-export");
    const dk = "2026-04-12";
    await fs.mkdir(path.join(TEST_ROOT, "events"), { recursive: true });
    await fs.mkdir(path.join(TEST_ROOT, "actions"), { recursive: true });
    await fs.writeFile(getEventsFilePath(dk), "[]", "utf-8");
    const v = validateAuditDateRange(dk, dk);
    expect(v.ok).toBe(true);
    if (!v.ok) throw new Error("validation failed");
    const bundle = await buildAuditExportBundle(v);
    expect(bundle.sodOperatorGuide?.join(" ")).toContain("humanPrincipals");
  });
});
