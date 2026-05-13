/**
 * B1/B2 — handlers enforce verified session when JARVIS_AUTH_ENABLED=true (defense in depth with proxy).
 */
import path from "node:path";
import os from "node:os";
import { promises as fs } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const SECRET = "unit-test-auth-secret-16";
const TEST_ROOT = path.join(os.tmpdir(), `jarvis-api-auth-${Date.now()}`);

describe("API routes + JARVIS_AUTH_ENABLED", () => {
  beforeEach(async () => {
    vi.resetModules();
    process.env.JARVIS_ROOT = TEST_ROOT;
    await fs.mkdir(path.join(TEST_ROOT, "events"), { recursive: true });
  });

  afterEach(async () => {
    delete process.env.JARVIS_AUTH_ENABLED;
    delete process.env.JARVIS_AUTH_SECRET;
    delete process.env.JARVIS_ROOT;
    vi.resetModules();
    try {
      await fs.rm(TEST_ROOT, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  });

  it("GET /api/approvals returns 401 when auth on and no cookie", async () => {
    process.env.JARVIS_AUTH_ENABLED = "true";
    process.env.JARVIS_AUTH_SECRET = SECRET;
    vi.resetModules();
    const { GET } = await import("@/app/api/approvals/route");
    const res = await GET(
      new NextRequest("http://127.0.0.1/api/approvals?status=pending")
    );
    expect(res.status).toBe(401);
    const body = (await res.json()) as { code?: string };
    expect(body.code).toBe("session_required");
  });

  it("GET /api/approvals succeeds when auth on and valid session cookie", async () => {
    process.env.JARVIS_AUTH_ENABLED = "true";
    process.env.JARVIS_AUTH_SECRET = SECRET;
    vi.resetModules();
    const { createSession } = await import("@/lib/auth");
    const { cookie } = createSession();
    const { GET } = await import("@/app/api/approvals/route");
    const res = await GET(
      new NextRequest("http://127.0.0.1/api/approvals?status=pending", {
        headers: { cookie },
      })
    );
    expect(res.status).toBe(200);
  });

  it("GET /api/actions returns 401 when auth on and no cookie", async () => {
    process.env.JARVIS_AUTH_ENABLED = "true";
    process.env.JARVIS_AUTH_SECRET = SECRET;
    vi.resetModules();
    const { GET } = await import("@/app/api/actions/route");
    const res = await GET(new NextRequest("http://127.0.0.1/api/actions"));
    expect(res.status).toBe(401);
  });
});
