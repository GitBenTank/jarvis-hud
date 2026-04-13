# OpenClaw → Jarvis proposal contract — trace-grounded assessment

**Scope:** Stored HUD events on disk (`~/jarvis/events/*.json`) where `source.connector === "openclaw"`, scanned across a **60-day rolling window** of date-key files (as of **2026-04-11**). **N = 25** matching events. This describes **what actually landed in the log**, not aspirational wire JSON.

**Ingress persistence (for comparison):** `POST /api/ingress/openclaw` materializes the stored row in `src/app/api/ingress/openclaw/route.ts` (payload merge, coordinator → `event.agent`, optional `builder` / `provider` / `model`, `source.*` from the body plus verification metadata).

---

## 1. Fields consistently present (OpenClaw rows)

Across all **25** events:

| Area | Fields |
|------|--------|
| **Identity / envelope** | `id`, `traceId`, `type` (`proposed_action`), `createdAt` |
| **Proposal copy (top-level mirror)** | `kind`, `title`, `summary` |
| **Agent slot** | `agent` (always a string; often `"openclaw"` or a coordinator name — see §4) |
| **Payload shell** | `payload` object always containing at least `kind`, `title`, `summary` (HUD merges these from the body) |
| **Gate defaults** | `requiresApproval: true` |
| **Ingress proof** | `source.connector`, `source.receivedAt`, `source.verified`, `source.nonce`, `source.timestamp` |
| **Trust strip** | `trustedIngress` |

These match the ingress event shape: the route always writes the core envelope and `source` verification fields.

---

## 2. Inconsistent or missing fields

**Lifecycle / operator fields (expected to vary):** `status`, `proposalStatus`, `approvedAt`, `executed`, `executedAt`, `rejectedAt`, approval/rejection/execution actor fields — present only after human or system transitions. Not part of the ingress “proposal created” minimum; they appear on **~52%** of this sample once runs completed.

**Historically sparse on older rows:**

- **`proposalStatus`:** **24/25 (96%)**. One **2026-03-03** row omits it (legacy or pre-field storage).
- **`actorId` / `actorType` / `actorLabel`:** **6/25 (24%)**. Recent rows include them; **older March** OpenClaw events store **no** `actor*` block. Operators interpreting traces must not assume `actor*` always exists on historical OpenClaw proposals.

**Optional OpenClaw metadata (often absent):**

- **`correlationId`:** **9/25 (36%)**
- **`builder`:** **4/25 (16%)** (only on the Alfred + Forge path in this sample)
- **`provider` / `model`:** **2/25 (8%)** each
- **`source.sessionId`:** **9/25 (36%)**
- **`source.agentId`:** **11/25 (44%)**
- **`source.requestId`:** **2/25 (8%)**

**Kind-specific payload gaps (real failures vs happy path):**

- **`system.note` → `payload.note`:** **23/25 (92%)**. Two exceptions: one `system.note` with only `{ kind, title, summary }` (no `note`), and one `code.apply` row (expected to carry `code`, not `note`).

**Takeaway:** The **stable core** is the envelope + mirrored `kind`/`title`/`summary` + `payload` object + `source` verification block. Everything else is **environment- and age-dependent**.

---

## 3. Recommended minimal required schema (v1)

Split **wire** (what OpenClaw POSTs) from **stored** (what the HUD guarantees after ingress).

### 3.1 Wire body (OpenClaw → `POST /api/ingress/openclaw`)

Align with strict validation in `src/lib/ingress/validate-openclaw-proposal.ts`:

- **Required:** `kind` (allowlisted), `title` (≤ 120 chars), `summary` (≤ 500 chars), `source: { connector: "openclaw" }`.
- **Kind-required payload (operator truth):** For **`system.note`**, treat **`payload.note`** as **required in v1** — the trace sample shows operators rely on note text; missing `note` produces an empty “what was proposed” surface.
- **Recommended (identity / correlation):** `agent` (coordinator name) when not relying on the default stored `openclaw` label; `correlationId`; `source.sessionId` and/or `source.agentId` if the connector can supply stable IDs for support and dedupe stories.
- **Optional:** `builder`, `provider`, `model`, `payload` extensions per kind, `patch` for `code.apply` per ingress rules.

### 3.2 Stored event (HUD log row)

After ingress, treat as **canonical for UI and trace**:

- **Always present for new ingress:** envelope fields in §1 plus HUD-assigned `id`, `traceId`, `actorId` / `actorType` / `actorLabel` (current code path), `proposalStatus` where written, and merged `payload` (with forbidden keys stripped — see `FORBIDDEN_PAYLOAD_KEYS` in the ingress route).

**v1 “done means” checklist for producers:** body validates → response returns `id` + `traceId` → stored file row contains `payload` appropriate to `kind` (e.g. `note` for `system.note`, `code` for `code.apply`).

---

## 4. `builder` / `agent` / `source.agentId` — clear or ambiguous?

**Ambiguous on the stored record without external convention** — the sample shows **two different identity stories**:

1. **Coordinator-forward path:** `agent` is a human-readable coordinator (e.g. `"alfred"`), often matches **`actorId`** / **`actorLabel`** and, when sent, **`source.agentId`** (e.g. all `"alfred"` on recent demo rows).
2. **Default path:** `agent` is **`"openclaw"`** (fallback when the body omits `agent`), while **`source.agentId`** may still be set to an **opaque connector id** (e.g. **`"main"`**). Here **`agent` ≠ `source.agentId`** on **9/11** events that had both fields set; equality held on **2/11** (the coordinator-forward cases).

**`builder`:** In this dataset it only appears alongside the coordinator-forward path (**4** rows), consistent with “specialist that drafted the proposal” in ingress comments. It is **not** a second proposer id in the trust sense — it is **metadata**; the HUD still derives `actor*` from **`body.agent`** when present, not from `builder`.

**Practical guidance for v1:**

- Treat **`event.agent`** as **“coordinator / proposer label for HUD actor derivation”** (or the string **`openclaw`** when omitted).
- Treat **`source.agentId`** as **connector-local instance or role id** — **do not assume** it equals `event.agent` unless your integration explicitly sets both that way.
- Treat **`builder`** as **drafting specialist metadata**, optional, **not** interchangeable with `agent` or `source.agentId`.

---

## See also

- [OpenClaw V1 — Jarvis integration contract](./openclaw-v1-contract.md)
- [OpenClaw ↔ Jarvis trust contract](./openclaw-jarvis-trust-contract.md)
- Ingress implementation: `src/app/api/ingress/openclaw/route.ts`
- Strict wire validation: `src/lib/ingress/validate-openclaw-proposal.ts`
