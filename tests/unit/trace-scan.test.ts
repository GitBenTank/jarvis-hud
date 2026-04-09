/**
 * Phase 5 — trace discovery helpers (no UI).
 * JARVIS_ROOT must be set before dynamic import of `@/lib/trace-scan` (storage freezes root at load).
 */
import path from "node:path";
import os from "node:os";
import { promises as fs } from "node:fs";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { NextRequest } from "next/server";

const TEST_ROOT = path.join(os.tmpdir(), `jarvis-trace-scan-${Date.now()}`);
process.env.JARVIS_ROOT = TEST_ROOT;

describe("trace-scan", () => {
  let parseTraceUrlParam: (t: string | null | undefined) => string | null;
  let getRecentTraces: (limit: number) => Promise<
    Array<{ traceId: string; lastActivityAt: string; summary: string }>
  >;
  let listTraceScanDateKeys: () => string[];

  beforeAll(async () => {
    const mod = await import("@/lib/trace-scan");
    parseTraceUrlParam = mod.parseTraceUrlParam;
    getRecentTraces = mod.getRecentTraces;
    listTraceScanDateKeys = mod.listTraceScanDateKeys;
  });

  describe("parseTraceUrlParam", () => {
    it("returns null for empty or whitespace", () => {
      expect(parseTraceUrlParam(null)).toBeNull();
      expect(parseTraceUrlParam(undefined)).toBeNull();
      expect(parseTraceUrlParam("")).toBeNull();
      expect(parseTraceUrlParam("   ")).toBeNull();
    });

    it("trims and preserves id", () => {
      expect(parseTraceUrlParam("  abc-123  ")).toBe("abc-123");
    });
  });

  describe("getRecentTraces", () => {
    beforeAll(async () => {
      const dk = listTraceScanDateKeys()[0];
      const eventsDir = path.join(TEST_ROOT, "events");
      const actionsDir = path.join(TEST_ROOT, "actions");
      await fs.mkdir(eventsDir, { recursive: true });
      await fs.mkdir(actionsDir, { recursive: true });

      const t1 = "2020-01-01T10:00:00.000Z";
      const t2 = "2020-01-01T12:00:00.000Z";
      const t3 = "2020-01-01T14:00:00.000Z";
      const t4 = "2020-01-01T16:00:00.000Z";

      await fs.writeFile(
        path.join(eventsDir, `${dk}.json`),
        JSON.stringify(
          [
            {
              id: "evt-a",
              traceId: "trace-aaa",
              createdAt: t1,
              approvedAt: t2,
              payload: { kind: "system.note", title: "A", summary: "Summary A" },
            },
            {
              id: "evt-b",
              traceId: "trace-bbb",
              createdAt: t4,
              payload: { kind: "system.note", title: "B", summary: "Summary B" },
            },
          ],
          null,
          2
        ),
        "utf-8"
      );

      await fs.writeFile(
        path.join(actionsDir, `${dk}.jsonl`),
        `${JSON.stringify({
          id: "r1",
          traceId: "trace-aaa",
          at: t3,
          kind: "system.note",
          approvalId: "evt-a",
          status: "executed",
          summary: "r",
        })}\n`,
        "utf-8"
      );
    });

    afterAll(async () => {
      try {
        await fs.rm(TEST_ROOT, { recursive: true });
      } catch {
        // ignore
      }
    });

    it("returns traceIds sorted by last activity descending", async () => {
      const list = await getRecentTraces(10);
      expect(list[0]?.traceId).toBe("trace-bbb");
      expect(list[1]?.traceId).toBe("trace-aaa");
      expect(list[0]!.lastActivityAt > list[1]!.lastActivityAt).toBe(true);
    });

    it("respects limit cap", async () => {
      const list = await getRecentTraces(1);
      expect(list).toHaveLength(1);
    });

    it("GET /api/traces/recent returns JSON traces", async () => {
      const { GET } = await import("@/app/api/traces/recent/route");
      const res = await GET(
        new NextRequest("http://localhost/api/traces/recent?limit=5")
      );
      expect(res.status).toBe(200);
      const json = (await res.json()) as { traces?: unknown[] };
      expect(Array.isArray(json.traces)).toBe(true);
      expect(json.traces!.length).toBeGreaterThanOrEqual(2);
    });
  });
});
