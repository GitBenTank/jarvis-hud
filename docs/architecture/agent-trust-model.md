# Agent Trust Model

Jarvis is built on a simple rule:

**Agents are proposers, not actors.**

AI systems can recommend actions, but they are not trusted principals with direct authority over execution.

---

## Core Model

```
Agent
  ↓ proposes

Jarvis
  ↓ verifies, evaluates policy, and decides

System
  ↓ executes within a controlled boundary
```

---

## Why This Matters

Most agent systems collapse these roles:

```
Agent → decides → executes
```

Jarvis separates them:

```
Agent → proposes
Jarvis → verifies and governs
Human / policy → authorizes
System → executes
```

This separation improves:

- **Safety** — No direct agent-to-execution path
- **Auditability** — Every stage is recorded
- **Debuggability** — Divergence is traceable
- **Governance** — Policy and human gates are explicit

---

## Trust Boundaries

### 1. Agent Boundary

The model is **allowed** to:

- Generate intent
- Suggest actions
- Provide context

The model is **not** allowed to:

- Execute actions directly
- Bypass approval
- Bypass policy
- Act as a trusted principal

### 2. Control-Plane Boundary

Jarvis is responsible for:

- Connector verification
- Proposal intake
- Approval workflow
- Policy evaluation
- Execution orchestration
- Receipt generation
- Trace recording

### 3. Execution Boundary

The runtime executes only after:

- Proposal acceptance
- Approval requirements are satisfied
- Policy checks pass

---

## Operational Principle

Jarvis treats model output as **untrusted intent** until it passes through control-plane checks.

That means:

- A proposal is not an action
- Approval is not execution
- Execution must still pass policy

---

## Lifecycle

```
Agent
  ↓
Proposal
  ↓
Verification
  ↓
Approval
  ↓
Policy Gate
  ↓
Execution
  ↓
Receipt
  ↓
Trace
```

---

## Design Consequence

This model makes Jarvis closer to:

- A control plane
- An admission controller
- A governance layer for automation

and farther from:

- An autonomous agent runner
- A blind execution wrapper

---

## Summary

Jarvis does not trust the model to **act**.

Jarvis trusts the model to **propose**.

Everything after that is governed by the control plane.

---

## See Also

- [Control Plane Architecture](control-plane.md)
- [Security Model](security-model.md)
- [Agent Execution Model](../security/agent-execution-model.md)
