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

Deep dive: **[Competitive landscape (2026)](./competitive-landscape-2026.md)**. Say these lines aloud when asked—not in the opener: category compare, hyperscaler wedge, buyer wedge, money model.

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

---

## How to deploy this page

**Do not preload** these lines in first pitch beats. Reach for them:

- **only when asked**
- **once**, clearly
- then **go back** to **`/demo`**, lifecycle, receipts — demonstration beats exposition

Same rule applies to the follow‑ons below.

---

## “Why wouldn’t AWS / OpenAI just build this?” (~15–20 sec)

They can build pieces—and some already do.

Their platforms optimize for running and scaling **workloads**. They are not inherently built to sit **in front** of execution as neutral **authority**.

Adding approval inside the same halo is doable. Designing a boundary every consequential action crosses—across vendors, agents, environments—that is a **different product shape**.

That is where we focus.

*(Keeps honesty: acknowledges capability upstream; distinguishes **embedding a feature** from **authority boundary product**—without punching hyperscalers.)*

---

## “Who buys first?” — wedge (~15–20 sec)

Teams already letting AI touch **real systems**—who **cannot** afford mistakes:

- builders running agents against code and infra
- operators wiring API-side workflows where effects ship
- founders where AI drafts **email, outbound, or publish**

When execution outweighs novelty, approval and proof stops being optional.

**Tighter:**

The first wedge is whoever learned **“just try it”** is no longer safe.

---

## “Where does the money come from?” (~15–20 sec)

Revenue aligns with **control over consequence**, not with **generation**.

If AI-mediated actions carry blast radius—orgs need systematic approve, reconstruct, prove **what ran**. That is the monetizable surface.

If they insist on metering language:

It maps naturally to governed action volume—not how many prompts you send—and to workflows requiring proveable approval.
