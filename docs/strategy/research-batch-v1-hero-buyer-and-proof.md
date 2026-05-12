---
title: "Research batch v1 — hero workflow, buyer line, proof checklist"
status: living-document
category: strategy
owner: Ben Tankersley
related:
  - ./research-batch-workflow-v1.md
  - ../roadmap/0003-operator-integration-phases.md
  - ../verification/pilot-proof-bundle-checklist.md
  - ../verification/policy-deny-repro.md
  - ../decisions/0001-thesis-lock.md
  - ./messaging-execution-integrity.md
---

# Research batch v1 — hero workflow, buyer line, proof checklist

**Use this doc when:** you need **one** external story for Phase 4 — not broader “AI governance” language. Full workflow contract: [Research batch workflow v1](./research-batch-workflow-v1.md).

---

## 1. One-page hero workflow spec (Research batch v1)

**What this is:** OpenClaw submits **research-only** work as **`system.note`** proposals, grouped by shared **`batch.id`**. Nothing executes until a **human** approves and explicitly **executes** per item in Jarvis HUD. Every execution produces **receipts** and a **trace** you can replay.

| # | Stranger question | Answer (Research batch v1) |
|---|-------------------|------------------------------|
| **1** | What work is being proposed? | **Structured research memos** — per-item `title` / `summary` / markdown `payload.note` with a **`## Sources`** section; optional `evidenceStatus` / `uncertaintySummary` (Phase 3b). Batch container = `batch.title` / `batch.summary` (must be distinguishable run-to-run). |
| **2** | Who must decide? | **A human with HUD access** (and, when auth is on, a real session + step-up for execute). OpenClaw holds **ingress capability**, not approval authority — see [Thesis Lock](../decisions/0001-thesis-lock.md). |
| **3** | What happens if approved? | **Nothing automatic.** **Approve** only queues intent. **Execute** runs the governed adapter for that item (`system.note`) and writes durable outcomes. |
| **4** | What artifact proves it happened? | **Receipt** + **action log** under `JARVIS_ROOT`, **trace** keyed by `traceId`, **Activity** row showing the governed outcome — not chat logs. |
| **5** | Why safer than ordinary agent automation? | **No silent execution:** agents may **propose**; **approval ≠ execution**; the **model is not the trust root**; ingress is **signed and allowlisted**; kind is **safe** (`system.note` only in v1 batch). |

**Hard exclusions (v1):** No email send, no publish, no `code.apply`, no batch-level “execute all” — see scope table in [workflow](./research-batch-workflow-v1.md#scope-v1).

---

## 2. Buyer-facing one-liner + 30-second pitch

### One-liner

**Jarvis governs AI work at the execution boundary—proposals, approvals, executions, receipts, and traces—so teams can safely run real AI workflows with accountable authority.**

*(Prefer this over generic “AI governance platform” language.)*

### ~30 seconds

“Agents and tools can propose work all day. The failure mode enterprises feel is *who said this could run*, and *what actually happened*. Jarvis sits on the **execution boundary**: every consequential path goes **propose → human approve → explicit execute → receipt and trace**. We prove it first on **research batches**—OpenClaw proposes structured notes; nothing lands in the world without that gate. Same spine later for riskier kinds.”

**Compressed lines (alternate register):** [Messaging — execution integrity](./messaging-execution-integrity.md).

---

## 3. Proof bundle checklist (happy path + deny path)

Use with the **pilot discipline** in [Pilot proof bundle](../verification/pilot-proof-bundle-checklist.md) (host, paths, audit export). **Deny path** uses [Policy deny repro](../verification/policy-deny-repro.md).

### Preconditions

- [ ] [Blessed stack](../setup/local-stack-startup.md): one gateway, one HUD origin, ingress secret aligned.
- [ ] `pnpm machine-wired` green (or captured failures you can explain).
- [ ] `pnpm rehearsal:preflight` when exercising auth (`machine-wired` + `auth-posture`).

### Happy path (research batch — minimal)

- [ ] Submit **3** ingress posts with the **same** `batch.id`, `itemIndex` 0…2, **`kind`: `system.note`**, research-only bodies + Sources (see [compose-time shape](./research-batch-workflow-v1.md#compose-time-shape-openclaw)).
- [ ] HUD: three **pending** rows grouped under one batch; titles scan unambiguously (Phase 3a batch title rule).
- [ ] **Approve** one item (only that row).
- [ ] **Execute** that same item; others stay pending or approved-but-not-executed — **no** implicit batch execute.
- [ ] **Activity:** executed row shows outcome; capture **proposal id** + **trace id**.
- [ ] **Trace / replay:** open trace for that execution; narrative matches what a buyer would expect.
- [ ] **Receipt:** confirm durable artifact / action log for that execution under your certified `JARVIS_ROOT`.
- [ ] Optional: **audit export** same calendar window including that approval id — [pilot bundle §3](../verification/pilot-proof-bundle-checklist.md#3-audit-export-same-window-same-root).

### Deny path (pick at least one per “proof session”)

- [ ] **Ingress off or wrong secret** — expect clean failure; no phantom pending (per [integration verification](../openclaw-integration-verification.md) mindset).
- [ ] **Policy deny** — follow [policy deny repro](../verification/policy-deny-repro.md); show deny **receipt / log line** and that **execute** did not run governed adapters.
- [ ] **Malformed batch** — e.g. missing `batch.id` / wrong nesting; expect ingress rejection with operator-readable fix (rehearsal scripts should catch before send when possible).

### Done when

A **smart stranger** can watch once and answer the **five table rows** in §1 without you narrating the architecture — and you can hand over **redacted stdout + one audit window** that matches the story.

---

## Related

- [Research batch workflow v1](./research-batch-workflow-v1.md) — full contract, friction log, authoring rules  
- [Roadmap Phase 4](../roadmap/0003-operator-integration-phases.md#phase-4--operationalize-the-first-agent-loop)  
- [Ready enough — operating bar](./ready-enough-operating-bar.md)
