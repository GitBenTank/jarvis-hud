# Jarvis Executor Strategy

## 1. Core Principle

Jarvis is the system of record.

All actions, approvals, and traces must originate from or pass through Jarvis.  
Execution layers (like OpenClaw) are not trusted as sources of truth.

---

## 2. OpenClaw is a Runtime

OpenClaw is an execution environment that:
- proposes actions
- runs tools
- interfaces with models

It does NOT:
- own state
- approve actions
- store authoritative history

OpenClaw is replaceable.

---

## 3. MCP is the Interface Layer

The Model Context Protocol (MCP) defines how execution environments interact with tools and systems.

It provides:
- a standardized tool interface
- portability across runtimes
- separation between reasoning and execution

Jarvis should remain MCP-compatible but not MCP-dependent.

---

## 4. Jarvis Owns Approval + Receipts

Jarvis is responsible for:
- approval gating (human or policy)
- receipt generation (what happened, when, why)
- trace logging (auditability)

Every action must produce:
- a trace ID
- a signed or verifiable record
- a clear origin (e.g., OpenClaw connector)

---

## 5. Ingress Model (Key Design)

External runtimes (like OpenClaw) interact with Jarvis via:

- signed requests (HMAC + timestamp + nonce)
- explicit allowlisting
- proposal → approval → execution lifecycle

This ensures:
- security (no blind execution)
- observability
- replay protection

---

## 6. Replaceability Requirement

OpenClaw (or any runtime) should be replaceable if:

- it cannot enforce required security constraints
- it limits observability or tracing
- it becomes tightly coupled to Jarvis logic
- a better execution layer emerges

Jarvis must never depend on a single runtime.

---

## 7. Architectural Boundary

| Layer        | Responsibility                  |
|--------------|-------------------------------|
| Jarvis       | Control plane, approvals, logs |
| MCP          | Interface standard            |
| OpenClaw     | Runtime / execution           |

---

## 8. Guiding Rule

> If a component can act without Jarvis knowing, it is incorrectly designed.
