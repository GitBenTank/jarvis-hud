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
- [Return after a pause](../setup/return-after-pause.md)
- [Agent team v1](../strategy/agent-team-v1.md)
- [Research batch workflow v1](../strategy/research-batch-workflow-v1.md)
- [Creative batch workflow v1 (Phase 5)](../strategy/creative-batch-workflow-v1.md)
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
3. **Phase 4** — Operationalize the first governed loop (research batch v1, rehearsals) — **v1 bar met 2026-04** (see [Phase 4](#phase-4--operationalize-the-first-agent-loop)); keep occasional reps + friction log for demo polish.
4. **Phase 3** — Standardize proposal authoring (templates, field conventions); **Phase 3a** already shipped from friction evidence — broaden only when pain **recurs**.
5. **Phase 5** — Add the second specialist (creative agent, same spine) — **v1:** [Creative batch workflow](../strategy/creative-batch-workflow-v1.md) + `pnpm rehearsal:creative-batch`

**Rationale:** Freeze the stack and authority **before** optimizing authoring ergonomics; run the **research batch ritual** until the [friction log](../strategy/research-batch-workflow-v1.md#friction-log-after-rehearsals) has **honest entries** — then wake **Phase 3** from that evidence (templates prevent real mistakes, not imagined ones). After that, broaden roles.

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

- **§2 frozen (provisional):** [Auth and step-up](../strategy/operating-assumptions.md#2-auth-and-step-up-jarvis) — modes (convenience / demo / serious), who may submit vs approve vs execute, `stepUpValid` semantics, headless submitters.
- **Checklist:** [Phase 2 auth authority](../setup/phase2-auth-authority-checklist.md) (record who may hold the ingress secret, when auth must be on).
- **Hands-on rehearsal:** [Serious-mode rehearsal checklist](../setup/serious-mode-rehearsal-checklist.md) — auth on, batched ingress, approve, item-level execute, capture UX gaps.
- **Trust docs:** [OpenClaw V1 contract](../architecture/openclaw-v1-contract.md#human-authority-boundary-phase-2) · [OpenClaw ↔ Jarvis trust contract](../architecture/openclaw-jarvis-trust-contract.md) (ingress vs human authority).
- **Operator path:** [Operator checklist](../setup/openclaw-jarvis-operator-checklist.md) (human authority section).
- **Probe:** **`pnpm auth-posture`** (cookieless; optional **`JARVIS_EXPECT_AUTH=true`** on serious hosts). Run with **`pnpm machine-wired`**.
- **Manual tests:** no auth, auth on without step-up at execute, headless `GET /api/config`, wrong ingress secret, origin drift (Phase 1 probe).

**Done when:** Approval and execution authority are unambiguous on the real stack and probes/docs agree.

---

## Phase 3 — Standardize proposal authoring

**Goal:** Make agents generate correct proposals by default.

**Gate:** Prefer to start serious Phase 3 work **after** several **Phase 4** rehearsals and **real rows** in the [research batch friction log](../strategy/research-batch-workflow-v1.md#friction-log-after-rehearsals) (wording, authoring mistakes, repeated fixes). Avoid large template investments driven only by speculation.

**Phase 3a (narrow, shipped first):** [Rehearsal authoring — minimal](../strategy/research-batch-workflow-v1.md#phase-3a--rehearsal-authoring-minimal) — **`batch.title` must carry a short differentiator** (run label, timestamp, topic slug, or `batch.id` fragment), plus light patterns for titles/summaries, `system.note` **Sources**, and batch- vs item-level prose. **Not** a schema empire; expand Phase 3 only when friction **recurs**.

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
- **Preflight every session:** **`pnpm rehearsal:preflight`** (`machine-wired` + `auth-posture`) on the blessed stack.
- **Rehearse:** 3-item batch → approve → **execute one item** → verify receipt/trace per **proposal id**; repeat until calm.
- **Capture friction** in the workflow doc [friction log](../strategy/research-batch-workflow-v1.md#friction-log-after-rehearsals) (copy, UX, slowness — feeds Phase 3 templates, not new policy).
- Tune: batch size, copy clarity, review ergonomics, activity and receipt clarity.

**Done when:** Research proposals move through Jarvis without confusion or fear.

**Status (2026-04):** **v1 bar met.** Repeated rehearsals through multi-item batches; friction + **validation** rows; coherent **proposal id → trace → receipt** and honest batch queue state (e.g. [run 7](../strategy/research-batch-workflow-v1.md#friction-log-after-rehearsals)). The loop is **operationally boring** — the right outcome. **Still:** occasional Phase 4 reps before demos and when changing stack or copy; Phase **5** is not unlocked by paperwork alone.

---

## Phase 5 — Add the second specialist

**Goal:** Prove the model works beyond one role.

**Phase 5 v1:** [Creative batch workflow v1](../strategy/creative-batch-workflow-v1.md) — second specialist uses **`system.note`** with a **markdown** contract (Brief, Audience, Angle, 3–5 variants, Risks/notes, Sources). Same **`batch`** semantics, **per-item** approve/execute/receipt; no `creative.*` kind until justified. Rehearsal: **`pnpm rehearsal:creative-batch`** (`scripts/creative-batch-rehearsal.ts`).

- Introduce **creative agent** proposals through the same ingress and HUD path as research.
- Use the same batch and approval semantics.
- No new execution shortcuts.
- Compare research vs creative needs before expanding schema.

**Done when:** Two specialists work through one governance spine without drift — creative batches rehearse with the same calm as research (coherent id/trace/receipt, no governance confusion).

**Milestone (2026-04) — first claim:** Creative v1 **full close** logged (proposal id, trace, receipt align — see [creative friction log](../strategy/creative-batch-workflow-v1.md)). **Interpretation:** the spine **generalizes** across at least **two** cognitive artifact shapes at `system.note` depth without a new governance model. **Not closed forever:** optional **second** short creative rehearsal to rule out a lucky first pass; Phase **6+** and richer kinds still wait on sustained boredom, not one green run.

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
