---
title: "Trust, determinism, and integrity signals"
status: living-document
owner: Ben Tankersley
category: governance
related:
  - ../strategy/jarvis-hud-video-thesis.md
  - ../decisions/0001-thesis-lock.md
  - ../strategy/operating-assumptions.md
  - ../roadmap/0004-phased-platform-plan.md
  - ../roadmap/0005-v02-golden-loop-sprint.md
  - enterprise-readiness-snapshot-2026-05-09.md
  - ../../src/lib/proposal-lifecycle.ts
---

# Trust, determinism, and integrity signals

**Purpose:** Encode how Jarvis HUD compounds **operational confidence**—not just features—without drifting [Thesis Lock](../decisions/0001-thesis-lock.md). This doc is for **maintainers and operators**; it complements [Operating assumptions](../strategy/operating-assumptions.md) (frozen env contracts) and [Security model](../architecture/security-model.md).

---

## Operating principle

**Trust must compound faster than capability.**

If capability (adapters, integrations, agent surface) grows faster than governance (determinism, audit, environment integrity, regression proof), the product **violates its own thesis** in practice: it becomes a pile of governed-*looking* integrations rather than a control plane.

Corollaries:

- **Golden loop first:** One CI-backed path (propose → pending → approve → execute → receipt → trace → export/replay) matters more than adding adapters.
- **Environment ambiguity = trust ambiguity:** In a governed system, unknown state implies unknown authority.
- **Adapters multiply failure states; the golden loop multiplies confidence.** Prefer boring repetition over novelty until the loop is regression-proof.

---

## What the product actually is

The durable product is **operational confidence**: can an operator **predict** behavior, **reconstruct** decisions, **trust** persisted state, **verify** who held authority, **prove** consequence lineage, and **survive** failure—without tribal knowledge, hidden state, “just rerun it,” or mystery env drift?

Approvals, traces, receipts, OpenClaw integration, and policy code are **mechanisms**. Confidence is the **outcome**.

---

## Integrity signals (trust degradation indicators)

These are **not** mere dev annoyances. They are **signals that the control plane may not be exercising authority over a known world.**

When a signal fires, treat it as **integrity debt** until classified (false positive, operator fix, or product gap).

| Signal | Typical meaning |
|--------|-----------------|
| **Origin mismatch** | HUD URL vs configured `JARVIS_HUD_BASE_URL` / `JARVIS_BASE_URL`—signing and browser context disagree (e.g. `localhost` vs `127.0.0.1`). |
| **Gateway / Control UI mismatch** | `OPENCLAW_CONTROL_UI_URL` or token/state dir does not match the **running** gateway (wrong port, second process, mixed `OPENCLAW_STATE_DIR`). |
| **Unsigned or invalid ingress** | Attempted proposal without valid HMAC or allowlist—capability boundary probed or misconfigured. |
| **Stale or mixed OpenClaw runtime** | Wrong checkout, dirty tree when a **clean** runtime is assumed, or Homebrew gateway racing checkout gateway. |
| **Dirty repo at execute** | `code.apply` (and similar) blocked or unsafe—working tree does not match policy assumptions. |
| **Missing or partial preflight snapshot** | Approval-time context not captured when policy expects it—harder to prove *what* the human saw. |
| **Replay divergence** | Trace replay does not match stored events or policy log—audit story breaks. |
| **Receipt / hash mismatch** | Audit export or hash chain disagrees with on-disk evidence—tamper or implementation bug. |
| **Untracked or orphan artifact** | Execution wrote files not linked in receipt/trace—lineage incomplete. |
| **Missing trace linkage** | Action log or export lacks `traceId` / proposal `id` where required—reconstruction fails. |

**Implementation note:** Some signals already surface via `GET /api/config` (`integrationIssues`), origin banners, stack doctor, and execute-time policy. This table is the **conceptual catalog**; wiring and UI copy should stay aligned with it over time.

---

## Gate: new execution kinds / adapters

**Do not add** a new externally visible execution path without all of the following in one change set (or a tracked exception with ADR):

