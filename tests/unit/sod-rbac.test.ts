import { describe, it, expect, afterEach, vi } from "vitest";
import {
  isSodEnabled,
  parseSodPrincipalList,
  assertSodApprovalAllowed,
  assertSodExecuteAllowed,
} from "@/lib/sod-rbac";
import type { GovernedHumanPrincipal } from "@/lib/governed-human-principal";

function bound(iss: string, sub: string): GovernedHumanPrincipal {
  return {
    kind: "bound",
    actorId: "oidc1:x",
    actorType: "human",
    actorLabel: sub,
    principalIss: iss,
    principalSub: sub,
  };
}

const local: GovernedHumanPrincipal = {
  kind: "local",
  actorId: "local-user",
  actorType: "human",
  actorLabel: "Local user",
};

describe("parseSodPrincipalList", () => {
  it("parses iss|sub pairs split on first pipe", () => {
    const list = parseSodPrincipalList(
      "https://idp.example|alice, https://idp.example|bob"
    );
    expect(list).toEqual([
      { iss: "https://idp.example", sub: "alice" },
      { iss: "https://idp.example", sub: "bob" },
    ]);
  });
});

describe("assertSodApprovalAllowed / assertSodExecuteAllowed", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("allows any principal when SoD is off", () => {
    vi.stubEnv("JARVIS_SOD_ENABLED", "");
    expect(assertSodApprovalAllowed(local).ok).toBe(true);
    expect(
      assertSodExecuteAllowed(local, {
        approvalPrincipalIss: "https://x",
        approvalPrincipalSub: "a",
      }).ok
    ).toBe(true);
  });

  it("rejects local principal when SoD is on", () => {
    vi.stubEnv("JARVIS_SOD_ENABLED", "true");
    vi.stubEnv(
      "JARVIS_SOD_APPROVER_PRINCIPALS",
      "https://idp.example|alice"
    );
    vi.stubEnv(
      "JARVIS_SOD_EXECUTOR_PRINCIPALS",
      "https://idp.example|bob"
    );
    const r = assertSodApprovalAllowed(local);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("sod_requires_bound_principal");
  });

  it("rejects principal not in approver map", () => {
    vi.stubEnv("JARVIS_SOD_ENABLED", "true");
    vi.stubEnv("JARVIS_SOD_APPROVER_PRINCIPALS", "https://idp.example|alice");
    vi.stubEnv("JARVIS_SOD_EXECUTOR_PRINCIPALS", "https://idp.example|bob");
    const r = assertSodApprovalAllowed(bound("https://idp.example", "carol"));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("sod_not_approver");
  });

  it("allows approver in map", () => {
    vi.stubEnv("JARVIS_SOD_ENABLED", "true");
    vi.stubEnv("JARVIS_SOD_APPROVER_PRINCIPALS", "https://idp.example|alice");
    vi.stubEnv("JARVIS_SOD_EXECUTOR_PRINCIPALS", "https://idp.example|bob");
    expect(assertSodApprovalAllowed(bound("https://idp.example", "alice")).ok).toBe(
      true
    );
  });

  it("denies same principal for execute after self-approval", () => {
    vi.stubEnv("JARVIS_SOD_ENABLED", "true");
    vi.stubEnv(
      "JARVIS_SOD_APPROVER_PRINCIPALS",
      "https://idp.example|alice,https://idp.example|bob"
    );
    vi.stubEnv(
      "JARVIS_SOD_EXECUTOR_PRINCIPALS",
      "https://idp.example|alice,https://idp.example|bob"
    );
    const r = assertSodExecuteAllowed(bound("https://idp.example", "alice"), {
      approvalPrincipalIss: "https://idp.example/",
      approvalPrincipalSub: "alice",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("sod_same_principal");
  });

  it("allows execute when executor differs from approver", () => {
    vi.stubEnv("JARVIS_SOD_ENABLED", "true");
    vi.stubEnv(
      "JARVIS_SOD_APPROVER_PRINCIPALS",
      "https://idp.example|alice"
    );
    vi.stubEnv(
      "JARVIS_SOD_EXECUTOR_PRINCIPALS",
      "https://idp.example|bob"
    );
    const r = assertSodExecuteAllowed(bound("https://idp.example", "bob"), {
      approvalPrincipalIss: "https://idp.example",
      approvalPrincipalSub: "alice",
    });
    expect(r.ok).toBe(true);
  });

  it("returns incomplete config when a role list is empty", () => {
    vi.stubEnv("JARVIS_SOD_ENABLED", "true");
    vi.stubEnv("JARVIS_SOD_APPROVER_PRINCIPALS", "https://idp.example|alice");
    vi.stubEnv("JARVIS_SOD_EXECUTOR_PRINCIPALS", "");
    expect(assertSodApprovalAllowed(bound("https://idp.example", "alice")).ok).toBe(
      false
    );
    const a = assertSodApprovalAllowed(bound("https://idp.example", "alice"));
    if (!a.ok) expect(a.status).toBe(503);
  });
});

describe("isSodEnabled", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is true only for exact env string", () => {
    vi.stubEnv("JARVIS_SOD_ENABLED", "true");
    expect(isSodEnabled()).toBe(true);
    vi.unstubAllEnvs();
    vi.stubEnv("JARVIS_SOD_ENABLED", "1");
    expect(isSodEnabled()).toBe(false);
  });
});
