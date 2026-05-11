#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title OpenClaw dashboard token
# @raycast.mode fullOutput
# @raycast.packageName Jarvis HUD
# @raycast.icon 🔑

# Optional parameters:
# @raycast.description Prints Control UI auth helper (same as pnpm openclaw:dashboard-auth).

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=_env.sh
source "$SCRIPT_DIR/_env.sh"
cd "$REPO_ROOT" || exit 1
command -v pnpm >/dev/null 2>&1 || {
  echo "pnpm not on PATH. Install Node/pnpm or extend PATH in raycast/jarvis-hud/_env.sh"
  exit 1
}
exec pnpm openclaw:dashboard-auth
