# ADR-0001: Adopt Thesis Lock as Governance Boundary

Status: Accepted  
Date: 2026-02-25  
Owner: Ben Tankersley  

**Related:** [ADR-0005: Agent team batch v0](./0005-agent-team-batch-v0-per-item-execute.md) · [Agent team v1](../strategy/agent-team-v1.md)

---

## Context

Agentic systems are transitioning from output-only assistants to action-capable runtimes.

When an agent has access to tools, credentials, or system-level permissions, the primary risk shifts from incorrect output to uncontrolled execution.

Common failure modes include:

- Unchecked execution (excessive agency)
- Prompt injection becoming action injection
- Confused-deputy patterns
- Silent execution without audit trail
- Credential concentration without boundary

Traditional assistant models assume output review is sufficient.
Execution-capable systems invalidate that assumption.

---

## Decision

Adopt **Thesis Lock** as the non-negotiable governance boundary for Jarvis HUD.

Execution authority must always remain distinct from cognitive autonomy.

Jarvis HUD enforces:

- Propose → Approve → Execute separation
- Explicit human approval before execution
- Artifact + log production for every action
- The model is not treated as a trusted principal

If a feature violates Thesis Lock, the feature is incorrect — not the thesis.

---

## Risks This Protects Against

1. Ambient authority escalation
2. Silent destructive execution
3. Prompt injection turning into real-world action
4. Loss of auditability and provenance
5. Drift toward convenience over safety

---

## Why the Model Is Not a Trusted Principal

The model:

- Optimizes outputs probabilistically
- Can be coerced via prompt manipulation
- Does not possess intent or authority
- Cannot own accountability

Therefore:

Cognition and authority must remain separate.

The model may propose.
Only humans authorize.

---

## Consequences

### Costs
- Increased friction
- Slower execution loops
- More UI/UX complexity
- Additional logging overhead

### Benefits
- Bounded blast radius
- Auditable execution
- Explicit authority chain
- Governance compatibility
- Architectural coherence

---

## Long-Term Implication

Jarvis HUD is not an assistant wrapper.

It is a runtime boundary layer for agentic execution.

Autonomy in thinking.
Authority in action.
