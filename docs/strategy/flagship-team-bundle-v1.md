---
title: "Flagship team bundle v1 — Alfred + Research + Creative"
status: living-document
category: strategy
owner: Ben Tankersley
related:
  - ./agent-team-contract-v1.md
  - ./investor-overview-bundle-room-script.md
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

> Three specialists think in parallel.  
> One authority decides what actually happens.

Without this structure, a single agent blends intake, reasoning, and output into one step — making it hard to verify, compare, or safely execute results.

Operators: [proposal shapes](../architecture/flagship-proposal-shape-examples-v1.md), [Flow 1 rehearsal](../local-verification-openclaw-jarvis.md#4b-flagship-flow-1--alfred-intake--research-digest-full-bundle). Specialists and handoffs: **[team contract](./agent-team-contract-v1.md)**.

---

## What each role does in the workflow

Each role owns a different part of the decision-making process. No single agent controls the full outcome.

| Role | Does | Does not |
|------|------|----------|
| **Alfred** | Intake: triage, consent framing, **routing** to the right specialist | Own deep evidence or final creative picks |
| **Research** | Evidence, sources, uncertainty, memo-shaped **proposals** | Execute or “approve by confidence” |
| **Creative** | Copy and **variants**, channel-shaped **proposals** | Send, post, or publish without Jarvis |

You can add **Operator** later if queue shaping becomes painful — it stays out of v1 on purpose.

This bundle is the simplest way to see Jarvis working as a system: **multiple agents thinking in parallel, one authority deciding what actually happens.**

---

## What is being sold?

A repeatable agent workflow that produces **real outputs under human approval**, not just generated content.

---

## Where this gets used

- **Evidence desk** — research → digest → approved notes  
- **Content pipeline** — variants → pick → publish  
- **Founder workflows** — idea → validate → package → send  
- **Demo / investor flows** — narrative → proof → controlled execution  

---

## Why Jarvis is the gate

OpenClaw-side roles **only propose**. Effects show up as **proposals**; humans **approve** then **execute** in the HUD; outcomes get **receipt + trace**. Multi-step work stays **per-item** approve/execute where it matters ([ADR-0005](../decisions/0005-agent-team-batch-v0-per-item-execute.md)). That lives under [Thesis Lock](../decisions/0001-thesis-lock.md): autonomy in thinking, authority in action.

---

## Example flows (narrative)

**Typical flow:**

1. Alfred defines the task and constraints.
2. Research gathers evidence (if needed).
3. Creative produces options.
4. One or more proposals land in Jarvis.
5. A human approves what should happen.
6. Execution runs separately, with receipts and traces.

**Situation examples:**

1. **Factual question** — Alfred frames the ask → Research produces evidence and a digest → each follow-on lands as its own proposal → approve and execute **per item** in Jarvis.
2. **Creative output** — Alfred locks intent → Creative ships **variants** → publish/capture stays **proposal-shaped** until you approve in Jarvis.
3. **Mixed** — Research and Creative both contribute; you never get one blurry “trust me” approval — proposals stay traceable; same gate throughout.

Submit **Flow 1** with real payloads: [local verification §4b](../local-verification-openclaw-jarvis.md#4b-flagship-flow-1--alfred-intake--research-digest-full-bundle).

---

## Positioning (simple)

- **Composable:** Evidence desk only, pipeline only, or full flagship — choke point stays Jarvis.
- **Legible:** One front door (Alfred), sharp split between facts and copy — no invisible execution out of chat.
- **Demo-safe:** Runtime teamwork, HUD proof — not a blended bot pretending it already shipped.

---

## Demo alignment

Point [the live investor walkthrough](/demo) at:

- Alfred intake → shows as a proposal you can inspect.
- Research digest → second proposal, paired story (creative or variant optional in your script).
- **Approve** visibly separate from **Execute** — Thesis Lock intact.
- Receipt / trace surfaced so the outcome is provable after execute.

That list matches Flow 1 + flagship rehearsal; rehearsal commands live in §4b above.

---

## Where the rest lives

| Need | Doc |
|------|-----|
| Grep anchors, `ALLOWED_KINDS`, sample files, `agent` / `builder` / Forge | [Flagship proposal shapes (appendix)](../architecture/flagship-proposal-shape-examples-v1.md) |
| Ordered gateway → HUD proof | [Local verification](../local-verification-openclaw-jarvis.md) |
| “Ship clips” exit bar | [Operator sprint](../setup/openclaw-jarvis-operator-sprint.md) |
| Specialists in depth | [Research v1](./research-agent-v1.md) · [Creative v1](./creative-agent-v1.md) |
| Rehearsal drills | [Research batch workflow](./research-batch-workflow-v1.md) · [Creative batch workflow](./creative-batch-workflow-v1.md) |

This is the simplest way to see the system end-to-end: **agents produce options; Jarvis turns one of them into a real, recorded outcome.**
