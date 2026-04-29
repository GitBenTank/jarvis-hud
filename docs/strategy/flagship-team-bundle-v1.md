---
title: "Flagship team bundle v1 — Alfred + Research + Creative"
status: living-document
category: strategy
owner: Ben Tankersley
related:
  - ./agent-team-contract-v1.md
  - ../architecture/flagship-proposal-shape-examples-v1.md
  - ../decisions/0001-thesis-lock.md
  - ../decisions/0005-agent-team-batch-v0-per-item-execute.md
  - ../local-verification-openclaw-jarvis.md
---

# Flagship team bundle v1 — Alfred + Research + Creative

This is the default team you get when you use Jarvis with agents.

It turns a single request into a structured, governed workflow: **intake → evidence → variants → proposal → approval → execution → receipt**.

Instead of one model doing everything, the work is split across specialists:

- **Alfred** handles intake and coordination.
- **Research** grounds decisions in evidence.
- **Creative** produces variants and packaging.

Every output still goes through Jarvis for approval and execution.

This is not a loose collection of agents. It is a **repeatable system** for producing real-world outcomes with traceability.

Without this structure, a single agent blends intake, reasoning, and output into one step — making it hard to verify, compare, or safely execute results.

For operator rehearsal (grep anchors, sample JSON, policy fields), see the [proposal shapes appendix](../architecture/flagship-proposal-shape-examples-v1.md) and [local verification §4b](../local-verification-openclaw-jarvis.md#4b-flagship-flow-1--alfred-intake--research-digest-full-bundle). Routing, handoffs, and Jarvis kinds: **[Agent team contract v1](./agent-team-contract-v1.md)**.

---

## What each role does in the workflow

Each role owns a different part of the decision-making process. No single agent controls the full outcome.

| Role | Does | Does not |
|------|------|----------|
| **Alfred** | Intake: triage, consent framing, **routing** to the right specialist | Own deep evidence or final creative picks |
| **Research** | Evidence, sources, uncertainty, memo-shaped **proposals** | Execute or “approve by confidence” |
| **Creative** | Copy and **variants**, channel-shaped **proposals** | Send, post, or publish without Jarvis |

**Operator** as a fourth SKU is **intentionally out of v1** until recurring queue/packaging pain justifies a contract-level spec.

This bundle is the simplest way to see Jarvis working as a system: **multiple agents thinking in parallel, one authority deciding what actually happens.**

---

## What is being sold?

**What is being sold?**  
A repeatable agent workflow that produces **real outputs under human approval**, not just generated content.

---

## Why Jarvis is the gate

OpenClaw-side roles **only propose**. Execution-shaped work shows up as **proposals**; humans **approve** and **execute** in the HUD; every outcome that matters gets **receipt + trace**. Multi-item work still uses **per-item** approve/execute where effects differ ([ADR-0005](../decisions/0005-agent-team-batch-v0-per-item-execute.md)). That is [Thesis Lock](../decisions/0001-thesis-lock.md): autonomy in thinking, authority in action.

---

## Example flows (narrative)

**Typical flow:**

1. Alfred defines the task and constraints.
2. Research gathers evidence (if needed).
3. Creative produces options.
4. One or more proposals are submitted to Jarvis.
5. A human approves what should happen.
6. Execution runs separately, with receipts and traces.

**Situation examples:**

1. **Factual question** — Alfred frames the ask → Research produces evidence and a digest → each follow-on effect is its own proposal → you approve and execute **per item** in Jarvis.
2. **Creative output** — Alfred confirms intent and constraints → Creative offers **variants** → publish or capture flows still land as **proposals** you control in Jarvis.
3. **Mixed** — Research and Creative may both contribute; **authority does not merge** into one vague “do it all” approval — traceable proposals, same gate.

To run **Flow 1** with real JSON and commands, use [local verification §4b](../local-verification-openclaw-jarvis.md#4b-flagship-flow-1--alfred-intake--research-digest-full-bundle).

---

## Positioning (simple)

- **Composable:** Sell an **evidence desk** (Research + Jarvis), a **content pipeline** (Creative + Jarvis), or the **full flagship** — specialists stack; the choke point stays Jarvis.
- **Legible:** One front door (Alfred), clear ownership for evidence vs. messaging, no silent execution from chat.
- **Demo-safe:** The story is “team in the runtime, **proof in the HUD**,” not a single blended bot.

---

## Where the rest lives

| Need | Doc |
|------|-----|
| Grep anchors, `ALLOWED_KINDS`, sample files, `agent` / `builder` / Forge | [Flagship proposal shapes (appendix)](../architecture/flagship-proposal-shape-examples-v1.md) |
| Ordered gateway → HUD proof | [Local verification](../local-verification-openclaw-jarvis.md) |
| “Ship clips” exit bar | [Operator sprint](../setup/openclaw-jarvis-operator-sprint.md) |
| Specialists in depth | [Research v1](./research-agent-v1.md) · [Creative v1](./creative-agent-v1.md) |
| Rehearsal drills | [Research batch workflow](./research-batch-workflow-v1.md) · [Creative batch workflow](./creative-batch-workflow-v1.md) |
