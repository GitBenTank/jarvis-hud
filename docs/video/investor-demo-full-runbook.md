---
title: "Investor demo — full operator runbook (boot + narration + camera)"
status: living-document
version: 1.8
owner: Ben Tankersley
created: 2026-04-21
category: video
related:
  - docs/strategy/investor-demo-narrative-script.md
  - docs/strategy/gener8tor-pitch.md
  - docs/strategy/flagship-team-bundle-v1.md
  - docs/strategy/jarvis-hud-video-thesis.md
  - docs/setup/local-stack-startup.md
  - DEMO.md
---

# Investor demo — full operator runbook

Single place for **boot discipline**, **spoken narrative**, and **camera choreography**. The **single woven read-through** (no separate setup section on camera) is [investor-demo-narrative-script.md](../strategy/investor-demo-narrative-script.md). **Six-slide + block-timed narration:** [gener8tor-pitch.md](../strategy/gener8tor-pitch.md). On-screen beats: **`/demo`** — **six full-screen slides** (hero **Jarvis** + thesis, then Gener8tor narrative), **transition** (“This is not a concept. This is running.”), then the **cinematic proof** scroll (lifecycle, mock, HUD link). Integration and origin banners are hidden on `/demo` for a clean recording surface.

**Thesis Lock:** [jarvis-hud-video-thesis.md](../strategy/jarvis-hud-video-thesis.md).

---

## Before you record

- **One OpenClaw gateway** — no duplicate Homebrew/LaunchAgent gateway fighting the checkout. See [Local stack startup](../setup/local-stack-startup.md).
- **`jarvis-hud/.env.local`:** `OPENCLAW_CONTROL_UI_URL` matches the real Control UI origin; `JARVIS_HUD_BASE_URL` matches how you open the HUD (don’t mix `localhost` vs `127.0.0.1`); ingress secret; `OPENAI_API_KEY`. For real **`send_email`:** `DEMO_EMAIL_USER` / `DEMO_EMAIL_PASS` — see [DEMO.md](../../DEMO.md).

---

## Boot (two terminals)

Paths below use `~/Documents/jarvis-hud`; adjust for your clone.

**Terminal 1 — OpenClaw** (from jarvis-hud; loads `.env.local` for gateway)

```bash
cd ~/Documents/jarvis-hud
pnpm openclaw:dev
```

Wait until the gateway is **ready** / HTTP listening. If `OPENCLAW_CONTROL_UI_URL` is wrong, fix `.env.local` and restart **`pnpm dev`**.

**Terminal 2 — Jarvis HUD**

```bash
cd ~/Documents/jarvis-hud
pnpm dev
```

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
> Most stacks give you logs. Jarvis gives you proof.

---

## Locked talk track — `/demo` → Flow 1 (~8–12 min)

**Setup (before you speak):** `/demo` open; Jarvis HUD (**Activity** / queue); optional OpenClaw Control UI.

**Opening (~20–30 s):** Agents take real actions (email, code, APIs). Without a control layer, those actions just happen. Jarvis: agents **propose**, nothing executes without **explicit approval**, every real action produces a **receipt** and **trace**.

**Slides (~1–2 min max):** Click through `/demo` — **propose → approve → execute → receipt → trace**. Keep it short; frame as “the model,” not a feature tour.

**Transition (before live HUD):** Two beats (don’t rush the line break):

1. “This isn’t just a diagram—**this is running**.”
2. “And **without this layer**… these actions would be **allowed to run immediately**—no human gate.” *(Optional second beat:)* “That could mean email, code, an API—**you’re seeing `system.note`, but the boundary is the same.**”

**Then** switch to HUD (and OpenClaw Chat if driving Flow 1 from there).

**Flow 1 — core (~5–7 min):**

1. **Scope (say once):** “Today I’m showing this with **system notes**—but the **same boundary** applies to **email, code, and real external actions**.” (Stops the room from thinking this is only note-taking.)
2. **Alfred intake** — first `system.note`: “Nothing has happened yet. This is just a proposal.”
3. **Research digest** — second `system.note`.
4. **Key moment (consequence):** Say: “**If this system didn’t exist, both of these would be allowed to run immediately**—**uncontrolled**.” **Micro-pause:** deliver the line → **look at them** → count **1… 2** in your head → then continue. That silence is where risk lands. Then: “**Instead, nothing happens until I explicitly approve**—and **even then, execution is a separate step**.” **Correlation / two-card detail (optional):** If the room is technical, add one line: two proposals, one **correlationId**, **independent** approve/execute—no fake batching. If not technical, **skip**—don’t trade momentum for explanation.
5. **Pending** — Point at pending state. Say: “**This is the system holding the line.**” Then (if needed): “Nothing runs automatically.”
6. **Approve** — “Approval is explicit—and it does **not** execute anything.” (**Slow down** here.)
7. **Execute** — “Execution is a **separate** step.”
8. **Proof** — receipt + trace; what was approved, what ran, reconstructable. **Slow down** on the reveal. **Stop talking when proof is visible.**

**Close (sticky):** “**The agent generated the action. I controlled whether it ran. And now we have proof of what actually happened.**”

**Hand-off (ask):** How to position this in investor conversations without sounding like generic “AI governance.”

**Avoid on camera:** Deep OpenClaw internals; enumerating every agent; long scrolling; filling silence with jargon.

**Pacing trap:** You know the system, so you’ll speed up by default. **Force slower** delivery only at: the **consequence** line (+ micro-pause), **approve ≠ execute**, and **proof reveal**. Everything else can move.

---

## Final checklist (before the meeting)

Run mentally (or tick on paper):

- Gateway stable (**19001** confirmed — `pnpm local:stack:doctor`).
- HUD **Activity** clean enough to narrate (no distracting noise).
- Both Flow 1 proposals **reproducible fast** (OpenClaw prompts or fallback `jarvis:submit` commands).
- You land: **consequence** → **intercept** → **approve ≠ execute** → **receipt + trace**.
- You **stop talking** when proof is on screen.
- **After one full dry run:** note where you **rushed**, felt **awkward**, or **explained instead of showed**—that becomes your holes list for the next pass.

---

## OpenClaw Control UI — Flagship Flow 1 (chat prompts)

**Canonical bundle:** [Flagship team bundle v1](../strategy/flagship-team-bundle-v1.md) Flow 1 — Alfred intake `system.note`, then Research digest `system.note`, shared **`correlationId`: `flagship-bundle-eu-ai-act-001`**, two traces, two approve/execute cycles in the HUD.

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

- [90s proof demo](./90s-proof-demo.md)  
- [DEMO.md](../../DEMO.md)  
- [OpenClaw operator checklist](../setup/openclaw-jarvis-operator-checklist.md)
