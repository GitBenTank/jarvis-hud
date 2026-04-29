---
title: "Jarvis HUD ↔ OpenClaw — system overview"
status: living-document
category: architecture
related:
  - ../README.md
  - ../strategy/jarvis-hud-video-thesis.md
  - ../strategy/operating-assumptions.md
  - control-plane.md
  - openclaw-v1-contract.md
  - ../openclaw-integration-verification.md
  - ../security/openclaw-ingress-signing.md
  - ../strategy/investor-overview-bundle-room-script.md
---

# Jarvis HUD ↔ OpenClaw — system overview

This is the **boundary** that makes the system safe and usable in the real world.

OpenClaw can think, draft, and propose actions. Jarvis is where **authority** lives: humans approve, execution is separate, and every outcome is recorded.

This page shows how that boundary works end-to-end. [Documentation hub](../README.md) · [Operating assumptions](../strategy/operating-assumptions.md) for time-stamped defaults.

---

## What this page shows

Most systems let the model both decide and act. This system does not.

Without this separation, models can trigger real-world effects without clear approval, accountability, or auditability.

This system enforces a **hard boundary**:

- **OpenClaw** is the **capability** layer — models, tools, workspace, drafting, orchestration.
- **Jarvis** is the **authority** layer — signed ingress, approval queue, policy, execution, receipts, traces.
- **Separation is intentional:** cognition and gateways are not substitutes for audited, human-governed outcomes.
- **Agents propose**, **humans approve**, **execution is distinct** from approval (see [Thesis Lock](../strategy/jarvis-hud-video-thesis.md#thesis-lock-do-not-drift)).
- **Receipts** and **traces** are the **proof**: what crossed the boundary, under which approval, with what artifact.

---

## Roles

Two layers exist so **“the model routed it”** never passes for **“a person authorized real-world effects.”** Without that fork, drafts and guesses would blur into irreversible outcomes.

OpenClaw determines what *could* happen. Jarvis determines what *actually* happens.

| Layer | System | Responsibility |
|--------|--------|----------------|
| **Capability** | **OpenClaw** (gateway, workspace, models, skills, Control UI) | Cognition, drafting, tooling, orchestration **without** being the system of record for **approved execution**. |
| **Authority** | **Jarvis HUD** | Signed **ingress**, **approval queue**, **policy gate**, **execute**, **receipts**, **traces**, **activity**. |

**Constitutional rule:** [Thesis Lock](../strategy/jarvis-hud-video-thesis.md#thesis-lock-do-not-drift) — agents may propose; **execution requires explicit human approval**; **approval ≠ execution**; **every action produces receipts**; **the model is not a trusted principal**; **autonomy in thinking, authority in action**.

---

## End-to-end flow

### Five-step path

1. An agent (in OpenClaw) proposes an action.
2. The proposal crosses **ingress** — signed HTTP into Jarvis, not invisible side-effects.
3. It lands as **pending** with stable **ids** (`proposal id`, **trace**) for continuity.
4. A **human** approves intent; **execute** is invoked **separately** when you’re ready for real adapters.
5. **Policy**, then adapters run; outcomes show up as **receipts**, **activity**, and **traces**.

### Technical sequence

1. **OpenClaw** (or any signed client) builds a **proposal** JSON and `POST`s to **`/api/ingress/openclaw`**.
2. **Jarvis** verifies **HMAC**, **nonce**, **allowlist**, and **body validation** (including optional strict **`batch`**). See [Ingress signing](../security/openclaw-ingress-signing.md), [validate-openclaw-proposal](../../src/lib/ingress/validate-openclaw-proposal.ts), [proposal-batch](../../src/lib/proposal-batch.ts).
3. A **pending event** is appended (proposal **`id`** + **`traceId`** are the audit spine for that row).
4. A **human** approves in the HUD; **execute** is a **separate** action on **`/api/execute/[approvalId]`**.
5. **Policy** runs before adapters; **receipts** and **activity** record what ran, keyed by **`approvalId`** (= proposal **`id`**).

Deeper diagrams: [Control plane architecture](./control-plane.md).

---

## OpenClaw — external capability layer

OpenClaw is the **upstream** agent runtime — **gateway**, workspace under state/config, Control UI, models, tooling. It excels at cognition and drafts; it does **not** own **approval**, **execution**, or durable **truth** after a risky effect. Jarvis holds that boundary: proposals **exit** capability space and enter the **authority** plane through signed ingress **only**.

OpenClaw is documented upstream as a **gateway** with configuration under **`~/.openclaw/openclaw.json`** (JSON5), Control UI, CLI, and strict config validation. Jarvis does not define OpenClaw; Jarvis defines how proposals enter the control plane and what becomes binding.

**Official docs (bookmark):**

- Index: [https://docs.openclaw.ai/llms.txt](https://docs.openclaw.ai/llms.txt)
- Gateway: [https://docs.openclaw.ai/gateway/](https://docs.openclaw.ai/gateway/)
- Configuration: [https://docs.openclaw.ai/gateway/configuration](https://docs.openclaw.ai/gateway/configuration)

**This repo** documents **integration** (secrets, base URL, state dir pitfalls): [OpenClaw integration verification](../openclaw-integration-verification.md), [Operator checklist](../setup/openclaw-jarvis-operator-checklist.md), [OpenClaw V1 — Jarvis integration contract](./openclaw-v1-contract.md).

---

## Governance artifacts (Jarvis)

These are the rules that make the system **enforceable** — not just descriptive. Batches, execution rules, specialist workflows, proposal identity—not generic marketing. They support “what we agreed” and “what ran.”

| Topic | Doc |
|--------|-----|
| Thesis + Thesis Lock | [Video thesis](../strategy/jarvis-hud-video-thesis.md) |
| Batch = review container; per-item execute | [ADR-0005](../decisions/0005-agent-team-batch-v0-per-item-execute.md), [Agent team v1](../strategy/agent-team-v1.md) |
| First research loop | [Research batch workflow v1](../strategy/research-batch-workflow-v1.md) |
| Creative specialist v1 (Phase 5) | [Creative batch workflow v1](../strategy/creative-batch-workflow-v1.md) |
| Proposal identity (`agent`, `builder`, `source.agentId`) | [OpenClaw proposal identity & contract](./openclaw-proposal-identity-and-contract.md) |
| Execution policy gate | [ADR-0003](../decisions/0003-execution-policy-v1.md) |

---

## Identifier discipline

Any surface that claims to explain **what happened** after a run should tie to **proposal id** and **trace id** where applicable. Ambiguity **migrates** to whichever surface omits those handles. HUD Details and Activity follow that pattern; exports and external narratives should do the same.

---

## See also

- [Runtime + team + Jarvis — one narrative loop v1](../strategy/runtime-openclaw-jarvis-team-loop-v1.md) — single story: OpenClaw sessions, handoffs, ingress loop
- [Operating assumptions](../strategy/operating-assumptions.md) — time-stamped defaults and open decisions
- [Agent execution model](../security/agent-execution-model.md)
- [Thesis Lock ADR](../decisions/0001-thesis-lock.md)
