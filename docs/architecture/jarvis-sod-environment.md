# Environment-wide separation of duties (SoD)

**Status:** Implemented (narrow v1)  
**Related:** [Identity binding claims contract](./identity-binding-claims-contract-v1.md) · policy decisions log (`policy-decisions/*.jsonl`) · audit export

## Purpose

When **`JARVIS_SOD_ENABLED=true`**, Jarvis enforces:

1. **Two roles** via env allowlists: **approver** and **executor** (bound OIDC principals only).
2. **One SoD rule:** the same `(iss, sub)` cannot **approve** and **execute** the same proposal.

Wrong role → **403** with a stable `code`. Same principal → **403** `sod_same_principal`. Misconfigured empty role maps → **503** `sod_role_map_incomplete`.

Denials on the execute path are also written to the **policy decision log** (`rule` values like `sod.executor_role`, `sod.same_principal`). Approval denials use the same log when `traceId` is known (`sod.approver_role`, etc.).

## Configuration

| Variable | Meaning |
|----------|---------|
| `JARVIS_SOD_ENABLED` | Set to `true` to turn on SoD + role checks. |
| `JARVIS_SOD_APPROVER_PRINCIPALS` | Comma-separated entries: **`iss`** + **`|`** + **`sub`** (first pipe splits issuer from subject). Issuer must not contain `|`. |
| `JARVIS_SOD_EXECUTOR_PRINCIPALS` | Same format for executors. |

Both lists must be **non-empty** when SoD is enabled, or every approve/execute returns **503** `sod_role_map_incomplete`.

Principals are matched with the same issuer normalization as OIDC elsewhere (`normalizeIssuerUrl`).

## Implementation

- `src/lib/sod-rbac.ts` — parse lists, `assertSodApprovalAllowed`, `assertSodExecuteAllowed`, `logSodPolicyDeny`.
- `POST /api/approvals/[id]` — approver gate before persisting approve/deny.
- `POST /api/execute/[approvalId]` — executor + same-principal gate **before** execution policy logs **allow** (ordering avoids a false “allowed” decision in the log).
- `GET /api/config` → `trustPosture.sodEnabled`, `sodApproverPrincipalCount`, `sodExecutorPrincipalCount`, `sodRoleMapsReady` (counts only; no subject values).

## Audit trail

- **Policy decisions:** denied SoD checks append a line with `decision: "deny"` and the `rule` / `reason` above.
- **Events:** unchanged — successful split flows still persist distinct `approvalPrincipal*` vs `executionPrincipal*` on the lifecycle row; export/trace/replay (S3) already surface those fields.

## Read surfaces (operator language)

- **`GET /api/traces/{traceId}/replay`** and **`GET /api/traces/{traceId}`** may include **`sodOperatorNotes`**: short sentences derived from `sod.*` policy rows for this trace plus a **principal split** line when the lifecycle row is executed and both `approvalPrincipal*` and `executionPrincipal*` are present (same vs different OIDC subject).
- **`GET /api/audit/export`**: when SoD is enabled, or when the bundle contains historical `sod.*` denials, **`sodOperatorGuide`** lists static inspection tips plus mapped policy lines (capped).
- **`buildExecutionTraceView`** (replay UI path) appends `sodOperatorNotes` into **`resultSummary`** when present.

Implementation: `src/lib/sod-operator-narrative.ts`.

## Proof chain (cheap verification)

**Copy-paste rerun:** [SoD proof / repro runbook](../runbooks/sod-proof-repro.md) (curl, `jq`, file paths, expected `policy-decisions` rows).

### A. Success — two different principals

1. Set `JARVIS_SOD_ENABLED=true`, fill **approver** and **executor** lists with **two different** `iss|sub` entries (see Configuration). Ensure identity binding can produce persisted principals (stub-bind is fine for dev).
2. Approve a pending proposal as principal **A**; execute as principal **B**.
3. **Inspect:**
   - **Lifecycle event** (`events/{date}.json`): `humanPrincipals.approval` vs `humanPrincipals.execution` (via export) show different `principalSub` (or equivalent).
   - **`GET /api/config`**: `trustPosture.sodEnabled`, `sodRoleMapsReady: true`, non-zero counts.
   - **`policy-decisions/{date}.jsonl`**: after successful execute, expect the usual execution **allow** row from execute policy — **no** `sod.same_principal` deny for that trace.
   - **`GET /api/traces/{traceId}/replay`**: `sodOperatorNotes` should include the **“different OIDC subjects”** principal-split line when both principal pairs were persisted.

### B. Deny — same principal after self-approval

1. Same SoD env; use one principal that appears in **both** role lists.
2. Approve, then attempt execute **as the same bound principal**.
3. **Inspect:**
   - **HTTP 403** body: `code: sod_same_principal`.
   - **`policy-decisions/{date}.jsonl`**: one JSON line with `"decision":"deny"`, `"rule":"sod.same_principal"`, `"reason":"sod_same_principal"` (same `traceId` as the proposal).
   - **`GET /api/traces/{traceId}/replay`** (and **GET** trace): `sodOperatorNotes` includes the sentence that explicitly says execution was denied because the **same bound principal** cannot approve and execute while SoD is enabled.
   - **`GET /api/audit/export`** for that day: `policyDecisions` contains the same row; **`sodOperatorGuide`** (if present) maps that deny into operator text.

### C. Config / misconfiguration

- Empty approver or executor list with SoD on → **503** `sod_role_map_incomplete`; **`GET /api/config`** shows `sodRoleMapsReady: false` and `jarvis/trust-posture` evaluation adds a warning line when parsed.
