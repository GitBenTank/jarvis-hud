---
title: "Competitive landscape & positioning (2026)"
status: living-document
version: 1.5
owner: Ben Tankersley
created: 2026-04-11
category: product-strategy
related:
  - docs/strategy/jarvis-hud-video-thesis.md
  - docs/strategy/positioning-secure-ai-code-execution.md
  - docs/decisions/0001-thesis-lock.md
  - ./investor-landscape-answer-card.md
---

# Competitive landscape and positioning (2026)

## Executive summary

The market is no longer debating whether **agent governance** matters. Enterprise suites, cloud agent platforms, and execution startups are all moving toward approvals, observability, and lifecycle control. That validates the category Jarvis HUD targets. It also raises the risk that **language becomes generic**: everyone says “governance,” and buyers cannot tell architectures apart.

Jarvis should **not** compete as “another agent platform.” It competes as the **approval and proof layer**: explicit authority boundaries, separated approval and execution, and **reconstructable receipts and traces**—not policy theater or log dumps.

**Jarvis governs proposals, not runtimes.** The control plane is where authority and proof live; agent frameworks and gateways remain replaceable capability layers.

**Jarvis does not infer trust from a runtime—it enforces it at the boundary.**

**Who loses if Jarvis wins:** teams that rely on **logs or policy toggles** instead of **explicit approval** and **reconstructable proof** of what was authorized and what ran.

**Canonical product narrative** remains [jarvis-hud-video-thesis.md](./jarvis-hud-video-thesis.md) (Thesis Lock). This memo is outward-facing positioning and competitive context; it must not contradict Thesis Lock.

---

## Three waves of competition (not one market)

### 1. Enterprise control planes (e.g. Microsoft, Salesforce)

- **Strength:** Distribution, budget, and bundled “trusted agent” narratives.
- **Pattern:** Centralized governance, discovery, orchestration, monitoring across vendor ecosystems.
- **Weakness (often):** Approval reads as **policy or workflow**, not explicit **operator authority**. “Audit” can mean **logs**, not **reconstructable proof** of what was authorized and what ran.

### 2. Agent platforms and clouds (e.g. LangChain ecosystem, Google Vertex-style stacks)

- **Strength:** Builders adopt them for capability; controls accrete over time.
- **Pattern:** Start as “build and run agents,” add approvals and observability later.
- **Weakness (often):** Governance is **bolted on**. Approval and execution boundaries **blur** (approve implicitly triggers work, or one toggle stands in for real separation).

### 3. Execution and orchestration startups

- **Strength:** Ship “do things” fast; win on workflow and integrations.
- **Pattern:** Add “just enough” compliance for enterprise buyers.
- **Weakness (often):** **Trust models are thin**; retrofitting real authority boundaries and durable proof after the fact is **hard**.

---

## Where Jarvis HUD is differentiated (and must stay there)

These are **architectural** claims, not feature checklists.

| Theme | Jarvis stance | Why it matters |
|--------|----------------|----------------|
| **Authority** | Approval is a **first-class system**, not a setting. Nothing sensitive runs without passing the control plane’s gate. | Competitors often offer “require approval”; fewer enforce **approve ≠ execute** as a structural invariant. |
| **Proof** | **Receipts and traces**, not “we logged it.” Attributable outcomes: trace ID, action, actor, result, replay path. | Buyers equate “audit” with logs; Jarvis sells **evidence**. |
| **Thesis Lock** | **Propose → approve → execute → receipt → trace.** The model is not a trusted principal. | Rare as a **product** story, not a slide. |
| **Runtime** | **Agent-agnostic — governs proposals, not runtimes.** Same authority boundary for different stacks and tools. | Platforms optimize for **their** stack; Jarvis optimizes for **governed action** and proof across stacks. |
| **Operator legibility** | **Mismatch-only** signals: what is wrong, where truth lives, what to fix—without pretending the UI heals the system. | Control-plane UX, not dashboard density. |

---

## Positioning lines (use consistently)

**Primary (non-technical):**  
Jarvis is the **approval and proof layer** for AI-driven action.

**Alternative (outcome):**  
Jarvis is the system that **gates what AI is allowed to do**—and **proves what happened** after human authorization.

**Technical:**  
Jarvis HUD is a **control plane** that **enforces authority boundaries** and produces **verifiable execution traces** for agent systems.

**Avoid** leading with: “AI platform,” “agent builder,” “workflow automation” as the headline—they drag Jarvis into commodity framing.

**Anti-claim guardrail (edits to this doc and external copy):**

| Avoid (generic) | Say instead (Jarvis) |
|-----------------|----------------------|
| “Audit logs,” “governance features,” “AI platform” as the headline | **Approval before action**; **receipt + trace as proof**; **governs proposals, not runtimes** |

### Terminology (consistency)

- **Decision** — system or policy outcome (e.g. allow/deny at the gate); do not blur with “the model decided.”
- **Approval** — operator action: explicit human authorization to execute (or deny).
- **Execution** — system action that occurs only after approval passes the authority boundary (or after an explicit deny / block is recorded as proof).
- **Pairing:** **Jarvis decides** what may proceed under policy; the **operator approves** execution at the authority boundary. Keep this pairing in UI and docs.

---

## The real risk

Not “nobody wants governance.” The risk is **everyone claims it** and Jarvis **sounds interchangeable**.

**Mitigation:** **Proof over pitch.** Do not claim a capability without a **visible artifact**: blocked execution path, approval queue, receipt line, trace reconstruction, integration readiness facts.

---

## Early ICP (hypothesis)

Strong early fit:

- Teams **afraid of agents doing the wrong thing** in production-adjacent environments.
- **Platform / internal tooling** teams wiring agents into real systems.
- Organizations under **compliance or audit** pressure (need attributable outcomes, not vibes).
- Teams already running agents who **do not yet trust** end-to-end execution.

---

## Strategic next steps (non-exhaustive)

1. **Demos that are proof-first:** blocked execution → approve → explicit execute → receipt → trace. Beats slides.
2. **Narrative discipline:** repeat **authority, approval, proof**; avoid drifting into generic “AI platform” language.
3. **Sharpen wedge vs incumbents:** breadth vs **verifiable automation** with a narrow, strong story.

---

## Related documents

- [Video thesis / Thesis Lock](./jarvis-hud-video-thesis.md)
- [Positioning: secure AI code execution](./positioning-secure-ai-code-execution.md)
- [ADR 0001: Thesis Lock](../decisions/0001-thesis-lock.md)
- [Pitch narrative outline (deck)](./pitch-narrative-outline.md)
