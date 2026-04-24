# Phased platform plan — agent teams, enterprise, and GTM

**Status:** Living document  
**Owner:** Ben Tankersley  
**Created:** 2026-04  
**Related:**

- [ADR-0001: Thesis Lock](../decisions/0001-thesis-lock.md)
- [Operator integration phases (0003)](./0003-operator-integration-phases.md) — **Jarvis ↔ OpenClaw integration** sequencing (keep using this for near-term integration work)
- [Agent team contract v1](../strategy/agent-team-contract-v1.md)
- [Flagship team bundle v1](../strategy/flagship-team-bundle-v1.md)
- [Master plan](./0000-master-plan.md)

---

## Purpose

This document is the **canonical platform-growth roadmap**: agent productization, vertical expansion, enterprise hardening, UI for operators, and market-facing packaging. It **does not replace** [0003](./0003-operator-integration-phases.md), which stays focused on **operator integration and the blessed Jarvis/OpenClaw path**.

**Normative boundary:** [Thesis Lock](../decisions/0001-thesis-lock.md) — agents propose; execution requires explicit human approval; approval ≠ execution; receipts required; the model is not a trusted principal.

**Documentation discipline:** As each phase produces real behavior, **update the relevant docs and repo artifacts** (specs, ADRs, checklists, examples). Treat doc drift as a bug when behavior and narrative disagree.

---

## Core rule — no new capability ships without

Every new capability must be defined end-to-end before it is treated as shippable:

| Requirement | Meaning |
|-------------|---------|
| **Responsible specialist** | Named agent role / spec owns the behavior and handoffs (not “the model generally”). |
| **Real Jarvis `kind`** | Allowlisted kind with validated payload shape. |
| **Policy and approver rules** | Who may approve, execute policy, risk classification. |
| **Adapter or explicit non-execution boundary** | Real adapter for side effects, or documented proof that the capability stays propose/read-only. |
| **Receipts / audit story** | Trace + artifact + log expectations; what auditors can replay. |
| **Environment definition** | Where it runs: **dev / staging / prod** (URLs, secrets, live vs dry-run, blast radius). |

If any row is missing, the capability is **design-only** — not a shipped vertical.

---

## Phase 1 — Lock the foundation

**Goal:** One governed system that is unambiguous, repeatable, and saleable.

**Accomplish**

- Keep **Thesis Lock** as the constitutional rule.
- Keep **Jarvis** as the only authority / execution layer.
- Keep agents as **thinking + proposing** only.
- Freeze the current agent law stack: Alfred, [team contract](../strategy/agent-team-contract-v1.md), [Research v1](../strategy/research-agent-v1.md), [Creative v1](../strategy/creative-agent-v1.md), [flagship bundle](../strategy/flagship-team-bundle-v1.md).
- Keep one blessed local/dev path; keep auth-on mode credible and documented.

**Done when**

- No confusion about who may propose, approve, or execute.
- Receipts and traces exist per executed action.
- Docs and product behavior match.

**Not yet:** New kinds, new agents, or broad UI redesign without a forcing event.

---

## Phase 2 — Turn the flagship bundle into a product pattern

**Goal:** Prove the team is real, not only a set of specs.

**Accomplish**

- Close **Flow 1** fully; preserve it as the default demo story ([flagship bundle](../strategy/flagship-team-bundle-v1.md), samples under `examples/openclaw-proposal-flagship-flow1-*.sample.json`).
- Package **Alfred + Research + Creative** as the first bundle; keep each role visibly distinct (intake / evidence / variants).
- Standardize proposal examples for flagship flows; record clean demo evidence (proposal ids, traces, receipts, `correlationId`).

**Done when**

- One flagship team story runs end-to-end without explanation gymnastics.
- Buyers can understand why the trio is valuable together.

**Not yet:** Second vertical, marketplace SKUs, or pricing tied to unimplemented kinds.

---

## Phase 3 — Define the agent product format

**Goal:** Make agents portable, packageable, and sellable as units.

**Accomplish**

For each agent, define (template / schema in docs or repo):

- Identity, role, audience, tone  
- Risk posture, allowed outputs  
- Jarvis kind mapping, handoff rules, collaborator compatibility  
- Pricing tier / market positioning (business track — must map to real kinds + policy)

Define **bundle metadata**: who is included, intake leader, common kinds, problems solved, explicit **out of scope**.

**Done when**

- A single agent or bundle is describable as a reusable product unit.
- Combining agents does not require rewriting their law every time.

**Not yet:** Implementing every marketing field in code until one bundle validates the template.

---

## Phase 4 — Add the next verticals one at a time

**Goal:** Expand from one flagship team to a multi-purpose platform without chaos.

