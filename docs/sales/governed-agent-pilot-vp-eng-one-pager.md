---
title: "Governed Agent Pilot — VP Eng one-pager"
status: draft
category: sales
audience: "VP Engineering / Head of Platform"
owner: Ben Tankersley
related:
  - ../strategy/jarvis-hud-video-thesis.md
  - ../verification/pilot-charter-template.md
  - ../verification/pilot-proof-bundle-checklist.md
  - ../governance/enterprise-readiness-snapshot-2026-05-09.md
---

# Governed Agent Pilot

**For:** VP Engineering / Head of Platform  
**What it is:** A **time-boxed pilot** that puts **one real agent workflow** behind an explicit **human approval and execution boundary**—with **receipts and traces** your team can inspect.

---

## The problem (in one sentence)

Teams are shipping agents faster than they can answer: **who is allowed to act, on what, with what proof**—especially when something goes wrong and someone asks *“show me the decision chain.”*

---

## The offer

**2-week Governed Agent Pilot**

We stand up **Jarvis HUD** around **one** workflow you choose (internal tool, research agent, ops helper—your call). Agents still **propose**; humans **approve**; execution happens only when **policy and session posture** allow it. Every meaningful step produces **artifacts + logs** you can hand to security or keep for your own postmortems.

This is **not** “buy AI governance in a box.” It is **prove the control plane on your infrastructure** for a workflow you already care about.

---

## What you get (fixed deliverables)

| Deliverable | Why it matters |
|-------------|----------------|
| **Working governed path** | Propose → approve → execute → **receipt** → **trace** on the stack you agree up front |
| **Pilot charter** (filled from template) | Written scope, auth posture, who may approve/execute—no vague “we turned something on” |
| **Proof bundle** | Evidence your eng + security leads can replay: config posture, policy denials where relevant, export/trace surfaces aligned to what the server actually recorded |
| **Buyer-facing readout** | Short narrative: what was in scope, what was exercised, what is **honestly not** enterprise-complete yet (so diligence gets facts, not vibes) |

Templates and checklists already exist in-repo: [pilot charter](../verification/pilot-charter-template.md), [proof bundle checklist](../verification/pilot-proof-bundle-checklist.md). The pilot **fills** them for **your** run.

---

## What is explicitly out of scope (say it up front)

- Org-wide IdP / SSO program, fleet HA, retention productization, SOC2 narrative as “done”
- Unlimited new integrations or “replace your ITSM”
- Pretending the stack is **enterprise-complete**; see [enterprise readiness snapshot](../governance/enterprise-readiness-snapshot-2026-05-09.md) for an honest gap list—we sell **boundary proof** and **sequencing**, not fantasy completeness

That clarity is a feature for VP Eng: you can sponsor a pilot **without** signing up for a multi-quarter platform bet.

---

## Why VP Eng first

You can **evaluate the technical boundary** yourself, run the pilot with a small team, and—when it makes sense—**sponsor** the right intro to security as “here is inspectable behavior,” not “here is a vendor deck.”

**Suggested audience order after you:** innovation lead with engineering backing → CISO / security architect **once there is active interest and artifacts to show**.

---

## Thesis (one line)

**Agents can propose anything. Execution requires explicit human approval. Every action produces receipts. The model is not a trusted principal.**  
([Thesis Lock](../strategy/jarvis-hud-video-thesis.md#thesis-lock-do-not-drift) — non-negotiable for this pilot.)

---

## Call to action

**Fit call (20 minutes):** confirm one workflow, environment shape, and whether a **2-week governed pilot** is the right next step.  
**Ask:** intro to whoever owns **internal agents + production risk** on your side if that is not you.

---

*Internal Jarvis HUD repo — customize name, pricing, and calendar link before sending externally.*
