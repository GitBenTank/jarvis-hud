---
title: "Gener8tor pitch — 6 slides + consequence-first demo"
status: living-document
version: 2.1
owner: Ben Tankersley
created: 2026-04-18
category: product-strategy
related:
  - docs/strategy/investor-demo-narrative-script.md
  - docs/video/investor-demo-full-runbook.md
  - docs/strategy/jarvis-hud-video-thesis.md
  - docs/strategy/competitive-landscape-2026.md
  - docs/strategy/pitch-narrative-outline.md
  - docs/strategy/room-playbook-v1.md
---

# Gener8tor pitch — six slides + demo

**Restraint in the room** (one core + one analogy + one consequence; objections only in Q&A): [room-playbook-v1.md](./room-playbook-v1.md).

**Purpose:** Ultra-tight deck copy and **consequence-first** demo narration for accelerator / investor rooms. Full woven read-through: [investor-demo-narrative-script.md](./investor-demo-narrative-script.md). Boot + camera order: [investor-demo-full-runbook.md](../video/investor-demo-full-runbook.md). Thesis Lock: [jarvis-hud-video-thesis.md](./jarvis-hud-video-thesis.md).

**Principle:** The audience should feel **consequence before chrome**. If they see the HUD first without the stakes line, the demo reads as “cool dashboard.” If they hear **what would have happened without the layer** first, it reads as **necessary infrastructure**.

**In-product:** **`/docs/strategy/gener8tor-pitch`** (and **`/pitch`**) opens the **cinematic six-slide deck** (same slides as phase 1 of **`/demo`**). **`?view=markdown`** on that URL shows this file in the minimal reader. **`/demo`** continues with **transition → live proof scroll** (`DemoExperience.tsx`). **Slide order:** **Jarvis (hero + thesis)** → Open → Consequence (typewriter) → Gap → Jarvis (lock-in) → Handoff. Slide 3 typewriter: **allowed to run immediately**, then anchor line + **`system.note`**.

---

## Six slides (speaker notes)

### Slide 1 — Jarvis *(hero — thesis only on screen)*

- **On screen:** **Jarvis** in solid white, large semibold display type (Geist / system stack); one **subtitle** line in muted gray — *Autonomy in thinking. Authority in action.* No gradient type, no rule, no micro-tag (reads cleaner / less “AI deck”).
- **Say (optional):** One beat of silence, or: *“This is the layer we’re about to prove.”* Then advance.

### Slide 2 — Open *(script: Open)*

- **Headline:** Three forces collide at once.
- **The three forces (on screen):**
  1. **Capability** — Agents take real actions (email, systems, workflows, APIs).
  2. **Ungated execution** — Without a control layer, those actions can be allowed to run immediately—no human gate.
  3. **Governance pressure** — Regulation and enterprise programs are converging—while control at the moment of execution is still what’s missing.
- **Footer on slide:** OpenClaw proposes locally → Jarvis ingress → held at approval before anything executes.
- **Say:** Name the three forces, then *“And what you’re about to see is running live.”* → OpenClaw … Jarvis … approval boundary. Match [investor-demo-narrative-script.md](./investor-demo-narrative-script.md) **Open**.

### Slide 3 — Consequence *(script: consequence + anchor)*

- **Headline:** No moment where a human owns the decision.
- **Body:** Typewriter — “allowed to run immediately—with no human gate,” then second line (email / code / API + **system.note** same boundary).
- **When live demo is `send_email`:** spoken consequence can swap to a single concrete line — see Block 3 below.

### Slide 4 — The gap *(script: Infrastructure context + Gap)*

- **Headline:** That’s the gap.
- **Bullets:** Enterprises track agents (registries, catalogs, governance) · Most of that is visibility—not what happens at execution · In real systems, risk is real—especially when actions aren’t independently verified.
- **Sub:** What’s missing is control at the moment of execution.
- **Table (optional Q&A):**

| Typical stack | What breaks |
|---------------|-------------|
| Tool runs on model or workflow | No clear **authority** moment |
| “We have governance” | **Visibility** ≠ execution control |
| After the fact | **Logs**, not reconstructable **proof** |

### Slide 5 — Jarvis *(script: Jarvis lock-in)*

- **Headline:** Approval ≠ execution — plus proof.
- **Sub:** Jarvis doesn’t manage agents — it governs execution. That’s where authority lives.

### Slide 6 — Handoff *(script: Demo handoff → enter live)*

- **Headline:** propose → approve → execute → receipt → trace
- **Sub:** Same stack — OpenClaw proposes, Jarvis governs. Most stacks give you logs. Jarvis gives you proof.
- **Footer:** Live: intercept → gate → execute → attributable outcome.

