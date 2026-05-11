#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Start Jarvis (Terminal)
# @raycast.mode silent
# @raycast.packageName Jarvis HUD
# @raycast.icon 🚀

# Optional parameters:
# @raycast.description Opens Terminal.app with pnpm dev from jarvis-hud.

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=_env.sh
source "$SCRIPT_DIR/_env.sh"
command -v pnpm >/dev/null 2>&1 || {
  osascript -e 'display alert "pnpm not on PATH" message "Edit raycast/jarvis-hud/_env.sh or install pnpm."'
  exit 1
}
cmd="cd $(printf %q "$REPO_ROOT") && exec pnpm dev"
osascript <<EOF
tell application "Terminal"
  activate
  do script "$cmd"
end tell
EOF
