/**
 * Unit tests for OpenClaw connector ingress v1
 */
import path from "node:path";
import os from "node:os";
import { createHmac } from "node:crypto";
import { promises as fs } from "node:fs";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";

// Set JARVIS_ROOT before any @/lib imports that use storage
const TEST_ROOT = path.join(os.tmpdir(), `jarvis-ingress-test-${Date.now()}`);
process.env.JARVIS_ROOT = TEST_ROOT;

const SECRET = "a".repeat(32);
const VALID_BODY = {
  kind: "system.note",
  title: "Test note",
  summary: "Test summary",
  payload: { note: "body" },
  source: { connector: "openclaw" },
};

function sign(secret: string, timestamp: string, nonce: string, rawBody: string): string {
  const message = `${timestamp}.${nonce}.${rawBody}`;
  return createHmac("sha256", secret).update(message, "utf8").digest("hex");
}

async function createRequest(opts: {
  body?: object;
  timestamp?: string;
  nonce?: string;
  signature?: string;
  headers?: Record<string, string>;
}) {
  const rawBody = JSON.stringify(opts.body ?? VALID_BODY);
  const timestamp = opts.timestamp ?? String(Date.now());
  const nonce = opts.nonce ?? crypto.randomUUID();
  const sig = opts.signature ?? sign(SECRET, timestamp, nonce, rawBody);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Jarvis-Timestamp": timestamp,
    "X-Jarvis-Nonce": nonce,
    "X-Jarvis-Signature": sig,
    ...opts.headers,
  };

  return new Request("http://localhost/api/ingress/openclaw", {
    method: "POST",
    headers,
    body: rawBody,
  });
}

