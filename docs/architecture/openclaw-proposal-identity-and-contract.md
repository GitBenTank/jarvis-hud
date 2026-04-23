# OpenClaw proposal identity & v1 contract (Jarvis HUD)

Canonical field meanings for **`POST /api/ingress/openclaw`** and the **stored** `events/*.json` rows it appends. Complements the trace-grounded assessment in [openclaw-proposal-contract-trace-assessment.md](./openclaw-proposal-contract-trace-assessment.md).

---

## Identity semantics

| Field | Role |
|--------|------|
| **`agent` (wire)** | Optional **logical proposing agent** — the label Jarvis shows for “who proposed” (coordinator / operator-facing name). |
| **`agent` (stored)** | Same meaning after ingress: always set (see fallback below). Drives `actorId` / `actorLabel` via `agentActorFromAgentField()`. |
| **`builder` (wire / stored)** | Optional **proposal-construction metadata only** (e.g. specialist that drafted text). **Never** substitutes for `agent` and **never** overrides actor derivation. |
| **`source.agentId` (wire / stored)** | **Raw upstream runtime identity** from the connector (instance id, process id, role key, etc.). Persisted **when provided**; may equal stored `agent` when the client omits `agent` and the fallback uses `source.agentId`. |
| **`source.connector`** | **Transport / source system**; for this endpoint must be `"openclaw"`. |

**Implementation:** `src/lib/ingress/openclaw-proposal-identity.ts` (`resolveOpenClawLogicalAgent`), `src/app/api/ingress/openclaw/route.ts`.

---

## Intentional fallback when `agent` is omitted

If the wire body has no usable `agent` (missing, empty, or whitespace-only), Jarvis does **not** default to the string `"openclaw"` (that implied a product name, not a proposer).

**Rule (v1):**

1. If `body.agent` is a non-empty string after trim → stored `agent` = that value.
2. Else if `source.agentId` is a non-empty string after trim → stored `agent` = that value (logical label mirrors upstream runtime id).
3. Else → stored `agent` = **`unknown-proposer`** (explicit, auditable sentinel).

Constant: `OPENCLAW_INGRESS_UNKNOWN_PROPOSER_AGENT` in `openclaw-proposal-identity.ts`.

---

## Minimal v1 contract

### Wire (strict validator: `validateOpenClawProposal`)

**Always required**

- `kind` (allowlisted)
- `title` (≤ 120 chars)
- `summary` (≤ 500 chars)
- `source: { connector: "openclaw" }`

**Kind-specific**

- **`system.note`:** `payload` must be an object with `payload.note` a **non-empty** string (≤ 50,000 chars).
- **`code.apply` / `code.diff`:** patch or `payload.code.diffText` per existing rules.

**Optional (recommended for correlation)**

- `agent`, `builder`, `provider`, `model`, `correlationId`
- `source.sessionId`, `source.agentId` (≤ 128 chars), `source.requestId`

`agent` and `source.agentId` are **independent**: send a human coordinator in `agent` and a machine id in `source.agentId` when both exist.

**Optional (review container only — ADR-0005)**

- `batch` — plain object, **only** these keys allowed: `id` (string, ≤ 128 chars after trim), `title` (optional string, ≤ 200 chars after trim), `summary` (optional string, ≤ 2000 chars after trim), `itemIndex` (non-negative integer), `itemCount` (integer 1–100, must be **greater than** `itemIndex`). Extra keys are rejected. Semantics are validated at ingress by `strictValidateIngressBatch` in `src/lib/proposal-batch.ts` (fail closed before HMAC). **Do not** put `batch` inside `payload` — it is stripped/forbidden there; send it **top-level** only.

### Stored event (after successful ingress)

Jarvis appends a row that **always** includes:

- Top-level: `kind`, `title`, `summary`, **`agent`** (resolved), `payload`, `source.connector`, ingress verification fields (`nonce`, `timestamp`, `verified`, `receivedAt`), HUD `id` / `traceId`, `actorId` / `actorType` / `actorLabel`, `proposalStatus` (current path), `trustedIngress`.

**Payload mirror:** `payload.kind`, `payload.title`, `payload.summary` are merged from the body for every kind.

**When the client sends it:** `source.agentId` is stored under `source.agentId` unchanged (trimmed). If omitted, the key is absent — there is no invented default.

**When the client sends `batch`:** the normalized object (trimmed strings, no extra keys) is stored **top-level** on the event alongside `payload`. Each proposal still has its own HUD `id` for approval and execution.

---

## Thesis Lock

Ingress only **records** proposals; execution still requires **human approval** and separate **Execute**. This doc does not grant agents authority; it names fields for **receipts and trace truth**.

---

## See also

- [OpenClaw ingress for humans](../setup/openclaw-ingress-for-humans.md) — non-coder overview of the proposal journey
- [Missing `agent` fallback (short operator note)](./openclaw-missing-agent-fallback.md)
- [OpenClaw V1 — Jarvis integration contract](./openclaw-v1-contract.md)
- [OpenClaw ↔ Jarvis trust contract](./openclaw-jarvis-trust-contract.md)
- [Trace-grounded proposal assessment](./openclaw-proposal-contract-trace-assessment.md)
- `src/lib/ingress/validate-openclaw-proposal.ts`
- `src/app/api/ingress/openclaw/route.ts`
- `src/lib/proposal-batch.ts` (`strictValidateIngressBatch`)
