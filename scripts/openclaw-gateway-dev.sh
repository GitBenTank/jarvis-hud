#!/usr/bin/env bash
# Start OpenClaw gateway with a stable dev state dir (canonical local stack).
# Usage: from anywhere — bash path/to/jarvis-hud/scripts/openclaw-gateway-dev.sh
# Override: OPENCLAW_ROOT, OPENCLAW_STATE_DIR, OPENCLAW_GATEWAY_PORT (defaults in openclaw-gateway-fixed-env.inc.sh)
# Prefer: pnpm openclaw:dev (from jarvis-hud) or pnpm openclaw:run for foreground without tee/monitor.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=openclaw-gateway-common.inc.sh
source "$SCRIPT_DIR/openclaw-gateway-common.inc.sh"

echo "openclaw-gateway-dev: JARVIS_BASE_URL=$JARVIS_BASE_URL (from .env.local)"
echo "openclaw-gateway-dev: expected Control UI: http://127.0.0.1:$OPENCLAW_GATEWAY_PORT"
echo "openclaw-gateway-dev: set OPENCLAW_CONTROL_UI_URL in jarvis-hud .env.local to match this port"
echo "openclaw-gateway-dev: Control UI token (while this gateway runs): from jarvis-hud run pnpm openclaw:dashboard-auth"
echo "openclaw-gateway-dev: OPENCLAW_STATE_DIR=$OPENCLAW_STATE_DIR"
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
