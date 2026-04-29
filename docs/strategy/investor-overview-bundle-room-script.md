---
title: "Investor room script — Overview + Bundle + demo"
status: living-document
category: strategy
owner: Ben Tankersley
related:
  - ../architecture/jarvis-openclaw-system-overview.md
  - ./flagship-team-bundle-v1.md
  - ./investor-landscape-answer-card.md
  - ../video/investor-demo-full-runbook.md
  - ../../DEMO.md
---

# Investor room script — Overview + Bundle + demo

**Use when:** Face-to-face or video where you align **architecture** ([system overview](../architecture/jarvis-openclaw-system-overview.md)), **product bundle** ([flagship bundle](./flagship-team-bundle-v1.md)), and **[live `/demo`](/demo)** in one coherent pass.

The full cinematic `/demo` read-through stays in [investor demo narrative script](./investor-demo-narrative-script.md); this doc is **tight opener + walkthrough beats** only.

---

## 30-second opener

Say slowly, cleanly:

We’re starting to see agents used in real workflows — sending emails, modifying code, triggering APIs.

The problem is most systems let the model both decide and act.

That creates risk — there’s no clear approval, no separation of execution, and no reliable audit trail.

Jarvis introduces a boundary.

Agents can propose what should happen.  
A human approves it.  
Execution runs separately.  
And every outcome produces a receipt and trace.

**Transition:**

Let me show you what that actually looks like.

---

## Three-minute walkthrough

### Set the frame (15–20 s)

This system splits into two layers.

OpenClaw is the **capability** layer — it thinks, drafts, and proposes actions.

Jarvis is the **authority** layer — it decides what actually happens.

### Introduce the bundle (20–30 s)

Instead of one agent doing everything, we use a small team of specialists.

Alfred handles intake and coordination.  
Research grounds decisions in evidence.  
Creative produces options and packaging.

They think in parallel — nothing actually happens until it goes through Jarvis.

### Walk live — `/demo`

**So here’s what happens in practice.**

**1 — Proposal.** An agent proposes an action → show Alfred / Research proposal.

**2 — Jarvis receives it.** Jarvis records it as pending → show queue / approval UI.

**3 — Human approval.** Now a human decides whether this should actually happen → pause (important).

**4 — Execution.** Execution runs as a separate step — not tied to raw model output → trigger execute.

**5 — Receipt + trace.** Every action produces a receipt and trace → show artifact / timeline.

Boot and prompts: [investor demo full runbook](../video/investor-demo-full-runbook.md); Flow 1 details: flagship bundle (**Demo alignment**).

### Close (20–30 s)

Instead of an agent acting directly in the world, you get proposals → approval → execution → receipt → trace.

That’s the difference between a system that generates output and a system you can actually trust.

**Final ten seconds:**

Agents can generate options. Jarvis turns one of them into a real, recorded outcome.

---

## If she pushes back

**Why not just trust the agent?**

Execution is where mistakes become real. We separate decision from action so there’s always clear approval and a trace.

**Is this just logging?**

No — logging happens after the fact. This controls whether execution happens at all.

**Where does value show up?**

Anywhere agents touch real systems — content, dev workflows, operations. You’re controlling and proving actions, not hoping the model behaved.
