# SoD proof / repro runbook

**Goal:** Re-run the three SoD behaviors yourself and inspect the same artifacts a reviewer would: HTTP bodies, `policy-decisions` JSONL, trace/replay JSON, audit export, and `GET /api/config`.

**Scope:** Environment-wide SoD (`JARVIS_SOD_ENABLED`, approver/executor principal maps). See [SoD architecture](../architecture/jarvis-sod-environment.md) for semantics.

---

## 0. Preconditions (all scenarios)

1. **Jarvis HUD is running** (example base URL below uses `http://127.0.0.1:3000`).
2. **`JARVIS_ROOT`** points at the data directory you will inspect (events, actions, policy-decisions).
3. For **bound principals** (required for SoD gates when SoD is on), enable auth and stub bind:

| Variable | Example | Notes |
|----------|---------|--------|
| `JARVIS_AUTH_ENABLED` | `true` | SoD requires bound human, not `local-user`. |
| `JARVIS_AUTH_SECRET` | 16+ char secret | Required when auth is on. |
| `JARVIS_OIDC_STUB_BIND` | `true` | Dev-only bind endpoint. |
| `JARVIS_OIDC_ISSUER_ALLOWLIST` | `https://idp.example` | Must cover every `iss` you use in curl (normalization matches stub-bind). |
| `JARVIS_IDENTITY_BINDING_REQUIRED` | `true` | Stub-bind before step-up (see identity contract). |

4. **Step-up** is required for **execute** policy; call `POST /api/auth/step-up` after stub-bind when testing execute.

Shell helpers used below:

```bash
export BASE="${BASE:-http://127.0.0.1:3000}"
export DATE="$(date -u +%Y-%m-%d)"   # UTC date key for files under JARVIS_ROOT
```

Cookie jar pattern (repeat per persona: `alice.cj` vs `bob.cj`):

```bash
# New anonymous session + Set-Cookie jar
curl -sS -c alice.cj -b alice.cj -X POST "$BASE/api/auth/init" | jq .

# Bind OIDC (iss/sub must match allowlist + SoD lists)
curl -sS -c alice.cj -b alice.cj -X POST "$BASE/api/auth/oidc/stub-bind" \
  -H "Content-Type: application/json" \
  -d '{"iss":"https://idp.example","sub":"alice"}' | jq .

curl -sS -c alice.cj -b alice.cj -X POST "$BASE/api/auth/step-up" | jq .
```

You still need a **pending governed proposal** (`requiresApproval: true`, status `pending`). Capture:

- `APPROVAL_ID` — event `id` (same as approval id for API paths).
- `TRACE_ID` — usually `traceId` on the event, else equals `id`.

From disk (replace `DATE`):

```bash
jq --arg id "$APPROVAL_ID" '.[] | select(.id==$id)' "$JARVIS_ROOT/events/$DATE.json"
```

---

## 1. Split-principal success (A)

### 1.1 Env (example)

```bash
export JARVIS_SOD_ENABLED=true
export JARVIS_SOD_APPROVER_PRINCIPALS='https://idp.example|alice'
export JARVIS_SOD_EXECUTOR_PRINCIPALS='https://idp.example|bob'
# allowlist + stub bind + auth + binding + secret: set as in §0
```

Restart the server after changing env.

### 1.2 Approve as Alice, execute as Bob

```bash
# Alice: init → stub-bind alice → step-up → approve
curl -sS -c alice.cj -b alice.cj -X POST "$BASE/api/auth/init" >/dev/null
curl -sS -c alice.cj -b alice.cj -X POST "$BASE/api/auth/oidc/stub-bind" \
  -H "Content-Type: application/json" \
  -d '{"iss":"https://idp.example","sub":"alice"}' >/dev/null
curl -sS -c alice.cj -b alice.cj -X POST "$BASE/api/auth/step-up" >/dev/null

curl -sS -i -c alice.cj -b alice.cj -X POST "$BASE/api/approvals/$APPROVAL_ID" \
  -H "Content-Type: application/json" \
  -d '{"action":"approve"}'
# Expect: HTTP/1.1 200
```

