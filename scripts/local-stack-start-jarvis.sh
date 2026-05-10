#!/usr/bin/env bash
# Start Next dev server from jarvis-hud (repo root from script path).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$REPO_ROOT"
echo "local-stack-start-jarvis: repo $REPO_ROOT"
echo "local-stack-start-jarvis: http://127.0.0.1:3000 (default)"
echo "local-stack-start-jarvis: when stable, run: pnpm local:stack:doctor"
exec pnpm dev
