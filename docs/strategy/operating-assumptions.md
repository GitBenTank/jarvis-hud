---
title: "Operating assumptions (Jarvis + OpenClaw)"
status: living-document
category: product-strategy
owner: Ben Tankersley
last_reviewed: 2026-04-18
related:
  - jarvis-hud-video-thesis.md
  - agent-team-v1.md
  - ../architecture/jarvis-openclaw-system-overview.md
  - ../openclaw-integration-verification.md
  - ../roadmap/0003-operator-integration-phases.md
  - ../setup/phase1-freeze-checklist.md
  - ../setup/phase2-auth-authority-checklist.md
  - ../setup/local-stack-startup.md
---

# Operating assumptions (Jarvis + OpenClaw)

**Purpose:** Record **current defaults and provisional choices** so future work does not rely on memory or chat. This doc **ages on purpose** when posture changes. The **stable structural map** is [Jarvis ↔ OpenClaw system overview](../architecture/jarvis-openclaw-system-overview.md).

**Rule:** When you change a default here, bump **`last_reviewed`** and add a one-line note if the old assumption misled anyone.

---

## Active assumptions (2026)

### 1. Canonical OpenClaw deployment (for this project)

**Phase 1 — frozen (contract with reality).** For Jarvis HUD day-to-day integration, there is **one** blessed local stack. Other installs (e.g. Homebrew-only gateway, mixed state dirs) are **out of scope** for this contract until §1 is explicitly revised.

