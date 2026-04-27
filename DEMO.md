# Jarvis HUD v0.1 — Control Plane Demo Runbook

**Mission:** Prove the control-plane thesis in 60 seconds.

1. Agent proposes an action (`code.apply`).
2. Jarvis validates + records it (`traceId`).
3. Human approves in the UI.
4. Jarvis executes.
5. A receipt is produced (what changed, where, outcome).
6. You can reconstruct the story from Activity Timeline/Graph.

---

## Prerequisites

- `pnpm` installed
- `JARVIS_ROOT` defaults to `~/jarvis` (events + actions stored there)
- Secret: **≥32 characters** — `scripts/demo-env.sh` uses a demo secret, or `read -s` for safety

---

## One command: Clean boot

Kills whatever is listening on 3000/3001, clears the lock, starts Jarvis with ingress.

```bash
cd ~/Documents/jarvis-hud
pnpm demo:boot
```

**Shell:** Put `cd` on its own line. In **zsh**, a trailing `# comment` on the same line as `cd` can be parsed as extra arguments (`cd: too many arguments`) if interactive comments are off—run `cd ~/Documents/jarvis-hud` alone, then `pnpm demo:boot`.

**If `demo:boot` / `pnpm dev` dies with `ENOENT` under `.next/dev`** (tmp `buildManifest`, manifests, or cache): use a **production** demo server (slower start, no dev cache writes):

```bash
cd ~/Documents/jarvis-hud
pnpm demo:start
```

**Or manually:**

```bash
cd ~/Documents/jarvis-hud
lsof -nP -iTCP:3000 -sTCP:LISTEN -t 2>/dev/null | xargs kill -9 2>/dev/null || true
lsof -nP -iTCP:3001 -sTCP:LISTEN -t 2>/dev/null | xargs kill -9 2>/dev/null || true
rm -f .next/dev/lock
source scripts/demo-env.sh
pnpm dev
```

**Expected:** `Local: http://localhost:3001` (demo-env uses PORT=3001)

---

## One command: Verify (pre-demo checklist)

Run before smoke. Curls /api/config and /api/activity/stream, asserts 200. ~5 seconds.

```bash
cd ~/Documents/jarvis-hud
pnpm demo:verify
```

**Good:** `OK: config + stream reachable`

Output also prints:
- `BASE_URL=http://localhost:<PORT>`
- `JARVIS_ROOT=<path>`

---

## One command: Smoke + assert

Creates pending proposals. Asserts both smokes pass (Ingress smoke OK, traceId, status: pending). Exits non-zero with clear message if any assertion fails.

```bash
cd ~/Documents/jarvis-hud
pnpm demo:smoke
```

**Or manually:**

```bash
cd ~/Documents/jarvis-hud
source scripts/demo-env.sh

pnpm ingress:smoke
# Expected: Ingress smoke OK, id:, traceId:, status: pending

pnpm jarvis:smoke:apply
# Expected: code.apply ingress smoke OK, id:, traceId:, status: pending
```

**Good:**
- `BASE_URL=...` printed
- `TraceId (filter in Activity Replay): <uuid>`

Use this traceId to select the trace in `/activity` → Replay.

---

## One command: Open demo pages

```bash
open http://localhost:3001
open http://localhost:3001/activity
```

(Use 3000 if you overrode `PORT` in demo-env.)

---

## Acceptance: 3× reliability test

Run once to prove the demo is boringly reliable. Terminal 1: `pnpm demo:boot`. Terminal 2 (single copy/paste):

```bash
cd ~/Documents/jarvis-hud
for i in 1 2 3; do echo "== run $i =="; pnpm demo:verify && pnpm demo:smoke || exit 1; sleep 5; done
```

**Pass:** verify prints OK (config + stream) every time; smoke prints BASE_URL and extracts a traceId every time.

**Result:** If all three runs succeed, the demo environment is considered stable and demo-ready.

---

## Demo: `send_email` (real Gmail, allowlisted recipient only)

**Recipient is fixed in code** (`devhousehsv@gmail.com` in `src/lib/send-email-constants.ts`) — demo mode; do not widen without policy review.

**Server env** (same as Integration debug “send_email env”):

