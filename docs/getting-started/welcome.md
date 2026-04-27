# Welcome to Jarvis

**Jarvis** is a **control plane for governed AI work**. Agents and tools can **propose** actions; **you** decide what gets approved and executed. Every real outcome produces **receipts** and a **trace** you can audit—so “the model said so” is never treated as proof.

You do **not** need to run anything locally to understand the idea. Use **[About](/about)** in the app for a short surface tour, or **[Demo](/demo)** for the guided story.

**Operators:** the blessed local flow is **[Local stack startup](../setup/local-stack-startup.md)** — **Terminal 1** `pnpm dev` (**http://127.0.0.1:3000**), **Terminal 2** `OPENCLAW_ROOT=~/Documents/openclaw-runtime pnpm openclaw:dev`, then **`pnpm local:stack:doctor`**. Optional: **`pnpm dev:stack`** prints the same commands with env checks.

---

## In one minute

| What you might worry about | What Jarvis does |
|----------------------------|------------------|
| Models acting on their own | Execution waits on **human approval** (and explicit execute). |
| No paper trail | **Receipts + traces** for governed actions. |
| Fragile integrations | A clear **boundary**: capability layers propose; Jarvis holds **authority**. |

The formal rules are captured in **[Thesis Lock](../decisions/0001-thesis-lock.md)** and the **[video thesis](../strategy/jarvis-hud-video-thesis.md)**—read those when you want the full spec, not the elevator pitch.

---

## Pick your path

| If you are… | Start here |
|-------------|------------|
| **New to the product** | This page, then [About](/about) · [Demo](/demo) |
| **Investor or advisor** | **[Investor read pack](/docs/tati)** (same as [markdown](../strategy/investor-read-pack.md)) — then [Demo](/demo). Optional: [90s proof](../video/90s-proof-demo.md) if time is tight. |
| **Technical diligence** | [System overview](../architecture/jarvis-openclaw-system-overview.md) · [Security model](../architecture/security-model.md) · [Thesis Lock ADR](../decisions/0001-thesis-lock.md) |
| **Building or operating the stack** | [Local stack startup](../setup/local-stack-startup.md) · [Operator checklist](../setup/openclaw-jarvis-operator-checklist.md) · [Documentation hub](../README.md#operators--start-here) |

---

## Glossary (one line each)

- **Proposal** — A structured request to do work; it lands in Jarvis for review, not auto-run.
- **Ingress** — The signed channel by which external tools submit proposals into Jarvis (implementation detail when you’re not running the stack).
- **OpenClaw** — An example **capability** stack (agents, skills, Control UI) that pairs with Jarvis; Jarvis stays the seat of **approval and execution**.

When you’re ready for setup jargon, the **[documentation hub](../README.md)** lists every doc by role.
