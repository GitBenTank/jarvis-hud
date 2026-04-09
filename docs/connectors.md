# Connectors — OpenClaw health (operator trust)

Jarvis exposes a **small, read-only health signal** for the OpenClaw ingress connector. This is not a dashboard, metrics store, or alerting system.

## Endpoint

```http
GET /api/connectors/openclaw/health
```

JSON shape:

| Field | Meaning |
|-------|---------|
| `status` | `"connected"` \| `"degraded"` \| `"disconnected"` |
| `lastSeenAt` | ISO time of the latest stored OpenClaw proposal (`source.connector === "openclaw"`), or `null` |
| `lastProposalAt` | Same boundary as last successful ingress write (when known) |
| `version` | Optional string if a recent proposal payload included a version hint (`meta.version`, `openclawVersion`, etc.) |
| `lastError` | Short operator-facing reason when not fully healthy |

## What each status means

- **Connected** — Ingress is enabled, secret and allowlist are usable, and at least one OpenClaw proposal was stored **within the last 5 minutes** (wall clock, server side).
- **Disconnected** — Ingress is off, **or** there is no recent OpenClaw activity in the 5-minute window, **or** no OpenClaw proposals appear in the recent **event file scan** (connector idle or not sending).
- **Degraded** — Ingress is nominally on, but configuration is wrong for a live path (e.g. missing/short secret, or `openclaw` not in `JARVIS_INGRESS_ALLOWLIST_CONNECTORS`). A past proposal may still appear as `lastSeenAt`.

## How it is derived (high level)

- **Config** is read from existing env (`JARVIS_INGRESS_OPENCLAW_*`, allowlist).
- **Activity** is inferred from **existing daily event JSON** only (same store as proposals). Failed HTTP requests that never create an event are invisible to this signal.

## Time windows (do not conflate these)

Three different numbers appear elsewhere in the product; only one defines “healthy right now” for OpenClaw:

| Window | Where it applies | Meaning |
|--------|------------------|---------|
| **~5 minutes** | OpenClaw health only | **Liveness threshold.** `connected` requires the *latest* stored OpenClaw proposal to be no older than this (server clock). Older than that → `disconnected` (stale), even if config is fine. |
| **7 calendar days** | OpenClaw health (event file scan) | **Search depth** to find the most recent OpenClaw proposal on disk. It is *not* a health horizon: a proposal from day 6 still fails the 5-minute rule. If nothing exists in this range, there is no `lastSeenAt` from events. |
| **30 calendar days** | Traces / `GET /api/traces/*` / recent traces | **Trace replay and discovery** (`TRACE_SCAN_DAY_WINDOW` in `src/lib/trace-constants.ts`). Unrelated to OpenClaw badge semantics. |

**Summary:** “Healthy” = **recent signal (5 min)** + good config. The 7-day scan only answers “when did we last see *any* OpenClaw proposal in the files we looked at?”

## UI

The **Activity** page shows an inline **OpenClaw** badge (green / amber / red) plus optional “last seen” subtext. Use **Refresh** to re-fetch without polling.

## Related

- [Trusted ingress / OpenClaw signing](security/openclaw-ingress-signing.md)
- [Environment variables](setup/env.md)
