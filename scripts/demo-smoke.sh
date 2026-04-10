#!/usr/bin/env bash
# Run smoke tests and assert output matches expectations. Fail fast.
# Usage: pnpm demo:smoke
# Requires: Jarvis dev server running (pnpm demo:boot)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

source "$SCRIPT_DIR/demo-env.sh"

BASE="${JARVIS_HUD_BASE_URL:-http://localhost:3001}"
echo "[demo-smoke] BASE_URL=$BASE"
echo ""

fail() {
  echo ""
  echo "❌ Smoke failed: $1"
  echo "   Check env vars (JARVIS_INGRESS_OPENCLAW_SECRET, etc.) or server."
  exit 1
}

echo "[demo-smoke] ingress:smoke..."
out1=$(pnpm ingress:smoke 2>&1) || fail "ingress:smoke exited non-zero"
echo "$out1" | grep -q "Ingress smoke OK" || fail "missing 'Ingress smoke OK'"
echo "$out1" | grep -qi "traceId" || fail "missing traceId"
echo "$out1" | grep -q "pending" || fail "missing status: pending"
echo "✅ ingress:smoke OK"

echo ""
echo "[demo-smoke] jarvis:smoke:apply..."
out2=$(pnpm jarvis:smoke:apply 2>&1) || fail "jarvis:smoke:apply exited non-zero"
echo "$out2" | grep -q "code.apply ingress smoke OK" || fail "missing 'code.apply ingress smoke OK'"
echo "$out2" | grep -qi "traceId" || fail "missing traceId"
echo "$out2" | grep -q "pending" || fail "missing status: pending"
echo "✅ jarvis:smoke:apply OK"

# Extract traceId from the traceId line only (avoids picking "id" UUID when both present)
trace_id_line=$(echo "$out2" | grep -i "traceId" | head -1)
trace_id=$(echo "$trace_id_line" | grep -oE '[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}' | head -1)

echo ""
echo "✅ Both smokes passed. Open Jarvis UI to approve and execute."
echo ""
echo "TraceId (filter in Activity Replay):"
if [ -n "$trace_id" ]; then
  echo "  $trace_id"
else
  echo "  (could not extract — see smoke output above)"
fi
