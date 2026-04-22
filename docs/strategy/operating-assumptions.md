---
title: "Operating assumptions (Jarvis + OpenClaw)"
status: living-document
category: product-strategy
owner: Ben Tankersley
last_reviewed: 2026-04-22
related:
  - jarvis-hud-video-thesis.md
  - agent-team-v1.md
  - ../architecture/jarvis-openclaw-system-overview.md
  - ../openclaw-integration-verification.md
  - ../roadmap/0003-operator-integration-phases.md
---

# Operating assumptions (Jarvis + OpenClaw)

**Purpose:** Record **current defaults and provisional choices** so future work does not rely on memory or chat. This doc **ages on purpose** when posture changes. The **stable structural map** is [Jarvis ↔ OpenClaw system overview](../architecture/jarvis-openclaw-system-overview.md).

**Rule:** When you change a default here, bump **`last_reviewed`** and add a one-line note if the old assumption misled anyone.

---

## Active assumptions (2026)

### 1. Canonical OpenClaw deployment (for this project)

**Assumption:** Each operator runs **one gateway** at a time; **one** `OPENCLAW_STATE_DIR` convention matches the process that owns the Control UI and env (see [integration verification](../openclaw-integration-verification.md): `~/.openclaw` vs `~/.openclaw-dev`).

**Provisional:** We do **not** yet declare a single global “only Homebrew” vs “only git dev” rule for all contributors—**per-machine consistency** matters more than which binary. Revisit when onboarding non-authors.

---

### 2. Auth and step-up (Jarvis)

**Assumption (local / demo):** `JARVIS_AUTH_ENABLED=false` is common; ingress still uses **shared HMAC secret**.

**Provisional (serious use):** Target posture for multi-user or sensitive environments is **not finalized** here. When auth is on, headless clients may see `stepUpValid: null` on `GET /api/config` — that is **unknown / N/A**, not “failed” ([OpenClaw V1 contract](../architecture/openclaw-v1-contract.md)).

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

- [Operator integration phases (roadmap)](../roadmap/0003-operator-integration-phases.md)
- [Jarvis ↔ OpenClaw system overview](../architecture/jarvis-openclaw-system-overview.md)
- [Agent team v1](./agent-team-v1.md)
- [Thesis Lock](./jarvis-hud-video-thesis.md#thesis-lock-do-not-drift)
