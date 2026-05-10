# Identity binding — OIDC claims contract (v1, S0)

**Status:** Pinned (pre-code)  
**Owner:** Ben Tankersley  
**Date:** 2026-05  

**Binds:** [ADR-0007: Identity binding v1](../decisions/0007-identity-binding-v1.md) · [Tranche 0006 — S0](../roadmap/0006-identity-binding-tranche.md)  
**Related:** Actor placeholders today: `src/lib/actor-identity.ts` (`ACTOR_LOCAL_USER`) · [Operating assumptions §2](../strategy/operating-assumptions.md#2-auth-and-step-up-jarvis)

---

## 1. Purpose (what this document is)

This is the **S0 claims contract**: the smallest set of **normative rules** that downstream slices (session, persistence, export, probes) can implement without re-litigating identity philosophy.

It specifies:

- Which **OIDC ID Token** (or equivalent) claims are required and how they are validated at a high level.
- How those claims map onto **human** approval / execution lineage fields already used on lifecycle events (`approvalActor*`, `executionActor*`, plus optional **new** persisted principal fields).
- What **must never** be inferred from claims alone (Thesis Lock: model is not principal; ingress is not human SSO).

**Out of S0:** concrete npm packages, callback URL layout, JWKS caching, multi-tenant org tables, RBAC — only what is needed to keep **issuer + subject + display** honest and stable.

---

## 2. Trust boundary (v1)

| Layer | Identity meaning |
|--------|------------------|
| **OpenClaw ingress** | Signed **connector capability** only — no change in v1 ([ADR-0007 §2](../decisions/0007-identity-binding-v1.md#2-what-identity-binding-v1-must-not-claim)). |
| **HUD browser session** | After OIDC sign-in, the server holds a **verified** `(iss, sub)` pair (and optional display claims) bound to the **Jarvis session** (slice S1). |
| **Approve / Execute** | Persist **human** principal fields from the bound session — **not** `ACTOR_LOCAL_USER` placeholders when “binding required” mode is on (slice S2; exact env gate TBD in implementation). |

---

## 3. Required ID Token claims (OIDC Core)

Assumptions: **Authorization Code + OIDC** (or equivalent) yields an **ID Token** validated by Jarvis (signature, issuer, audience, lifetime). Access tokens are **not** the source of truth for human principal unless explicitly adopted later.

| Claim | Required | Rule |
|-------|----------|------|
| **`iss`** | Yes | Issuer identifier for the IdP; must match **configured issuer allow-list** (exact string or documented normalization — implementation picks one and documents it). |
| **`sub`** | Yes | Opaque subject identifier **stable for that `iss`** per [OIDC Core §2 — ID Token](https://openid.net/specs/openid-connect-core-1_0.html#IDToken). |
| **`aud`** | Yes | Must include the Jarvis **OIDC client id** registered for this deployment. |
| **`exp`** | Yes | Clock skew tolerance is **implementation-defined**; default recommendation **≤ 120s** total slack unless IdP docs require otherwise. |
| **`iat`** | Yes | Used with `exp` for freshness; reject unreasonably old tokens (implementation-defined max age). |
| **`nonce`** | Yes (when using implicit/hybrid flows) | If the deployment uses nonce in the auth request, ID Token `nonce` must match. For pure code flow with one-time state, document equivalent anti-replay. |

**Optional (display only, never sole proof of identity):**

| Claim | Use |
|-------|-----|
| `preferred_username` | First choice for `approvalActorLabel` / `executionActorLabel`. |
| `name` | Second choice. |
| `email` | Third choice (and audit-friendly). |
| `picture` | UI only; not persisted in v1 contract unless product asks. |

**Label resolution order (normative v1):** `preferred_username` → `name` → `email` → literal **`sub`** (last resort).

---

## 4. Canonical principal key (stable string)

**External canonical pair:** `(iss, sub)` as strings taken from the validated ID Token (after any **documented** issuer string normalization).

**Persistence (v1):**

1. **Opaque stable `actorId` for humans** (`approvalActorId`, `executionActorId`, and mirrored receipt actors): a **deterministic** function of `(iss, sub)` that is **stable across session refresh** for the same user at the same IdP. Exact encoding (e.g. prefixed hash vs encoded pair) is **implementation-defined** but must be **documented in code** and **reproducible** for audit tooling.
2. **Recoverable pair for audit (required for F2):** Persist **`iss` and `sub` explicitly** on the event row (or on an append-only sidecar keyed by `approvalId` / `traceId`) so export and compliance tooling can correlate **without** calling the IdP at read time. Suggested field names (may ship under these or equivalent): `approvalPrincipalIss`, `approvalPrincipalSub`, `executionPrincipalIss`, `executionPrincipalSub`.

**Forbidden when binding is required:** writing **`local-user`** / **`Local user`** into human principal fields while claiming IdP binding succeeded — that is the **silent downgrade** ADR-0007 forbids.

**Proposer unchanged:** Agent `actorId` / `actorType` / `actorLabel` on the proposal remain the **agent** chain; human fields only reflect the bound operator.

---

## 5. Session shape (contract only — slice S1)

After successful OIDC validation, the **Jarvis session** (today: signed cookie payload) must be able to carry at least:

| Field | Meaning |
|-------|---------|
| `oidcIss` | Issuer string (same normalization as persistence). |
| `oidcSub` | Subject string. |
| `oidcClaimsAt` | Unix ms when claims were validated (for staleness / re-auth policy later). |

Exact JSON field names may match the table above or a single nested `principal: { iss, sub }` object — **one shape**, documented once in implementation.

---

## 6. Failure modes (fail closed)

When deployment config says **identity binding is required** for serious HUD use:

| Condition | Expected behavior |
|-----------|-------------------|
| Missing `iss` or `sub` after token validation | **No** session that pretends to be a bound human; approve/execute must not silently use `local-user`. |
| Issuer not in allow-list, or `aud` mismatch | Same: treat as auth failure for binding purposes. |
| Token expired beyond skew | Same. |

HTTP status codes for “no session” vs “session but binding incomplete” follow existing **auth** patterns (`401` / `403`) — align with [ADR-0003](../decisions/0003-execution-policy-v1.md) semantics in implementation (document in route handlers).

---

## 7. Mapping summary (claims → persisted event)

| Logical role | Source | Persisted targets (v1 intent) |
|--------------|--------|-------------------------------|
| Human approver | Validated `(iss, sub)` + label chain | `approvalActorId` (opaque stable), `approvalActorType` = `human`, `approvalActorLabel`, plus **`approvalPrincipalIss` / `approvalPrincipalSub`** (or equivalent). |
| Human executor | Same session at execute time | `executionActorId`, `executionActorType` = `human`, `executionActorLabel`, plus **`executionPrincipalIss` / `executionPrincipalSub`** (or equivalent). |
| Agent proposer | Ingress / proposal path | Unchanged `actorId` / `actorType` / `actorLabel` from proposal pipeline. |

---

## 8. Exit criteria for S0

- [ ] **Human review:** no open questions on `iss`/`sub`/`aud`/`exp`, label order, forbidden `local-user` when binding required, and recoverable `(iss, sub)` for export.
- [x] **Cross-links:** ADR-0007 and roadmap 0006 point here as the pinned contract.
- [x] **S0 scope:** this slice is documentation-only until review passes — **no** identity-binding production code required to merge the contract doc.

When S0 review is complete, **S1** may implement session fields and parsers **only** against this contract.
