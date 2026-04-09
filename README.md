# Jarvis HUD

> **Status:** Active development — **demo-ready** for local use and **OpenClaw-signed ingress** (see [Investor / demo path](#investor--demo-path) below).

![Version](https://img.shields.io/badge/version-v0.1-blue)
![License](https://img.shields.io/badge/license-Apache--2.0-green)
![Node](https://img.shields.io/badge/node-20+-green)
![Architecture](https://img.shields.io/badge/architecture-control--plane-purple)
![Stack](https://img.shields.io/badge/stack-TypeScript%20%2B%20Next.js-blue)

## Who it’s for, what it is, why it matters

**Who it’s for:** Developers and operators who run **local agents with real permissions** (files, tools, execution) and need a **human gate** before anything runs.

**What it is:** A **Next.js control plane** between agents and execution. Agents submit **proposals**; **humans approve or reject**; **execution is a separate step** after approval. **Every executed action leaves proof**: a **receipt** (action log) plus **artifacts** where adapters write them, tied together with a **`traceId`**.

**Why it matters:** The gap is not model intelligence — it is **runtime control**. Jarvis makes the lifecycle explicit: **propose → approve → execute → receipt → trace**, so automation stays **observable and deniable** (in the good sense: you can show *what* happened and *who* said go).

**Thesis lock (non-negotiable):** Agents may propose anything; **execution requires explicit human approval**; **approval is not execution**; **the model is not a trusted principal**; **autonomy in thinking, authority in action**. Full narrative: [docs/strategy/jarvis-hud-video-thesis.md](docs/strategy/jarvis-hud-video-thesis.md) · [ADR: Thesis Lock](docs/decisions/0001-thesis-lock.md).

---

## Visual

Control plane at a glance (click through for architecture detail):

[![Jarvis control plane diagram](docs/architecture/jarvis-control-plane.svg)](docs/architecture/control-plane.md)

*Optional:* Record a short loop (proposal → approve → receipt) for the README — see [docs/video/jarvis-demo-recording.md](docs/video/jarvis-demo-recording.md).

---

## Ports: normal dev vs demo boot

| Mode | Command | Default URL | Notes |
|------|---------|-------------|--------|
| **Normal development** | `pnpm dev` | **http://127.0.0.1:3000** | Override with `PORT=3001 pnpm dev`, etc. |
| **Demo / ingress rehearsal** | `pnpm demo:boot` | **http://127.0.0.1:3001** | Loads `scripts/demo-env.sh`: OpenClaw ingress **on**, shared **secret**, `PORT=3001`. |

Use the **same** base URL and secret on the **OpenClaw** side as on Jarvis, or signed ingress will fail (usually **401**). Details: [docs/openclaw-integration-verification.md](docs/openclaw-integration-verification.md).

---

## Investor / demo path

**Goal:** The story is obvious on the first screen here; **proof** is a **repeatable** OpenClaw → Jarvis **proposal** → human **approve** → explicit **execute** → **receipt** path — not “it worked once.”

1. **Boot Jarvis for demo:** `pnpm demo:boot` (wait for Ready / Local URL).
2. **Preflight:** `pnpm demo:verify` → expect `OK: config + stream reachable`.
3. **Create proposals from this repo:** `pnpm demo:smoke` (ingress + apply smoke; note **`traceId`** in output).
4. **OpenClaw (separate checkout):** same **`JARVIS_INGRESS_OPENCLAW_SECRET`** and **`JARVIS_BASE_URL`** as Jarvis → run **`pnpm jarvis:smoke`** (or your packaged smoke) **twice in a row** until it’s boring.
5. **In the UI:** Approvals → approve → execute (per action type) → show **receipt** and **Activity / trace** for that **`traceId`**.

Full script, receipt shapes, and failure table: **[DEMO.md](DEMO.md)** · OpenClaw handoff: **[docs/openclaw-integration-verification.md](docs/openclaw-integration-verification.md)**.

---

## Quick Start (developers)

```bash
pnpm install
cp env.example .env.local   # optional; see docs/setup/env.md
pnpm dev
```

Open **http://127.0.0.1:3000**. For a **guided demo** with ingress env pre-wired, use **`pnpm demo:boot`** and the [Investor / demo path](#investor--demo-path) above.

---

## Core lifecycle

```
Agent → Proposal → Approval → Execution → Receipt → Trace
```

- **Agents propose** (UI, API, or signed **OpenClaw** ingress).
- **Humans approve** (or reject) in the HUD.
- **Execution** runs only after approval — **separate** from the approval click.
- **Proof:** receipt log + artifacts + trace reconstruction.

---

## Architecture

Jarvis sits between AI agents and system execution:

- **Agent layer** — systems **propose** actions (e.g. OpenClaw via HMAC-signed `POST /api/ingress/openclaw`).
- **Control plane** — verification, **human** approval, policy, **orchestrated execution**.
- **Audit layer** — receipts under `JARVIS_ROOT` (default `~/jarvis`), policy logs, activity timeline.

**Key routes:**

| Stage     | Route                            | Purpose                  |
|-----------|----------------------------------|--------------------------|
| Ingress   | `POST /api/ingress/openclaw`     | Signed proposals         |
| Approval  | `GET/POST /api/approvals`        | List / approve / deny    |
| Execution | `POST /api/execute/[approvalId]` | Policy gate → adapters |
| Trace     | `GET /api/traces/[traceId]`      | Reconstruct session      |

→ [Control plane architecture](docs/architecture/control-plane.md)

---

## Features

- **Human-in-the-loop** — Operators **approve** or deny before execution proceeds.
- **Execution separated from approval** — Approve does not run adapters by itself; execute is explicit.
- **Policy-gated execution** — Allow/deny before adapters run.
- **Receipts and proof** — Action log + artifacts per execution; traceable **`traceId`**.
- **OpenClaw ingress** — HMAC-signed proposals when enabled (`docs/setup/env.md`).
- **Bounded adapters** — e.g. `system.note`, `code.diff`, `code.apply`, `youtube.package`, recovery classes.
- **Trace timeline** — Reconstruct proposal → outcome for audit and demo.

---

## Development / demo commands

| Command              | Purpose                              |
|----------------------|--------------------------------------|
| `pnpm dev`           | Dev server (**port 3000** by default) |
| `pnpm dev:port`      | Uses `PORT` from environment         |
| `pnpm demo:boot`     | Clean boot + **demo env** (ingress, **3001**) |
| `pnpm demo:verify`   | Pre-demo: config + activity stream   |
| `pnpm demo:smoke`    | Ingress + apply smoke tests          |
| `pnpm ingress:smoke` | `system.note` ingress smoke          |
| `pnpm jarvis:doctor` | Preflight (ingress, secret, allowlist) |
| `pnpm test:unit`     | Unit tests                           |

**Environment:** `env.example` → `.env.local`. OpenClaw: `JARVIS_INGRESS_OPENCLAW_ENABLED=true`, `JARVIS_INGRESS_OPENCLAW_SECRET` (≥32 chars), `JARVIS_INGRESS_ALLOWLIST_CONNECTORS=openclaw`. See [docs/setup/env.md](docs/setup/env.md).

---

## Contributing

Contributions are welcome. Please preserve the thesis: **agents propose**, **humans approve**, **execution is separate**, **every action leaves proof**.

1. Open an issue for substantial changes  
2. Fork, branch, PR with a clear description  
3. Ensure **`pnpm test:unit`** passes  

See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Documentation

- [Architecture](docs/architecture/control-plane.md)
- [Security model](docs/architecture/security-model.md)
- [Policy decision logs](docs/architecture/policy-decision-logs.md)
- [OpenClaw integration](docs/openclaw-integration-verification.md)
- [Demo runbook](DEMO.md)
- [Environment variables](docs/setup/env.md)
- [GitHub About / social copy](docs/marketing/social-copy.md)
- [Security reporting](SECURITY.md)

---

## Author

**Ben Tankersley**  
Building systems at the intersection of AI, music, and infrastructure  
https://ctrlstrum.com

---

## License

Apache License 2.0.
