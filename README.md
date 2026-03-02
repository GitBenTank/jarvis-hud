# Jarvis HUD

Secure AI code execution control plane.

AI proposes. Humans authorize. Every action produces receipts.

---

## Overview

Jarvis HUD is a local-first control plane for AI-driven workflows.

Modern AI agents can write files, modify code, run tools, and call APIs.  
The capability gap is not intelligence — it is control.

Jarvis HUD introduces a strict execution boundary:

- Agents may **propose**
- Humans must **authorize**
- Execution produces **deterministic artifacts**
- Every executed action produces a **receipt**
- Approval is never execution
- The model is never a trusted principal

Jarvis HUD is agent-agnostic.  
It does not replace agents.  
It governs what they are allowed to execute.

---

## Core Principle

**Autonomy in thinking. Authority in action.**

AI systems may generate plans, diffs, content, and tool requests.

They cannot execute them without explicit human authorization.

This preserves:

- Human verification
- Clear accountability
- Replayable trace history
- Policy enforcement
- Safe delegation

---

## Execution Model

```
Agent → Proposal → Approval Queue → Execute → Receipt (Artifact + Log)
```

### Key Guarantees

- Approval ≠ execution
- No silent execution
- Receipts required for every executed action
- Model output is not authority
- External APIs remain disabled unless explicitly policy-gated
- Optional authentication + step-up for high-risk execution

---

## Current Execution Adapters

Jarvis HUD uses deterministic, local-first execution adapters.

Implemented:

- `code.diff` — Dry-run diff packaging (no code applied)
- `content.publish` — Local artifact creation
- `youtube.package` — Structured YouTube bundle output
- `system.note`
- `reflection.note`

Planned:

- `code.apply` — Git-backed apply with receipts and rollback notes
- Replay mode for full trace playback
- Policy v1 (risk tiers + allowlists)

All adapters must:

- Require approval before execution
- Produce artifacts
- Produce action log receipts
- Respect Thesis Lock constraints

---

## Storage Model

Default root: `${JARVIS_ROOT}` (local filesystem)

Example structure:

```
events/{date}.json
actions/{date}.jsonl
code-diffs/{date}/{approvalId}/
publish-queue/{date}/
youtube-packages/{date}/{approvalId}/
```

Execution produces:

- Artifact bundle
- Structured log entry
- Deterministic output directory

No external network calls occur unless explicitly enabled.

---

## Security Model

Jarvis HUD follows a Zero Trust approach:

- Never trust model output
- Always require human authorization
- Log all executed actions
- Separate proposal from execution
- Gate high-risk actions behind authentication and step-up

See:

- `docs/security/agent-execution-model.md`
- `docs/decisions/0001-thesis-lock.md`

---

## Non-Goals

Jarvis HUD is not:

- An LLM wrapper
- An autonomous execution engine
- A prompt optimization tool
- A replacement for agent frameworks
- A general AI orchestration system

It is a control plane.

---

## Development

Stack:

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind v4
- pnpm

Run locally:

```bash
pnpm install
pnpm dev
```

Default:

```
http://127.0.0.1:3000
```

Auth can be enabled via environment variables.

---

## Documentation

- `docs/roadmap/0000-master-plan.md`
- `docs/strategy/positioning-secure-ai-code-execution.md`
- `docs/decisions/0001-thesis-lock.md`
- `docs/decisions/0002-money-arc-and-icp.md`

---

## License

Apache License 2.0.
