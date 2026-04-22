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

### 4. Repeat

- Run the same protocol **multiple times** on the locked stack before adding governance machinery.
- Then increase load: **5–7** items (within ingress batch limits), same per-item execute discipline.

### 5. After Phase 3 (templates)

- **Reusable OpenClaw submission template** (compose-time) — only after friction is captured here.
- **Creative agent v1** — only after this loop feels boringly reliable.

---

## Friction log (after rehearsals)

Append a row after **each** run (or each day). This feeds Phase 3 templates and HUD copy — not new policy layers.

| Date | Run | What confused the operator | Copy / UI to tighten | Slower than expected | Template / automation candidate (Phase 3) |
|------|-----|----------------------------|----------------------|----------------------|-------------------------------------------|
| | | | | | |

_(Example: “Execute button proximity to batch header”, “Activity line used batch title instead of proposal id”, “OpenClaw compose: forgot itemCount”.)_

---

## See also

- `src/lib/proposal-batch.ts` — ingress validation and grouping helpers  
- `src/app/api/ingress/openclaw/route.ts` — persistence of normalized `batch`  
- [Agent team v1](./agent-team-v1.md) — roles and phased expansion after this loop  
