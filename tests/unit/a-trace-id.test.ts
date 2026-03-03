/**
 * Unit test: traceId flows from draft/event → bundle manifest → action log.
 * Uses dynamic import so JARVIS_ROOT is set before storage loads.
 */
import path from "node:path";
import os from "node:os";
import { promises as fs } from "node:fs";
import { describe, it, expect, afterAll } from "vitest";

// Set before any @/lib import loads storage
const TEST_ROOT = path.join(os.tmpdir(), `jarvis-trace-test-${Date.now()}`);
if (!process.env.JARVIS_ROOT) process.env.JARVIS_ROOT = TEST_ROOT;

describe("traceId", () => {
  afterAll(async () => {
    try {
      await fs.rm(TEST_ROOT, { recursive: true });
    } catch {
      // ignore
    }
  });

  it("writeCodeDiffBundle includes traceId in manifest", async () => {
    const { writeCodeDiffBundle } = await import("@/lib/code-diff");
    const traceId = crypto.randomUUID();
    const approvalId = crypto.randomUUID();
    const dateKey = "2026-02-25";

    await writeCodeDiffBundle({
      approvalId,
      traceId,
      dateKey,
      title: "Test diff",
      createdAt: new Date().toISOString(),
      code: { diffText: "diff", summary: "summary" },
    });

    const manifestPath = path.join(TEST_ROOT, "code-diffs", dateKey, approvalId, "manifest.json");
    const content = await fs.readFile(manifestPath, "utf-8");
    const manifest = JSON.parse(content);

    expect(manifest.traceId).toBe(traceId);
  });
});
