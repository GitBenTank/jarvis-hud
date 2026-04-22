# Environment Variables

Jarvis HUD configuration is driven by environment variables. Never commit secrets to the repo. Use `.env.local` (git-ignored) for local overrides.

**Ports and base URLs:** Standard dev often uses **:3000**; demo / ingress rehearsal often uses **:3001**. The running Next.js process is the authority — align `JARVIS_HUD_BASE_URL`, OpenClaw, and scripts to the **live** origin. See [Local dev truth map](local-dev-truth-map.md).

---

## Storage

| Variable | Required | Description |
|----------|----------|-------------|
| `JARVIS_ROOT` | No | Base directory for events, actions, receipts. Default: `~/jarvis` |

---

## Code execution (code.apply)

| Variable | Required | Description |
|----------|----------|-------------|
| `JARVIS_REPO_ROOT` | For code.apply | Path to git repo for code.diff/code.apply. Must be set for code.apply to be available. |

---

## Authentication

| Variable | Required | Description |
|----------|----------|-------------|
| `JARVIS_AUTH_ENABLED` | No | `"true"` to require session auth for gated HUD / API routes |
| `JARVIS_AUTH_SECRET` | When auth enabled | Min 16 chars. Used for session signing. |

**Authority model (who may submit vs approve):** [Operating assumptions §2](../strategy/operating-assumptions.md#2-auth-and-step-up-jarvis). Ingress still uses **`JARVIS_INGRESS_OPENCLAW_SECRET`** (HMAC) — that secret is **not** a substitute for human identity.

**Probe:** `pnpm auth-posture` from jarvis-hud. For hosts that must run with auth on, use **`JARVIS_EXPECT_AUTH=true pnpm auth-posture`** in CI or onboarding scripts.

---

## Connector ingress (OpenClaw)

| Variable | Required | Description |
|----------|----------|-------------|
| `JARVIS_INGRESS_OPENCLAW_ENABLED` | No | `"true"` to enable `POST /api/ingress/openclaw` |
| `JARVIS_INGRESS_OPENCLAW_SECRET` | When ingress enabled | Min 32 chars. Shared secret for HMAC signing. |
| `JARVIS_INGRESS_ALLOWLIST_CONNECTORS` | For integration | Comma-separated list. Must include `openclaw` for OpenClaw integration. |

---

## OpenClaw strict-governed client (reference slice)

Used by `src/openclaw-strict-governed` when wiring OpenClaw-style tools. Same ingress secret and base URL as above.

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENCLAW_STRICT_GOVERNED` | No | Set to `"true"` to block **direct** governed-repo mutation tools; use `proposeCodeApply` (Jarvis ingress) instead. |
| `OPENCLAW_GOVERNED_REPO_ROOT` | For read/write tools | Governed git repo path for `readGovernedFile` / path checks. Falls back to `JARVIS_REPO_ROOT` if unset. |

---

## Other

| Variable | Required | Description |
|----------|----------|-------------|
| `JARVIS_HUD_BASE_URL` | No | Base URL for scripts (prefer **`http://127.0.0.1:3000`** to match Phase 1; see [operating assumptions §1](../strategy/operating-assumptions.md#1-canonical-openclaw-deployment-for-this-project)). Must match the **listening** dev server (see [Local dev truth map](local-dev-truth-map.md)). When set, `GET /api/config` includes `jarvisHudBaseUrl`; the HUD shows a non-blocking warning if that URL’s origin differs from where you opened the app. |
| `OPENCLAW_CONTROL_UI_URL` | No | `http:` or `https:` URL of the OpenClaw Control UI — **must match the port your gateway binds** (often **18789** or **19001**; use gateway logs or `pnpm local:stack:doctor`). When set, `GET /api/config` includes `openclawControlUiUrl` and the OpenClaw health strip can show **Open OpenClaw Control**. Navigation only; ingress still requires secrets and OpenClaw-side `JARVIS_BASE_URL`. Startup order: [Local stack startup](local-stack-startup.md); deep setup: [OpenClaw Control UI](openclaw-control-ui.md). |
| `JARVIS_LOG_POLLING` | No | `"1"` to enable server-side log polling |
| `PORT` | No | Binds the dev server when using `pnpm dev:port` / `demo:boot` (often **3001** for demos; **3000** for plain `pnpm dev`). Not magic — match your running process. |

**API (not env):** `GET /api/config` includes `integrationIssues` — derived issue codes when OpenClaw ingress is misconfigured or (with valid config) the disk-based health signal reports stale activity. The HUD shows a banner only when this array is non-empty; it does not imply a separate “healthy” dashboard.

---

## Ingress workflow

Use `dev:port` when running with ingress to avoid port collisions:

```bash
PORT=3001 pnpm dev:port   # with JARVIS_INGRESS_* env set
JARVIS_HUD_BASE_URL="http://127.0.0.1:3001" pnpm ingress:smoke
pnpm jarvis:doctor       # preflight before demos
pnpm auth-posture        # Phase 2: convenience vs serious-mode guard
```
