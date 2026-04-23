---
title: "Gener8tor pitch — 5 slides + consequence-first demo"
status: living-document
version: 1.3
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

# Gener8tor pitch — five slides + demo

**Restraint in the room** (one core + one analogy + one consequence; objections only in Q&A): [room-playbook-v1.md](./room-playbook-v1.md).

**Purpose:** Ultra-tight deck copy and **consequence-first** demo narration for accelerator / investor rooms. Full woven read-through: [investor-demo-narrative-script.md](./investor-demo-narrative-script.md). Boot + camera order: [investor-demo-full-runbook.md](../video/investor-demo-full-runbook.md). Thesis Lock: [jarvis-hud-video-thesis.md](./jarvis-hud-video-thesis.md).

**Principle:** The audience should feel **consequence before chrome**. If they see the HUD first without the stakes line, the demo reads as “cool dashboard.” If they hear **what would have happened without the layer** first, it reads as **necessary infrastructure**.

**In-product:** **`/docs/strategy/gener8tor-pitch`** (and **`/pitch`**) opens the **cinematic five-slide deck** (same slides as phase 1 of **`/demo`**). **`?view=markdown`** on that URL shows this file in the minimal reader. **`/demo`** continues with **transition → live proof scroll** (`DemoExperience.tsx`). Slide 2 uses a short typewriter on the email consequence line; no tables before stakes.

---

## Five slides (speaker notes)

### Slide 1 — Reality

- **Headline:** Agents already act in the real world.
- **Bullets (max 3):** Outbound comms · Code and systems · APIs and workflows.
- **Say (optional):** This is live capability—not a lab chatbot.

### Slide 2 — What actually happens without this layer

- **Headline:** The failure mode is already here.
- **Table (keep sparse):**

| Typical stack | What breaks |
|---------------|-------------|
| Tool runs on model or workflow | No clear **authority** moment |
| “We have governance” | **Visibility** ≠ execution control |
| After the fact | **Logs**, not reconstructable **proof** |

- **One line (pick one and stay consistent):**
  - **Email:** Without a control layer, that email would have gone to a real external recipient.
  - **Code:** Without a control layer, this would have modified production code.
  - **API:** Without a control layer, this would have triggered a real API call.

### Slide 3 — Insight

- **Headline:** The model is not the authority.
- **Sub:** Autonomy in thinking. Authority in action.

### Slide 4 — System (Jarvis)

- **Headline:** Proposal → approval → execution → receipt → trace.
- **Sub:** Governs proposals, not runtimes. Proof is the product.

### Slide 5 — Proof

- **Headline:** Live.
- **Sub:** Intercept → gate → execute → attributable outcome.

### Backup (30s) — Competition

- **Say:** Platforms have distribution; Jarvis is a **narrow wedge**—**architectural proof** at the action boundary. Detail: [competitive-landscape-2026.md](./competitive-landscape-2026.md).

---

## Demo narration — word-for-word + timing + clicks

**Assumptions:** Woven take; optional start on **`/demo`** for scroll, then **hard cut** to real HUD + Alfred / email path per runbook. **~3–4 min** full path; **~90s** if you skip `/demo` and open on HUD only.

### Block 0 — Pre-roll (5s, optional)

*“I’m going to show you something running live—not a slide.”*

### Block 1 — Reality (20–30s)

*“Three things are true at once.”* *(Pause ~1s.)*  
*“Agents can take real actions: email, code, systems, APIs.”* *(Pause.)*

### Block 2 — Consequence (10–15s) — before any queue UI

Pick **one** line; do not hedge:

- **Email:** *“Without a control layer, that outbound path would fire like any other tool call—a real message to a real recipient, with no durable moment that says a human owned that decision.”*
- **Code:** *“Without a control layer, this would have modified real code on a real branch—or worse, the path everyone actually deploys from.”*
- **API:** *“Without a control layer, this would have triggered a real API call with real side effects and real billable spend.”*

**Bridge (required):**  
*“Let me show you that capability—and where authority actually sits.”*

### Block 3 — Insight (15s)

*“The gap isn’t intelligence. The gap is runtime control.”* *(Pause.)*  
*“The model should not be the authority. A person—or explicit policy—has to be.”*

### Block 4 — System (15s)

*“Jarvis is the control plane: propose, approve, execute—then receipt and trace.”*  
*“Approval is not execution. If you can’t point to the receipt, it didn’t happen in a way you can stand behind.”*

### Block 5 — Proof (choreography)

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
