---
title: "Investor demo — full operator runbook (boot + narration + camera)"
status: living-document
version: 2.0
owner: Ben Tankersley
created: 2026-04-21
category: video
related:
  - docs/strategy/investor-demo-narrative-script.md
  - docs/strategy/gener8tor-pitch.md
  - docs/strategy/flagship-team-bundle-v1.md
  - docs/strategy/investor-overview-bundle-room-script.md
  - docs/strategy/jarvis-hud-video-thesis.md
  - docs/setup/local-stack-startup.md
  - docs/video/investor-demo-rehearsal-run-sheet.md
  - DEMO.md
---

# Investor demo — full operator runbook

Single place for **boot discipline**, **spoken narrative**, and **camera choreography**. **Operator run sheet (one page):** [investor-demo-rehearsal-run-sheet.md](./investor-demo-rehearsal-run-sheet.md). The **single woven read-through** (no separate setup section on camera) is [investor-demo-narrative-script.md](../strategy/investor-demo-narrative-script.md). **Six-slide + block-timed narration:** [gener8tor-pitch.md](../strategy/gener8tor-pitch.md). On-screen beats: **`/demo`** — **six full-screen slides** (hero **Jarvis** + thesis, then Gener8tor narrative), **transition** (“This is not a concept. This is running.”), then the **cinematic proof** scroll (door / authority boundary, lifecycle, mock, HUD link). Integration and origin banners are hidden on `/demo` for a clean recording surface. **Alfred pastes and live outline text** (canonical) are in `src/components/demo/investorDemoSpeakerNotes.ts` — do not maintain a second copy; link here only.

**Thesis Lock:** [jarvis-hud-video-thesis.md](../strategy/jarvis-hud-video-thesis.md).

---

## Before you record

- **One OpenClaw gateway** — no duplicate Homebrew/LaunchAgent gateway fighting the checkout. See [Local stack startup](../setup/local-stack-startup.md).
- **`jarvis-hud/.env.local`:** `OPENCLAW_CONTROL_UI_URL` matches the real Control UI origin; `JARVIS_HUD_BASE_URL` matches how you open the HUD (don’t mix `localhost` vs `127.0.0.1`); ingress secret; `OPENAI_API_KEY`. For real **`send_email`:** `DEMO_EMAIL_USER` / `DEMO_EMAIL_PASS` — see [DEMO.md](../../DEMO.md).

---

## Boot (two terminals)

Paths below use `~/Documents/jarvis-hud`; adjust for your clone. **Same order as [local stack startup](../setup/local-stack-startup.md).**

**Terminal 1 — Jarvis HUD**

```bash
cd ~/Documents/jarvis-hud
pnpm dev
```

**Terminal 2 — OpenClaw** (from jarvis-hud; loads `.env.local` for gateway)

```bash
cd ~/Documents/jarvis-hud
OPENCLAW_ROOT=~/Documents/openclaw-runtime pnpm openclaw:dev
```

Wait until the gateway is **ready** / HTTP listening. If `OPENCLAW_CONTROL_UI_URL` is wrong, fix `.env.local` and restart **`pnpm dev`**.

**Sanity check**

```bash
cd ~/Documents/jarvis-hud
pnpm local:stack:doctor
```

**Browser**

- Jarvis: origin from `pnpm dev` (e.g. `http://127.0.0.1:3000`) — keep **`/`** and **`/activity`** in two tabs.
- OpenClaw Control UI: origin from `OPENCLAW_CONTROL_UI_URL`.

---

## Optional: HUD-only smoke (no Alfred)

For pending proposals without OpenClaw, see [DEMO.md](../../DEMO.md) (`pnpm demo:boot`, `demo:verify`, `demo:smoke`). That flow often uses **port 3001** and `demo-env`; for **Alfred + same `pnpm dev` HUD**, prefer driving proposals from OpenClaw or `pnpm demo:send-email` against the HUD you already opened.

---

## Spoken narrative

Use the **full woven script** in [investor-demo-narrative-script.md](../strategy/investor-demo-narrative-script.md) (one continuous take). Critical line (use **real**, not “clear”):

> As soon as those agents operate in real systems, the risks become **real**—especially when actions aren’t **independently verified**.

**Demo handoff (short)**

