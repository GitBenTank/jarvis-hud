/**
 * Approval preflight snapshot JSONL — append and read by approvalId.
 */
import path from "node:path";
import os from "node:os";
import { promises as fs } from "node:fs";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

const TEST_ROOT = path.join(os.tmpdir(), `jarvis-approval-snap-${Date.now()}`);
process.env.JARVIS_ROOT = TEST_ROOT;

describe("approval-preflight-snapshot-store", () => {
  beforeAll(async () => {
    await fs.mkdir(path.join(TEST_ROOT, "approval-preflight"), { recursive: true });
  });

  afterAll(async () => {
    try {
      await fs.rm(TEST_ROOT, { recursive: true });
    } catch {
      // ignore
    }
  });

  it("append then read returns exact persisted record", async () => {
    const { getDateKey } = await import("@/lib/storage");
    const dateKey = getDateKey();
    const {
      appendApprovalPreflightSnapshot,
      readApprovalPreflightSnapshotInDateKey,
    } = await import("@/lib/approval-preflight-snapshot-store");

    const record = {
      id: "snap-1",
      approvalId: "appr-99",
      traceId: "trace-99",
      capturedAt: "2026-04-11T10:00:00.000Z",
      kind: "code.apply",
      riskLevel: "high" as const,
      readiness: "will_block" as const,
      reasonDetails: [
        {
          code: "REPO_ROOT_MISSING",
          label: "Repo",
          summary: "missing",
        },
      ],
      expectedOutputs: ["Artifact"],
      notes: ["note-a"],
    };

    await appendApprovalPreflightSnapshot(dateKey, record);
    const read = await readApprovalPreflightSnapshotInDateKey(dateKey, "appr-99");
    expect(read).toEqual(record);
  });

  it("findApprovalPreflightSnapshot resolves with date hint", async () => {
    const { getDateKey } = await import("@/lib/storage");
    const dateKey = getDateKey();
    const { appendApprovalPreflightSnapshot, findApprovalPreflightSnapshot } =
      await import("@/lib/approval-preflight-snapshot-store");

    const record = {
      id: "snap-2",
      approvalId: "appr-scan",
      traceId: "t",
      capturedAt: "2026-04-11T11:00:00.000Z",
      kind: "system.note",
      riskLevel: "low" as const,
      readiness: "ready" as const,
      reasonDetails: [],
      expectedOutputs: [],
    };
    await appendApprovalPreflightSnapshot(dateKey, record);

    const byHint = await findApprovalPreflightSnapshot("appr-scan", dateKey);
    expect(byHint?.id).toBe("snap-2");
  });
});