- `DEMO_EMAIL_USER` — Gmail address used to authenticate SMTP  
- `DEMO_EMAIL_PASS` — [Gmail App Password](https://support.google.com/accounts/answer/185833) (spaces OK)  
- Optional: `DEMO_EMAIL_FROM`

**One command** (loads `JARVIS_*` from `.env.local`, same as `pnpm openclaw:dev`):

```bash
cd ~/Documents/jarvis-hud
pnpm demo:send-email
```

**Browser:** Approve the pending **`send_email`** proposal → **Execute**. Check the allowlisted inbox for the message and the receipt under `JARVIS_ROOT`.

---

## Recruiter-safe flow (live demo rhythm)

1. `pnpm demo:boot`
2. Open `/` and `/activity` in two tabs
3. `pnpm demo:verify` → `pnpm demo:smoke`
4. In UI: approve → type APPLY → execute
5. Show: receipt (commit hash + rollback) + Activity Replay with same trace

If you can do that twice in a row, you're demo-proof.

---

## Full demo script (copy/paste)

**Terminal 1 — Start Jarvis:**
```bash
cd ~/Documents/jarvis-hud
pnpm demo:boot
```
Wait for "Ready" / "Local: http://localhost:3001".

**Terminal 2 — Verify + create proposals:**
```bash
cd ~/Documents/jarvis-hud
pnpm demo:verify
pnpm demo:smoke
```
Expected: verify prints ✅; stage prints ✅ for each smoke. Note the traceId from smoke output.

**Browser:**
1. Open http://localhost:3001 and http://localhost:3001/activity (two tabs)
2. **Approvals** panel: see pending proposal(s)
3. **Approve** the `code.apply` proposal
4. For `code.apply`: check "I understand..." + type `APPLY`
5. **Execute**
6. See "Executed" + receipt (commit hash, rollback command)
7. In Activity tab: Mode → Replay, select the traceId from smoke output, Play or scrub

**Stale data?** If JARVIS_ROOT has old runs, filter by the traceId printed by `demo:smoke` in the Activity Replay trace selector.

---

## Receipt shape

Action log entries (receipts) live in `{JARVIS_ROOT}/actions/{YYYY-MM-DD}.jsonl`.

**code.apply receipt (one JSON line):**
```json
{
  "id": "uuid",
  "traceId": "uuid",
  "at": "2026-03-05T20:00:00.000Z",
  "kind": "code.apply",
  "approvalId": "uuid",
  "status": "executed",
  "summary": "...",
  "outputPath": "/path/to/bundle",
  "commitHash": "abc1234",
  "rollbackCommand": "git revert abc1234",
  "noChangesApplied": false,
  "filesChanged": ["src/..."],
  "statsJson": { "filesChangedCount": 1, "insertions": 5, "deletions": 2 },
  "repoHeadBefore": "...",
  "repoHeadAfter": "..."
}
```

**Where receipts are written:**
- `src/lib/action-log.ts` — `appendActionLog()` → `{JARVIS_ROOT}/actions/{date}.jsonl`
- `src/app/api/execute/[approvalId]/route.ts` — calls `appendActionLog` after each execution

---

## If it fails: Failure = action

| Failure | Action |
|---------|--------|
| **verify:** `/api/config` non-200 | Server not ready or wrong BASE_URL/PORT. Wait for boot or check `scripts/demo-env.sh`. |
| **verify:** `/api/activity/stream` 404 | Stale dev server or build mismatch. Run `pnpm demo:boot`. |
| **next dev:** `ENOENT` / `_buildManifest.js.tmp` under `.next/dev` | Often flaky dev writes (e.g. cloud-synced `Documents`). Run `pnpm demo:start` or move the repo to a non-synced path. |
| **OpenClaw:** `Unknown module type: copy` (rolldown / tsdown) | Your **working** OpenClaw checkout toolchain is out of sync. For demos use a **clean** runtime clone: `OPENCLAW_ROOT=~/Documents/openclaw-runtime pnpm openclaw:dev` (see `docs/setup/local-stack-startup.md`). |
| **smoke:** cannot extract traceId | Smoke output format changed. Update regex in `scripts/demo-smoke.sh`. |
| **Secret / env** | Run `pnpm jarvis:doctor`. Set `JARVIS_INGRESS_OPENCLAW_SECRET` (≥32 chars). Restart dev. |

---

## Safe secret (no shell history)

```bash
read -s JARVIS_INGRESS_OPENCLAW_SECRET
export JARVIS_INGRESS_OPENCLAW_SECRET
export JARVIS_INGRESS_OPENCLAW_ENABLED=true
export JARVIS_INGRESS_ALLOWLIST_CONNECTORS=openclaw
export JARVIS_HUD_BASE_URL="http://localhost:3001"
```
