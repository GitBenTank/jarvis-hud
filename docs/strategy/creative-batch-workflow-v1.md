# Creative batch workflow v1 (Phase 5 — second specialist)

**Status:** Living — **Phase 5 v1 first full close logged (2026-04-22, run 1 in friction log below)** — same approve → execute → receipt chain as research; no role-specific collapse at `system.note` depth. **Optional:** one short follow-up creative rehearsal later to rule out a lucky first pass. Same spine as [Research batch workflow v1](./research-batch-workflow-v1.md).  
**Related:** [Thesis Lock](./jarvis-hud-video-thesis.md#thesis-lock-do-not-drift) · [ADR-0005: Batch v0](../decisions/0005-agent-team-batch-v0-per-item-execute.md) · [Agent team v1](./agent-team-v1.md) · [Roadmap Phase 5](../roadmap/0003-operator-integration-phases.md#phase-5--add-the-second-specialist) · [Phase 3a batch naming](./research-batch-workflow-v1.md#phase-3a--rehearsal-authoring-minimal)

---

## Purpose

Prove the **same** Jarvis loop — ingress → batch grouping → per-item approve → per-item execute → receipt/trace — for **creative** cognitive work, without a new kind or schema sprint.

**v1:** `system.note` only; structure lives in **markdown** inside `payload.note`. No `creative.*` kind until this loop is stable and validation is worth the cost.

This doc does **not** add wallet, publish, outbound send, auto-spend, or any execution that bypasses an explicit approved proposal row.

---

## What a creative item is (v1)

A **creative item** is a single `system.note` proposal whose body is a **reviewable creative memo**: one coherent brief with explicit variants, not a grab bag of unrelated executions.

Operators should be able to answer, before **Execute**:

- What audience and angle does this assume?
- What are the distinct variants?
- What risks or caveats apply?

---

## Required sections in `payload.note` (markdown)

Every creative item MUST include these headings (order flexible, but all must be present and non-empty for real submissions; rehearsal script fills placeholders):

| Section | Role |
|---------|------|
| `## Brief` | What we are trying to communicate or produce (goal, channel context if any). |
| `## Audience` | Who it is for; sophistication, constraints. |
| `## Angle` | Positioning, tone, or narrative hook the variants share or explore. |
| `## Variants` | **3–5** distinct options (use `### Variant 1` … or a numbered list — be consistent within a batch). |
| `## Risks / notes` | Optional but recommended: sensitivities, claims to verify, “do not imply X.” Use `—` or “None” only if truly nothing applies. |
| `## Sources` | Inputs, links, or references the creative work relied on; use `—` if purely generative with no external inputs. |

**Discipline:** No language that implies **execution** already happened (“posted”, “sent”, “published now”). This is still a **proposal**.

**Batch metadata:** Same as research v1: top-level `batch` on every item, **`n`** separate signed `POST`s, identical `batch.id` and `itemCount`, distinct `itemIndex`. See [Research batch workflow — Compose-time shape](./research-batch-workflow-v1.md#compose-time-shape-openclaw).

---

## Batch titles and summaries

Follow [Phase 3a](./research-batch-workflow-v1.md#phase-3a--rehearsal-authoring-minimal): **`batch.title` must include a short differentiator** (timestamp, run label, topic slug, or `batch.id` fragment).

Examples:

- `Creative batch — taglines — run 2`
- `Creative rehearsal — 2026-04-22 21:58 (a1b2c3d4)`

**`batch.summary`:** One paragraph — what this batch is for (e.g. “homepage hero copy options”, “campaign A/B angles”). Not a substitute for per-item bodies.

**Per-item `title` / `summary`:** Queue-scannable; should reflect the slice of work (e.g. “Creative item 2 — social hooks”).

---

## Out of scope (v1)

| Out of scope | Why |
|--------------|-----|
| New `creative.*` ingress kind | Premature until volume justifies schema + UI |
| Auto-publish, send, spend, wallet | Thesis Lock; separate governed capabilities later |
| Batch-level execute | [ADR-0005](../decisions/0005-agent-team-batch-v0-per-item-execute.md) |
| Implied consent from batch grouping | Batch is a **review container** only |
| Changing approval / execute / receipt semantics | Spine is invariant |

---

## Rehearsal protocol (Phase 5)

Same discipline as research: [blessed stack](../setup/local-stack-startup.md), preflight, then submit, then HUD.

1. **`pnpm rehearsal:preflight`**
2. **`pnpm rehearsal:creative-batch`** (default **3** items; optional `CREATIVE_BATCH_ITEM_COUNT` same bounds as research, 3…`INGRESS_BATCH_MAX_ITEM_COUNT`)
3. In HUD: confirm **one review container** per `batch.id`, **Approve** as needed
4. **Execute exactly one** row (unless deliberately varying)
5. Verify **proposal id**, **trace id**, and **receipt** for that id only

**Script:** `scripts/creative-batch-rehearsal.ts`

---

## Friction log (creative — keep separate from research)

**Why a separate table:** Creative and research **rhyme** on the spine, but frictions diverge. This log makes it obvious whether an issue is **creative review ergonomics** (variants, headings, length in Details, scan of Brief/Angle) vs **cross-cutting governance** (batch truth, approve vs execute, receipt identity, integration banner class).

**Habit:** Append a row after **each** creative rehearsal or session — **pain**, **validation**, or “nothing bit me.” Positive rows belong here too.

**Classification:**

| If the issue is… | Log here | Also log in [Research friction log](./research-batch-workflow-v1.md#friction-log-after-rehearsals)? |
|------------------|----------|-----------------------------------------------------------------------------------------------------|
| **Creative-specific** (copy density, section layout, triage of variants) | **Yes** | No — unless you want a single cross-link for search |
| **Governance spine** (same as research: batch split, wrong pending counts, id/trace/receipt mismatch) | **Yes** — one line + mark **cross-cutting** | **Yes** — that table remains the home for spine evidence |
| **Both** | One row each place, or one row here with “see research run *n*” | Yes |

| Date | Run | What confused / what we observed | Creative review / HUD copy | Slower than expected | Cross-cutting governance? |
|------|-----|-----------------------------------|----------------------------|----------------------|---------------------------|
| 2026-04-22 | 1 (Phase 5 v1 — first creative, full close) | **Validation:** Preflight + `pnpm rehearsal:creative-batch`. Batch **`1fe3b7b8`**, one container **3/3**, OpenClaw **connected**. **Execute:** item **2/3** only — proposal **`5cbe5f00-946b-4951-86a3-847fe778b88b`**, trace **`1e9019d4-59e0-43fd-bb68-59ef608958d1`** (HUD strip `1e9019d4`). **Receipt:** `system.note` **`Creative rehearsal 2: variant set (1fe3b7b8)`**, `2026-04-22T22:05:03.774Z` · artifact `…/5cbe5f00-946b-4951-86a3-847fe778b88b.md` — matches Today’s Activity + top of Executed Actions. **Items 1/3 and 3/3** were approved/queued but show **no** executed receipt for those ids in this paste (only **5cbe5f00** receipted). | — | — | **No** — id / trace / receipt cohere; creative markdown did not break the spine. |

---

## See also

- `scripts/creative-batch-rehearsal.ts`
- `scripts/research-batch-rehearsal.ts` (parallel shape)
- [Roadmap Phase 5](../roadmap/0003-operator-integration-phases.md#phase-5--add-the-second-specialist)
