#!/usr/bin/env bash
# One-command OpenClaw gateway from jarvis-hud: correct env, no manual exports, no tee.
# Use when debugging ELIFECYCLE or IDE buffering — same contract as openclaw-gateway-dev.sh
# without the background port monitor. See: pnpm openclaw:run
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=openclaw-gateway-common.inc.sh
source "$SCRIPT_DIR/openclaw-gateway-common.inc.sh"

echo "openclaw-gateway-run: JARVIS_BASE_URL=${JARVIS_BASE_URL:-}"
echo "openclaw-gateway-run: OPENCLAW_ROOT=$OPENCLAW_ROOT"
echo "openclaw-gateway-run: OPENCLAW_STATE_DIR=$OPENCLAW_STATE_DIR OPENCLAW_GATEWAY_PORT=$OPENCLAW_GATEWAY_PORT (OPENCLAW_DISABLE_BONJOUR=$OPENCLAW_DISABLE_BONJOUR)"
echo "openclaw-gateway-run: Control UI → http://127.0.0.1:$OPENCLAW_GATEWAY_PORT/overview — token: pnpm openclaw:dashboard-auth"

if [[ -n "${OPENAI_API_KEY:-}" ]]; then
  node "$SCRIPT_DIR/sync-openclaw-openai-auth-from-env.mjs"
else
  echo "openclaw-gateway-run: OPENAI_API_KEY unset — chat may fail; see .env.local"
fi

cd "$OPENCLAW_ROOT"
exec pnpm gateway:dev
