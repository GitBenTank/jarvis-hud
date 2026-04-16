---
title: "Distribution checklist (proof-first)"
status: living-document
version: 1.2
owner: Ben Tankersley
created: 2026-04-11
related:
  - docs/video/90s-proof-demo.md
  - docs/strategy/competitive-landscape-2026.md
  - docs/marketing/social-copy.md
  - docs/setup/openclaw-jarvis-operator-sprint.md
---

# Distribution checklist (proof-first)

**Goal:** Reuse one **proof loop** everywhere—no new claims without a visible artifact. Script: [90s-proof-demo.md](../video/90s-proof-demo.md).

**Prerequisite:** End-to-end OpenClaw ↔ Jarvis is **repeatable** (ingress → pending → approve → execute or block → receipt → trace). Do not prioritize clips until this passes: [OpenClaw ↔ Jarvis operator sprint](../setup/openclaw-jarvis-operator-sprint.md).

---

## 1. Assets (record once, cut many)

| Asset | Length | Use |
|-------|--------|-----|
| Full proof demo | ~90s | Pitch, README link, long-form social |
| Mid cut | 30–45s | LinkedIn, homepage embed, conference loops |
| Hook clip | 10–15s | Cold open, Twitter/X, story-style |

**Cuts should preserve:** pending → approve → execute (or block) → receipt + trace → “proof of what happened.”

### What must never be cut

Edits that drop any of these remove the wedge (“cool edit, no proof”):

- **Approval moment** — the gate (human authorization before execution).
- **Execution** — or an explicit **block** / deny recorded as outcome.
- **Receipt line** — proof of what ran or what was denied.
- **Trace ID reference** — reconstructable path (“anyone can verify from the trace”).

---

## 2. Channels

- **LinkedIn** — Post + optional comment with repo link; lead with outcome, not stack.
- **GitHub** — README already links the script; add release / pinned discussion when the video file exists; consider a short GIF or embed in repo About (when hosted).
- **Homepage** — Embed mid or hook clip above the fold when you have a stable URL (YouTube unlisted, etc.).

---

## 3. Message consistency (do not drift)

Repeat the same phrases across channels:

- **approval before action**
- **proof of what happened** (receipt + trace)
- **reconstruct from trace** / anyone can verify the outcome
- **governs proposals, not runtimes** (when contrasting platforms)

Anti-claims: [competitive-landscape-2026.md](../strategy/competitive-landscape-2026.md) (guardrail table + terminology).

---

## 4. Loop

1. Post or ship embed.
2. Capture feedback (what landed, what confused).
3. Refine script or cuts—not the Thesis Lock.
4. Repost with the same proof story.

---

## Related

- [OpenClaw ↔ Jarvis operator sprint (prerequisite)](../setup/openclaw-jarvis-operator-sprint.md)
- [90-second proof demo script](../video/90s-proof-demo.md)
- [Social / About copy](social-copy.md)
- [Competitive landscape & positioning](../strategy/competitive-landscape-2026.md)
