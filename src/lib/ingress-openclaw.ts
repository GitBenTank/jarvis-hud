/**
 * OpenClaw connector ingress: HMAC verification, replay protection, allowlist.
 * Ingress creates pending proposals only; no execution, no approval.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

export type IngressAllowlistResult = {
  ok: boolean;
  reasons: string[];
};

export function isIngressEnabled(): boolean {
  const val = process.env.JARVIS_INGRESS_OPENCLAW_ENABLED;
  return (val || "").trim().toLowerCase() === "true";
}

export function getIngressSecret(): string | null {
  const s = process.env.JARVIS_INGRESS_OPENCLAW_SECRET;
  if (!s || s.length < 32) return null;
  return s;
}

/** Parse comma-separated allowlist => Set. Empty or unset = no connectors allowed. */
export function getConnectorAllowlist(): Set<string> {
  const raw = process.env.JARVIS_INGRESS_ALLOWLIST_CONNECTORS;
  if (!raw || typeof raw !== "string") return new Set();
  return new Set(
    raw
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean)
  );
}

export function evaluateTrustedIngress(connector: string): IngressAllowlistResult {
  const reasons: string[] = [];
  const list = getConnectorAllowlist();

  if (list.size === 0) {
    reasons.push(
      "No connectors in allowlist (JARVIS_INGRESS_ALLOWLIST_CONNECTORS empty or unset)"
    );
    return { ok: false, reasons };
  }

  if (!list.has(connector)) {
    reasons.push(
      `Connector "${connector}" not in allowlist: ${[...list].join(", ")}`
    );
    return { ok: false, reasons };
  }

  return { ok: true, reasons: [] };
}

export function buildSignatureMessage(
  timestamp: string,
  nonce: string,
  rawBody: string
): string {
  return `${timestamp}.${nonce}.${rawBody}`;
}

/** Verify HMAC-SHA256 signature. */
export function verifyHmacSignature(
  secret: string,
  message: string,
  providedSignature: string
): boolean {
  const expected = createHmac("sha256", secret)
    .update(message, "utf8")
    .digest("hex");
  if (expected.length !== providedSignature.length) return false;
  try {
    return timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(providedSignature, "hex")
    );
  } catch {
    return false;
  }
}

const TIMESTAMP_WINDOW_MS = 5 * 60 * 1000; // 5 min past
const FUTURE_TOLERANCE_MS = 2 * 60 * 1000; // 2 min future

/** Parse timestamp as ms epoch string. Returns null if invalid. */
function parseTimestampMs(ts: string): number | null {
  const n = Number.parseInt(ts, 10);
  if (!Number.isFinite(n)) return null;
  return n;
}

export function isTimestampInWindow(timestamp: string): boolean {
  const ms = parseTimestampMs(timestamp);
  if (ms === null) return false;
  const now = Date.now();
  if (ms < now - TIMESTAMP_WINDOW_MS) return false; // too old
  if (ms > now + FUTURE_TOLERANCE_MS) return false; // too far future
  return true;
}
