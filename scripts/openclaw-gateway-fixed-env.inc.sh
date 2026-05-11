# Sourced by openclaw-gateway-common.inc.sh — one place for dev defaults (avoid daily typos).
# OPENCLAW_DISABLE_BONJOUR (not DISBLE) — stable local dev; see docs/setup/local-stack-startup.md
export OPENCLAW_STATE_DIR="${OPENCLAW_STATE_DIR:-$HOME/.openclaw-dev}"
export OPENCLAW_DISABLE_BONJOUR="${OPENCLAW_DISABLE_BONJOUR:-1}"
export OPENCLAW_GATEWAY_PORT="${OPENCLAW_GATEWAY_PORT:-19001}"
# run-node.mjs: when unset, syncRuntimeArtifacts can walk huge dist/extension trees and appear hung
# (no log until bind). Default 1 skips that sync on startup; set OPENCLAW_WATCH_MODE=0 to force full sync.
export OPENCLAW_WATCH_MODE="${OPENCLAW_WATCH_MODE:-1}"
