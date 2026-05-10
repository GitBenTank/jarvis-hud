import { describe, it, expect, afterEach, vi } from "vitest";
import {
  augmentAuditExportEvent,
  validateEventsForIdentityBindingExport,
  AuditExportIdentityIntegrityError,
  humanPrincipalsFromLifecycleFields,
} from "@/lib/audit-export-identity";

describe("validateEventsForIdentityBindingExport", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("no-ops when identity binding is not required", () => {
    vi.stubEnv("JARVIS_IDENTITY_BINDING_REQUIRED", "");
    const ev = {
      id: "e1",
      status: "approved",
      approvalActorId: "local-user",
      approvalActorType: "human",
    };
    expect(() => validateEventsForIdentityBindingExport([ev])).not.toThrow();
  });

  it("throws when binding required and human approval lacks principals", () => {
    vi.stubEnv("JARVIS_IDENTITY_BINDING_REQUIRED", "true");
    const ev = {
      id: "e1",
      status: "approved",
      approvalActorId: "local-user",
      approvalActorType: "human",
    };
    expect(() => validateEventsForIdentityBindingExport([ev])).toThrow(
      AuditExportIdentityIntegrityError
    );
  });

  it("passes when binding required and human approval has principals", () => {
    vi.stubEnv("JARVIS_IDENTITY_BINDING_REQUIRED", "true");
    const ev = {
      id: "e1",
      status: "approved",
      approvalActorId: "oidc1:iss:sub",
      approvalActorType: "human",
      approvalPrincipalIss: "https://idp.example",
      approvalPrincipalSub: "user-42",
    };
    expect(() => validateEventsForIdentityBindingExport([ev])).not.toThrow();
  });

  it("throws when binding required and human execution lacks principals", () => {
    vi.stubEnv("JARVIS_IDENTITY_BINDING_REQUIRED", "true");
    const ev = {
      id: "e1",
      status: "approved",
      approvalActorId: "oidc1:x",
      approvalActorType: "human",
      approvalPrincipalIss: "https://idp",
      approvalPrincipalSub: "u",
      executed: true,
      executionActorId: "local-user",
      executionActorType: "human",
    };
    expect(() => validateEventsForIdentityBindingExport([ev])).toThrow(
      AuditExportIdentityIntegrityError
    );
  });
});

describe("augmentAuditExportEvent / humanPrincipalsFromLifecycleFields", () => {
  it("adds humanPrincipals mirroring approval and execution slots", () => {
    const row = {
      id: "x",
      approvalActorId: "local-user",
      approvalPrincipalIss: "https://issuer",
      approvalPrincipalSub: "sub-a",
      executionActorId: "local-user",
      executionPrincipalIss: "https://issuer",
      executionPrincipalSub: "sub-e",
    };
    const out = augmentAuditExportEvent(row) as Record<string, unknown>;
    expect(out.humanPrincipals).toEqual(
      humanPrincipalsFromLifecycleFields(row as Record<string, unknown>)
    );
    const hp = out.humanPrincipals as Record<string, Record<string, string>>;
    expect(hp.approval.principalSub).toBe("sub-a");
    expect(hp.execution.principalSub).toBe("sub-e");
  });
});
