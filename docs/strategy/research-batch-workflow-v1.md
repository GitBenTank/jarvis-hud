# Research batch workflow v1 (first governed loop)

**Status:** Living — Phase 4 rehearsal runbook (stack + probes frozen in [§1](../strategy/operating-assumptions.md#1-canonical-openclaw-deployment-for-this-project) / [§2](../strategy/operating-assumptions.md#2-auth-and-step-up-jarvis))  
**Related:** [Agent team v1](./agent-team-v1.md) · [ADR-0005: Batch v0](../decisions/0005-agent-team-batch-v0-per-item-execute.md) · [Thesis Lock](./jarvis-hud-video-thesis.md#thesis-lock-do-not-drift) · [OpenClaw proposal contract](../architecture/openclaw-proposal-identity-and-contract.md) · [Operator checklist](../setup/openclaw-jarvis-operator-checklist.md) · [Roadmap Phase 4](../roadmap/0003-operator-integration-phases.md#phase-4--operationalize-the-first-agent-loop)

---

## Purpose

Prove **one production-shaped loop** before adding roles, tools, or dashboards:

1. OpenClaw emits a **research-only** batch (no side effects).
2. Ingress accepts and stores items with strict **`batch`** metadata.
3. Operators review in **Jarvis HUD** (grouping + per-item clarity).
4. Operators **approve and execute per item**; execution produces **normal receipts** for a safe kind.

This doc is the **workflow contract** for that loop. It does not add wallet, publish, send, auto-spend, or autonomous loops.

---

## Scope (v1)

| In scope | Out of scope (explicit) |
|----------|---------------------------|
| 3–5 research items as separate ingress submissions | Single POST with multiple payloads (not supported by ingress today) |
| Shared top-level `batch` on every item | `batch` inside `payload` (rejected at ingress) |
| `kind` that is allowlisted and **safe** to execute after approval | `content.publish`, `send_email`, `code.apply`, ad spend, wallet |
| Per-item **Approve** then **Execute** | Batch-level execute or implied consent |
| Operator friction notes after a few runs | Creative agent, scoring, metrics dashboards |

---

## Kind choice (until `research.*` exists)

**v1:** Use **`system.note`** for each research item.

- **Rationale:** Already allowlisted for ingress and execute; receipts and trace behavior exist; no policy or schema sprint required to start the loop.
- **Discipline:** Treat each note as a **research memo candidate**: structured body, explicit sources, no execution language (“I will send…”, “posting now…”).

**Later:** A dedicated kind (e.g. `research.digest`) can tighten validation and UI labels; promote when the loop is stable.

---

## Compose-time shape (OpenClaw)

### Batch metadata (shared across items)

Use one **`batch.id`** (e.g. UUID) for the whole run. Optional **`batch.title`** / **`batch.summary`** describe the **review container** for humans (not a substitute for per-item titles).

Per item **`i`** of **`n`** (3 ≤ **n** ≤ 5, and **n** ≤ ingress cap `INGRESS_BATCH_MAX_ITEM_COUNT`):

```json
{
  "batch": {
    "id": "<uuid>",
    "title": "Optional batch theme for HUD",
    "summary": "Optional one-paragraph batch abstract",
    "itemIndex": <i>,
    "itemCount": <n>
  },
  "kind": "system.note",
  "title": "<short item headline — appears in queue>",
  "summary": "<one line — what this item argues or finds>",
  "payload": {
    "note": "<markdown body; include a '## Sources' section with links or citations>"
  },
  "source": { "connector": "openclaw" },
  "agent": "<coordinator label>"
}
```

**Submission pattern:** **`n`** separate **`POST /api/ingress/openclaw`** calls (same HMAC rules each time), identical `batch.id` and `itemCount`, distinct `itemIndex` and per-item `title` / `summary` / `note`.

**Research-only:** No other kinds in the batch; no patches, no email, no publish fields.

---

## Human review (success criteria)

Operators should be able to:

- Scan the **batch** summary block in the HUD (**review container** copy).
- Open **Details** per item and see **Approve ≠ Execute** and item-level batch position.
- **Approve** items worth keeping; **reject** or ignore others — without executing anything.
- **Execute** only chosen items, with expectation of **one receipt per executed item**.

If operators confuse batch grouping with permission to run everything, treat that as a **UX bug** against [ADR-0005](../decisions/0005-agent-team-batch-v0-per-item-execute.md), not as operator error.

---

## Promotion path v1 (governed, no boundary collapse)

**Definition:** “Promotion” here means **persisting approved cognitive work through the existing execute path**, not auto-forking side effects.

For each approved research item:

1. Operator clicks **Execute** on that row’s proposal (that row’s **`id`**).
2. **`system.note`** adapter runs and writes artifacts / logs per existing behavior.
3. **Receipt** is **per item**, same as any other executed proposal.

**Not in v1:** Auto-creating a second proposal (e.g. outbound draft) from an executed note without a new human-approved proposal. That can be a **v2** “promote to creative brief” step once this loop is boringly reliable.

---

## Evaluation rubric (after a few runs)

Answer honestly and adjust compose prompts or HUD copy — not policy — first:

| Question | What “good” looks like |
|----------|------------------------|
| Batch size (3–5) | Enough context; not so many rows that triage feels heavy |
| Per-item execute | Acceptable click cost; if not, design **explicit** batch conveniences that still expand to **per-item execute + receipt** (never bundle consent) |
| Titles / summaries | Queue scannable without opening every detail |
| Operator understanding | They can state what **will** run on Execute and what **will not** |
| Verbosity | Agent output fits `system.note` limits and ingress caps; citations present but not noisy |

---

## Implementation checklist (repo + operator)

- [ ] OpenClaw workspace / runner: emit **`n`** signed proposals with valid **`batch`** and structured **`note`**.
- [ ] Confirm all items appear under one **Review container** in **Agent Proposals**.
- [ ] Run **Approve → Execute** on at least one item; confirm **receipt** and **trace** for that **`id`** only.
- [ ] Append friction notes to [Friction log](#friction-log-after-rehearsals) after each rehearsal.

---

## Phase 4 rehearsal protocol (boring repeatability)

Use the **blessed stack** only ([local stack startup](../setup/local-stack-startup.md)). Goal: the loop is **calm and literal** — no interpretive “did the batch run?” narrative.

### 0. Preflight (every session)

With **Jarvis** and **OpenClaw gateway** running:

```bash
cd /path/to/jarvis-hud
pnpm rehearsal:preflight
```

This runs **`pnpm machine-wired`** then **`pnpm auth-posture`**. Fix failures before submitting proposals. (Serious-mode hosts: `JARVIS_EXPECT_AUTH=true pnpm auth-posture` if you require auth on.)

### Operator loop (every pass — do this now)

**Next is repetition, observation, and logging** — not more design or abstractions until the [friction log](#friction-log-after-rehearsals) earns Phase 3.

1. **`pnpm rehearsal:preflight`**
2. **`pnpm rehearsal:research-batch`** (3-item quick path; for **5–7** items, same compose shape — **N** signed POSTs, shared `batch.id` — from OpenClaw or a one-off runner)
3. In **HUD:** approve rows as needed
4. **Execute exactly one** row
5. **Verify** proposal **id**, **trace** id, and **receipt** for that id only
6. **Write down every annoyance** in the friction log (even small ones)

### 1. Submit a 3-item research batch

- **3** × `system.note`, **one shared `batch.id`**, **`itemCount`: 3**, **`itemIndex`**: 0, 1, 2.
- **3** separate signed **`POST /api/ingress/openclaw`** (strict ingress; no `batch` inside `payload`).

**Quick path:** `pnpm rehearsal:research-batch` (uses `.env.local`; base URL defaults to **`http://127.0.0.1:3000`** — align with your listening port).

Note terminal **`id`** / **`traceId`** per item for later comparison in the HUD.

### 2. In the HUD (operator)

- One **review container** groups all three rows; **Proposal id** and **Trace id** stay legible in **Details** (per row).
- **Approve** any rows you want eligible; **Execute exactly one row** (that row’s **Execute** only).

**Success bar:** the operator never has to **guess** which proposal executed. If copy implies “the batch ran,” file a UX bug (batch is advisory; execution is per [ADR-0005](../decisions/0005-agent-team-batch-v0-per-item-execute.md)).

### 3. Verify (hard checks)

| Check | Pass |
|--------|------|
| Receipt / activity | Tied to **one** executed **proposal `id`** only |
| Non-executed rows | No receipt implying they ran |
| Trace / activity wording | Per **id**, not “batch completed” |
| IDs | **Proposal id** and **trace id** still readable after execute |

### 4. Repeat (volume + what to watch for)

- **Aim for patterns, not anecdotes:** several passes with **3-item** batches, then **graduate** to at least one **5–7** item batch (within ingress limits), same discipline: **one executed row** per run unless you deliberately vary the exercise.
- Run on the **locked stack** only; resist new machinery until irritations are logged.

**Log anything that feels:** ambiguous · repetitive · too manual · easy to misread · easy for an **agent to author incorrectly** · annoying enough that you’d be tempted to “helpfully” automate it. That list is the raw material for Phase 3 (templates, copy, guardrails) — [Phase 3](../roadmap/0003-operator-integration-phases.md#phase-3--standardize-proposal-authoring) wakes up when rows **cluster**, not when the roadmap feels idle.

### 5. When Phase 3 earns attention

The next **paper** phase to wake up is [Phase 3 — standardize proposal authoring](../roadmap/0003-operator-integration-phases.md#phase-3--standardize-proposal-authoring) — **only after** this ritual has run **enough times** to produce **honest friction log entries** (especially wording and compose-time / authoring mistakes). Templates and guidance should **prevent what you actually saw**, not what you imagined might go wrong.

**Creative agent v1** ([Phase 5](../roadmap/0003-operator-integration-phases.md#phase-5--add-the-second-specialist)) stays after the research loop feels boringly reliable and Phase 3 is grounded.

---

## Friction log (after rehearsals)

Append a row after **each** run (or each day). This is the **evidence base** for Phase 3 templates and HUD copy — not new policy layers. Empty log + heavy templates = imagination; repeated rehearsals + rows = reality. A **minimal row** (“nothing bit me”) still proves the ritual happened; a blank table can pretend it didn’t.

**Phase 3 bar:** Treat an item as **Phase 3–worthy** when the **same** annoyance shows up **twice** — pattern, not a one-off. First occurrence: log it; second occurrence: prioritize template / copy / guardrail work.

**If logged items recur — suggested fix priority (truth first):**

1. **Duplicate review containers** for one batch — threatens **truthfulness** (one batch vs two). *Still open until recurrence drives a fix.*
2. **Safety gate vs queue state** — threatened **truthfulness** (e.g. “Pending approval” when rows were already **APPROVED**). **Fixed** in `SafetyGatePanel` (see **Resolved in code** below).
3. **OpenClaw disconnected / no recent activity** while ingress and receipts are still coherent — after (2), this is the **next most corrosive**: persistent **false-bad** status teaches operators that warnings are **melodramatic and ignorable**. A control plane can survive being occasionally **incomplete**; it does not survive long if it trains people to dismiss its signals. Operator checklist already says to trust Activity for ingress truth; reconcile or soften the banner when recurrence on a **clean pass** justifies a change.
4. **Same rehearsal titles every run** — **scanability**; Phase 3 templates when patterns warrant.
5. **Approval-time safety snapshot** (“NO SNAPSHOT RECORDED” on trace) — **watch**; one sighting is not yet a pattern; log again if it clusters.

Until recurrence, **log only** — then fix without mercy once a pattern is proven.

When entries **cluster**, bring them to a design pass: templates, copy changes, or ingest guardrails — still grounded in what you observed.

| Date | Run | What confused the operator | Copy / UI to tighten | Slower than expected | Template / automation candidate (Phase 3) |
|------|-----|----------------------------|----------------------|----------------------|-------------------------------------------|
| 2026-04-18 | 1 | Nothing material on first pass (baseline). | — | — | — |
| 2026-04-22 | 2 | One logical batch appeared as **two** “REVIEW CONTAINER” blocks (e.g. 1-of-3 items in one card, 2-of-3 in another). | Clarify whether split is intentional; if so, label parts; if not, group in one container. | Scanning two containers for the same `batch.id` | — |
| 2026-04-22 | 2 | **OpenClaw: Disconnected** / no recent activity banner while signed ingress and executes still work. | Operator mental model: trust Activity + receipts; banner is connector health lag (see checklist). Still feels like an error. | — | — |
| 2026-04-22 | 2 | Top strip said **“Approve (3)”** / pending while proposal cards already showed **APPROVED** and **Execute**. | Reconcile safety gate counts with queue state so strip matches what the operator sees. | — | — |
| 2026-04-22 | 2 | Same rehearsal **titles** every run (“Research rehearsal *n*: sample finding”) — hard to tell batches apart in Activity/receipts. | — | Scanning history across runs | Include **batch title** or short `batch.id` fragment in compose template / titles |
| 2026-04-22 | 3 | **RECURRENCE (fix eligible — priority #2):** Safety gate **“Pending approval (4)”** / “Approve (4) items” while **Execution Authority** shows **Pending: 0**, **Approved: 4** (same class as run 2’s “Approve (3)” vs approved cards). | Reconcile amber strip with live pending count. | — | — |
| 2026-04-22 | 3 | **RECURRENCE (#3):** OpenClaw disconnected / no recent activity while ingress + receipts still coherent. | — | — | — |
| 2026-04-22 | 3 | Activity trace: **Approval-time safety snapshot** — “NO SNAPSHOT RECORDED” (first log). | Document or implement when snapshot is expected vs N/A for `system.note`. | — | — |

_(Example: “Execute button proximity to batch header”, “Activity line used batch title instead of proposal id”, “OpenClaw compose: forgot itemCount”.)_

**Evidence:** 2026-04-22 HUD screenshots (runs 2–3: review containers, safety strip, receipts, activity, trace). Browser often `localhost:3000`; Phase 1 prefers `127.0.0.1` — note for local consistency.

**Resolved in code (after 2nd occurrence, priority #2):** `SafetyGatePanel` no longer labels **approved-but-not-executed** rows as “Pending approval” / “Approve (n)”. Amber state now uses **Awaiting execution (n)** / **Execute (n)** when `pendingCount === 0` and `awaitingExecutionCount > 0`, and a split message when both are non-zero.

---

## See also

- `src/lib/proposal-batch.ts` — ingress validation and grouping helpers  
- `src/app/api/ingress/openclaw/route.ts` — persistence of normalized `batch`  
- [Agent team v1](./agent-team-v1.md) — roles and phased expansion after this loop  
