---
title: "Investor demo — full operator runbook (boot + narration + camera)"
status: living-document
version: 1.1
owner: Ben Tankersley
created: 2026-04-21
category: video
related:
  - docs/strategy/investor-demo-narrative-script.md
  - docs/strategy/jarvis-hud-video-thesis.md
  - docs/setup/local-stack-startup.md
  - DEMO.md
---

# Investor demo — full operator runbook

Single place for **boot discipline**, **spoken narrative**, and **camera choreography**. The **single woven read-through** (no separate setup section on camera) is [investor-demo-narrative-script.md](../strategy/investor-demo-narrative-script.md). On-screen beats that mirror that script: **`/demo`** (integration and origin banners are hidden there for a clean recording surface).

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

## Camera choreography (Alfred + email — control-plane boundary)

Order is intentional: capability first, then authority, then proof.

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
