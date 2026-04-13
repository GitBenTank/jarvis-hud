# Governed execution — internal demo checklist

Short operator script for the **propose → approve → execute** story. Aligns with [Thesis Lock](strategy/jarvis-hud-video-thesis.md#thesis-lock-do-not-drift): agents propose; humans approve; **Approve ≠ Execute**; every run produces receipts.

## Shared vocabulary (what the UI should say)

- **Agent proposed** — Decision replay line: `{proposer} proposed {kind}`; trace **Proposal** stage.
- **Awaiting approval** — Pending proposal; pipeline **Awaiting approval**; replay ends with `→ awaiting approval`.
- **Approved by** — Replay: `→ approved by {actor}`; trace **Approval** step `Approved by:`; timestamps **Approved**.
- **Approval-time safety snapshot** — After approve: badge **Snapshot recorded** (or **No snapshot recorded** on older rows).
- **Awaiting execution** — Approved, not run yet; execution truth **Awaiting execution**; pipeline **Awaiting execution**.
- **Execution blocked** — Preflight **Will block** + disabled Execute; replay `→ execution blocked (...)`; policy deny → **Execution blocked (policy)**.
- **Executed successfully** — After Execute; green banner **Executed successfully**; trace **Executed successfully ·** in end-to-end strip; pipeline/receipt path complete.

## Path A — `system.note` (safe, full lifecycle)

**Setup:** Ingress or UI creates a `system.note` proposal (pending).

**Point on screen**

1. **Approvals** → open the proposal → **Decision replay** — `… proposed system.note → awaiting approval`.
2. **Safety & readiness** — preflight **Ready** (or **Unknown** until loaded).
3. Click **Approve** → **Approval-time safety snapshot** — **Snapshot recorded**, risk/readiness/reason.
4. **Execution boundary** — “Approval records human consent. Execute writes artifacts and receipts.”
5. **Execute** → success banner **Executed successfully**.
6. **Trace** (same `traceId`) — **Decision replay**, **Approval-time safety snapshot**, lifecycle strip includes **Executed successfully ·** and receipt line.

## Path B — `code.apply` (execution blocked)

**Setup:** Use a proposal that fails preflight (e.g. invalid/missing `JARVIS_REPO_ROOT`, or dirty worktree per policy).

**Point on screen**

1. Open proposal → **Decision replay** after approve path shows `→ execution blocked (…)` when preflight **Will block**.
2. **Safety & readiness** — **Will block** and the first blocker line (same text as next to Execute).
3. **Execute** — disabled; label **Execution blocked — fix preflight issues**; helper **Execution blocked.** + blocker.
4. Optional: **Trace** — execution truth / pipeline reflects blocked or policy state without a successful execute.

## Path C — `code.apply` (ready → success, environment permitting)

**Setup:** Valid repo root, clean worktree, allowed policy; same as Path A but `code.apply`.

**Point on screen**

1. **Approve** → snapshot **Snapshot recorded**; replay `→ awaiting execution` when preflight is **Ready**.
2. **Execute (git commit)** → **Executed successfully**; trace shows **Executed successfully** and receipt evidence.

## ~60 second live demo order

| Seconds | Do | Say / point |
|--------|-----|-------------|
| 0–12 | Approvals, pending `system.note` | “Agent proposed; we’re **awaiting approval**.” |
| 12–28 | Safety & readiness, **Approve** | “Human approves; we persist an **approval-time safety snapshot** — receipt of what we knew at approve.” |
| 28–42 | Execution boundary + **Execute** | “**Approval is not execution.** Execute is the separate authority moment.” |
| 42–55 | Success + switch to **Trace** | “**Executed successfully** — same story on the trace: proposal, approval, execution truth, receipt.” |
| 55–60 | Optional | “If preflight fails, Execute stays off — **execution blocked** until the environment is fixed.” |

## Quick regression checks

- Older approvals without a stored snapshot: badge **No snapshot recorded** / body **No snapshot recorded** — expected, not a failure.
- Denied proposals: replay `→ rejected…`; no execute path.
