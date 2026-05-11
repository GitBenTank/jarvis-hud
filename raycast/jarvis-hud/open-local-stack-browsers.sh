#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Open Jarvis + OpenClaw in browser
# @raycast.mode fullOutput
# @raycast.packageName Jarvis HUD
# @raycast.icon 🌐

# Optional parameters:
# @raycast.description Runs pnpm local:stack:open (HUD + Control UI when servers are up).

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=_env.sh
source "$SCRIPT_DIR/_env.sh"
cd "$REPO_ROOT" || exit 1
command -v pnpm >/dev/null 2>&1 || {
  echo "pnpm not on PATH. Install Node/pnpm or extend PATH in raycast/jarvis-hud/_env.sh"
  exit 1
}
exec pnpm local:stack:open