> Everything runs through a simple lifecycle: **propose**, **approve**, **execute**—then you get a **receipt** and a **trace** you can stand behind.  
> Most systems show you what already happened. Jarvis shows what was allowed to happen.

**Investor room — two-outcome `send_email` batch (recommended):** one OpenClaw → Alfred batch (unsafe draft vs safe draft; shared correlation); in the HUD, **Reject** the first, **Approve → Execute** the second. Full operator order, idle-banner note, and fallbacks: [investor-demo-rehearsal-run-sheet.md](./investor-demo-rehearsal-run-sheet.md). **Flagship `system.note` Flow 1** (two files, no email) remains in *OpenClaw Control UI* below.

---

## Locked talk track — `/demo` → live HUD (~8–12 min)

**Setup (before you speak):** `/demo` open; Jarvis HUD (**Activity** / queue); **OpenClaw Control** if using Alfred paste.

**Opening (~20–30 s):** Same spine as [investor-demo-narrative-script.md](../strategy/investor-demo-narrative-script.md): **hero (Jarvis + thesis)** → **three forces** (**Capability**, **Ungated execution**, **Governance pressure**) → **consequence** anchor (slide 3) → then gap, lock-in, handoff. Jarvis: agents **propose**, nothing ships without **explicit** human gating, every real action produces a **receipt** and **trace**.

**Slides (~1–2 min max):** Advance `/demo` through **six slides** in order (see script + [gener8tor-pitch.md](../strategy/gener8tor-pitch.md)); don’t skip naming the **three forces** on slide 2. Cinematic scroll after transition uses **door / authority** language (same world as the deck). **Outline track** on `/demo` matches [`investorDemoSpeakerNotes.ts`](../../src/components/demo/investorDemoSpeakerNotes.ts).

**Transition (before live proof in HUD):** Two beats (don’t rush the line break); then either continue **scrolling** `/demo` to the end of the cinematic block **or** hard cut to the HUD for the real two-outcome run.

**Path A — two-outcome `send_email` batch (typical investor room, ~5–7 min live):** Follow **line-for-line** the **Live proof** section in `investorDemoSpeakerNotes.ts` (scope → wrong vs right → consequence → **Reject** first → **Approve → Execute** second → inbox → receipt). Paste **`ALFRED_INVESTOR_DEMO_BATCH_EMAIL_PROMPT`** into OpenClaw → Alfred. **Fixed JSON** fallback: **`ALFRED_INVESTOR_DEMO_FIXED_EMAIL_FILES_PROMPT`** in the same file.

**Path B — Flagship `system.note` (no email, two cards):** Use *OpenClaw Control UI* prompts below (Alfred + Research files). **Approve → Execute** each card; no Gmail beat unless you add `send_email` separately.

**Close (sticky):** “**The agent generated the action. I controlled whether it ran. And now we have proof of what actually happened.**”

**Hand-off (ask):** How to position this in investor conversations without sounding like generic “AI governance.”

**Avoid on camera:** Deep OpenClaw internals; enumerating every agent; long scrolling; filling silence with jargon.

**Pacing trap:** You know the system, so you’ll speed up by default. **Force slower** delivery only at: the **consequence** line (+ micro-pause), **approve ≠ execute**, and **proof reveal**. Everything else can move.

---

## Final checklist (before the meeting)

Run mentally (or tick on paper):

- Gateway stable (**19001** confirmed — `pnpm local:stack:doctor`).
- HUD **Activity** clean enough to narrate (no distracting noise).
- Two-outcome run **reproducible** (Alfred batch paste + optional JSON fallback in `investorDemoSpeakerNotes.ts`) **or** flagship `system.note` files below.
- You land: **consequence** → **intercept** → **approve ≠ execute** → **receipt + trace**.
- You **stop talking** when proof is on screen.
- **After one full dry run:** note where you **rushed**, felt **awkward**, or **explained instead of showed**—that becomes your holes list for the next pass.

---

## OpenClaw Control UI — Flagship Flow 1 (chat prompts)

**Canonical bundle (narrative):** [Flagship team bundle v1](../strategy/flagship-team-bundle-v1.md). **Flow 1 shape** — Alfred intake `system.note`, then Research digest `system.note`, shared **`correlationId`: `flagship-bundle-eu-ai-act-001`**, two traces, two approve/execute cycles in the HUD. **Grep anchors + policy fields:** [Flagship proposal shapes (appendix)](../architecture/flagship-proposal-shape-examples-v1.md).

