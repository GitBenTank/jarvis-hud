#!/usr/bin/env bash
# Submit a send_email proposal via signed ingress (uses .env.local like openclaw:dev).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
eval "$(node "$ROOT/scripts/openclaw-gateway-env-from-jarvis.mjs")"
echo "POST send_email proposal → ${JARVIS_BASE_URL}"
pnpm exec tsx scripts/jarvis-submit.ts --file "$ROOT/scripts/demos/send-email-proposal.json"
echo ""
echo "Next: in Jarvis HUD → Approvals → Approve → Execute."
echo "Server needs DEMO_EMAIL_USER + DEMO_EMAIL_PASS (Gmail app password) to actually send."
