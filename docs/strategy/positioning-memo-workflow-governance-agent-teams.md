---
title: "Positioning memo — workflow governance for agent teams (market read)"
status: living-document
category: product-strategy
owner: Ben Tankersley
last_reviewed: 2026-05-10
related:
  - ./jarvis-hud-video-thesis.md
  - ../decisions/0001-thesis-lock.md
  - ./messaging-execution-integrity.md
  - ./competitive-landscape-2026.md
  - ./investor-read-pack.md
  - ./operating-assumptions.md
  - ./agent-team-v1.md
---

# Positioning memo — workflow governance for agent teams

**Use:** Pitch, website copy, investor notes — **3–5 claims** you can repeat without drift. **Not** a feature list; link out for depth.

**Frame:** Jarvis is a **workflow governance system for agent teams** — not a chatbot shell, not an “autonomous company” bet. The durable seam is **who may act**, **what was proposed vs authorized vs executed**, and **proof afterward**.

---

## Market read (why this window favors Jarvis)

Across coding assistants, research stacks, enterprise ops, and long-running agents, the winning shape is converging:

| Layer | Owns |
|--------|------|
| **Humans** | Goals, authority, final accountability |
| **Agents** | Throughput, drafts, exploration |
| **Systems** | Boundaries, policy, gates |
| **Artifacts** | Reviewable work — traces, receipts, diffs, notes |

**Workflow beats model.** Buyers are not standardizing on “the smartest model”; they are standardizing on **deterministic loops**, **bounded tasks**, **review surfaces**, **replayability**, **receipts**, and **governance**. That is structurally favorable to a control plane whose job is **legibility and integrity**, not raw autonomy.

**Long-running agents increase the need for Jarvis, not decrease it.** Persistence, delegation, and state imply more demand for **memory**, **traces**, **receipts**, **authority boundaries**, and **operator-visible posture** — not less.

**Initial wedges remain sound:** **agentic coding** and **deep research** are the most mature external demand; **policy-driven workflow surfaces** follow once the governed loop is trusted.

---

## Three product claims (memorize these)

1. **Governed throughput** — Agents do more work; **humans keep authority**. Propose ≠ execute; approvals and gates stay explicit ([Thesis Lock](../decisions/0001-thesis-lock.md)).

2. **Execution integrity** — **Proposals**, **approvals**, **execution boundaries**, and **receipts** are first-class: reconstructable traces, not vibes or log archaeology ([execution integrity messaging](./messaging-execution-integrity.md)).

3. **Persistent trust** — Long-running systems need **durable traces**, **replayable proof**, and **human-visible status** (denials, step-up, ingress posture) — the same vocabulary on dashboard and Activity ([operating assumptions](./operating-assumptions.md), HUD).

**Optional fourth (team story):** **Coordinator + specialists + Jarvis** — Alfred coordinates; builders/researchers/creative roles produce proposals; **Jarvis** is where authority, review, and proof attach ([agent team v1](./agent-team-v1.md)).

**Optional fifth (expansion, later):** **Reviewer / critic / auditor** roles map naturally onto multi-agent review — as **distinct governance roles**, not “more agents for show,” and only in ways that preserve Thesis Lock.

---

## What Jarvis is *not* (guardrails for copy)

- Not “catch up to fully autonomous agents.”
- Not replacing OpenClaw, IDEs, or enterprise suites — **governs the boundary** where those systems touch real effects.
- Not claiming the model is a trusted principal — **operators and policy** are.

---

## See also

- [Video thesis & Thesis Lock](./jarvis-hud-video-thesis.md)
- [Competitive landscape (2026)](./competitive-landscape-2026.md)
- [Investor read pack](./investor-read-pack.md) — fixed reading order for advisors
