---
title: "Investor live proof map — trigger, line, pixel"
status: living-document
category: strategy
owner: Ben Tankersley
related:
  - ./investor-read-pack.md
  - ../interview-prep-jarvis.md
  - ../trust-boundary.md
  - ./jarvis-hud-video-thesis.md
---

# Investor live proof map

**What this is:** A **one-page** map: investor **trigger** → **one line** to say → **what to show on screen** → **where proof lives** in docs/code → a **burn line** to land the beat. Use it **~5 minutes before** a pitch or live demo when you will not remember paragraphs.

**Rule in the room:** Remember **trigger**, **one spoken line**, **one screen** — not the prose below.

---

## 1. Bypass / rogue AI

| | |
|---|---|
| **Trigger** | “What stops it from bypassing?” / “Couldn’t it just send the email anyway?” |
| **Say** | “We don’t rely on behavior — we control authority.” |
| **Show** | Approval gate; execution is not the same moment as proposal — **Activity** queue → Approve → Execute. |
| **Proof** | [Trust boundary](../trust-boundary.md) (what Jarvis does and does not guarantee). Policy gate and allowlists: [`src/lib/policy.ts`](../../src/lib/policy.ts). |

**Burn line:** “It doesn’t have the keys.”

**Steve Jobs line:** *We don’t bet on the assistant being nice — we bet on it not having the keys.*

---

## 2. Skip Jarvis / posture

| | |
|---|---|
| **Trigger** | “Why wouldn’t they just skip this?” / “This depends on configuring things correctly.” |
| **Say** | “Then they lose proof, policy, and traceability on the paths that matter.” |
| **Show** | **Receipt** + **trace** (or Activity line showing proposal → receipt linked). |
| **Proof** | [Operator checklist](../setup/openclaw-jarvis-operator-checklist.md); [interview prep](../interview-prep-jarvis.md) (deployment realism + runtime section). |

**Burn line:** “You can skip governance — you can’t fake proof.”

**Steve Jobs line:** *Security was never “the app made them do the right thing” — it’s whether the org puts the lock on the door.*

---

## 3. Category (framework vs control plane)

| | |
|---|---|
| **Trigger** | “Why isn’t this just a feature of the agent framework?” |
| **Say** | “Capability and authority are different layers.” |
| **Show** | Proposal in queue vs **separate** Execute step (approve ≠ execute visibly). |
| **Proof** | [Thesis Lock (ADR)](../decisions/0001-thesis-lock.md); [OpenClaw + Jarvis system overview](../architecture/jarvis-openclaw-system-overview.md). |

**Burn line:** “If it lives only in the framework, it walks when the stack changes.”

**Steve Jobs line:** *iTunes doesn’t replace musicians — it’s the rules and the ledger for what ships.*

---

## 4. Moat (big labs / “they’ll add a button”)

| | |
|---|---|
| **Trigger** | “OpenAI / Anthropic could build this.” |
| **Say** | “UI isn’t the moat — being the system of record for execution is.” |
| **Show** | Same **receipt + trace** tied to a real execution outcome (e.g. governed send or `system.note`). |
| **Proof** | [Control plane architecture](../architecture/control-plane.md); [competitive landscape](./competitive-landscape-2026.md) (govern proposals, not runtimes). |

**Burn line:** “Anyone can add a button — not everyone owns the receipt.”

**Steve Jobs line:** *Anyone can put a “Buy” on the website — not everyone gets a receipt the accountant trusts.*

---

## 5. Why now

| | |
|---|---|
| **Trigger** | “Why now?” / “Why didn’t this exist two years ago?” |
| **Say** | “AI moved from talking to acting.” |
| **Show** | **Live path:** proposal → approval → execution → **real** side effect (e.g. email / note) with trace. |
| **Proof** | [Video thesis](./jarvis-hud-video-thesis.md); [demo → production phases](../roadmap/0002-demo-safety-production-phases.md). |

**Burn line:** “We didn’t need this when AI talked. We need it now that it acts.”

**Steve Jobs line:** *When the phone only made calls, you didn’t need a notary. When it moves money, you do.*

---

## Quick HUD surfaces (default names)

| Idea | Where to point the camera / screen |
|------|--------------------------------------|
| Queue / approval | **`/activity`** (pending proposals, approve/reject) |
| Execution + receipt + trace | Proposal detail, receipt row, **trace** view as your demo script uses |

Exact labels can vary by build; keep the **sequence** consistent: **propose → approve → execute → receipt → trace.**

---

## Related

- [Investor read pack](./investor-read-pack.md) — control-plane story in ~15 minutes (canonical order)  
- [Interview prep](../interview-prep-jarvis.md) — full Q&A including **Runtime bypass, production packaging, and risk tiers**
