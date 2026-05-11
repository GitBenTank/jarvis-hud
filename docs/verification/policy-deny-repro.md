---
title: "Repro — execute-time policy deny + policy-decisions line"
status: living-document
category: verification
owner: Ben Tankersley
related:
  - ../decisions/0003-execution-policy-v1.md
  - ../architecture/policy-decision-logs.md
  - ../setup/serious-mode-rehearsal-checklist.md
---

# Repro — execute-time policy deny + `policy-decisions` line

**Purpose:** Standard **negative** proof for diligence: show that **`evaluateExecutePolicy` denies** on `POST /api/execute/:id`, **before adapters run**, and appends a line to **`$JARVIS_ROOT/policy-decisions/YYYY-MM-DD.jsonl`** when a **`traceId`** is available. See [ADR-0003](../decisions/0003-execution-policy-v1.md) and [policy decision logs](../architecture/policy-decision-logs.md).

---

## Scripted runner (§A — same machine as `pnpm dev`)

**`scripts/run-policy-deny-repro-once.mjs`** automates §A: signed **`system.note`** ingress, **`POST /api/auth/init` only** (no step-up), approve, execute → **expect HTTP 403** and a matching **`policy-decisions`** deny line. It does **not** write `jarvis.cookies`; it merges `Set-Cookie` in memory like other smoke scripts.

From repo root (load secrets from `.env.local` yourself; **`evidence/` is gitignored** — safe for transcripts):

```bash
set -a && source .env.local && set +a
export JARVIS_ROOT="${JARVIS_ROOT:-$PWD/.pilot-jarvis-data}"
export JARVIS_HUD_BASE_URL="${JARVIS_HUD_BASE_URL:-http://127.0.0.1:3000}"
export POLICY_DENY_TRANSCRIPT="$PWD/evidence/policy-deny-repro-transcript.txt"
# Optional: override calendar file name (defaults to host-local YYYY-MM-DD, same rule as Jarvis getDateKey)
# export PILOT_STORAGE_DATE=2026-05-09
mkdir -p evidence
: > "$POLICY_DENY_TRANSCRIPT"
node scripts/run-policy-deny-repro-once.mjs
```

**Env:** `JARVIS_INGRESS_OPENCLAW_SECRET` (≥32 chars), `JARVIS_ROOT`, `POLICY_DENY_TRANSCRIPT` (path). Optional: `JARVIS_HUD_BASE_URL`, `PILOT_STORAGE_DATE`.

---

## A. Step-up deny (primary — no `code.apply` payload)

**Requires:** `JARVIS_AUTH_ENABLED=true`, valid `JARVIS_AUTH_SECRET` (≥16 chars), HUD reachable, a **pending** approval (any allowed kind, e.g. `system.note` from normal ingress).

1. **Session cookie (no step-up yet):**
   ```bash
   curl -sS -c jarvis.cookies -b jarvis.cookies -X POST "http://127.0.0.1:3000/api/auth/init"
   ```
2. **Approve** (same cookie jar):
   ```bash
   curl -sS -b jarvis.cookies -X POST "http://127.0.0.1:3000/api/approvals/APPROVAL_ID" \
     -H "Content-Type: application/json" \
     -d '{"action":"approve"}'
   ```
3. **Execute without step-up** — expect **HTTP 403** and body mentioning step-up:
   ```bash
   curl -sS -w "\nHTTP %{http_code}\n" -b jarvis.cookies -X POST \
     "http://127.0.0.1:3000/api/execute/APPROVAL_ID"
   ```
4. **Preserved evidence:** under **`$JARVIS_ROOT/policy-decisions/`**, open today’s **`*.jsonl`**; find a line with **`"decision":"deny"`**, **`"rule":"step_up"`**, **`"reason":"reauthenticate_required"`**, and the same **`traceId`** as the proposal (see events file for that approval).

**Note:** To complete execution after this repro, call **`POST /api/auth/step-up`** (browser or scripted) so the session includes **`stepUpAt`**, then repeat execute. See [auth-on stack verification](../setup/serious-mode-rehearsal-checklist.md).

---

## B. `code.apply` preflight deny (alternate — auth may be off)

**Requires:** An **approved** `code.apply` proposal, server started **without** `JARVIS_REPO_ROOT` (or invalid path), so `getCodeApplyBlockReasons()` returns a block reason.

1. Approve `code.apply` as usual.
2. Ensure **`JARVIS_REPO_ROOT`** is unset in the **`pnpm dev` environment** (or points somewhere invalid).
3. **`POST /api/execute/:id`** — expect **HTTP 400** and policy reasons about repo root / git / dirty tree.
4. **Evidence:** **`policy-decisions`** line with **`"rule":"code.apply.preflight"`** and **`"decision":"deny"`** (when **`traceId`** present).

---

## What this proves

| Claim | Evidence |
|-------|----------|
| Policy runs on execute path | 400/403 from execute route before artifact writes |
| Deny is logged | New line in **`policy-decisions/*.jsonl`** with matching **`traceId`** |
| Not “just env theater” | HTTP response body + JSONL line align on **rule** (`step_up`, `code.apply.preflight`, etc.) |

Do **not** commit cookie files, `.env.local`, or raw secrets. Redact **IDs** if you paste output externally.
