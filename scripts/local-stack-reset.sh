#!/usr/bin/env bash
# Kill local stack processes; operator starts HUD + OpenClaw again (or uses Cursor tasks).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

bash "$SCRIPT_DIR/local-stack-kill.sh"
echo ""
echo "local-stack-reset: next — run Jarvis: Start Full Local Stack (or Start HUD + Start OpenClaw Gateway), then Jarvis: Doctor."
echo "local-stack-reset: CLI — pnpm local:stack:start:jarvis  and  pnpm local:stack:start:openclaw  (two terminals)"
