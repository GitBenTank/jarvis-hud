#!/usr/bin/env bash
set -euo pipefail
set -a

DEMO_SECRET="openclaw-jarvis-demo-secret-minimum-32chars"

PORT="${PORT:-3001}"
export PORT

JARVIS_INGRESS_OPENCLAW_ENABLED="true"
JARVIS_INGRESS_OPENCLAW_SECRET="$DEMO_SECRET"
JARVIS_INGRESS_ALLOWLIST_CONNECTORS="openclaw"
JARVIS_HUD_BASE_URL="http://localhost:${PORT}"

set +a

echo "[demo-env] Jarvis loaded"
echo "[demo-env] PORT=$PORT"
echo "[demo-env] baseUrl=$JARVIS_HUD_BASE_URL"
echo "[demo-env] secretLen=${#DEMO_SECRET}"
