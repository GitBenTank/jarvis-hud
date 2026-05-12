---
title: "Executive briefing — control plane (plain English)"
status: living-document
version: 3.0
category: strategy
owner: Ben Tankersley
related:
  - ./gener8tor-pitch.md
  - ./room-playbook-v1.md
  - ../decisions/0001-thesis-lock.md
  - ./flagship-team-bundle-v1.md
  - ../video/README.md
  - ../video/investor-demo-full-runbook.md
  - ../video/investor-demo-rehearsal-run-sheet.md
  - ./investor-demo-narrative-script.md
  - ./investor-overview-bundle-room-script.md
  - ./investor-landscape-answer-card.md
  - ./investor-live-proof-map.md
  - ./messaging-execution-integrity.md
  - ./positioning-memo-workflow-governance-agent-teams.md
  - ./market-narrative-governed-agent-workflows-2026.md
  - ../interview-prep-jarvis.md
---

# Executive briefing (plain English)

**What this is:** A **fixed-order**, ~**15 minute** read for **executives, advisors, and technical buyers**—why agent systems that touch real systems need a **separate control plane** for authority and proof.

**Why it matters:** As agents send mail, change code, and call APIs, the boundary between **decision** and **execution** becomes the failure point.

**Contrast:** **Most systems log what happened.** Jarvis records **who decided**, **who executed**, and **what occurred**—**at the boundary where failures happen.**

**Compressed positioning lines:** [messaging — execution integrity](./messaging-execution-integrity.md).

**3–5 claim positioning (workflow > model, governed agent teams):** [Positioning memo — workflow governance](./positioning-memo-workflow-governance-agent-teams.md).

**Market narrative (patterns, anti-patterns, mentality table):** [Governed agent workflows (2026)](./market-narrative-governed-agent-workflows-2026.md).

**In plain English:** AI can already touch production rails. The gap is **authority at execution** and **auditable proof**. Jarvis sits on that boundary.

**In the HUD:** [/docs/tati](/docs/tati) or [/docs/briefing](/docs/briefing) — the same four links in a minimal layout; optional side panel for script blocks aligned to **`/demo`**.

**Guided product walkthrough:** **[Demo](/demo)** — six slides into the live HUD (governed propose → approve → execute → receipt → trace). **`/pitch`** and **`/docs/strategy/gener8tor-pitch`** are read-only slide copy; live queue is **`/activity`**. Use depth docs when stakeholders ask **how** governance is enforced—not as a substitute for the walkthrough.

**Competitive framing (short spoken lines):** [investor landscape answer card](./investor-landscape-answer-card.md).

**Overview + flagship bundle (talk track):** [investor Overview + Bundle room script](./investor-overview-bundle-room-script.md).

---

## Read in this order (canonical four)

| # | Doc | ~time | What you’re reading |
|---|-----|-------|---------------------|
| 1 | [Gener8tor pitch](./gener8tor-pitch.md) | ~5 min | Slide narrative + demo beats aligned to **`/demo`**. |
| 2 | [Room playbook](./room-playbook-v1.md) | ~3 min | Restraint, opener, Q&A—keep the story tight. |
| 3 | [Thesis Lock (ADR)](../decisions/0001-thesis-lock.md) | ~4 min | Non‑negotiable product rules (law, not marketing). |
| 4 | [Flagship team bundle](./flagship-team-bundle-v1.md) | ~3 min | How teams **operate with** Jarvis—proposals, approvals, recorded outcomes. |

### 1. Gener8tor pitch

**Technical:** Six-slide **`/demo`** narrative, consequence-first, then live proof; ties to OpenClaw → Jarvis ingress in operator setups.

**Plain English:** Stakes and framing **before** deep UI—so the control-plane story lands first.

---

### 2. Room playbook

**Technical:** Opener slots (core idea, frame, consequence), short pitch, objection discipline.

**Plain English:** One clear story first—avoid a feature list before the problem is felt.

---

### 3. Thesis Lock (ADR)

**Technical:** ADR-0001 — propose vs approve vs execute; receipts; model is not a trusted principal.

**Plain English:** Agents may propose; **humans** own approval; **execution** is explicit; durable outcomes leave an **audit trail**.

---

### 4. Flagship team bundle

**Technical:** Alfred / Research / Creative roles, proposal ownership, batch semantics, sample flows.

**Plain English:** Operations run through **proposals**, **human approvals**, and **attributable outcomes**—not a vague “agent swarm.”

---

## Guided demo & walkthrough material

Operator scripts, runbooks, and short recordings live under **`docs/video/`** — see **[Walkthroughs, demos, and recording artifacts](../video/README.md)**.

| Area | Entry |
|------|--------|
| Full stack + checklist | [Investor demo — full runbook](../video/investor-demo-full-runbook.md) |
| One-page operator order | [Rehearsal run sheet](../video/investor-demo-rehearsal-run-sheet.md) |
| Spoken weave for `/demo` | [Investor demo — full narration script](./investor-demo-narrative-script.md) |

---

## Optional depth (after the first pass)

- **Proof map (trigger → line → artifact):** [Investor live proof map](./investor-live-proof-map.md)
- **Diligence Q&A (runtime, packaging, risk):** [Interview prep: Q&A](../interview-prep-jarvis.md#runtime-bypass-production-packaging-and-risk-tiers)
- **Positioning / market:** [Competitive landscape 2026](./competitive-landscape-2026.md)
- **Longer storyline:** [Pitch narrative outline](./pitch-narrative-outline.md)
- **Marp / export deck:** [Pitch deck README](./pitch-deck/README.md)
- **Short recording spec:** [90s proof demo](../video/90s-proof-demo.md)
- **Full product narrative:** [Product narrative thesis](./jarvis-hud-video-thesis.md) — read after the one-pagers; canonical prose spec (filename is historical).

---

## What not to lead with

- The whole docs library or `?library=all`
- Operator runbooks, env files, integration roadmaps—unless they are **installing** or doing **engineering diligence**
- Architecture dumps—until they ask **how** it is built

**Plain English:** First pass = **problem + guided demo + these four links**. Depth is a **pull**, not a push.

---

## Related

- [Documentation hub](../README.md) — map by role  
- **OpenClaw + Jarvis (single narrative):** [Runtime + team + Jarvis — one narrative loop v1](./runtime-openclaw-jarvis-team-loop-v1.md)
