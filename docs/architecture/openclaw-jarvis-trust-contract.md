---
title: "OpenClaw ↔ Jarvis trust contract"
status: "living-document"
category: architecture
related:
  - openclaw-v1-contract.md
  - operator-sprint-trust-map.md
  - ../strategy/jarvis-hud-video-thesis.md
  - ../security/trusted-ingress.md
---

# OpenClaw ↔ Jarvis trust contract

Jarvis is the **substrate**: it enforces ingress, approval, policy, execution, and receipts. OpenClaw-side agents (e.g. Alfred, Forge) are **proposers**: they must not invent runtime posture that the substrate does not expose.

This document defines **which posture fields are canonical**, **who may consume them**, and **how to label confidence**.

---

## Honesty tags (required)

Any posture signal used in UI or agent copy MUST be classified as:

| Tag | Meaning | Allowed phrasing |
|-----|---------|------------------|
| **enforced_and_surfaced** | Checked on the real path AND exposed by Jarvis API | Confident, factual (“Step-up: REQUIRED”, “Scope: ENFORCED”) |
| **enforced_unsurfaced** | Checked in code but not yet in API | Jarvis-only internals; agents/UI must **not** claim it |
| **inferred_only** | Derived client-side or guessed | “Likely”, “check HUD”, or silence |
| **unknown** | Missing data or fetch failed | “Unknown”, spinner, or error state |

Only **enforced_and_surfaced** may use **authoritative** language.

---

## Ingress capability vs human authority

Valid **`POST /api/ingress/openclaw`** means the caller had the **shared ingress secret** and a conforming body — an **enforced** check, but **not** identification of a human operator. **Approval and execution** remain human-gated in the HUD (and session + step-up when `JARVIS_AUTH_ENABLED=true`). See [Operating assumptions §2](../strategy/operating-assumptions.md#2-auth-and-step-up-jarvis) and [OpenClaw V1 contract](./openclaw-v1-contract.md#human-authority-boundary-phase-2).

---

## Mandatory pre-submission posture (OpenClaw V1)

**Alfred MUST** fetch and evaluate `GET /api/config` before submitting proposals that enter the executable approval path, then **downgrade or narrate uncertainty** when posture is unknown or blocking — not invent substitute truth.

Full ordering, abort flags, and in-repo helpers: [OpenClaw V1 contract](./openclaw-v1-contract.md). Reference implementation: `src/jarvis/trust-posture.ts`, `submitProposal(..., { trustPreflight: true })`.

---

## Canonical source: `GET /api/config`

**Primary contract:** `GET /api/config` (with browser `credentials: "include"` when step-up applies) returns:

| Field | Tag | Meaning |
|-------|-----|---------|
| `trustPosture.executionCapabilities` | enforced_and_surfaced | Aligns with `POST /api/execute` `dryRun` semantics (`src/lib/execution-surface.ts`, execute route). |
| `trustPosture.executionSurfaceLabel` | enforced_and_surfaced | Short HUD label derived from the same object. |
| `trustPosture.stepUpValid` | enforced_and_surfaced when `authEnabled`; else **null** (N/A) | From session cookie + `isStepUpValid()`; same basis as execute/preflight. |
| `trustPosture.executionScopeEnforced` | enforced_and_surfaced | `loadExecutionAllowedRoots().length > 0` (`src/lib/execution-scope.ts`). |
| `trustPosture.codeApplyBlockReasons` | enforced_and_surfaced | `getCodeApplyBlockReasons()`; same checks folded into execute-time policy for `code.apply`. |
| `runtimePosture.*` (counts, latest deny, etc.) | enforced_and_surfaced / inferred | Derived from today’s events/actions/policy log; factual for **today’s date key**, not a guarantee for future executes. |
| `authEnabled`, `ingressOpenclawEnabled`, … | enforced_and_surfaced | Env + connector configuration as implemented in the route. |

**Alfred and Forge** should treat `trustPosture` + top-level config flags as the **only** authoritative posture for: live vs dry-run **by kind**, step-up, scope enforcement, and code.apply preflight blockers. If a field is absent or `null`, treat as **unknown** or **N/A**, not as false.

---

## Role matrix

### Alfred (coordinator / lane selection)

**May consume (read-only):**

- Full `GET /api/config` JSON when integrating from a context that can call Jarvis HTTP (or equivalent internal bridge that returns the **same** payload).
- `trustPosture.stepUpValid` to choose **advisory-only** vs **executable** lanes when auth is on.

**Must not:**

- Infer “repo is clean”, “scope is safe”, or “preflight passed” without `trustPosture.codeApplyBlockReasons` empty (for `code.apply`) or without calling `POST /api/preflight` with the **proposed kind** and interpreting the response.
- State global “HUD is dry-run” — use `executionCapabilities` / `executionSurfaceLabel` instead.

### Forge (proposal builder)

**May consume:**

- `trustPosture.codeApplyBlockReasons` and `codeApplyAvailable` to **warn** in proposals (“likely blocked: …”).
- `trustPosture.executionScopeEnforced` to avoid proposing paths outside allowed roots (when path metadata is available).

**Must not:**

- Claim “execution allowed” or “mode is safe” — only humans approve; policy runs at execute time.
- Claim “step-up satisfied” without reading `trustPosture.stepUpValid` from Jarvis.

### Jarvis-only (not for agent confident claims)

- Raw event files, nonce cache state, rate-limit internals.
- **Per-approval** execution gate outcome until after `validateExecutionPreconditions` on the specific approval id.

---

## Drift prevention

1. **Single choke points** — Policy: `evaluateExecutePolicy()`; gate: `validateExecutionPreconditions()`; ingress: `POST /api/ingress/openclaw`. If a new check is added there, either surface it on `GET /api/config` or keep it **Jarvis-only** until surfaced.
2. **Agents mirror the strip** — HUD and OpenClaw extensions should prefer the **same** `trustPosture` fields rather than duplicating env parsing.
3. **Thesis Lock** — Agents propose; they do not execute. Posture language must never imply the model holds execution authority.

---

## See also

- [OpenClaw V1 contract](./openclaw-v1-contract.md)
- [Operator sprint — trust map & strip contract](./operator-sprint-trust-map.md)
- [Trusted ingress](../security/trusted-ingress.md)
- [Thesis Lock](../strategy/jarvis-hud-video-thesis.md#thesis-lock-do-not-drift)
