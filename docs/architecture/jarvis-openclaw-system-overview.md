---
title: "Jarvis HUD ↔ OpenClaw — system overview"
status: living-document
category: architecture
related:
  - ../strategy/jarvis-hud-video-thesis.md
  - ../strategy/operating-assumptions.md
  - control-plane.md
  - openclaw-v1-contract.md
  - ../openclaw-integration-verification.md
  - ../security/openclaw-ingress-signing.md
---

# Jarvis HUD ↔ OpenClaw — system overview

**Purpose:** A **stable map** of how the two systems relate, how data flows, and where truth lives. Product posture and “what we assume this quarter” belong in [Operating assumptions](../strategy/operating-assumptions.md), not here—so this file does not need to change every time defaults shift.

---

## Roles

| Layer | System | Responsibility |
|--------|--------|----------------|
| **Capability** | **OpenClaw** (gateway, workspace, models, skills, Control UI) | Cognition, drafting, tooling, orchestration **without** being the system of record for **approved execution**. |
| **Authority** | **Jarvis HUD** | Signed **ingress**, **approval queue**, **policy gate**, **execute**, **receipts**, **traces**, **activity**. |

**Constitutional rule:** [Thesis Lock](../strategy/jarvis-hud-video-thesis.md#thesis-lock-do-not-drift) — agents may propose; **execution requires explicit human approval**; **approval ≠ execution**; **every action produces receipts**; **the model is not a trusted principal**; **autonomy in thinking, authority in action**.

---

## End-to-end flow

1. **OpenClaw** (or any signed client) builds a **proposal** JSON and `POST`s to **`/api/ingress/openclaw`**.
2. **Jarvis** verifies **HMAC**, **nonce**, **allowlist**, and **body validation** (including optional strict **`batch`**). See [Ingress signing](../security/openclaw-ingress-signing.md), [validate-openclaw-proposal](../../src/lib/ingress/validate-openclaw-proposal.ts), [proposal-batch](../../src/lib/proposal-batch.ts).
3. A **pending event** is appended (proposal **`id`** + **`traceId`** are the audit spine for that row).
4. A **human** approves in the HUD; **execute** is a **separate** action on **`/api/execute/[approvalId]`**.
5. **Policy** runs before adapters; **receipts** and **activity** record what ran, keyed by **`approvalId`** (= proposal **`id`**).

Deeper diagrams: [Control plane architecture](./control-plane.md).

---

## OpenClaw (external reference)

OpenClaw is documented upstream as a **gateway** with configuration under **`~/.openclaw/openclaw.json`** (JSON5), Control UI, CLI, and strict config validation. It is **not** defined by Jarvis; Jarvis defines **only** how proposals enter the control plane.

**Official docs (bookmark):**

- Index: [https://docs.openclaw.ai/llms.txt](https://docs.openclaw.ai/llms.txt)
- Gateway: [https://docs.openclaw.ai/gateway/](https://docs.openclaw.ai/gateway/)
- Configuration: [https://docs.openclaw.ai/gateway/configuration](https://docs.openclaw.ai/gateway/configuration)

**This repo** documents **integration** (secrets, base URL, state dir pitfalls): [OpenClaw integration verification](../openclaw-integration-verification.md), [Operator checklist](../setup/openclaw-jarvis-operator-checklist.md), [OpenClaw V1 — Jarvis integration contract](./openclaw-v1-contract.md).

---

## Governance artifacts (Jarvis)

| Topic | Doc |
|--------|-----|
| Thesis + Thesis Lock | [Video thesis](../strategy/jarvis-hud-video-thesis.md) |
| Batch = review container; per-item execute | [ADR-0005](../decisions/0005-agent-team-batch-v0-per-item-execute.md), [Agent team v1](../strategy/agent-team-v1.md) |
| First research loop | [Research batch workflow v1](../strategy/research-batch-workflow-v1.md) |
| Proposal identity (`agent`, `builder`, `source.agentId`) | [OpenClaw proposal identity & contract](./openclaw-proposal-identity-and-contract.md) |
| Execution policy gate | [ADR-0003](../decisions/0003-execution-policy-v1.md) |

---

## Identifier discipline

Any surface that claims to explain **what happened** after a run should tie to **proposal id** and **trace id** where applicable. Ambiguity **migrates** to whichever surface omits those handles. HUD Details and Activity follow that pattern; exports and external narratives should do the same.

---

## See also

- [Operating assumptions](../strategy/operating-assumptions.md) — time-stamped defaults and open decisions
- [Agent execution model](../security/agent-execution-model.md)
- [Thesis Lock ADR](../decisions/0001-thesis-lock.md)
