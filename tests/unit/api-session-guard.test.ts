import { afterEach, describe, expect, it, vi } from "vitest";
import { SESSION_REQUIRED_JSON } from "@/lib/api-session-guard";

const SECRET = "unit-test-auth-secret-16";

describe("requireVerifiedSessionGate", () => {
  afterEach(() => {
    delete process.env.JARVIS_AUTH_ENABLED;
    delete process.env.JARVIS_AUTH_SECRET;
    vi.resetModules();
  });

  it("auth off → ok with null session", async () => {
    vi.resetModules();
    const { requireVerifiedSessionGate: gate } = await import("@/lib/api-session-guard");
    const r = gate(null);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.authEnabled).toBe(false);
      expect(r.session).toBeNull();
    }
  });

  it("auth on without cookie → 401 with stable body", async () => {
    process.env.JARVIS_AUTH_ENABLED = "true";
    process.env.JARVIS_AUTH_SECRET = SECRET;
    vi.resetModules();
    const { requireVerifiedSessionGate: gate } = await import("@/lib/api-session-guard");
    const r = gate(null);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.response.status).toBe(401);
      const body = (await r.response.json()) as typeof SESSION_REQUIRED_JSON;
      expect(body).toEqual(SESSION_REQUIRED_JSON);
    }
  });

  it("auth on with valid session cookie → ok with session", async () => {
    process.env.JARVIS_AUTH_ENABLED = "true";
    process.env.JARVIS_AUTH_SECRET = SECRET;
    vi.resetModules();
    const { createSession } = await import("@/lib/auth");
    const { cookie } = createSession();
    const { requireVerifiedSessionGate: gate } = await import("@/lib/api-session-guard");
    const r = gate(cookie);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.authEnabled).toBe(true);
      expect(r.session?.id).toBeTruthy();
    }
  });

  it("auth on invalid secret config → 500", async () => {
    process.env.JARVIS_AUTH_ENABLED = "true";
    process.env.JARVIS_AUTH_SECRET = "short";
    vi.resetModules();
    const { requireVerifiedSessionGate: gate } = await import("@/lib/api-session-guard");
    const r = gate(null);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.response.status).toBe(500);
    }
  });
});
