---
title: "Investor / video demo — full narration script"
status: living-document
version: 2.16
owner: Ben Tankersley
created: 2026-04-21
category: product-strategy
related:
  - docs/strategy/jarvis-hud-video-thesis.md
  - docs/strategy/pitch-narrative-outline.md
  - DEMO.md
  - docs/setup/local-stack-startup.md
  - docs/video/investor-demo-full-runbook.md
  - docs/video/investor-demo-rehearsal-run-sheet.md
  - docs/strategy/gener8tor-pitch.md
---

# Investor demo — full narration script

Canonical product thesis: [jarvis-hud-video-thesis.md](./jarvis-hud-video-thesis.md) (Thesis Lock).  
Live demo steps: [DEMO.md](../../DEMO.md).  
**Operator runbook** (boot + camera): [investor-demo-full-runbook.md](../video/investor-demo-full-runbook.md). **Rehearsal run sheet** (one page): [investor-demo-rehearsal-run-sheet.md](../video/investor-demo-rehearsal-run-sheet.md).  
**Cinematic beats:** **`/demo`** opens with **six slides**: **Jarvis (hero + thesis)** → **Open → Consequence → The gap → Jarvis (lock-in) → Demo handoff** — **canonical on-screen copy** is in [`Gener8torPitchSlideDeck.tsx`](../../src/components/demo/Gener8torPitchSlideDeck.tsx) (keep script and UI in sync when you change wording). Then **transition** → **cinematic proof** scroll ([`DemoCinematicScroll.tsx`](../../src/components/demo/DemoCinematicScroll.tsx)). Wiring: `DemoExperience.tsx`, `InvestorPitchSlides.tsx`. **Outline track (`/demo`):** [`investorDemoSpeakerNotes.ts`](../../src/components/demo/investorDemoSpeakerNotes.ts) — **split panel** beside the deck on desktop (mobile: **N** drawer). **Slide 1** = hook; **slides 2–6** = **house / river / door**; **live** = **Flow 1** + operator email optional. Read-only pitch (`/pitch`, docs URL): CTA → **`/activity`** (HUD). Technical rehearsal: **long-form weave** below; boot: [investor-demo-full-runbook.md](../video/investor-demo-full-runbook.md).  
**Timed blocks + speaker notes:** [gener8tor-pitch.md](./gener8tor-pitch.md).  
**Investor-facing path (read before live):** [investor-read-pack.md](./investor-read-pack.md) — what to send advisors; this file is **operator narration**.

This document is **spoken copy** + **stage directions** + **delivery notes**. It does not replace Thesis Lock. There is no separate setup section in the on-camera flow; the stack is **live** from the first scroll.

---

## Memorize (room + camera)

1. **Hero (slide 1)** — **Jarvis** + thesis on screen; **outline track** uses the full grounded house/river opener ending on the thesis line—or shorter silence if you prefer (see `investorDemoSpeakerNotes.ts`).  
2. **Three forces (slide 2)** — Continue **house / river** momentum (see Script panel); don’t read bullets aloud.  
3. **Anchor** — Email / code / API examples vs **`system.note`** on screen; stakes **before** the HUD.  
4. **Gap & lock-in (slides 4–5)** — Visibility ≠ execution; Jarvis separates approve / execute + proof.  
5. **Handoff → live** — Lifecycle string, then HUD / Flow 1 (or **`send_email`** path per operator block).

If the audience sees the HUD before they feel the stakes, the demo reads as “cool dashboard.” Forces and consequence before chrome.

---

## Full investor demo script (weaved — final)

Read this in one continuous take. Pauses are part of the script.

### Hero *(slide 1)*

*(Start on slide 1. Hold ~2 seconds. On screen: **Jarvis** — *Autonomy in thinking. Authority in action.*)*

*(Optional—silence is often stronger in mixed rooms:)* hold ~2s. *(If you want one line, stay concrete—no “layers”:)* “That sentence under the name—that’s what we’re here to show.”

*(Advance to slide 2.)*

### Three forces *(slide 2)*

We’re seeing three forces collide at once.

*(Either let the slide carry, or narrate in sync — use the **same labels** as `/demo`:)*

**Capability** — agents take real actions: email, systems, workflows, APIs.

**Ungated execution** — without a control layer, those actions can be allowed to run immediately — no human gate.

**Governance pressure** — regulation and enterprise programs are converging, while control at the moment of execution is still what’s missing.

*(Pause. Advance to slide 3 · Consequence.)*

### Consequence *(slide 3 — typewriter on screen)*

*(Headline: no moment where a human owns the decision. Let the typewriter run, or mirror its first line once if you want lockstep.)*

When the deck lands the second beat, **anchor the demo**: that could mean email, code, or an API — **on screen today** it’s **`system.note`**, same **control** boundary, different risk class.

*(Pause.)*

Let me show you that capability — and where authority actually sits.

