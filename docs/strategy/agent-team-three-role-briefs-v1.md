---
title: "Agent team — three role briefs v1 (narrow, real, role-distinct)"
status: living
category: strategy
owner: Ben Tankersley
related:
  - ./jarvis-hud-video-thesis.md
  - ./agent-team-v1.md
  - ./agent-team-contract-v1.md
  - ./research-batch-workflow-v1.md
  - ./creative-batch-workflow-v1.md
  - ../decisions/0005-agent-team-batch-v0-per-item-execute.md
---

# Three role briefs v1 — narrow, real, role-distinct

**Principle:** Start **narrow** (one flagship loop), **real** (a workflow you actually run), **role-distinct** (no overlapping “I’m helpful” blobs).  
**Key rule:** **Agents think and prepare. Jarvis authorizes and proves.**  
**Normative routing/handoffs:** [Agent team contract v1](./agent-team-contract-v1.md) (Alfred, specialists, Jarvis).

---

## 1. Pick one flagship workflow (not “general autonomous company”)

| Priority | Loop | Canonical doc |
|----------|------|-----------------|
| **First** | **Intake → research digest** | [Research batch workflow v1](./research-batch-workflow-v1.md) — governed `system.note`, per-item approve/execute |
| **Second (later)** | **Creative variants / packaging** | [Creative batch workflow v1](./creative-batch-workflow-v1.md) — same spine, different artifact shape |

Do **not** add more agents until **one** three-role loop is **boring** (clear handoffs, no confusion about who owned what at the Jarvis boundary).

---

## 2. Three roles max (v1)

1. **Coordinator (Alfred)** — receives request, frames task, routes / asks for what is missing.  
2. **Research specialist** — evidence, sources, constraints, ranked options.  
3. **Creative / execution-prep specialist** — drafts options, packages output **as proposal-shaped** material for Jarvis (Phase 2 on the same spine).

**Jarvis** remains **authority, proof, and execution boundary** — not “another agent personality.”

---

## 3. Role briefs (job, not personality)

### A. Coordinator (Alfred)

| Dimension | Definition |
|-----------|------------|
| **Responsible for** | Triage; crisp task framing; routing to Research or Creative when the work clearly belongs there; naming **what “done” means** for the human reviewer; ensuring the thread ends in **one legible intent** per proposal batch item. |
| **Must not do** | Imply that chat consensus, confidence, or “the team agreed” **authorizes** execution; silently substitute specialist text for a **logged** approval; bypass OpenClaw → Jarvis ingress; execute side-effecting kinds outside policy. |
| **Hands off to** | **Research** — when evidence, sources, or competitive/factual grounding is the bottleneck. **Creative** — when variants, packaging, or audience-facing structure is the bottleneck. **Human + Jarvis** — when the next step is **approve / execute** on a proposal. |
| **Jarvis / kinds** | Does not “own” a special kind by itself. Outcomes surface as **structured proposals** consistent with [ADR-0005](../decisions/0005-agent-team-batch-v0-per-item-execute.md): typically **`system.note`** research (or later creative) **batch** items with correct top-level `batch` metadata — whatever your ingress allowlist permits for that pilot. |

### B. Research specialist

| Dimension | Definition |
|-----------|------------|
| **Responsible for** | Finding and summarizing **evidence**; listing **sources**; stating **constraints** and **risks**; optional ranked options **as input to a decision**, not as a decision. |
| **Must not do** | Spend, publish, send mail, mutate production systems, or present model synthesis as **audit-grade fact** without sources; claim execution or approval happened. |
| **Hands off to** | **Coordinator** — integrated narrative + “what to ask the human.” **Creative** (if in play) — raw findings for packaging. **Jarvis** — **one or more** `system.note` items in a shared **batch** per [research batch workflow](./research-batch-workflow-v1.md). |
| **Jarvis / kinds** | **`system.note`** research payloads on the allowlisted path; **per-item** propose → approve → execute; no batch-level execution. |

### C. Creative / execution-prep specialist (Phase 2)

| Dimension | Definition |
|-----------|------------|
| **Responsible for** | Drafting **options** (variants, angles); shaping **brief + packaging** so a human can say yes/no clearly; aligning tone/structure to the **markdown contract** in the creative workflow doc. |
| **Must not do** | Send outbound, publish, spend, or apply code without a **Jarvis-governed** proposal and explicit human execute; overwrite reviewed batch content silently — new facts → **new item** or **new batch** per workflow rules. |
| **Hands off to** | **Coordinator** — reconciled package for review. **Jarvis** — **`system.note`** creative-shaped items with the same **batch** semantics as research. |
| **Jarvis / kinds** | **`system.note`** per [creative batch workflow v1](./creative-batch-workflow-v1.md); same approval/proof spine as research, different artifact expectations. |

---

## 4. Handoff contract (pick one pattern per turn)

Align with [Agent team contract §2](./agent-team-contract-v1.md#2-handoff-behavior):

1. **Coordinator-only** — no specialist; may still end with a Jarvis proposal if needed.  
2. **Recommend handoff** — name the next owner and what to ask; new context if required.  
3. **Embedded specialist draft** — specialist output inside coordinator thread; **attributed**; **not** treated as executed or approved.

**Forbidden:** Silent bypass of ingress; “the model decided” in place of **explicit** human approval for governed execution.

---

## 5. Visible handoffs (every workflow answers)

For each run, you should be able to name:

- **Who started it** (human / which agent entry).  
- **Who added evidence** (Research attribution).  
- **Who packaged the proposal** (Creative and/or Coordinator).  
- **What Jarvis received** (ingress proposal identity, batch id, item indices).  
- **What got approved / executed** (per item; receipts + traces).

If any of those are fuzzy, **fix the loop** before adding agents.

---

## 6. Practical build order

| Phase | Agents | Goal |
|-------|--------|------|
| **1** | Coordinator + Research | One governed **`system.note`** research path through Jarvis — boring and legible. |
| **2** | + Creative / packaging | Same spine; different artifact shape ([creative workflow](./creative-batch-workflow-v1.md)). |
| **3** | Only then | Operator, scheduler, domain specialists, customer-facing bundles — **after** Phase 1–2 are stable. |

---

## 7. This week (operator checklist)

1. Choose the **one flagship workflow** (default: **intake → research digest**).  
2. Write these **three briefs** into your runbook or team wiki (adjust wording to your org).  
3. Define the **handoff contract** your OpenClaw runtime will actually use (see patterns above).  
4. **Run once** through Jarvis (batch → approve → execute one item → receipt/trace).  
5. **Remove overlap and ambiguity** before adding anyone new.

---

## Thesis Lock

Same non-negotiables as [agent team v1](./agent-team-v1.md#thesis-lock). If a three-role design makes it unclear what was approved, what ran, or what was receipted, **the design is wrong** — not the thesis.
