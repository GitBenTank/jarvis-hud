---
title: "OpenClaw ingress — explainer for non-coders"
status: living-document
category: setup
related:
  - ../architecture/openclaw-v1-contract.md
  - ../architecture/openclaw-jarvis-trust-contract.md
  - ../architecture/openclaw-proposal-identity-and-contract.md
  - ../security/openclaw-ingress-signing.md
  - openclaw-jarvis-operator-checklist.md
  - ../openclaw-integration-verification.md
  - ../decisions/0001-thesis-lock.md
---

# OpenClaw ingress — explainer for non-coders

**Purpose:** Plain-language mental model for **how proposals get into Jarvis** from OpenClaw (or any signed client), without reading TypeScript or HMAC details.

**Technical specs:** [OpenClaw proposal identity & contract](../architecture/openclaw-proposal-identity-and-contract.md) · [Ingress signing](../security/openclaw-ingress-signing.md) · [Integration verification](../openclaw-integration-verification.md).

---

## What “ingress” is

**Ingress** is the **controlled door** through which external systems **drop proposals** into Jarvis. Each successful ingress **creates a proposal record** (visible in the HUD) that humans can review.

Ingress is **not**:

- automatic execution  
- proof that a specific person clicked “approve”  
- proof that the proposal is safe, correct, or allowed to run yet  

Those belong to **approval** and **execute** inside Jarvis, after the proposal exists.

---

## The journey (one line per step)

1. **Something proposes** — OpenClaw, a script, or a plugin builds a **proposal** (what kind of action, title, summary, payload).  
2. **Ingress accepts or rejects** — Jarvis checks the **signature**, **allowlist**, and **shape** of the body. If something is wrong, you get a **clear HTTP error** and **nothing** new appears in the approval queue.  
3. **Human reviews** — An operator **approves** (or rejects) in the HUD.  
4. **Human executes** — **Approve ≠ run.** Execution is a **separate** explicit step when the system requires it.  
5. **Receipts** — Real outcomes produce **artifacts + logs** you can audit (Thesis Lock: [ADR-0001](../decisions/0001-thesis-lock.md)).

---

## What a valid proposal must say (conceptually)

Think of a proposal as a **form** Jarvis can parse:

| Idea | Plain meaning |
|------|----------------|
| **Kind** | Which type of action this is (e.g. a note, a code change proposal — only **allowlisted** kinds are accepted). |
| **Title** | Short headline for humans scanning the queue. |
| **Summary** | A few sentences of context. |
| **Source** | Must say it came through the **OpenClaw** connector for this endpoint. |
| **Payload** | The **actual content** the kind needs (e.g. the text of a note). Kinds have different rules. |

**Optional but useful:** who proposed (`agent`), machine ids (`source.agentId`), correlation ids — helps **trace** work across systems without changing who is allowed to **approve**.

**Batches (review containers):** Sometimes several items are grouped for **triage** in the UI. That grouping is **not** permission to “execute the whole batch as one click” in a vague way — execution and receipts stay **per item**, per [ADR-0005](../decisions/0005-agent-team-batch-v0-per-item-execute.md). If someone says “batch approved,” ask whether they mean **review grouping** or **each item was explicitly handled**.

---

## What a successful ingress **does** and **does not** prove

| Proves | Does **not** prove |
|--------|---------------------|
| The caller had the **shared ingress secret** and sent a **conforming** body | **Which human** was at the keyboard |
| Jarvis **recorded** a proposal you can see | That anyone **approved** or **executed** it |
| The wire format was **valid** for an allowlisted kind | That the **content** is wise, safe, or policy-compliant |

**Normative:** [OpenClaw ↔ Jarvis trust contract — ingress vs human authority](../architecture/openclaw-jarvis-trust-contract.md#ingress-capability-vs-human-authority).

Holding the ingress secret is **powerful**: it can **flood** the queue with proposals. Protect the secret like a password; **rotate** it if leaked. Serious environments also turn on **HUD auth** so approve/execute is not “anyone on the network who can open the page.”

---

## When things fail (symptoms, not stack traces)

| What you see | Likely meaning |
|--------------|----------------|
| **401 / signature errors** | Wrong secret, bad clock, or malformed signing — fix env and signing code. |
| **403** | Ingress disabled, wrong connector allowlist, or secret missing in Jarvis env. |
| **400** with validation message | Body shape wrong: missing title, wrong `kind`, payload rules not met, or invalid `batch` object. Compare to [minimal v1 contract](../architecture/openclaw-proposal-identity-and-contract.md#minimal-v1-contract). |
| Proposal appears but execute blocked | Often **trust posture** (step-up, scope, `code.apply` blocks). Read `GET /api/config` / [V1 contract](../architecture/openclaw-v1-contract.md) — not an ingress problem anymore. |

**Hands-on proof:** `pnpm ingress:smoke` from jarvis-hud (see [integration verification](../openclaw-integration-verification.md)).

---

## Where operators go next

- **Daily order of operations:** [Operator checklist](openclaw-jarvis-operator-checklist.md)  
- **Stack + ports:** [Local stack startup](local-stack-startup.md)  
- **Agent preflight before submit:** [OpenClaw V1 contract](../architecture/openclaw-v1-contract.md)  
- **Signing bytes and headers:** [OpenClaw ingress signing](../security/openclaw-ingress-signing.md)

---

## Thesis Lock (non-negotiable)

Agents may **propose** anything; **execution** requires **explicit human approval**; **approval** is not **execution**; every real action produces **receipts**; the **model** is not a trusted principal. If a workflow skips or blurs those steps, it is **drift**, not a shortcut — see [video thesis](../strategy/jarvis-hud-video-thesis.md#thesis-lock-do-not-drift).
