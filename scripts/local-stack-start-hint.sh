#!/usr/bin/env bash
# Print how to start the full stack (pnpm local:stack:start is informational only).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "local-stack-start: repo $REPO_ROOT"
echo "local-stack-start: use two terminals or Cursor tasks:"
echo "  - pnpm local:stack:start:jarvis"
echo "  - pnpm local:stack:start:openclaw"
echo "Or: Command Palette → Tasks: Run Task → Jarvis: Start Full Local Stack"
echo "Then: pnpm local:stack:doctor"
