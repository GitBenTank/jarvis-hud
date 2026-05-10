import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const SECRET = "x".repeat(32);

describe("auth session OIDC (S1)", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.JARVIS_AUTH_ENABLED = "true";
    process.env.JARVIS_AUTH_SECRET = SECRET;
    delete process.env.JARVIS_IDENTITY_BINDING_REQUIRED;
  });

  afterEach(() => {
    delete process.env.JARVIS_AUTH_ENABLED;
    delete process.env.JARVIS_AUTH_SECRET;
    delete process.env.JARVIS_IDENTITY_BINDING_REQUIRED;
    vi.resetModules();
  });

  it("bound session survives cookie round-trip", async () => {
    const auth = await import("@/lib/auth");
    const { session } = auth.createSession();
    const { cookie: boundCookie } = auth.bindOidcToSession(
      session,
      "https://id.example.com",
      "user-sub-1"
    );
    const cookiePair = boundCookie.split(";")[0] ?? "";
    const read = auth.getSessionFromCookie(cookiePair);
    expect(read?.oidcIss).toBe("https://id.example.com");
    expect(read?.oidcSub).toBe("user-sub-1");
    expect(typeof read?.oidcClaimsAt).toBe("number");
    expect(read?.id).toBe(session.id);
  });

  it("rejects cookie with partial OIDC fields (fail closed)", async () => {
    const auth = await import("@/lib/auth");
    const { session } = auth.createSession();
    const tampered = {
      ...session,
      oidcIss: "https://id.example.com",
      oidcSub: "",
      oidcClaimsAt: Date.now(),
    };
    const { createHmac } = await import("node:crypto");
    const secret = process.env.JARVIS_AUTH_SECRET ?? "";
    const payload = Buffer.from(JSON.stringify(tampered), "utf-8").toString("base64url");
    const sig = createHmac("sha256", secret).update(payload, "utf8").digest("base64url");
    const token = `${payload}.${sig}`;
    const header = `jarvis_session=${encodeURIComponent(token)}`;
    expect(auth.getSessionFromCookie(header)).toBeNull();
  });

  it("step-up precondition fails when identity binding required and OIDC absent", async () => {
    process.env.JARVIS_IDENTITY_BINDING_REQUIRED = "true";
    const auth = await import("@/lib/auth");
    const { session } = auth.createSession();
    expect(() => auth.assertIdentityBindingForStepUp(session)).toThrow(auth.IdentityBindingError);
  });

  it("step-up precondition passes when binding required after stub bind", async () => {
    process.env.JARVIS_IDENTITY_BINDING_REQUIRED = "true";
    const auth = await import("@/lib/auth");
    const { session } = auth.createSession();
    const { session: bound } = auth.bindOidcToSession(
      session,
      "https://issuer.example",
      "sub-abc"
    );
    expect(() => auth.assertIdentityBindingForStepUp(bound)).not.toThrow();
  });
});