| Piece | Blessed choice |
|--------|------------------|
| **Jarvis HUD** | This repository; **`pnpm dev`** (default listen **http://127.0.0.1:3000**) or **`pnpm dev:port`**. In **`.env.local`**, set **`JARVIS_HUD_BASE_URL`** or **`JARVIS_BASE_URL`** to the same host the browser uses (**127.0.0.1**, not `localhost`) so ingress signing and HUD origin checks stay aligned. |
| **OpenClaw** | **Git checkout** of OpenClaw; default clone path **`~/Documents/openclaw`** (override with **`OPENCLAW_ROOT`**). **`OPENCLAW_STATE_DIR=$HOME/.openclaw-dev`** for every gateway process in this flow. Start the gateway with **`pnpm openclaw:dev`** from jarvis-hud (runs **`pnpm gateway:dev`** in the clone via [`scripts/openclaw-gateway-dev.sh`](../../scripts/openclaw-gateway-dev.sh)), or the equivalent manual `cd` + `pnpm gateway:dev` with the same env. |
| **Homebrew / LaunchAgent `openclaw`** | **Stopped** while using this flow — a second gateway causes port, token, and log confusion ([local stack startup](../setup/local-stack-startup.md)). |
| **Control UI** | Set **`OPENCLAW_CONTROL_UI_URL`** in jarvis-hud **`.env.local`** to the **exact** origin the running gateway serves (often **`http://127.0.0.1:19001`**; the gateway log is authoritative). Restart **`pnpm dev`** after changes. |
| **Ingress** | **`POST {JARVIS_HUD_BASE_URL}/api/ingress/openclaw`** with HMAC. **`JARVIS_INGRESS_OPENCLAW_ENABLED=true`**, **`JARVIS_INGRESS_ALLOWLIST_CONNECTORS`** includes **`openclaw`**, **`JARVIS_INGRESS_OPENCLAW_SECRET`** ≥ 32 chars in **`.env.local`**. The gateway must use the **same** secret and **`JARVIS_BASE_URL`** (injected from `.env.local` when using `pnpm openclaw:dev`). |
| **Pass/fail** | From jarvis-hud with processes running: **`pnpm machine-wired`**. **Ground-truth capture:** [Phase 1 freeze checklist](../setup/phase1-freeze-checklist.md). |

**Routine and troubleshooting detail:** [Local stack startup](../setup/local-stack-startup.md) · [Integration verification](../openclaw-integration-verification.md) (includes non-blessed recovery). **If your machine differs**, record it in the checklist first; do not treat alternate stacks as equally valid without updating this section.

---

### 2. Auth and step-up (Jarvis)

**Phase 2 — provisional-but-clear authority model.** Human authority is **not** the same thing as **ingress capability**. Thesis Lock still applies: agents propose; humans approve and execute; receipts are per action.

#### Modes (pick one consciously per environment)

| Mode | `JARVIS_AUTH_ENABLED` | Typical use |
|------|------------------------|-------------|
| **Local convenience** | `false` (default) | Solo dev on a trusted machine; fastest loop. |
| **Demo / rehearsal** | Usually `false` | Same as convenience unless the demo must **show** the session gate — then turn auth **on** and rehearse with browser login + step-up. |
| **Serious** | `true` | Shared machine, sensitive data, or any case where **only identified operators** should reach approve/execute APIs. |

#### Who may do what (blessed stack)

| Action | Local convenience | Serious (`auth` on) |
|--------|-------------------|---------------------|
| **Submit ingress** (`POST /api/ingress/openclaw`) | Any party with **`JARVIS_INGRESS_OPENCLAW_SECRET`** + valid signature (e.g. OpenClaw gateway, scripts). | Same — ingress is **not** end-user SSO; it is **shared capability**. Protect the secret and network like a capability token. |
| **Approve / Execute in HUD** | Anyone who can open the HUD URL and use the UI (no Jarvis session). | **Session required** for gated routes; **step-up** required for execute when policy demands it (`trustPosture.stepUpValid` on `GET /api/config` with browser cookies). |
| **Human identity** | **HMAC does not prove** which human submitted. It proves possession of the ingress secret. | Same for ingress. **Browser session** (when auth on) is the boundary for “who is at the HUD.” |

#### `stepUpValid` (normal use)

- Surfaced on **`GET /api/config`** inside **`trustPosture.stepUpValid`** (canonical for agents — [OpenClaw V1 contract](../architecture/openclaw-v1-contract.md)).
- **`null`:** auth is **off** → step-up is **N/A**, not “failed.”
- **`true` / `false`:** auth is **on** → reflects **this request’s cookies** (browser with session). **Headless** callers (Node, OpenClaw tools without cookies) usually see **`false`** or cannot distinguish step-up — that is **not** “step-up broken”; it is **no browser session on this client**. Do not treat cookieless `GET /api/config` as proof the operator has stepped up.

#### Headless submitters (OpenClaw, CI)

- **Allowed** today for ingress when the secret is configured — they **propose** only; execution still requires HUD approval (and auth + step-up when enabled).
- **Risk:** a leaked secret is **full submission capability** until rotated. Serious mode must include **who may hold the secret** and **network placement** (record in [Phase 2 checklist](../setup/phase2-auth-authority-checklist.md)).

#### Probes

- **`pnpm auth-posture`** — cookieless; prints convenience-mode reminders or validates auth-on + secret presence; optional **`JARVIS_EXPECT_AUTH=true`** fails if auth is off (guardrail for “serious” hosts).
- **`pnpm machine-wired`** — Phase 1 stack / Control UI (run both).

**Still provisional:** per-tenant SSO, per-connector identity at ingress, and CI policy are **not** specified here — extend §2 in the same PR when you add code.

---

### 3. Local-first vs hosted control plane

**Assumption:** **Jarvis HUD is local-first** for the current product phase: file-backed storage under `JARVIS_ROOT`, operator-owned machine.

**Provisional:** A **hosted** control plane is **not** a committed roadmap item in this file; if that changes, update here before marketing or fundraising claims.

---

### 4. Stock OpenClaw vs Jarvis-specific affordances

**Assumption:** **Stock OpenClaw** + workspace docs + HTTP ingress is the default integration path. **Fork-only** or **native “submit to Jarvis”** tooling is **not** required for v1 loops.

**Provisional:** Revisit if maintenance cost of workspace-only discipline exceeds a fork/tool budget.

---

### 5. Kind taxonomy ownership

**Owner:** **Jarvis HUD** — `ALLOWED_KINDS`, ingress validation, execute policy, and adapters must stay aligned ([policy](../../src/lib/policy.ts), [validate-openclaw-proposal](../../src/lib/ingress/validate-openclaw-proposal.ts)).

**Assumption (research v0):** **`system.note`** carries research batches until a dedicated kind is justified ([Research batch workflow v1](./research-batch-workflow-v1.md)).

**Provisional:** Introducing `research.*` (or similar) requires **ingress + policy + UI copy** in one change set, not “agent-only.”

---

### 6. Batch semantics (operator-facing)

**Assumption:** **`batch`** metadata is **advisory review context only**; **execute and receipts are per proposal `id`** ([ADR-0005](../decisions/0005-agent-team-batch-v0-per-item-execute.md), [operator checklist](../setup/openclaw-jarvis-operator-checklist.md)).

---

## Review cadence

- **Quarterly** or before a major demo / fundraise: skim sections 1–5 and update **provisional** notes.
- After **material product decisions**: update this file in the **same PR** as code or ADR when possible.

---

## See also

- [Phase 2 auth authority checklist](../setup/phase2-auth-authority-checklist.md)
- [Phase 1 freeze checklist](../setup/phase1-freeze-checklist.md)
- [Operator integration phases (roadmap)](../roadmap/0003-operator-integration-phases.md)
- [Jarvis ↔ OpenClaw system overview](../architecture/jarvis-openclaw-system-overview.md)
- [Agent team v1](./agent-team-v1.md)
- [Thesis Lock](./jarvis-hud-video-thesis.md#thesis-lock-do-not-drift)