*(Tiny pause.)*

And what you’re about to see is running live.

OpenClaw is generating the proposal locally, sending it through the Jarvis ingress path, and Jarvis is holding it at the approval boundary before anything executes.

*(Advance through slides 4–6 while you speak the sections below, or let the slides breathe — copy maps to **The gap**, **Jarvis lock-in**, **Handoff**.)*

### Infrastructure context *(slide 4 · The gap — start here or as you enter this slide)*

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

### Jarvis *(lock-in — slide 5)*

A system that separates approval from execution — and produces proof of what actually happened.

That’s what Jarvis does.

*(Tiny pause.)*

Jarvis doesn’t manage agents — it governs execution.

That’s where authority lives.

### Demo handoff *(slide 6, then “Enter live system”)*

Everything runs through a simple lifecycle:

propose → approve → execute → receipt → trace

This is the same local system — proposal from OpenClaw, governed and executed in Jarvis.

*(Optional.)*

Most systems show you what already happened. Jarvis shows what was allowed to happen.

### Operator — OpenClaw + email (`send_email` proposals)

**Recommended (investor room):** **One batch**, two `send_email` proposals — first **unsafe / wrong** (you **Reject** in the HUD), second **safe / right** (you **Approve** → **Execute**). The canonical **OpenClaw → Alfred** paste and the two-outcome **spoken** track live in [`investorDemoSpeakerNotes.ts`](../../src/components/demo/investorDemoSpeakerNotes.ts) — **`ALFRED_INVESTOR_DEMO_BATCH_EMAIL_PROMPT`**, plus **`ALFRED_INVESTOR_DEMO_FIXED_EMAIL_FILES_PROMPT`** (canned bad + good JSON, no LLM). **Order and pacing:** [investor-demo-rehearsal-run-sheet.md](../video/investor-demo-rehearsal-run-sheet.md).

**Minimal single good send (legacy one-proposal path):** Same signed ingress; proposal file **`scripts/demos/send-email-proposal.json`** (allowlisted recipient — [DEMO.md](../../DEMO.md)). Server needs **`DEMO_EMAIL_USER`** / **`DEMO_EMAIL_PASS`** for SMTP after you execute.

```bash
cd ~/Documents/jarvis-hud
pnpm jarvis:submit --file scripts/demos/send-email-proposal.json
```

or `pnpm demo:send-email` (loads `.env.local`).

**OpenClaw → Chat** (single file only; adjust path if your clone differs):

```
Investor demo — submit governed send_email only.

Follow workspace JARVIS.md: submit to Jarvis using the repo sample file—do not invent another submission path or use curl.

Working directory: /Users/bentankersley/Documents/jarvis-hud

Run:
pnpm jarvis:submit --file scripts/demos/send-email-proposal.json

Reply with the Jarvis proposal id and trace id (pending). Do not claim execution—the HUD approves and executes.
```

*(In the HUD: two-outcome **batch** = **Reject** first row / **Approve → Execute** second; or single proposal = **Approve** → **Execute** once → receipt/trace → **Gmail** proof as applicable.)*

### Product *(on screen)*

*(Move mouse slightly, deliberate.)*

This is a governed action.

The agent brings something to the door.

A human decides whether it crosses.

Execution happens separately.

The receipt and trace prove what moved forward.

*(Pause.)*

Not logs — **proof** (what was **allowed** to happen).

### Hard cut → real HUD

*(After the full-screen transition: “This is not a concept. This is running.”)*

This is the same lifecycle running in the actual system.

*(On screen: pending proposals — **Path A:** two-outcome **`send_email`** batch (Reject first / Approve → Execute second) **or** **Path B:** two **`system.note`** cards. **Approve** (when applicable) **→** **Execute** → receipt.)*

Every step is explicit.

Every action is attributable.

### Gmail *(proof moment — only if you ran `send_email`)*

*(Show the email clearly.)*

This is a real outbound action.

It was generated by the agent…

but it only exists because it was approved and executed through Jarvis.

*(If you stayed on **Flow 1** / **`system.note`** only, skip Gmail; end on **receipt + trace** in the HUD.)*

### Final close *(three beats — very important)*

*(Return to HUD or stay on proof.)*

The agent generated the action.

Jarvis governed the execution.

And now we have proof.

---

## Delivery notes *(read once, then record)*

- **Slide sync:** Hero (1) → three forces (2) → consequence typewriter (3) → gap (4) → Jarvis lock-in (5) → handoff (6) → transition → cinematic scroll / HUD. See [gener8tor-pitch.md](./gener8tor-pitch.md) for block timing.
- Speak slower than feels natural.
- Let pauses create weight.
- Do **not** rush: “That’s the gap,” “independently verified,” the **three-forces** beat, or the final three lines.
- Land **Capability / Ungated execution / Governance pressure** before the HUD; don’t repeat the ungated line twice — slide 2 already states it.
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
