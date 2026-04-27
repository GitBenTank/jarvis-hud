#!/usr/bin/env bash
# Pre-demo checklist: verify server is reachable and endpoints return 200.
# Usage: pnpm demo:verify
# Requires: Jarvis running (pnpm demo:boot or pnpm demo:start)
# Retries up to 15 times (30s) to handle startup race.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

source "$SCRIPT_DIR/demo-env.sh"

BASE="${JARVIS_HUD_BASE_URL:-http://localhost:3001}"
ROOT="${JARVIS_ROOT:-$HOME/jarvis}"
PORT="${PORT:-3001}"

fail() {
  echo "❌ $1"
  exit 1
}

echo "[demo-verify] Checking $BASE (retry up to 30s) ..."
echo ""

# Wait for /api/config to return 200 (handles startup race)
for i in $(seq 1 15); do
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/config" 2>/dev/null || echo "000")
  if [ "$code" = "200" ]; then
    break
  fi
  if [ "$i" -eq 15 ]; then
    fail "/api/config returned $code after 15 retries. Is Jarvis running? Run pnpm demo:boot."
  fi
  sleep 2
done
echo "✅ /api/config → 200"

# /api/activity/stream
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/activity/stream" 2>/dev/null || echo "000")
[ "$code" = "200" ] || fail "/api/activity/stream returned $code (expected 200). Stale dev server? Restart with pnpm demo:boot."
echo "✅ /api/activity/stream → 200"

echo ""
echo "─────────────────────────────────────────"
echo "Single source of truth:"
echo "  BASE_URL=$BASE"
echo "  JARVIS_ROOT=$ROOT"
echo "  OK: config + stream reachable"
echo "─────────────────────────────────────────"
echo ""
echo "✅ Demo verify passed. Run pnpm demo:smoke next."
