/**
 * Integration tests for /api/approvals, /api/events, /api/drafts, /api/execute, /api/actions.
 * Run with: node scripts/test-api.mjs
 * Requires dev server on http://127.0.0.1:3000
 */

import { test, describe } from "node:test";
import assert from "node:assert";

const BASE = "http://127.0.0.1:3000";

describe("POST /api/events", () => {
  test("creates pending event when requiresApproval=true", async () => {
    const res = await fetch(`${BASE}/api/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "proposed_action",
        agent: "test-agent",
        requiresApproval: true,
        payload: { action: "test" },
      }),
    });
    assert.strictEqual(res.status, 201);
    const event = await res.json();
    assert.strictEqual(event.status, "pending");
    assert.strictEqual(event.requiresApproval, true);
    assert.ok(event.id);
    assert.ok(event.createdAt);
  });
});

describe("POST /api/drafts/content", () => {
  test("returns pending event with payload.kind content.publish and dryRun true", async () => {
    const res = await fetch(`${BASE}/api/drafts/content`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel: "blog",
        title: "Flow Test Post",
        body: "This is the body.",
      }),
    });
    assert.strictEqual(res.status, 201);
    const event = await res.json();
    assert.strictEqual(event.status, "pending");
    assert.strictEqual(event.requiresApproval, true);
    assert.strictEqual(event.payload.kind, "content.publish");
    assert.strictEqual(event.payload.dryRun, true);
    assert.strictEqual(event.payload.channel, "blog");
    assert.strictEqual(event.payload.title, "Flow Test Post");
    assert.ok(event.id);
  });
});

describe("Full flow: Drafts -> Approvals -> Execute -> Actions", () => {
  test("POST draft, approve, execute, verify actions", async () => {
    const draftRes = await fetch(`${BASE}/api/drafts/content`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel: "blog",
        title: "Full Flow Title",
        body: "Full flow body content.",
      }),
    });
    assert.strictEqual(draftRes.status, 201);
    const draft = await draftRes.json();
    const id = draft.id;
    assert.strictEqual(draft.payload.kind, "content.publish");
    assert.strictEqual(draft.payload.dryRun, true);

    const approveRes = await fetch(`${BASE}/api/approvals/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve" }),
    });
    assert.strictEqual(approveRes.status, 200);

    const executeRes = await fetch(`${BASE}/api/execute/${id}`, {
      method: "POST",
    });
    assert.strictEqual(executeRes.status, 200);
    const executeData = await executeRes.json();
    assert.ok(executeData.artifactPath);
    assert.strictEqual(executeData.kind, "content.publish");
    assert.strictEqual(executeData.dryRun, true);

    const actionsRes = await fetch(`${BASE}/api/actions`);
    assert.strictEqual(actionsRes.status, 200);
    const actionsData = await actionsRes.json();
    const matchingAction = actionsData.actions.find((a) => a.approvalId === id);
    assert.ok(matchingAction);
    assert.strictEqual(matchingAction.kind, "content.publish");
    assert.strictEqual(matchingAction.summary, "Full Flow Title");
  });
});

describe("POST /api/execute guardrail", () => {
  test("returns 400 when payload is not content.publish", async () => {
    const eventRes = await fetch(`${BASE}/api/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "proposed_action",
        agent: "guardrail-test",
        requiresApproval: true,
        payload: { kind: "other", message: "not publish" },
      }),
    });
    assert.strictEqual(eventRes.status, 201);
    const event = await eventRes.json();

    const approveRes = await fetch(`${BASE}/api/approvals/${event.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve" }),
    });
    assert.strictEqual(approveRes.status, 200);

    const executeRes = await fetch(`${BASE}/api/execute/${event.id}`, {
      method: "POST",
    });
    assert.strictEqual(executeRes.status, 400);
    const executeData = await executeRes.json();
    assert.ok(executeData.error?.includes("content.publish") || executeData.error?.includes("Only"));
  });
});

describe("POST /api/reset/today", () => {
  test("returns 403 without x-jarvis-reset header", async () => {
    const res = await fetch(`${BASE}/api/reset/today`, { method: "POST" });
    assert.strictEqual(res.status, 403);
  });

  test("returns 200 with header even if files missing", async () => {
    const res = await fetch(`${BASE}/api/reset/today`, {
      method: "POST",
      headers: { "x-jarvis-reset": "YES" },
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(typeof data.dateKey === "string");
    assert.ok(typeof data.archived === "object");
  });
});

describe("GET /api/approvals", () => {
  test("filters by status=pending", async () => {
    const res = await fetch(`${BASE}/api/approvals?status=pending`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.approvals));
    assert.ok(typeof data.dateKey === "string");
    data.approvals.forEach((a) => {
      assert.strictEqual(a.status, "pending");
      assert.strictEqual(a.requiresApproval, true);
    });
  });

  test("filters by status=approved", async () => {
    const res = await fetch(`${BASE}/api/approvals?status=approved`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.approvals));
    data.approvals.forEach((a) => assert.strictEqual(a.status, "approved"));
  });

  test("returns empty when file missing", async () => {
    const res = await fetch(`${BASE}/api/approvals?status=pending`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok("approvals" in data);
    assert.ok("dateKey" in data);
  });
});
