# Jarvis HUD v0.2 — Golden Loop Sprint

**Status:** Active sprint target  
**Owner:** Ben Tankersley  
**Created:** 2026-05  
**Related:**

- [Trust, determinism, and integrity signals](../governance/trust-and-determinism.md) — why this sprint exists (philosophy → proof)
- [Thesis Lock (ADR-0001)](../decisions/0001-thesis-lock.md)
- [Operator integration phases (0003)](./0003-operator-integration-phases.md)
- [Phased platform plan (0004)](./0004-phased-platform-plan.md)
- [Operating assumptions §1](../strategy/operating-assumptions.md#1-canonical-openclaw-deployment-for-this-project)
- [Local stack startup](../setup/local-stack-startup.md)
- [Phase 1 freeze checklist](../setup/phase1-freeze-checklist.md)

---

## Goal

One repeatable path proves, without hand-waving:

**OpenClaw proposal → Jarvis pending queue → approval → execution → receipt → trace timeline → export/replay.**

Same commands and env on a fresh operator setup. No “it worked yesterday.”

**This sprint is where governance language becomes deterministic behavior** — see [Trust and determinism](../governance/trust-and-determinism.md).

---

## Non-negotiable invariant

[Thesis Lock](../strategy/jarvis-hud-video-thesis.md#thesis-lock-do-not-drift): agents may propose anything; execution requires explicit human approval; approval ≠ execution; every action produces receipts; the model is not a trusted principal; autonomy in thinking, authority in action.

---

## Blessed stack (undeniable environment)

Before expanding tools or adapters, the environment must match [Operating assumptions §1](../strategy/operating-assumptions.md#1-canonical-openclaw-deployment-for-this-project) and [Local stack startup](../setup/local-stack-startup.md).

### Clone and paths

| Piece | Blessed choice |
|--------|----------------|
| **Jarvis HUD** | This repo; `pnpm dev` → **http://127.0.0.1:3000** |
| **Jarvis on-disk state** | `JARVIS_ROOT` default `~/jarvis` unless overridden |
| **OpenClaw runtime checkout** | `~/Documents/openclaw-runtime` (clean clone for integration) |
| **OpenClaw state dir** | `OPENCLAW_STATE_DIR=$HOME/.openclaw-dev` (gateway uses this; `pnpm openclaw:dev` sets it unless overridden) |

### Verify commands (acceptance gate)

From jarvis-hud, with Jarvis + OpenClaw running per local-stack-startup:

1. `pnpm machine-wired`
2. `pnpm local-stack:doctor`
3. `pnpm auth-posture` — optional serious host: `JARVIS_EXPECT_AUTH=true pnpm auth-posture`
4. `pnpm rehearsal:preflight` — `machine-wired` + `auth-posture` in one step
5. `pnpm test`

### Required `.env.local` (demo / integration)

| Variable | Note |
|----------|------|
| `JARVIS_BASE_URL` / `JARVIS_HUD_BASE_URL` | **`http://127.0.0.1:3000`** — use **127.0.0.1**, not `localhost`, so ingress signing and origin checks stay aligned |
| `JARVIS_INGRESS_OPENCLAW_ENABLED` | `true` |
| `JARVIS_INGRESS_OPENCLAW_SECRET` | ≥ 32 chars; **same** on Jarvis and OpenClaw |
| `JARVIS_INGRESS_ALLOWLIST_CONNECTORS` | includes `openclaw` |
| `OPENCLAW_CONTROL_UI_URL` | **exact** origin of the **running** gateway — use gateway log or `pnpm local-stack:doctor` (often `http://127.0.0.1:19001` for checkout gateway; ports vary; do not guess) |

### Two terminals (canonical)

1. **Jarvis:** `pnpm dev`
2. **OpenClaw:** `OPENCLAW_ROOT=~/Documents/openclaw-runtime pnpm openclaw:dev`

**Ground truth capture:** [Phase 1 freeze checklist](../setup/phase1-freeze-checklist.md).

---

## Golden loop (flagship)

**Do not** lead with five tools. One story:

**Research batch → human approval → bounded output → receipt → trace.**

| Phase | Kind / focus | Why |
|-------|----------------|-----|
| **v0.2a** | `system.note` research batch | Proves governance, traces, receipts, exports, lifecycle **without** irreversible side effects or provider flakiness ([kind ownership §5](../strategy/operating-assumptions.md#5-kind-taxonomy-ownership)) |
| **v0.2b** | `send_email` (same spine) | Proves the architecture governs **real** consequences — only with documented demo-safe policy (allowlisted recipient, env discipline) |

---

## Execution inventory

Maintain a living table: **kind → adapter → risk tier → policy checks → receipt fields → preflight snapshot → unit test → E2E → demo-ready.**

**Source of truth for kinds:** [`src/lib/policy.ts`](../../src/lib/policy.ts) (`ALLOWED_KINDS`).

**Execute routing:** [`src/app/api/execute/[approvalId]/route.ts`](../../src/app/api/execute/[approvalId]/route.ts).

Fill rows during this sprint; align with [platform plan § core rule](./0004-phased-platform-plan.md#core-rule--no-new-capability-ships-without).

---

## E2E proof (highest leverage)

**Shipped (v0.2a `system.note`):** `pnpm golden-loop`

- Default: spawns `next dev` with an **isolated** `JARVIS_ROOT` under `os.tmpdir()`, runs the full chain, deletes the tree.
- **CI / local:** **`pnpm build`** then **`pnpm golden-loop`**, or **`pnpm golden-loop:verify`** once (uses `next start` only — certifies the production bundle).
- **Attach to your running dev server (not isolated):**  
  `GOLDEN_LOOP_USE_EXISTING=1 JARVIS_HUD_BASE_URL=http://127.0.0.1:3000 JARVIS_INGRESS_OPENCLAW_SECRET=… pnpm golden-loop`

Steps exercised: signed ingress → pending → approve → execute → `GET /api/traces/:traceId` → `GET /api/traces/:traceId/replay` → `GET /api/audit/export` (today’s `dateKey`).

**v0.2b:** **`pnpm golden-loop:email`** — gated (`DEMO_EMAIL_ENABLED=1`, `DEMO_EMAIL_TO` = code allowlist, `DEMO_EMAIL_USER` / `DEMO_EMAIL_PASS`); asserts **provider `providerMessageId`**, **`send_email`** replay receipt, and audit export. **Not** run in CI. Operator source of truth: [Investor demo full runbook](../video/investor-demo-full-runbook.md).

**Bar:** Fails CI if the golden loop breaks — not a manual-only demo script.

---

## Enterprise gap (explicit)

v0.2 does **not** claim full enterprise: multi-tenant identity, centralized HA storage, key lifecycle, SIEM contracts, hosted control plane. Track post-loop per [Operating assumptions §3](../strategy/operating-assumptions.md#3-local-first-vs-hosted-control-plane).

---

## Definition of done (v0.2)

A fresh operator on the **blessed stack** can:

1. Run the verify commands and see **pass** (or understand documented exceptions).
2. Submit **one** OpenClaw-originated proposal that lands **pending** in Jarvis.
3. **Approve** and **execute** once.
4. View **receipt**, **trace timeline**, and **export/replay** evidence.

…without undocumented patching, mystery ports, or hidden state beyond what this doc and the Phase 1 checklist name (`JARVIS_ROOT`, `OPENCLAW_STATE_DIR`, `OPENCLAW_ROOT`).

**Doc debt:** If reality drifts, update [Operating assumptions](../strategy/operating-assumptions.md) **`last_reviewed`** in the same change set as code or env changes.

---

## Note on numbering

`docs/decisions/0005-*.md` is the ADR namespace. This file is **`docs/roadmap/0005-*`** — different tree; both may coexist.
