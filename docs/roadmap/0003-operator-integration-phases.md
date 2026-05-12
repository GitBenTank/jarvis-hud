# Operator integration and agent-team phases

**Status:** Living document  
**Owner:** Ben Tankersley  
**Created:** 2026-04  
**Related:**

- [Product narrative thesis / Thesis Lock](../strategy/jarvis-hud-video-thesis.md)
- [Operating assumptions §1–§2](../strategy/operating-assumptions.md) (deployment + auth provisionals)
- [Jarvis ↔ OpenClaw system overview](../architecture/jarvis-openclaw-system-overview.md)
- [OpenClaw integration verification](../openclaw-integration-verification.md)
- [Operator checklist](../setup/openclaw-jarvis-operator-checklist.md)
- [Return after a pause](../setup/return-after-pause.md)
- [Agent team v1](../strategy/agent-team-v1.md)
- [Research batch workflow v1](../strategy/research-batch-workflow-v1.md)
- [Creative batch workflow v1 (Phase 5)](../strategy/creative-batch-workflow-v1.md)
- [Operator Media Engine v1 (business-use proof)](../strategy/operator-media-engine-v1.md)
- [ADR-0001: Thesis Lock](../decisions/0001-thesis-lock.md)
- [ADR-0005: Batch v0, per-item execute](../decisions/0005-agent-team-batch-v0-per-item-execute.md)
- [Trust, determinism, integrity signals](../governance/trust-and-determinism.md)
- [v0.2 Golden Loop sprint (0005)](./0005-v02-golden-loop-sprint.md) — operational proof of the governed path
- [Phased platform plan (0004)](./0004-phased-platform-plan.md) — broader **platform growth** (agent productization, enterprise, UI, GTM); this doc stays **integration- and operator-focused**

---

## Purpose

