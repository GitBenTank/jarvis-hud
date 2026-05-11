---
title: "Operator Media Engine v1 — governed content from real activity"
status: living-document
category: product-strategy
owner: Ben Tankersley
last_reviewed: 2026-05-11
related:
  - ../roadmap/0003-operator-integration-phases.md
  - ../decisions/0001-thesis-lock.md
  - ./research-batch-workflow-v1.md
  - ./positioning-memo-workflow-governance-agent-teams.md
  - ../demo/operator-media-engine-checklist.md
---

# Operator Media Engine v1

**Purpose:** Turn **real project activity** into **governed content proposals** — the first **business-use** workflow for Jarvis + OpenClaw. OpenClaw (or tooling you control) **proposes** copy and narratives; **Jarvis** records proposals, approvals, and execution boundaries; **Ben** **approves** and **executes** deliberately. Nothing publishes on its own.

This is a **proof loop** for revenue-adjacent *ideas* and *drafts*, not an autonomous marketing bot.

---

## Inputs (what can feed the engine)

| Input | Examples |
|--------|-----------|
| **Recent commits** | Subject lines, scope of change, links to PRs or SHAs (when cited honestly) |
| **Docs changes** | Architecture updates, strategy deltas, ADR edits |
| **Demo notes** | What was shown, what landed, operator quotes |
| **Friction logs** | UX gaps, rehearsal findings, “what confused me” |
| **Roadmap updates** | Phase completions, scope decisions (from in-repo docs) |

All of these remain **source material** until they become structured proposals with explicit **evidence** and **uncertainty** posture.

---

## Outputs (proposal shapes, not shipments)

Each output is a **`system.note`** (or future kind) entering Jarvis as a **proposal** — operator may later map to `content.publish` or other kinds only under policy, not in v1 of this doc.

| Output | Role |
|--------|------|
| **LinkedIn post proposal** | Short professional update from shipping/learned |
| **Blog draft proposal** | Longer narrative tied to architecture or thesis |
| **Short video script proposal** | Beats, b-roll notes, CTA — for manual recording |
| **Outreach / follow-up draft proposal** | DevHouse or partner follow-up **text only** — no auto-send |

---

## Governance (non-negotiable)

- **Nothing publishes automatically.** No social APIs, no schedulers, no “post on approve.”
- **Everything enters Jarvis as a proposal** (ingress + HUD path you already use).
- **`evidenceStatus`** and **`uncertaintySummary`** are **required authoring expectations** for Operator Media payloads (same bar as [Phase 3b](../roadmap/0003-operator-integration-phases.md) / research & creative rehearsals).
- **Approval ≠ execution** — approve authorizes; Execute writes artifacts and receipts under existing policy.
- **The model is not a trusted principal** — claims that stretch beyond cited inputs must use **inferred** or **speculative** honestly.

---

## Success metrics (v1)

| Metric | Meaning |
|--------|---------|
| **Proposals created** | Rehearsal or agent-generated payloads accepted at ingress |
| **Proposals approved** | Human authorization recorded in Jarvis |
| **Posts published manually** | You paste/post outside Jarvis after review — counted as success, not system automation |
| **Proof in traces / receipts** | Trace shows **Executed · receipt recorded** (or equivalent) and artifact paths exist |
| **Money / revenue opportunity** | Qualitative or CRM note — e.g. “follow-up sent manually led to conversation” — **speculative** hypotheses tracked honestly, not auto-credited |

---

## Rehearsal

- **Script:** [`scripts/operator-media-engine-rehearsal.ts`](../../scripts/operator-media-engine-rehearsal.ts) — prints (or writes) sample JSON only; **no network**, **no email**, **no secrets**.
- **Package:** `pnpm operator:media:rehearsal`
- **Checklist:** [Operator Media Engine — demo checklist](../demo/operator-media-engine-checklist.md) — start with **[Day 1: one full loop (today)](../demo/operator-media-engine-checklist.md#day-1-one-full-loop-today)** when you want a single governed proof, not a long rehearsal.

---

## Explicit non-goals (v1)

- No scheduling, no social posting APIs, no outbound email from this workflow.
- No monetization automation, no agent swarm abstractions.
- No treating Jarvis as a “growth autopilot.”

---

## See also

- [Operator integration phases — Media Engine note](../roadmap/0003-operator-integration-phases.md)
- [Thesis Lock](../decisions/0001-thesis-lock.md)
- [Governed execution checklist](../demo-governed-execution-checklist.md)
