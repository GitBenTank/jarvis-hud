# ADR-0003: Execution Policy v1

**Status:** Accepted  
**Date:** 2026-03  
**Related:** [ADR-0001: Thesis Lock](./0001-thesis-lock.md) · [Agent Execution Model](../security/agent-execution-model.md) · [Trusted Ingress](../security/trusted-ingress.md)

---

## Context

Enforcement of execution rules was fragmented: kind checks lived inline in the execute route, step-up logic was duplicated, and unknown kinds posed a risk of accidental execution. We needed a single policy boundary that is explicit, auditable, and deterministic before any adapter runs.

---

## Decision

Introduce **Execution Policy v1** as a first gate in `/api/execute/[approvalId]`:

- Implement `src/lib/policy.ts` with `evaluateExecutePolicy(config)`
- Call policy **before** any adapter execution
- If policy returns deny, return structured error and **do not run adapter code**
- Adapters may still validate inputs; policy is the first gate

---

## Invariants

1. **If `evaluateExecutePolicy` returns deny, no adapter code runs.** Policy is a hard boundary.
2. **Adapters may still validate inputs, but policy is the first gate.** Input validation (e.g. diff check) remains adapter-specific; policy governs whether execution is permitted at all.

---

## Config

`evaluateExecutePolicy(config)` receives:

| Input | Description |
|-------|-------------|
| `kind` | Normalized action kind (e.g. `code.apply`, `content.publish`) |
| `authEnabled` | Whether auth is enabled |
| `stepUpValid` | Whether session has valid step-up |
| `codeApplyBlockReasons` | Optional; preflight failures for `code.apply` (repo root, dirty worktree) |

---

## Status Semantics

| Status | Meaning |
|-------|---------|
| **400** | Invalid request / kind not in allowlist / preflight fails (e.g. missing JARVIS_REPO_ROOT, dirty worktree) |
| **403** | Authenticated boundary failure (step-up required to execute) |

Semantics are intentional: 400 = “wrong or invalid,” 403 = “not authorized for this action.”

---

## Rationale

1. **Explicit.** One function, one place. Policy rules are enumerable.
2. **Auditable.** Reasons are returned; no silent denial.
3. **Deterministic.** Same inputs → same result. No drift.
4. **Thesis-aligned.** Policy blocks; it does not execute. Approval ≠ execution is preserved.

---

## Non-Goals (This Iteration)

- No automation or auto-execution
- No new connectors or integrations
- No dynamic or config-driven policies (allowlist is fixed in code)
- No change to receipt or action-log behavior

---

## Outcome

- Unknown kinds are blocked at the boundary with an allowlist error.
- Step-up is enforced uniformly when auth is enabled.
- `code.apply` preflight (JARVIS_REPO_ROOT, clean worktree) is surfaced as structured policy denial before adapter runs.
- Policy unit tests cover allowlist, step-up, and `code.apply` preflight.

---

## Relationship to Trusted Ingress

**Execution Policy** governs what can run.  
**Trusted Ingress** governs what can influence proposals.

Both are required for defense in depth. Policy does not replace Trusted Ingress; it enforces the execution boundary.
