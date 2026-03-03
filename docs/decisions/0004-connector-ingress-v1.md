# ADR-0004: Connector Ingress v1 (OpenClaw)

**Status:** Accepted  
**Date:** 2026-02  
**Related:** [ADR-0001: Thesis Lock](./0001-thesis-lock.md) · [ADR-0003: Execution Policy v1](./0003-execution-policy-v1.md) · [Trusted Ingress](../security/trusted-ingress.md)

---

## Context

Jarvis HUD requires a way for external connectors (e.g. OpenClaw) to submit proposals without compromising the security boundary. Uncontrolled ingress increases prompt-injection surface and allows unauthorized callers to influence what the agent proposes. We needed a trusted ingress gate that creates pending proposals only, with no auto-approval or execution.

---

## Decision

Introduce **Connector Ingress v1** for OpenClaw:

- Implement `POST /api/ingress/openclaw` as a single inbound endpoint
- Ingress creates events with `status: "pending"` and `requiresApproval: true` only
- HMAC-SHA256 signature + timestamp + nonce for authentication and replay protection
- Connector allowlist via `JARVIS_INGRESS_ALLOWLIST_CONNECTORS`
- In-memory nonce cache (LRU, ~2000 entries) for replay detection
- Event metadata includes `source` (connector, verified, nonce, timestamp) and `trustedIngress` (ok, reasons)

---

## Invariants

1. **Ingress may only create events with `status: "pending"` and `requiresApproval: true`.** No auto-approval.
2. **Ingress must not execute, call adapters, or post externally.** It is write-only to the events store.
3. **Execution remains gated by Approval + Execution Policy + optional Auth/Step-up.** Ingress does not bypass these.
4. **Action log remains receipt-only.** Ingress does not write to the action log.
5. **Ingress is OFF by default.** Requires `JARVIS_INGRESS_OPENCLAW_ENABLED=true` and a valid secret (≥32 chars).

---

## Threat Model

| Threat | Mitigation |
|--------|------------|
| Unauthorized caller | HMAC-SHA256 signature; secret shared with trusted connector |
| Replay attack | Timestamp window (5 min past, 2 min future) + nonce cache |
| Prompt injection / uncontrolled proposals | Connector allowlist; only allowlisted connectors can create proposals |
| Missing/invalid config | Ingress disabled when secret missing or too short; 403 when connector not in allowlist |

---

## Relationship to Execution Policy v1

**Execution Policy** governs what can *run* (execute).  
**Trusted Ingress** governs what can *influence proposals*.

Both are required for defense in depth. Ingress creates proposals; policy and human approval gate execution. Policy does not replace Trusted Ingress.

---

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `JARVIS_INGRESS_OPENCLAW_ENABLED` | "true" to enable ingress |
| `JARVIS_INGRESS_OPENCLAW_SECRET` | Shared secret (min 32 chars) for HMAC |
| `JARVIS_INGRESS_ALLOWLIST_CONNECTORS` | Comma-separated allowlist (e.g. "openclaw") |

---

## Non-Goals (This Iteration)

- No persistence for nonce cache beyond process lifetime
- No bearer token auth (HMAC only for v1)
- No automatic polling or webhooks from Jarvis outward
- No new execution adapters
