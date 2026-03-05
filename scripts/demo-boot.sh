#!/usr/bin/env bash
# Clean boot: kill whatever is on 3000/3001, clear lock, start Jarvis with ingress.
# Usage: pnpm demo:boot
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

# Kill whatever is listening on 3000 and 3001
for port in 3000 3001; do
  pids=$(lsof -nP -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo "[demo-boot] Killing process on port $port (PIDs: $pids)"
    echo "$pids" | xargs kill -9 2>/dev/null || true
  fi
done
sleep 1

# Clear dev lock
rm -f .next/dev/lock

# Load demo env
source "$SCRIPT_DIR/demo-env.sh"

# Start dev
echo "[demo-boot] Starting Jarvis on port $PORT..."
exec pnpm dev
