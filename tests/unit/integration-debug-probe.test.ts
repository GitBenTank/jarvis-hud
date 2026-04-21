import { describe, it, expect, afterEach, vi } from "vitest";

describe("integration-debug-probe", () => {
  afterEach(() => {
    delete process.env.JARVIS_DEBUG_INTEGRATION;
    vi.resetModules();
  });

  it("isIntegrationDebugEnabled is true for 1 and true", async () => {
    process.env.JARVIS_DEBUG_INTEGRATION = "1";
    vi.resetModules();
    let { isIntegrationDebugEnabled } = await import("@/lib/integration-debug-probe");
    expect(isIntegrationDebugEnabled()).toBe(true);

    process.env.JARVIS_DEBUG_INTEGRATION = "true";
    vi.resetModules();
    ({ isIntegrationDebugEnabled } = await import("@/lib/integration-debug-probe"));
    expect(isIntegrationDebugEnabled()).toBe(true);
  });

  it("isIntegrationDebugEnabled is false when unset", async () => {
    delete process.env.JARVIS_DEBUG_INTEGRATION;
    vi.resetModules();
    const { isIntegrationDebugEnabled } = await import("@/lib/integration-debug-probe");
    expect(isIntegrationDebugEnabled()).toBe(false);
  });
});
