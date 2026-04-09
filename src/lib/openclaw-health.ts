/**
 * OpenClaw connector health — derived from stored events + ingress config.
 * No new persistence; bounded scan of recent event files.
 */

import { readJson, getEventsFilePath } from "./storage";
import { listTraceScanDateKeys } from "./trace-scan";
import {
  isIngressEnabled,
  getIngressSecret,
  evaluateTrustedIngress,
} from "./ingress-openclaw";

/** Successful proposals idle longer than this → disconnected (no live signal). */
export const OPENCLAW_HEALTH_STALE_MS = 5 * 60 * 1000;

/** Only scan this many recent day buckets (newest first). */
const HEALTH_EVENT_DAY_LOOKBACK = 7;

export type OpenClawHealthStatus = "connected" | "disconnected" | "degraded";

export type OpenClawHealthPayload = {
  status: OpenClawHealthStatus;
  lastSeenAt: string | null;
  version?: string;
  lastProposalAt?: string;
  lastError?: string;
};

type StoredEvent = {
  createdAt?: string;
  source?: {
    connector?: string;
    receivedAt?: string;
  };
  payload?: Record<string, unknown>;
};

function extractVersionHint(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const p = payload as Record<string, unknown>;
  const meta = p.meta ?? p.openclaw;
  if (meta && typeof meta === "object") {
    const m = meta as Record<string, unknown>;
    const v = m.version ?? m.clientVersion ?? m.connectorVersion;
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  const top = p.openclawVersion ?? p.connectorVersion;
  if (typeof top === "string" && top.trim()) return top.trim();
  return undefined;
}

export type OpenClawRecentSignals = {
  lastProposalAt: string | null;
  version?: string;
};

/**
 * Latest OpenClaw proposal time and optional version hint from recent events.
 */
export async function scanOpenClawRecentSignals(): Promise<OpenClawRecentSignals> {
  const keys = listTraceScanDateKeys().slice(0, HEALTH_EVENT_DAY_LOOKBACK);
  let latest: string | null = null;
  let versionAtLatest: string | undefined;
  for (const dk of keys) {
    const events = await readJson<StoredEvent[]>(getEventsFilePath(dk));
    for (const e of events ?? []) {
      if (e.source?.connector !== "openclaw") continue;
      const t =
        (typeof e.source.receivedAt === "string" && e.source.receivedAt) ||
        (typeof e.createdAt === "string" && e.createdAt) ||
        "";
      if (!t) continue;
      if (!latest || t > latest) {
        latest = t;
        const v = extractVersionHint(e.payload);
        versionAtLatest = v ?? versionAtLatest;
      }
    }
  }
  return { lastProposalAt: latest, version: versionAtLatest };
}

export async function computeOpenClawHealth(
  nowMs: number = Date.now()
): Promise<OpenClawHealthPayload> {
  const { lastProposalAt, version } = await scanOpenClawRecentSignals();

  const enabled = isIngressEnabled();
  const secret = getIngressSecret();
  const allow = evaluateTrustedIngress("openclaw");

  if (!enabled) {
    return {
      status: "disconnected",
      lastSeenAt: lastProposalAt,
      ...(lastProposalAt ? { lastProposalAt } : {}),
      ...(version ? { version } : {}),
      lastError: "OpenClaw ingress is disabled",
    };
  }

  if (!secret) {
    return {
      status: "degraded",
      lastSeenAt: lastProposalAt,
      ...(lastProposalAt ? { lastProposalAt } : {}),
      ...(version ? { version } : {}),
      lastError:
        "Ingress secret missing or shorter than 32 characters (JARVIS_INGRESS_OPENCLAW_SECRET)",
    };
  }

  if (!allow.ok) {
    return {
      status: "degraded",
      lastSeenAt: lastProposalAt,
      ...(lastProposalAt ? { lastProposalAt } : {}),
      ...(version ? { version } : {}),
      lastError: allow.reasons[0] ?? "Connector not allowlisted",
    };
  }

  if (!lastProposalAt) {
    return {
      status: "disconnected",
      lastSeenAt: null,
      lastError:
        "No OpenClaw proposals in the recent event window (connector may be idle or not sending)",
    };
  }

  const ageMs = nowMs - Date.parse(lastProposalAt);
  if (!Number.isFinite(ageMs) || ageMs < 0) {
    return {
      status: "connected",
      lastSeenAt: lastProposalAt,
      lastProposalAt,
      ...(version ? { version } : {}),
    };
  }

  if (ageMs > OPENCLAW_HEALTH_STALE_MS) {
    return {
      status: "disconnected",
      lastSeenAt: lastProposalAt,
      lastProposalAt,
      ...(version ? { version } : {}),
      lastError: "No OpenClaw activity in the last 5 minutes",
    };
  }

  return {
    status: "connected",
    lastSeenAt: lastProposalAt,
    lastProposalAt,
    ...(version ? { version } : {}),
  };
}
