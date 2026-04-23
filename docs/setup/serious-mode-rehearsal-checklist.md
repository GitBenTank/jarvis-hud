---
title: "Serious-mode rehearsal — auth on, human authority"
status: living-document
category: setup
owner: Ben Tankersley
related:
  - ../strategy/operating-assumptions.md
  - phase2-auth-authority-checklist.md
  - openclaw-jarvis-operator-checklist.md
  - local-stack-startup.md
  - ../architecture/openclaw-proposal-identity-and-contract.md
  - ../strategy/research-batch-workflow-v1.md
  - ../roadmap/0003-operator-integration-phases.md
---

# Serious-mode rehearsal — auth on, human authority

**Purpose:** After the **auth-off** blessed stack is stable, prove that the **human authority boundary** stays **legible** with **`JARVIS_AUTH_ENABLED=true`**. This is the highest-value check for **enterprise readiness**: not whether docs exist, but whether **who may approve and execute** is clear when the convenience path is gone.

**Normative:** [Operating assumptions §2](../strategy/operating-assumptions.md#2-auth-and-step-up-jarvis) · [Phase 2 checklist](phase2-auth-authority-checklist.md) · [Thesis Lock](../decisions/0001-thesis-lock.md).

---

## Preconditions

- [Blessed stack](local-stack-startup.md) runs cleanly with auth **off** (`pnpm machine-wired` green).
- Ingress and env are understood: [Ingress for humans](openclaw-ingress-for-humans.md) · [env — Authentication](env.md#authentication).

---

## Rehearsal steps

1. **Turn auth on** for the same host you use for the blessed stack:
   - Set **`JARVIS_AUTH_ENABLED=true`** and **`JARVIS_AUTH_SECRET`** (≥ 16 chars) in **`.env.local`**.
   - Restart **`pnpm dev`** so Next.js picks up env.

2. **Phase 1 still green:**
   ```bash
   pnpm machine-wired
   ```

3. **Serious-mode guard on config:**
   ```bash
   JARVIS_EXPECT_AUTH=true pnpm auth-posture
   ```
   Expect **pass** only if the server reports auth enabled and the probe’s printed checks match your intent (run without `JARVIS_EXPECT_AUTH` once if you need the explanatory output).

4. **Batch ingress (blessed path — no improvisation)**  
   Keep **`pnpm dev`** running on the same base URL as **`JARVIS_HUD_BASE_URL`** / **`JARVIS_BASE_URL`** in **`.env.local`**, with ingress enabled and **`JARVIS_INGRESS_OPENCLAW_SECRET`** set (same as Phase 1).

   From **jarvis-hud**, run **exactly**:

   ```bash
   pnpm rehearsal:serious-mode-ingress
   ```

   This is an alias of **`pnpm rehearsal:research-batch`** ([`scripts/research-batch-rehearsal.ts`](../../scripts/research-batch-rehearsal.ts)): **three** signed **`system.note`** ingress posts (default), **one shared `batch.id`**, item indices `0…2`. Headless HMAC ingress does **not** use your browser session — that is intentional ([ingress vs human authority](../architecture/openclaw-jarvis-trust-contract.md#ingress-capability-vs-human-authority)).

   Optional pressure only if you already completed a clean pass once: `RESEARCH_BATCH_ITEM_COUNT=6 pnpm rehearsal:serious-mode-ingress` (max per [`INGRESS_BATCH_MAX_ITEM_COUNT`](../architecture/openclaw-proposal-identity-and-contract.md)). For the first serious-mode rehearsal, stay with the default **3**.

   **Then in the browser:** **log in** to the HUD → find the batch (titles include `Rehearsal batch — research only`) → **approve** one item → **execute that one item only** → confirm **receipt / trace** for that execution ([ADR-0005](../decisions/0005-agent-team-batch-v0-per-item-execute.md)). Deeper ritual context: [Research batch workflow v1](../strategy/research-batch-workflow-v1.md).

5. **Record observations** (copy table below into a note or PR comment).

---

## Recorded passes (evidence)

### 2026-04-23 — Phase 2 serious-mode rehearsal: first credible pass

**Host:** `http://127.0.0.1:3000` (aligned with `JARVIS_HUD_BASE_URL`). **Path:** Session ladder via `GET/POST /api/auth/*` (same cookie behavior as HUD: **None → Limited → Ready** after init + step-up), then HUD-equivalent approve/execute via authenticated API calls. Headless ingress used the blessed command only.

| Field | Value |
|--------|--------|
| **batch.id** | `9d2fe6d4-61e0-48df-9637-0c4151b6aed4` |
| **Executed proposal id** | `567b33be-2d3f-4109-8d2f-ec6b9268af37` |
| **Trace id (executed item)** | `3e8f61ac-529e-4eba-bb18-b26026f75dbd` |
| **Siblings (not executed)** | `456475b3-46d4-4012-94f4-bc4fb8c588f9`, `d8c5fc12-9ce6-4bbc-bd30-d0b307aac049` — remained `pending_approval`; **no** matching rows in `/api/actions` for those approval ids |
| **Receipt / artifact** | `system.note` dry-run execution; `outputPath` under dated system-notes path for the executed approval id only |
| **Trace vs log** | `GET /api/traces/<traceId>`: one event, one action; action log agrees |

**Verdict:** Session ladder coherent; ingress under auth-on; approve ≠ execute; only chosen id received execution artifacts; trace and action log agree. **Optional follow-up:** one full pass through the HUD to visually confirm session pill and panel copy.

---

## Record (what changed operationally)

| Topic | Notes |
|-------|--------|
| **Login / session** | Cookie lifetime, redirects, “lost session” UX |
| **Step-up** | When **`stepUpValid`** matters; any surprise blocks at execute |
| **Approve vs execute** | Any UI copy that blurs “approved” with “ran” |
| **Batch UX** | Clear which item executed; no ambiguous batch-level consent |
| **Docs / gaps** | Broken links, missing steps, wrong assumption about headless vs browser |
| **Probes** | `machine-wired` / `auth-posture` messages that confused you |

---

## Exit criteria (good rehearsal)

- You can answer **who may submit** (ingress secret), **who may approve**, and **who may execute** for this host without opening chat.
- **`JARVIS_EXPECT_AUTH=true pnpm auth-posture`** passes intentionally on this machine.
- One **batched** ingress still ends in **item-level** execute + **receipt**, with no Thesis Lock drift.

---

## Related

- [Phase 2 — auth and human authority checklist](phase2-auth-authority-checklist.md) — decisions to fill before scaling operators.
- [Operator checklist](openclaw-jarvis-operator-checklist.md) — daily mental model.
- [Roadmap Phase 2](../roadmap/0003-operator-integration-phases.md#phase-2--lock-the-human-control-boundary).
