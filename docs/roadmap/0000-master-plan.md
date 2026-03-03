# Jarvis HUD Master Plan — Secure AI Code Execution for Engineering Teams

**Status:** Living document  
**Owner:** Ben Tankersley  
**Created:** 2026-02  
**Related:**  
- [Video Thesis](../strategy/jarvis-hud-video-thesis.md)  
- [Agent Execution Model](../security/agent-execution-model.md)  
- [Control Plane](../architecture/control-plane.md)  
- [ADR-0001: Thesis Lock](../decisions/0001-thesis-lock.md)  
- [ADR-0002: Positioning and ICP](../decisions/0002-money-arc-and-icp.md)  
- [ADR-0003: Execution Policy v1](../decisions/0003-execution-policy-v1.md)

---

## 1. Purpose

Jarvis HUD is a local-first approval and control layer for AI agents that have real execution capabilities.

As AI systems gain file access, tool access, and API permissions, the primary risk shifts from model quality to execution authority.

Jarvis HUD enforces a clear boundary:

> AI may propose.  
> Humans authorize execution.  
> Every execution produces receipts.

This document defines the end state, architecture direction, and staged implementation plan.

---

## 2. End State

When complete, Jarvis HUD functions as a secure execution boundary between AI agents and production systems.

It provides:

- Human-gated execution
- Explicit separation of proposal and execution
- Deterministic artifact generation
- Durable receipts (artifact + action log)
- Policy enforcement
- Step-up authentication for high-risk actions
- Replayable traces
- Extensible execution adapters

External APIs remain disabled unless explicitly enabled and policy-gated.

The system remains aligned with Thesis Lock at all times.

---

## 3. Initial Target Environment

Jarvis HUD is designed for:

- Technical founders
- Individual developers
- Small engineering teams
- Organizations experimenting with AI-assisted development

Common characteristics:

- Using AI coding tools (Cursor, Claude Dev, etc.)
- Running local agents with file and tool access
- Concerned about unintended execution or silent changes
- Require visibility, accountability, and review boundaries

---

## 4. Core Principle

**AI can propose anything. Execution requires explicit human authorization. Every action has receipts.**

Short form:

Autonomy in thinking.  
Authority in action.

---

## 5. System Architecture Direction

### 5.1 Control Plane

The control plane is the central interface for:

- Reviewing proposals
- Approving or denying actions
- Executing approved actions
- Viewing receipts
- Inspecting trace history

Approval does not imply execution.

Execution requires explicit action.

---

### 5.2 Event Model

Every proposal and execution is represented as structured events.

Key properties:

- `trace_id`
- `event_id`
- `timestamp`
- `kind`
- `status`
- `payload`
- `artifact references`

Events are append-only and durable.

---

### 5.3 Execution Adapters

Execution adapters define what the system can do.

Each adapter must:

- Be local-first
- Produce deterministic artifacts
- Respect approve ≠ execute
- Generate receipts
- Not treat the model as a trusted principal

Current adapters:

- `content.publish`
- `youtube.package`
- `system.note`
- `reflection.note`
- `code.diff` — dry-run diff packaging
- `code.apply` — git-backed apply + commit with receipts and rollback notes

Planned adapters:

- Replay mode — trace playback
- Policy v1 — risk tiers + allowlists

External integrations remain policy-gated.

---

## 6. Threat Model (Zero Trust)

Jarvis HUD adopts a Zero Trust posture for agentic systems.

### Threats Addressed

| Threat | Mitigation |
|--------|------------|
| Prompt injection / tool misuse | Human-gated execution |
| Confused deputy | Model cannot execute directly |
| Silent execution | Receipts required for all executions |
| Stolen session | Optional auth + step-up |
| Data exfiltration | Local-first; no outbound by default |
| Credential concentration | Execution boundary separates agent from privileged context |

Zero Trust principle:

Never trust. Always verify.

Humans verify before execution.

---

## 7. Feature Surfaces

| Surface | Purpose |
|----------|----------|
| Control Plane | Proposal queue and execution authority |
| Receipts / Activity Log | Durable proof of what executed |
| Policies | Risk tiers and approval requirements |
| Replay | Trace playback for debugging and audit |
| Visual Mode (Agent Ant Farm) | Observability into agent activity (not authority) |

The visual layer must reflect real events, not simulations.

---

## 8. Thesis Lock Compatibility Checklist

Before any feature is shipped:

- [ ] Does it preserve approve ≠ execute?
- [ ] Does it produce receipts (artifact + log)?
- [ ] Is the model treated as a trusted principal? (Must be NO)
- [ ] Does high-risk execution require step-up when auth is enabled?
- [ ] Are policies human-defined?

If any feature violates Thesis Lock, the feature is incorrect — not the thesis.

---

## 9. 90-Day Implementation Plan

### Weeks 1–2  
Implement `code.diff`  
- Dry-run diff packaging  
- No apply  
- Store patch artifact  
- Display in approval UI  

### Weeks 3–4  
Implement `code.apply`  
- `git apply --check`
- Controlled commit with receipt
- Commit hash logging
- Rollback notes in receipt

### Weeks 5–6  
Policies v1  
- Risk tiers (low/medium/high)
- Allowlist support
- High-risk requires step-up

### Weeks 7–8  
Replay Mode v1  
- Trace playback
- Event-by-event visualization
- Sync with log + UI

### Weeks 9–10  
Multi-user Mode  
- Basic role boundaries
- Approval permissions per role
- Shared receipts

### Weeks 11–12  
Enterprise Hardening Layer  
- SSO roadmap
- RBAC extension
- Immutable audit export
- Compliance documentation surface
- Trusted Ingress: connector ingress v1 (OpenClaw) with HMAC + replay protection and allowlist
- Scoped connector identities (separate accounts / service principals)

---

## 10. Strategic Position

Jarvis HUD is not an agent framework.

It is a control plane.

It does not compete on agent capability.

It governs what agents are allowed to execute.

It integrates with any agent that can produce structured proposals.

---

## 11. Non-Goals

Jarvis HUD does not aim to:

- Replace AI coding tools
- Provide model training
- Provide prompt optimization services
- Automatically execute actions without approval
- Blur the boundary between cognition and authority

---

## 12. Long-Term Direction

As AI systems gain broader operational permissions, execution control becomes mandatory infrastructure.

Jarvis HUD's long-term objective is to serve as the secure boundary between AI cognition and production systems.

Its value lies in:

- Explicit authority boundaries
- Durable receipts
- Replayability
- Policy enforcement
- Human accountability