### Backup (30s) — Competition

- **Say:** Platforms have distribution; Jarvis is a **narrow wedge**—**architectural proof** at the action boundary. Detail: [competitive-landscape-2026.md](./competitive-landscape-2026.md).

---

## Demo narration — word-for-word + timing + clicks

**Assumptions:** Woven take; optional start on **`/demo`** for scroll, then **hard cut** to real HUD + Alfred / email path per runbook. **~3–4 min** full path; **~90s** if you skip `/demo` and open on HUD only.

### Block 0 — Pre-roll (5s, optional)

*“I’m going to show you something running live—not a slide.”*

### Block 1 — Jarvis hero / Slide 1 (5–15s)

Hold on **Jarvis** + thesis. Optional: one short line, or silence—then advance to Open.

### Block 2 — Open / Slide 2 (20–35s)

*“We’re seeing three forces collide at once.”* *(Pause.)* Point to the slide if needed:

1. **Capability** — real actions in real systems.  
2. **Ungated execution** — without a control layer, no human gate.  
3. **Governance pressure** — rules and programs meeting reality; execution control still the gap.

*“And what you’re about to see is running live.”* → *OpenClaw … Jarvis … approval boundary.*

### Block 3 — Consequence / Slide 3 (10–15s) — before any queue UI

**Default (system.note on screen):** *“Without this layer, these actions would be allowed to run immediately—no human gate.”* *(Pause.)* *“That could mean email, code, or an API. On screen today: system.note — same control boundary, different risk class.”*

**When the live demo is literally `send_email`:** pick **one** spoken line; do not hedge:

- **Email:** *“Without a control layer, that outbound path would fire like any other tool call—a real message to a real recipient, with no durable moment that says a human owned that decision.”*
- **Code:** *“Without a control layer, this would have modified real code on a real branch—or worse, the path everyone actually deploys from.”*
- **API:** *“Without a control layer, this would have triggered a real API call with real side effects and real billable spend.”*

**Bridge (required):**  
*“Let me show you that capability—and where authority actually sits.”*

### Block 4 — Infrastructure + gap / Slide 4 (25–40s)

Match script **Infrastructure context** + **Gap**: enterprises, visibility vs execution, *“That’s the gap,”* independently verified, *“What’s missing is control at the moment of execution.”*

Optional: *“The gap isn’t intelligence. The gap is runtime control.”*

### Block 5 — Jarvis lock-in / Slide 5 (15–20s)

Match script **Jarvis**: approval vs execution + proof; *“Jarvis doesn’t manage agents — it governs execution.”* (Thesis already landed on Slide 1.)

### Block 6 — Handoff / Slide 6 → live (10s + choreography)

Match script **Demo handoff**: full lifecycle string; OpenClaw + Jarvis; *“Most stacks give you logs. Jarvis gives you proof.”* Then **Enter live system** → proof choreography:

| Step | Time | Screen / action | Say |
|------|------|-----------------|-----|
| 5a Capability | 15–20s | Alfred / agent | *“The agent can do the real task—we’re not faking capability.”* Trigger through “send as proposal to Jarvis.” |
| 5b Intercept | 15s | OpenClaw pending + **traceId** | *“Pending. Nothing has crossed the authority boundary yet.”* |
| 5c Authority | 20s | Jarvis HUD — open proposal | *“This is the gate—not a log, not a vibe. A human has to approve.”* **Pause ~2s**, then Approve. |
| 5d Execute | 15–20s | HUD | Approve → **explicit Execute**. *“Execution is a separate step. That’s the point.”* |
| 5e Proof | 25–35s | Receipt + trace | Point at trace id. *“Receipt and trace—reconstructable. What was authorized, what ran.”* |
| 5f Real artifact | 15–20s | Gmail (or equivalent) | *“Real outbound action. Generated by the agent—but it only exists because it went through approve and execute in Jarvis.”* |
| 5g Close | 10s | HUD or proof | *“The agent generated the action. Jarvis governed the execution. And now we have proof.”* **Slow** on the three beats. |

### Timing cheatsheet

| Beat | Target |
|------|--------|
| Consequence → “Let me show you” | ≤20s total |
| Pause before Approve | ~2s |
| Final three beats | Do not run together |

---

## Alignment check

If the demo does not show **dangerous action proposed → intercept → approval → gated execute → receipt + trace**, the narrative weakens. Optional **blocked** path is still proof—see [90s-proof-demo.md](../video/90s-proof-demo.md).

---

## Related

- [Investor demo — full narration script](./investor-demo-narrative-script.md)  
- [Investor demo — full runbook](../video/investor-demo-full-runbook.md)  
- [Pitch narrative outline (longer deck)](./pitch-narrative-outline.md)
