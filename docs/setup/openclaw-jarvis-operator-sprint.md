---
title: "OpenClaw ↔ Jarvis operator sprint (E2E exit)"
status: living-document
version: 1.3
owner: Ben Tankersley
created: 2026-04-11
category: setup
related:
  - openclaw-jarvis-operator-checklist.md
  - ../local-verification-openclaw-jarvis.md
  - local-dev-truth-map.md
  - ../openclaw-integration-verification.md
  - ../video/90s-proof-demo.md
  - ../marketing/distribution-checklist.md
---

# OpenClaw ↔ Jarvis operator sprint (E2E exit)

**Objective:** Make **OpenClaw → Jarvis** end-to-end flow **repeatable and demo-safe** before recording clips or pushing distribution.

**Rule:** Proof only counts if the runtime loop is real. Do not ship marketing until this exit is satisfied.

**Detailed procedure:** Step-by-step commands and Alfred JSON patterns live in [Local verification: OpenClaw → Jarvis HUD](../local-verification-openclaw-jarvis.md). **Flagship bundle** sample JSON, grep anchors, and `ALLOWED_KINDS` context: [Flagship proposal shapes (appendix)](../architecture/flagship-proposal-shape-examples-v1.md). This page is the **acceptance bar** and order of operations.

---

## Minimum bar (what “fully functional” means)

1. OpenClaw can send a **real proposal** into Jarvis (signed ingress).
2. Jarvis shows the proposal as **pending**.
3. You can **approve** it in the HUD (authority boundary visible).
4. **Execution** actually runs, or **truthfully blocks** (deny is first-class).
5. **Receipt + trace** are recorded and visible (demo-quality).
6. The **same flow works again** without weird manual cleanup or mystery restarts.

---

## Exit criteria (ship demos / clips after this)

- **Three consecutive clean runs** of the full loop (propose → pending → approve → execute → receipt → trace).
- **At least one** run that ends in **deny / block** with receipt + trace proving the outcome—not silence.
- No dependency on “restart gateway and pray.”

---

## Priority order

### 1. Lock config truth

Align and verify:

- **Jarvis live origin** (listening port) — [Local dev truth map](local-dev-truth-map.md).
- OpenClaw **`JARVIS_BASE_URL`** (or equivalent) matches that origin **exactly**.
- **Shared `JARVIS_INGRESS_OPENCLAW_SECRET`** (same value both sides, ≥32 chars).
- **`JARVIS_INGRESS_OPENCLAW_ENABLED=true`**, allowlist includes **`openclaw`**, gateway/plugin wiring per [OpenClaw integration verification](../openclaw-integration-verification.md).

Use Jarvis **operator surfaces** when debugging: origin mismatch banner, integration readiness (`GET /api/config` → `integrationIssues`), OpenClaw Control link (navigation only—they do not fix OpenClaw env).

### 2. Prove ingress first

Before fancy tool execution:

- OpenClaw **reaches** Jarvis.
- **HMAC signature accepted** (no flaky 401).
- Proposal **lands as pending every time** you expect it.

If ingress is flaky, stop—fix URL + secret + allowlist only.

### 3. Prove approval and execution separation (Thesis Lock)

- Pending appears without execution.
- **Approve** is required and visible.
- **Execute** is a distinct step where the product defines it (approve ≠ execution).
- **Blocked** path is distinct and recorded, not a silent no-op.

### 4. Prove receipts and traces

- Receipt / executed-actions surface shows outcome.
- **Trace** timeline is reconstructable; **trace ID** reference is clear.
- Actor / action / outcome legible enough for **90s demo** framing.

### 5. Eliminate “works once”

Run: success → (optional) block → success again **without** undocumented state fixes.

---

## Five concrete checks (tick all before distribution)

| Check | Question |
|-------|----------|
| **Config** | Do Jarvis and OpenClaw point at the **same** base URL + secret + allowlist story? |
| **Ingress** | Does a signed proposal **always** show up pending when the test says it should? |
| **Approval** | Is operator approval **required** and **visible** before execution? |
| **Execution** | Does run or block match reality, with **no silent success** on failure? |
| **Proof** | Are receipt + trace **demo-quality** for the recording you plan to ship? |

---

## Failure signals (stop conditions)

Use these to diagnose **which gate** failed—fix **only that layer** before moving on (see priority order above).

- **Proposal does not appear (or not promptly)** → treat as **ingress** (URL, secret, allowlist, signature, network). Do not debug execution yet.
- **Proposal appears without a clear Pending / awaiting state** → **state or UI bug**; stop and fix before trusting approval semantics.
- **Execution happens without approval** → **critical Thesis Lock violation**; stop—do not demo or distribute until resolved.
- **No receipt or trace for an outcome you care about** → **not demo-ready**; proof path is incomplete.
- **Requires restart to work again** → suspect **state corruption** or flaky ingress; not acceptable for exit criteria—stabilize before clips.

### Gate ownership (mental model)

When something breaks, **look in one place first**—avoid debugging the wrong layer.

- **Ingress** — OpenClaw → Jarvis boundary (URL, secret, HMAC, allowlist, network path to `POST /api/ingress/openclaw`).
- **Approval** — Jarvis UI / control plane (pending queue, human gate, approve ≠ execute).
- **Execution** — Action runner / adapters / tool layer (what runs after explicit execute, or policy block).
- **Proof** — Receipts + trace system (action log, artifacts, trace ID, Activity / trace UI).
- **Stability** — State management / idempotency (repeatable runs without mystery resets).

### Order of inspection (when unsure)

When you do not know which layer failed, inspect in this order only—**top to bottom**. Do not skip.

1. **Ingress**
2. **Approval**
3. **Execution**
4. **Proof**
5. **Stability**

This matches the sprint **priority order** and stops you from tuning adapters while the URL or HMAC is still wrong.

**Likely hotspots (for first runs):** (1) **Ingress** — wrong base URL, secret mismatch, HMAC/allowlist failures. (2) **Execution** — tool not invoked, silent failure, partial success. (3) **Stability** — works once, breaks on the second run—treat as not exit-ready until repeatable.

---

## After exit

- Record using [90s proof demo script](../video/90s-proof-demo.md).
- Distribute using [distribution checklist](../marketing/distribution-checklist.md).

---

## Related

- [DEMO.md](../../DEMO.md) — investor/demo path, smoke commands.
- `pnpm jarvis:doctor` — local preflight when wired in your environment.
