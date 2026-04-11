---
title: "OpenClaw V1 — Jarvis integration contract"
status: "living-document"
category: architecture
related:
  - openclaw-jarvis-trust-contract.md
  - operator-sprint-trust-map.md
  - ../security/openclaw-ingress-signing.md
---

# OpenClaw V1 — Jarvis integration contract

This is the **ordered integration plan** for OpenClaw agents (Alfred, Forge, …) against Jarvis HUD, after canonical posture exists on `GET /api/config`.

---

## Hard rule — pre-submission posture

**Before any `POST /api/ingress/openclaw` that intends to enter the approval queue as an executable action, Alfred MUST:**

1. **Fetch** `GET /api/config` from the same Jarvis base URL used for ingress (or a bridge that returns the **identical** JSON shape).
2. **Evaluate** `trustPosture` and top-level flags (`ingressOpenclawEnabled`, `openclawAllowed`, `authEnabled`, …).
3. **Narrate uncertainty or downgrade** when posture is unknown, blocking for the proposed kind, or not applicable — never substitute guesses for Jarvis truth.

**Alfred may consume only what is surfaced:**

- `trustPosture.stepUpValid` (`null` = not applicable, e.g. auth off, or no session in this client)
- `trustPosture.executionScopeEnforced`
- `trustPosture.codeApplyBlockReasons`
- `trustPosture.executionCapabilities`
- `trustPosture.executionSurfaceLabel`

**Alfred must not claim:**

- a global “dry-run mode” for the HUD
- “execution is safe” or “apply will succeed”
- step-up status **unless** read from surfaced fields (browser integrations with cookies may see `true`/`false`; headless Node without cookies must not treat `null` as failure)

**Implementation in this repo:**

- `src/jarvis/trust-posture.ts` — `preflightTrustPostureForKind()`, `evaluateTrustPostureForProposedKind()`
- `src/jarvis/submitProposal.ts` — optional `trustPreflight`, `abortIfIngressLikelyRejected`, `abortIfCodeApplyLikelyBlocked`

Node callers do not send session cookies; when `JARVIS_AUTH_ENABLED=true`, `stepUpValid` may be `null` in config. That is **not** “step-up failed” — it is **unknown / N/A for this client** (see [OpenClaw ↔ Jarvis trust contract](./openclaw-jarvis-trust-contract.md)).

---

## V1 build sequence (recommended)

1. **This doc + trust contract** — shared rulebook (done as living docs).
2. **Alfred local ingress validator** — align outbound JSON with `validate-openclaw-proposal` / signing spec before POST (reduce avoidable 4xx).
3. **Alfred reads posture before submission** — use `preflightTrustPostureForKind` or equivalent; attach `messages` to logs or advisory text.
4. **Forge** — uses posture as **shaping context** only; never claims approved / executed / recorded.
5. **system.note** — first happy-path kind: submit → approve → execute → receipt → trace.
6. **Inspect** approval UI, receipt, trace for one run.
7. **Promote to code.diff** — still dry-run oriented in adapters.
8. **code.apply last** — only when `trustPosture.codeApplyBlockReasons` is empty (or operator explicitly overrides); never assert success from the agent layer.

---

## Forge rules (summary)

Forge may use posture to:

- downgrade to advisory wording
- avoid proposing `code.apply` when block reasons are non-empty
- add cautions about scope or execution surface

Forge must not claim approval, policy outcome, execution, or receipt state — only Jarvis and the human operator hold that truth.

---

## See also

- [OpenClaw ↔ Jarvis trust contract](./openclaw-jarvis-trust-contract.md) — honesty tags, role matrix
- [OpenClaw ingress signing](../security/openclaw-ingress-signing.md)
