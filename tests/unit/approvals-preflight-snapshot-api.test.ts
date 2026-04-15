/**
 * POST /api/approvals/[id] persists approvalPreflightSnapshot to JSONL when provided.
 */
import path from "node:path";
import os from "node:os";
import { promises as fs } from "node:fs";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { NextRequest } from "next/server";

const TEST_ROOT = path.join(os.tmpdir(), `jarvis-approval-api-${Date.now()}`);
process.env.JARVIS_ROOT = TEST_ROOT;

describe("POST /api/approvals/[id] approvalPreflightSnapshot", () => {
  beforeAll(async () => {
    await fs.mkdir(path.join(TEST_ROOT, "events"), { recursive: true });
  });

  afterAll(async () => {
    try {
      await fs.rm(TEST_ROOT, { recursive: true });
    } catch {
      // ignore
    }
  });

  it("persists snapshot matching wire and rejects invalid kind before mutating event", async () => {
    const { getDateKey, getEventsFilePath, getApprovalPreflightSnapshotPath, writeJson, readJson } =
      await import("@/lib/storage");
    const dateKey = getDateKey();
    const approvalId = "evt-preflight-snap-1";
    const traceId = "trace-pf-1";

    const pending = {
      id: approvalId,
      traceId,
      type: "proposed_action" as const,
      agent: "alfred",
      payload: { kind: "system.note", title: "T", summary: "S", note: "n" },
      requiresApproval: true as const,
      status: "pending" as const,
      createdAt: "2026-04-11T12:00:00.000Z",
    };
    await writeJson(getEventsFilePath(dateKey), [pending]);

    const wire = {
      kind: "system.note",
      riskLevel: "low" as const,
      readiness: "ready" as const,
      reasonDetails: [] as { code: string; label: string; summary: string }[],
      expectedOutputs: ["Artifact", "Receipt log entry"],
      notes: ["ui-note"],
    };

    const { POST } = await import("@/app/api/approvals/[id]/route");
    const bad = await POST(
      new NextRequest(`http://localhost/api/approvals/${approvalId}`, {
        method: "POST",
        body: JSON.stringify({
          action: "approve",
          approvalPreflightSnapshot: { ...wire, kind: "code.apply" },
        }),
        headers: { "content-type": "application/json" },
      }),
      { params: Promise.resolve({ id: approvalId }) }
    );
    expect(bad.status).toBe(400);
    const stillPending = await readJson<typeof pending[]>(getEventsFilePath(dateKey));
    expect(stillPending?.[0].status).toBe("pending");

    const ok = await POST(
      new NextRequest(`http://localhost/api/approvals/${approvalId}`, {
        method: "POST",
        body: JSON.stringify({ action: "approve", approvalPreflightSnapshot: wire }),
        headers: { "content-type": "application/json" },
      }),
      { params: Promise.resolve({ id: approvalId }) }
    );
    expect(ok.status).toBe(200);

    const snapPath = getApprovalPreflightSnapshotPath(dateKey);
    const raw = await fs.readFile(snapPath, "utf-8");
    const line = raw.trim().split("\n").at(-1);
    expect(line).toBeTruthy();
    const row = JSON.parse(line!) as Record<string, unknown>;
    expect(row.approvalId).toBe(approvalId);
    expect(row.traceId).toBe(traceId);
    expect(row.kind).toBe("system.note");
    expect(row.readiness).toBe("ready");
    expect(row.riskLevel).toBe("low");
    expect(row.expectedOutputs).toEqual(wire.expectedOutputs);
    expect(row.notes).toEqual(["ui-note"]);
    expect(typeof row.id).toBe("string");
    expect(typeof row.capturedAt).toBe("string");
  });

  it("approve without snapshot does not create approval-preflight file line requirement", async () => {
    const { getDateKey, getEventsFilePath, writeJson } = await import("@/lib/storage");
    const dateKey = getDateKey();
    const approvalId = "evt-no-snap";
    const pending = {
      id: approvalId,
      type: "proposed_action" as const,
      agent: "a",
      payload: { kind: "system.note", title: "T", summary: "S", note: "n" },
      requiresApproval: true as const,
      status: "pending" as const,
      createdAt: "2026-04-11T12:00:00.000Z",
    };
    await writeJson(getEventsFilePath(dateKey), [pending]);

    const { POST } = await import("@/app/api/approvals/[id]/route");
    const res = await POST(
      new NextRequest(`http://localhost/api/approvals/${approvalId}`, {
        method: "POST",
        body: JSON.stringify({ action: "approve" }),
        headers: { "content-type": "application/json" },
      }),
      { params: Promise.resolve({ id: approvalId }) }
    );
    expect(res.status).toBe(200);

    const { findApprovalPreflightSnapshot } = await import("@/lib/approval-preflight-snapshot-store");
    const snap = await findApprovalPreflightSnapshot(approvalId, dateKey);
    expect(snap).toBeNull();
  });
});
