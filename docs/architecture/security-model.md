# Jarvis HUD Security Model

Jarvis enforces multiple boundaries so AI-driven automation remains **governed, observable, and auditable**. No single layer is trusted; each stage adds defense.

---

## Boundaries

| Boundary | When | Purpose |
|----------|------|---------|
| **Connector verification** | Ingress | Only allowlisted connectors with valid signatures can propose actions |
| **Human approval** | Before execution | Operators review and approve; no auto-execution |
| **Policy gate** | Execute-time | Kind allowlist, auth step-up, preflight checks before adapters run |
| **Receipts and traces** | After execution | Audit trail for every action |

---

## Defense in Depth

1. **Trusted Ingress** — Controls what can propose. HMAC-signed requests; connector allowlist; nonce replay protection.
2. **Approval gate** — Human authority. Proposals queue until approved; approval ≠ execution.
3. **Policy gate** — Execute-time enforcement. Unknown kinds blocked; step-up when auth enabled; preflight for `code.apply`.
4. **Audit trail** — Receipts written to `~/jarvis/actions/YYYY-MM-DD.jsonl`; traces link proposal → approval → execution → receipt.
5. **Policy decision logs** — Every policy evaluation logged to `~/jarvis/policy-decisions/YYYY-MM-DD.jsonl` with `traceId`, `decision`, `rule`, `reason`, `timestamp`. Answers: *Why was execution allowed or blocked?*

---

## Core Principle

**The model is not a trusted principal.** Execution authority originates only from a human. AI may propose; humans must authorize.

---

## See Also

- [Policy Decision Logs](policy-decision-logs.md) — why execution was allowed or blocked
- [Agent Execution Model](../security/agent-execution-model.md) — runtime constraints, Thesis Lock
- [Trusted Ingress](../security/trusted-ingress.md) — connector verification
- [ADR-0003: Execution Policy v1](../decisions/0003-execution-policy-v1.md) — policy gate implementation
