---
title: "Activity layout v1 — implementation checklist (/activity only)"
status: living-document
category: strategy
owner: Ben Tankersley
related:
  - ./activity-screen-refactor-spec-v0.md
  - ./research-batch-v1-hero-buyer-and-proof.md
  - ../roadmap/0003-operator-integration-phases.md
---

# Activity layout v1 — implementation checklist (`/activity` only)

**Design bar:** **No scroll to do the job** (approve / execute / deny / step-up). Scroll only for **audit depth** (full trace, graph, long receipts), **diagnostics**, or **secondary** surfaces.

**Layout thesis:** **Queue as sun** · trace / receipt / pipeline as **orbit** · **diagnostics demoted** when healthy (green).

**Scope:** **`/activity` only** — do not change `/` in this pass unless a shared primitive forces it (prefer Activity-local wrappers).

---

## Build order (by file / concern)

### 1. Desktop two-column shell (queue main + proof rail)

| Step | File(s) | Notes |
|------|---------|--------|
| 1a | `src/app/activity/page.tsx` | Introduce a **responsive grid**: e.g. `lg:grid-cols-[minmax(0,1fr)_minmax(280px,20rem)]` with `gap-6`, `items-start`. Below `lg`, stay **single column** (stack rail under main or collapse rail into a toggle—pick one; default stack is simpler). |
| 1b | Same or `src/components/activity/ActivityPageShell.tsx` (optional) | Keep **`ApprovalQueueCountsProvider`** wrapping **attention banner + main queue column** so counts stay single-source. Avoid widening the provider to the whole page unless the rail also needs counts. |
| 1c | `src/components/OperationsRow.tsx` **or** Activity-only composition | Today `OperationsRow` is **two columns** (`ApprovalsPanel` \| `ExecutionTimeline`). For “pipeline in orbit,” choose one: **(A)** Add optional prop e.g. `railSlot?: ReactNode` and render timeline in the page rail from Activity, or **(B)** Add `variant="activity"` that stacks proposals full-width in main and exports timeline for the rail. **Do not** silently change home layout until variant is explicit. |
| 1d | **New:** `src/components/activity/ActivityProofRail.tsx` (name flexible) | **Right column:** compact **pipeline** (if moved out of `OperationsRow`), **active trace** summary via `useTraceContext()` from `src/context/TraceContext.tsx`, **link** to open Proof tab / focus timeline (`activityTraceHref` pattern from `src/lib/activity-trace-href.ts`). Receipt **snippet** can start as “last action from trace API” or a one-line placeholder until data is wired—ship structure first. |

### 2. Collapse green diagnostics (one deliberate disclosure)

| Step | File(s) | Notes |
|------|---------|--------|
| 2a | **New:** `src/components/activity/ActivityDiagnosticsDisclosure.tsx` | Wrap **`TrustPostureStrip`**, **`StatusStrip`**, **`OpenClawHealthBadge`** (Activity page currently renders these in `src/app/activity/page.tsx` after the queue). Use `<details>` or a small client toggle. **Default closed** when posture is “all green” (define minimal rule: e.g. ingress on + gate green + no integration checklist errors—reuse signals you already surface, even if v1 is heuristic). **Default open** when any signal is red/amber/mixed. |
| 2b | `src/components/TrustPostureStrip.tsx` | Only if you need a **compact one-line summary** prop for the closed state; otherwise keep strip full inside `<details>`. |
| 2c | `src/app/activity/page.tsx` | Replace loose vertical stack of diagnostics with the disclosure wrapper; keep **one** optional always-visible **micro-row** (e.g. “Trust: OK · Open Activity for details”) if you want zero clicks when green—keep it one line max. |

### 3. Graph + timeline behind “Proof” (audit depth)

| Step | File(s) | Notes |
|------|---------|--------|
| 3a | **New:** `src/components/activity/ActivityProofPanel.tsx` (client) | Tabbed or segmented control: e.g. **Graph** (`ActivityGraph`) \| **Timeline** (`TracePanel` in `Suspense`). Default tab: **Timeline** if `?trace=` present (read `useSearchParams` in this component or rely on existing `TraceProvider` URL behavior in `src/context/TraceContext.tsx`); else **Graph** or operator-chosen last tab in `sessionStorage`—keep rule simple. |
| 3b | `src/app/activity/page.tsx` | Move **`ActivityGraph`** + **`TracePanel`** out of the main scroll path into `ActivityProofPanel`; main column height should prioritize **`OperationsRow` / proposals**. |
| 3c | `src/components/ActivityGraph.tsx` | Optionally set a **max-height** + `overflow-auto` inside the tab panel so the graph never steals the viewport from the queue. |

### 4. Drafts / dev-ish material

| Step | File(s) | Notes |
|------|---------|--------|
| 4a | — | **`DraftsPanel` is not on `/activity` today** (`src/app/activity/page.tsx`). **No change required** unless you add dev tools here—then place them under **Proof** tab or a **“Dev / simulate”** `<details>` at the bottom, never above the queue. |

---

## Success checks (manual)

1. On a **13"** viewport at **100%**, complete **approve → execute** (or idle read) on **one proposal** without scrolling the **window** (minor internal scroll inside a tall proposal card is OK if unavoidable).  
2. **Diagnostics** closed when green: queue + rail visible without reading ten pills.  
3. **Proof** (graph + full timeline) reachable in **one** click from the default Activity view.  
4. **`/`** unchanged in behavior except shared components that accept an explicit **non-breaking** `variant` prop.

---

## Related

- [Activity screen refactor v0](./activity-screen-refactor-spec-v0.md) — transition plan and queue-first v0.  
- After this ships, add a short **“Activity layout v1”** note to v0 spec **Next** section pointing here.

---

## Implementation status (2026-05)

**Shipped in app (follow-up to checklist):**

- `src/app/activity/page.tsx` — `max-w-6xl`, two-column grid (`lg`), `OperationsRow layout="activity"`, diagnostics disclosure, `ActivityProofPanel` in `Suspense`.
- `src/components/OperationsRow.tsx` — `layout="activity"` → proposals column only; home unchanged (`default`).
- `src/components/activity/ActivityDiagnosticsDisclosure.tsx` — `<details>`; opens automatically when `GET /api/config` → `integrationIssues.length > 0` (else starts closed).
- `src/components/activity/ActivityProofRail.tsx` — pipeline + active trace snippet + `Proof → Timeline` / share link.
- `src/components/activity/ActivityProofPanel.tsx` — Graph \| Timeline tabs, max-height region; URL `?trace=` remounts body to Timeline default (`key` on inner body).
- `src/lib/activity-proof-ui.ts` — `ACTIVITY_PROOF_TAB_EVENT` for rail → panel focus.
