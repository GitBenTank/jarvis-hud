/**
 * Unit tests for Trace View v1:
 * - readActionLogByTraceId filters JSONL by traceId
 * - GET /api/traces/[traceId] returns 404 when traceId not found
 */
import path from "node:path";
import os from "node:os";
import { promises as fs } from "node:fs";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

// Set JARVIS_ROOT before any @/lib imports
const TEST_ROOT = path.join(os.tmpdir(), `jarvis-trace-view-test-${Date.now()}`);
process.env.JARVIS_ROOT = TEST_ROOT;

async function ensureDir(p: string) {
  await fs.mkdir(p, { recursive: true });
}

describe("readActionLogByTraceId", () => {
  const dateKey = "2026-02-25";
  let actionsDir: string;
  let actionsPath: string;

  beforeAll(async () => {
    actionsDir = path.join(TEST_ROOT, "actions");
    actionsPath = path.join(actionsDir, `${dateKey}.jsonl`);
    await ensureDir(actionsDir);
  });

  afterAll(async () => {
    try {
      await fs.rm(TEST_ROOT, { recursive: true });
    } catch {
      // ignore
    }
  });

  it("filters JSONL entries by traceId", async () => {
    const traceA = "trace-aaa-111";
    const traceB = "trace-bbb-222";
    const lines = [
      JSON.stringify({
        id: "a1",
        traceId: traceA,
        at: "2026-02-25T10:00:00.000Z",
        kind: "code.apply",
        approvalId: "evt-1",
        status: "executed",
        summary: "Apply A",
      }),
      JSON.stringify({
        id: "a2",
        traceId: traceB,
        at: "2026-02-25T11:00:00.000Z",
        kind: "code.diff",
        approvalId: "evt-2",
        status: "executed",
        summary: "Diff B",
      }),
      JSON.stringify({
        id: "a3",
        traceId: traceA,
        at: "2026-02-25T12:00:00.000Z",
        kind: "system.note",
        approvalId: "evt-1",
        status: "executed",
        summary: "Note A",
      }),
    ];
    await fs.writeFile(actionsPath, lines.join("\n") + "\n", "utf-8");

    const { readActionLogByTraceId } = await import("@/lib/action-log");

    const resultA = await readActionLogByTraceId(dateKey, traceA);
    expect(resultA).toHaveLength(2);
    expect(resultA.map((e) => e.id)).toEqual(["a1", "a3"]);
    expect(resultA.every((e) => e.traceId === traceA)).toBe(true);

    const resultB = await readActionLogByTraceId(dateKey, traceB);
    expect(resultB).toHaveLength(1);
    expect(resultB[0].id).toBe("a2");

    const resultNone = await readActionLogByTraceId(dateKey, "trace-nonexistent");
    expect(resultNone).toHaveLength(0);
  });

  it("returns empty array when actions file does not exist", async () => {
    const { readActionLogByTraceId } = await import("@/lib/action-log");
    const result = await readActionLogByTraceId("2099-01-01", "any-trace");
    expect(result).toEqual([]);
  });
});

describe("GET /api/traces/[traceId]", () => {
  beforeAll(async () => {
    await ensureDir(path.join(TEST_ROOT, "events"));
    await ensureDir(path.join(TEST_ROOT, "actions"));
  });

  afterAll(async () => {
    try {
      await fs.rm(TEST_ROOT, { recursive: true });
    } catch {
      // ignore
    }
  });

  it("returns 404 with clear message when traceId not found", async () => {
    const { GET } = await import("@/app/api/traces/[traceId]/route");
    const traceId = "00000000-0000-0000-0000-000000000000";

    const response = await GET(
      new Request("http://localhost/api/traces/00000000-0000-0000-0000-000000000000"),
      { params: Promise.resolve({ traceId }) }
    );

    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json.error).toBe("Trace not found");
    expect(json.traceId).toBe(traceId);
  });

  it("returns 400 when traceId is empty", async () => {
    const { GET } = await import("@/app/api/traces/[traceId]/route");

    const response = await GET(
      new Request("http://localhost/api/traces/"),
      { params: Promise.resolve({ traceId: "" }) }
    );

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toContain("traceId");
  });

  it("returns agent, builder, provider, and model on trace events when present on disk", async () => {
    const { getDateKey, getEventsFilePath, readJson, writeJson } = await import("@/lib/storage");
    const traceId = "trace-agent-builder-test";
    const dateKey = getDateKey();
    const filePath = getEventsFilePath(dateKey);
    const ev = {
      id: "evt-ab-1",
      traceId,
      type: "proposed_action",
      agent: "alfred",
      builder: "forge",
      provider: "openai",
      model: "openai/gpt-4o",
      payload: {
        kind: "system.note",
        title: "Demo",
        summary: "Hello",
        note: "x",
      },
      requiresApproval: true,
      status: "pending",
      createdAt: "2026-04-02T12:00:00.000Z",
      actorId: "alfred",
      actorType: "agent",
      actorLabel: "alfred",
    };
    const prior = await readJson<Record<string, unknown>[]>(filePath);
    await writeJson(filePath, [...(prior ?? []), ev]);

    const { GET } = await import("@/app/api/traces/[traceId]/route");
    const response = await GET(
      new Request(`http://localhost/api/traces/${traceId}`),
      { params: Promise.resolve({ traceId }) }
    );

    expect(response.status).toBe(200);
    const json = (await response.json()) as {
      events: Array<{ agent?: string; builder?: string; provider?: string; model?: string }>;
    };
    expect(json.events).toHaveLength(1);
    expect(json.events[0].agent).toBe("alfred");
    expect(json.events[0].builder).toBe("forge");
    expect(json.events[0].provider).toBe("openai");
    expect(json.events[0].model).toBe("openai/gpt-4o");
  });
});
