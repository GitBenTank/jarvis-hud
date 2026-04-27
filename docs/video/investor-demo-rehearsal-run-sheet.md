---
title: "Investor demo — rehearsal run sheet (operator)"
status: living-document
version: 1.1
owner: Ben Tankersley
category: video
related:
  - docs/video/investor-demo-full-runbook.md
  - docs/strategy/jarvis-hud-video-thesis.md
  - src/components/demo/investorDemoSpeakerNotes.ts
---

# Investor demo — rehearsal run sheet

**One page.** Use with the [full runbook](./investor-demo-full-runbook.md) for boot and camera. **Canonical spoken outline + OpenClaw pastes** live in [`investorDemoSpeakerNotes.ts`](../../src/components/demo/investorDemoSpeakerNotes.ts) (`ALFRED_INVESTOR_DEMO_*`, live Flow 1 blocks).

**Thesis Lock:** [jarvis-hud-video-thesis.md](../strategy/jarvis-hud-video-thesis.md).

---

## 0) Surfaces (order of operations)

1. **Optional:** [Investor read pack](../strategy/investor-read-pack.md) / **`/docs/tati`** — 15 min path; **Operator notes** = slide + live script.
2. **Front door:** **`/docs`** — **Start here** CTA → **`/demo`**.  
3. **Canonical walkthrough:** **`/demo`** — six slides, then **Enter live system** → **`/`** (HUD home, same origin). In-page cinematic scroll after the deck is **not** on this path.  
4. **Read-only deck only:** **`/pitch`** (not where notes or execution live; handoff: **`/demo`** then **`/`** for live).  
5. **Proof surface:** navigate from home to **`/activity`** as needed — Reject / Approve / Execute, receipts, traces.  
6. **Runtime (paste):** **OpenClaw Control → Chat (Alfred)**.

---

## 1) Pre-flight (5–10 min before)

| Check | |
|--------|---|
| Two terminals | **`pnpm dev`** (Jarvis) · **`OPENCLAW_ROOT=~/Documents/openclaw-runtime pnpm openclaw:dev`** (gateway) |
| Doctor | `pnpm local:stack:doctor` |
| Browser tabs | **Jarvis** (`/` or Home + **`/activity`**) · **OpenClaw Control** |
| Email (if real send) | `DEMO_EMAIL_*` in `.env.local` per [DEMO.md](../../DEMO.md) |
| Inbox (optional) | Second screen or tab ready for the **good** send only |

**Idle banner on HUD:** “OpenClaw: idle… ~5 min” = **recency** on stored events, not proof the gateway is dead. If you expected **new** traffic, check the gateway; otherwise **traces and Activity** are the source of truth.

---

## 2) `/demo` (rehearsal, not a race)

- Advance **all six** slides; don’t read bullets as a script.  
- **Outline track:** **Slides** = house / river / door (live Flow 1 + Alfred pastes live in code / runbook—use after **`/`**). Mobile: **N** for notes.  
- **After** you hit **Enter live system**: you’re in the **HUD** at **`/`**—open OpenClaw, then **Activity** for the queue, proposals, and proof.

---

## 3) Live path — two-outcome `send_email` batch (recommended)

**Intent:** One batch, two proposals — **first wrong** (human **Reject**), **second right** (human **Approve** → **Execute**). Same system, different human outcomes; receipts and traces.

1. In **OpenClaw → Alfred**, paste **`ALFRED_INVESTOR_DEMO_BATCH_EMAIL_PROMPT`** from `investorDemoSpeakerNotes.ts` (natural-language batch with shared correlation). **Do not** execute mail from OpenClaw.  
2. Confirm **Agent Proposals** in Jarvis: **1/2** and **2/2** visible in the same review context.  
3. **Item 1:** **Reject** quickly — do not dwell.  
4. **Item 2:** **Approve** (and any **Details** / safety phrase the UI requires) → brief pause → **Execute**.  
5. **Gmail (optional but strong):** Show **only** the good send. **Stop talking** when the message is visible.  
6. **Return to HUD** — read **receipt** / **Activity**; tie **proposed / approved / ran**.

**Optional power line (once, after inbox):** That message exists because **you** allowed it—not because the system “just sent it.”

**Fallback (deterministic, no LLM):** `ALFRED_INVESTOR_DEMO_FIXED_EMAIL_FILES_PROMPT` in the same file (two `jarvis:submit` lines for bad + good JSON under `scripts/demos/`).

---

## 4) Pacing (non-negotiable)

| Beat | How |
|------|-----|
| Reject (bad) | Fast — should feel *obvious* |
| Approve | Slow enough that “approval is not execution” registers |
| Execute | Slower still — *weight* |
| Inbox / receipt | **Silence** — let it land |

---

## 5) After one full dry run

Write down: where you **rushed**, where you **talked over proof**, and any **jargon** you reached for. That list is the next rehearsal’s only agenda.

---

## Related

- [Full operator runbook](./investor-demo-full-runbook.md)  
- [Full narration script](../strategy/investor-demo-narrative-script.md)  
- [Gener8tor six-slide + timing](../strategy/gener8tor-pitch.md)  
- [Git / change snapshot (working tree)](./investor-demo-git-snapshot.md) — path-by-path list when you need a hard audit
