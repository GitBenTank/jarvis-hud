---
title: "Phase 2 — auth and human authority checklist"
status: living-document
category: setup
owner: Ben Tankersley
related:
  - ../strategy/operating-assumptions.md
  - ../architecture/openclaw-v1-contract.md
  - ../architecture/openclaw-jarvis-trust-contract.md
  - openclaw-jarvis-operator-checklist.md
  - serious-mode-rehearsal-checklist.md
---

# Phase 2 — auth and human authority checklist

**Purpose:** Record decisions for **who holds which authority** on the [blessed stack §1](../strategy/operating-assumptions.md#1-canonical-openclaw-deployment-for-this-project), and how that maps to **local dev**, **demo**, and **serious** modes ([§2](../strategy/operating-assumptions.md#2-auth-and-step-up-jarvis)). Fill when moving from convenience auth-off to multi-operator or sensitive data.

**Normative summary:** [Operating assumptions §2](../strategy/operating-assumptions.md#2-auth-and-step-up-jarvis).

---

## Decisions (fill in)

| Question | Your answer |
|----------|-------------|
| **Who may possess `JARVIS_INGRESS_OPENCLAW_SECRET`?** (people, CI, hosts) | |
| **Who may approve in the HUD?** (same machine only? VPN? SSO later?) | |
| **Who may execute?** (step-up required when `JARVIS_AUTH_ENABLED=true`?) | |
| **Headless submitters (OpenClaw, scripts):** allowed in prod-like envs? under what network boundary? | |
| **`stepUpValid` in normal use:** max TTL / re-auth policy acceptable to you | |
| **When is `JARVIS_AUTH_ENABLED=true` mandatory?** (e.g. shared laptop, customer data, recorded demos that must show gate) | |

---

## Probes

```bash
pnpm auth-posture              # cookieless; explains convenience vs auth-on
JARVIS_EXPECT_AUTH=true pnpm auth-posture   # fails if auth disabled
pnpm machine-wired             # Phase 1 stack (run alongside)
```

---

## Related

- [Serious-mode rehearsal checklist](serious-mode-rehearsal-checklist.md) — auth on, one batched flow, record authority UX
- [Operator integration phases — Phase 2](../roadmap/0003-operator-integration-phases.md)
- [Environment variables — Authentication](env.md#authentication)
