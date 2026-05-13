---
title: "Activity — trace URL vs latest-receipt card (scope collision fix spec)"
status: living-document
category: strategy
owner: Ben Tankersley
related:
  - ./activity-layout-v1-implementation-checklist.md
  - ./research-batch-v1-buyer-proof-demo-pass.md
  - ./research-batch-workflow-v1.md
---

# Activity — trace URL vs latest-receipt card (scope collision fix spec)

## Problem (comprehension)

When **`/activity?trace=<id>`** points at **one** proposal’s story but **Agent Proposals** showed a **different** executed row (always **latest-by-time**), observers **merged two scopes into one** and doubted the product or the data.

**Residual risk (narrower):** mismatch between **selected trace** (URL + timeline + proof rail) and **today’s loaded approvals** when the URL trace is **not** in that set (e.g. wrong calendar day for `GET /api/approvals`, typo, or trace not yet executed).

## Smallest fixes (try in order)

### 1. Rename copy (**shipped** in `AgentProposalsFeed.tsx`)

**File:** `src/components/AgentProposalsFeed.tsx`  

- Replaced “most recent completed execution” / “Last execution” with **latest completed receipt** and clarified it is **this queue**, not necessarily `?trace=`.

### 2. Receipt card follows `?trace=` when it matches an executed row (**shipped**)

**Files:** `src/lib/executed-receipt-card-selection.ts`, `src/components/ApprovalsPanel.tsx`, `src/components/AgentProposalsFeed.tsx`

- When the queue is empty of pending work and the address bar has **`?trace=`**, the **Agent Proposals** receipt card prefers the **executed** event whose `traceId` (or legacy `id`) matches the URL (case-insensitive), instead of always showing the chronologically latest execution.
- **Amber banner** only when the URL trace does **not** match any executed row in the **loaded day’s** approvals list (wrong day, typo, or not executed yet) — the card then falls back to the latest completed receipt and explains why.

### 2b. ~~Mismatch cue when `?trace=` ≠ card’s trace~~ (superseded by §2)

Previously: amber whenever URL ≠ latest-by-time card. That is removed for the common case now that the card follows the URL when possible.

### 3. Richer “Viewing trace …” line (optional next)

**Files:** `src/components/TracePanel.tsx`, `src/components/activity/ActivityProofRail.tsx`, or a thin strip above the proof tabs on `src/app/activity/page.tsx`.  

- Derive short human copy from loaded trace (e.g. **rejected · item 2/3**, **executed · item 3/3**) from `traceData` + proposal payload / batch metadata.  
- Keep to **one line**; avoid a second dashboard.

### 4. Visual separation (only if 1–3 insufficient)

- Light divider or subheading grouping: **“Queue (today)”** vs **“Selected trace (URL)”** — still one column; no new routes.

## Success check

A stranger with **`?trace=`** open sees the **same executed receipt** in the Agent Proposals card as in the address bar when that trace exists in today’s loaded approvals. If the banner appears, it reads as a **real fallback** (trace missing from this day’s executed set), not a routine “you clicked the wrong link” scold.

## Friction log

If this came from a buyer-proof session, also append a row to [Research batch workflow — friction log](./research-batch-workflow-v1.md#friction-log-after-rehearsals).
