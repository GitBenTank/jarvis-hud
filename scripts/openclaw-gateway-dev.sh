#!/usr/bin/env bash
# Start OpenClaw gateway with a stable dev state dir (canonical local stack).
# Usage: from anywhere — bash path/to/jarvis-hud/scripts/openclaw-gateway-dev.sh
# Override: OPENCLAW_ROOT, OPENCLAW_STATE_DIR
# Phase 1 blessed path (see docs/setup/local-stack-startup.md): OPENCLAW_ROOT=~/Documents/openclaw-runtime
# Default below stays ~/Documents/openclaw for machines that only have one clone.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Jarvis ingress URL, shared secret, and OpenAI key for the dev agent (from jarvis-hud .env.local).
eval "$(node "$SCRIPT_DIR/openclaw-gateway-env-from-jarvis.mjs")"
echo "openclaw-gateway-dev: JARVIS_BASE_URL=$JARVIS_BASE_URL (from .env.local)"

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
echo "openclaw-gateway-dev: cd $OPENCLAW_ROOT && pnpm gateway:dev"
cd "$OPENCLAW_ROOT"
exec pnpm gateway:dev
