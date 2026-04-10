# Audit export (Phase 3)

Read-only JSON export for **external audit**: prove what happened in a calendar date range **without the UI**.

## Endpoint

`GET /api/audit/export?start=YYYY-MM-DD&end=YYYY-MM-DD`

- **`start`** / **`end`**: inclusive calendar dates in UTC (`YYYY-MM-DD`).
- **Auth:** When `JARVIS_AUTH_ENABLED=true`, the route follows the same session requirement as other `/api/*` routes (see `src/middleware.ts`).

## Limits

- Range must be **at most 90 days** (`AUDIT_EXPORT_MAX_RANGE_DAYS` in `src/lib/audit-export.ts`).
- Invalid format, inverted range, or missing params → **400** with `{ error, code }`.

## Response shape

JSON only:

```json
{
  "range": { "start": "2026-04-01", "end": "2026-04-07" },
  "generatedAt": "2026-04-09T…Z",
  "summary": {
    "events": 12,
    "receipts": 8,
    "traces": 5,
    "policyDecisions": 8,
    "reconciliation": 2
  },
  "events": [],
  "receipts": [],
  "policyDecisions": [],
  "reconciliation": [],
  "index": {
    "traceIds": ["…"],
    "approvalIds": ["…"]
  }
}
```

- **`events`**: rows from `~/jarvis/events/{date}.json` (proposals / lifecycle), **as stored** (including Phase 1 `actor*` / `approvalActor*` when present).
- **`receipts`**: lines from `~/jarvis/actions/{date}.jsonl` (including `traceId`, `approvalId`, `actors` when present).
- **`policyDecisions`** / **`reconciliation`**: JSONL from `policy-decisions/` and `reconciliation/` for each day in range (empty arrays if files are missing).
- **`index`**: sorted unique `traceId` and `approvalId` values seen across those arrays (for quick correlation).

No new persistence format is introduced; this is a **bundle of existing files**.

## Example

```bash
curl -sS "http://localhost:3000/api/audit/export?start=2026-04-01&end=2026-04-09" | jq '.summary'
```

## Purpose

- Investor / compliance handoff: **“show me the period”** as one JSON artifact.
- Not an analytics dashboard; not CSV in v1.
