# Positioning: Secure AI Code Execution for Engineering Teams

**Status:** Draft (external-facing)  
**Related:** [Master Plan](../roadmap/0000-master-plan.md) · [Video Thesis](./jarvis-hud-video-thesis.md) · [Competitive landscape (2026)](./competitive-landscape-2026.md) · [ADR-0002: Positioning and ICP](../decisions/0002-money-arc-and-icp.md) · [Agent Execution Model](../security/agent-execution-model.md)

---

## Core Message

**AI proposes. Humans approve. Receipts prove.**

Jarvis HUD is a control plane for AI agents with execution capabilities. It sits between agent cognition and production systems. It does not replace or compete with agent frameworks — it governs what agents are allowed to execute.

---

## One-Liners

| Context | Line |
|---------|------|
| **Primary** | Secure AI code execution — AI proposes, humans approve, every action has receipts. |
| **Technical** | Approval and control layer for local agents. Autonomy in thinking. Authority in action. |
| **Boundary** | Let your AI propose anything. Execution requires your authorization. No silent runs, no blind trust. |
| **Security** | Zero trust for AI: the model proposes, humans verify, receipts prove. |

---

## What Jarvis HUD Is

- A **control plane** — not an agent framework
- A **human-gated execution boundary** — approval and execution are distinct
- **Local-first** — receipts and artifacts stay on your system unless you choose otherwise
- **Agent-agnostic** — integrates with any agent that can produce structured proposals

---

## What Jarvis HUD Is Not

- Not an agent framework or LLM wrapper
- Not an autonomous execution system
- Not a replacement for Cursor, Cody, Claude Dev, or similar tools
- Not a platform that blurs approval and execution

---

## Why This Matters Now

- **Agents have real permissions.** AI coding tools write files, run tools, and can access APIs. The gap is not better prompts — it is control and accountability.
- **Prompt injection is real.** Agents can be tricked into actions the user did not intend. Approval gates and receipts are defenses.
- **Teams need audit trails.** Solo builders may tolerate risk; teams and organizations need proof of what ran, when, and who approved it.
- **The control plane is underserved.** Agent frameworks compete on capability. Jarvis HUD provides the approval layer that makes capability safe.

---

## Comparison

| We Are | We Are Not |
|--------|------------|
| Approval layer between agent and execution | A new agent framework |
| Local-first, human-in-the-loop, receipt-required | API-first, autonomous, no human gate |
| Extensible via deterministic adapters | A closed platform |
| Thesis-locked: approve ≠ execute | A convenience layer that blurs approval and execution |

---

## Demo Narratives

### 1. Solo Builder: See Before You Ship

**Setup:** Developer uses Cursor or Claude Dev with Jarvis HUD. Agent proposes a code change.

**Flow:** Proposal appears in the control plane. Developer inspects diff, approves. Execution writes a local diff bundle and receipt. No changes are applied to the repo. Rollback notes are available if needed.

**Takeaway:** AI proposes; execution is explicitly authorized; every change is traceable.

---

### 2. Small Team: Shared Policies, Shared Receipts

**Setup:** Small engineering team. Shared policies: code changes require approval; high-risk actions require step-up.

**Flow:** Teammate approves a proposal. Action executes; receipt is visible to the team. Audit trail shows who approved, when, and what changed. Replay can reproduce the trace.

**Takeaway:** Policies scale with the team; receipts and audit trail reduce ambiguity about who did what.

---

### 3. Enterprise: Zero Trust for AI

**Setup:** Security-conscious organization evaluating AI tooling. Needs SSO, RBAC, immutable logs, and compliance export.

**Flow:** Demo shows human-gated execution, policy-as-code, step-up for high risk, and audit export. Roadmap covers SSO, RBAC, and integrations. No external posting without explicit policy.

**Takeaway:** Control plane scales to enterprise; same thesis, stricter governance and audit.

---

## Strategic Links

- [Master Plan](../roadmap/0000-master-plan.md)
- [Video Thesis](./jarvis-hud-video-thesis.md)
- [ADR-0002: Positioning and ICP](../decisions/0002-money-arc-and-icp.md)
- [Agent Execution Model](../security/agent-execution-model.md)
- [Control Plane Architecture](../architecture/control-plane.md)
