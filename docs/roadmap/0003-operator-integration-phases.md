# Operator integration and agent-team phases

**Status:** Living document  
**Owner:** Ben Tankersley  
**Created:** 2026-04  
**Related:**

- [Video thesis / Thesis Lock](../strategy/jarvis-hud-video-thesis.md)
- [Operating assumptions §1–§2](../strategy/operating-assumptions.md) (deployment + auth provisionals)
- [Jarvis ↔ OpenClaw system overview](../architecture/jarvis-openclaw-system-overview.md)
- [OpenClaw integration verification](../openclaw-integration-verification.md)
- [Operator checklist](../setup/openclaw-jarvis-operator-checklist.md)
- [Agent team v1](../strategy/agent-team-v1.md)
- [Research batch workflow v1](../strategy/research-batch-workflow-v1.md)
- [ADR-0001: Thesis Lock](../decisions/0001-thesis-lock.md)
- [ADR-0005: Batch v0, per-item execute](../decisions/0005-agent-team-batch-v0-per-item-execute.md)

---

## Purpose

This roadmap sequences **integration hardening** (OpenClaw + Jarvis HUD), **human authority**, and **agent-team expansion** without drifting [Thesis Lock](../strategy/jarvis-hud-video-thesis.md#thesis-lock-do-not-drift). Phases are numbered for stable reference; **near-term execution order** may differ (see below).

---

## Near-term execution order (recommended)

Do these **next**, in this order:

1. **Phase 1** — Freeze reality (§1 deployment contract, docs, machine-wired probe)
2. **Phase 2** — Lock the human control boundary (auth / step-up on the blessed path)
3. **Phase 4** — Operationalize the first governed loop (research batch v1, rehearsals)
4. **Phase 3** — Standardize proposal authoring (templates, field conventions)
5. **Phase 5** — Add the second specialist (creative agent, same spine)

**Rationale:** Freeze the stack and authority **before** optimizing authoring ergonomics; keep the first loop boringly reliable, then broaden roles.

Phases **6–10** follow when leverage, kinds, team breadth, high-risk capabilities, and packaging need deliberate sequencing.

---

## Phase 1 — Freeze reality

**Goal:** One honest, reproducible local stack.

- Distill the current operator setup into the blessed **[§1 deployment shape](../strategy/operating-assumptions.md#1-canonical-openclaw-deployment-for-this-project)** (frozen in-repo; revise only deliberately).
- Pick **one** canonical:
  - Gateway start path
  - State dir
  - Control UI origin
  - Jarvis HUD base URL
  - Ingress URL + secret source
- **Ground truth template:** [Phase 1 freeze checklist](../setup/phase1-freeze-checklist.md).
- [Integration verification](../openclaw-integration-verification.md) and [operator checklist](../setup/openclaw-jarvis-operator-checklist.md) describe the blessed stack first; other paths are recovery/migration context.
- **Machine pass/fail:** **`pnpm machine-wired`** from jarvis-hud.

**Done when:** A fresh run can answer “does this host match §1?” without interpretation.

---

## Phase 2 — Lock the human control boundary

**Goal:** Make serious use safe and explicit.

- Define auth / step-up posture for the blessed path ([§2](../strategy/operating-assumptions.md#2-auth-and-step-up-jarvis)).
- Clarify:
  - Who may submit ingress
  - Who may approve
  - Who may execute
  - What `stepUpValid` means in real use
- Align UI copy, runbooks, and trust contract docs.
- Test failure modes: no auth, stale auth, headless submitter, wrong secret, wrong origin.

**Done when:** Approval and execution authority are unambiguous on the real stack.

---

## Phase 3 — Standardize proposal authoring

**Goal:** Make agents generate correct proposals by default.

- Add compose-time guidance/templates for OpenClaw submissions.
- Standardize:
  - Top-level fields
  - `batch`
  - Proposal titles/summaries
  - Source/citation conventions
- Keep `system.note` for research until a real kind is needed.
- Make malformed submissions hard to author, not just hard to ingest.

**Done when:** Good proposals are the path of least resistance.

---

## Phase 4 — Operationalize the first agent loop

**Goal:** One boringly reliable governed workflow.

- Keep **research batch v1** as the canonical first loop ([workflow](../strategy/research-batch-workflow-v1.md)).
- Run repeated rehearsals.
- Tune: batch size, copy clarity, review ergonomics, activity and receipt clarity.
- Document known-good operator flow.

**Done when:** Research proposals move through Jarvis without confusion or fear.

---

## Phase 5 — Add the second specialist

**Goal:** Prove the model works beyond one role.

- Introduce **creative agent**.
- Use the same batch and approval semantics.
- No new execution shortcuts.
- Compare research vs creative needs before expanding schema.

**Done when:** Two specialists work through one governance spine without drift.

---

## Phase 6 — Add product leverage

**Goal:** Improve throughput without weakening control.

- Scoring/ranking heuristics
- Reusable batch templates
- Light metrics and evaluation
- Better filtering/search in HUD
- Maybe convenience actions that still expand to per-item execution

**Done when:** Operators move faster, but Thesis Lock remains literally true.

---

## Phase 7 — Define richer kinds

**Goal:** Leave `system.note` only when it becomes a constraint.

- Decide when to introduce `research.*`, `creative.*`, etc.
- Define schema ownership and versioning.
- Align ingress, UI rendering, policy, and docs.

**Done when:** Kind taxonomy helps more than it costs.

---

## Phase 8 — Expand the agent team carefully

**Goal:** More capability, same control model.

Possible additions:

- Planner
- Intake/orchestrator
- Risk reviewer
- Campaign operator

Still:

- Proposals first
- Explicit human approval
- Item-level execution
- Receipts per action

**Done when:** More agents increase leverage, not ambiguity.

---

## Phase 9 — High-risk capabilities as first-class product features

**Goal:** Only now consider dangerous power.

Only after earlier phases are stable:

- Wallet / spend controls
- Publish / outreach actions
- Stronger execution adapters
- Pre-approved policy envelopes, if ever

But only as:

- Explicit Jarvis surfaces
- Policy-bound
- Human-legible
- Receipted
- Kill-switchable

**Done when:** Dangerous actions are governed product objects, not agent improvisation.

---

## Phase 10 — Team / buyer packaging

**Goal:** Move from personal system to sellable system.

- Refine buyer story
- Decide local-first vs hosted posture
- Define serious-user security model
- Package the control plane as a reusable governance product

**Done when:** The product story and the system architecture say the same thing.

---

## Triad (Phase 1 onward)

For integration work, keep **one contract, one narrative, one probe** aligned:

- **Contract:** [Operating assumptions §1](../strategy/operating-assumptions.md) (frozen deployment shape).
- **Narrative:** Verification + operator docs that describe only that shape.
- **Probe:** Single pass/fail check that the host matches §1 end-to-end.

---

## See also

- [Master plan](./0000-master-plan.md)
- [Technical roadmap — production](./0001-technical-roadmap-production.md)
- [Demo safety / production phases](./0002-demo-safety-production-phases.md)
