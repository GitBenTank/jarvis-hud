# ADR-0007: Identity binding v1 (human principal on receipts)

**Status:** Proposed  
**Date:** 2026-05  
**Owner:** Ben Tankersley  

**Related:** [ADR-0001: Thesis Lock](./0001-thesis-lock.md) · [ADR-0003: Execution policy v1](./0003-execution-policy-v1.md) · [Operating assumptions §2](../strategy/operating-assumptions.md#2-auth-and-step-up-jarvis) · [Tranche plan — identity binding](../roadmap/0006-identity-binding-tranche.md) · [S0 — OIDC claims contract (pinned)](../architecture/identity-binding-claims-contract-v1.md)

---

## Context

Session + step-up proved a **human gate** exists on the blessed stack. That is necessary but not sufficient for enterprise diligence: buyers and operators need **attribution** — *which* human principal, under *which* authority model, stood behind approve / execute — without pretending the model is the principal ([Thesis Lock](./0001-thesis-lock.md)).

Ingress remains **capability** (signed connector), not SSO identity. Identity binding v1 closes the gap **on HUD-boundary actions** where we already persist receipts and traces.

---

## Decision (narrow v1)

Adopt **Identity binding v1** as a bounded contract: bind **stable external identity claims** (from an agreed IdP / OIDC shape) to **Jarvis session and persisted actor fields** on approve / execute (and aligned read paths), so audit export and traces can answer “**this human** authorized **this action**” for governed APIs — without expanding scope to full enterprise RBAC or SoD in the same release.

Implementation order and proof obligations live in [0006 — Identity binding tranche](../roadmap/0006-identity-binding-tranche.md).

**S0 (pinned):** [Identity binding — OIDC claims contract v1](../architecture/identity-binding-claims-contract-v1.md) — required claims, canonical `(iss, sub)`, session and persistence mapping, and fail-closed rules. Downstream slices implement **only** against that contract.

---

## 1. What identity binding v1 must prove

1. **Stable principal:** A successful approve or execute records (or resolves to) a **stable, externally meaningful** subject identifier (e.g. OIDC `sub` + issuer, or documented equivalent) that **survives session refresh** within the pilot IdP configuration.
2. **Human, not model:** The persisted “who approved / who executed” lineage distinguishes **human operator** from **agent proposer**; the model is never treated as the approving principal ([Thesis Lock](./0001-thesis-lock.md)).
3. **Replayable evidence:** For at least one governed path (same class as golden loop + audit export), the **audit export** and/or trace payload includes enough structured identity fields to correlate a row to an IdP subject **without** live IdP round-trip at read time.
4. **Explicit failure:** If identity cannot be bound (missing claim, misconfiguration, clock skew beyond tolerance), **governed mutation fails closed** or records an explicit deny / block reason — never silent downgrade to “Local user” semantics when serious mode expects a bound principal (exact HTTP semantics follow execution-policy patterns).

---

## 2. What identity binding v1 must not claim

1. **Ingress identity:** Signed OpenClaw ingress does **not** identify the human operator; v1 does not require nor assert SSO on ingress.
2. **Full RBAC / SoD:** No role matrix, separation-of-duties engine, or approval-chain designer in v1 — only **binding** and **persistence** of the authenticated subject for actions already gated by existing policy + step-up.
3. **Trust in the model:** Binding does not certify intent, competence, or authorization scope beyond what IdP + app policy assert; it only fixes **who the HUD session represented** at commit time.
4. **Universal IdP catalog:** v1 may document **one** reference IdP configuration for proof; it does not promise every vendor edge case.

---

## 3. Falsifiable checks (v1 bar)

| # | Check | Fails if |
|---|--------|----------|
| F1 | Two distinct IdP subjects (two test users) produce **distinct** persisted principal fields on the **same** host config | Rows collapse to one undifferentiated label |
| F2 | Export or trace for an approved+executed item includes the **same** subject identifier as returned by the binding step at session establishment | Mismatch or omission after successful execute |
| F3 | With serious identity required, **unbound** or **invalid** token/session cannot complete execute without an explicit error path | Execution succeeds or receipts show a generic human without alarm |
| F4 | Agent `actor*` fields remain **non-human** for the proposer; human fields reference the bound principal | Model id appears as approval principal |

---

## 4. Minimal proof path (documentation + probes)

1. **Artifact:** IdP + HUD env documented (no secrets in git); which claims map to which persisted fields.
2. **Pressure:** Scripted or runbooked **two-user** exercise (F1) + single-user export correlation (F2), saved **outside** default `evidence/` gitignore if operator-held, or under `evidence/` only for non-secret transcripts — same hygiene as pilot bundle.
3. **Proof chain:** Host truth probes unchanged where applicable; **new** or extended probe/runbook proves F1–F4 without manual UI-only steps where avoidable.
4. **Closure:** New dated **enterprise readiness snapshot** (add file; do not rewrite an old dated snapshot in place).

---

## 5. Ordered implementation slices (normative intent only)

Detailed sequencing and exit gates: **[0006 — Identity binding tranche](../roadmap/0006-identity-binding-tranche.md)**.

Slices are intentionally small: **claims contract** → **session binding** → **persistence on approve/execute** → **export + trace surfacing** → **probes + snapshot**.

---

## Consequences

- **Documentation and probes land before** feature code that writes new identity fields to durable stores (per tranche ordering).
- **Thesis Lock** remains authoritative: binding adds **evidence of human principal**; it does not grant agents execution authority without explicit human approval and receipts.
