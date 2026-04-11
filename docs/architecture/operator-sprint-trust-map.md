---
title: "Operator sprint — trust strip & repo map"
status: "draft"
category: architecture
related:
  - ../strategy/jarvis-hud-video-thesis.md
  - control-plane.md
  - ../decisions/0001-thesis-lock.md
  - ../decisions/0003-execution-policy-v1.md
---

# Operator-usability sprint: file map + trust-strip contract

**Goal:** operator-usability sprint focused on legibility.

**Constraint (Thesis Lock):** every trust signal shown in the HUD must map to a **real enforced check** already present in the execution or ingress path, or be labeled **inferred / informational** until substrate exists.

**Outputs in this doc:**

1. Repo-specific map for priority themes **1–5** (trust strip, approval review, policy explainability, trace UX, mode clarity).
2. **Trust-strip contract:** signal names, semantics, sources, state rules, enforcement vs inference, UI ownership.
3. **Substrate gaps** where the UI cannot yet be honest without a small API or data change.
4. **Suggested implementation order.**

---

## 1. Trust-strip contract

### State legend

| State | Meaning |
|-------|--------|
| **green** | Precondition satisfied; boundary/enforcement is in a “go” posture for that dimension. |
| **yellow** | Degraded, optional, or “attention” — not a hard fail, or scope not engaged. |
| **red** | Hard fail or boundary would block the relevant path (ingress or execute). |
| **unknown** | Client could not load data, or server cannot compute without request context. |

### Signals (v1 — implement in this order)

| Signal ID | What it means | Source (file / route / function) | Green | Yellow | Red | Unknown | Enforced in code today? | UI owner (suggested) |
|-------------|----------------|-----------------------------------|-------|--------|-----|---------|-------------------------|------------------------|
| `ingress.openclaw` | OpenClaw ingress endpoint is configured to accept **signed** proposals (`JARVIS_INGRESS_OPENCLAW_ENABLED`, secret length ≥ 32, connector allowlist contains `openclaw`). | `src/lib/ingress-openclaw.ts` — `isIngressEnabled()`, `getIngressSecret()`, `getConnectorAllowlist()`; exposed in `GET /api/config` as `ingressOpenclawEnabled`, `openclawAllowed`. Ingress rejects when off: `src/app/api/ingress/openclaw/route.ts`. | `ingressOpenclawEnabled && openclawAllowed` | — | Ingress disabled, secret invalid/missing, or connector not allowlisted | Config fetch failed | **Yes** — 403 on `POST /api/ingress/openclaw` | `TrustPostureStrip` (new); today partially mirrored by `ModePills` (does not show allowlist alone) |
| `ingress.validation` | Strict OpenClaw proposal validation (size, shape, kinds) is enabled vs relaxed path. | `src/app/api/ingress/openclaw/route.ts` (`JARVIS_INGRESS_OPENCLAW_VALIDATE`); `src/lib/ingress/validate-openclaw-proposal.ts`; `GET /api/config` → `ingressValidationEnabled` | `ingressValidationEnabled === true` | Validation off but ingress still requires HMAC + allowlist | — (optional: treat “off” as yellow for operators) | Config fetch failed | **Yes** — validation branches in ingress route | `TrustPostureStrip` |
| `auth.boundary` | Password/session gate is configured for the HUD. | `src/lib/auth.ts` — `isAuthEnabled()`; `GET /api/config` → `authEnabled` | `authEnabled === false` (no gate) **or** `authEnabled === true` with valid session | — | `authEnabled === true` but misconfigured secret (server 500 / `AuthConfigError`) | Config fetch failed | **Yes** — execute route requires session when auth on: `src/app/api/execute/[approvalId]/route.ts` | `TrustPostureStrip`; overlaps `ModePills` “Auth” |
| `auth.step_up` | For the **current browser session**, step-up is satisfied for high-risk execution (when auth enabled). | `src/lib/auth.ts` — `isStepUpValid()`; used in `POST /api/execute/[approvalId]/route.ts` and `POST /api/preflight/route.ts` | Auth off **or** auth on and step-up TTL valid | Auth on, not stepped up (execute will 403 policy) | Same as yellow for strip purposes | **Unknown** unless `GET /api/config` (or sibling) reads **request** cookies | **Yes** at execute/preflight; **not** exposed on `GET /api/config` today → **substrate gap** | `TrustPostureStrip` |
| `policy.kind_allowlist` | Action kind is permitted for execution (global list). | `src/lib/policy.ts` — `ALLOWED_KINDS`, `isAllowedKind()`; `evaluateExecutePolicy()`; ingress also checks kind | N/A per-strip aggregate; use **per-action** preflight. For strip: assume **green** if HUD loaded | — | — | — | **Yes** | Strip optional: “Policy engine: active”; detail in approval UI |
| `execution.gate` | Approved proposal has required actor chain before adapters run. | `src/lib/execution-gate.ts` — `validateExecutionPreconditions()`; `src/app/api/execute/[approvalId]/route.ts` | Implicit green when no execute attempted; **per approval** | — | Gate failure codes on execute | — | **Yes** | Per-proposal UI (`ApprovalsPanel` / execute errors); optional aggregate “no stuck approvals failing gate” (inferred) |
| `policy.execute` | Execute-time policy (allowlist + step-up + code.apply preflight) passes for a given run. | `src/lib/policy.ts` — `evaluateExecutePolicy()`; log `src/lib/policy-decision-log.ts` | Per trace / last decision | — | Deny logged / API error with `reasonDetails` | — | **Yes** | `TracePanel`, activity stream, execute error UI; strip can show **latest deny reason** from `buildRuntimePosture` → `latestBlockReason` (`src/lib/runtime-posture.ts` + `GET /api/config`) |
| `execution.scope` | Filesystem blast-radius guard: targets must sit under configured roots when env is set. | `src/lib/execution-scope.ts` — `loadExecutionAllowedRoots()`, `validateExecutionScopeTargets()`; `src/app/api/execute/[approvalId]/route.ts` | Roots configured **and** (optional) last execute in scope | **Roots empty** — enforcement **off** (backward compatible) | Scope violation → 400/403 with `execution_scope_denied` | — | **Yes** when roots non-empty | **Substrate gap:** roots not on `GET /api/config` → add `executionScopeActive: boolean` + optional labels |
| `code_apply.repo` | For `code.apply`, repo root set, git clean enough, etc. | `src/lib/code-apply.ts` — `getCodeApplyBlockReasons()`, `isCodeApplyAvailable()`; `GET /api/config` → `codeApplyAvailable` | `codeApplyAvailable && getCodeApplyBlockReasons().length === 0` | `codeApplyAvailable` but block reasons non-empty (dirty tree, etc.) | No repo / not a git repo | — | **Yes** at execute via policy | Strip + `ApprovalsPanel` preflight; `GET /api/config` has `codeApplyAvailable` but **not** dirty/clean detail → **substrate gap** for “clean/dirty” badge |
| `execution.dry_run` | Whether executed adapters mutate external state vs local artifacts only. | `src/app/api/execute/[approvalId]/route.ts` — response `dryRun: executionKind !== "code.apply"`; `src/lib/execution-surface.ts` — `buildExecutionCapabilities()`; `GET /api/config` → `runtimePosture.executionCapabilities`, `trustPosture.executionSurfaceLabel` | Honest labeling **per kind** | — | — | — | **Yes** | **Surfaced** — no global “HUD is dry-run” claim |
| `safety.irreversible_ui` | UI requires typed confirmation for high-risk kinds before execute. | `src/lib/risk.ts` — `requiresIrreversibleConfirmation`, etc.; `src/components/SafetyGatePanel.tsx`, `ApprovalsPanel.tsx` | Confirm enabled (`JARVIS_UI_CONFIRM_IRREVERSIBLE` / `JARVIS_IRREVERSIBLE_CONFIRM_ENABLED` not `false`) | — | — | — | **UI enforcement** (not server-only) | `SafetyGatePanel` + strip mirror of `irreversibleConfirmEnabled` from config |

