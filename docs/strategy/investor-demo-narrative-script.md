---
title: "Investor / video demo — full narration script"
status: living-document
version: 2.17
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
**Tight opener + 3-minute walkthrough** (Overview + Bundle + `/demo` beats): [investor-overview-bundle-room-script.md](./investor-overview-bundle-room-script.md).  
Live demo steps: [DEMO.md](../../DEMO.md).  
**Operator runbook** (boot + camera): [investor-demo-full-runbook.md](../video/investor-demo-full-runbook.md). **Rehearsal run sheet** (one page): [investor-demo-rehearsal-run-sheet.md](../video/investor-demo-rehearsal-run-sheet.md).

**Single source for spoken deck + timing:** [`investorDemoSpeakerNotes.ts`](../../src/components/demo/investorDemoSpeakerNotes.ts). The `/demo` **outline track** mirrors that module (desktop split panel beside the deck; mobile **Script / N**). If this markdown and the TypeScript drift, **trust the `.ts`** and update here.

**Cinematic beats (`/demo`):** Six slides — **Hero (Jarvis + thesis)** → **Open — three forces** → **Consequence** → **The gap** → **Jarvis (lock-in)** → **Handoff** → tap **Enter live system** → **transition full-screen lines** (`INVESTOR_TRANSITION_SCRIPT`) → HUD proof. Canonical **on-screen copy** sits in [`Gener8torPitchSlideDeck.tsx`](../../src/components/demo/Gener8torPitchSlideDeck.tsx). Wiring: `DemoExperience.tsx`, `InvestorPitchSlides.tsx`, [`DemoSpeakerNotesPanel.tsx`](../../src/components/demo/DemoSpeakerNotesPanel.tsx). After handoff timing (Alfred lifecycle, approvals, Gmail batch): **`INVESTOR_LIVE_SCRIPT_SECTIONS`** plus Alfred prompts **`ALFRED_INVESTOR_DEMO_BATCH_EMAIL_PROMPT`** in the same file.

**Outline track UX (slide 1 only):**

- **`Outline + prompts` tab** — pre-deck **locked opener** (`INVESTOR_LOCKED_OPENER_PROGRAM_SCRIPT`) → **scale bridge** (`INVESTOR_SCALE_BRIDGE_AFTER_OPENER_SCRIPT`) → **Alfred batch `send_email` prompts** (same paste blocks as live “Operators”).
- **`Hero slide` tab** — short **deck cues** (`INVESTOR_HERO_DECK_NARRATION_SCRIPT`): let title + subtitle land; optional minimum narration.

Slides **2–6** show one scripted block each from **`INVESTOR_SLIDE_SCRIPTS`**, keyed to whichever slide is centered in the deck scroller.

**Timed blocks + slide labels:** [gener8tor-pitch.md](./gener8tor-pitch.md). Read-only **`/pitch`**: CTA → **`/activity`**.

This document matches the outline track wording for rehearsals and recording. It does not replace Thesis Lock.

---

## Memorize (room + camera)

1. **Pre-deck (`Outline + prompts`)** — Run the locked opener (~2 min) then scale (~30–45 s) **before** you lean on silence on slide 1, unless you’re skipping straight to Hero + deck.
2. **Slide 1 Hero** — **Jarvis** + *Autonomy in thinking. Authority in action.* Silence often wins; optional one line from **`INVESTOR_HERO_DECK_NARRATION_SCRIPT`** if you opened on deck not opener.
3. **Slide 2** — Three spoken beats (**Capability expanding / Execution ungated / Governance tightening**) → pause → **“Three forces collide at once.”** Bullets on screen reinforce email / systems detail without you rereading a laundry list.
4. **Slide 3** — Headline owns **authority** → HARD pause → **proposal → execution** failure mode → landing **“That’s the problem on screen.”** Let the typewriter/UI carry **system.note** / examples if visible; narration does not repeat the opener’s channel list.
5. **Slide 4** — **That’s the gap** pacing + visibility vs execution + **moment something runs** → HARD pause before slide 5.
6. **Slide 5** — Lock-in: **proposal ≠ run**, **nothing crosses**, **YOU decide**, **running is separate** → HARD stillness → proof line → beat → **“And that creates a simple loop.”**
7. **Slide 6 + live** — Lifecycle string on screen, then HUD; batch email path per **`INVESTOR_LIVE_SCRIPT_SECTIONS`** and operators block.

If the audience sees Activity before stakes land, the demo reads as “cool dashboard.” Run **slides 3–5** with weight before chrome.

---

## Full investor demo script (aligned to outline track)

Read in one continuous take. *Italics in parentheses* stage/delivery cues; **bold-ish** pacing is spelled out where the `.ts` uses `stage` blocks.

Canonical exports: **`INVESTOR_LOCKED_OPENER_PROGRAM_SCRIPT`**, **`INVESTOR_SCALE_BRIDGE_AFTER_OPENER_SCRIPT`**, **`INVESTOR_SLIDE_SCRIPTS`**, **`INVESTOR_TRANSITION_SCRIPT`**, **`INVESTOR_LIVE_SCRIPT_SECTIONS`**.

### Pre-deck — locked opener (~2 min) + scale (~30–45 s)

Speak from **`Outline + prompts`** on slide 1. Follow timings and **`say`** / **`stage`** lines in **`INVESTOR_LOCKED_OPENER_PROGRAM_SCRIPT`** and **`INVESTOR_SCALE_BRIDGE_AFTER_OPENER_SCRIPT`** verbatim in the HUD (dual headers · Reality → Jarvis framing · anchor thesis · transition into demo).

### Slide 1 — Hero *(deck · optional Hero tab)*

