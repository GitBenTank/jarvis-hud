---
title: "OpenClaw ↔ Jarvis HUD — operator checklist"
status: living-document
version: 1.3
owner: Ben Tankersley
created: 2026-04-18
category: setup
enforcement: hard
related:
  - ../openclaw-integration-verification.md
  - openclaw-control-ui.md
  - openclaw-jarvis-operator-sprint.md
  - ../local-verification-openclaw-jarvis.md
  - ../security/openclaw-ingress-signing.md
  - ../decisions/0001-thesis-lock.md
---

# OpenClaw ↔ Jarvis HUD — operator checklist

**Status: REQUIRED FOR OPERATION** · **Enforcement: HARD**

> **Operational contract.** This document defines the operational contract between **OpenClaw** and **Jarvis HUD**. **If system behavior differs from this document, the system is misconfigured.**

This page is the **mental model and order-of-operations** for local and operator use. For E2E exit criteria before demos, see [OpenClaw ↔ Jarvis operator sprint](openclaw-jarvis-operator-sprint.md). For ingress wiring and env, see [OpenClaw integration verification](../openclaw-integration-verification.md).

**Thesis lock:** Agents propose; humans approve; execution and receipts live in Jarvis. See [Thesis Lock](../decisions/0001-thesis-lock.md) and the [video thesis](../strategy/jarvis-hud-video-thesis.md).

These components implement a **governed execution protocol for autonomous agents**: deterministic ingress, a single execution authority, constrained agent behavior, an auditable chain, and an explicit failure model—not optional integration guidance.

**This contract must be satisfied before recording demos, distributing builds, or relying on the system for governed execution.**

---

## Ownership split

| Owns | OpenClaw | Jarvis HUD |
|------|------------|------------|
| | Gateway runtime | Signed ingress (`POST /api/ingress/openclaw`) |
| | Model / provider auth | Proposal intake and normalization |
| | Control UI token / dashboard auth | Approval gate |
| | Agent identity (e.g. **alfred**) and **workspace** instructions | Execution and policy |
| | How the agent formats proposals (workspace docs) | Receipts, traces, proof |

---

## Source of truth (policy)

A **proposal recorded in Jarvis** is the only valid record of **intended** action.

An action is **valid** only if:

1. A **proposal** exists in Jarvis, and  
2. After execution, a **corresponding receipt** exists in Jarvis (where that kind produces one).

All other signals—chat, tool stdout, agent claims, local file writes—are **non-authoritative** for governed outcomes.

---

## System layers

1. **OpenClaw** — Generates intent (drafts, tools, chat).  
2. **Workspace** (`IDENTITY.md` / `AGENTS.md` / `JARVIS.md`) — Constrains behavior and submission rules.  
3. **Jarvis HUD** — Validates ingress, holds approval, executes, records proof.

**No layer may bypass the next.**

**No layer may bypass or simulate the responsibilities of the next** (e.g. agents must not fake execution; workspace scripts must not stand in for Jarvis; plugins must not short-circuit approval).

---

## Lock these four things

1. **One canonical OpenClaw state directory** — Use the same `OPENCLAW_STATE_DIR` (or default `~/.openclaw`) whenever you start the gateway, run `openclaw config …`, or read `gateway.auth.token`. Mixed state dirs cause token mismatch and wrong dashboard URLs.

2. **One canonical gateway** — Only one OpenClaw gateway process **must** own the listening ports for your session (do not run Homebrew + `pnpm gateway:dev` against the same ports).

3. **Alfred behavior in workspace docs** — Durable rules live in **OpenClaw workspace files** (`AGENTS.md`, `IDENTITY.md`, optional `JARVIS.md`), not ad hoc chat. In `JARVIS.md`, define **exactly one canonical submission path** per workspace (see below).

4. **Jarvis stays the authority** — OpenClaw does not execute governed outcomes. Approve and execute in Jarvis; receipts live in Jarvis.

### Canonical submission path (contract)

The canonical submission path **must be implemented exactly once** and **referenced everywhere** that submits to Jarvis from this workspace.

**Duplicating the same logical method in multiple forms** (e.g. CLI plus a shell wrapper that calls the same endpoint, or two plugins that both POST ingress) **counts as multiple paths** and is forbidden.

---

## Operator checklist (happy path)

1. **Start Jarvis HUD** — e.g. `pnpm dev` with correct `.env.local` (`JARVIS_INGRESS_*`, allowlist, secret length ≥ 32).  
2. **Start OpenClaw** with the **same** state dir you always use.  
3. **Confirm Control UI auth** — `gateway.auth.token` from the **same** `openclaw.json` the running gateway loads (`openclaw config get gateway.auth.token` with the same env).  
4. **Confirm the assistant responds** — Provider / API key available to the gateway process.  
5. **Confirm a Jarvis proposal path** — Signed ingress succeeds per [local verification](../local-verification-openclaw-jarvis.md).  
6. **Confirm Jarvis shows pending** — Proposal appears in the HUD.  
7. **Confirm approval only in Jarvis** — Approve / Reject in the HUD; chat is not authority.  
8. **Confirm execution + receipt in Jarvis** — Traces and receipts for supported kinds.  
9. **Confirm no shadow execution** — No governed outcome without a Jarvis receipt when Jarvis is the control plane.

