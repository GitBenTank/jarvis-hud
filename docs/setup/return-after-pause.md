# Return after a pause (operator)

**Purpose:** Recover honest context without redesigning. Use after time away from the stack.

**Related:** [Roadmap Phase 4 / 5](../roadmap/0003-operator-integration-phases.md) · [Research batch workflow v1](../strategy/research-batch-workflow-v1.md) · [Creative batch workflow v1](../strategy/creative-batch-workflow-v1.md)

---

## 1. Re-orient, don’t redesign

Read only enough to remember state:

- Roadmap **Phase 4** / **Phase 5** status
- [Research batch workflow v1](../strategy/research-batch-workflow-v1.md)
- [Creative batch workflow v1](../strategy/creative-batch-workflow-v1.md)

**Goal:** recover context, not invent a new direction.

---

## 2. Confirm the stack is still honest

```bash
pnpm rehearsal:preflight
```

If that fails, fix wiring before touching anything else.

---

## 3. Pick one of two paths

### Path A (default): cheap creative luck-check

- `pnpm rehearsal:creative-batch`
- Approve and **execute one** row
- Confirm **proposal id**, **trace**, **receipt**
- Add one **validation** or **friction** row to the [creative friction log](../strategy/creative-batch-workflow-v1.md) (table at bottom of that doc)

Use when you want to verify the second loop was not a fluke.

### Path B: new work only with a real reason

Open new work only if one of these is true:

- A **demo** is coming
- A **friction repeats**
- You want a **third specialist**
- You need **better authoring guidance**
- A **real product question** has appeared

---

## 4. If nothing bit you, stop

Do not expand just because the roadmap has more numbers.

**Explicit non-goals for a quiet return:**

- No new schema sprint
- No wallet work
- No autonomy work
- No phase inflation

---

## 5. If something did bite you

**Classify first:**

| Class | Examples |
|-------|------------|
| **Creative-only** | Variant scan, note length in Details |
| **Cross-cutting spine** | Batch truth, approve vs execute, receipt identity — also log [research friction](../strategy/research-batch-workflow-v1.md#friction-log-after-rehearsals) when appropriate |
| **Demo polish** | Copy, checklist, narrative |
| **New capability request** | Needs Thesis Lock check before building |

Then do the **smallest** fix that truthfully addresses it.

---

## Best default next session (cold start)

1. Run **preflight**
2. Do **one creative luck-check**, **log** the result
3. **Stop** unless reality gives a reason to continue

That is the least theatrical and most trustworthy next move.
