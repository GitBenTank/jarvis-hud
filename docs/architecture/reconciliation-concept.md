# Reconciliation Concept

Jarvis does not stop at execution.

It should eventually verify whether the executed outcome matches the approved intent.

---

## Core Idea

Most AI agent tools are request/response systems:

- Model decides
- System acts
- Done

A real control-plane system behaves more like Kubernetes:

- Desired state is proposed
- Current state is observed
- The system reconciles toward approved state
- Divergence is detected and logged

For Jarvis, that means:

- Proposal says what should happen
- Execution records what did happen
- Reconciliation checks whether reality matches the approved intent
- Any drift becomes a first-class event

---

## Model

| Concept | Definition |
|--------|------------|
| **Desired state** | What the proposal / approval authorized |
| **Observed state** | What the system actually did |
| **Reconciliation** | Compare the two |
| **Drift** | Mismatch between approved intent and observed reality |

---

## Example

**Approved intent:**

- Create system note titled "Deploy staged"

**Observed result:**

- Action returned success
- No note artifact found

**Reconciliation result:**

- `drift_detected`

---

## Why This Matters

Right now Jarvis explains:

- How actions are proposed
- How they are approved
- How they are executed
- How they are recorded

Reconciliation adds:

- How Jarvis compares approved intent vs observed result
- How it detects drift
- How drift becomes a first-class event

**That's a big conceptual upgrade.**

Approvals alone are not enough. Receipts alone are not enough. Systems need to know whether reality matched intent.

---

## Future Lifecycle

With reconciliation, the lifecycle becomes:

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
Reconciliation
  ↓
Trace / Drift Event
```

---

## Roadmap Value

This makes Jarvis feel closer to:

- Kubernetes reconciliation
- Control planes
- Workflow / orchestration systems
- Policy-driven infrastructure

and pushes Jarvis from "approval-gated agent system" toward "real control-plane thinking."

---

## Reconciliation Controller

Future Jarvis may run reconciliation in a background controller loop. Instead of one-shot reconciliation at execution time, a controller would periodically:

- Find approved+executed actions not yet verified
- Compare observed state to desired state
- Emit verified, drift_detected, or reconcile_retry_needed

That shifts Jarvis from *approve → execute once* to *approve desired state → controller reconciles until reality matches*. See [Reconciliation](reconciliation.md) for implementation details.

---

## See Also

- [Control Plane Architecture](control-plane.md)
- [Agent Trust Model](agent-trust-model.md)
- [Security Model](security-model.md)
