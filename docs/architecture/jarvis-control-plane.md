# Jarvis HUD Control Plane Architecture

## Overview

Jarvis HUD is an **AI execution control plane**. It sits between agents (e.g. OpenClaw) and the execution environment, enforcing human authority over irreversible actions.

**Core thesis:**

- Agents can propose actions
- Humans control execution
- Every action produces receipts

This architecture separates intelligence from authority: agents think and propose; humans authorize; execution is traceable.

---

## Governance Lifecycle

```
Agent
  ↓ propose
Proposal
  ↓ validate
Validation
  ↓ human gate
Human Approval
  ↓ execute
Execution
  ↓ receipt
Receipt + Artifact
```

**Routes:**

| Stage | Route | Purpose |
|-------|-------|---------|
| Ingress | `POST /api/ingress/openclaw` | Receive signed proposals from connectors |
| Approval | `GET /api/approvals`, `POST /api/approvals/[id]` | List and approve/deny proposals |
| Execution | `POST /api/execute/[approvalId]` | Execute approved proposals |
| Trace | `GET /api/traces/[traceId]` | Reconstruct session from trace ID |

---

## Trace System

Every lifecycle step shares:

- **traceId** — Links proposal → approval → execution → receipt
- **approvalId** — Event/proposal ID
- **timestamp** — When the step occurred
- **artifact** — Output path (bundle, manifest)
- **receipt** — Action log entry with metadata

Trace IDs enable session reconstruction for audit and observability.

---

## Event Model

Events are normalized into activity types for observability:

| Type | Actor | Description |
|------|-------|-------------|
| `proposal_created` | agent (e.g. openclaw) | Proposal ingested |
| `proposal_validated` | jarvis | Schema validation passed |
| `proposal_approved` | human | Human approved |
| `execution_started` | jarvis | Execution began |
| `execution_completed` | jarvis | Execution finished |
| `receipt_created` | jarvis | Receipt written |

These feed the **Activity Stream**.

---

## Activity Stream

**Endpoint:** `GET /api/activity/stream`

**Purpose:** Expose normalized event history for observability and visualization.

**Response:** Flat array of activity events, sorted by timestamp. Each event has `traceId`, `timestamp`, `actor`, `type`, `status`.

See `src/app/api/activity/stream/route.ts` for implementation.

---

## Safety Model

| Layer | Mechanism |
|-------|-----------|
| Schema validation | `validateOpenClawProposal` — required fields, size limits, patch sanity |
| Irreversible confirmation | UI requires checkbox + typed phrase (e.g. `APPLY`) for CRITICAL kinds |
| Approval gate | Execution requires `status === "approved"` |
| Receipts | Every execution writes action log + artifact |

---

## Visualization Layers

All use the same event stream:

| Layer | Purpose |
|-------|---------|
| **Activity Timeline** | Audit view — chronological list |
| **Control Plane Graph** | System view — nodes and edges showing causality |
| **Agent Ant Farm** (future) | Narrative view — agents as moving entities |

---

## Connectors

| Connector | Status | Ingress |
|-----------|--------|---------|
| OpenClaw | ✅ | `POST /api/ingress/openclaw` (HMAC signed) |
| OpenAI | Planned | — |
| Anthropic | Planned | — |
| System | Planned | — |

---

## Future Work

- Activity Stream API
- Control Plane Graph (React Flow)
- Agent Ant Farm visualization
- Policy engine (kind allowlists, risk tiers)
- Multi-user approval workflows
