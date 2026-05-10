#!/usr/bin/env bash
# Narrow kill for local Jarvis HUD + OpenClaw dev (ports + known command lines only).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

kill_port_listeners() {
  local port=$1
  local pids
  pids="$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
  if [[ -n "$pids" ]]; then
    echo "local-stack-kill: SIGTERM listener(s) on TCP $port: $(echo "$pids" | tr '\n' ' ')"
    # shellcheck disable=SC2001
    echo "$pids" | xargs -n1 kill 2>/dev/null || true
  else
    echo "local-stack-kill: no TCP listener on port $port"
  fi
}

echo "local-stack-kill: repo root $REPO_ROOT"

for port in 3000 18789 19001; do
  kill_port_listeners "$port"
done

if pkill -f "run-node.mjs --dev gateway" 2>/dev/null; then
  echo "local-stack-kill: signaled processes matching run-node.mjs --dev gateway"
else
  echo "local-stack-kill: no processes matching run-node.mjs --dev gateway"
fi

if pkill -f "next dev" 2>/dev/null; then
  echo "local-stack-kill: signaled processes matching 'next dev'"
else
  echo "local-stack-kill: no processes matching 'next dev'"
fi

sleep 1

echo "local-stack-kill: remaining listeners (should be empty for stack ports):"
lsof -nP -iTCP:3000 -sTCP:LISTEN 2>/dev/null || true
lsof -nP -iTCP:18789 -sTCP:LISTEN 2>/dev/null || true
lsof -nP -iTCP:19001 -sTCP:LISTEN 2>/dev/null || true

echo "local-stack-kill: done"