1. **Execution inventory row** — kind, adapter, risk tier, policy rules, receipt fields, blast radius (see [platform plan § core rule](../roadmap/0004-phased-platform-plan.md#core-rule--no-new-capability-ships-without)).
2. **Risk tier** — operator-facing narrative and irreversible confirmation where required ([`src/lib/risk.ts`](../../src/lib/risk.ts)).
3. **Receipt model** — artifact + log expectations; linkage to `traceId` and proposal `id`.
4. **Trace linkage** — events and replay/export include the new path consistently.
5. **Automated proof** — at minimum **unit** tests; for any kind that touches the **golden loop**, extend the **CI-backed E2E** chain when it exists (or add a temporary smoke with an explicit TODO to fold into E2E).

Otherwise the repo drifts toward “governed-looking” integrations and **Thesis Lock** becomes branding instead of behavior.

---

## Authority state machine (next formalization)

Today, proposal lifecycle is normalized at read time in [`src/lib/proposal-lifecycle.ts`](../../src/lib/proposal-lifecycle.ts) (`ProposalStatus`: proposed → validated → pending_approval → approved → executing → executed, plus rejected / failed / archived).

**Direction:** Make the full authority path **explicit and inspectable** end-to-end, including events the UI may not yet name:

- proposal created / verified / pending  
- approval granted (or rejected)  
- execution authorized and started  
- execution completed (or failed)  
- receipt emitted, trace sealed, export verified (where applicable)

**Why:** deterministic replay, meaningful exports, future SIEM-style consumption, multi-user governance—and **detection of impossible states** (e.g. executed without approval) as first-class errors, not silent inconsistency.

Incremental work should **map new states onto existing stored shapes** so on-disk history remains backward-compatible unless an ADR mandates migration.

---

## What Jarvis does NOT guarantee

Jarvis **governs authority transfer and traceability within its boundary** (propose → approve → execute → receipt → trace/export for actions that go through it). It does **not** solve every class of trust or safety problem. Operators, buyers, and integrators should not over-read the control plane.

| Jarvis does **not** | Implication |
|---------------------|-------------|
| **Prevent all out-of-band execution** | Agents, shells, IDEs, or other systems can still mutate the world outside Jarvis. Capability layers (e.g. OpenClaw) remain **capability** unless wired to route mutations through Jarvis. |
| **Infer trust from runtime behavior alone** | “Behaved well last time” is not a cryptographic or policy proof. Trust comes from **explicit gates**, **receipts**, and **replayable evidence** inside the boundary. |
| **Make models principals** | [Thesis Lock](../decisions/0001-thesis-lock.md): the model is not a trusted principal. Humans and policy hold authority; proposals are **untrusted input** until validated and gated. |
| **Guarantee correctness of proposals** | Jarvis can validate shape and policy; it does not guarantee semantic truth, intent alignment, or absence of manipulation in proposal content. |
| **Guarantee a hermetic environment** | Misconfigured origins, duplicate gateways, leaked ingress secrets, or mixed state dirs degrade integrity — see **Integrity signals** above. Jarvis surfaces many of these; it cannot fix operator mistakes it never sees. |
| **Replace legal, compliance, or organizational policy** | Audit exports and traces support **evidence**; they do not by themselves satisfy regulatory programs without organizational process mapping. |

**In one line:** Jarvis governs **authority and evidence** for actions that flow through it; it does not govern **all intelligence** or **all execution** on a machine or in an organization.

---

## Related

- [Video thesis / Thesis Lock](../strategy/jarvis-hud-video-thesis.md)  
- [Operating assumptions](../strategy/operating-assumptions.md)  
- [Phased platform plan](../roadmap/0004-phased-platform-plan.md)  
- [Operator integration phases](../roadmap/0003-operator-integration-phases.md)  
- [v0.2 Golden Loop sprint](../roadmap/0005-v02-golden-loop-sprint.md)  
- [Security model](../architecture/security-model.md)  
- [Enterprise readiness snapshot (2026-05-09)](./enterprise-readiness-snapshot-2026-05-09.md)
