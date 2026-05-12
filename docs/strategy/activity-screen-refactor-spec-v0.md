---
title: "Activity screen refactor — v0 spec (queue-first)"
status: living-document
category: strategy
owner: Ben Tankersley
related:
  - ./research-batch-v1-hero-buyer-and-proof.md
  - ./activity-layout-v1-implementation-checklist.md
  - ../roadmap/0003-operator-integration-phases.md
---

# Activity screen refactor — v0 spec (queue-first)

**Canonical daily driver (next ~3 months):** **`/activity`** — approvals, explicit execute, receipts, traces. **`/`** stays an **overview** while the queue is duplicated during transition.

---

## Problem statement

Not “too technical,” but **too many truths competing at once** without a dominant answer to: **what needs my decision right now?**

---

## Locked transition plan

| Phase | What |
|--------|------|
| **Now** | **Duplicate first, then cut over** — not permanent duplication. |
| **Primary implementation target** | `/activity` |
| **Transition** | Mirror the operator queue (`OperationsRow`: proposals + pipeline) onto `/activity` alongside the existing graph + trace. |
| **After validation** | Slim `/` toward overview + pointer into Activity; remove duplicate queue when the new hierarchy feels stable. |

### Practical rule (one release window)

- **`/activity`** — queue-first operator surface (attention line → proposals → pipeline → trust/integration → graph → timeline).
- **`/`** — system overview; **ActivityQueueHandoff** immediately above the mirrored queue: same attention sentence + **Open Activity →** (full queue also remains here until cutover).

---

## Goals

1. **One dominant truth above the fold on Activity:** pending approval vs approved-awaiting-execute vs idle.
2. **Thesis-safe copy:** Jarvis **gates** and **proves**; humans hold **authority at execute**. Avoid “Jarvis decides” in a way that implies autonomous execution.
3. **Trust posture as context rail** — present, subordinate to the queue when the system is green; expand when degraded (future refinement).
4. **Progressive disclosure** — do not delete diagnostics; **re-tier** (collapsible sections are a later pass).

### Non-goals (v0)

- Full visual rebrand or removing technical signals operators rely on.
- Slimming `/` beyond handoff + tagline tweak until duplicate queue is validated.

---

## Above-the-fold layout (`/activity`)

| Order | Block |
|-------|--------|
| 1 | Page title + link to Dashboard |
| 2 | Short subtitle (queue-first intent) |
| 3 | **OperatorAttentionBanner** — plain sentence from live counts |
| 4 | **OperationsRow** — Agent Proposals + Execution Pipeline (same as `/`) |
| 5 | Trust + status + OpenClaw (context) |
| 6 | Control plane graph + Activity timeline |

---

## Implementation notes (code)

- **`buildOperatorAttentionMessage`** — `src/lib/operator-attention-message.ts` (unit-tested). Copy: idle; N proposals need approval; M approved items await execute; combined with ` · `.
- **`useApprovalQueueCounts`** — `src/hooks/useApprovalQueueCounts.ts`: `GET /api/approvals?status=all`, client filters with `isPendingApproval` / `isApprovedAwaitingExecution`, 5s poll + `jarvis-refresh`.
- **`ApprovalQueueCountsProvider`** — wraps **OperatorAttentionBanner + OperationsRow** on Activity, and **ActivityQueueHandoff + OperationsRow** on home so **one poll** per page for counts.
- **`OperationsRow`** — uses shared context when inside provider; otherwise falls back to pending-only fetch (safety for stray imports).

---

## Success criteria (binary)

1. On **`/activity`**, a new operator can answer **“what do I do next?”** (or “nothing”) from the **first banner** without reading trust pills.
2. **Duplicate transition** is honest: home shows the same queue block + handoff until you deliberately remove it from `/`.
3. **Language:** no headline implies Jarvis replaces human judgment on **execute** (home hero updated toward **gate / prove / human authority at execute**).

---

## Next (post-validation)

- **Activity layout v1 (file-ordered build list):** [activity-layout-v1-implementation-checklist.md](./activity-layout-v1-implementation-checklist.md) — two-column shell, diagnostics disclosure, proof tab, `/activity` only. **Status:** initial layout shipped (see checklist § Implementation status).
- Remove **OperationsRow** from `/` when Activity is the sole queue surface; keep a single strong CTA to `/activity`.
