---
title: "Jarvis HUD — Trust boundary"
status: "living-document"
category: architecture
related:
  - strategy/jarvis-hud-video-thesis.md
  - architecture/control-plane.md
  - architecture/openclaw-strict-mode-enforcement.md
  - architecture/openclaw-jarvis-trust-contract.md
  - architecture/openclaw-proposal-identity-and-contract.md
  - security/openclaw-ingress-signing.md
  - demo-governed-execution-checklist.md
---

# Jarvis HUD — Trust boundary

Canonical statement of what Jarvis **does and does not** guarantee, and how that relates to OpenClaw and local tooling. Aligns with [Thesis Lock](strategy/jarvis-hud-video-thesis.md#thesis-lock-do-not-drift): agents may propose; execution requires explicit human approval; approval does not equal execution; every governed run produces receipts.

---

## Core theorem

**Jarvis is the only place where governed reality changes.**

All system guarantees, audit claims, and operator expectations for **governed** actions derive from this rule.

---

## System architecture

### Capability plane (OpenClaw + tools)

- Generates proposals and supporting analysis.
- Performs background preparation.
- May access local tools, files, or external systems **depending on its configuration** (outside Jarvis’s control unless you enforce strict mode).

### Authority plane (Jarvis HUD)

- Receives proposals via signed ingress (`POST /api/ingress/openclaw`).
- Presents proposals to operators.
- Enforces **approval** and **execution** as separate steps.
- Runs execution adapters after explicit operator action.
- Records events, receipts, traces, and approval-time safety snapshots.

Deeper control-plane diagram: [Control plane architecture](architecture/control-plane.md).

---

## Governed execution model

For any action that **flows through Jarvis**:

1. Proposal is submitted (`POST /api/ingress/openclaw`).
2. Proposal enters **pending** state.
3. Human operator **explicitly approves** (or denies).
4. Human operator **explicitly executes** (separate from approval).
5. Jarvis performs the action via its execution path.
6. Jarvis records **event**, **execution outcome**, **receipts**, **trace**, and (when present) **approval-time preflight snapshot**.

### Guarantee

**No governed action executes without explicit human approval and explicit execution in Jarvis.**

---

## What Jarvis guarantees

For actions that **pass through** Jarvis (ingress → approve → execute):

- Approval is required before execution.
- Execution is a separate, explicit operator step.
- Governed runs produce traceable records (events, action/receipt logs, trace views).
- Approval-time safety context can be preserved (preflight snapshot at approve).
- Execution outcomes are represented consistently in the HUD (success, blocked, failed), derived from persisted state.

OpenClaw wire identity and fields: [OpenClaw proposal identity & v1 contract](architecture/openclaw-proposal-identity-and-contract.md).  
Ingress signing: [OpenClaw ingress signing](security/openclaw-ingress-signing.md).  
Operator demo script: [Governed execution checklist](demo-governed-execution-checklist.md).

---

## What Jarvis does **not** guarantee

Jarvis does **not** guarantee control over:

- Actions performed **directly** by OpenClaw, the host OS, IDEs, or other tools **outside** the Jarvis execution path.
- Local file mutations or shell commands that never went through Jarvis **Execute**.
- External systems modified without going through Jarvis (unless you integrate them solely via Jarvis).

Honesty and posture rules for agents vs substrate: [OpenClaw ↔ Jarvis trust contract](architecture/openclaw-jarvis-trust-contract.md).

---

## Operating modes

### Strict mode (recommended for enterprise narrative)

- OpenClaw is **not** allowed to mutate **governed** systems (repo, production targets, etc.) except by submitting proposals to Jarvis.
- Execution-capable effects on those systems go **only** through Jarvis after approve + execute.

Strict mode is enforced **mechanically** via tool-level constraints in OpenClaw. Mutation-capable tools (for example file writes, shell execution, and code changes) are **not** directly accessible to agents; instead, effects are routed through Jarvis as proposals, which still require **explicit human approval** and **explicit execution** in the HUD. This enforcement is implemented at the **capability** layer (tool registration, gateway policy, skills), not via prompt instructions.

Spec: [OpenClaw strict mode — capability-layer enforcement](architecture/openclaw-strict-mode-enforcement.md).

**Result:** Trace and receipts align with **complete** governed execution truth; strongest trust posture.

### Hybrid mode (optional)

- OpenClaw (or the operator) may perform **out-of-band** actions.
- Jarvis governs **only** what was submitted and executed through its control plane.

**Requirement:** Out-of-band work must be **explicitly** labeled in operator process and messaging as **not governed execution (outside Jarvis)**.

**Result:** More flexibility; **narrower** guarantee scope; higher burden on honesty and training.

---

## Audit and trace model

Jarvis records, for governed flows:

- Proposal ingress (signed, validated).
- Approval / rejection decisions (with actor fields when present).
- Execution attempts and outcomes.
- Approval-time safety snapshots (when the client submits them on approve).
- Action and receipt logs associated with execution.

Together these form the **authoritative audit trail for governed actions**.

**Tampering:** Today, persistence is under operator control of `JARVIS_ROOT` (files). Enterprise hardening typically adds append-only or WORM storage, admin action logs, backup integrity, and access controls—see roadmap below.

---

## Identity model (OpenClaw ingress)

Each proposal may include:

| Field | Role |
|--------|------|
| **`agent`** | Canonical **proposer** label (operator-facing). |
| **`builder`** | Optional construction metadata (non-authoritative for approval). |
| **`source.agentId`** | Runtime / correlation identity. |
| **`source.connector`** | Ingress path (e.g. `openclaw`). |

Details: [OpenClaw proposal identity & v1 contract](architecture/openclaw-proposal-identity-and-contract.md).

---

## Security boundary (summary)

- Ingress is **signed** and **validated** before events are stored.
- Execution requires **explicit** operator interaction in the HUD (approve, then execute).
- **No** governed execution is triggered implicitly from agent ingress alone.

---

## Roadmap (not yet product guarantees)

Items that strengthen enterprise **proof** but are not asserted as current guarantees unless implemented:

- SSO, RBAC, separation of duties.
- Immutable / tamper-evident log storage.
- Dedicated admin audit log (policy, keys, roles).
- Multi-tenant isolation (if applicable).

---

## Summary

**Agents can think, prepare, and propose. Only Jarvis can make those proposals real on the governed path—after explicit human approval and explicit execution.**

---

## See also

- [Control plane architecture](architecture/control-plane.md)
- [OpenClaw strict mode enforcement](architecture/openclaw-strict-mode-enforcement.md)
- [OpenClaw ↔ Jarvis trust contract](architecture/openclaw-jarvis-trust-contract.md)
- [OpenClaw V1 — Jarvis integration contract](architecture/openclaw-v1-contract.md)
- [Thesis Lock](strategy/jarvis-hud-video-thesis.md#thesis-lock-do-not-drift)
