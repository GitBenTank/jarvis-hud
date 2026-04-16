---
title: "Jarvis — 90s proof demo"
status: living-document
version: 1.3
owner: Ben Tankersley
created: 2026-04-11
related:
  - docs/strategy/pitch-narrative-outline.md
  - docs/video/jarvis-demo-recording.md
  - docs/setup/openclaw-jarvis-operator-sprint.md
---

# Jarvis — Approval and proof for AI action (90s)

**Purpose:** One repeatable recording that shows **approval before action** and **proof after**—usable for pitch, homepage embed, investors, and social.

**Principle:** The demo is the proof. No capability without a visible artifact.

**Before recording:** Complete the [OpenClaw ↔ Jarvis operator sprint](../setup/openclaw-jarvis-operator-sprint.md) exit criteria so the loop is real on camera—not a one-off lucky run.

---

## Scene 1 — Setup (10s)

- HUD open (e.g. Activity or main queue view).
- OpenClaw Control (or your agent source) visible if split-screen helps.
- **One line:** “We’ll show approval before action and proof after.”

---

## Scene 2 — Proposal (15s)

- Trigger a proposal from OpenClaw (or `pnpm jarvis:submit` / smoke path you use in dev).
- HUD shows **Pending**.
- **Callout:** “Agents propose—nothing executes yet.”

---

## Scene 3 — Approval (15s)

- Operator **approves** in the HUD.
- **Callout:** “Authority boundary—human gate.”

---

## Scene 4 — Execution (15s)

- Run **execute** (explicit step per your action type), or **intentionally block once** to show policy / denial path.
- **Callout:** “Execution is separate from decision.”

**Optional failure variant:** Show **blocked** execution (policy gate or preflight deny). Outcome is still first-class: **receipt + trace** with status **BLOCKED** / denied—denies are proof too, not silent failures.

---

## Scene 5 — Receipt + trace (20s)

- Show **receipt** (executed actions / artifact) and **trace** timeline.
- Point at: **Trace ID** — “Anyone can reconstruct this action from the trace.” Then outcome, **artifact**, **rollback** path if surfaced for that action.
- **Line:** “This is the proof of what happened.”

---

## Scene 6 — Close (10–15s)

- **Tagline:** “Jarvis decides what AI is allowed to do—and proves what it did.”

---

## OBS (minimal)

- **Scene A:** Full screen — HUD + OpenClaw Control (or browser tabs side by side).
- **Scene B:** Zoom or crop — receipt + trace panel (readability for Trace ID / receipt line).
- **Audio:** Clean voiceover; music optional and low—dialogue clarity beats production polish for v1.

---

## Related

- Full investor/demo path: [DEMO.md](../../DEMO.md) · [jarvis-demo-recording.md](./jarvis-demo-recording.md)
- Pitch order (demo central): [pitch-narrative-outline.md](../strategy/pitch-narrative-outline.md)
- Where to ship the recording: [distribution-checklist.md](../marketing/distribution-checklist.md)
