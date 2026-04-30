---
title: "Investor read pack — one path, plain English"
status: living-document
version: 2.6
category: strategy
owner: Ben Tankersley
related:
  - ./gener8tor-pitch.md
  - ./room-playbook-v1.md
  - ../decisions/0001-thesis-lock.md
  - ./flagship-team-bundle-v1.md
  - ../video/investor-demo-full-runbook.md
  - ../video/investor-demo-rehearsal-run-sheet.md
  - ./investor-demo-narrative-script.md
  - ./investor-overview-bundle-room-script.md
  - ./investor-landscape-answer-card.md
  - ./investor-live-proof-map.md
  - ../interview-prep-jarvis.md
---

# Investor read pack

**What this is:** For advisors and investors—**why agent systems need a control plane**, in about **15 minutes** reading (fixed order—no reordering slides per meeting).

**Most stacks log what happened.** This path is anchored on **who decided**, **who executed**, and **what actually occurred**.

**In plain English:** AI can already touch real rails (mail, code, APIs). The gap isn’t intelligence—it’s **authority at execution** plus **usable proof afterward**. Jarvis sits on that boundary.

**In the HUD (minimal layout):** [/docs/tati](/docs/tati) — same four links, faster scan; **Operator notes** toggles a split panel (slide script + live path after handoff).

**In the room:** Lead with the **problem**, then **[Demo](/demo)** (story + live proof). Open these docs when they want depth—not instead of the demo. Need a tight **opener + 3‑minute beats** keyed to Overview + flagship bundle → [investor Overview + Bundle room script](./investor-overview-bundle-room-script.md). **“Who competes?”** — spoken lines (not the long memo): [investor landscape answer card](./investor-landscape-answer-card.md).

**Surfaces:** **`/demo`** is the **canonical cinematic investor deck**—six slides with **split outline track** beside the deck (mobile: **N** drawer), transition, and live scroll. **`/pitch`** and **`/docs/strategy/gener8tor-pitch`** are the **same slides read-only**; handoff **Open Jarvis HUD** goes to **`/activity`** (queue) for the live walkthrough (e.g. OpenClaw from the UI). Use **`/demo`** when you want notes next to the slides while you rehearse.

---

## Read in this order (the canonical four)

| # | Doc | ~time | What you’re reading |
|---|-----|-------|---------------------|
| 1 | [Gener8tor pitch](./gener8tor-pitch.md) | ~5 min | Slide copy + demo beats for investor rooms. |
| 2 | [Room playbook](./room-playbook-v1.md) | ~3 min | How we show up: restraint, opener, Q&A. |
| 3 | [Thesis Lock (ADR)](../decisions/0001-thesis-lock.md) | ~4 min | The non‑negotiable rules of the product (law, not marketing). |
| 4 | [Flagship team bundle](./flagship-team-bundle-v1.md) | ~3 min | How teams actually use Jarvis—proposals, approvals, recorded outcomes—not a vague “agent swarm”. |

### 1. Gener8tor pitch

**Technical:** Six-slide `/demo` narrative, consequence-first, then live proof; ties to OpenClaw → Jarvis ingress in operator setups.

**Plain English:** It’s the **script for the movie**—what you say and show before anyone asks to “see the product.” The slides exist so **stakes land before the UI**.

---

### 2. Room playbook

**Technical:** Opener slots (core idea, frame, consequence), 30-second pitch, objection discipline.

**Plain English:** It’s **how we don’t talk ourselves out of a win**—one clear story, no feature laundry list in the first five minutes.

---

### 3. Thesis Lock (ADR)

**Technical:** ADR-0001 — propose vs approve vs execute; receipts; model is not a trusted principal.

**Plain English:** The **constitution**: agents can suggest anything; **humans** own the yes; **running** the action is a separate step; everything important leaves an **audit trail**. If someone asks “can the model just do it?” the answer is **no, by design**.

---

### 4. Flagship team bundle *(usage, not internals)*

**Technical:** Alfred / Research / Creative roles, proposal ownership, batch semantics, sample flows.

**Plain English:** Real work flows through **proposals**, **human approvals**, and **attributable outcomes**. This doc shows how a small agent team routes work **without** smearing who’s allowed to run what.

---

## Live demo (operators + narrators)

Use when you’re **running** the meeting, not just reading.

| Doc | Purpose |
|-----|---------|
| [Investor demo — full narration script](./investor-demo-narrative-script.md) | **Spoken** weave: hero → three forces → consequence → gap → handoff → HUD. |
| [Investor demo — full runbook](../video/investor-demo-full-runbook.md) | **Boot**, camera, Flow 1 / email, OpenClaw prompts, checklist. |
| [Rehearsal run sheet](../video/investor-demo-rehearsal-run-sheet.md) | **One-page** operator order: surfaces, Alfred paste, Reject/Approve rhythm, fallbacks. |

**Plain English:** The **read pack** is for *investors*; the **script + runbook** is for *you* the night before—so the live demo matches the story.

---

## If they ask for more (optional, not the first email)

- **5-minute pressure sheet (trigger → line → pixel):** [Investor live proof map](./investor-live-proof-map.md) — what to say, what to show, where proof lives in repo.
- **Pushback — runtime bypass, packaging, risk tiers:** [Interview prep: Q&A](../interview-prep-jarvis.md#runtime-bypass-production-packaging-and-risk-tiers) — *Plain English:* trusted vs auditable path, credentials posture, production shape.
- **Positioning / market:** [Competitive landscape 2026](./competitive-landscape-2026.md) — *Plain English:* where we sit vs platforms and “governance theater.”
- **Longer deck storyline:** [Pitch narrative outline](./pitch-narrative-outline.md) — *Plain English:* chapter list if they want a **full deck**, not the six-slide cinematic path.
- **Marp / export deck source:** [Pitch deck README](./pitch-deck/README.md) — separate artifact from `/demo`.
- **Ultra-short recording:** [90s proof demo](../video/90s-proof-demo.md) — *Plain English:* when you only have a minute of tape.
- **Full product narrative spec:** [Video thesis](./jarvis-hud-video-thesis.md) — read **after** the one-pagers; it’s the director’s cut.

---

## What not to send in the first pass

- The whole docs library or `?library=all`
- Operator runbooks, env files, integration phase roadmaps—unless they’re **installing** or doing **engineering diligence**
- Architecture dumps—until they ask **how** it’s built

**Plain English:** First touch = **problem + demo + these four links**. Depth is a **pull**, not a push.

---

## Related

- [Documentation hub](../README.md) — full map by role  
- **Runtime narrative (only if asked how OpenClaw + Jarvis fit):** [Runtime + team + Jarvis — one narrative loop v1](./runtime-openclaw-jarvis-team-loop-v1.md)