### Substrate gaps (honesty blockers)

**Resolved in code (canonical posture on `GET /api/config`):**

- `runtimePosture.executionCapabilities` + `trustPosture.executionSurfaceLabel` replace the misleading global `mode: "dry-run"` (removed).
- `trustPosture.stepUpValid` (cookie-aware; use `credentials: "include"` from the browser).
- `trustPosture.executionScopeEnforced` from `loadExecutionAllowedRoots()`.
- `trustPosture.codeApplyBlockReasons` from `getCodeApplyBlockReasons()`.

**Remaining / optional:**

- Dedicated `GET /api/runtime-health` if non-browser clients need posture without full config.
- Further **per-kind** surface labels if more kinds become non–dry-run in execute.

---

## 2. Priority theme 1 — Runtime trust strip (implementation map)

| Piece | Role | Location |
|-------|------|----------|
| Config / posture aggregation | Single read model for strip | `src/app/api/config/route.ts`, `src/lib/runtime-posture.ts` |
| Ingress enforcement | HMAC, nonce, allowlist, validation | `src/app/api/ingress/openclaw/route.ts`, `src/lib/ingress-openclaw.ts`, `src/lib/ingress/validate-openclaw-proposal.ts` |
| Policy at execute | Allowlist, step-up, code.apply preflight | `src/lib/policy.ts`, `src/app/api/execute/[approvalId]/route.ts` |
| Execution gate | Approval chain | `src/lib/execution-gate.ts` |
| Existing HUD hints | Counts, agent idle | `src/components/StatusStrip.tsx` |
| Mode / safety hints | Auth, safety confirm, ingress validation flags | `src/components/ModePills.tsx` |
| Safety gate state | Risk-based green/amber/red | `src/components/SafetyGatePanel.tsx` |

**Recommended UI structure:** add `src/components/TrustPostureStrip.tsx` (client) fed by `GET /api/config` (+ small extensions above). Keep `StatusStrip` for **throughput** (pending/approved/executed/trace link); strip handles **boundary posture** to avoid one mega-component.

**First implementation order (theme 1):**

