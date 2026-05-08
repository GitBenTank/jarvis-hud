# ADR-0006: Governed workflow plans (v0.3) — semantics before power

Status: Accepted  
Date: 2026-05-07  
Owner: Ben Tankersley  

**Related:** [ADR-0001: Thesis Lock](./0001-thesis-lock.md) · [ADR-0005: Per-item execute](./0005-agent-team-batch-v0-per-item-execute.md) · [Trust and determinism](../governance/trust-and-determinism.md) · [v0.2 Golden Loop sprint](../roadmap/0005-v02-golden-loop-sprint.md)

---

## Context

Orchestration temptations arrive quickly: more adapters, autonomous retries, background runners, self-healing graphs, agent teams, delegation chains. Those are **capability multipliers**. Without hard category boundaries, they collapse product meaning into an “AI workflow runner”: opaque bundles, bundle-shaped consent, and forensics that cannot answer *who authorized what, when, for which step*.

Jarvis is differentiated by **authority semantics first** — the invert of how most teams retrofit receipts and approval separation after orchestration complexity appears. This repository already prepared substrate: per-item execute, receipts, replay, trace lineage, execution inventory, approval separation, golden-loop discipline, and trust posture docs.

v0.3 must **widen orchestration only inside that substrate**, not erode it.

---

## Category lock (non-negotiable)

**A workflow is not an action.**

**A workflow is a governed sequence of authority boundaries.**

Every step crosses a boundary the system must be able to name, approve (where required), execute, and receipt — without the run becoming a black box.

---

## Decision

1. **v0.3 proves workflow semantics, not workflow power.** Scope is intentionally thin: validate plan shape, persist/run a safe multi-step path, and prove **governed** replay/export — not “maximum expressiveness.”
2. **Workflow runs are inspectable artifacts**, not hidden control flow. Operators and auditors can map steps → approvals (where applicable) → executions → child receipts.
3. **Execution stays item- and envelope-shaped** (consistent with ADR-0005). A workflow coordinates **steps**; each step that produces side effects still produces **its own** receipt lineage (parent workflow references child receipts; children do not substitute for parent plan integrity).
4. **Safe steps first.** Initial vertical uses **allowlisted, low-blast-radius kinds** (e.g. `system.note` loop) to prove sequencing mechanics before **gated** adapters (e.g. email) appear in a workflow path.
5. **Premature autonomy is out of scope.** No autonomous retries, background self-healing, or implicit delegation until semantics are boring in CI (golden loop) and in export/replay.

---

## Implementation sequence (normative order)

1. Land this ADR as the recorded category.
2. Thin v0.3 slice: `workflow.plan` (or equivalent) **validated** at ingress; persistence that can answer “what plan ran.”
3. **Safe** multi-step execution: `system.note`-class steps end-to-end in the governed path.
4. **Child receipt lineage**: workflow run links to per-step / per-execution receipts; trace export shows the tree without collapsing boundaries.
5. **Governed replay/export** for the workflow run shape (same discipline as single-action golden loop).
6. **`pnpm golden-loop:workflow`** (or equivalent) in CI — semantics proof, not demo flair.
7. **Only then** widen adapters / additional kinds inside the same gates (e.g. email workflow path mirrors existing `golden-loop:email` posture).

Skipping order trades **authority clarity** for **demo velocity** and is treated as architectural drift.

---

## Consequences

**Positive**

- Product category stays **governed workflow execution fabric**, not generic orchestration.
- Investors and operators get a consistent story: boundaries are first-class, not retrofitted.
- Capability expansion attaches to **proven** semantics (replay, lineage, approval separation).

**Tradeoffs**

- v0.3 will feel “small” compared to what a workflow engine *could* do. That is intentional.
- Engineering must resist shipping “just one more adapter” ahead of lineage + replay for the workflow shape.

---

## Non-goals (v0.3)

- Maximum workflow DSL expressiveness, arbitrary code steps, or opaque subgraphs.
- Autonomous retries, self-healing, or silent replanning without human-visible boundaries.
- “Agent teams” or delegation graphs as execution authorities.
- Background-only runners that bypass the same approval/receipt contract as foreground execution.

---

## `workflow.plan` ingress shape (v0.3)

One **proposal** (`kind: workflow.plan`) wraps **steps** executed sequentially after a single approval + execute. Each step is a governed receipt; the parent approval id ties children via `parentApprovalId` on child receipts (suffix `…__wf_<i>`).

Illustrative ingress body (OpenClaw-signed POST, two `system.note` steps only):

```json
{
  "kind": "workflow.plan",
  "title": "My workflow",
  "summary": "Two internal notes",
  "payload": {
    "steps": [
      {
        "kind": "system.note",
        "title": "Step 1",
        "summary": "First",
        "payload": { "note": "Body 1" }
      },
      {
        "kind": "system.note",
        "title": "Step 2",
        "summary": "Second",
        "payload": { "note": "Body 2" }
      }
    ]
  },
  "agent": "coordinator",
  "source": { "connector": "openclaw" }
}
```

**Replay / trace:** `GET /api/traces/{traceId}/replay` includes `workflowLineage`: narrative, ordered `steps`, and `parentReceipt`. Live trace `GET /api/traces/{traceId}` includes the same operator-facing fields (without duplicating raw `childReceipts` in the JSON).

**Limits (current):** 2–6 steps; each step `kind` must be `system.note`; unknown keys on step objects are rejected.

---

## Drift warning

If marketing or implementation begins describing Jarvis as an **AI workflow runner**, revisit this ADR against [Thesis Lock](./0001-thesis-lock.md) and [Trust and determinism](../governance/trust-and-determinism.md). The fix is to narrow scope or add governed artifacts — not to redefine approval.
