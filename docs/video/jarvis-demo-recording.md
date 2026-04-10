# Jarvis HUD Demo Recording Guide

This document describes the 7-second demo used in the README GIF. The goal is to visually demonstrate the Jarvis control-plane lifecycle:

```
Agent → Proposal → Approval → Execution → Receipt → Trace
```

**Output:** `docs/video/jarvis-demo.gif` — ~800px wide, loopable.

---

## Timing

| Scene | Duration | Content |
|-------|----------|---------|
| 1 | 2s | Agent proposes action (terminal) |
| 2 | 2s | Jarvis approval UI — click Approve |
| 3 | 1s | Execution (spinner) |
| 4 | 2s | Receipt + trace timeline |
| **Total** | **~7s** | |

---

## Scene 1 — Agent proposes action (2s)

**Show:** Terminal with the OpenClaw proposal.

**Command:**
```bash
# From OpenClaw repo, with Jarvis running:
JARVIS_BASE_URL=http://localhost:3001 JARVIS_INGRESS_OPENCLAW_SECRET="..." pnpm jarvis:smoke
```

**Expected output:**
```
ok: true
id: ...
traceId: f96b2674-fbaf-48e3-9473-...
status: pending
```

**Optional (slick):** Style the output so it reads clearly:
```
traceId: f96b2674-fbaf-48e3-9473
connector: openclaw
status: awaiting approval
```

Pause ~1 second so viewers can read it.

---

## Scene 2 — Jarvis approval UI (2s)

**Cut to:** Jarvis HUD browser window (http://localhost:3001)

**Show:** Approval card with:
- `system.note`
- "Jarvis integration test" (or your smoke test title)
- `status: awaiting approval`
- OpenClaw (verified) badge

**Action:** Mouse moves to **Approve** button → click **Approve**.

---

## Scene 3 — Execution (1s)

**Show:** UI updates:
- `status: approved`
- `status: executing`
- Small spinner or loading state

---

## Scene 4 — Receipt (2s)

**Show:** UI updates again:
- `status: executed`
- Receipt written
- `~/jarvis/actions/YYYY-MM-DD.jsonl`
- Trace timeline appears

---

## Final Frame (important)

**Leave visible for the loop:**
```
Trace ID: f96b2674-fbaf-48e3-9473
EXECUTED
receipt recorded
```

This makes the GIF readable when paused. The trace ID should match Scene 1 for visual continuity.

---

## Recording Setup

### Mac (QuickTime)
1. QuickTime → File → New Screen Recording
2. Record the flow
3. Crop to ~800px wide
4. Convert to GIF with Kap or another tool

### Kap (recommended)
- **Download:** https://getkap.co
- **Settings:** 12–15 FPS, width ~800px
- **Trim:** ~7 seconds
- **Export:** GIF

### Windows
- ScreenToGif or similar — capture, crop, export as GIF

---

## Where to save

```
docs/video/jarvis-demo.gif
```

---

## What this communicates

A viewer instantly understands:

```
AI agent proposes action
       ↓
Jarvis intercepts
       ↓
Human approves
       ↓
Execution occurs
       ↓
Receipt + trace recorded
```

That's the core idea in 7 seconds.

---

## Checklist before recording

- [ ] Jarvis running on http://localhost:3001
- [ ] OpenClaw smoke ready (env vars set)
- [ ] Browser on Jarvis dashboard, approval panel visible
- [ ] Terminal positioned for Scene 1
- [ ] No sensitive data in view
