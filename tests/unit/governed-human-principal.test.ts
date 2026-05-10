import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("resolveGovernedHumanPrincipal", () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.JARVIS_AUTH_ENABLED;
    delete process.env.JARVIS_IDENTITY_BINDING_REQUIRED;
  });

  afterEach(() => {
    delete process.env.JARVIS_AUTH_ENABLED;
    delete process.env.JARVIS_IDENTITY_BINDING_REQUIRED;
    vi.resetModules();
  });

  it("auth off → local user", async () => {
    const { resolveGovernedHumanPrincipal } = await import("@/lib/governed-human-principal");
    const r = resolveGovernedHumanPrincipal(null, false);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.principal.kind).toBe("local");
  });

  it("auth on without session → 401", async () => {
    const { resolveGovernedHumanPrincipal } = await import("@/lib/governed-human-principal");
    const r = resolveGovernedHumanPrincipal(null, true);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.status).toBe(401);
  });

  it("binding required without OIDC → 403", async () => {
    process.env.JARVIS_IDENTITY_BINDING_REQUIRED = "true";
    const { resolveGovernedHumanPrincipal } = await import("@/lib/governed-human-principal");
    const r = resolveGovernedHumanPrincipal(
      { id: "a", createdAt: Date.now() },
      true
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("identity_binding_required");
  });

  it("binding required with OIDC → bound + stable actorId", async () => {
    process.env.JARVIS_IDENTITY_BINDING_REQUIRED = "true";
    const { resolveGovernedHumanPrincipal, deriveOidcPrincipalActorId } =
      await import("@/lib/governed-human-principal");
    const session = {
      id: "s",
      createdAt: Date.now(),
      oidcIss: "https://idp.example",
      oidcSub: "user-1",
      oidcClaimsAt: Date.now(),
    };
    const r = resolveGovernedHumanPrincipal(session, true);
    expect(r.ok).toBe(true);
    if (r.ok && r.principal.kind === "bound") {
      expect(r.principal.principalIss).toBe("https://idp.example");
      expect(r.principal.principalSub).toBe("user-1");
      expect(r.principal.actorId).toBe(
        deriveOidcPrincipalActorId("https://idp.example", "user-1")
      );
    }
  });

  it("binding optional with OIDC session → still bound", async () => {
    const { resolveGovernedHumanPrincipal } = await import("@/lib/governed-human-principal");
    const session = {
      id: "s",
      createdAt: Date.now(),
      oidcIss: "https://idp.example",
      oidcSub: "user-2",
      oidcClaimsAt: Date.now(),
    };
    const r = resolveGovernedHumanPrincipal(session, true);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.principal.kind).toBe("bound");
  });
});
