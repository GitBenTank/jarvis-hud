---
title: "Investor landscape — answer card (room-ready)"
status: living-document
category: strategy
owner: Ben Tankersley
related:
  - ./competitive-landscape-2026.md
  - ./investor-overview-bundle-room-script.md
  - ../decisions/0001-thesis-lock.md
---

# Investor landscape — answer card (room-ready)

Deep dive: **[Competitive landscape (2026)](./competitive-landscape-2026.md)**. This page is **what to say aloud** when someone asks who else “does governance” or compares you to incumbent stacks.

---

## First answer (truthful)

There are tools in this space—but they **do not solve this** in the same way.

That signals:

- you understand the landscape  
- you are not pretending to be alone  
- you **name the gap**, not dodge it  

---

## What exists (three buckets — rough map)

Nothing here is exhaustive; use it so the room trusts you’ve thought about categories.

### 1) AI governance / risk / compliance stacks

Typically: model lifecycle, policy workflows, dashboards, audits.

They **manage AI at organization and lifecycle level** — not the single moment where an outbound action crosses into the world.

### 2) Agent platforms and orchestration

Typically: workspace agents, multi-agent workflows, tooling, permissions integration.

They **coordinate how agents run and connect**. Execution often flows through the platform’s own rails; “approval” can be bundled into the flow—not a clean boundary strangers can intercept.

### 3) Security and guardrail tooling at runtime

Typically: monitors, gates, forbidden actions.

They **observe and constrain** — useful. They rarely give you **human-owned approval → discrete execute → receipt** as the invariant across arbitrary tools.

---

## Shared gap

Most offerings lean toward **policy**, **workflow/orchestration**, or **monitoring**.

They rarely hold this entire chain cleanly as first-class mechanics:

**propose → approval → execution → receipt → proof**

---

## How you describe Jarvis (clean)

Most categories either manage policy, orchestrate agents, or watch what ran after it happened.

Jarvis sits at the transition where something **might** become **real**:

> It controls whether that transition happens—and records what ran.

Say it plainly:

“What’s missing elsewhere is something that treats **approval as the boundary actions must cross**—not a checkbox tucked inside somebody else’s orchestration loop.”

**If they drill in:**

“In many stacks approval is threaded through the workflow. In Jarvis, **approval is the gate** workflow has to pass. That produces real control—and traceability—because approve is not buried inside model output.”

---

## Short category line (when they ask ‘what box is this?’)

**Control plane for AI actions** — **not for generating them—for deciding whether they happen** and proving what ran.

---

## One-liners (pick one)

There are platforms that manage AI lifecycle and governance. Few **own the choke point between proposal and consequence** end-to-end the way Thesis Lock describes.

—

There are tools that manage AI. Few **control the moment where AI-mediated actions actually become irreversible.**

---

## What you are not arguing

You are **not claiming** nobody thought about governance, agents, or safety.

Your bet is sharper: **execution authority as its own layer** — between thinking and irrevocable outcome — with receipts that survive scrutiny.
