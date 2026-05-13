/**
 * Shared helpers for golden-loop smoke, email, and workflow scripts.
 */

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { postOpenClawIngressWithRetry } from "./openclaw-ingress-fetch.mjs";

const _dir = dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = join(_dir, "..", "..");

export const DEFAULT_CI_SECRET = "ci-golden-loop-openclaw-secret-32c-min";

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export function pickPort() {
  const fromEnv = process.env.GOLDEN_LOOP_PORT;
  if (fromEnv && /^\d+$/.test(fromEnv)) return Number(fromEnv);
  return 31000 + Math.floor(Math.random() * 900);
}

export function ensureSecret(s) {
  if (!s || String(s).length < 32) {
    console.error(
      "golden-loop: JARVIS_INGRESS_OPENCLAW_SECRET must be ≥32 chars (set in env or use spawned-server default)."
    );
    process.exit(1);
  }
  return String(s);
}

export async function waitForServer(baseUrl, maxAttempts = 90, delayMs = 500) {
  for (let i = 1; i <= maxAttempts; i++) {
    try {
      const res = await fetch(`${baseUrl}/api/config`, { signal: AbortSignal.timeout(8000) });
      if (res.ok) return;
    } catch {
      /* retry */
    }
    if (i === maxAttempts) {
      throw new Error(`Server not ready at ${baseUrl}/api/config after ${maxAttempts} attempts`);
    }
    await sleep(delayMs);
  }
}

/** Parse Set-Cookie lines into name=value pairs (first segment only). */
function jarFromSetCookieLines(lines) {
  if (!lines?.length) return {};
  const jar = {};
  for (const line of lines) {
    const first = String(line).split(";")[0]?.trim();
    if (!first?.includes("=")) continue;
    const eq = first.indexOf("=");
    jar[first.slice(0, eq).trim()] = first.slice(eq + 1).trim();
  }
  return jar;
}

function getSetCookieLines(res) {
  if (typeof res.headers.getSetCookie === "function") {
    return res.headers.getSetCookie();
  }
  const single = res.headers.get("set-cookie");
  return single ? [single] : [];
}

function jarToCookieHeader(jar) {
  return Object.entries(jar)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

/** Parse `Cookie` request header into name → value (first-party segments only). */
function jarFromCookieHeader(cookieHeader) {
  const jar = {};
  if (!cookieHeader || typeof cookieHeader !== "string") return jar;
  for (const part of cookieHeader.split(";")) {
    const seg = part.trim();
    const i = seg.indexOf("=");
    if (i <= 0) continue;
    jar[seg.slice(0, i).trim()] = seg.slice(i + 1).trim();
  }
  return jar;
}

/**
 * When `JARVIS_IDENTITY_BINDING_REQUIRED=true`, bind iss/sub via stub before step-up.
 * Requires `JARVIS_OIDC_STUB_BIND=true`, `JARVIS_OIDC_ISSUER_ALLOWLIST`, and `GOLDEN_LOOP_OIDC_ISS` / `GOLDEN_LOOP_OIDC_SUB`.
 */
async function maybeOidcStubBindForGoldenLoop(baseUrl, cookieHeader, fail) {
  if (process.env.JARVIS_IDENTITY_BINDING_REQUIRED !== "true") {
    return cookieHeader;
  }
  if (process.env.JARVIS_OIDC_STUB_BIND !== "true") {
    fail(
      "golden-loop: JARVIS_IDENTITY_BINDING_REQUIRED=true requires JARVIS_OIDC_STUB_BIND=true and GOLDEN_LOOP_OIDC_ISS / GOLDEN_LOOP_OIDC_SUB"
    );
  }
  const iss = process.env.GOLDEN_LOOP_OIDC_ISS?.trim();
  const sub = process.env.GOLDEN_LOOP_OIDC_SUB?.trim();
  if (!iss || !sub) {
    fail(
      "golden-loop: set GOLDEN_LOOP_OIDC_ISS and GOLDEN_LOOP_OIDC_SUB when JARVIS_IDENTITY_BINDING_REQUIRED=true"
    );
  }
  const res = await fetch(`${baseUrl}/api/auth/oidc/stub-bind`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    },
    body: JSON.stringify({ iss, sub }),
  });
  const t = await res.text();
  if (!res.ok) {
    fail(`auth/oidc/stub-bind: HTTP ${res.status} ${t}`);
  }
  const jar = {
    ...jarFromCookieHeader(cookieHeader),
    ...jarFromSetCookieLines(getSetCookieLines(res)),
  };
  const next = jarToCookieHeader(jar);
  if (!next) fail("golden-loop: stub-bind returned empty cookie jar");
  console.log("golden-loop: OIDC stub-bind OK (identity binding path)");
  return next;
}

/**
 * When Jarvis auth is on, approve/execute/trace/export require a session cookie + step-up.
 * Ingress stays unsigned. CI spawned server uses auth off — no-op there.
 */
