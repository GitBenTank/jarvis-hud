# Audit export (Phase 3)

Read-only JSON export for **external audit**: prove what happened in a calendar date range **without the UI**.

## Endpoint

`GET /api/audit/export?start=YYYY-MM-DD&end=YYYY-MM-DD`

- **`start`** / **`end`**: inclusive calendar dates in UTC (`YYYY-MM-DD`).
- **Auth:** When `JARVIS_AUTH_ENABLED=true`, **`requireVerifiedSessionGate`** (`src/lib/api-session-guard.ts`) requires a **valid signed** `jarvis_session` cookie (same as other session-backed `/api` routes). Use `curl -b` with cookies from the browser after `POST /api/auth/init`, or see [Audit export — operator proof](../runbooks/audit-export-operator-proof.md).

## Limits

- Range must be **at most 90 days** (`AUDIT_EXPORT_MAX_RANGE_DAYS` in `src/lib/audit-export.ts`).
- Invalid format, inverted range, or missing params → **400** with `{ error, code }`.
- When **`JARVIS_IDENTITY_BINDING_REQUIRED=true`**, the bundle is checked for **human** approval/execution rows that lack persisted OIDC principal fields. If inconsistent, the API returns **409** with `code: identity_binding_integrity` (no partial bundle). See [Identity binding contract §9](../architecture/identity-binding-claims-contract-v1.md#9-read-surfaces-s3).

## Response shape

**Schema version:** every bundle includes **`schemaVersion`** (integer), equal to **`AUDIT_EXPORT_SCHEMA_VERSION`** in `src/lib/audit-export.ts`. Bump the constant, snapshot test, and this doc together on **breaking** JSON shape changes. Successful HTTP responses also set header **`X-Jarvis-Audit-Export-Schema`** to the same value for quick `curl -I` checks.

JSON only:

```json
{
  "schemaVersion": 1,
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

Optional when SoD is enabled or historical `sod.*` policy rows exist in-range:

```json
  "sodOperatorGuide": ["…"]
```

- **`events`**: rows from `~/jarvis/events/{date}.json` (proposals / lifecycle), including Phase 1 `actor*` / `approvalActor*` and optional **`approvalPrincipal*` / `executionPrincipal*`** when present. Each row is returned with the same persisted fields, plus an added **`humanPrincipals`** object (approval vs execution side-by-side) when there is anything to mirror — see [Identity binding §9](../architecture/identity-binding-claims-contract-v1.md#9-read-surfaces-s3).
- **`receipts`**: lines from `~/jarvis/actions/{date}.jsonl` (including `traceId`, `approvalId`, `actors` when present).
- **`policyDecisions`** / **`reconciliation`**: JSONL from `policy-decisions/` and `reconciliation/` for each day in range (empty arrays if files are missing).
- **`index`**: sorted unique `traceId` and `approvalId` values seen across those arrays (for quick correlation).

No new persistence format is introduced; this is a **bundle of existing files**.

## Operator proof (B3)

One sitting, same `JARVIS_ROOT`: **[Audit export — operator proof](./runbooks/audit-export-operator-proof.md)** (curl + `jq` + link to the pilot bundle checklist).

## Example

```bash
curl -sS "http://127.0.0.1:3000/api/audit/export?start=2026-04-01&end=2026-04-09" | jq '.summary'
```

## Purpose

- Investor / compliance handoff: **“show me the period”** as one JSON artifact.
- Not an analytics dashboard; not CSV in v1.
