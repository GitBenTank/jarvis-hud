# Jarvis HUD

> **Status:** Experimental — actively being developed

![Version](https://img.shields.io/badge/version-v0.1-blue)
![License](https://img.shields.io/badge/license-Apache--2.0-green)
![Node](https://img.shields.io/badge/node-20+-green)
![Architecture](https://img.shields.io/badge/architecture-control--plane-purple)
![Stack](https://img.shields.io/badge/stack-TypeScript%20%2B%20Next.js-blue)

Jarvis HUD is an AI control plane for governed automation.

Jarvis acts as a control plane between AI agents and real-world execution systems. It separates AI reasoning from execution by enforcing a structured lifecycle:

**Agent → Proposal → Approval → Execution → Receipt → Trace**

The goal is to make AI systems observable, auditable, and safe to operate.

---

## Overview

Jarvis sits between AI agents and system execution. Agents propose actions; humans approve them; the system executes with receipts and a traceable timeline.

Built as a Next.js + TypeScript system with API routes acting as the control plane boundary.

### Why this matters

Modern AI agents can take actions — but those actions are often opaque and ungoverned.

Jarvis introduces a control plane that ensures every action is:

- **proposed** before execution
- **evaluated** by policy
- **optionally approved** by a human
- **fully traceable** after execution

This turns AI from a black box into a governed system.

---

## Core Lifecycle

```
Agent → Proposal → Approval → Execution → Receipt → Trace
```

---

## Quick Start

```bash
pnpm install
pnpm dev
pnpm demo:boot
```

Then open http://127.0.0.1:3001. Approve the proposal → execute → inspect the receipt and trace.

→ [Full demo runbook](DEMO.md) · [OpenClaw integration verification](docs/openclaw-integration-verification.md)

---

## Architecture

Jarvis sits between AI agents and system execution:

[![Jarvis Control Plane](docs/architecture/jarvis-control-plane.svg)](docs/architecture/control-plane.md)

- **Agent Layer** — AI systems propose actions (e.g. OpenClaw via HMAC-signed ingress)
- **Control Plane** — Verification, approval, policy enforcement, execution orchestration
- **Audit Layer** — Receipts at `~/jarvis/actions/*.jsonl`, policy decision logs, trace timeline

**Key routes:**

| Stage    | Route                           | Purpose                       |
|----------|----------------------------------|-------------------------------|
| Ingress  | `POST /api/ingress/openclaw`     | Receive signed proposals      |
| Approval | `GET/POST /api/approvals`         | List and approve/deny          |
| Execution| `POST /api/execute/[approvalId]` | Policy gate → adapters        |
| Trace    | `GET /api/traces/[traceId]`      | Reconstruct session           |

→ [Control plane architecture](docs/architecture/control-plane.md)

---

## Features

- **Policy-gated execution** — Allow/deny before any action runs
- **Human-in-the-loop approvals** — Operators review and authorize
- **Receipt-based execution logging** — Every execution produces an auditable record
- **Full trace reconstruction** — Proposal → outcome, replayable
- **Proposal gate** — Agents submit proposed actions; no direct execution
- **Human approval** — Operators review and approve in the Jarvis HUD UI
- **Policy gate** — Kind allowlist, auth step-up, preflight checks before adapters run
- **Controlled execution** — Bounded adapters: `system.note`, `code.diff`, `code.apply`, `youtube.package`, recovery classes
- **Receipts & artifacts** — Every execution produces a receipt and artifact record
- **Trace timeline** — All activity recorded with `traceId` for audit and replay
- **Recovery verification** — Operators mark recovery actions verified or failed (closed loop)

---

## Development / Demo Commands

| Command              | Purpose                                   |
|----------------------|-------------------------------------------|
| `pnpm dev`           | Start dev server (port 3000)               |
| `pnpm dev:port`      | Start on configured port (e.g. 3001)      |
| `pnpm demo:boot`     | Clean boot with ingress enabled            |
| `pnpm demo:verify`   | Pre-demo checklist (config, stream)        |
| `pnpm demo:smoke`    | Ingress smoke + apply smoke                |
| `pnpm ingress:smoke` | Smoke test for `system.note` ingress       |
| `pnpm jarvis:doctor` | Preflight (ingress, secret, allowlist)     |
| `pnpm test:unit`     | Run unit tests                             |

**Environment:** Copy `env.example` to `.env.local`. For OpenClaw integration: `JARVIS_INGRESS_OPENCLAW_ENABLED=true`, `JARVIS_INGRESS_OPENCLAW_SECRET` (min 32 chars), `JARVIS_INGRESS_ALLOWLIST_CONNECTORS=openclaw`. See [docs/setup/env.md](docs/setup/env.md).

---

## Contributing

Contributions are welcome. Please:

1. Open an issue to discuss substantial changes
2. Fork, branch, and open a PR with a clear description
3. Ensure `pnpm test:unit` passes

See [CONTRIBUTING.md](CONTRIBUTING.md) for the contributor workflow.

---

## Documentation

- [Architecture](docs/architecture/control-plane.md)
- [Security model](docs/architecture/security-model.md)
- [Policy decision logs](docs/architecture/policy-decision-logs.md)
- [OpenClaw integration](docs/openclaw-integration-verification.md)
- [Demo runbook](DEMO.md)
- [Environment variables](docs/setup/env.md)

---

## Author

**Ben Tankersley**  
Building systems at the intersection of AI, music, and infrastructure  
https://ctrlstrum.com  

Currently exploring AI control planes, agent systems, and governed automation.

---

## License

Apache License 2.0.