This roadmap sequences **integration hardening** (OpenClaw + Jarvis HUD), **human authority**, and **agent-team expansion** without drifting [Thesis Lock](../strategy/jarvis-hud-video-thesis.md#thesis-lock-do-not-drift). Phases are numbered for stable reference; **near-term execution order** may differ (see below).

For **end-to-end platform phases** (flagship as product, verticals, enterprise UI, packaging), use [0004 — Phased platform plan](./0004-phased-platform-plan.md).

---

## Pilot bundle baseline (operator credibility) — closed 2026-05

**Closed:** Host-truth probes, governed golden loop on the blessed stack (**including `GOLDEN_LOOP_USE_EXISTING` with `JARVIS_AUTH_ENABLED=true`** and HUD session + step-up), audit export aligned to the server’s **`dateKey`**, a **reusable** policy deny repro runner on `main`, and run-specific evidence **outside git** (`/evidence/`, operator-held `JARVIS_ROOT` copies).

**Cadence shift:** credible **operator verification** → **capability / enterprise authority** work. Likely tranches: **IdP / identity binding** (often highest leverage next), **RBAC / separation of duties**, **richer policy expressiveness**. When that body of work lands, publish a **new dated** governance snapshot (see e.g. [`enterprise-readiness-snapshot-2026-05-09.md`](../governance/enterprise-readiness-snapshot-2026-05-09.md)); prefer **adding** a new snapshot over silently editing an old dated file.

Runbooks: [`pilot-green-single-session.md`](../verification/pilot-green-single-session.md) · [`policy-deny-repro.md`](../verification/policy-deny-repro.md).

**Operating bar (day-to-day):** [Ready enough — flagship + bundle + demo, honestly described](../strategy/ready-enough-operating-bar.md).

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
- **Hands-on auth verification:** [Auth-on stack verification](../setup/serious-mode-rehearsal-checklist.md) — auth on, batched ingress, approve, item-level execute, capture UX gaps.
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

**Phase 3b (guardrail slice — shipped 2026-05-10):** **`evidenceStatus`** and **`uncertaintySummary`** are canonical authoring fields for OpenClaw proposals and rehearsal scripts. **Contract / prompts / rehearsal / strategy workflows** first; no new server-side strictness in this slice.

- Compose-time guidance and templates for OpenClaw submissions (research + creative tracks differ honestly on defaults).
- Standardized: top-level fields, `batch`, titles/summaries, `evidenceStatus` + `uncertaintySummary`, source/citation conventions in docs.
- Keep `system.note` for research and creative until a real kind is needed.
- Malformed submissions remain hard at **ingress**; Phase 3b additionally makes **good** submissions the path of least resistance at authoring time.

**Done when:** Good proposals are the path of least resistance, good proposals include **evidence + uncertainty** by default, rehearsal scripts emit the canonical fields, and docs / prompts agree on the same contract — **met for this slice.**

---

## Phase 4 — Operationalize the first agent loop

**Goal:** One boringly reliable governed workflow.

- Keep **research batch v1** as the canonical first loop ([workflow](../strategy/research-batch-workflow-v1.md)); **external story** (one page: hero table, buyer line, proof checklist): [Research batch v1 — hero, buyer, proof](../strategy/research-batch-v1-hero-buyer-and-proof.md).
- **Preflight every session:** **`pnpm rehearsal:preflight`** (`machine-wired` + `auth-posture`) on the blessed stack.
- **Rehearse:** 3-item batch → approve → **execute one item** → verify receipt/trace per **proposal id**; repeat until calm.
- **Capture friction** in the workflow doc [friction log](../strategy/research-batch-workflow-v1.md#friction-log-after-rehearsals) (copy, UX, slowness — feeds Phase 3 templates, not new policy).
- Tune: batch size, copy clarity, review ergonomics, activity and receipt clarity.

**Done when:** Research proposals move through Jarvis without confusion or fear.

**Status (2026-04):** **v1 bar met.** Repeated rehearsals through multi-item batches; friction + **validation** rows; coherent **proposal id → trace → receipt** and honest batch queue state (e.g. [run 7](../strategy/research-batch-workflow-v1.md#friction-log-after-rehearsals)). The loop is **operationally boring** — the right outcome. **Still:** occasional Phase 4 reps before demos and when changing stack or copy; Phase **5** is not unlocked by paperwork alone.

### Operator Media Engine — first business-use proof loop (Phase 3–4 bridge)

**What:** [Operator Media Engine v1](../strategy/operator-media-engine-v1.md) turns commits, docs, demo notes, friction logs, and roadmap signals into **governed content proposals** (LinkedIn, blog, video script, outreach drafts) as **`system.note`** ingress — **no autonomous publishing**, no social APIs, no email send from Jarvis.

**Why here:** It reuses **Phase 3b** authoring expectations (`evidenceStatus`, `uncertaintySummary`) and **Phase 4** operational muscle (approve → execute → trace/receipt). It proves Jarvis can sit on **revenue-adjacent** narrative work without drifting [Thesis Lock](../decisions/0001-thesis-lock.md): agents propose; Jarvis governs; Ben approves.

**How:** `pnpm operator:media:rehearsal` emits sample JSON only; then [Operator Media Engine checklist](../demo/operator-media-engine-checklist.md) for submit → HUD → execute → **Executed · receipt recorded** on Activity.

**Done when:** Rehearsal payloads are approved and executed through Jarvis with the same trace replay quality as research/creative rehearsals, and you have a manual decision on whether each artifact is worth shipping externally.

---

## Phase 5 — Add the second specialist

**Goal:** Prove the model works beyond one role.

**Phase 5 v1:** [Creative batch workflow v1](../strategy/creative-batch-workflow-v1.md) — second specialist uses **`system.note`** with a **markdown** contract (Brief, Audience, Angle, 3–5 variants, Risks/notes, Sources). Same **`batch`** semantics, **per-item** approve/execute/receipt; no `creative.*` kind until justified. Rehearsal: **`pnpm rehearsal:creative-batch`** (`scripts/creative-batch-rehearsal.ts`). The rehearsal should fail locally with operator-readable `problem` / `fix` guidance before malformed notes ever reach ingress.

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

- [Phased platform plan (0004)](./0004-phased-platform-plan.md)
- [Master plan](./0000-master-plan.md)
- [Technical roadmap — production](./0001-technical-roadmap-production.md)
- [Demo safety / production phases](./0002-demo-safety-production-phases.md)