Workspace **`~/.openclaw/workspace-dev/JARVIS.md`** requires submissions via **`pnpm jarvis:submit --file …`** from **`jarvis-hud`** (same as [local verification §4b](../local-verification-openclaw-jarvis.md#4b-flagship-flow-1--alfred-intake--research-digest-full-bundle)).

**Prerequisites:** Jarvis HUD + ingress env in **`/Users/bentankersley/Documents/jarvis-hud/.env.local`**; OpenClaw Chat can run **terminal/shell** in that directory **or** you use the operator fallback commands below in a third terminal.

### Prompt 1 — Alfred intake (first proposal)

Paste into **OpenClaw → Chat**:

```
Flagship Flow 1 — Alfred intake only.

Follow workspace JARVIS.md: submit to Jarvis using the repo sample file—do not invent another submission path or use curl.

Working directory: /Users/bentankersley/Documents/jarvis-hud

Run:
pnpm jarvis:submit --file examples/openclaw-proposal-flagship-flow1-alfred-intake.sample.json

Reply with the Jarvis proposal id and trace id (pending). Do not claim execution—the HUD approves and executes.
```

### Prompt 2 — Research digest (second proposal)

Paste into **OpenClaw → Chat** (after Prompt 1 succeeded and you’re ready for the second card):

```
Flagship Flow 1 — Research digest only.

Follow workspace JARVIS.md. Same bundle as Alfred: the sample file already includes correlationId flagship-bundle-eu-ai-act-001—do not change it.

Working directory: /Users/bentankersley/Documents/jarvis-hud

Run:
pnpm jarvis:submit --file examples/openclaw-proposal-flagship-flow1-research.sample.json

Reply with the Jarvis proposal id and trace id. Submission only—not approve or execute from here.
```

### Operator fallback (if Chat cannot run shell)

```bash
cd /Users/bentankersley/Documents/jarvis-hud
pnpm jarvis:submit --file examples/openclaw-proposal-flagship-flow1-alfred-intake.sample.json
pnpm jarvis:submit --file examples/openclaw-proposal-flagship-flow1-research.sample.json
```

Then continue in the HUD: two pending items → **Approve** each → **Execute** each → show **receipt**, **trace**, and the shared **correlationId**.

---

## Camera choreography (Alfred + email — control-plane boundary)

Order is intentional: **stakes (consequence) before chrome** in spoken narrative, then capability on screen, then authority, then proof. If you switch to the HUD before saying what would happen **without** the control layer, the demo weakens—see [gener8tor-pitch.md](../strategy/gener8tor-pitch.md).

1. Show **Alfred** can perform the **email-capable** task (integration actually works).
2. Tell Alfred: **send it as proposal to Jarvis** (or equivalent).
3. In **OpenClaw**, show **pending** state and **traceId** (and any “next: approve in Jarvis HUD” copy).
4. Switch to **Jarvis HUD** — pending proposal visible.
5. **Approve**.
6. **Execute** (complete any confirmation the UI requires).
7. Show **receipt** and/or **Activity** with the **same traceId**.
8. Switch to **Gmail** (allowlisted inbox) for the **real-world proof**.

---

## On-camera close (after Gmail)

Return to **Jarvis HUD**, then say:

> The agent generated the action. Jarvis governed the execution. And now we have proof.

---

## Recording discipline

1. One **silent technical rehearsal** (no narration).
2. One **narrated** take.
3. Do **not** re-record unless something actually broke.

---

## Delivery reminders

- Speak ~20% slower than feels natural.
- Pause after “That’s the gap.” and after the “risks become real” beat.
- One clean emphasis on **independently verified**.

---

## Related

- [Rehearsal run sheet](./investor-demo-rehearsal-run-sheet.md)  
- [Git / change snapshot (audit)](./investor-demo-git-snapshot.md)  
- [90s proof demo](./90s-proof-demo.md)  
- [DEMO.md](../../DEMO.md)  
- [OpenClaw operator checklist](../setup/openclaw-jarvis-operator-checklist.md)
