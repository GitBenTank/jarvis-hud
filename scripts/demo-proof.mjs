#!/usr/bin/env node
/**
 * Regression script: full demo loop via HTTP.
 * Run with: node scripts/demo-proof.mjs
 * Requires dev server on port 3000 (or set JARVIS_HUD_BASE_URL).
 */

const BASE = process.env.JARVIS_HUD_BASE_URL ?? "http://localhost:3000";

async function reset() {
  const res = await fetch(`${BASE}/api/reset/today`, {
    method: "POST",
    headers: { "x-jarvis-reset": "YES" },
  });
  if (!res.ok) throw new Error(`reset failed: ${res.status}`);
  return res.json();
}

async function postDraft() {
  const res = await fetch(`${BASE}/api/drafts/content`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      channel: "blog",
      title: "Demo Proof Post",
      body: "Regression test body.",
    }),
  });
  if (!res.ok) throw new Error(`post draft failed: ${res.status}`);
  return res.json();
}

async function listApprovals(status) {
  const res = await fetch(`${BASE}/api/approvals?status=${status}`);
  if (!res.ok) throw new Error(`list approvals failed: ${res.status}`);
  return res.json();
}

async function approve(id) {
  const res = await fetch(`${BASE}/api/approvals/${id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "approve" }),
  });
  if (!res.ok) throw new Error(`approve failed: ${res.status}`);
  return res.json();
}

async function execute(id) {
  const res = await fetch(`${BASE}/api/execute/${id}`, { method: "POST" });
  if (!res.ok) throw new Error(`execute failed: ${res.status}`);
  return res.json();
}

async function listActions() {
  const res = await fetch(`${BASE}/api/actions`);
  if (!res.ok) throw new Error(`list actions failed: ${res.status}`);
  return res.json();
}

async function fetchProofPath() {
  const res = await fetch(`${BASE}/api/proof-path`);
  if (!res.ok) throw new Error(`proof-path failed: ${res.status}`);
  return res.json();
}

async function main() {
  console.log(`Demo proof loop → ${BASE}`);
  const resetData = await reset();
  console.log("1. Reset OK");
  const draft = await postDraft();
  const approvalId = draft.id;
  console.log("2. Post draft OK", approvalId);
  const pending = await listApprovals("pending");
  if (!pending.approvals?.some((a) => a.id === approvalId)) {
    throw new Error("Draft not in pending approvals");
  }
  console.log("3. List approvals OK");
  await approve(approvalId);
  console.log("4. Approve OK");
  const execData = await execute(approvalId);
  const artifactPath = execData.artifactPath;
  if (!artifactPath) throw new Error("No artifact path from execute");
  console.log("5. Execute OK");
  const actions = await listActions();
  if (!actions.actions?.some((a) => a.approvalId === approvalId)) {
    throw new Error("Action not in actions log");
  }
  console.log("6. List actions OK");
  const proof = await fetchProofPath();
  if (!proof.steps?.executed) throw new Error("Proof path executed step not PASS");
  console.log("7. Proof path OK");
  console.log("");
  console.log("DEMO OK");
  console.log("Artifact:", artifactPath);
  if (proof.archivePath) {
    console.log("Archive:", proof.archivePath);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
