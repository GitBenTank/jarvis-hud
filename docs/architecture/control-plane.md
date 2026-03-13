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
    B4 --> B5
    B5 --> C1
    B5 --> C2
    B5 --> C3
    B5 --> B6
    B6 --> B7
```

---

## Flow: Agent → Proposal → Approval → Execution → Receipt → Trace

```mermaid
flowchart LR
    A[AI Agent] -->|Proposes action| B[Jarvis Ingress]
    B -->|Verifies connector + signature| C[Verification Layer]
    C -->|Accepted proposal| D[Approval Queue]
    D -->|Reviewed by human| E[Approval Gate]
    E -->|Approved| F[Execution Engine]
    F -->|Runs controlled action| G[Action Adapter]
    F -->|Writes execution record| H[Receipt Log]
    H -->|Builds audit trail| I[Trace Timeline]
```

---

## Lifecycle Stages

| Stage | Description |
|-------|--------------|
| **Proposal** | Agent submits action via ingress connector (e.g. OpenClaw) |
| **Verification** | Jarvis verifies connector identity, shared secret, proposal structure |
| **Approval** | Human operator reviews in Jarvis HUD UI; actions cannot execute without approval |
| **Execution** | Approved actions run through controlled adapters (system.note, code.apply, etc.) |
| **Receipt** | Every execution produces a receipt at `~/jarvis/actions/YYYY-MM-DD.jsonl` |
| **Trace** | Timeline of proposal received → approval → execution → receipt for audit |

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
- [OpenClaw Integration Verification](../openclaw-integration-verification.md) — ingress, env, troubleshooting
