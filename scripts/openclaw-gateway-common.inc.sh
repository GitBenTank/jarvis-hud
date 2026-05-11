# Shared prelude for OpenClaw gateway from jarvis-hud (sourced, not executed).
# Requires: SCRIPT_DIR set to this script's directory; bash; set -euo pipefail in parent.
# shellcheck source=openclaw-gateway-fixed-env.inc.sh
source "$SCRIPT_DIR/openclaw-gateway-fixed-env.inc.sh"

eval "$(node "$SCRIPT_DIR/openclaw-gateway-env-from-jarvis.mjs")"

# Prefer clean runtime clone (local-stack-startup.md); allow explicit OPENCLAW_ROOT override.
if [[ -n "${OPENCLAW_ROOT:-}" ]] && [[ -f "$OPENCLAW_ROOT/package.json" ]]; then
  :
elif [[ -f "${HOME}/Documents/openclaw-runtime/package.json" ]]; then
  OPENCLAW_ROOT="${HOME}/Documents/openclaw-runtime"
else
  OPENCLAW_ROOT="${OPENCLAW_ROOT:-${HOME}/Documents/openclaw}"
fi

if [[ ! -d "$OPENCLAW_ROOT" ]] || [[ ! -f "$OPENCLAW_ROOT/package.json" ]]; then
  echo "openclaw-gateway: OPENCLAW_ROOT missing or invalid: ${OPENCLAW_ROOT:-unset}" >&2
  echo "  Clone OpenClaw or set OPENCLAW_ROOT in .env.local / environment." >&2
  exit 1
fi

export OPENCLAW_ROOT
