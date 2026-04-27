/**
 * Regenerate README screenshots for the OpenClaw → approval → execution story.
 *
 * 1. Seeds `.readme-screenshots-jarvis/` (today’s events + one receipt line).
 * 2. Starts Next on README_SCREENSHOT_PORT (default 3099) with that JARVIS_ROOT
 *    and OpenClaw ingress env (demo secret only).
 * 3. Captures: Activity (connector trust) → pending card → approval modal → receipts.
 *
 * Or: README_SCREENSHOT_SKIP_SERVER=1 with `pnpm dev` already running and
 * JARVIS_ROOT pointing at the seeded workspace (run seed first via same script
 * with only seed — we don't split; skip spawn uses env JARVIS_ROOT from user).
 *
 * For skip mode: run once without skip to seed, then set JARVIS_ROOT to
 * `.readme-screenshots-jarvis` and README_SCREENSHOT_SKIP_SERVER=1 README_SCREENSHOT_BASE_URL=http://127.0.0.1:3000
 *
 * Default one-shot: `pnpm screenshots:readme`
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const workspace = path.join(root, ".readme-screenshots-jarvis");
const marketing = path.join(root, "docs", "marketing");
const port = process.env.README_SCREENSHOT_PORT || "3099";
const baseUrl =
  process.env.README_SCREENSHOT_BASE_URL || `http://127.0.0.1:${port}`;
const skipServer = process.env.README_SCREENSHOT_SKIP_SERVER === "1";

function getDateKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function seedWorkspace(dateKey, nowIso) {
  fs.rmSync(workspace, { recursive: true, force: true });
  fs.mkdirSync(path.join(workspace, "events"), { recursive: true });
  fs.mkdirSync(path.join(workspace, "actions"), { recursive: true });

  const tracePending = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const traceApproved = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
  const traceExecuted = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

  const basePayload = {
    kind: "system.note",
    title: "OpenClaw proposal (demo)",
    summary: "Sanitized OpenClaw → Jarvis pending item",
    payload: { note: "Demonstration only. No live agent." },
    meta: { version: "readme-demo" },
  };

  const events = [
    {
      id: "11111111-1111-4111-8111-111111111111",
      traceId: tracePending,
      type: "proposed_action",
      agent: "openclaw-demo",
      payload: { ...basePayload },
      requiresApproval: true,
      status: "pending",
      proposalStatus: "pending_approval",
      createdAt: nowIso,
      source: {
        connector: "openclaw",
        receivedAt: nowIso,
        verified: true,
        nonce: "readme-nonce-pending",
        timestamp: String(Math.floor(Date.now() / 1000)),
      },
      trustedIngress: { ok: true, reasons: [] },
      builder: "readme-builder",
      actorId: "openclaw",
      actorType: "agent",
      actorLabel: "OpenClaw (demo)",
    },
    {
      id: "22222222-2222-4222-8222-222222222222",
      traceId: traceApproved,
      type: "proposed_action",
      agent: "openclaw-demo",
      payload: {
        kind: "system.note",
        title: "Approved item (demo)",
        summary: "Human approved — ready to execute",
        payload: { note: "Awaiting execute step." },
        meta: { version: "readme-demo" },
      },
      requiresApproval: true,
      status: "approved",
      proposalStatus: "approved",
      createdAt: nowIso,
      approvedAt: nowIso,
      executed: false,
      source: {
        connector: "openclaw",
        receivedAt: nowIso,
        verified: true,
        nonce: "readme-nonce-approved",
        timestamp: String(Math.floor(Date.now() / 1000)),
      },
      trustedIngress: { ok: true, reasons: [] },
      builder: "readme-builder",
      actorId: "openclaw",
      actorType: "agent",
      actorLabel: "OpenClaw (demo)",
    },
    {
      id: "33333333-3333-4333-8333-333333333333",
      traceId: traceExecuted,
      type: "proposed_action",
      agent: "openclaw-demo",
      payload: {
        kind: "system.note",
        title: "Completed note (demo)",
        summary: "Receipt after governed execution (demo)",
        payload: { note: "Executed under dry run." },
        meta: { version: "readme-demo" },
      },
      requiresApproval: true,
      status: "approved",
      proposalStatus: "executed",
      createdAt: nowIso,
      approvedAt: nowIso,
      executed: true,
      executedAt: nowIso,
      source: {
        connector: "openclaw",
        receivedAt: nowIso,
        verified: true,
        nonce: "readme-nonce-done",
        timestamp: String(Math.floor(Date.now() / 1000)),
      },
      trustedIngress: { ok: true, reasons: [] },
      builder: "readme-builder",
      actorId: "openclaw",
      actorType: "agent",
      actorLabel: "OpenClaw (demo)",
    },
  ];

  fs.writeFileSync(
    path.join(workspace, "events", `${dateKey}.json`),
    JSON.stringify(events, null, 2),
    "utf-8"
  );

  const outputPath = `system-notes/${dateKey}/33333333-3333-4333-8333-333333333333.md`;
  const actionLine = {
    id: "44444444-4444-4444-8444-444444444444",
    traceId: traceExecuted,
    at: nowIso,
    kind: "system.note",
    approvalId: "33333333-3333-4333-8333-333333333333",
    status: "executed",
    summary: "Receipt after governed execution (demo)",
    outputPath,
    actors: {
      proposer: { actorId: "openclaw", actorType: "agent", actorLabel: "OpenClaw" },
      approver: { actorId: "local-user", actorType: "human", actorLabel: "You" },
      executor: { actorId: "local-user", actorType: "human", actorLabel: "You" },
    },
  };
  fs.writeFileSync(
    path.join(workspace, "actions", `${dateKey}.jsonl`),
    `${JSON.stringify(actionLine)}\n`,
    "utf-8"
  );

  console.log("Seeded", workspace, "dateKey", dateKey);
}

async function waitForOk(url, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(url);
      if (r.ok) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`Timeout waiting for ${url}`);
}

function startNextChild() {
  const child = spawn(
    "pnpm",
    ["exec", "next", "dev", "-H", "127.0.0.1", "-p", port],
    {
      cwd: root,
      env: {
        ...process.env,
        JARVIS_ROOT: workspace,
        JARVIS_INGRESS_OPENCLAW_ENABLED: "true",
        JARVIS_INGRESS_OPENCLAW_SECRET: "01234567890123456789012345678901",
        JARVIS_INGRESS_ALLOWLIST_CONNECTORS: "openclaw",
      },
      stdio: "pipe",
    }
  );
  child.stdout?.on("data", () => {});
  child.stderr?.on("data", () => {});
  return child;
}

async function capture() {
  fs.mkdirSync(marketing, { recursive: true });
  const browser = await chromium.launch({
    channel: process.env.PW_CHANNEL || "chrome",
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });
  await page.emulateMedia({ colorScheme: "dark" });

  await page.goto(`${baseUrl}/activity`, {
    waitUntil: "networkidle",
    timeout: 120_000,
  });
  await page.getByText("OpenClaw: Connected", { exact: false }).waitFor({
    state: "visible",
    timeout: 30_000,
  });
  await page.waitForTimeout(600);
  await page.screenshot({
    path: path.join(marketing, "readme-01-openclaw-activity.png"),
    type: "png",
  });
  console.log("wrote docs/marketing/readme-01-openclaw-activity.png");

  await page.goto(`${baseUrl}/`, { waitUntil: "networkidle", timeout: 120_000 });
  await page.getByText("Sanitized OpenClaw", { exact: false }).waitFor({
    state: "visible",
    timeout: 30_000,
  });
  await page.evaluate(() => window.scrollTo(0, 0));

  const pendingCard = page
    .locator("li")
    .filter({ hasText: "Sanitized OpenClaw" })
    .first();
  await pendingCard.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await pendingCard.screenshot({
    path: path.join(marketing, "readme-02-openclaw-pending.png"),
    type: "png",
  });
  console.log("wrote docs/marketing/readme-02-openclaw-pending.png");

  await pendingCard.getByRole("button", { name: "Details" }).click();
  await page.getByRole("dialog").waitFor({ state: "visible", timeout: 15_000 });
  await page.waitForTimeout(400);
  await page.getByRole("dialog").screenshot({
    path: path.join(marketing, "readme-03-human-approval.png"),
    type: "png",
  });
  console.log("wrote docs/marketing/readme-03-human-approval.png");

  await page.keyboard.press("Escape");
  await page.getByRole("dialog").waitFor({ state: "hidden", timeout: 10_000 });

  await page.locator("#actions-panel").scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.getByText("Receipt after governed", { exact: false }).waitFor({
    state: "visible",
    timeout: 15_000,
  });
  await page.locator("#actions-panel").screenshot({
    path: path.join(marketing, "readme-04-execution-receipt.png"),
    type: "png",
  });
  console.log("wrote docs/marketing/readme-04-execution-receipt.png");

  await browser.close();
}

const dateKey = getDateKey();
const nowIso = new Date().toISOString();
seedWorkspace(dateKey, nowIso);

let child = null;
try {
  if (!skipServer) {
    child = startNextChild();
    await waitForOk(`${baseUrl}/`, 180_000);
  }
  await capture();
} finally {
  if (child && !child.killed) {
    child.kill("SIGTERM");
    await new Promise((r) => setTimeout(r, 1500));
    if (!child.killed) child.kill("SIGKILL");
  }
}
