---
title: "Enterprise readiness — snapshot 2026-05-09"
status: snapshot
snapshot_date: 2026-05-09
category: governance
owner: Ben Tankersley
related:
  - ./trust-and-determinism.md
  - ../strategy/operating-assumptions.md
  - ../strategy/messaging-execution-integrity.md
  - ../architecture/security-model.md
  - ../setup/serious-mode-rehearsal-checklist.md
  - ../setup/phase2-auth-authority-checklist.md
  - ../decisions/0001-thesis-lock.md
---

# Enterprise readiness — snapshot (2026-05-09)

**Purpose:** Honest **gap list** for diligence and sequencing—not a roadmap commitment. Built from the **current repo baseline** (proxy boundary, lazy `JARVIS_ROOT`, green tests/golden-loop, operating assumptions, auth-on stack verification). **Revisit** after material posture changes; supersede with a new dated file rather than letting this one drift.

---

| Gap | Why it matters | What exists now | What would close it |
|-----|----------------|-----------------|---------------------|
| **Strong identity on the HUD** | Buyers need “who approved / executed” tied to a stable principal, not only “browser had a session.” | `JARVIS_AUTH_ENABLED`, session cookie, step-up on execute paths ([§2 operating assumptions](../strategy/operating-assumptions.md)); ingress still **capability**, not human SSO. | IdP integration (OIDC/SAML or delegated SSO), named user mapping in receipts/traces, documented threat model for cookie + step-up vs org IdP. |
| **Roles / RBAC** | Separation of duties: submitters vs approvers vs operators vs break-glass. | Binary “auth on / off” and operator narrative in [Phase 2 checklist](../setup/phase2-auth-authority-checklist.md); policy gate at execute time. | Productized roles, least-privilege defaults, audit fields for role + actor on each transition. |
| **Multi-environment / fleet truth** | One host passing `pnpm machine-wired` does not imply org-wide integrity. | Single-host **contract / narrative / probe** triad; [Phase 1 freeze](../setup/phase1-freeze-checklist.md). | Per-env frozen contracts, promoted “known-good” posture checks, config-as-code or runbook matrix keyed by env (staging/prod). |
| **Ingress hardening at scale** | Shared HMAC secret is powerful; abuse and secret sprawl become enterprise risks. | Rate limiting in ingress tests; allowlist; nonce/replay stance in [trusted ingress](../security/trusted-ingress.md). | mTLS or per-connector keys, rotation runbooks, network placement guidance, WAF/bot posture docs, secret vault integration. |
| **Data residency & retention** | Regulated buyers ask where state lives and how long it stays. | Local-first `JARVIS_ROOT`; file-based receipts/traces/policy logs; no productized retention controller. | Published retention defaults, purge/export flows, optional encryption-at-rest for `JARVIS_ROOT`, region story if cloud-hosted. |
| **Tamper resistance / anchoring** | “Provable” becomes credible when logs survive malicious or careless operators. | Hash-linked exports and replay paths where implemented; files on disk are mutable by OS user. | Optional immutability (WORM bucket, append-only store), periodic anchoring to external log, key custody story—not required for local solo use. |
| **DR / continuity** | If the control plane host dies, what is the RPO/RTO story? | App is recoverable from repo + env; Jarvis data is operator-managed under `JARVIS_ROOT`. | Documented backup/restore for `JARVIS_ROOT`, cold-start drill, HA posture if moving off single host. |
| **Compliance mapping (language only)** | SOC2/ISO buyers map controls to behaviors; absence of a map invites guessing. | Security model, policy decision logs, Thesis Lock, [messaging — execution integrity](../strategy/messaging-execution-integrity.md) objections. | Short control mapping appendix (e.g. access, logging, change management) **without** claiming third-party certification until earned. |
| **Commercial / support surface** | Enterprises buy support boundaries and escalation, not only software. | Open development / maintainer workflow; no packaged SLA here. | Support tiers, incident severity, security contact, release/support cadence when offering moves beyond founder-led. |

---

## How to use this

- **Diligence:** Point here first, then [security model](../architecture/security-model.md) and [Thesis Lock](../decisions/0001-thesis-lock.md).
- **Diligence responses:** Gaps are **honest**; pair with rebuttals that stress **execution integrity now**, **sequencing**, and **falsifiable probes**—not feature parity with incumbent ITSM.

## See also

- [Trust and determinism](./trust-and-determinism.md)
- [Auth-on stack verification](../setup/serious-mode-rehearsal-checklist.md)
