# ADR-0002: Positioning and Initial Customer Profile

**Status:** Accepted  
**Date:** 2026-02  
**Related:** [ADR-0001: Thesis Lock](./0001-thesis-lock.md) · [Master Plan](../roadmap/0000-master-plan.md) · [Video Thesis](../strategy/jarvis-hud-video-thesis.md) · [Agent Execution Model](../security/agent-execution-model.md)

---

## Context

Jarvis HUD has a locked thesis: approve ≠ execute, receipts required, model not trusted. We need positioning that:

- Clarifies the product’s role in the market
- Targets an initial customer profile we can reach and serve
- Stays aligned with the thesis
- Scales from solo builder to enterprise

---

## Decision

Adopt **"Secure AI Code Execution for Engineering Teams"** as the product positioning. Initial customer profile: technical founders and small engineering teams shipping with agents.

---

## Rationale

1. **Code execution is the highest-leverage surface.** Teams already use AI for code. The control gap — approval, receipts, rollback — is clear and addressable without changing the thesis.

2. **ICP is reachable.** Technical founders and small engineering teams are early adopters of Cursor, Cody, Claude Dev. They experience the control problem directly. They will adopt governance tools if the UX does not block them.

3. **Thesis alignment.** The positioning assumes: AI proposes; humans approve; receipts are required; the model is not trusted. This is a direct application of Thesis Lock, not a compromise.

4. **Differentiation.** Agent frameworks optimize for capability. We optimize for control. We are not a competitor to Cursor — we are a control layer that makes Cursor and similar tools safer for teams.

---

## Phased Positioning

| Phase | Customer | Outcome |
|-------|----------|---------|
| **1 — Solo builder** | Individual developer | Local approvals + receipts for content and code. Dry-run diff packaging. No external posting. |
| **2 — Small teams** | 2–10 person engineering teams | Shared policies, shared receipts, step-up auth, audit trail. Multi-user + basic RBAC. |
| **3 — Enterprise** | Security-conscious organizations | SSO, RBAC, policy-as-code, integrations, immutable logs, compliance exports. |

---

## Risks

| Risk | Mitigation |
|------|------------|
| **Narrow initial scope** | Code execution is the wedge; expand to content, tooling, integrations once control plane is proven |
| **Adoption friction** | Approval must be fast and low-friction; UX and policies matter |
| **Agent vendors add their own control** | Ship early; position as agent-agnostic so teams can standardize across tools |
| **Enterprise adoption cycles** | Phase 1–2 prove value; Phase 3 is roadmap and demo, not immediate outcome |

---

## Tradeoffs

- **Chosen:** Code-first, team-scale, control-plane positioning
- **Deferred:** Generic "AI safety" messaging, consumer use cases, content-only positioning
- **Explicit:** We do not compete on agent capability. We compete on who controls execution.

---

## Thesis Lock Alignment

| Thesis Lock Element | How This Positioning Respects It |
|---------------------|----------------------------------|
| Approve ≠ execute | Core to "Secure AI Code Execution"; human approval is the product |
| Receipts required | Every demo and phase includes receipts; audit trail is a feature |
| Model not trusted | "Secure" implies the model is never the authority; humans are |
| Auth/step-up for high risk | Phase 2+ explicitly add step-up; Phase 1 is local, single-user |
| Policies human-defined | Policies v1 in 90-day plan; human-defined, not model-defined |

**Conclusion:** This positioning is thesis-compatible. No thesis element is relaxed for business reasons.

---

## References

- [ADR-0001: Thesis Lock](./0001-thesis-lock.md)
- [Master Plan](../roadmap/0000-master-plan.md)
- [Video Thesis](../strategy/jarvis-hud-video-thesis.md)
- [Agent Execution Model](../security/agent-execution-model.md)
- [Control Plane](../architecture/control-plane.md)
- [Positioning Draft](../strategy/positioning-secure-ai-code-execution.md)
