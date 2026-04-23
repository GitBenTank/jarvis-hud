---
title: "Phase 1 — deployment freeze checklist"
status: living-document
category: setup
owner: Ben Tankersley
related:
  - ../strategy/operating-assumptions.md
  - local-stack-startup.md
  - ../openclaw-integration-verification.md
  - openclaw-jarvis-operator-checklist.md
---

# Phase 1 — deployment freeze checklist

**Purpose:** Capture **ground truth** for one machine, then keep [operating assumptions §1](../strategy/operating-assumptions.md#1-canonical-openclaw-deployment-for-this-project) and runbooks aligned. Fill this when onboarding a new laptop or after changing gateway install, ports, or env layout.

**Blessed stack (summary):** [Local stack startup](local-stack-startup.md) — **clean** OpenClaw at **`~/Documents/openclaw-runtime`** + **`OPENCLAW_ROOT=~/Documents/openclaw-runtime pnpm openclaw:dev`** + `~/.openclaw-dev`; Jarvis `pnpm dev`; secrets in jarvis-hud `.env.local`.

---

## 1. Ground truth (copy from a working session)

| Field | Your value |
|-------|------------|
| **Jarvis HUD repo path** | |
| **OpenClaw clone path** | **`~/Documents/openclaw-runtime`** (blessed); **`~/Documents/openclaw`** (hacking / legacy default if `OPENCLAW_ROOT` unset) |
| **How OpenClaw gateway is started** | e.g. **`OPENCLAW_ROOT=~/Documents/openclaw-runtime pnpm openclaw:dev`** from jarvis-hud |
| **`OPENCLAW_STATE_DIR`** | Should be `$HOME/.openclaw-dev` for blessed stack |
| **Control UI URL (origin)** | From gateway logs / browser — goes in `OPENCLAW_CONTROL_UI_URL` |
| **`JARVIS_HUD_BASE_URL` or `JARVIS_BASE_URL`** | Prefer `http://127.0.0.1:<port>` |
| **Ingress URL** | `{JARVIS_HUD_BASE_URL}/api/ingress/openclaw` |
| **Secret source** | jarvis-hud `.env.local` → `JARVIS_INGRESS_OPENCLAW_SECRET` (≥32 chars); gateway picks up via `openclaw-gateway-dev.sh` |

---

## 2. Known-good approve → execute flow (one line)

Describe the last run that worked end-to-end (no secrets):

Example: *`pnpm jarvis:smoke` from OpenClaw clone → pending row in HUD → Approve → Execute → receipt in activity / trace.*

Your notes:

---

## 3. Commands to snapshot (optional)

```bash
# Jarvis listening
lsof -nP -iTCP -sTCP:LISTEN | grep -E '3000|3001' || true

# Control UI port from .env.local
grep -E '^(OPENCLAW_CONTROL_UI_URL|JARVIS_HUD_BASE_URL|JARVIS_BASE_URL)=' /path/to/jarvis-hud/.env.local

# Gateway process (replace PORT with Control UI port)
lsof -nP -iTCP:PORT -sTCP:LISTEN
```

---

## 4. Pass/fail

With Jarvis and the gateway **running**:

```bash
cd /path/to/jarvis-hud
pnpm machine-wired
```

**Done when:** command exits `0` and you can answer **yes** to: *Does this host match the blessed Jarvis/OpenClaw deployment shape?*

---

## Related

- [Operator integration phases — Phase 1](../roadmap/0003-operator-integration-phases.md)
- [OpenClaw integration verification](../openclaw-integration-verification.md)
