#!/usr/bin/env bash
# Start OpenClaw gateway with a stable dev state dir (canonical local stack).
# Usage: from anywhere — bash path/to/jarvis-hud/scripts/openclaw-gateway-dev.sh
# Override: OPENCLAW_ROOT, OPENCLAW_STATE_DIR, OPENCLAW_GATEWAY_PORT (default 19001)
# Phase 1 blessed path (see docs/setup/local-stack-startup.md): OPENCLAW_ROOT=~/Documents/openclaw-runtime
# Default below stays ~/Documents/openclaw for machines that only have one clone.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Jarvis ingress URL, shared secret, and OpenAI key for the dev agent (from jarvis-hud .env.local).
eval "$(node "$SCRIPT_DIR/openclaw-gateway-env-from-jarvis.mjs")"
echo "openclaw-gateway-dev: JARVIS_BASE_URL=$JARVIS_BASE_URL (from .env.local)"

export OPENCLAW_GATEWAY_PORT="${OPENCLAW_GATEWAY_PORT:-19001}"
echo "openclaw-gateway-dev: expected Control UI: http://127.0.0.1:$OPENCLAW_GATEWAY_PORT"
echo "openclaw-gateway-dev: set OPENCLAW_CONTROL_UI_URL in jarvis-hud .env.local to match this port"
echo "openclaw-gateway-dev: Control UI token (while this gateway runs): from jarvis-hud run pnpm openclaw:dashboard-auth"

export OPENCLAW_STATE_DIR="${OPENCLAW_STATE_DIR:-$HOME/.openclaw-dev}"
OPENCLAW_ROOT="${OPENCLAW_ROOT:-$HOME/Documents/openclaw}"

if [[ ! -d "$OPENCLAW_ROOT" ]]; then
  echo "openclaw-gateway-dev: OPENCLAW_ROOT not found: $OPENCLAW_ROOT" >&2
  echo "  Set OPENCLAW_ROOT to your OpenClaw clone, or clone into ~/Documents/openclaw" >&2
  exit 1
fi

if [[ ! -f "$OPENCLAW_ROOT/package.json" ]]; then
  echo "openclaw-gateway-dev: no package.json in $OPENCLAW_ROOT" >&2
  exit 1
fi

echo "openclaw-gateway-dev: OPENCLAW_STATE_DIR=$OPENCLAW_STATE_DIR"

# Local Jarvis + Control UI does not need LAN Bonjour. mDNS (@homebridge/ciao) can throw
# and kill the whole gateway on some macOS network/interface states. OpenClaw: OPENCLAW_DISABLE_BONJOUR=1
# (https://openclaws.io/docs/gateway/discovery/). Override: OPENCLAW_DISABLE_BONJOUR=0 pnpm openclaw:dev
export OPENCLAW_DISABLE_BONJOUR="${OPENCLAW_DISABLE_BONJOUR:-1}"
echo "openclaw-gateway-dev: OPENCLAW_DISABLE_BONJOUR=$OPENCLAW_DISABLE_BONJOUR"

if [[ -n "${OPENAI_API_KEY:-}" ]]; then
  node "$SCRIPT_DIR/sync-openclaw-openai-auth-from-env.mjs"
else
  echo "openclaw-gateway-dev: OPENAI_API_KEY unset — embedded Control UI chat needs it in .env.local; run: pnpm openclaw:sync-openai-auth after setting the key"
fi
echo "openclaw-gateway-dev: cd $OPENCLAW_ROOT && pnpm gateway:dev"
cd "$OPENCLAW_ROOT"

port_listening() {
  local p="$1"
  lsof -tiTCP:"$p" -sTCP:LISTEN >/dev/null 2>&1
}

# After OPENCLAW_GATEWAY_PORT is set; log path for diagnostics tail (may not exist until tee runs).
openclaw_gateway_diag_log() {
  echo "${OPENCLAW_GATEWAY_LOG:-/tmp/openclaw-gateway-last.log}"
}

openclaw_gateway_monitor() {
  local log_file
  log_file="$(openclaw_gateway_diag_log)"
  for ((i = 1; i <= 90; i++)); do
    if port_listening "$OPENCLAW_GATEWAY_PORT" || port_listening 18789; then
      echo "openclaw-gateway-dev: Control UI listener detected within ${i}s (checked $OPENCLAW_GATEWAY_PORT and 18789)" >&2
      return 0
    fi
    sleep 1
  done
  echo "openclaw-gateway-dev: no listener on $OPENCLAW_GATEWAY_PORT or 18789 after 90s — diagnostics:" >&2
  pgrep -af "run-node.mjs --dev gateway" 2>/dev/null || echo "(pgrep: no match)" >&2
  lsof -nP -iTCP -sTCP:LISTEN 2>/dev/null | grep -E "18789|19001|3000" || echo "(lsof: no match for 18789|19001|3000)" >&2
  if [[ -f "$log_file" ]]; then
    tail -80 "$log_file" >&2
  else
    echo "(no log file at $log_file)" >&2
  fi
}

MON_PID=""
cleanup_monitor() {
  if [[ -n "${MON_PID:-}" ]]; then
    kill "$MON_PID" 2>/dev/null || true
    wait "$MON_PID" 2>/dev/null || true
  fi
}
trap cleanup_monitor EXIT

(
  openclaw_gateway_monitor
) &
MON_PID=$!

# When stdout is not a TTY (some IDE terminals), OpenClaw's `stdio: inherit` chain can look
# "silent" until flush — failures then show only `ELIFECYCLE` with no story. Tee forces a pipe
# so lines appear and a log file survives for debugging.
if [[ -n "${OPENCLAW_GATEWAY_LOG:-}" ]]; then
  echo "openclaw-gateway-dev: OPENCLAW_GATEWAY_LOG=$OPENCLAW_GATEWAY_LOG (append; delete file to reset)" >&2
  pnpm gateway:dev 2>&1 | tee -a "$OPENCLAW_GATEWAY_LOG"
  exit "${PIPESTATUS[0]}"
fi
pnpm gateway:dev