---

## Anti-patterns

- **Treating OpenClaw output as execution** instead of **intent**—only Jarvis establishes governed results.  
- **Executing** governed actions outside Jarvis when Jarvis is the configured authority.  
- **Submitting** the same class of proposal through **multiple** paths (CLI here, `curl` there, plugin elsewhere).  
- **Encoding** durable behavior in chat instead of workspace files.  
- **Trusting** agent or tool output as “done” **without** a Jarvis proposal and, where applicable, receipt.  
- **Running** multiple OpenClaw gateways against overlapping ports or ambiguous state.

---

## Failure modes

| Symptom | Likely cause | Fix |
|--------|----------------|-----|
| Something happened in OpenClaw **but no proposal in Jarvis** | Wrong submission path, failed ingress, or signing mismatch | Verify **canonical path** in `JARVIS.md`, env alignment, [ingress signing](../security/openclaw-ingress-signing.md), Jarvis / gateway logs. |
| Proposal **never appears** in Jarvis | Ingress off, wrong secret, allowlist, or bad body shape | [Integration verification](../openclaw-integration-verification.md) checklist; `pnpm ingress:smoke` from jarvis-hud. |
| Proposal **approved** but **no execution** (or no receipt) | Execute step not triggered, policy block, or silent execution failure | Check Jarvis **execution** logs, approval → execute UI flow, receipt generation, and trace for that `traceId`. |
| HUD **OpenClaw: Disconnected** but proposals still arrive | Stale connector “last seen” | Trust Activity / pending rows; refresh; confirm with `ingress:smoke`. |
| **Multiple gateways** / mixed logs | Duplicate processes | Stop extras; one gateway; one `OPENCLAW_STATE_DIR`. |
| Wrong **display name** in Control UI | Identity not in active config | `agents.list[].identity` + workspace `IDENTITY.md`. |
| **401 / 403** on ingress | Secret, clock, validation | Integration doc troubleshooting. |

---

## HUD shows “OpenClaw: Disconnected” but ingress works

Connector health can lag **last seen** while **ingress** is fine. Treat **signed proposals** and **Activity** as ground truth; see [connector health](../connectors.md). If unsure, run **`pnpm ingress:smoke`** from jarvis-hud.

---

## Where Alfred’s behavioral contract lives (OpenClaw side)

Under the agent **workspace** directory (`agents.list[].workspace`), not inside jarvis-hud:

| File | Purpose |
|------|---------|
| `IDENTITY.md` | Display identity (**alfred**) |
| `AGENTS.md` | Operating rules and safety |
| `JARVIS.md` | Jarvis bridge rules and **canonical submit path** (see appendix) |

Keep secrets in env and Control **Environment**—not in committed workspace files.

---

## Appendix — suggested `JARVIS.md` for the OpenClaw workspace

Copy into **`JARVIS.md`** next to `AGENTS.md`. This version locks Alfred to **automatic Jarvis submission** whenever proposal creation is requested, using one canonical path only.

```markdown
# Jarvis bridge — coordinator rules (alfred)

## Role

- **alfred** is a **coordinator** and **submission agent** for Jarvis proposals.
- For governed actions, the job is not complete when a proposal is drafted. The job is complete only when the proposal has been **submitted to Jarvis** and Jarvis returns a pending proposal / trace reference.
- Side effects that count still go through **Jarvis HUD**: proposal → approval → execution → receipt.

## Proposals

- Every actionable item is a **proposal first** (`kind`, `title`, `summary`, `payload`, `source.connector: "openclaw"`).
- Include metadata when supported: `agent: "alfred"`, optional `builder`, `provider`, `model`.
- Use **Jarvis-compatible** shapes per `kind`.

## Required behavior

- When a user asks to create a Jarvis proposal, **submit it immediately through the canonical submission path in the same turn**.
- Do **not** stop after printing JSON unless the user explicitly asks for JSON-only without submission.
- After submission, return the Jarvis result concisely: proposal id / trace id / pending status.
- If submission fails, surface the error and do not claim success.

## Never

- Never treat generated JSON as completion when Jarvis submission was requested.
- Never bypass approval, forge receipts, or imply execution without a Jarvis trace.
- Never create a second submission path.

## Canonical submission path

This workspace uses exactly one submission path:

`pnpm jarvis:submit --file <proposal-json-file>`

## Submission procedure

1. Write the normalized proposal JSON to a temporary file.
2. Run the canonical submission command.
3. Return the Jarvis response.
4. If the response does not indicate success / pending intake, report failure.

## Do not mix

- Direct HTTP / `curl`
- Ad hoc scripts
- Duplicate plugins
- Alternative CLI paths

If submission fails:

- Retry once only if the failure is clearly transient.
- Otherwise surface the error to the operator.
- Do not invent another path.
```

---

## Related

- [Local stack startup — Jarvis + OpenClaw](local-stack-startup.md)  
- [OpenClaw Control UI setup](openclaw-control-ui.md)  
- [Trusted ingress / signing](../security/openclaw-ingress-signing.md)  
- [OpenClaw agent identity on proposals](../openclaw-agent-identity.md)  
- [Local dev truth map](local-dev-truth-map.md)  
