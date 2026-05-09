---
title: "Messaging — execution integrity (compressed)"
status: living-document
category: product-strategy
owner: Ben Tankersley
last_reviewed: 2026-05-09
related:
  - ./jarvis-hud-video-thesis.md
  - ./operating-assumptions.md
  - ../setup/phase1-freeze-checklist.md
  - ../decisions/0001-thesis-lock.md
  - ./investor-read-pack.md
---

# Messaging — execution integrity (compressed)

**Purpose:** One-page **investor**, **operator**, and **tagline** wording aligned with [operating assumptions](./operating-assumptions.md) (contract / narrative / probe) and [video thesis](./jarvis-hud-video-thesis.md). Use for decks, intros, and operator onboarding—**do not** soften into brochure fog; revise here when doctrine changes.

**Canon:** [Thesis Lock](../decisions/0001-thesis-lock.md) · [Phase 1 freeze checklist](../setup/phase1-freeze-checklist.md)

---

## One-line tagline

**Execution integrity for agentic actions: bounded effects, explicit authority, provable traces.**

---

## Investor (3 lines)

1. Jarvis is an **execution integrity layer** for AI systems: consequential actions stay **bounded, reviewable, and provable** under real operating conditions—not demo conditions.
2. **Agents propose**; **humans and policy** hold authority for effects—**approval is not execution**, and the **model is not the trusted principal**.
3. Every governed action leaves **receipts you can point to**—artifacts, logs, and traces that support audit and replay, not “trust me.”

---

## Operator (3 lines)

1. Jarvis is only “working” when the **documented contract**, the **actual machine setup**, and the **probe results** all agree—**no folklore required**.
2. If **runtime behavior, docs, and onboarding lore** diverge, you have a **trust-boundary problem**.
3. **Probes** (`pnpm machine-wired`, `pnpm auth-posture` when auth matters) **falsify** “does this host match the contract?”; **ingress secrets ≠ human identity**—design serious mode accordingly.

---

## Optional fourth line (investor, when there is room)

The product goal is **calm operation**: **clear boundaries** and **predictable behavior** when teams are tired or systems are messy.

---

## Where this connects in-repo

- **Category + Thesis Lock story:** [jarvis-hud-video-thesis.md](./jarvis-hud-video-thesis.md)
- **Host reality + triad:** [operating-assumptions.md](./operating-assumptions.md)
- **Investor path:** [investor-read-pack.md](./investor-read-pack.md)
