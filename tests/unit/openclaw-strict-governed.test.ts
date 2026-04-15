/**
 * OpenClaw strict-governed slice — enforcement, ingress client, read path.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  assertNoUnsafeGovernedToolsInStrictMode,
  createStrictGovernedRegistry,
  GovernanceBlockError,
  GOVERNANCE_BLOCK_MESSAGE,
  strictGovernedModeEnabled,
  StrictModeViolationError,
  submitOpenClawIngress,
} from "@/openclaw-strict-governed";

const VALID_PATCH =
  "diff --git a/x b/x\n--- a/x\n+++ b/x\n@@ -1 +1 @@\n-old\n+new\n";

describe("openclaw-strict-governed", () => {
  const prevStrict = process.env.OPENCLAW_STRICT_GOVERNED;
  const prevRoot = process.env.OPENCLAW_GOVERNED_REPO_ROOT;
  const prevJarvisRoot = process.env.JARVIS_REPO_ROOT;
  let tmpRepo: string;

  beforeEach(async () => {
    tmpRepo = await fs.mkdtemp(path.join(os.tmpdir(), "openclaw-governed-"));
    process.env.OPENCLAW_GOVERNED_REPO_ROOT = tmpRepo;
    delete process.env.JARVIS_REPO_ROOT;
    await fs.writeFile(path.join(tmpRepo, "README.md"), "hello", "utf-8");
  });

  afterEach(async () => {
    process.env.OPENCLAW_STRICT_GOVERNED = prevStrict;
    process.env.OPENCLAW_GOVERNED_REPO_ROOT = prevRoot;
    process.env.JARVIS_REPO_ROOT = prevJarvisRoot;
    try {
      await fs.rm(tmpRepo, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  it("assertNoUnsafeGovernedToolsInStrictMode throws on governed-mutation in tool list", () => {
    process.env.OPENCLAW_STRICT_GOVERNED = "true";
    expect(() =>
      assertNoUnsafeGovernedToolsInStrictMode([
        { id: "readGovernedFile", classification: "read-only" },
        { id: "shell", classification: "governed-mutation" },
      ])
    ).toThrow(StrictModeViolationError);
    expect(() =>
      assertNoUnsafeGovernedToolsInStrictMode([
        { id: "bad", classification: "governed-mutation" },
      ])
    ).toThrow(/STRICT_MODE_VIOLATION/);
  });

  it("assertNoUnsafeGovernedToolsInStrictMode allows read-only and jarvis-proposal only", () => {
    process.env.OPENCLAW_STRICT_GOVERNED = "true";
    expect(() =>
      assertNoUnsafeGovernedToolsInStrictMode([
        { id: "readGovernedFile", classification: "read-only" },
        { id: "proposeCodeApply", classification: "jarvis-proposal" },
      ])
    ).not.toThrow();
  });

  it("assertNoUnsafeGovernedToolsInStrictMode is a no-op when strict mode off", () => {
    process.env.OPENCLAW_STRICT_GOVERNED = "false";
    expect(() =>
      assertNoUnsafeGovernedToolsInStrictMode([
        { id: "anything", classification: "governed-mutation" },
      ])
    ).not.toThrow();
  });

  it("strictGovernedModeEnabled is true only for OPENCLAW_STRICT_GOVERNED=true", () => {
    process.env.OPENCLAW_STRICT_GOVERNED = "true";
    expect(strictGovernedModeEnabled()).toBe(true);
    process.env.OPENCLAW_STRICT_GOVERNED = "false";
    expect(strictGovernedModeEnabled()).toBe(false);
    delete process.env.OPENCLAW_STRICT_GOVERNED;
    expect(strictGovernedModeEnabled()).toBe(false);
  });

  it("blocks applyPatchDirect in strict mode with GovernanceBlockError", async () => {
    process.env.OPENCLAW_STRICT_GOVERNED = "true";
    const reg = createStrictGovernedRegistry();
    await expect(
      reg.invoke("applyPatchDirect", {
        relativePath: "direct.txt",
        content: "bypass",
      })
    ).rejects.toThrow(GovernanceBlockError);
    try {
      await reg.invoke("applyPatchDirect", {
        relativePath: "direct.txt",
        content: "bypass",
      });
    } catch (e) {
      expect(e).toBeInstanceOf(GovernanceBlockError);
      expect((e as Error).message).toBe(GOVERNANCE_BLOCK_MESSAGE);
    }
    await expect(fs.access(path.join(tmpRepo, "direct.txt"))).rejects.toMatchObject({
      code: "ENOENT",
    });
  });

  it("allows applyPatchDirect when strict mode is off", async () => {
    process.env.OPENCLAW_STRICT_GOVERNED = "false";
    const reg = createStrictGovernedRegistry();
    const r = (await reg.invoke("applyPatchDirect", {
      relativePath: "direct.txt",
      content: "ok",
    })) as { wrote: string };
    expect(r.wrote).toContain("direct.txt");
    expect(await fs.readFile(path.join(tmpRepo, "direct.txt"), "utf-8")).toBe("ok");
  });

  it("registeredNames omits applyPatchDirect in strict mode", () => {
    process.env.OPENCLAW_STRICT_GOVERNED = "true";
    const reg = createStrictGovernedRegistry();
    expect(reg.registeredNames).toEqual(["readGovernedFile", "proposeCodeApply"]);
    process.env.OPENCLAW_STRICT_GOVERNED = "false";
    const reg2 = createStrictGovernedRegistry();
    expect(reg2.registeredNames).toContain("applyPatchDirect");
  });

  it("readGovernedFile works in strict mode", async () => {
    process.env.OPENCLAW_STRICT_GOVERNED = "true";
    const reg = createStrictGovernedRegistry();
    const r = (await reg.invoke("readGovernedFile", {
      path: "README.md",
    })) as { content: string; resolvedPath: string };
    expect(r.content).toBe("hello");
  });

  it("proposeCodeApply submits signed POST to Jarvis ingress (mocked fetch)", async () => {
    process.env.OPENCLAW_STRICT_GOVERNED = "true";
    process.env.JARVIS_INGRESS_OPENCLAW_SECRET = "x".repeat(32);
    process.env.JARVIS_BASE_URL = "http://127.0.0.1:9";

    const calls: { url: string; init: RequestInit }[] = [];
    const realFetch = globalThis.fetch;
    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();
      calls.push({ url, init: init ?? {} });
      return new Response(
        JSON.stringify({
          ok: true,
          id: "proposal-uuid",
          traceId: "trace-uuid",
          status: "pending",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    };

    try {
      const reg = createStrictGovernedRegistry();
      const result = (await reg.invoke("proposeCodeApply", {
        title: "T",
        summary: "S",
        diffText: VALID_PATCH,
        agent: "alfred",
        sourceAgentId: "openclaw-test",
      })) as { ok: boolean; proposalId: string; traceId: string; message: string };

      expect(result.ok).toBe(true);
      expect(result.proposalId).toBe("proposal-uuid");
      expect(result.traceId).toBe("trace-uuid");
      expect(result.message).toContain("Jarvis");

      expect(calls).toHaveLength(1);
      expect(calls[0].url).toContain("/api/ingress/openclaw");
      expect(calls[0].init.method).toBe("POST");
      const body = JSON.parse(String(calls[0].init.body)) as Record<string, unknown>;
      expect(body.kind).toBe("code.apply");
      expect(body.agent).toBe("alfred");
      expect(body.source).toEqual({
        connector: "openclaw",
        agentId: "openclaw-test",
      });
      expect(typeof body.patch).toBe("string");
    } finally {
      globalThis.fetch = realFetch;
    }
  });

  it("submitOpenClawIngress returns failure body on HTTP error", async () => {
    process.env.JARVIS_INGRESS_OPENCLAW_SECRET = "y".repeat(32);
    const realFetch = globalThis.fetch;
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ error: "Ingress disabled" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    try {
      const r = await submitOpenClawIngress({
        kind: "system.note",
        title: "t",
        summary: "s",
        payload: { note: "n" },
        source: { connector: "openclaw" },
      });
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.status).toBe(403);
        expect(r.error).toContain("Ingress");
      }
    } finally {
      globalThis.fetch = realFetch;
    }
  });
});
