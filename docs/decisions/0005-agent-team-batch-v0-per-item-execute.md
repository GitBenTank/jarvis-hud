# ADR-0005: Agent team batch v0 — per-item execute and receipts

Status: Accepted  
Date: 2026-04-18  
Owner: Ben Tankersley  

**Related:** [ADR-0001: Thesis Lock](./0001-thesis-lock.md) · [Agent team v1](../strategy/agent-team-v1.md)

---

## Context

Jarvis HUD is adding a multi-agent **team** surface: specialists produce structured work in **batches** for human review. Batching raises a familiar failure mode: the human approves a **summary** while the system runs a **heterogeneous bundle** of side effects. That blurs consent, weakens forensics, and drifts away from Thesis Lock.

Thesis Lock requires, among other things:

- Approval does not equal execution.
- Every action produces receipts (artifact + log).

Batch v0 needs an explicit default that scales to more agents **without** renegotiating trust boundaries later.

---

## Decision

Adopt this **default UX and data semantics** for batch v0:

1. **Batch = review container** — grouping, narrative, triage only.
2. **Batch-level actions support triage** — e.g. reject the batch, mark progress, bulk operations that **do not execute** side effects.
3. **Execution is always item-level** — each run uses one **execution envelope** tied to one **batch item** (or one item explicitly derived or split from a parent).
4. **Receipt is always item-level** — each executed item gets its own artifact + log references. The batch may **index** receipts; it **must not replace** them.

Later UX may add conveniences (e.g. queue **N** distinct item executions). v0 **defaults** to per-item execute so operators are not trained into **bundle consent**.

---

## Consequences

**Positive**

- Straightforward mapping to Thesis Lock in both product copy and audit logs.
- Less ambiguity under stress: approving a batch summary does not imply every line item ran.
- Clearer partial completion, idempotency, and rollback narratives.

**Tradeoffs**

- More explicit steps for high-volume operators until safe batch conveniences exist.
- UI must keep **item boundaries** obvious so batch summaries do not substitute for item review.

---

## Non-goals (this ADR)

- Wallet, spend limits, or autonomous execution policy — out of scope here; separate governed design if introduced.
- Final JSON schema for batches — follow in implementation once ingest paths are fixed.
