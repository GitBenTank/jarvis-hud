/**
 * One-shot: policy-deny-repro.md §A (step-up deny). Not for CI.
 * Usage: from repo root, with .env.local sourced and JARVIS_* set.
 */
import { appendFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { postOpenClawIngressWithRetry } from "./lib/openclaw-ingress-fetch.mjs";

function jarFromSetCookieLines(lines) {
  const jar = {};
  if (!lines?.length) return jar;
  for (const line of lines) {
    const first = String(line).split(";")[0]?.trim();
    if (!first?.includes("=")) continue;
    const eq = first.indexOf("=");
    jar[first.slice(0, eq).trim()] = first.slice(eq + 1).trim();
  }
  return jar;
}

function getSetCookieLines(res) {
  if (typeof res.headers.getSetCookie === "function") return res.headers.getSetCookie();
  const single = res.headers.get("set-cookie");
  return single ? [single] : [];
}

function jarToCookieHeader(jar) {
  return Object.entries(jar)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

/** Same calendar rule as `src/lib/storage.ts` `getDateKey()` (host local). */
function hostLocalDateKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function log(transcriptPath, s) {
  const line = typeof s === "string" ? s : JSON.stringify(s, null, 2);
  appendFileSync(transcriptPath, line + "\n", "utf8");
  console.log(line);
}

const baseUrl = (process.env.JARVIS_HUD_BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const secret = process.env.JARVIS_INGRESS_OPENCLAW_SECRET;
const jarvisRoot = process.env.JARVIS_ROOT;
const transcriptPath = process.env.POLICY_DENY_TRANSCRIPT;
const dateKey = process.env.PILOT_STORAGE_DATE || hostLocalDateKey();

if (!secret || secret.length < 32) {
  console.error("JARVIS_INGRESS_OPENCLAW_SECRET missing or <32 chars");
  process.exit(1);
}
if (!jarvisRoot) {
  console.error("JARVIS_ROOT required");
  process.exit(1);
}
if (!transcriptPath) {
  console.error("POLICY_DENY_TRANSCRIPT required");
  process.exit(1);
}

mkdirSync(join(jarvisRoot, "policy-decisions"), { recursive: true });

const marker = `policy-deny-${Date.now()}`;
const ingressBody = {
  kind: "system.note",
  title: `Policy deny repro ${marker}`,
  summary: "step-up deny repro (no step-up before execute)",
  payload: { note: `Repro ${marker}` },
  agent: "policy-deny-repro",
  source: { connector: "openclaw" },
};

log(transcriptPath, `# policy-deny-repro.md §A (step-up deny)`);
log(transcriptPath, `# baseUrl=${baseUrl}`);
log(transcriptPath, `# JARVIS_ROOT=${jarvisRoot}`);
log(transcriptPath, "");

const ingRes = await postOpenClawIngressWithRetry(baseUrl, secret, ingressBody, {
  maxAttempts: 5,
  baseDelayMs: 400,
});
const ingText = await ingRes.text();
log(transcriptPath, "## Signed ingress (system.note)");
log(transcriptPath, `POST /api/ingress/openclaw → HTTP ${ingRes.status}`);
log(transcriptPath, ingText);
let ingJson;
try {
  ingJson = JSON.parse(ingText);
} catch {
  ingJson = null;
}
if (!ingRes.ok || !ingJson?.id) {
  console.error("ingress failed");
  process.exit(1);
}
const approvalId = ingJson.id;
const traceId = ingJson.traceId;
log(transcriptPath, `APPROVAL_ID=${approvalId}`);
log(transcriptPath, `traceId=${traceId}`);
log(transcriptPath, "");

log(transcriptPath, "## A.1 Session (init only — no step-up)");
const initRes = await fetch(`${baseUrl}/api/auth/init`, { method: "POST" });
const initText = await initRes.text();
log(transcriptPath, `POST /api/auth/init → HTTP ${initRes.status}`);
log(transcriptPath, initText);
let jar = jarFromSetCookieLines(getSetCookieLines(initRes));
const cookie = jarToCookieHeader(jar);
if (!cookie) {
  console.error("no session cookie after init");
  process.exit(1);
}
log(transcriptPath, "(Set-Cookie merged; jarvis.cookies not written — scripted repro.)");
log(transcriptPath, "");

log(transcriptPath, "## A.2 Approve (same session, no step-up)");
const apprRes = await fetch(`${baseUrl}/api/approvals/${approvalId}`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Cookie: cookie },
  body: JSON.stringify({ action: "approve" }),
});
const apprText = await apprRes.text();
log(transcriptPath, `POST /api/approvals/${approvalId} → HTTP ${apprRes.status}`);
log(transcriptPath, apprText);
jar = { ...jar, ...jarFromSetCookieLines(getSetCookieLines(apprRes)) };
const cookie2 = jarToCookieHeader(jar);
log(transcriptPath, "");

log(transcriptPath, "## A.3 Execute without step-up (expect 403 + step-up in body)");
const execRes = await fetch(`${baseUrl}/api/execute/${approvalId}`, {
  method: "POST",
  headers: { Cookie: cookie2 || cookie },
});
const execText = await execRes.text();
log(transcriptPath, `POST /api/execute/${approvalId} → HTTP ${execRes.status}`);
log(transcriptPath, execText);
log(transcriptPath, "");

if (execRes.status !== 403) {
  console.error(`expected HTTP 403, got ${execRes.status}`);
  process.exit(1);
}
if (!/step|reauth|step-up/i.exec(execText)) {
  console.error("expected step-up mention in body");
  process.exit(1);
}

const pdPath = join(jarvisRoot, "policy-decisions", `${dateKey}.jsonl`);
if (!existsSync(pdPath)) {
  console.error("missing policy-decisions file:", pdPath);
  process.exit(1);
}
const tail = readFileSync(pdPath, "utf8").trim().split("\n").slice(-5).join("\n");
log(transcriptPath, "## A.4 policy-decisions tail (last lines)");
log(transcriptPath, tail);
log(transcriptPath, "");
log(transcriptPath, "OK: execute denied before adapters; policy-decisions line present.");
