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

When **`/activity?trace=<id>`** points at **one** proposal’s story (e.g. **rejected** item 2/3) but **Agent Proposals** still shows **“latest completed execution”** for a **different** item (e.g. executed 3/3), observers **merge two scopes into one** and doubt the product or the data.

**Risk:** not the rejected trace — the **scope collision** between:

- **Selected trace** (URL + timeline + proof rail), and  
- **Queue summary card** (“what happened most recently in the approvals ledger”).

## Smallest fixes (try in order)

### 1. Rename copy (**shipped** in `AgentProposalsFeed.tsx`)

**File:** `src/components/AgentProposalsFeed.tsx`  

- Replaced “most recent completed execution” / “Last execution” with **latest completed receipt** and clarified it is **this queue**, not necessarily `?trace=`.

### 2. Mismatch cue when `?trace=` ≠ card’s trace (**shipped** in `AgentProposalsFeed.tsx`)

- `useSearchParams()` + optional prop `urlTraceId`; amber banner when URL trace ≠ `lastExecutedProposal` trace/id.

### 3. Richer “Viewing trace …” line (optional next)

**Files:** `src/components/TracePanel.tsx`, `src/components/activity/ActivityProofRail.tsx`, or a thin strip above the proof tabs on `src/app/activity/page.tsx`.  

- Derive short human copy from loaded trace (e.g. **rejected · item 2/3**, **executed · item 3/3**) from `traceData` + proposal payload / batch metadata.  
- Keep to **one line**; avoid a second dashboard.

### 4. Visual separation (only if 1–3 insufficient)

- Light divider or subheading grouping: **“Queue (today)”** vs **“Selected trace (URL)”** — still one column; no new routes.

## Success check

A stranger with **`?trace=`** open can say: **this card is the latest receipt; the URL is a different story** — without you coaching.

## Friction log

If this came from a buyer-proof session, also append a row to [Research batch workflow — friction log](./research-batch-workflow-v1.md#friction-log-after-rehearsals).
