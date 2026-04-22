# Agent team v1

**Status:** Draft canonical direction  
**Related:** [Thesis Lock](./jarvis-hud-video-thesis.md#thesis-lock-do-not-drift) · [ADR-0001: Thesis Lock](../decisions/0001-thesis-lock.md) · [ADR-0005: Batch v0 — per-item execute](../decisions/0005-agent-team-batch-v0-per-item-execute.md) · [Research batch workflow v1](./research-batch-workflow-v1.md) · [Jarvis ↔ OpenClaw overview](../architecture/jarvis-openclaw-system-overview.md) · [Operating assumptions](./operating-assumptions.md)

---

> **Canonical governance spec (agent scaling)**  
> This document defines how multiple specialist agents contribute to Jarvis HUD. All agent-team features, batching, and ingest paths must stay consistent with [Thesis Lock](./jarvis-hud-video-thesis.md#thesis-lock-do-not-drift).  
> If a proposed feature violates Thesis Lock, the feature is incorrect — not the thesis.

---

## Purpose

Describe how a multi-agent **team** feeds Jarvis HUD **without weakening execution boundaries**. Product and architecture intent live here; schemas and enforcement live in code and ADRs.

---

## Operating rule (v1)

Agents may think, rank, summarize, and package. **Jarvis alone authorizes execution.**

Helpfulness, confidence, and batching do not confer authority.

---

## Roles (v1)

| Role | Responsibility | Out of scope in v1 |
|------|----------------|--------------------|
| **Research** | Evidence, sources, ranked options, risks — proposals only | Spend, publish, messaging, wallet |
| **Creative** | Copy variants, briefs, structured creative outputs — proposals only | Same |

An optional **orchestrator / intake** may group work into a batch for review. It does not execute.

---

## Batch v0 (default UX)

- **Batch = review container** — grouping, summary, triage; not a receipt and not a substitute for execution records.
- **Triage and approval may be batch-level** — reject the batch, mark readiness, bulk-select for review; **no side effects**.
- **Execution is always item-level** — one execution envelope per item (or per explicit child item split from a parent).
- **Receipt is always item-level** — artifact + log per executed item. A batch may **index** receipts; it must **never replace** them.

Batch UX that collapses unrelated side effects into one ambiguous consent is **architectural drift**.

**Stored shape (v0):** optional top-level `batch` on each approval-bearing event: `{ id: string, title?: string, summary?: string, itemIndex: number, itemCount: number }` with `0 <= itemIndex < itemCount`. OpenClaw ingress enforces a **stricter** allowlist and limits via `strictValidateIngressBatch` before events are written. UI grouping uses `parseProposalBatchItemContext` / `groupEventsByProposalBatch` (`src/lib/proposal-batch.ts`).

---

## Cadence

- **Windowed** batches (e.g. daily or weekly) and **on-demand** batches.
- After **submit for human review**, treat the batch as **immutable**. New facts → **new batch** or an **amendment item**, not silent edits to reviewed content.

---

## Allowed proposal kinds (v1 allowlist)

Illustrative kinds (exact identifiers TBD with schema work):

- `research_memo`, `ranked_options`, `risk_register_update`
- `creative_variant_set`, `creative_brief`

Kinds are cognitive outputs until promoted to execution in Jarvis.

---

## Non-goals (v1)

- Wallet, auto-spend, autonomous posting, silent tool execution.
- Treating model output as authorization or audit authority.

---

## Phased capabilities (intent)

- **Phase 1 (v1):** Research and creative, proposal-only tools, batch v0 as in ADR-0005.
- **Phase 2:** More specialists, richer provenance and evaluation — execution still human-gated.
- **Phase 3+:** Wallet and autonomy as **explicit Jarvis-governed capabilities** — policy, approval UX, limits, kill switch, and mandatory receipts **before** implementation.

---

## Thesis Lock

Must remain consistent with [Thesis Lock (Do Not Drift)](./jarvis-hud-video-thesis.md#thesis-lock-do-not-drift):

1. Agents can propose anything.
2. Execution requires explicit human approval.
3. Approval does not equal execution.
4. Every action produces receipts (artifact + log).
5. The model is not a trusted principal.
6. Autonomy in thinking. Authority in action.

**Drift test:** If it is unclear what was approved, what ran, or what was receipted, the change is incorrect relative to this spec.
