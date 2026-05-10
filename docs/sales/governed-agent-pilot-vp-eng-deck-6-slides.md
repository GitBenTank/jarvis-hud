---
title: "Governed Agent Pilot — 6-slide deck (VP Eng outline)"
status: draft
category: sales
audience: "VP Engineering / Head of Platform"
owner: Ben Tankersley
related:
  - ./governed-agent-pilot-vp-eng-one-pager.md
  - ../strategy/jarvis-hud-video-thesis.md
  - ../verification/pilot-proof-bundle-checklist.md
---

# Six-slide deck — outline & copy

**Use:** Build in Keynote/Google Slides/Deckset; this file is **source copy + speaker notes**.  
**Runtime:** ~12–15 minutes live; ~8 minutes if tight.

---

## Slide 1 — Title

**Headline:** Governed Agent Pilot  
**Sub:** One workflow · Explicit approval · Inspectable receipts  
**Footer:** [Your name] · [Company] · [Date]

**Speaker notes:**  
“We’re not pitching generic AI governance. We’re offering a **time-boxed pilot** that proves a **human execution boundary** on a workflow you already care about.”

---

## Slide 2 — The gap VP Eng feels

**Title:** Agents moved faster than the control plane  
**Bullets:**

- Teams ship copilots and automations; **production risk** is now “model + tools + data.”
- Security asks: **who approved this action?** Engineering asks: **where’s the receipt?**
- Most stacks have **logging**; fewer have a **first-class approve → execute** boundary with **artifacts**.

**Speaker notes:**  
“VP Eng is often stuck between ‘move fast’ and ‘don’t blow up prod.’ This pilot gives you **language and artifacts** both sides can use—not a permanent platform commitment.”

---

## Slide 3 — What Jarvis does here (boundary, not buzzwords)

**Title:** Propose → Approve → Execute → Receipt → Trace  
**Bullets:**

- **Proposals** are structured; humans **explicitly approve** before governed execution.
- **Policy + session posture** gate execution—not vibes.
- **Receipts + traces** are the product; the model is **not** a trusted principal.
- Aligns to **[Thesis Lock](../strategy/jarvis-hud-video-thesis.md#thesis-lock-do-not-drift)** (one sentence on slide if desired).

**Speaker notes:**  
“If this sounds like change management as code, good—that’s the intent. The **artifact** is what you show security later.”

---

## Slide 4 — The 2-week offer (fixed box)

**Title:** Governed Agent Pilot — scope you can sign  
**Table or bullets:**

| In | Out |
|----|-----|
| One agreed workflow | Org-wide IdP program |
| One environment shape | “Replace ITSM” |
| Pilot charter + proof bundle | SOC2 as “done” |
| Short security/engineering readout | Unlimited integrations |

**Speaker notes:**  
“We document what’s **honestly not** enterprise-complete—see readiness snapshot—so diligence gets **facts**, not a roadmap fantasy.”

---

## Slide 5 — What you have at the end

**Title:** Deliverables your team can inspect  
**Bullets:**

- Runnable **governed path** on the pilot environment  
- **Charter** — who may approve/execute; auth posture; ingress assumptions  
- **Proof bundle** — replayable evidence, policy/denial paths where relevant, exports aligned to server truth ([checklist](../verification/pilot-proof-bundle-checklist.md))  
- **Readout** — 1–2 pages for internal sponsor + optional CISO intro

**Speaker notes:**  
“This is the slide that lets you forward internally: **here is what we can touch.**”

---

## Slide 6 — Next step

**Title:** 20-minute fit → charter → pilot  
**Bullets:**

- Align on **workflow + owner + risk tolerance**  
- Pick **success criteria** (e.g. “one governed execute with receipt + trace in your audit story”)  
- **Book:** [calendar] · **Contact:** [email]

**Speaker notes:**  
“VP Eng first is intentional: you can **evaluate the boundary**, then pull security in with **artifacts**, not procurement gravity on day one.”

---

## Optional backup slide (not counted in six)

**Title:** Honest enterprise posture  
**Content:** Point to [enterprise readiness snapshot](../governance/enterprise-readiness-snapshot-2026-05-09.md): **gap list + what closed in pilot**. Use only if they ask “how is this different from buying ServiceNow + a chatbot?”
