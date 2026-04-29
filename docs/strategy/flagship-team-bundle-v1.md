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

> **Investor line:** The flagship bundle is **not** one magic chatbot. It is **three specialist roles**: **Alfred** scopes the request, **Research** grounds it, **Creative** packages options. **Jarvis** is the control plane that decides **what actually gets approved, executed, and recorded.**

Use this page when someone asks **“What do you mean by agent team?”** For rehearsals, grep anchors, samples, and policy fields, see the [operator appendix](../architecture/flagship-proposal-shape-examples-v1.md) and [local verification §4b](../local-verification-openclaw-jarvis.md#4b-flagship-flow-1--alfred-intake--research-digest-full-bundle).

---

## What the bundle is

A named, repeatable **three-role roster** in the OpenClaw runtime, with **Jarvis** as the only gate for real effects. It is how we demo and sell **multiple agents as one governed system**: proposals cross the HUD; humans approve item by item where execution differs ([ADR-0005](../decisions/0005-agent-team-batch-v0-per-item-execute.md)).

Deep operating law — routing, handoffs, Jarvis kinds — stays in **[Agent team contract v1](./agent-team-contract-v1.md)**.

---

## The three roles

| Role | Does | Does not |
|------|------|----------|
| **Alfred** | Intake: triage, consent framing, **routing** to the right specialist | Own deep evidence or final creative picks |
| **Research** | Evidence, sources, uncertainty, memo-shaped **proposals** | Execute or “approve by confidence” |
| **Creative** | Copy and **variants**, channel-shaped **proposals** | Send, post, or publish without Jarvis |

**Operator** as a fourth SKU is **intentionally out of v1** until recurring queue/packaging pain justifies a contract-level spec.

---

## Why Jarvis is the gate

OpenClaw-side roles **only propose**. Execution-shaped work shows up as **proposals**; humans **approve** and **execute** in the HUD; every outcome that matters gets **receipt + trace**. That is [Thesis Lock](../decisions/0001-thesis-lock.md): autonomy in thinking, authority in action.

---

## Example flows (narrative)

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