export async function maybeHudSessionCookie(baseUrl, fail) {
  let cfgRes;
  try {
    cfgRes = await fetch(`${baseUrl}/api/config`, { signal: AbortSignal.timeout(8000) });
  } catch (e) {
    fail(`config (auth probe): ${e instanceof Error ? e.message : String(e)}`);
  }
  if (!cfgRes.ok) fail(`config (auth probe): HTTP ${cfgRes.status}`);
  const cfg = await cfgRes.json().catch(() => ({}));
  if (cfg.authEnabled !== true) {
    console.log("golden-loop: auth off — approve/execute use no session cookie");
    return "";
  }

  const initRes = await fetch(`${baseUrl}/api/auth/init`, { method: "POST" });
  if (!initRes.ok) {
    const t = await initRes.text();
    fail(`auth/init: HTTP ${initRes.status} ${t}`);
  }
  let jar = jarFromSetCookieLines(getSetCookieLines(initRes));
  let cookieHeader = jarToCookieHeader(jar);
  cookieHeader = await maybeOidcStubBindForGoldenLoop(baseUrl, cookieHeader, fail);
  jar = jarFromCookieHeader(cookieHeader);

  const stepRes = await fetch(`${baseUrl}/api/auth/step-up`, {
    method: "POST",
    headers: { Cookie: jarToCookieHeader(jar) },
  });
  if (!stepRes.ok) {
    const t = await stepRes.text();
    fail(`auth/step-up: HTTP ${stepRes.status} ${t}`);
  }
  jar = { ...jar, ...jarFromSetCookieLines(getSetCookieLines(stepRes)) };

  const header = jarToCookieHeader(jar);
  if (!header) fail("auth bootstrap: empty Cookie after init + step-up");
  console.log("golden-loop: HUD session + step-up OK (auth on)");
  return header;
}

/**
 * @param {{ port: number; jarvisRoot: string; secret: string; extraEnv?: Record<string, string | undefined> }} opts
 */
