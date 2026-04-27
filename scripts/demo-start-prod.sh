#!/usr/bin/env bash
# Production-mode demo server: avoids next dev writing under .next/dev (helps when
# dev crashes with ENOENT on _buildManifest / cache tmp files, e.g. synced folders).
# Usage: pnpm demo:start
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

for port in 3000 3001; do
  pids=$(lsof -nP -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo "[demo-start] Killing process on port $port (PIDs: $pids)"
    echo "$pids" | xargs kill -9 2>/dev/null || true
  fi
done
sleep 1

source "$SCRIPT_DIR/demo-env.sh"

echo "[demo-start] Building (production) …"
pnpm build
echo "[demo-start] Starting next start on port $PORT (127.0.0.1) …"
exec pnpm exec next start -H 127.0.0.1 -p "$PORT"