**Accomplish**

Choose verticals carefully, **one at a time**, for example:

- Comms  
- Ops / scheduling  
- Analytics  
- Planning  
- Finance — **much later**

Per vertical, satisfy the **core rule** (specialist + kind + policy + adapter + audit + environment). No “vibes-only” agents.

**Done when**

- New capabilities arrive as governed verticals.
- Each addition increases usefulness without weakening control.

**Not yet:** A second vertical until the first has real execute + receipt in its **target environment**.

---

## Phase 5 — Build the real team operating model

**Goal:** Agents feel like a coordinated workforce.

**Accomplish**

- Narrative anchor for runtime vs authority and the end-to-end loop: [Runtime + OpenClaw team + Jarvis loop v1](../strategy/runtime-openclaw-jarvis-team-loop-v1.md).
- Refine routing defaults; define when Alfred answers vs defers; when specialists hand back vs embed drafts.
- **Operator v1** only if pain is recurring: queue shaping, packaging, orchestration, runbook ownership — document evidence before writing the spec.

**Done when**

- Collaboration feels natural; responsibilities do not overlap in confusing ways.
- Operator exists because reality demanded it, not because a diagram looked incomplete.

---

## Phase 6 — Enterprise-ready by vertical

**Goal:** Governed flows become serious operational capability.

**Accomplish**

Per important kind / vertical:

- Approver rules; environment separation; secrets and adapter boundaries  
- Idempotency / retry semantics; export / audit / retention  
- Who may hold credentials vs who may approve  

Strengthen: auth / step-up, identity binding, separation of duties, **policy by kind and environment**.

**Done when**

- You can state who can do what, where, under which approval standard.
- The system is credible beyond a founder laptop.

**Not yet:** Production live for high-risk kinds without approver matrix + environment definition.

---

## Phase 7 — Calm the UI for real operators

**Goal:** Usable at volume, not only provable.

**Accomplish**

Reorganize toward:

- **Inbox / Work queue**  
- **Receipts / History**  
- **Traces / Debug**

Add filtering (kind, risk, coordinator, `correlationId`); progressive disclosure for raw/debug; role-aware views (approver / operator / power-debug).

**Early UX wins (allowed):** Small changes that reduce operator pain **without** pretending the full information architecture is done (e.g. default filters, collapsible debug, clearer primary actions). Ship these when friction logs justify them; track them against Phase 7 goals.

**Done when**

- Approvers can scan decisions in seconds.
- Debug remains available without drowning default users.

---

## Phase 8 — Build the agent business

**Goal:** Platform packaging people can buy.

**Accomplish**

Define: flagship agents, flagship bundles, custom combinations, pricing model (subscription / credits / licensing), private agents, compatibility rules. SKUs must align with **actual** kinds and policy.

**Done when**

- There is a clear reason to buy one agent, one bundle, or a custom team.
- Packaging matches system behavior.

---

## Phase 9 — Real market-facing execution (carefully)

**Goal:** Meaningful external work without losing governance.

**Accomplish**

After earlier layers are stable: real outbound comms, publishing, ops integrations; financial workflows only when Phase 6 bar is met. Per integration: preserve approval, execute separation, receipts, risk policy, human accountability.

**Done when**

- External execution is useful and trustworthy under pressure.

---

## Phase 10 — Package the company story

**Goal:** Sell the vision without lying about the machine.

**Accomplish**

Investor narrative, operator onboarding, flagship demo narrative, enterprise-readiness story — anchored in Flow 1 evidence, specialist specs, governance proof, real traces and receipts.

**Done when**

- Pitch, docs, and product say the same thing; one-sentence story defends in detail.

---

## Operational guardrails (summary)

| Phase | Primary deliverables | Stop / “not yet” |
|-------|----------------------|------------------|
| 1 | Foundation locked; blessed path; auth credible | New kinds/agents |
| 2 | Flow 1 demo story + evidence | Second vertical |
| 3 | Agent/bundle product template | Boilerplate without validated bundle |
| 4 | One vertical fully governed | Parallel verticals |
| 5 | Routing doc; Operator only with evidence | Speculative Operator |
| 6 | Per-kind enterprise bar | Prod high-risk without matrix |
| 7 | IA + filters + role modes | Full redesign blocking small wins |
| 8 | SKUs tied to behavior | Fantasy SKUs |
| 9 | Live adapters with rollback story | Finance before controls |
| 10 | Narratives tied to proof | Claims without receipts |

---

## See also

- [Operator integration phases (0003)](./0003-operator-integration-phases.md)
- [Technical roadmap — production](./0001-technical-roadmap-production.md)
- [Demo safety / production phases](./0002-demo-safety-production.md)
