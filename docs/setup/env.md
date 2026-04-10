# Environment Variables

Jarvis HUD configuration is driven by environment variables. Never commit secrets to the repo. Use `.env.local` (git-ignored) for local overrides.

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
| `JARVIS_AUTH_ENABLED` | No | `"true"` to require session auth |
| `JARVIS_AUTH_SECRET` | When auth enabled | Min 16 chars. Used for session signing. |

---

## Connector ingress (OpenClaw)

| Variable | Required | Description |
|----------|----------|-------------|
| `JARVIS_INGRESS_OPENCLAW_ENABLED` | No | `"true"` to enable `POST /api/ingress/openclaw` |
| `JARVIS_INGRESS_OPENCLAW_SECRET` | When ingress enabled | Min 32 chars. Shared secret for HMAC signing. |
| `JARVIS_INGRESS_ALLOWLIST_CONNECTORS` | For integration | Comma-separated list. Must include `openclaw` for OpenClaw integration. |

---

## Other

| Variable | Required | Description |
|----------|----------|-------------|
| `JARVIS_HUD_BASE_URL` | No | Base URL for scripts (default: `http://localhost:3000`) |
| `JARVIS_LOG_POLLING` | No | `"1"` to enable server-side log polling |
| `PORT` | No | Used by `pnpm dev:port` (default: 3000) |

---

## Ingress workflow

Use `dev:port` when running with ingress to avoid port collisions:

```bash
PORT=3001 pnpm dev:port   # with JARVIS_INGRESS_* env set
JARVIS_HUD_BASE_URL="http://localhost:3001" pnpm ingress:smoke
pnpm jarvis:doctor       # preflight before demos
```
