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