1. ~~Extend `GET /api/config` with honest fields~~ — done: `trustPosture` (`stepUpValid`, `executionScopeEnforced`, `codeApplyBlockReasons`, `executionCapabilities`); `runtimePosture.executionCapabilities` replaces removed `mode`.
2. Implement `TrustPostureStrip` wired on `src/app/page.tsx` **above** or **merged with** the existing authority/mode row.
3. ~~Align `ModePills`~~ — partial: `ModePills` now reads `trustPosture` with `credentials: "include"` (execute surface, step-up, scope).

---

## 3. Priority theme 2 — Approval review upgrade

| Capability | Already in repo | Where to extend |
|------------|-----------------|-----------------|
| Preflight (policy simulation) | `POST /api/preflight/route.ts`, `evaluatePreflightPolicy()` | `src/components/ApprovalsPanel.tsx` (already fetches preflight in places — deepen “checklist” UI) |
| Risk level | `getRiskLevel()` in preflight, `src/lib/risk.ts` | Chips + copy in `ApprovalsPanel` |
| Expected outputs | `expectedOutputs()` in preflight | Surface explicitly as checklist |
| code.apply block reasons | `getCodeApplyBlockReasons()` | Already plumbed into policy; show as **touched paths / rollback** when execute returns `rollbackCommand`, `filesChanged` (`ApprovalsPanel` execute result types) |
| Irreversible confirmation | `requiresIrreversibleConfirmation()`, `SafetyGatePanel` | Tighter coupling between preflight summary and execute button states |

**Files:** `src/components/ApprovalsPanel.tsx`, `src/components/AgentProposalsFeed.tsx`, `src/lib/risk.ts`, `src/app/api/preflight/route.ts`.

---

## 4. Priority theme 3 — Policy explainability

| Capability | Location |
|------------|----------|
| Machine-readable reasons | `src/lib/reason-taxonomy.ts` — `ReasonDetail`, `reasonFromPolicyReason()` |
| Persisted decisions | `src/lib/policy-decision-log.ts`, files via `src/lib/storage.ts` |
| Execute-time evaluation + log | `src/lib/policy.ts` — `evaluateExecutePolicy()` |
| API error payload | `POST .../execute` returns `reasonDetails` |
| Trace / activity | `src/app/api/traces/[traceId]/route.ts`, `src/app/api/activity/stream/route.ts`, `src/components/TracePanel.tsx` |

**UI work:** ensure deny/allow paths always surface `rule` + human summary from `reasonDetails` (not only `error` string). `ApprovalsPanel` already types `ReasonDetail[]` on errors.

---

## 5. Priority theme 4 — Trace playback UX

| Capability | Location |
|------------|----------|
| Trace API | `src/app/api/traces/[traceId]/route.ts` |
| Replay / merge | `src/lib/trace-replay.ts` |
| UI | `src/components/TracePanel.tsx`, `src/context/TraceContext.tsx` |
| Policy on trace | Policy decisions merged in trace route; `TracePanel` policy sections |

**Direction:** narrative ordering is already partly there; tighten labels to match governance story: proposal → verified → approved → policy → executed → artifacts (map to existing event types in route + panel).

---

## 6. Priority theme 5 — Mode clarity (demo vs live vs dry-run)

| Topic | Location | Note |
|-------|----------|------|
| Demo seed / drafts | `src/components/DraftsPanel.tsx` (`DEMO_SEED`) | Label as demo path in UI |
| Global dry-run lie | `src/app/api/config/route.ts` (`mode: "dry-run"`) | Fix as part of theme 1 |
| Per-adapter dry run | `src/app/api/execute/[approvalId]/route.ts`, `src/lib/normalize.ts` | Document in UI: “Live writes: code.apply only” until more kinds go live |
| System status / archive demo | `src/components/SystemStatus.tsx`, `src/app/api/proof-path/route.ts` | Keep explicit “demo data” language |

---

## 7. Sacred choke points (keep centralized)

| Concern | File |
|---------|------|
| Execute-time policy | `src/lib/policy.ts` |
| Approval chain before adapters | `src/lib/execution-gate.ts` |
| Ingress verification | `src/app/api/ingress/openclaw/route.ts` + `src/lib/ingress-openclaw.ts` |
| Storage paths | `src/lib/storage.ts` (future: split concerns per Alfred note — not blocking strip v1) |

---

## 8. Thesis Lock cross-check

This sprint strengthens **human authority**, **approval ≠ execution**, and **receipts/traces** without granting the model execution. Trust signals must **not** imply the model is trusted; they describe **enforcement posture** and **last known policy outcome**. If a signal cannot be tied to enforcement, ship it as **unknown** or **informational**, not green.

---

## See also

- [Control plane architecture](./control-plane.md)
- [OpenClaw ↔ Jarvis trust contract](./openclaw-jarvis-trust-contract.md)
- [Thesis Lock — `docs/strategy/jarvis-hud-video-thesis.md`](../strategy/jarvis-hud-video-thesis.md#thesis-lock-do-not-drift)
- [ADR-0003: Execution Policy v1](../decisions/0003-execution-policy-v1.md)
