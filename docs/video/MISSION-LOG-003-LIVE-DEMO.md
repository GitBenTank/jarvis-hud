# Mission Log 003 — Live Demo Script

**Goal:** Show proposal → approval → execution → trace in ~60 seconds. Live, not architecture slides.

**Why it hits:** People believe what they see. A running system beats a diagram.

---

## Pre-Roll (Before Recording)

**Stack:** [local stack startup](../setup/local-stack-startup.md) — **`pnpm dev`** (Jarvis **http://127.0.0.1:3000**), **`OPENCLAW_ROOT=~/Documents/openclaw-runtime pnpm openclaw:dev`**, **`pnpm local:stack:doctor`**.

**Create pending proposals** (from jarvis-hud, with **`.env.local`** aligned to **3000**):

```bash
cd ~/Documents/jarvis-hud
pnpm ingress:smoke
pnpm jarvis:smoke:apply
```

**Optional scripted 3001 path:** [DEMO.md](../../DEMO.md) — `pnpm demo:boot`, `pnpm demo:smoke`.

**Layout:**
- **Left:** Terminals (Jarvis + smoke output)
- **Right:** Browser — **http://127.0.0.1:3000** and **http://127.0.0.1:3000/activity**

---

## Script (60 seconds)

### 0:00 — Hook (5 sec)
> "Most AI agents execute actions directly. No approval. No receipt. No audit trail.  
> Jarvis changes that. Watch."

### 0:05 — Show the proposal (10 sec)
**Action:** Point at the pending card in Approvals.
> "An agent proposed this action. It hit our ingress, we verified the signature, and it’s sitting here — waiting for a human.  
> Nothing ran yet."

### 0:15 — Approve (5 sec)
**Action:** Click **Approve**.
> "I’m approving it. One click. No code changes, no config. The human is the gate."

### 0:20 — Execute (10 sec)
**Action:** Click **Execute**. Let spinner run.
> "Now Jarvis runs it. Policy ran first — kind allowlist, preflight. Then the adapter.  
> No silent execution. Everything’s logged."

### 0:30 — Receipt (10 sec)
**Action:** Point at Actions panel / receipt.
> "There’s the receipt. Trace ID, approval ID, artifact path.  
> We know exactly what ran, when, and where the output went."

### 0:40 — Trace (15 sec)
**Action:** Open Activity → select trace from dropdown → show timeline.
> "And that’s the full trace. Proposal, approval, execution, receipt.  
> All linked. Replayable. Auditable.  
> That’s the lifecycle — Agent to Proposal to Approval to Execution to Receipt to Trace.  
> Governed, not a black box."

### 0:55 — Close (5 sec)
> "Jarvis HUD — AI control plane for governed automation.  
> Link in the description."

---

## Beat Sheet (for editing)

| Time  | Beat        | Visual                         | Line                     |
|-------|-------------|--------------------------------|--------------------------|
| 0:00  | Hook        | You / screen                  | "Most AI agents execute…" |
| 0:05  | Proposal    | Pending card                  | "An agent proposed…"     |
| 0:15  | Approve     | Click Approve                 | "I'm approving it…"       |
| 0:20  | Execute     | Spinner                       | "Now Jarvis runs it…"    |
| 0:30  | Receipt     | Actions panel                 | "There's the receipt…"    |
| 0:40  | Trace       | Activity timeline             | "And that's the full trace…" |
| 0:55  | CTA         | Screen / you                  | "Jarvis HUD…"            |

---

## If Something Breaks

| Problem           | Fix                                              |
|-------------------|--------------------------------------------------|
| No pending proposal | Re-run `pnpm demo:smoke`                        |
| 401 on smoke      | Check `JARVIS_INGRESS_OPENCLAW_SECRET` matches   |
| Receipt not visible | Refresh; check `~/jarvis/actions/`             |
| Trace empty       | Use traceId from smoke output in Activity dropdown |

---

## Best Moment to Loop

**0:40–0:55** — Trace view with the full lifecycle visible. That’s the signature shot.
