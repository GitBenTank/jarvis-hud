#!/usr/bin/env node
/**
 * Preflight check for Jarvis HUD (ingress, config, port).
 * Usage: JARVIS_HUD_BASE_URL="http://localhost:3001" pnpm jarvis:doctor
 */
const BASE = process.env.JARVIS_HUD_BASE_URL ?? "http://127.0.0.1:3000";
const ingressEnabled = process.env.JARVIS_INGRESS_OPENCLAW_ENABLED === "true";
const secret = process.env.JARVIS_INGRESS_OPENCLAW_SECRET;
const allowlistRaw = process.env.JARVIS_INGRESS_ALLOWLIST_CONNECTORS ?? "";
const allowlist = allowlistRaw.split(",").map((s) => s.trim()).filter(Boolean);
const openclawInAllowlist = allowlist.includes("openclaw");

function parsePort(url) {
  try {
    const u = new URL(url);
    if (u.port) return u.port;
    return u.protocol === "https:" ? "443" : "80";
  } catch {
    return "?";
  }
}

console.log("Jarvis HUD Doctor");
console.log("─".repeat(40));
console.log("Base URL:", BASE);
console.log("Port:", parsePort(BASE));
console.log("");
console.log("Ingress (OpenClaw):");
console.log("  Enabled (env):", ingressEnabled ? "yes" : "no");
console.log("  Secret set:", secret ? `yes (${secret.length} chars)` : "no");
console.log("  Allowlist:", allowlist.length ? allowlist.join(", ") : "(empty)");
console.log("  openclaw allowed:", openclawInAllowlist ? "yes" : "no");
console.log("");

let configOk = false;
let serverIngressOk = false;
let serverOpenclawOk = false;

try {
  const res = await fetch(`${BASE}/api/config`);
  if (res.ok) {
    const cfg = await res.json();
    serverIngressOk = !!cfg.ingressOpenclawEnabled;
    serverOpenclawOk = !!cfg.openclawAllowed;
    console.log("Server config (live):");
    console.log("  ingressOpenclawEnabled:", serverIngressOk);
    console.log("  openclawAllowed:", serverOpenclawOk);
    if (cfg.serverTime) console.log("  serverTime:", cfg.serverTime);
    configOk = true;
  }
} catch (err) {
  console.log("Server: not reachable (is Jarvis running?)");
  console.log("  ", err.message);
}

console.log("");
const envOk = ingressEnabled && openclawInAllowlist && secret?.length >= 32;
const serverOk = !configOk || (serverIngressOk && serverOpenclawOk);

if (envOk && serverOk) {
  console.log("✓ Ready for ingress");
} else {
  const missing = [];
  if (!ingressEnabled) missing.push("JARVIS_INGRESS_OPENCLAW_ENABLED=true");
  if (!secret || secret.length < 32) missing.push("JARVIS_INGRESS_OPENCLAW_SECRET (≥32 chars)");
  if (!openclawInAllowlist) missing.push("openclaw in JARVIS_INGRESS_ALLOWLIST_CONNECTORS");
  if (configOk && (!serverIngressOk || !serverOpenclawOk)) {
    missing.push("server needs same env (restart with ingress vars)");
  }
  if (missing.length) {
    console.log("⚠ Missing:", missing.join(", "));
  }
}