```bash
# Bob: new session → stub-bind bob → step-up → execute
curl -sS -c bob.cj -b bob.cj -X POST "$BASE/api/auth/init" >/dev/null
curl -sS -c bob.cj -b bob.cj -X POST "$BASE/api/auth/oidc/stub-bind" \
  -H "Content-Type: application/json" \
  -d '{"iss":"https://idp.example","sub":"bob"}' >/dev/null
curl -sS -c bob.cj -b bob.cj -X POST "$BASE/api/auth/step-up" >/dev/null

curl -sS -i -c bob.cj -b bob.cj -X POST "$BASE/api/execute/$APPROVAL_ID"
# Expect: HTTP/1.1 200 (adapter-specific body)
```

### 1.3 Inspect artifacts

**Lifecycle row (split principals on disk):**

```bash
jq --arg id "$APPROVAL_ID" '.[] | select(.id==$id)
  | {approvalPrincipalIss, approvalPrincipalSub, executionPrincipalIss, executionPrincipalSub, humanPrincipals}' \
  "$JARVIS_ROOT/events/$DATE.json"
```

Expect `approvalPrincipalSub` **`alice`** and `executionPrincipalSub` **`bob`** (issuer matches allowlist / normalization).

**Policy JSONL** (execute path still logs execution policy allow after SoD passes; no `sod.same_principal` deny for this trace):

```bash
grep "\"traceId\":\"$TRACE_ID\"" "$JARVIS_ROOT/policy-decisions/$DATE.jsonl" | jq -c .
```

Expect a **`decision":"allow"`** row from execute policy for this trace; **no** line with `"rule":"sod.same_principal"` for the same `traceId`.

**Replay / trace (operator lines):**

```bash
curl -sS "$BASE/api/traces/$TRACE_ID/replay" | jq '{sodOperatorNotes, approval: .approval | {humanPrincipals, approvalPrincipalSub, executionPrincipalSub}}'
curl -sS "$BASE/api/traces/$TRACE_ID" | jq '.sodOperatorNotes'
```

Expect `sodOperatorNotes` to include the **different OIDC subjects** / SoD-friendly split sentence when both principal pairs exist on the executed row.

**Audit export:**

```bash
curl -sS "$BASE/api/audit/export?start=$DATE&end=$DATE" | jq --arg id "$APPROVAL_ID" \
  '{sodOperatorGuide, humanPrincipals: (.events[] | select(.id==$id) | .humanPrincipals)}'
```

**Config posture:**

```bash
curl -sS "$BASE/api/config" | jq '.trustPosture | {sodEnabled, sodApproverPrincipalCount, sodExecutorPrincipalCount, sodRoleMapsReady}'
```

Expect `sodEnabled: true`, both counts **≥ 1**, `sodRoleMapsReady: true`.

---

## 2. Same-principal deny (B)

### 2.1 Env

Use the **same** `iss|sub` in **both** role lists (so Alice can approve and is also “allowed” as executor, but SoD blocks same person executing their own approval):

```bash
export JARVIS_SOD_ENABLED=true
export JARVIS_SOD_APPROVER_PRINCIPALS='https://idp.example|alice'
export JARVIS_SOD_EXECUTOR_PRINCIPALS='https://idp.example|alice'
```

Restart server.

### 2.2 Approve then execute as Alice (same cookie)

```bash
rm -f alice.cj
curl -sS -c alice.cj -b alice.cj -X POST "$BASE/api/auth/init" >/dev/null
curl -sS -c alice.cj -b alice.cj -X POST "$BASE/api/auth/oidc/stub-bind" \
  -H "Content-Type: application/json" \
  -d '{"iss":"https://idp.example","sub":"alice"}' >/dev/null
curl -sS -c alice.cj -b alice.cj -X POST "$BASE/api/auth/step-up" >/dev/null

curl -sS -i -c alice.cj -b alice.cj -X POST "$BASE/api/approvals/$APPROVAL_ID" \
  -H "Content-Type: application/json" \
  -d '{"action":"approve"}'
# 200

curl -sS -i -c alice.cj -b alice.cj -X POST "$BASE/api/execute/$APPROVAL_ID"
# Expect: HTTP/1.1 403
# Body JSON: "code":"sod_same_principal"
```

### 2.3 Inspect artifacts

**HTTP body check:**

```bash
curl -sS -c alice.cj -b alice.cj -X POST "$BASE/api/execute/$APPROVAL_ID" | jq '{code, error}'
```

