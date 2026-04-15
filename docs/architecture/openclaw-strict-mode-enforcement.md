---
title: "OpenClaw strict mode — capability-layer enforcement"
status: "living-document"
category: architecture
related:
  - ../trust-boundary.md
  - openclaw-v1-contract.md
  - openclaw-proposal-identity-and-contract.md
  - openclaw-jarvis-trust-contract.md
  - ../security/openclaw-ingress-signing.md
  - ../strategy/jarvis-hud-video-thesis.md
---

# OpenClaw strict mode — capability-layer enforcement

**Milestone name:** STRICT MODE ENFORCEMENT (CAPABILITY LAYER)

This document specifies **how OpenClaw (and similar agent runtimes) must behave** so the theorem in [Trust boundary](../trust-boundary.md) is true **in practice**, not only in Jarvis HUD. **Jarvis** remains the authority plane (ingress, approval, execute, receipts). **OpenClaw** is the capability plane where **mechanical** rules must prevent governed mutations from bypassing Jarvis.

Implementation lives in the **OpenClaw** codebase and deployment configuration. This repo holds the **contract** (`POST /api/ingress/openclaw`, signing, validation) and **records** governed outcomes after human approve + execute.

Aligns with [Thesis Lock](../strategy/jarvis-hud-video-thesis.md#thesis-lock-do-not-drift): agents propose; humans approve; approval ≠ execution; the model is not a trusted principal.

---

## 1. Enforcement theorem

In **strict mode**:

**Mutation-capable effects on governed resources MUST NOT be performed by agent-invoked tools except by routing through Jarvis** — i.e. submitting a signed proposal to `POST /api/ingress/openclaw` and waiting for operator **Approve** then **Execute** in the HUD.

Corollary: if direct `fs.writeFile`, raw shell, or raw git mutation tools remain reachable by the agent in strict mode, the **“Jarvis is the only place where governed reality changes”** claim is **false** for that deployment.

---

## 2. Tool classification

Treat every tool the model can call as one of:

| Class | Examples (illustrative) | Strict mode rule |
|--------|-------------------------|------------------|
| **Read-only / analysis** | Read file (within allowlisted roots), search, static analysis, `GET /api/config` | **Allow** when scoped and safe. |
| **Mutation / execution** | Write file, apply patch, `git commit`, shell with side effects, network POST to governed systems | **Deny direct path** — **route to Jarvis** as a proposal (`code.apply`, `code.diff`, `system.note`, or future governed kinds). |

**Governed resources** are deployment-defined (e.g. repo under `JARVIS_REPO_ROOT`, production APIs, CI triggers). The list must be explicit in OpenClaw config, not implied by prompts.

**Non-governed** work (scratch buffers, ephemeral sandboxes) may stay local only if the operator accepts **hybrid** semantics — see [Trust boundary — Hybrid mode](../trust-boundary.md).

---

## 3. Enforcement layer

### 3.1 Recommended shape: tool wrapping + registration

Replace ad-hoc imports of dangerous primitives with a **single** governed surface:

- **Safe tools** — registered under e.g. `tools/safe/` (read, search).
- **Governed tools** — registered under e.g. `tools/governed/`; each implementation **only** builds a valid ingress body and calls the Jarvis client — it does **not** perform the mutation locally.

Suggested layout (OpenClaw repo, not `jarvis-hud`):

```text
openclaw/
├── tools/
│   ├── safe/
│   │   ├── readFile.ts
│   │   └── search.ts
│   ├── governed/
│   │   ├── codeApply.ts      # → jarvis.propose(code.apply)
│   │   ├── fileWrite.ts      # → jarvis.propose (kind TBD / unified with code.apply)
│   │   └── shellExec.ts      # → jarvis.propose OR deny (prefer deny for arbitrary shell)
├── core/
│   ├── jarvisClient.ts       # signed POST /api/ingress/openclaw
│   └── enforcement.ts      # strict mode + tool allowlists
```

### 3.2 Capability gating (conceptual)

```ts
// Pseudocode — lives in OpenClaw `enforcement.ts`
function resolveToolInvocation(tool: RegisteredTool, strictMode: boolean): "ALLOW" | "ROUTE_TO_JARVIS" | "DENY" {
  if (tool.mutatesGovernedResources) {
    if (strictMode) return tool.jarvisRouted ? "ROUTE_TO_JARVIS" : "DENY";
    return "ALLOW"; // hybrid / dev only — operator accepts weaker guarantees
  }
  return "ALLOW";
}
```

- **`ROUTE_TO_JARVIS`:** only implemented paths are the governed tool wrappers that call `jarvisClient.propose(...)`.
- **`DENY`:** mutation tool is not wired to Jarvis — must not run.

### 3.3 `jarvisClient` responsibilities

- Target base URL and signing secrets from environment (same rules as [OpenClaw ingress signing](../security/openclaw-ingress-signing.md)).
- Build bodies that satisfy `validateOpenClawProposal` (see [OpenClaw proposal identity & v1 contract](./openclaw-proposal-identity-and-contract.md)).
- Set **`agent`** / **`source.agentId`** deliberately for audit clarity (coordinator vs runtime id).
- Return ingress result to the agent (e.g. proposal id / trace id) — **not** “success” for the underlying mutation; the mutation happens only after HUD execute.

### 3.4 Reference implementation (`jarvis-hud`)

This repo ships a **minimal first slice** you can copy into OpenClaw or call from scripts:

- **`src/openclaw-strict-governed/`** — `OPENCLAW_STRICT_GOVERNED`, `createStrictGovernedRegistry()`, `readGovernedFile`, `proposeCodeApply`, blocked `applyPatchDirect`, `submitOpenClawIngress` (HMAC + `POST /api/ingress/openclaw`).
- Env: [Environment variables — OpenClaw strict-governed client](../setup/env.md#openclaw-strict-governed-client-reference-slice).
- Tests: `tests/unit/openclaw-strict-governed.test.ts`.

### 3.5 OpenClaw runtime — remaining integration (the last mile)

The reference slice **proves** the theorem **for code that uses** `createStrictGovernedRegistry().invoke()`. It does **not** yet prove that **every** agent-visible mutation tool in a live OpenClaw deployment goes through that path.

**In the OpenClaw repo, complete strict mode by:**

1. Finding the **real** tool registration / dispatch path the agent runtime uses.
2. Ensuring governed mutation tools either **call** `registry.invoke(...)` (or equivalent `assertGovernedMutationAllowed("governed-mutation")` before any handler) or are **not registered** in strict mode.
3. Verifying **no** second registration path exposes raw write / patch / shell against `JARVIS_REPO_ROOT` (or `OPENCLAW_GOVERNED_REPO_ROOT`).
4. Keeping read-only tools available without forcing them through Jarvis.
5. Adding one **integration** or runtime check: in strict mode, the agent-visible tool list for governed scope is only `readGovernedFile`, `proposeCodeApply`, and other explicitly read-only tools — **no** silent duplicates. The reference module provides **`assertNoUnsafeGovernedToolsInStrictMode`** (`src/openclaw-strict-governed/enforcement.ts`): pass every registered tool `{ id, classification }`; any `governed-mutation` in strict mode throws **`STRICT_MODE_VIOLATION`** at startup.
6. Documenting any **remaining bypass assumptions** (plugins, MCP servers, subprocesses, human shell).

**Live proof (once wired):** agent attempts direct mutation → `GOVERNANCE_BLOCK`; agent proposes → pending row in Jarvis; repo unchanged after **Approve**; mutation only after **Execute**. Optional capture: blocked error, pending `code.apply`, awaiting execution, **Executed successfully** (see [Governed execution checklist](../demo-governed-execution-checklist.md)).

---

## 4. Failure modes and bypass attempts

| Scenario | What should happen | Trust impact |
|----------|-------------------|--------------|
| Agent tries to call a **raw** `writeFile` / `exec` / `git` import | **Not registered** or **DENY** in strict mode | Theorem holds. |
| Developer adds a new mutation tool and forgets gating | **Bypass** until fixed | Treat as **severity: ship blocker** for strict deployments. |
| Operator runs shell manually on the host | **Out-of-band** | Outside Jarvis guarantees; label as hybrid / operator action. |
| Compromised OpenClaw process | Can call Jarvis ingress or, if tools exist, bypass | **Strict mode reduces** casual bypass; **does not replace** host compromise controls. |
| Jarvis ingress succeeds but operator never executes | Correct | Proposal ≠ execution. |

**Builder-facing risks (how to phrase them):**

1. **Bypass risk:** Without mechanical enforcement, correctness depends on **discipline**, not architecture.
2. **Audit integrity:** Jarvis persistence is filesystem-backed today; enterprise posture may require WORM / append-only storage ([Trust boundary](../trust-boundary.md)).
3. **Identity drift:** Events ingressed before the v1 identity contract may not match current `agent` / `source.agentId` semantics ([trace assessment](./openclaw-proposal-contract-trace-assessment.md)).

---

## 5. What must not exist in strict mode

For the **agent tool surface** (not necessarily for human operators or unrelated OS services):

- Direct **`fs.writeFile`** (or equivalent) against governed paths.
- Direct **git** commands that mutate history or working tree for governed repos.
- Direct **shell execution** with mutation capability, unless replaced by a **narrow** governed proposal path (arbitrary shell is a poor fit — prefer structured kinds).

If any of these remain callable by the model, **do not claim** strict governed execution for that environment.

---

## 6. Phased rollout

| Phase | Scope | Outcome |
|-------|--------|---------|
| **Phase 1 (start here)** | Tool wrapping: governed mutations only via `jarvisClient` → signed ingress | **Mechanical** alignment with Jarvis control plane. |
| **Phase 2 (optional)** | Container / restricted FS / separate user: agent process cannot write governed paths at OS level | Defense-in-depth; higher ops cost. |

Phase 2 does not replace Phase 1: **kernel-level denial** without routed proposals can block both good and bad flows; the **product** story still requires proposals for governed change.

---

## 7. Demo / verification (strict mode)

A minimal **proof** script:

1. Enable strict mode in OpenClaw (config flag).
2. Confirm **no** registered mutation tools except governed wrappers.
3. Attempt a mutation via agent — observe **only** a new pending proposal in Jarvis, **no** local repo change until HUD **Execute**.
4. Optional: try to invoke a removed tool name — expect **hard deny** or “tool not found,” not a silent fallback to shell.

See also: [Governed execution checklist](../demo-governed-execution-checklist.md) for HUD-side narration.

---

## 8. Summary

**Strict mode enforcement is the mechanism that makes the trust theorem true outside documentation.** It is implemented by **removing mutation tools from the agent’s capability set** and **replacing them with Jarvis-bound proposals**, plus optional host isolation later.

---

## See also

- [Trust boundary](../trust-boundary.md) — core theorem, strict vs hybrid
- [OpenClaw V1 — Jarvis integration contract](./openclaw-v1-contract.md)
- [OpenClaw proposal identity & v1 contract](./openclaw-proposal-identity-and-contract.md)
- [OpenClaw ↔ Jarvis trust contract](./openclaw-jarvis-trust-contract.md)
