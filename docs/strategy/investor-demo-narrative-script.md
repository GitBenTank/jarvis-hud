---
title: "Investor / video demo — full narration script"
status: living-document
version: 1.7
owner: Ben Tankersley
created: 2026-04-21
category: product-strategy
related:
  - docs/strategy/jarvis-hud-video-thesis.md
  - docs/strategy/pitch-narrative-outline.md
  - DEMO.md
  - docs/setup/local-stack-startup.md
  - docs/video/investor-demo-full-runbook.md
  - docs/strategy/gener8tor-pitch.md
---

# Investor demo — full narration script

Canonical product thesis: [jarvis-hud-video-thesis.md](./jarvis-hud-video-thesis.md) (Thesis Lock).  
Live demo steps: [DEMO.md](../../DEMO.md).  
**Operator runbook** (boot + camera): [investor-demo-full-runbook.md](../video/investor-demo-full-runbook.md).  
**Cinematic beats:** **`/demo`** opens with a **five-slide** investor narrative (full viewport), a **transition** (“This is not a concept. This is running.”), then the **cinematic proof** scroll (lifecycle, mock, HUD link). Implementation: `src/app/demo/DemoExperience.tsx`, `src/components/demo/InvestorPitchSlides.tsx`, `src/components/demo/DemoCinematicScroll.tsx`.  
**Gener8tor / five-slide + timed demo blocks:** [gener8tor-pitch.md](./gener8tor-pitch.md).

This document is **spoken copy** + **stage directions** + **delivery notes**. It does not replace Thesis Lock. There is no separate setup section in the on-camera flow; the stack is **live** from the first scroll.

---

## Memorize (room + camera)

1. **Reality** — Agents take real actions (email, code, systems, APIs).  
2. **Consequence** — Without this layer, actions would be **allowed to run immediately** (uncontrolled). **Anchor** with email / code / API **examples** so it stays real—without implying the **on-screen** demo already did that effect when you are on **`system.note`**. Say it **before** the queue UI lands.  
3. **Insight** — The model is not the authority.  
4. **System** — Jarvis: propose → approve → execute → receipt → trace.  
5. **Proof** — Live demo → receipt → trace → real artifact (e.g. Gmail).

If the audience sees the HUD before they feel the stakes, the demo reads as “cool dashboard.” Consequence first; interface second.

---

## Full investor demo script (weaved — final)

Read this in one continuous take. Pauses are part of the script.

### Open

*(Start on hero. Wait ~2 seconds.)*

We’re seeing three forces collide at once.

*(Scroll.)*

Agents are now capable of taking real-world actions — sending emails, modifying systems, triggering workflows.

*(Pause.)*

Without this layer, those actions would be **allowed to run immediately** — no separate moment where a human owns the decision.

*(Tiny pause.)*

That could mean sending an email, modifying code, or hitting an API. **On screen today** you’ll see **`system.note`** — same **control** boundary, different risk class.

*(Pause.)*

Let me show you that capability — and where authority actually sits.

*(Tiny pause.)*

And what you’re about to see is running live.

OpenClaw is generating the proposal locally, sending it through the Jarvis ingress path, and Jarvis is holding it at the approval boundary before anything executes.

### Infrastructure context

We’re already seeing this at the infrastructure level.

Enterprises are building systems to track and manage agents — registries, catalogs, governance layers.

But those systems focus on visibility — what exists, who owns it, and what can be reused.

### Gap *(slow down)*

They don’t control what actually happens at the moment an agent takes action.

And that’s true even in systems that look like they have governance — because the control isn’t at execution.

*(Pause.)*

That’s the gap.

*(Pause.)*

As soon as those agents operate in real systems, the risks become real — especially when actions aren’t independently verified.

*(Pause.)*

At the same time, organizations are moving toward formal governance for AI systems in production.

*(Pause.)*

What’s missing is control at the moment of execution.

*(Full breath.)*

### Jarvis *(lock-in)*

A system that separates approval from execution — and produces proof of what actually happened.

That’s what Jarvis does.

*(Tiny pause.)*

Jarvis doesn’t manage agents — it governs execution.

That’s where authority lives.

### Demo handoff

Everything runs through a simple lifecycle:

propose → approve → execute → receipt → trace

This is the same local system — proposal from OpenClaw, governed and executed in Jarvis.

*(Optional.)*

Most stacks give you logs. Jarvis gives you proof.

### Operator — OpenClaw + email (`send_email` proposal)

Run **once** before you **hard cut** to the real HUD (or immediately after the handoff above). Same signed ingress as Flow 1; proposal file is **`scripts/demos/send-email-proposal.json`** (allowlisted demo recipient — see [DEMO.md](../../DEMO.md)). Server must have **`DEMO_EMAIL_USER`** / **`DEMO_EMAIL_PASS`** for SMTP after you execute.

**Terminal (from `jarvis-hud`):**

```bash
cd ~/Documents/jarvis-hud
pnpm jarvis:submit --file scripts/demos/send-email-proposal.json
```

**Same behavior, one wrapper** (loads `.env.local` like `pnpm openclaw:dev`):

```bash
cd ~/Documents/jarvis-hud
pnpm demo:send-email
```

**OpenClaw → Chat** (paste; adjust path if your clone is not `~/Documents/jarvis-hud`):

```
Investor demo — submit governed send_email only.

Follow workspace JARVIS.md: submit to Jarvis using the repo sample file—do not invent another submission path or use curl.

Working directory: /Users/bentankersley/Documents/jarvis-hud

Run:
pnpm jarvis:submit --file scripts/demos/send-email-proposal.json

Reply with the Jarvis proposal id and trace id (pending). Do not claim execution—the HUD approves and executes.
```

*(Then in the HUD: pending **`send_email`** → **Approve** → **Execute** → receipt/trace → **Gmail** proof below.)*

### Product *(on screen)*

*(Move mouse slightly, deliberate.)*

This is a governed action.

The agent proposes the action.

A human explicitly approves it.

Execution happens as a separate step.

And we get a receipt and a trace tied to that action.

*(Pause.)*

Not logs — proof.

### Hard cut → real HUD

*(No transition.)*

This is the same lifecycle running in the actual system.

*(On screen: the pending **`send_email`** you submitted—**Approve** → **Execute** → receipt. Same lifecycle as `system.note`; different consequence when it runs.)*

Every step is explicit.

Every action is attributable.

### Gmail *(proof moment)*

*(Show the email clearly.)*

This is a real outbound action.

It was generated by the agent…

but it only exists because it was approved and executed through Jarvis.

### Final close *(three beats — very important)*

*(Return to HUD or stay on proof.)*

The agent generated the action.

Jarvis governed the execution.

And now we have proof.

---

## Delivery notes *(read once, then record)*

- Speak slower than feels natural.
- Let pauses create weight.
- Do **not** rush: “That’s the gap,” “independently verified,” the **consequence** beat after real actions, or the final three lines.
- Say the **without a control layer** line before the HUD reads as the hero; consequence before chrome.
- Tone: calm, controlled, inevitable.
- This is not a pitch — it’s **evidence**.

### Viewer takeaway

1. Agents can do real things.  
2. That can go wrong.  
3. Control belongs at execution — with proof.  
4. Jarvis is that layer.

---

## After recording

Run the governed path in the HUD (see [DEMO.md](../../DEMO.md)): proposal → approval → execute → receipt → trace.
