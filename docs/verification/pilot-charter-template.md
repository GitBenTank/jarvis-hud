---
title: "Pilot charter — template"
status: template
category: verification
owner: Ben Tankersley
related:
  - ./pilot-green-single-session.md
  - ./pilot-proof-bundle-checklist.md
  - ../governance/enterprise-readiness-snapshot-2026-05-09.md
  - ../strategy/operating-assumptions.md
  - ../setup/phase1-freeze-checklist.md
---

# Pilot charter — template

**Instructions:** Copy to a **dated** file outside the repo or into a secure share. Fill every table; **do not** paste raw `.env.local`. Align **[proof bundle](./pilot-proof-bundle-checklist.md)** with the **same** `JARVIS_ROOT` and audit **`start`/`end`**.

---

## A. Parties and scope

| Field | Value |
|-------|--------|
| Pilot name / ID | |
| Dates (start–end) | |
| Systems / effects in scope | |
| Systems explicitly **out** of scope | |

---

## B. Auth posture (HUD authority)

**Reference:** [Operating assumptions §2](../strategy/operating-assumptions.md), [auth-on stack verification](../setup/serious-mode-rehearsal-checklist.md).

| Decision | Value |
|----------|--------|
| Mode | ☐ Convenience (`JARVIS_AUTH_ENABLED=false`) ☐ Serious (`true`) |
| If serious: session + step-up understood | ☐ Yes |
| Named operators (who may approve/execute) | |
| Shared workstation / break-glass policy | |
| Waivers (if any) + risk owner signature | |

**Written rule:** In serious mode, **cookieless governed APIs** stop at **`proxy.ts`**; execute may require **step-up** before adapters.

---

## C. Ingress charter (capability, not identity)

| Field | Value |
|-------|--------|
| Custodians of `JARVIS_INGRESS_OPENCLAW_SECRET` | |
| Where gateway runs (segment / VPN / host) | |
| Connector instances allowed | |
| Rotation + kill procedure on leak | |

**Written rule:** Ingress proves **signed connector capability**, **not** which human typed the proposal. Human authority is **approve/execute** on the HUD.

---

## D. Blast envelope and backups

| Field | Value |
|-------|--------|
| **Allowed kinds** for this pilot (all else deny at policy gate) | |
| **`JARVIS_EXEC_ALLOWED_ROOTS` / `JARVIS_EXEC_ALLOWED_REPOS`** (exact paths) | |
| **`JARVIS_ROOT`** for pilot data | |
| Backup: what is copied, how often, where stored, restore tested | |

**Permission drift line:** If **allowed kind set**, **target scope**, and **backup boundary** are not written **before** the pilot starts, this document is **not** a pilot charter—it is **unbounded permission**.

---

## E. Evidence pointers (same run)

| Artifact | Location |
|----------|----------|
| `JARVIS_ROOT` | |
| Audit export (`start`–`end`) | |
| Probe outputs | |
| Policy deny repro (procedure) | [`policy-deny-repro.md`](./policy-deny-repro.md) |

---

## F. Sign-off

| Role | Name | Date |
|------|------|------|
| Technical owner | | |
| Security / risk (if applicable) | | |
