# Research batch workflow v1 (first governed loop)

**Status:** Draft — concrete runbook for the first **narrow end-to-end** agent loop  
**Related:** [Agent team v1](./agent-team-v1.md) · [ADR-0005: Batch v0](../decisions/0005-agent-team-batch-v0-per-item-execute.md) · [Thesis Lock](./jarvis-hud-video-thesis.md#thesis-lock-do-not-drift) · [OpenClaw proposal contract](../architecture/openclaw-proposal-identity-and-contract.md) · [Operator checklist](../setup/openclaw-jarvis-operator-checklist.md)

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
- [ ] Record friction notes in this doc or a short run log (optional appendix).

---

## First live rehearsal (do this next)

Design is sufficient; **validate the loop in the real stack**. One batch, minimal scope.

**Setup**

- **3** research items (`system.note`), **one shared `batch.id`**, **`itemCount`: 3**, **`itemIndex`**: 0, 1, 2.
- **N separate** signed **`POST /api/ingress/openclaw`** (same batch metadata pattern as above).
- **Quick path:** with dev server up and `.env.local` configured, run **`pnpm rehearsal:research-batch`** (loads secrets via `--env-file=.env.local`).

**In the HUD**

- Confirm **one review container** groups all three; scan batch title/summary and per-item headlines.
- **Approve** as needed; **execute only one item** (one row’s **Execute** / Details flow).

**Verify (not only “it didn’t error”)**

- **Receipt** exists for **that item’s** approval id only — not for the whole batch.
- **Trace** / activity tells the truth for that id; no wording that implies “the batch ran.”
- **Operator honesty:** authoring felt natural, review felt honest, **Execute** felt clearly separate from **Approve**, and post-run narrative matched what actually ran.

**After a clean pass**

1. Second run with **5–7** items (still within ingress batch limits).
2. **Minor wording / UX** fixes from friction notes only.
3. **Reusable OpenClaw submission template** (compose-time).
4. Then **creative agent v1** — not before the research loop feels boringly reliable.

---

## See also

- `src/lib/proposal-batch.ts` — ingress validation and grouping helpers  
- `src/app/api/ingress/openclaw/route.ts` — persistence of normalized `batch`  
- [Agent team v1](./agent-team-v1.md) — roles and phased expansion after this loop  