export function spawnNextServer({ port, jarvisRoot, secret, extraEnv = {} }) {
  if (!existsSync(join(REPO_ROOT, ".next", "BUILD_ID"))) {
    console.error(
      "golden-loop: missing `.next/BUILD_ID` — run `pnpm build` first, or use GOLDEN_LOOP_USE_EXISTING=1 with your own `pnpm dev`."
    );
    process.exit(1);
  }
  const mode = "start";
  const args = ["exec", "next", "start", "-H", "127.0.0.1", "-p", String(port)];
  const merged = { ...process.env, ...extraEnv };
  const proc = spawn("pnpm", args, {
    cwd: REPO_ROOT,
    env: {
      ...merged,
      NODE_ENV: "production",
      JARVIS_ROOT: jarvisRoot,
      JARVIS_INGRESS_OPENCLAW_ENABLED: "true",
      JARVIS_INGRESS_OPENCLAW_SECRET: secret,
      JARVIS_INGRESS_ALLOWLIST_CONNECTORS: "openclaw",
      JARVIS_AUTH_ENABLED: "false",
      PORT: String(port),
      HOSTNAME: "127.0.0.1",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  let tail = "";
  const collect = (chunk) => {
    tail = (tail + chunk.toString()).slice(-4000);
  };
  proc.stdout?.on("data", collect);
  proc.stderr?.on("data", collect);
  proc.logTail = () => tail;
  return { proc, mode };
}

export function awaitChildExit(proc, ms) {
  return new Promise((resolve) => {
    const t = setTimeout(() => resolve(false), ms);
    proc.once("exit", () => {
      clearTimeout(t);
      resolve(true);
    });
  });
}

export async function killServer(proc) {
  if (!proc || proc.exitCode != null) return;
  proc.kill("SIGTERM");
  const exited = await awaitChildExit(proc, 8000);
  if (!exited) {
    try {
      proc.kill("SIGKILL");
    } catch {
      /* ignore */
    }
  }
}

/**
 * Full HTTP chain after server is up.
 * @param {{ baseUrl: string; secret: string; ingressBody: Record<string, unknown>; successLabel: string; fail: (m: string) => void; requireProviderMessageId?: boolean; afterReplay?: (ctx: { replayJson: Record<string, unknown>; approvalId: string; traceId: string }) => void | Promise<void> }} opts
 */
export async function runIngressApproveExecuteTraceExport({
  baseUrl,
  secret,
  ingressBody,
  successLabel,
  fail,
  requireProviderMessageId = false,
  afterReplay,
}) {
  const ingRes = await postOpenClawIngressWithRetry(baseUrl, secret, ingressBody, {
    maxAttempts: 5,
    baseDelayMs: 400,
  });
  const ingText = await ingRes.text();
  let ingJson;
  try {
    ingJson = JSON.parse(ingText);
  } catch {
    ingJson = null;
  }
  if (!ingRes.ok || !ingJson?.ok || !ingJson.id || !ingJson.traceId) {
    fail(`ingress: HTTP ${ingRes.status} ${ingJson?.error ?? ingText}`);
  }

  const approvalId = ingJson.id;
  const traceId = ingJson.traceId;
  console.log(`golden-loop: ingress OK id=${approvalId} traceId=${traceId}`);

  const sessionCookie = await maybeHudSessionCookie(baseUrl, fail);
  const cookieHeaders = sessionCookie ? { Cookie: sessionCookie } : {};

  let dateKey;
  for (let attempt = 1; attempt <= 30; attempt++) {
    const listRes = await fetch(`${baseUrl}/api/approvals?status=pending`, {
      headers: { ...cookieHeaders },
    });
    const listJson = await listRes.json().catch(() => null);
    dateKey = listJson?.dateKey;
    const pending = Array.isArray(listJson?.approvals) ? listJson.approvals : [];
    if (pending.some((a) => a.id === approvalId)) break;
    if (attempt === 30) fail("proposal never appeared in GET /api/approvals?status=pending");
    await sleep(200);
  }

  const apprRes = await fetch(`${baseUrl}/api/approvals/${approvalId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...cookieHeaders },
    body: JSON.stringify({ action: "approve" }),
  });
  if (!apprRes.ok) {
    const t = await apprRes.text();
    fail(`approve: HTTP ${apprRes.status} ${t}`);
  }
  console.log("golden-loop: approve OK");

  const execRes = await fetch(`${baseUrl}/api/execute/${approvalId}`, {
    method: "POST",
    headers: { ...cookieHeaders },
  });
  const execText = await execRes.text();
  let execJson;
  try {
    execJson = JSON.parse(execText);
  } catch {
    execJson = null;
  }
  if (!execRes.ok || !execJson?.ok) {
    fail(`execute: HTTP ${execRes.status} ${execJson?.error ?? execText}`);
  }
  if (requireProviderMessageId) {
    const mid = execJson.providerMessageId;
    if (typeof mid !== "string" || !mid.trim()) {
      fail("execute: expected non-empty providerMessageId (Gmail / transport receipt)");
    }
    console.log(`golden-loop: providerMessageId OK (${mid.slice(0, 60)}…)`);
  }
  console.log("golden-loop: execute OK");

  const traceRes = await fetch(`${baseUrl}/api/traces/${encodeURIComponent(traceId)}`, {
    headers: { ...cookieHeaders },
  });
  if (!traceRes.ok) fail(`trace: HTTP ${traceRes.status} ${await traceRes.text()}`);
  const traceJson = await traceRes.json();
  if (!traceJson || traceJson.traceId !== traceId) {
    fail("trace: response missing or traceId mismatch");
  }
  console.log("golden-loop: trace GET OK");

  const replayRes = await fetch(`${baseUrl}/api/traces/${encodeURIComponent(traceId)}/replay`, {
    headers: { ...cookieHeaders },
  });
  if (!replayRes.ok) fail(`replay: HTTP ${replayRes.status} ${await replayRes.text()}`);
  const replayJson = await replayRes.json();
  if (!replayJson?.traceId || replayJson.traceId !== traceId) {
    fail("replay: traceId mismatch");
  }
  if (!replayJson.proposal) fail("replay: missing proposal");
  if (!Array.isArray(replayJson.receipts) || replayJson.receipts.length < 1) {
    fail("replay: expected at least one receipt");
  }
  if (!replayJson.execution) fail("replay: missing execution summary");
  if (requireProviderMessageId) {
    const hasEmail = replayJson.receipts.some((r) => r?.kind === "send_email");
    if (!hasEmail) fail("replay: expected a send_email receipt in receipts[]");
  }
  if (typeof afterReplay === "function") {
    await afterReplay({ replayJson, approvalId, traceId });
  }
  console.log("golden-loop: replay OK");

  const exportUrl = `${baseUrl}/api/audit/export?start=${encodeURIComponent(dateKey)}&end=${encodeURIComponent(dateKey)}`;
  const expRes = await fetch(exportUrl, { headers: { ...cookieHeaders } });
  if (!expRes.ok) fail(`audit export: HTTP ${expRes.status} ${await expRes.text()}`);
  const bundle = await expRes.json();
  if (bundle?.schemaVersion !== 1) {
    fail(`audit export: expected schemaVersion 1, got ${JSON.stringify(bundle?.schemaVersion)}`);
  }
  const ids = new Set(bundle?.index?.approvalIds ?? []);
  const traces = new Set(bundle?.index?.traceIds ?? []);
  if (!ids.has(approvalId)) fail(`audit export: approvalId ${approvalId} not in index.approvalIds`);
  if (!traces.has(traceId)) fail(`audit export: traceId ${traceId} not in index.traceIds`);
  const evMatch = (bundle.events ?? []).some(
    (e) => e && typeof e === "object" && e.id === approvalId
  );
  if (!evMatch) fail("audit export: event row not found for approvalId");
  console.log("golden-loop: audit export OK");

  console.log(`\ngolden-loop: ALL STEPS PASSED (${successLabel})\n`);
}
