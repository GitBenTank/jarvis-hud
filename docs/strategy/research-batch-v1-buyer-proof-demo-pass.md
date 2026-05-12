---
title: "Research batch v1 — buyer-proof demo pass (script + questions)"
status: living-document
category: strategy
owner: Ben Tankersley
related:
  - ./research-batch-v1-hero-buyer-and-proof.md
  - ./research-batch-workflow-v1.md
  - ../verification/pilot-proof-bundle-checklist.md
  - ../verification/policy-deny-repro.md
  - ../setup/local-stack-startup.md
---

# Research batch v1 — buyer-proof demo pass (script + questions)

**Goal:** Test **comprehension risk**, not architecture. You already have substance; this pass checks whether a smart outsider **gets it fast** and **cares**.

**Inputs:** [Hero / pitch / proof](./research-batch-v1-hero-buyer-and-proof.md) · [Workflow v1](./research-batch-workflow-v1.md) · [Activity layout](./activity-layout-v1-implementation-checklist.md) (queue-first HUD).

**Output:** A short **friction log** — copy to [Friction log](./research-batch-workflow-v1.md#friction-log-after-rehearsals) or attach as an appendix row referencing this session.

---

## Before the session (15 min operator prep)

| # | Check |
|---|--------|
| 1 | [Blessed stack](../setup/local-stack-startup.md): HUD + ingress; `pnpm machine-wired` green or you can explain failures. |
| 2 | Research batch ready: **3-item** `system.note` batch, same `batch.id`, distinguishable `batch.title` ([Phase 3a](./research-batch-workflow-v1.md#phase-3a--rehearsal-authoring-minimal)). |
| 3 | Decide **one governance beat**: either **policy deny** ([repro](../verification/policy-deny-repro.md)) *or* **step-up / auth gate** if your stack has it on — not both in one 5-minute pass unless you are very fast. |
| 4 | Browser: **`/activity`** bookmarked; optional second tab for trace deep link after execute. |
| 5 | Have **proposal id** and **trace id** scratch space visible to you (not the observer) until the “proof” beat. |

**Observers:** 3–5 people who are **smart and honest**, ideally **not** deep Jarvis insiders. Give them the **feedback sheet** (below) before or *after* the first watch — your choice; post-watch avoids priming.

---

## 5–7 minute demo script (operator reads times loosely)

**Minute 0 — Hook (30–45 s)**  
Say the **grip-first one-liner** from the hero doc (research memo batch + execution boundary). One sentence only: *who decides* vs *what proves it*.

**Minute 1 — What is being proposed (45–60 s)**  
Open **`/activity`**. Point at **operator attention** line + **one batch** with three items. Say in plain English: “These are **research memo candidates** from the agent path; they are **not** executed work.”

**Minute 2 — Approve ≠ execute (60–90 s)**  
**Approve one row only.** Pause. Ask: “What do you think happens next?” (Let them answer.) Then: “Still nothing runs until **Execute** — approval is not execution.”

**Minute 3 — Execute + outcome (60 s)**  
**Execute** that item. Show **Activity** / executed row or receipt surface you use in prod-shaped demos. State: “This row is the **proof of governed execution**, not the chat transcript.”

**Minute 4 — Governance beat (60–90 s)** *(pick one)*  

- **Policy deny:** Show a **denied** or blocked path with a visible **receipt / log / trace** outcome — “deny is proof too.”  
- **Or step-up:** Show that **approve** was cheap but **execute** requires the human gate you configured.

**Minute 5 — Trace / replay (45–60 s)**  
Open **trace** for the happy-path item (`?trace=` or in-app). One line: “Anyone with access can **reconstruct** what happened from proposal through receipt.”

**Minute 6 — Close (30 s)**  
Repeat the wedge in one sentence: **governed research memo batch**, **human authority at execute**, **receipts and traces**. Stop. Invite narrate-back.

**Stretch to 10 min:** Optional [audit export](../verification/pilot-proof-bundle-checklist.md#3-audit-export-same-window-same-root) window — only if the audience cares about diligence artifacts.

---

## Observer feedback — narrate-back (2–3 min written or voice)

Ask them to answer **without** opening your docs:

1. In **one sentence**, what does **Jarvis** do in what you just saw?  
2. In **one sentence**, what is the **human** responsible for?  
3. What is **one** way this differs from “the agent just did it for us”?  
4. Where did you **first hesitate** or reach for a label (“dashboard,” “IT tool,” “Slack bot”)?  
5. After **Approve**, what did you **think** would happen before the operator corrected you?

**Optional 1–5 scale** (quick): How clear was **approval vs execute**? (1 confusing / 5 obvious)

---

## Capture template (paste into workflow friction log)

| Field | Note |
|--------|------|
| **Date** | |
| **Audience** | e.g. “peer PM, no Jarvis context” |
| **Script version** | This doc + link to commit or date |
| **Hesitation points** | Timestamp or beat name (hook, batch, approve, execute, deny, trace) |
| **Misreadings** | e.g. “thought approve ran the adapter” |
| **Language that landed** | Phrases they repeated back correctly |
| **Language that failed** | Words that confused them |
| **Next fix** | **One** item: copy / order / one UI cue / one artifact — avoid a laundry list |

**Rule:** Tighten **only what blocked comprehension** in this pass; park architecture unless the observer surfaced a **trust** lie.

---

## Run the pass (two-session loop)

Live observers are **you + them** — this section is the **operator run sheet** so nothing is ambiguous the day you run it.

### Same-day stack smoke (before Session 1)

From repo root (note pass/fail in Session 1 table):

```bash
pnpm machine-wired
```

If your stack uses auth for execute demos:

```bash
pnpm rehearsal:preflight
```

Load or emit the **3-item research batch** (see [workflow quick path](./research-batch-workflow-v1.md#1-submit-a-3-item-research-batch)):

```bash
pnpm rehearsal:research-batch
```

Open **`/activity`** (default dev: `http://127.0.0.1:3000/activity` — match your port).

### Session 1 — capture immediately after narrate-back

| Field | Fill in |
|--------|---------|
| **Date** | |
| **Observer(s)** | |
| **Governance beat used** | deny / step-up / (other): |
| **Hesitation points** | |
| **Misreadings** | |
| **Approve vs execute clarity (1–5)** | |
| **Language that landed** | |
| **Language that failed** | |
| **Next fix (one comprehension item only)** | |
| **Merged to [friction log](./research-batch-workflow-v1.md#friction-log-after-rehearsals)?** | y / n |

### Session 2 — second observer, same script (or same observer cold 48h later)

| Field | Fill in |
|--------|---------|
| **Date** | |
| **Observer(s)** | |
| **Governance beat used** | (same class as Session 1 if comparing apples to apples) |
| **Hesitation points** | |
| **Misreadings** | |
| **Approve vs execute clarity (1–5)** | |
| **Language that landed** | |
| **Language that failed** | |
| **Next fix (one)** | |
| **Merged to friction log?** | y / n |

### After both sessions

1. If the **same** confusion appears twice → it is a **blocker**; fix that first (copy, order, one UI cue, or one missing artifact).  
2. If fixes are in → **rerun** one short observer pass (same script) before widening scope (new workflow, new surface).  
3. Promote durable rows into the workflow **friction log** table so Phase 3 stays evidence-backed.

---

## Related

- [Hero workflow + proof checklist](./research-batch-v1-hero-buyer-and-proof.md)  
- [Pilot proof bundle](../verification/pilot-proof-bundle-checklist.md)  
- [Policy deny repro](../verification/policy-deny-repro.md)
