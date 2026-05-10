import path from "node:path";
import os from "node:os";
import { promises as fs } from "node:fs";
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";

const TEST_ROOT = path.join(os.tmpdir(), `jarvis-trace-replay-${Date.now()}`);

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

describe("assembleTraceReplay", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("surfaces approval and execution OIDC principals on approval and execution blocks", async () => {
    const { getEventsFilePath, getActionsFilePath } = await import("@/lib/storage");
    const { listTraceScanDateKeys } = await import("@/lib/trace-scan");
    const { assembleTraceReplay } = await import("@/lib/trace-replay");

    const dk = listTraceScanDateKeys()[0];
    await fs.mkdir(path.join(TEST_ROOT, "events"), { recursive: true });
    await fs.mkdir(path.join(TEST_ROOT, "actions"), { recursive: true });

    const traceId = "trace-replay-principals";
    const eventRow = {
      id: "evt-replay-1",
      traceId,
      status: "approved",
      createdAt: "2026-05-09T10:00:00.000Z",
      agent: "openclaw",
      actorId: "openclaw",
      actorType: "agent" as const,
      payload: { kind: "system.note", summary: "s", title: "t" },
      approvalActorId: "oidc1:https://issuer:bob",
      approvalActorType: "human" as const,
      approvalPrincipalIss: "https://issuer",
      approvalPrincipalSub: "bob",
      executed: true,
      executedAt: "2026-05-09T10:05:00.000Z",
      executionActorId: "oidc1:https://issuer:bob",
      executionActorType: "human" as const,
      executionPrincipalIss: "https://issuer",
      executionPrincipalSub: "bob",
    };

    await fs.writeFile(
      getEventsFilePath(dk),
      JSON.stringify([eventRow], null, 2),
      "utf-8"
    );

    await fs.writeFile(
      getActionsFilePath(dk),
      JSON.stringify({
        id: "rec-r1",
        traceId,
        approvalId: "evt-replay-1",
        at: "2026-05-09T10:05:01.000Z",
        kind: "system.note",
        status: "executed",
        summary: "done",
        actors: {
          proposer: { actorId: "openclaw", actorType: "agent" },
          approver: { actorId: "oidc1:https://issuer:bob", actorType: "human" },
          executor: { actorId: "oidc1:https://issuer:bob", actorType: "human" },
        },
      }) + "\n",
      "utf-8"
    );

    const replay = await assembleTraceReplay(traceId);
    expect(replay).not.toBeNull();
    if (!replay) return;

    const approval = replay.approval as Record<string, unknown>;
    expect(approval.approvalPrincipalIss).toBe("https://issuer");
    expect(approval.approvalPrincipalSub).toBe("bob");
    expect(approval.executionPrincipalIss).toBe("https://issuer");
    expect(approval.executionPrincipalSub).toBe("bob");
    const hp = approval.humanPrincipals as Record<string, Record<string, string>>;
    expect(hp.approval.principalSub).toBe("bob");
    expect(hp.execution.principalSub).toBe("bob");

    const execution = replay.execution as Record<string, unknown>;
    expect(execution.executionPrincipalIss).toBe("https://issuer");
    expect(execution.executionPrincipalSub).toBe("bob");
  });

  it("throws when identity binding is required and stored human lacks principals", async () => {
    vi.stubEnv("JARVIS_IDENTITY_BINDING_REQUIRED", "true");
    const { getEventsFilePath, getActionsFilePath } = await import("@/lib/storage");
    const { listTraceScanDateKeys } = await import("@/lib/trace-scan");
    const { assembleTraceReplay } = await import("@/lib/trace-replay");
    const { AuditExportIdentityIntegrityError } = await import(
      "@/lib/audit-export-identity"
    );

    const dk = listTraceScanDateKeys()[0];
    await fs.mkdir(path.join(TEST_ROOT, "events"), { recursive: true });
    await fs.mkdir(path.join(TEST_ROOT, "actions"), { recursive: true });

    const traceId = "trace-replay-bind-fail";
    const eventRow = {
      id: "evt-replay-bad",
      traceId,
      status: "approved",
      createdAt: "2026-05-09T11:00:00.000Z",
      agent: "openclaw",
      actorId: "openclaw",
      actorType: "agent" as const,
      payload: { kind: "system.note", summary: "s", title: "t" },
      approvalActorId: "local-user",
      approvalActorType: "human" as const,
    };

    await fs.writeFile(
      getEventsFilePath(dk),
      JSON.stringify([eventRow], null, 2),
      "utf-8"
    );
    await fs.writeFile(
      getActionsFilePath(dk),
      JSON.stringify({
        id: "rec-bad",
        traceId,
        approvalId: "evt-replay-bad",
        at: "2026-05-09T11:00:01.000Z",
        kind: "system.note",
        status: "executed",
        summary: "x",
      }) + "\n",
      "utf-8"
    );

    await expect(assembleTraceReplay(traceId)).rejects.toThrow(
      AuditExportIdentityIntegrityError
    );
  });

  it("includes sodOperatorNotes when policy log contains sod deny", async () => {
    const { getEventsFilePath, getActionsFilePath, getPolicyDecisionsFilePath } =
      await import("@/lib/storage");
    const { listTraceScanDateKeys } = await import("@/lib/trace-scan");
    const { assembleTraceReplay } = await import("@/lib/trace-replay");

    const dk = listTraceScanDateKeys()[0];
    await fs.mkdir(path.join(TEST_ROOT, "events"), { recursive: true });
    await fs.mkdir(path.join(TEST_ROOT, "actions"), { recursive: true });
    await fs.mkdir(path.join(TEST_ROOT, "policy-decisions"), { recursive: true });

    const traceId = "trace-sod-notes";
    const eventRow = {
      id: "evt-sod-notes",
      traceId,
      status: "approved",
      createdAt: "2026-05-09T10:00:00.000Z",
      agent: "openclaw",
      actorId: "openclaw",
      actorType: "agent" as const,
      payload: { kind: "system.note", summary: "s", title: "t" },
    };

    await fs.writeFile(
      getEventsFilePath(dk),
      JSON.stringify([eventRow], null, 2),
      "utf-8"
    );

    await fs.writeFile(
      getActionsFilePath(dk),
      JSON.stringify({
        id: "rec-sod",
        traceId,
        approvalId: "evt-sod-notes",
        at: "2026-05-09T10:05:00.000Z",
        kind: "system.note",
        status: "executed",
        summary: "x",
      }) + "\n",
      "utf-8"
    );

    await fs.appendFile(
      getPolicyDecisionsFilePath(dk),
      JSON.stringify({
        traceId,
        decision: "deny",
        rule: "sod.same_principal",
        reason: "sod_same_principal",
        timestamp: "2026-05-09T10:04:00.000Z",
      }) + "\n",
      "utf-8"
    );

    const replay = await assembleTraceReplay(traceId);
    expect(replay?.sodOperatorNotes?.some((n) => n.includes("same bound principal"))).toBe(
      true
    );
  });
});
