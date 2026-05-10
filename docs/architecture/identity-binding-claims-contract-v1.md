# Identity binding — OIDC claims contract (v1)

**Status:** Accepted — **S0 closed** (contract frozen for S1+)  
**Owner:** Ben Tankersley  
**Date:** 2026-05  

**Binds:** [ADR-0007: Identity binding v1](../decisions/0007-identity-binding-v1.md) · [Tranche 0006](../roadmap/0006-identity-binding-tranche.md) (S0 closed → **S1** session binding)  
**Related:** Actor placeholders today: `src/lib/actor-identity.ts` (`ACTOR_LOCAL_USER`) · [Operating assumptions §2](../strategy/operating-assumptions.md#2-auth-and-step-up-jarvis)

---

## 1. Purpose (what this document is)

This is the **claims contract** agreed in **S0** and frozen for **S1+**: the smallest set of **normative rules** that downstream slices (session, persistence, export, probes) can implement without re-litigating identity philosophy.

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

### 4a. Implementer guardrails (S1 onward)

1. **`actorId` vs `iss` / `sub`:** Persisted **`approvalPrincipalIss` / `approvalPrincipalSub`** (and execution equivalents) are the **source of truth** for external principal and for **F2** export correlation. Human **`approvalActorId` / `executionActorId`** are a **derived stable handle** (deterministic function of `(iss, sub)`) for callers that expect one id string — document the derivation in code. **Do not** treat `actorId` as overriding or replacing `iss`/`sub` when both are present; audit paths should prefer the explicit pair.
2. **Display labels vs fail-closed:** The label fallback chain (§3) is for **readability only** (UI, `*ActorLabel`, export). It **must not** weaken the **fail-closed** rule (§6): if binding is **required** and `(iss, sub)` cannot be validated and persisted, **do not** mint a session or human row that “looks fine” via a display name or `local-user`. Missing bind ⇒ auth/session failure path — labels apply only **after** a successful bind.

---

## 5. Session shape (contract only — slice S1)

After successful OIDC validation, the **Jarvis session** (today: signed cookie payload) must be able to carry at least:

| Field | Meaning |
|-------|---------|
| `oidcIss` | Issuer string (same normalization as persistence). |
| `oidcSub` | Subject string. |
| `oidcClaimsAt` | Unix ms when claims were validated (for staleness / re-auth policy later). |

Exact JSON field names may match the table above or a single nested `principal: { iss, sub }` object — **one shape**, documented once in implementation.

**S1 implementation (shipped):**

- Session cookie JSON includes `oidcIss`, `oidcSub`, `oidcClaimsAt` when bound.
- **Stub bind (dev/test only):** `POST /api/auth/oidc/stub-bind` with existing session cookie and JSON body `{ "iss", "sub" }`. Requires `JARVIS_OIDC_STUB_BIND=true`, `JARVIS_OIDC_ISSUER_ALLOWLIST` (comma-separated issuers, normalized), and `iss` allowed. Disabled by default (`404`).
- **Step-up:** when `JARVIS_IDENTITY_BINDING_REQUIRED=true`, `POST /api/auth/step-up` returns **403** until OIDC fields are present (`identity_binding_required`).
- **`GET /api/auth/status`:** includes `identityBindingRequired` and `identityBound` for UI / probes.

**S2 implementation (shipped):**

- **`src/lib/governed-human-principal.ts`:** `resolveGovernedHumanPrincipal`, `deriveOidcPrincipalActorId` (opaque handle; **`iss`/`sub` still persisted** on the event).
- **Approve / deny / execute:** require session when auth on; persist bound or local human fields; **403** `identity_binding_required` when env requires binding and session lacks OIDC.
- **Receipts:** `buildReceiptActorsFromEvent` reads persisted `executionActor*` from the event row (set before `appendActionLog`).
- **Golden loop:** `scripts/lib/golden-loop-shared.mjs` calls **`POST /api/auth/oidc/stub-bind`** after init when `JARVIS_IDENTITY_BINDING_REQUIRED=true` (needs `JARVIS_OIDC_STUB_BIND`, allowlist, **`GOLDEN_LOOP_OIDC_ISS`**, **`GOLDEN_LOOP_OIDC_SUB`**).

---

## 6. Failure modes (fail closed)

When deployment config says **identity binding is required** for serious HUD use:

| Condition | Expected behavior |
|-----------|-------------------|
| Missing `iss` or `sub` after token validation | **No** session that pretends to be a bound human; approve/execute must not silently use `local-user`. |
| Issuer not in allow-list, or `aud` mismatch | Same: treat as auth failure for binding purposes. |
| Token expired beyond skew | Same. |
| **Read path:** stored lifecycle row claims **human** approve/execute but principal pair missing while binding required | **409** `identity_binding_integrity` on export / trace / replay — do not emit a misleading artifact (§9.3). |

HTTP status codes for “no session” vs “session but binding incomplete” follow existing **auth** patterns (`401` / `403`) — align with [ADR-0003](../decisions/0003-execution-policy-v1.md) semantics in implementation (document in route handlers). **Artifact integrity** on read uses **409** (§9.3).

---

## 7. Mapping summary (claims → persisted event)

| Logical role | Source | Persisted targets (v1 intent) |
|--------------|--------|-------------------------------|
| Human approver | Validated `(iss, sub)` + label chain | `approvalActorId` (opaque stable), `approvalActorType` = `human`, `approvalActorLabel`, plus **`approvalPrincipalIss` / `approvalPrincipalSub`** (or equivalent). |
| Human executor | Same session at execute time | `executionActorId`, `executionActorType` = `human`, `executionActorLabel`, plus **`executionPrincipalIss` / `executionPrincipalSub`** (or equivalent). |
| Agent proposer | Ingress / proposal path | Unchanged `actorId` / `actorType` / `actorLabel` from proposal pipeline. |

---

## 8. S0 closure checklist

- [x] **Human review:** owner sign-off — contract is narrow, trust boundary explicit, fail-closed for required binding, no silent `local-user` fiction; **`iss`/`sub`** recoverable for export (§4).
- [x] **Cross-links:** ADR-0007 and roadmap 0006 point here as the pinned contract.
- [x] **S0 slice:** documentation landed before identity binding code; guardrails for S1 in §4a.

**S1 next:** implement session fields and OIDC parsers **only** against §§3–6 and §4a — no drift from this document without a new ADR or contract revision.

---

## 9. Read surfaces (S3)

**Goal:** A reviewer opening an **audit export**, **trace JSON**, or **replay** payload can see **which OIDC principal approved** and **which executed**, without inferring from display labels alone.

**Implementation:** `src/lib/audit-export-identity.ts` (validation + `humanPrincipals` augmentation), `src/lib/audit-export.ts`, `src/lib/trace-replay.ts`, `GET /api/audit/export`, `GET /api/traces/[traceId]`, `GET /api/traces/[traceId]/replay`.

### 9.1 humanPrincipals on export rows (reviewer shape)

Raw lifecycle rows keep the persisted columns (`approvalPrincipalIss`, `approvalPrincipalSub`, `executionPrincipalIss`, `executionPrincipalSub`, plus `approvalActor*` / `executionActor*`). The export **adds** a single nested object so approver vs executor are obvious side-by-side:

```json
{
  "id": "evt-7f2a…",
  "traceId": "trace-7f2a…",
  "status": "approved",
  "executed": true,
  "approvalActorId": "oidc1:https%3A%2F%2Fidp.example%2F|sub-alice",
  "approvalActorType": "human",
  "approvalPrincipalIss": "https://idp.example/",
  "approvalPrincipalSub": "sub-alice",
  "executionActorId": "oidc1:https%3A%2F%2Fidp.example%2F|sub-bob",
  "executionActorType": "human",
  "executionPrincipalIss": "https://idp.example/",
  "executionPrincipalSub": "sub-bob",
  "humanPrincipals": {
    "approval": {
      "actorId": "oidc1:https%3A%2F%2Fidp.example%2F|sub-alice",
      "actorType": "human",
      "actorLabel": "Alice Example",
      "principalIss": "https://idp.example/",
      "principalSub": "sub-alice"
    },
    "execution": {
      "actorId": "oidc1:https%3A%2F%2Fidp.example%2F|sub-bob",
      "actorType": "human",
      "actorLabel": "Bob Ops",
      "principalIss": "https://idp.example/",
      "principalSub": "sub-bob"
    }
  }
}
```

Same person for both roles is valid: `humanPrincipals.approval` and `humanPrincipals.execution` would then show the same `principalSub` (and often the same `actorId`).

### 9.2 Trace and replay

- **`GET /api/traces/{traceId}`** — each item in `events[]` includes the four `*Principal*` fields when present, plus `humanPrincipals` when there is anything to mirror.
- **`GET /api/traces/{traceId}/replay`** — the `approval` object includes the principal columns, `humanPrincipals`, and a short `principalRolesNote`; the `execution` summary includes persisted execution principals alongside receipt `actors`.

### 9.3 Integrity refusal (HTTP 409)

When **`JARVIS_IDENTITY_BINDING_REQUIRED=true`**, read paths **fail closed** if a stored row claims a **human** approval or execution but lacks the corresponding persisted **`iss` / `sub` pair** (see validation in `audit-export-identity.ts`). That is treated as an inconsistent artifact set, not a silent repair.

Example body (message text may vary by row id):

```json
{
  "error": "Event evt-1: approval references a human actor but is missing approvalPrincipalIss/approvalPrincipalSub while identity binding is required",
  "code": "identity_binding_integrity"
}
```

Applies to **audit export** and **trace / replay** responses that run the same check.
