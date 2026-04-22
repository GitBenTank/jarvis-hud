# Research batch workflow v1 (first governed loop)

**Status:** Living — **Phase 4 v1 complete (2026-04)** on the blessed stack; this doc remains the **ongoing** runbook (preflight + reps + friction log). Stack + probes: [§1](../strategy/operating-assumptions.md#1-canonical-openclaw-deployment-for-this-project) / [§2](../strategy/operating-assumptions.md#2-auth-and-step-up-jarvis). [Roadmap closure](../roadmap/0003-operator-integration-phases.md#phase-4--operationalize-the-first-agent-loop).  
**Related:** [Agent team v1](./agent-team-v1.md) · [Creative batch workflow v1 (Phase 5)](./creative-batch-workflow-v1.md) · [ADR-0005: Batch v0](../decisions/0005-agent-team-batch-v0-per-item-execute.md) · [Thesis Lock](./jarvis-hud-video-thesis.md#thesis-lock-do-not-drift) · [OpenClaw proposal contract](../architecture/openclaw-proposal-identity-and-contract.md) · [Operator checklist](../setup/openclaw-jarvis-operator-checklist.md) · [Roadmap Phase 4](../roadmap/0003-operator-integration-phases.md#phase-4--operationalize-the-first-agent-loop)

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
    "title": "Rehearsal batch — research only — 2026-04-22 14:14 (or run label / topic slug / id fragment)",
    "summary": "Optional one-paragraph batch abstract (what this run is for — not a substitute for per-item bodies)",
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

## Phase 3a — rehearsal authoring (minimal)

**Scope:** Narrow guidance so operators can tell **one rehearsal batch from the next** in the HUD and Activity without new schema or ingest machinery. Expand only when another authoring pain **recurs** in the [friction log](#friction-log-after-rehearsals).

### Batch title (required discipline for rehearsals)

**`batch.title` must include a short differentiator** in addition to any theme text. Pick at least one (combine if helpful):

- Run label (e.g. `run 6`, `pressure-7`)
- Date/time (local or UTC, as long as it is **unique per session** you care about)
- Topic slug (e.g. `competitor-pricing`)
- First 8 characters of `batch.id` (already unique; fine to append in parentheses)

Examples (unambiguous, not “pretty”):

- `Rehearsal batch — research only — run 6`
- `Research rehearsal — 2026-04-22 14:14`
- `Rehearsal — competitor-pricing — a1b2c3d4`

**Anti-pattern:** Reusing the same `batch.title` across runs (e.g. every batch titled `Rehearsal batch — research only`). That collides in the UI and raises scan cost; the HUD cannot reliably invent a better title for you.

### Title and summary patterns (light)

| Field | Role | Pattern |
|-------|------|--------|
| `batch.title` | Review container headline | Theme + **differentiator** (see above) |
| `batch.summary` | One paragraph: intent of this batch | What this run is testing or delivering; scope, not per-item findings |
| `title` (per item) | Queue / row headline | Short, specific to **this** item; include item index or topic slice if it helps scan |
| `summary` (per item) | One line under headline | Single takeaway or claim — what this row is arguing |

### `system.note` body and sources

- Put the substantive memo in **`payload.note`** (markdown).
- Include a **`## Sources`** section with links or citations **per item** (each item’s note carries its own sources).
- Keep tone **research memo**: structured sections, no execution language (“posting now”, “I will send”).

### Batch-level vs item-level prose

- **Batch (`batch.title` / `batch.summary`):** Why this batch exists, run label, constraints (e.g. research-only, N items). Not the place for long citations or item-level findings.
- **Item (`title` / `summary` / `payload.note`):** The finding, evidence, and **Sources** for that proposal row. If only one item needs an extra caveat, put it in **that** item’s note, not in `batch.summary`.

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
| **Governance usability** | They can find the right **batch** and hold **one proposal id** through approve → execute → trace → receipt without reread or doubt; surrounding Activity/receipt noise stays **noisy**, not **confusing** |

---

## Implementation checklist (repo + operator)

- [x] OpenClaw workspace / runner: emit **`n`** signed proposals with valid **`batch`** and structured **`note`** (e.g. `pnpm rehearsal:research-batch` + real OpenClaw).
- [x] Confirm all items appear under one **Review container** in **Agent Proposals** (per `batch.id`; see friction log if split-card recurrence).
- [x] Run **Approve → Execute** on at least one item; confirm **receipt** and **trace** for that **`id`** only.
- [x] Append friction notes to [Friction log](#friction-log-after-rehearsals) after each rehearsal (include **validation** rows, not only pains).

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

**Next is repetition, observation, and logging** — use [Phase 3a](#phase-3a--rehearsal-authoring-minimal) for batch naming and light field patterns; add broader templates only when the [friction log](#friction-log-after-rehearsals) proves another recurring pain.

1. **`pnpm rehearsal:preflight`**
2. **`pnpm rehearsal:research-batch`** (default **3** items). Pressure test: **`RESEARCH_BATCH_ITEM_COUNT=6 pnpm rehearsal:research-batch`** (or **5–7**; same shape — **N** signed POSTs, shared `batch.id`).
3. In **HUD:** approve rows as needed
4. **Execute exactly one** row
5. **Verify** proposal **id**, **trace** id, and **receipt** for that id only
6. **Write down every annoyance** in the friction log (even small ones)

### Next session focus (demo polish)

Prefer **demo polish through continued Phase 4 reps**, not [Phase 5](../roadmap/0003-operator-integration-phases.md#phase-5--add-the-second-specialist) prep, until the first loop is **boringly reliable**.

**Single concrete action** the next time you touch the stack: run one **short** rehearsal (preflight + default **3-item** batch is enough) and deliberately watch for a **second sighting** of an open friction. Likely candidates:

- **Duplicate review-container behavior** (one logical batch appearing as multiple cards).
- **Integration-banner confusion** (banner reads like failure while ingress / receipts / checklist say the governed path is fine).

Record the outcome in the [friction log](#friction-log-after-rehearsals): a recurrence worth fixing, a calm “nothing repeated,” or a short **validation** row. That stays in the productive zone: no premature expansion, no abandoned observation loop, and no roadmap-driven agent proliferation before the first loop is truly boring.

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

**Log anything that feels:** ambiguous · repetitive · too manual · easy to misread · easy for an **agent to author incorrectly** · annoying enough that you’d be tempted to “helpfully” automate it. **Also log *governance usability* friction:** the UI is technically correct but makes you **reread**, **re-orient**, or **doubt which item you just ran** — that is the early form of **audit fatigue**, not mere aesthetics. That list is the raw material for Phase 3 (templates, copy, guardrails) — [Phase 3](../roadmap/0003-operator-integration-phases.md#phase-3--standardize-proposal-authoring) wakes up when rows **cluster**, not when the roadmap feels idle.

### 5. When Phase 3 earns attention

**Narrow Phase 3a** (batch disambiguation + field patterns) is [documented above](#phase-3a--rehearsal-authoring-minimal) and grounded in repeated “samey batch title” friction. **Broader** Phase 3 work ([roadmap](../roadmap/0003-operator-integration-phases.md#phase-3--standardize-proposal-authoring)) should still follow **evidence**: expand templates only when this ritual produces **honest friction log entries** for a **new** recurring issue. Templates should **prevent what you actually saw**, not what you imagined might go wrong.

**Creative agent v1** ([Phase 5](../roadmap/0003-operator-integration-phases.md#phase-5--add-the-second-specialist)) stays after the research loop feels boringly reliable and Phase 3 is grounded.

---

## Friction log (after rehearsals)

Append a row after **each** run (or each day). This is the **evidence base** for Phase 3 templates and HUD copy — not new policy layers. Empty log + heavy templates = imagination; repeated rehearsals + rows = reality. A **minimal row** (“nothing bit me”) still proves the ritual happened; a blank table can pretend it didn’t. **Positive validation rows** belong here too — when a change (e.g. Phase 3a) measurably helps, record it beside the frictions so the log does not become only a catalog of pains.

**Governance usability / audit fatigue:** If you had to **hunt** for the batch fragment, **lost the proposal id** between Execute and receipt, or **confused** long Activity history with the one story you care about — write that down. Those symptoms mean the control plane is sliding toward **filing-cabinet** behavior even when the ledger is right.

**Phase 3 bar:** Treat an item as **Phase 3–worthy** when the **same** annoyance shows up **twice** — pattern, not a one-off. First occurrence: log it; second occurrence: prioritize template / copy / guardrail work.

**If logged items recur — suggested fix priority (truth first):**

1. **Duplicate review containers** for one batch — threatens **truthfulness** (one batch vs two). *Still open until recurrence drives a fix.*
2. **Safety gate vs queue state** — threatened **truthfulness** (e.g. “Pending approval” when rows were already **APPROVED**). **Fixed** in `SafetyGatePanel` (see **Resolved in code** below).
3. **OpenClaw disconnected / no recent activity** while ingress and receipts are still coherent — **partially addressed:** `idle` health state + amber recency banner + honest copy (see runs 2–4). If **time-source** mismatch (e.g. “idle” vs “last proposal 1m ago”) **recurs**, log again.
4. **Same rehearsal titles every run** — **scanability**; **Phase 3a** adds the batch-title differentiator rule; log again if collisions persist after following it.
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
| 2026-04-18 | 4 (HUD browser audit) | **RECURRENCE (#3):** Amber integration strip — **“Integration appears disconnected or stale”** / **OPENCLAW: no recent activity (5+ minutes)** while checklist still shows **receive path ready**, proposals show **verified** + **Ingress: passed**, and **last proposal** timestamp is recent on disk. | Same class as 2026-04-22 runs: connector-activity heuristic reads as **failure** when the governed path is **working**. | Operator must re-learn “ignore the banner” — corrosive. | Reconcile banner severity with ingress/health probe or rename to **signal lag** / **idle** vs **disconnected**. |
| 2026-04-18 | 4 | Mission strip **Queue: 0** while **Authorized (Awaiting Execution)** lists **multiple** rows with **Execute**. | **“Queue”** currently tracks **pending approval** only, not **approved-not-executed** — reads like “nothing waiting” when work **is** waiting. | Extra mental decode | Rename strip to **Pending approval: n** or add **Awaiting execution: m** beside it. |
| 2026-04-18 | 4 | **Three** “Review container” cards with the **same** visible title (**Rehearsal batch — research only**) and overlapping **Batch item k / 3** labels (**two** distinct proposals both **2/3**, different trace ids — likely **different `batch.id`** from separate runs, not one split batch). | Title collision hides **which batch** is which; duplicates **batch slot** copy across batches. | Scanning + fear of double-executing the “same” item | Show **`batch.id` short fragment** in the container header when `batch.title` matches another visible group; or dedupe/archive old batches in dev HUD. |
| 2026-04-18 | 4 | Duplicate **Agent Proposals** headings (**Agent Proposals** + **Agent Proposals (date)**). | Minor clutter / “two sections?” | — | Merge headings or make the second a subtitle pattern only. |
| 2026-04-18 | 4 | (Dev only) **Next.js “hydration error”** overlay in **Cursor IDE browser** (`data-cursor-ref` mismatch). | Not necessarily Jarvis — tooling injected attributes. | Noise during automated HUD review | Ignore for product triage; use a clean Chromium session for screenshot evidence. |
| 2026-04-22 | 5 | **6-item pressure (`fc5d38a2`):** **Batch id** surfaced instantly; **1/6** left **pending** then approved; receipts **per proposal id**. **Activity** long but mappable. **Clock recurrence:** OpenClaw badge **~24m** vs strip **~5m** “last proposal” — **root cause:** strip used **newest ledger row (any origin)**; health uses **OpenClaw connector only** (e.g. **simulate** rows have no `source.connector`). **Fixed in code:** `runtimePosture.lastOpenClawProposalAt` + strip labels **Last OpenClaw ingress** vs **Newest ledger row**. | — | — | — |
| 2026-04-22 | 6 (**Phase 3a validation**) | **Positive validation — nothing wrong:** 6-item batch **`94b159ef`** after [Phase 3a](#phase-3a--rehearsal-authoring-minimal) (ISO-minute + id fragment in `batch.title`, fragment on item titles). Differentiated titles **reduced scan cost**; **batch findability** improved vs samey headers on older runs; **Activity / receipt mapping** stayed legible for the new run. | — | — | **Cost:** slightly longer strings — **acceptable** for rehearsal; older ledger rows without differentiator remain heterogeneous (expected). **Phase 3a** sufficient for this pain for forward submissions. |
| 2026-04-22 | 7 ([demo polish / next session](#next-session-focus-demo-polish)) | **Short rehearsal (`91432998`, 3 items) + operator close:** Ingress / HUD: one container for this `batch.id` at ingest (**3 of 3**); **OpenClaw: Connected**; no false “disconnected” banner. **Execute one:** item **1/3** (`f394be28`, trace `3ff7daa3`) → receipt + Today’s Activity + executed list aligned on **`Research rehearsal 1: sample finding (91432998)`**. **Rejected** item **3/3**; item **2/3** left **approved / awaiting execution** (strip: Awaiting execution **7** across batches). **Note:** Authorized section later showed **1 of 3** for this batch — rows left the queue after execute/reject, not a split-batch recurrence. | — | — | **Validation** — [second-sighting](#next-session-focus-demo-polish) calm; Phase 3a titles trace through Activity/receipts; legacy batches still generic headers. |
| 2026-04-22 | 8 (**post-pause rehearsal**) | **Validation:** **Post-pause** light demo polish. **Preflight** pass. **Batch `562185e5`** (3 items): **one** clean review container (**3 of 3**). **OpenClaw** activity **connected** and aligned with ingress. **No new friction.** | — | — | **Stability** — loop remains **boring** after time away (evidence it is stable, not only familiar). |
_(Example: “Execute button proximity to batch header”, “Activity line used batch title instead of proposal id”, “OpenClaw compose: forgot itemCount”.)_

**Evidence:** 2026-04-22 HUD screenshots (runs 2–3: review containers, safety strip, receipts, activity, trace). Browser often `localhost:3000`; Phase 1 prefers `127.0.0.1` — note for local consistency.

**Resolved in code (after 2nd occurrence, priority #2):** `SafetyGatePanel` no longer labels **approved-but-not-executed** rows as “Pending approval” / “Approve (n)”. Amber state now uses **Awaiting execution (n)** / **Execute (n)** when `pendingCount === 0` and `awaitingExecutionCount > 0`, and a split message when both are non-zero.

**Resolved in code (priority #3 / queue / batch headers, 2026):** OpenClaw health **`idle`** (recency, not disconnected), **amber** integration banner + **INTEGRATION_RULE_OPENCLAW_RECENCY_SIGNAL** when only `OPENCLAW_STALE`, mission strip **Pending approval** / **Awaiting execution**, review-container **Batch id** fragment + **First ingested**, aligned **OperationsRow** / **SystemStatus** / **Agent Proposals** empty copy.

**Resolved in code (clock coherence, 2026):** **`runtimePosture.lastOpenClawProposalAt`** from **`scanOpenClawRecentSignals()`** (same source as OpenClaw health). **StatusStrip** / **SystemStatus** show **Last OpenClaw ingress** vs **Newest ledger row** so simulate / non-OpenClaw rows no longer contradict the badge.

---

## See also

- `src/lib/proposal-batch.ts` — ingress validation and grouping helpers  
- `src/app/api/ingress/openclaw/route.ts` — persistence of normalized `batch`  
- [Agent team v1](./agent-team-v1.md) — roles and phased expansion after this loop  
