---
title: "Flagship team bundle v1 — Alfred + Research + Creative"
status: living-document
category: strategy
owner: Ben Tankersley
related:
  - ./agent-team-contract-v1.md
  - ./research-agent-v1.md
  - ./creative-agent-v1.md
  - ../decisions/0001-thesis-lock.md
  - ../decisions/0005-agent-team-batch-v0-per-item-execute.md
  - ../roadmap/0004-phased-platform-plan.md
  - ./runtime-openclaw-jarvis-team-loop-v1.md
---

# Flagship team bundle v1 — Alfred + Research + Creative

**Purpose:** Define the **first intentional, composable team** for Jarvis HUD: who owns **intake**, **evidence**, and **variants**; what lands in **Jarvis** as proposals; and why this bundle is valuable **without** an Operator role. **Normative operating law** remains [Agent team contract v1](./agent-team-contract-v1.md); [Thesis Lock](../decisions/0001-thesis-lock.md) and [ADR-0005](../decisions/0005-agent-team-batch-v0-per-item-execute.md) bound execution.

**Reading order:** [Contract](./agent-team-contract-v1.md) first → [Agent team v1](./agent-team-v1.md) for broader framing → this bundle → [Research](./research-agent-v1.md) / [Creative](./creative-agent-v1.md) for role detail.

---

## Composition

| Role | In bundle | Responsibility |
|------|-----------|------------------|
| **Alfred** | Yes | **Intake:** triage, consent, routing, “what are we doing,” handoff packaging to specialists. Does **not** own deep evidence or creative variants. |
| **Research** | Yes | **Evidence:** sources, quotes, uncertainty, `ResearchEvidencePack` / digest; proposes **research-backed** items into Jarvis. |
| **Creative** | Yes | **Variants:** hooks, beats, scripts, packaging; proposes **creative** items into Jarvis. |
| **Operator** | **No (v1)** | Intentional gap. Add **Operator v1** only if recurring pain appears in queue shaping, handoff orchestration, proposal packaging, or runbook ownership. |

---

## Ownership (who owns what)

| Concern | Owner | Notes |
|---------|--------|--------|
| **Intake & user-facing clarity** | Alfred | One front door; consent and routing per contract §1–2. |
| **Evidence quality & citations** | Research | No execution authority; outputs feed proposals and human review. |
| **Creative options & narrative shape** | Creative | Multiple variants OK; human chooses what to approve. |
| **What enters Jarvis** | **Human via Jarvis** | Specialists **propose**; Alfred may **surface** bundles; **approval and execute** stay in HUD per Thesis Lock. |

---

## What gets proposed into Jarvis

Everything below is **proposal-shaped** (trace → approve → execute → receipt). Batch semantics follow [ADR-0005](../decisions/0005-agent-team-batch-v0-per-item-execute.md).

| Source | Typical Jarvis kinds / artifacts | Preconditions |
|--------|----------------------------------|---------------|
| **Research** | Research-backed claims, digests, “what we know / don’t know,” links to `ResearchEvidencePack` | Evidence attached or explicitly scoped as low-confidence |
| **Creative** | Script variants, hooks, beat sheets, packaging copy | Labeled as options; no implied “winner” until human picks |
| **Alfred** | Summaries of intent, handoff briefs, **not** a substitute for specialist packs | Does not bypass Research/Creative ownership for evidence or variants |

**Rule:** Alfred **coordinates**; Research **grounds**; Creative **multiplies options**. None **executes** outside Jarvis approval.

---

## Why this bundle is valuable

1. **Composable:** Clear separation — intake (Alfred) vs evidence (Research) vs variants (Creative) — maps cleanly to the contract’s routing and handoff tables.
2. **Legible authority:** One front door, many specialists; execution stays in Jarvis; no “helpful” shortcut around approval.
3. **Sellable / demoable:** A team that “thinks in parallel” but **ships** only through human-gated proposals matches the product story without inventing an orchestrator agent prematurely.
4. **Operator deferred:** Queue and packaging pain, if it appears, justify a dedicated spec; until then, the bundle stays **three roles + Jarvis**.

---

## Typical flows (pressure-test)

1. **User asks a factual question** → Alfred scopes consent → Research produces evidence pack + digest → **proposals** for any follow-on actions (e.g. deeper search) → human approves per item in Jarvis.
2. **User asks for creative output** → Alfred confirms intent and constraints → Creative produces **variants** → proposals for artifacts / next steps → human picks and approves.
3. **Mixed ask** → Alfred sequences handoffs (Research then Creative, or parallel with clear ownership) → each specialist proposes into Jarvis; Alfred does not merge evidence and variants into a single opaque “trust me” package without traceable attachments.

