---
title: "Jarvis Strongman (Operator Brief)"
status: living-document
category: product-strategy
related:
  - docs/strategy/jarvis-hud-video-thesis.md
  - docs/strategy/gener8tor-pitch.md
  - docs/strategy/competitive-landscape-2026.md
  - docs/strategy/agent-team-contract-v1.md
  - docs/strategy/research-agent-v1.md
  - docs/strategy/creative-agent-v1.md
  - docs/decisions/0001-thesis-lock.md
---

Canonical narrative spec: [jarvis-hud-video-thesis.md](./jarvis-hud-video-thesis.md) (Thesis Lock). Pitch compression: [gener8tor-pitch.md](./gener8tor-pitch.md). Competitive framing: [competitive-landscape-2026.md](./competitive-landscape-2026.md).

# Jarvis Strongman (Operator Brief)

## Operating Rule

If authority is not clear at execution, the system is wrong.

Authority must be explicit, attributable, and enforced at execution.

---

## 1. What we know (non-negotiable truths)

- Agents take real actions (email, code, APIs)
- Most systems lack a clear authority boundary
- Approval is often collapsed into execution
- Logs are not proof
- The model is not a trusted principal

---

## 2. What we are (category and wedge)

Category: AI control plane

Wedge:

- Authority enforced at execution
- Reconstructable proof of what ran

Core rules:

- Governs proposals, not runtimes
- Approval is not execution
- Every action produces a receipt and trace

---

## 3. What we must prove (demo invariant)

Show this flow clearly:

Dangerous action proposed  
→ Intercepted  
→ Requires approval  
→ Execution is a separate step  
→ Receipt + trace exist  

If this is not visible, the system is not proven.

---

## 4. What we build next (priority order)

### Phase 2 — Authority boundary (critical path)

- Define roles: proposer, approver, executor
- Enforce separation between roles
- Require explicit approval before execution
- Add step-up authentication at execution
- Support explicit deny/block as a recorded outcome

### Phase 3 — Proposal quality

- Improve proposal structure and clarity
- Prevent ambiguous or low-context proposals
- Reduce operator error

### Phase 4 — Throughput (without weakening control)

- Templates for common actions
- Prioritization and search
- Lightweight metrics

### Phase 5 — Real-world actions

- Email (baseline)
- Code changes
- External API calls / financial actions

---

## 5. What we do not do (guardrails)

- Do not position as an AI platform
- Do not collapse approval and execution
- Do not rely on logs as the primary proof
- Do not bypass the control plane
- Do not introduce unnecessary schema complexity early

---

## 6. Competitive stance (internal)

- Others optimize for capability, then add governance
- Jarvis enforces authority before execution

- Others provide logs and monitoring
- Jarvis provides receipts and traces (evidence)

- Others govern inside their runtime
- Jarvis governs at the boundary across runtimes

---

## 7. Core narrative (for reference)

AI agents can take real actions  
Without a control layer, this would have [X]  
The model is not the authority  
Jarvis enforces approval before execution and proves it  

---

## 8. Daily test

Before building or presenting anything, ask:

Does this make the control plane more necessary?

If not, do not proceed.

---

End of document.
