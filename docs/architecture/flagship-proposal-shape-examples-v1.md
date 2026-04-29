---
title: "Flagship bundle — proposal shapes & grep anchors (operators)"
status: living-document
category: architecture
owner: Ben Tankersley
related:
  - ../strategy/flagship-team-bundle-v1.md
  - ../strategy/agent-team-contract-v1.md
  - ../decisions/0005-agent-team-batch-v0-per-item-execute.md
  - ../local-verification-openclaw-jarvis.md
  - ../setup/openclaw-jarvis-operator-sprint.md
  - ./openclaw-proposal-identity-and-contract.md
---

# Flagship bundle — proposal shapes & grep anchors (operators)

**Audience:** Builders and operators rehearsing demos, grepping logs, or wiring OpenClaw tools.

**Product story (lightweight):** [Flagship team bundle v1](../strategy/flagship-team-bundle-v1.md).

**Runnable steps (two JSON samples, approve + execute each):** [Local verification §4b](../local-verification-openclaw-jarvis.md#4b-flagship-flow-1--alfred-intake--research-digest-full-bundle).

**Sprint exit bar:** [OpenClaw ↔ Jarvis operator sprint](../setup/openclaw-jarvis-operator-sprint.md).

---

## Kind mapping and policy

Each row below is one **concrete** proposal card aligned with [Jarvis kind mapping](../strategy/agent-team-contract-v1.md#5-jarvis-kind-mapping-execution-truth) and `ALLOWED_KINDS` in [`src/lib/policy.ts`](../../src/lib/policy.ts). Strings are distinctive so you can search the repo or logs during demos and tests.

---

## `agent`, `builder`, and Forge (HUD vs bundle)

In the HUD and traces you will often see **`agent`** and optional **`builder`** on a proposal ([OpenClaw proposal identity](./openclaw-proposal-identity-and-contract.md)). Those fields are **display and provenance metadata** only — they never grant approval or execution.

| Concept | Meaning |
|---------|---------|
| **`agent`** | Who Jarvis treats as the **logical proposing / coordinator label** (`alfred`, `research`, …). |
| **`builder`** | Optional label for **who drafted** or shaped proposal text (“drafting specialist”). Same wire field name as in tooling. |
| **Forge** (architecture docs) | A **documented drafting role** Alfred can pair with inside OpenClaw (see [OpenClaw/Jarvis trust contract](./openclaw-jarvis-trust-contract.md)). **Not shipped as its own SKU** in flagship bundle v1. Demos often default `builder` to the string **`forge`** (e.g. `META_DEFAULTS` in [`src/jarvis/normalizeProposal.ts`](../../src/jarvis/normalizeProposal.ts)) — that preserves **grep-able examples and UI labels**, not “Forge is teammate number four.” |

So: **Seeing “builder: forge” next to Alfred is expected** in samples; it does **not** contradict the three-role bundle.

---

## Flow 1 — Factual / research

| Field | Example |
|--------|---------|
| **Grep anchor** | `flagship-flow-1-eu-ai-act-digest` |
| **Jarvis `kind`** | `system.note` |
| **Sample title** | Evidence digest: EU AI Act — applicability vs. GPAI (Q1 2026 scope) |
| **Sample summary** | Capture Research’s `ResearchEvidencePack`: 4 sources, 2 high-confidence claims, 3 explicit unknowns; links to quotes; recommends deeper pull on Title II only if user approves a follow-on note. |
| **Owning agent** | Research (produced the action; Alfred scoped consent only). |
| **Risk level** | Low |
| **Why it stops at Jarvis** | Even a **note write** is an execution-shaped effect: [Thesis Lock](../decisions/0001-thesis-lock.md) requires **explicit human approval** before persistence; the model is not a trusted principal and there must be a **receipt / trace** after execute. |

**Runnable in repo (full bundle):** (1) `examples/openclaw-proposal-flagship-flow1-alfred-intake.sample.json` — **`agent`: `alfred`**, grep **`flagship-flow-1-alfred-intake`**; (2) `examples/openclaw-proposal-flagship-flow1-research.sample.json` — **`agent`: `research`**, grep **`flagship-flow-1-eu-ai-act-digest`**; shared **`correlationId`: `flagship-bundle-eu-ai-act-001`**. Submit each with `pnpm jarvis:submit --file …`, then **Approve** + **Execute** each in the HUD. OpenClaw tools: **`proposeAlfredIntakeSystemNote`**, **`proposeResearchSystemNote`** (`src/openclaw-strict-governed/`).

---

## Flow 2 — Creative output

| Field | Example |
|--------|---------|
| **Grep anchor** | `flagship-flow-2-publish-variant-b` |
| **Jarvis `kind`** | `content.publish` |
| **Sample title** | Publish: investor one-pager — Variant B (shorter hook, CTA v2) |
| **Sample summary** | Creative selected **Variant B** from three `system.note`-captured drafts; payload is staging path + channel metadata; no send until HUD approve + execute. |
| **Owning agent** | Creative (authored the publish intent; Alfred confirmed constraints only). |
| **Risk level** | High |
| **Why it stops at Jarvis** | Publishing is **outbound / world-facing**; authority lives in the HUD gate, not in model confidence. Approve ≠ execute; policy and adapters enforce the allowlist. |

---

## Flow 3 — Mixed (research → creative package)

| Field | Example |
|--------|---------|
| **Grep anchor** | `flagship-flow-3-youtube-package-mixed` |
| **Jarvis `kind`** | `youtube.package` |
| **Sample title** | YouTube package: “Strongman” beat — evidence-backed script v2 |
| **Sample summary** | Research supplied cited claims (2 disputed, flagged); Creative locked script v2 and b-roll list; package job references evidence bundle id in narrative metadata — **one approval id = one package execution** per [ADR-0005](../decisions/0005-agent-team-batch-v0-per-item-execute.md). |
| **Owning agent** | Creative (primary owner of this **execution** proposal); Research’s digest may exist as a **separate** approved `system.note` in the same batch. |
| **Risk level** | Medium–high |
| **Why it stops at Jarvis** | Bundling does not merge authority: the package is still **one gated effect**; human must approve before the adapter runs, with receipts for audit. |

---

## Related

- [Agent team contract v1](../strategy/agent-team-contract-v1.md)
- [Research agent v1](../strategy/research-agent-v1.md)
- [Creative agent v1](../strategy/creative-agent-v1.md)
- [Research batch workflow v1](../strategy/research-batch-workflow-v1.md)
- [Creative batch workflow v1](../strategy/creative-batch-workflow-v1.md)