---

## Proposal-shape examples (grep + implementation)

Each row is one **concrete** proposal card aligned with [Jarvis kind mapping](./agent-team-contract-v1.md#5-jarvis-kind-mapping-execution-truth) and `ALLOWED_KINDS` in [`src/lib/policy.ts`](../../src/lib/policy.ts). Strings are intentionally distinctive so you can search the repo or logs for them during demos and tests.

### Flow 1 — Factual / research

| Field | Example |
|--------|---------|
| **Grep anchor** | `flagship-flow-1-eu-ai-act-digest` |
| **Jarvis `kind`** | `system.note` |
| **Sample title** | Evidence digest: EU AI Act — applicability vs. GPAI (Q1 2026 scope) |
| **Sample summary** | Capture Research’s `ResearchEvidencePack`: 4 sources, 2 high-confidence claims, 3 explicit unknowns; links to quotes; recommends deeper pull on Title II only if user approves a follow-on note. |
| **Owning agent** | Research (produced the action; Alfred scoped consent only). |
| **Risk level** | Low |
| **Why it stops at Jarvis** | Even a **note write** is an execution-shaped effect: Thesis Lock requires **explicit human approval** before persistence; the model is not a trusted principal and there must be a **receipt / trace** after execute. |

**Runnable in repo (full bundle):** (1) `examples/openclaw-proposal-flagship-flow1-alfred-intake.sample.json` — **`agent`: `alfred`**, grep **`flagship-flow-1-alfred-intake`**; (2) `examples/openclaw-proposal-flagship-flow1-research.sample.json` — **`agent`: `research`**, grep **`flagship-flow-1-eu-ai-act-digest`**; shared **`correlationId`: `flagship-bundle-eu-ai-act-001`**. Submit each with `pnpm jarvis:submit --file …`, then **Approve** + **Execute** each in the HUD. OpenClaw tools: **`proposeAlfredIntakeSystemNote`**, **`proposeResearchSystemNote`** (`src/openclaw-strict-governed/`). See [Local verification](../local-verification-openclaw-jarvis.md#4b-flagship-flow-1--alfred-intake--research-digest-full-bundle).

### Flow 2 — Creative output

| Field | Example |
|--------|---------|
| **Grep anchor** | `flagship-flow-2-publish-variant-b` |
| **Jarvis `kind`** | `content.publish` |
| **Sample title** | Publish: investor one-pager — Variant B (shorter hook, CTA v2) |
| **Sample summary** | Creative selected **Variant B** from three `system.note`-captured drafts; payload is staging path + channel metadata; no send until HUD approve + execute. |
| **Owning agent** | Creative (authored the publish intent; Alfred confirmed constraints only). |
| **Risk level** | High |
| **Why it stops at Jarvis** | Publishing is **outbound / world-facing**; authority lives in the HUD gate, not in model confidence. Approve ≠ execute; policy and adapters enforce the allowlist. |

### Flow 3 — Mixed (research → creative package)

| Field | Example |
|--------|---------|
| **Grep anchor** | `flagship-flow-3-youtube-package-mixed` |
| **Jarvis `kind`** | `youtube.package` |
| **Sample title** | YouTube package: “Strongman” beat — evidence-backed script v2 |
| **Sample summary** | Research supplied cited claims (2 disputed, flagged); Creative locked script v2 and b-roll list; package job references evidence bundle id in narrative metadata — **one approval id = one package execution** per [ADR-0005](../decisions/0005-agent-team-batch-v0-per-item-execute.md). |
| **Owning agent** | Creative (primary owner of this **execution** proposal); Research’s digest may exist as a **separate** approved `system.note` in the same batch. |
| **Risk level** | Medium–high |
| **Why it stops at Jarvis** | Bundling does not merge authority: the package is still **one gated effect**; human must approve before the adapter runs, with receipts for audit. |

---

## Related

- [Agent team contract v1](./agent-team-contract-v1.md)
- [Research agent v1](./research-agent-v1.md)
- [Creative agent v1](./creative-agent-v1.md)
- [Research batch workflow v1](./research-batch-workflow-v1.md)
- [Creative batch workflow v1](./creative-batch-workflow-v1.md)
