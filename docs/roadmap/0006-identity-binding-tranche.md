# Tranche: Identity binding v1

**Status:** Living plan (pre-code)  
**Owner:** Ben Tankersley  
**Created:** 2026-05  

**Normative decision:** [ADR-0007: Identity binding v1](../decisions/0007-identity-binding-v1.md)  
**S0 contract (closed):** [OIDC claims contract v1](../architecture/identity-binding-claims-contract-v1.md) — **S1** (session binding) is next.  
**Related:** [Thesis Lock](../decisions/0001-thesis-lock.md) · [Pilot bundle baseline (closed)](./0003-operator-integration-phases.md#pilot-bundle-baseline-operator-credibility--closed-2026-05) · [Operating assumptions §2](../strategy/operating-assumptions.md#2-auth-and-step-up-jarvis) · [Audit export](../audit-export.md)

---

## 1. What identity binding must prove

Same as [ADR-0007 §1](../decisions/0007-identity-binding-v1.md#1-what-identity-binding-v1-must-prove), summarized:

- **Stable external subject** on approve / execute persistence and in export/trace read surfaces.
- **Human vs agent** lineage preserved; model is not the approving principal.
- **Replayable** correlation without silent fallback when serious binding is required.

---

## 2. What identity binding must not claim

Same as [ADR-0007 §2](../decisions/0007-identity-binding-v1.md#2-what-identity-binding-v1-must-not-claim): no ingress SSO claim, no full RBAC/SoD, no “model is trusted,” no universal IdP matrix in v1.

---

## 3. Falsifiable checks

Use [ADR-0007 §3](../decisions/0007-identity-binding-v1.md#3-falsifiable-checks-v1-bar) table (F1–F4) as the **release bar** for closing the tranche. Add probe/runbook IDs here when implemented (`pnpm …` names).

---

## 4. Minimal proof path (operator-shaped)

1. **Configure** reference IdP + HUD callback/env per ADR artifact (secrets out of git).
2. **Two-user pass (F1):** User A and User B each complete session establishment → approve (or execute) a disposable test proposal → confirm persisted fields differ and match each subject.
3. **Export pass (F2):** `GET /api/audit/export` (or equivalent) for the run date shows identifiers aligned with step 2.
4. **Negative pass (F3):** Deliberately break binding (wrong audience, missing claim, expired assertion per test plan) → governed execute **does not** succeed with a misleading principal.
5. **Agent boundary pass (F4):** Confirm proposer `actor*` remains agent-labeled; human principal fields only reflect bound user.

Transcripts and exports: **operator-held** or under `evidence/` following existing pilot hygiene ([pilot green single session](../verification/pilot-green-single-session.md)).

---

## 5. Ordered implementation slices

Order is **documentation and proof hooks before** persistence writes that depend on new identity fields.

| Slice | Deliverable | Exit signal |
|-------|-------------|-------------|
| **S0 — Claims contract** | **[Contract doc](../architecture/identity-binding-claims-contract-v1.md):** required OIDC ID Token claims, `(iss, sub)` stability, session + event field mapping, fail-closed rules, §4a guardrails. | **Closed** (owner sign-off); normative baseline for S1+. |
| **S1 — Session binding** | At session establishment / refresh, parse and validate claims; hold bound subject in session context used by gated routes. **Active.** | Unit tests or narrow integration tests for parser + failure modes. |
| **S2 — Approve / execute persistence** | Write bound human principal fields on approve and execute paths already covered by policy + step-up; no change to ingress signing. | F1 manual or scripted pass on dev stack. |
| **S3 — Trace + audit export** | Surface same identifiers in trace read APIs and audit export JSON for the governed day range. | F2 pass on same run as S2. |
| **S4 — Pressure + probes** | Add or extend `pnpm` probe(s) for identity posture (cookie/session + bound subject presence); document in operator checklist. | CI-safe subset where possible; serious checks documented for local/CI split if needed. |
| **S5 — Snapshot** | New dated **enterprise readiness** snapshot file referencing ADR-0007 closure; do not edit prior dated snapshots in place. | File merged; linked from governance index if one exists. |

**Out of v1 (explicit deferrals):** RBAC matrix, SoD rules engine, per-resource ACLs, multi-tenant org modeling, delegated admin UI beyond minimal display.

---

## Dependencies

- **Thesis Lock** non-negotiables remain in force ([ADR-0001](../decisions/0001-thesis-lock.md)).
- **Execution policy** remains first gate on execute ([ADR-0003](../decisions/0003-execution-policy-v1.md)); identity binding is **additive attribution**, not a bypass.

---

## Navigation

- Operator integration phases (broader sequencing): [0003](./0003-operator-integration-phases.md)
- Platform / enterprise UI growth (separate track): [0004](./0004-phased-platform-plan.md)
