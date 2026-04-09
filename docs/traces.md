# Traces (Phase 5 — operator usability)

A **trace** ties together one proposed action and everything that happened after: approval, policy, execution, receipts, and optional reconciliation. The canonical id is **`traceId`** (shared on the proposal event and receipt lines).

## Open a trace from a URL

Use the Activity page with a query parameter:

```text
/activity?trace=<traceId>
```

Example:

```text
http://127.0.0.1:3000/activity?trace=a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

The Activity Timeline loads that trace without extra clicks. The same panel appears on the **Dashboard** and **Activity** pages; **Recent traces** always navigates here so links stay shareable.

## Share / debug

- **Copy ID** — copies `traceId` only.
- **Copy link** — copies a full `/activity?trace=…` URL (uses the current origin).
- **Copy trace summary** — multi-line text for pasting into tickets or chat.

## Recent traces

The HUD lists **recent traces** derived from existing **events** and **action log** JSONL. The rolling window matches **`TRACE_SCAN_DAY_WINDOW`** in `src/lib/trace-constants.ts` (currently 30 calendar days), same as trace APIs. No separate index or database.

API:

```http
GET /api/traces/recent?limit=20
```

Response: `{ "traces": [ { "traceId", "lastActivityAt", "summary" } ] }` sorted by `lastActivityAt` descending. `limit` is clamped to 1–100.

## Trace APIs (scan window)

`GET /api/traces/[traceId]` and `GET /api/traces/[traceId]/replay` scan the same **30-day** rolling window. Older data may still exist on disk but will not resolve until the day bucket falls inside the window (or the window constant is changed in code).

## Related

- [Control plane architecture](architecture/control-plane.md)
- [Audit export](audit-export.md) — date-range JSON bundle for external audit
