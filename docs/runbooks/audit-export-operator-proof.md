---
title: "Audit export — operator proof (B3)"
status: living-document
category: runbooks
owner: Ben Tankersley
related:
  - ../audit-export.md
  - ../verification/pilot-proof-bundle-checklist.md
---

# Audit export — operator proof

**Goal:** Save a **reviewable JSON bundle** for a calendar window on the **same host and `JARVIS_ROOT`** as a governed run, without custom tooling.

## Preconditions

- Jarvis HUD is up (`pnpm dev` or `pnpm start`) with the **`JARVIS_ROOT` you intend to certify**.
- You know the **`dateKey`** (UTC `YYYY-MM-DD`) that covers your run — same as filenames under `events/` / `actions/` for that day.

## Export

```bash
export BASE="http://127.0.0.1:3000"
export START="2026-08-15"   # inclusive, YYYY-MM-DD
export END="$START"         # same day or range ≤ 90 days

curl -sS "$BASE/api/audit/export?start=$START&end=$END" -o "evidence/jarvis-audit-export_${START}_to_${END}.json"
```

### Auth on (`JARVIS_AUTH_ENABLED=true`)

1. In the browser on the same origin, complete **`POST /api/auth/init`** (and step-up if you use it).
2. Copy the `jarvis_session=…` cookie from devtools **or** save cookies to a jar file.
3. Run:

```bash
curl -sS -b jarvis.cookies "$BASE/api/audit/export?start=$START&end=$END" -o "evidence/jarvis-audit-export_${START}_to_${END}.json"
```

See [Audit export](../audit-export.md) for error codes and identity-binding **409** behavior.

## Done when (machine-checkable)

```bash
jq '{schemaVersion, range, summary, indexKeys: (.index|keys)}' "evidence/jarvis-audit-export_${START}_to_${END}.json"
```

- **`schemaVersion`** is present and matches **`AUDIT_EXPORT_SCHEMA_VERSION`** in `src/lib/audit-export.ts` (today **1**).
- **`range.start` / `range.end`** match your query.
- **`summary`** counts are non-negative integers.
- **`index.traceIds`** / **`index.approvalIds`** include your pilot approval/trace if that activity fell in the window.

Optional header check:

```bash
curl -sSI -b jarvis.cookies "$BASE/api/audit/export?start=$START&end=$END" | grep -i jarvis-audit-export-schema
```

## Full evidence chain

Use **[Pilot proof bundle checklist](../verification/pilot-proof-bundle-checklist.md)** — especially **§3 Audit export** — so host probes, governed path, export file, and charter stay in one narrative.

Store **`evidence/`** outside git unless counsel allows; `/evidence/` is gitignored in this repo.