**Expected `policy-decisions` row** (append-only JSONL; one line per check):

```bash
grep "\"traceId\":\"$TRACE_ID\"" "$JARVIS_ROOT/policy-decisions/$DATE.jsonl" | jq -c 'select(.rule=="sod.same_principal")'
```

Expect something like:

```json
{"traceId":"…","decision":"deny","rule":"sod.same_principal","reason":"sod_same_principal","timestamp":"…"}
```

**Replay / trace:**

```bash
curl -sS "$BASE/api/traces/$TRACE_ID/replay" | jq '.sodOperatorNotes'
```

Expect a note that execution was denied because the **same bound principal** cannot approve and execute while SoD is enabled.

**Export:**

```bash
curl -sS "$BASE/api/audit/export?start=$DATE&end=$DATE" | jq '[.policyDecisions[] | select(.rule=="sod.same_principal")]'
```

---

## 3. Misconfiguration 503 (C)

### 3.1 Env

SoD on but **executor list empty** (approver list non-empty so the failure mode is “incomplete maps”, not “empty everything”):

```bash
export JARVIS_SOD_ENABLED=true
export JARVIS_SOD_APPROVER_PRINCIPALS='https://idp.example|alice'
export JARVIS_SOD_EXECUTOR_PRINCIPALS=''
```

Restart server.

### 3.2 Curl

Use a valid session + stub-bind as usual, then:

```bash
curl -sS -i -c alice.cj -b alice.cj -X POST "$BASE/api/approvals/$APPROVAL_ID" \
  -H "Content-Type: application/json" \
  -d '{"action":"approve"}'
# Expect: HTTP/1.1 503
# JSON: "code":"sod_role_map_incomplete"
```

Same **503** applies to **execute** if you reached it with a valid row.

### 3.3 Inspect

**Config:**

```bash
curl -sS "$BASE/api/config" | jq '.trustPosture | {sodEnabled, sodApproverPrincipalCount, sodExecutorPrincipalCount, sodRoleMapsReady}'
```

Expect `sodRoleMapsReady: false` (one count is zero).

If you integrate `preflightTrustPostureForKind` from `src/jarvis/trust-posture.ts` in a small probe, expect a **message** mentioning SoD maps incomplete when `sodEnabled` is true and `sodRoleMapsReady` is false.

**Optional policy line:** The approval handler may still append a **`policy-decisions`** deny with `rule: sod.config` and `reason: sod_role_map_incomplete` when `traceId` is known (inspect the same JSONL file).

```bash
grep "\"traceId\":\"$TRACE_ID\"" "$JARVIS_ROOT/policy-decisions/$DATE.jsonl" | jq -c 'select(.reason=="sod_role_map_incomplete")'
```

---

## 4. Quick `jq` reference

| Intent | Command sketch |
|--------|------------------|
| All SoD-related policy rows for a day | `grep '"rule":"sod.' "$JARVIS_ROOT/policy-decisions/$DATE.jsonl" \| jq -c .` |
| SoD rows for one trace | `grep "\"traceId\":\"$TRACE_ID\"" "$JARVIS_ROOT/policy-decisions/$DATE.jsonl" \| jq -c 'select(.rule \| startswith("sod."))'` |
| Export guide + one event’s principals | `curl -sS "$BASE/api/audit/export?start=$DATE&end=$DATE" \| jq '{sodOperatorGuide, sample: (.events[] \| select(.id==$id) \| {id, humanPrincipals})}' --arg id "$APPROVAL_ID"` |

---

## 5. File locations (canonical)

| Artifact | Path pattern |
|----------|----------------|
| Lifecycle events | `$JARVIS_ROOT/events/YYYY-MM-DD.json` |
| Receipts / action log | `$JARVIS_ROOT/actions/YYYY-MM-DD.jsonl` |
| Policy decisions | `$JARVIS_ROOT/policy-decisions/YYYY-MM-DD.jsonl` |

`YYYY-MM-DD` is **UTC** calendar date used by the server’s `getDateKey()` for “today’s” files.

---

## 6. Related docs

- [SoD environment & proof concepts](../architecture/jarvis-sod-environment.md)
- [Identity binding contract §9 (export / trace read surfaces)](../architecture/identity-binding-claims-contract-v1.md#9-read-surfaces-s3)
