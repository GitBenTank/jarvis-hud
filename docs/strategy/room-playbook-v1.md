---
title: "Room playbook — restraint (investor + adjacent rooms)"
status: living-document
version: 1.1
owner: Ben Tankersley
created: 2026-04-18
category: product-strategy
related:
  - docs/strategy/jarvis-hud-video-thesis.md
  - docs/strategy/gener8tor-pitch.md
  - docs/strategy/competitive-landscape-2026.md
  - docs/strategy/investor-demo-narrative-script.md
  - docs/strategy/pitch-narrative-outline.md
  - docs/strategy/investor-read-pack.md
---

# Room playbook (v1)

**Purpose:** Win conversations with **discipline in what you don’t say**. **Investor path:** [investor-read-pack.md](./investor-read-pack.md) (this doc is item 2). Canonical thesis: [jarvis-hud-video-thesis.md](./jarvis-hud-video-thesis.md). Slides + demo arc: [gener8tor-pitch.md](./gener8tor-pitch.md).

**Technical:** Three fixed slots in the opener (idea, one frame, consequence); everything else waits for Q&A so the room doesn’t get a feature dump before stakes land.

**Plain English:** If you try to explain the whole product in the first minute, people stop listening. Lead with **three clear beats**, then **let them pull** the detail they care about.

---

## Rule for any room

Deliver **exactly three things** in the opening beat:

| Slot | What | Investor example |
|------|------|------------------|
| **1 · Core idea** | One sentence on the problem you own | AI agents can take real actions, but there’s **no authority layer** at execution. |
| **2 · Supporting frame** | **Pick one** analogy — never stack them | It’s like a **control plane**: you **separate** decision from execution. |
| **3 · Consequence** | Uncontrolled execution (then anchor) | Without that layer, **actions would be allowed to run immediately**—then *e.g.* email / code / API so it stays concrete without faking what’s on screen. |

Everything else—last mile, last reversible moment, evidence vs logs, proposal governance—is for **Q&A**, not the opener.

---

## One-line compress (investor)

> As AI systems start taking real actions, companies need a way to **control** and **prove** what actually happened.

---

## 30-second pitch (spoken)

Agents aren’t just generating text anymore—they’re **hitting tools**: email, repos, APIs. Most stacks don’t have a **clean authority moment** before those effects land. **Jarvis is the control plane:** propose, **human approve**, **then** execute—every run leaves **receipt and trace** so you can stand behind it. **Live beats slides**—I’ll show you.

*(Optional close:* one consequence line matching your demo.)

---

## Opener order (live or recorded)

1. **Capability** — real actions.  
2. **Consequence** — what would have happened without the layer.  
3. **Control** — Jarvis gates execution.  
4. **Proof** — HUD / receipt / trace.

`/demo` does this structurally: slides → transition → proof scroll. **Slides explain the missing layer; the HUD proves it exists.**

---

## Strong line — when to use it

**“Governs proposals, not runtimes.”**  
Do **not** lead with it. Use when someone boxes you as **agent platform**, **tool builder**, or **workflow system**—then it reframes the category.

---

## Objections — short answers

### “We already have governance.”

Most of that is **visibility** (catalogs, policy, logs). We **enforce authority at execution** and record **proof** of what was authorized and what ran—not the same thing.

### “Won’t this slow us down?”

Only at the **last irreversible moment**—where mistakes actually matter. Low-risk automation can stay wide; **high blast-radius** effects get the gate.

### “Why not [Microsoft / Salesforce / cloud agent suite]?”

They optimize **inside their runtime and ecosystem**. We care about the **boundary**: the same **propose → approve → execute → proof** spine **across** stacks you already run.

---

## Where the research lives (don’t dump it in the room)

Deeper frames (last mile, evidence vs logs, audience overlays) live in [competitive-landscape-2026.md](./competitive-landscape-2026.md) and prior strategy notes. **Bring one frame into the open; deploy the rest in objections.**

---

## Related

- [Investor demo — full narration script](./investor-demo-narrative-script.md)  
- [Investor demo — full runbook](../video/investor-demo-full-runbook.md)  
- [Pitch narrative outline (longer deck)](./pitch-narrative-outline.md)