*(Often best in silence.)*

Slide 1 · Let title land, then subtitle.

“The subtitle carries the thesis: autonomy in thinking, authority in action.” *(Only if adding one line.)*

Advance when ready.

### Slide 2 — Open · Three forces collide at once

*Slide cue:* three beats, pause, then headline on screen.

Capability is expanding—agents are no longer just responding, they’re acting in real systems.

Execution is ungated—those actions can run immediately, without a human decision in the loop.

And governance is tightening—but the system still lacks authority at the moment something runs.

*(Pause.)*

Three forces collide at once.

*(Advance.)*

### Slide 3 — Consequence *(typewriter on screen)*

There’s no moment where a human owns the decision.

*(HARD pause · 3–5 sec · hold eye contact · stay still.)*

What actually happens is this:

a proposal turns into execution

before anyone has clearly authorized the run.

By the time it shows up in activity…

or in logs…

it’s already happened.

*(Short pause.)*

That’s the problem on screen.

### Slide 4 — The gap

That’s the gap.

*(Short pause — don’t rush.)*

Enterprises track agents—registries, catalogs, governance layers.

Most of that is visibility—

not what happens at execution.

*(Small pause.)*

In real systems, risk is real—

especially when actions aren’t independently verified before they run.

*(Slight slow-down.)*

What’s missing is control at the moment something runs.

*(HARD pause · ~3 sec · eye contact · stillness.)*

### Slide 5 — Jarvis · lock-in *(make-or-break delivery)*

*Operator cue:* slower · controlled · punch **YOU** on “You decide what runs”; HARD pause = **stay completely still**; closing proof line steady / slightly lower tone.

Jarvis is the control layer at that boundary.

A proposal is not a run.

Nothing crosses by accident.

*(Small pause.)*

Agents can propose.

You decide what runs.

And running it is a separate step.

*(HARD pause · ~3 sec · hold eye contact · stay completely still.)*

And when it does—

you get proof of exactly what happened.

*(Beat.)*

And that creates a simple loop.

### Slide 6 — Handoff → Enter live system

Slide 6 on screen · lifecycle subtitle · OpenClaw proposes / Jarvis governs *(operator — don’t bury in abstract stack talk).* 

This is the loop on the slide: propose → approve → execute → receipt → trace.

Most systems show you what already happened—you want attributable control over what was allowed.

*(Beat.)*

OpenClaw proposes.

Jarvis decides what runs.

Every action leaves a trace you can follow.

*(Pause.)*

That’s the difference between activity… and control.

Now I’ll show you that running live.

*Then:* tap **Enter live system** · land on HUD home (`/`) — live proof in **Activity + run sheet** (see stage note in `.ts`).

### Transition *(full-screen, post-handoff)*

Let land: **This is not a concept.** / **This is running.**

Optional after: **“Same loop—now in the live product.”**

### Operator — OpenClaw + email (`send_email` proposals)

**Recommended (investor room):** **One batch**, two `send_email` proposals — first **unsafe / wrong** (**Reject** in HUD), second **safe / right** (**Approve** → **Execute**). Paste blocks: **`ALFRED_INVESTOR_DEMO_BATCH_EMAIL_PROMPT`**, **`ALFRED_INVESTOR_DEMO_FIXED_EMAIL_FILES_PROMPT`** in [`investorDemoSpeakerNotes.ts`](../../src/components/demo/investorDemoSpeakerNotes.ts). **Order / pacing:** [investor-demo-rehearsal-run-sheet.md](../video/investor-demo-rehearsal-run-sheet.md). After handoff spoken outline: **`INVESTOR_LIVE_SCRIPT_SECTIONS`** in the same file.

**Minimal single good send:** `pnpm jarvis:submit --file scripts/demos/send-email-proposal.json` — [DEMO.md](../../DEMO.md); SMTP **`DEMO_EMAIL_*`** after execute.

### Product *(HUD — governance moment)*

This is a governed action.

Proposal at the boundary.

A human decides whether it executes.

Execution is separate — receipt/trace show what ran.

*(Pause.)*

### Hard cut continuity

Lifecycle in the HUD matches the deck loop: propose → approve → execute → receipt → trace. Every beat explicit; every action attributable.

### Gmail *(if you ran batch `send_email`)*

Only the pathway you executed exists in the inbox; contrast with rejected draft if you framed that earlier.

*(If **`system.note`** path only — end on HUD receipt/trace; skip Gmail.)*

### Final close *(three beats)*

The agent generated the shape of the action.

Jarvis governed whether it executed.

Proof is attributable.

---

## Delivery notes *(read once, rehearse twice)*

- **Deck sync:** Slides scroll-center drives outline index beside deck — keep narration with the slide visible.
- **Slide 5:** Not architecture tourism — restraint, slower, HARD pause motionless before proof.
- Speak slower than feels comfortable; silence carries authority.
- **Slide 4 closer** spoken = *moment something runs*; deck subtitle text may still read *moment of execution* — don’t fight the screen aloud.
- **Slide 6 → HUD:** Same-origin Activity; **`INVESTOR_LIVE_SCRIPT_SECTIONS`** for Alfred / approve / execute / receipt beats.
- Tone: inevitable, not hype — **evidence**, not vibes.

---

## Viewer takeaway

1. Capacity is expanding into real rails.  
2. Execution can jump ahead without real ownership at the boundary.  
3. Programs want visibility—but **authority at run** plus **proof** is what’s missing.  
4. Jarvis is that crossing: proposal ≠ execution, with attributable outcomes.

---

## After recording

Run the governed path in the HUD (see [DEMO.md](../../DEMO.md)): proposal → approval → execute → receipt → trace.
