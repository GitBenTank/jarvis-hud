---
title: "Investor demo polish — working tree snapshot (for audit)"
status: snapshot
version: 1.0
owner: Ben Tankersley
category: video
---

# Git-backed change list (working tree)

**Purpose:** A **verifiable** list of what changed during the **investor front door + `/demo` + Tati + speaker notes** work. Regenerate with `git status` / `git diff` before you commit. This file is a **point-in-time snapshot**, not a substitute for `git log` after merge.

**Captured** (typical `main` with local edits):

- **Branch:** `main...origin/main` (example)
- **Modified:** 17 files under `docs/` and `src/`
- **Untracked / new (examples):** `scripts/demos/send-email-proposal-bad.json`, `investorDemoSpeakerNotes.ts`, `DemoSpeakerNotesPanel.tsx`, `demoScriptRendering.tsx`, `InvestorReadPackTatiLayout.tsx` — and any new docs (e.g. this snapshot, [rehearsal run sheet](./investor-demo-rehearsal-run-sheet.md))

---

## By area

### Docs (strategy, welcome, read pack, etc.)

| Path | Role |
|------|------|
| `docs/README.md` | Hub / entry pointers |
| `docs/getting-started/welcome.md` | Newcomer routing |
| `docs/strategy/investor-read-pack.md` | 15 min path, `/tati`, `/demo` surfaces |
| `docs/strategy/gener8tor-pitch.md` | Six-slide copy (incl. slide 6 “allowed to happen” line) |
| `docs/strategy/investor-demo-narrative-script.md` | Woven script; operator + email / batch |
| `docs/strategy/room-playbook-v1.md` | Room discipline cross-links |
| `docs/strategy/investor-fundraising-deck-outline.md` | Light alignment |
| `docs/video/investor-demo-full-runbook.md` | Boot, Flow 1, OpenClaw prompts |
| `docs/video/investor-demo-rehearsal-run-sheet.md` | **New** — one-page operator sheet |
| `docs/video/investor-demo-git-snapshot.md` | **This** audit stub |

### App: `/demo` and pitch

| Path | Role |
|------|------|
| `src/app/demo/DemoExperience.tsx` | Split layout: stage + notes column |
| `src/components/demo/DemoLiveTransition.tsx` | Column-scoped transition |
| `src/components/demo/DemoCinematicScroll.tsx` | Door metaphor, “allowed to happen”, governed bullets |
| `src/components/demo/Gener8torPitchSlideDeck.tsx` | Slide 6 subline; handoff |
| `src/components/demo/InvestorPitchSlides.tsx` | Notes column offset for dots |
| `src/components/demo/ProductMock.tsx` | “Authority boundary” chrome title |
| `src/components/demo/DemoSpeakerNotesPanel.tsx` | Split + mobile N |
| `src/components/demo/demoScriptRendering.tsx` | Stage + `whitespace-pre-wrap` |
| `src/components/demo/investorDemoSpeakerNotes.ts` | Slides, live Flow 1, **Alfred pastes**, Tati post-deck |
| `src/components/docs/Gener8torPitchDocsClient.tsx` | `/activity` CTA, handoff copy |

### App: docs index + Tati

| Path | Role |
|------|------|
| `src/lib/docs-library-index.ts` | Investor 15 min path = four steps; newcomers trimmed |
| `src/components/docs/DocsLibraryIndex.tsx` | Hero CTA, investor sequence, pitch one-liner |
| `src/app/docs/tati/page.tsx` | Read pack + `InvestorReadPackTatiLayout` |
| `src/components/docs/InvestorReadPackTatiLayout.tsx` | Operator notes toggle + split columns |

### Scripts

| Path | Role |
|------|------|
| `scripts/demos/send-email-proposal-bad.json` | “Bad” governed `send_email` for reject path |

---

## How to refresh this list

```bash
cd /path/to/jarvis-hud
git status -sb
git diff --stat
```

Update the “Captured” and tables after large merges so operators aren’t looking at a stale path list.

---

## Related

- [Rehearsal run sheet](./investor-demo-rehearsal-run-sheet.md)  
- [Full runbook](./investor-demo-full-runbook.md)