describe("POST /api/ingress/openclaw", () => {
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

  beforeEach(async () => {
    process.env.JARVIS_INGRESS_OPENCLAW_ENABLED = "true";
    process.env.JARVIS_INGRESS_OPENCLAW_SECRET = SECRET;
    process.env.JARVIS_INGRESS_ALLOWLIST_CONNECTORS = "openclaw";
    const { getNonceCache } = await import("@/lib/nonce-cache");
    const { getIngressRateLimiter } = await import("@/lib/rate-limit");
    getNonceCache().reset();
    getIngressRateLimiter().reset();
  });

  it("returns 403 when ingress disabled", async () => {
    process.env.JARVIS_INGRESS_OPENCLAW_ENABLED = "false";
    const { POST } = await import("@/app/api/ingress/openclaw/route");
    const req = await createRequest({});
    const res = await POST(req as import("next/server").NextRequest);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe("Ingress disabled");
  });

  it("returns 403 when secret missing", async () => {
    process.env.JARVIS_INGRESS_OPENCLAW_SECRET = "";
    const { POST } = await import("@/app/api/ingress/openclaw/route");
    const req = await createRequest({});
    const res = await POST(req as import("next/server").NextRequest);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toContain("secret");
  });

  it("returns 403 when secret too short", async () => {
    process.env.JARVIS_INGRESS_OPENCLAW_SECRET = "short";
    const { POST } = await import("@/app/api/ingress/openclaw/route");
    const req = await createRequest({});
    const res = await POST(req as import("next/server").NextRequest);
    expect(res.status).toBe(403);
  });

  it("returns 401 when signature invalid", async () => {
    const { POST } = await import("@/app/api/ingress/openclaw/route");
    const req = await createRequest({ signature: "0".repeat(64) });
    const res = await POST(req as import("next/server").NextRequest);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toContain("signature");
  });

  it("returns 401 when timestamp out of window (too old)", async () => {
    const oldTs = String(Date.now() - 10 * 60 * 1000); // 10 min ago
    const { POST } = await import("@/app/api/ingress/openclaw/route");
    const req = await createRequest({ timestamp: oldTs });
    const res = await POST(req as import("next/server").NextRequest);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toContain("Timestamp");
  });

  it("returns 401 when timestamp out of window (too far future)", async () => {
    const futureTs = String(Date.now() + 5 * 60 * 1000); // 5 min future
    const { POST } = await import("@/app/api/ingress/openclaw/route");
    const req = await createRequest({ timestamp: futureTs });
    const res = await POST(req as import("next/server").NextRequest);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toContain("Timestamp");
  });

  it("returns 409 on nonce replay (second request with same nonce)", async () => {
    const nonce = crypto.randomUUID();
    const { POST } = await import("@/app/api/ingress/openclaw/route");
    const req1 = await createRequest({ nonce });
    const res1 = await POST(req1 as import("next/server").NextRequest);
    expect(res1.status).toBe(200);

    const req2 = await createRequest({ nonce });
    const res2 = await POST(req2 as import("next/server").NextRequest);
    expect(res2.status).toBe(409);
    const json = await res2.json();
    expect(json.error).toContain("replay");
  });

  it("returns 200 and writes pending event with correct shape", async () => {
    const { POST } = await import("@/app/api/ingress/openclaw/route");
    const { getDateKey, getEventsFilePath, readJson } = await import("@/lib/storage");

    const req = await createRequest({});
    const res = await POST(req as import("next/server").NextRequest);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.status).toBe("pending");
    expect(json.id).toBeDefined();
    expect(json.traceId).toBeDefined();
    expect(typeof json.id).toBe("string");
    expect(typeof json.traceId).toBe("string");

    const dateKey = getDateKey();
    const filePath = getEventsFilePath(dateKey);
    const events = await readJson<unknown[]>(filePath);
    expect(events).not.toBeNull();
    const written = (events ?? []).find((e: { id?: string }) => e.id === json.id);
    expect(written).toBeDefined();

    const ev = written as Record<string, unknown>;
    expect(ev.status).toBe("pending");
    expect(ev.requiresApproval).toBe(true);
    expect(ev.traceId).toBe(json.traceId);
    expect(ev.source).toBeDefined();
    const src = ev.source as Record<string, unknown>;
    expect(src.connector).toBe("openclaw");
    expect(src.verified).toBe(true);
    expect(src.nonce).toBeDefined();
    expect(src.timestamp).toBeDefined();
    expect(ev.trustedIngress).toBeDefined();
    const ti = ev.trustedIngress as Record<string, unknown>;
    expect(ti.ok).toBe(true);
  });

  it("returns 403 when connector not in allowlist", async () => {
    process.env.JARVIS_INGRESS_ALLOWLIST_CONNECTORS = "other-connector";
    const { POST } = await import("@/app/api/ingress/openclaw/route");
    const req = await createRequest({});
    const res = await POST(req as import("next/server").NextRequest);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toContain("allowlist");
  });

  it("returns 400 when headers missing", async () => {
    const { POST } = await import("@/app/api/ingress/openclaw/route");
    const req = new Request("http://localhost/api/ingress/openclaw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(VALID_BODY),
    });
    const res = await POST(req as import("next/server").NextRequest);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("headers");
  });

  it("returns 400 when body missing required fields", async () => {
    const { POST } = await import("@/app/api/ingress/openclaw/route");
    const badBody = { kind: "system.note", title: "x" }; // missing summary, payload, source
    const req = await createRequest({ body: badBody });
    const res = await POST(req as import("next/server").NextRequest);
    expect(res.status).toBe(400);
  });

  it("returns 429 when rate limit exceeded (61st request from same IP)", async () => {
    const { POST } = await import("@/app/api/ingress/openclaw/route");
    const testIp = "192.168.1.100";
    const reqWithIp = async () => {
      const req = await createRequest({
        headers: { "X-Forwarded-For": testIp },
      });
      return POST(req as import("next/server").NextRequest);
    };

    for (let i = 0; i < 60; i++) {
      const res = await reqWithIp();
      expect(res.status).toBe(200);
    }

    const res61 = await reqWithIp();
    expect(res61.status).toBe(429);
    const json = await res61.json();
    expect(json.error).toBe("Rate limit exceeded");
    expect(res61.headers.get("Retry-After")).toBeDefined();
  });
});
