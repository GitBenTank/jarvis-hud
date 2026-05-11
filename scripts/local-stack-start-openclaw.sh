#!/usr/bin/env bash
# Start OpenClaw gateway via jarvis-hud wrapper with tee log (repo root from script path).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

export OPENCLAW_ROOT="${OPENCLAW_ROOT:-$HOME/Documents/openclaw-runtime}"
export OPENCLAW_GATEWAY_LOG="${OPENCLAW_GATEWAY_LOG:-/tmp/openclaw-gateway-last.log}"
export OPENCLAW_GATEWAY_PORT="${OPENCLAW_GATEWAY_PORT:-19001}"

cd "$REPO_ROOT"
echo "local-stack-start-openclaw: repo $REPO_ROOT"
echo "local-stack-start-openclaw: OPENCLAW_ROOT=$OPENCLAW_ROOT"
echo "local-stack-start-openclaw: OPENCLAW_GATEWAY_LOG=$OPENCLAW_GATEWAY_LOG"
echo "local-stack-start-openclaw: expected Control UI: http://127.0.0.1:$OPENCLAW_GATEWAY_PORT"
echo "local-stack-start-openclaw: set OPENCLAW_CONTROL_UI_URL in .env.local to match this port"
echo "local-stack-start-openclaw: wait for gateway ready; tail -f \"$OPENCLAW_GATEWAY_LOG\" in another terminal if needed"
echo "local-stack-start-openclaw: when stable, run: pnpm local:stack:doctor"
echo "local-stack-start-openclaw: Control UI token (while this gateway runs): pnpm openclaw:dashboard-auth"
exec pnpm openclaw:dev:log
