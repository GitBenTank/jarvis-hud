# Sourced by openclaw-gateway-common.inc.sh — one place for dev defaults (avoid daily typos).
# OPENCLAW_DISABLE_BONJOUR (not DISBLE) — stable local dev; see docs/setup/local-stack-startup.md
export OPENCLAW_STATE_DIR="${OPENCLAW_STATE_DIR:-$HOME/.openclaw-dev}"
export OPENCLAW_DISABLE_BONJOUR="${OPENCLAW_DISABLE_BONJOUR:-1}"
export OPENCLAW_GATEWAY_PORT="${OPENCLAW_GATEWAY_PORT:-19001}"
