---
title: "Control Plane Architecture"
status: "living-document"
category: architecture
related:
  - ../strategy/jarvis-hud-video-thesis.md
  - ../security/agent-execution-model.md
  - ../decisions/0001-thesis-lock.md
---

# Jarvis Control Plane Architecture

Jarvis HUD is an **AI execution control plane**. It sits between agents (e.g. OpenClaw) and real-world actions, enforcing human authority over execution.

**Core thesis:** Agents propose → Humans approve → System executes → Receipts recorded.

---

## Architecture Diagram

```mermaid
flowchart TD
    subgraph AgentLayer[Agent Layer]
        A1[OpenClaw Agent]
    end

    subgraph ControlPlane[Jarvis Control Plane]
        B1[Ingress Endpoint]
        B2[Connector Verification]
        B3[Approval Queue]
        B4[Human Approval Gate]
        B4a[Policy Gate]
        B5[Execution Engine]
        B6[Receipt Logging]
        B7[Trace Timeline]
    end

    subgraph ActionLayer[Action Layer]
        C1[System Note]
        C2[Code Apply]
        C3[Future Adapters]
    end

    A1 --> B1
    B1 --> B2
    B2 --> B3
    B3 --> B4
    B4 --> B4a
    B4a --> B5
    B5 --> C1
    B5 --> C2
    B5 --> C3
    B5 --> B6
    B6 --> B7
```

---

## Flow: Agent → Proposal → Approval → Policy Gate → Execution → Receipt → Trace

```mermaid
flowchart LR
    A[AI Agent] -->|Proposes action| B[Jarvis Ingress]
    B -->|Verifies connector + signature| C[Verification Layer]
    C -->|Accepted proposal| D[Approval Queue]
    D -->|Reviewed by human| E[Approval Gate]
    E -->|Approved| F[Policy Gate]
    F -->|Kind allowlist, step-up, preflight| G[Execution Engine]
    G -->|Runs controlled action| H[Action Adapter]
    G -->|Writes execution record| I[Receipt Log]
    I -->|Builds audit trail| J[Trace Timeline]
```

---

## Lifecycle Stages

| Stage | Description |
|-------|--------------|
| **Proposal** | Agent submits action via ingress connector (e.g. OpenClaw) |
| **Verification** | Jarvis verifies connector identity, shared secret, proposal structure |
| **Approval** | Human operator reviews in Jarvis HUD UI; actions cannot execute without approval |
| **Policy Gate** | Built-in checks (kind allowlist, auth step-up, preflight) run before any adapter; blocks execution if policy fails |
| **Execution** | Approved actions run through controlled adapters (system.note, code.apply, etc.) |
| **Receipt** | Every execution produces a receipt at `~/jarvis/actions/YYYY-MM-DD.jsonl` |
| **Trace** | Timeline of proposal received → approval → execution → receipt for audit |

---

## Policy Gate

Jarvis enforces a **policy gate** at execute-time — before any adapter runs. If policy blocks, no adapter code runs. Implemented in `evaluateExecutePolicy()`.

**Today (built-in, in code):**

- **Kind allowlist** — Only allowed action kinds (e.g. `system.note`, `code.apply`, `code.diff`) can execute.
- **Auth step-up** — When auth is enabled, high-risk execution may require step-up authentication.
- **code.apply preflight** — Requires `JARVIS_REPO_ROOT`, clean worktree, and other preflight checks.

**Planned later:** Config-driven policy rules, per-kind approval requirements, file-based policy definitions.

See [ADR-0003: Execution Policy v1](../decisions/0003-execution-policy-v1.md).

---

## Routes

| Stage | Route | Purpose |
|-------|-------|---------|
| Ingress | `POST /api/ingress/openclaw` | Receive signed proposals from connectors |
| Approval | `GET /api/approvals`, `POST /api/approvals/[id]` | List and approve/deny proposals |
| Execution | `POST /api/execute/[approvalId]` | Execute approved proposals |
| Trace | `GET /api/traces/[traceId]` | Reconstruct session from trace ID |

---

## Authority Boundary

The control plane enforces:

- The model may generate proposals.
- The model may not execute actions.
- Execution authority originates only from a human.
- Policy scopes must be human-defined.
- Automation may reduce friction, but must not transfer authority.

---

## See Also

- [Agent Execution Model](../security/agent-execution-model.md) — security constraints
- [ADR-0001: Thesis Lock](../decisions/0001-thesis-lock.md) — rationale for authority boundary
- [ADR-0003: Execution Policy v1](../decisions/0003-execution-policy-v1.md) — policy gate, kind allowlist, step-up
- [OpenClaw Integration Verification](../openclaw-integration-verification.md) — ingress, env, troubleshooting
