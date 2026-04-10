# OpenClaw → Jarvis HUD Integration Verification (Handoff Protocol)

This doc is the deterministic runbook to verify OpenClaw → Jarvis HUD ingress works end-to-end, without guesswork.

**Verified:** OpenClaw → Jarvis ingress → approval → execution → receipt flow is working. Smoke test (`pnpm jarvis:smoke` from OpenClaw) produces pending proposals; human approves and executes in Jarvis UI; receipts written to `~/jarvis/actions/YYYY-MM-DD.jsonl`.

## OpenClaw config directory (macOS gateway / dashboard)

**Important:** A **LaunchAgent-installed** OpenClaw gateway (e.g. Homebrew + `gateway install`) runs with the **default state directory** **`~/.openclaw`** unless you set **`OPENCLAW_STATE_DIR`** in the agent’s plist. It does **not** automatically use **`~/.openclaw-dev`**.

- Mixing **`OPENCLAW_STATE_DIR="$HOME/.openclaw-dev"`** in terminal commands with a service that still reads **`~/.openclaw`** causes confusing failures: e.g. **connection refused** on the dashboard port (gateway never bound because config was invalid for the process that launchd kept restarting) or **token mismatch** (dashboard URL generated from a different `openclaw.json` than the running gateway).
- The config the service actually reads must include **`gateway.mode`** (e.g. **`"local"`**). Newer OpenClaw builds refuse to start the gateway without it.

**Pick one model and stay consistent:**

1. **Service = default state** — Background gateway uses **`~/.openclaw`**. Use **`openclaw dashboard`** without `OPENCLAW_STATE_DIR` so the URL matches the listener. Reserve **`~/.openclaw-dev`** for manual dev runs only (e.g. `OPENCLAW_STATE_DIR=... pnpm gateway:dev` from your fork).
2. **Service = dev state** — Set **`OPENCLAW_STATE_DIR`** to **`~/.openclaw-dev`** in the LaunchAgent environment, reload the agent, and always generate dashboard URLs with that same env.

**Optional shell helpers** (make the split explicit; adjust the `openclaw` command if yours is not on `PATH`):

```bash
alias oc-dev='OPENCLAW_STATE_DIR="$HOME/.openclaw-dev" openclaw'
alias oc-prod='env -u OPENCLAW_STATE_DIR openclaw'
```

**Security:** Avoid long-lived API keys or ingress secrets in the LaunchAgent plist; prefer env files or the keychain, and rotate anything that was ever embedded in plist or shared URLs.

## Demo flow (video prep)

**Secret lock:** Source `scripts/demo-env.sh` in both terminals so nothing can drift.

**Terminal 1 (Jarvis):**
```bash
cd ~/Documents/jarvis-hud
source scripts/demo-env.sh
killall node 2>/dev/null || true
node -e 'console.log("Jarvis secret len:", process.env.JARVIS_INGRESS_OPENCLAW_SECRET?.length, "PORT:", process.env.PORT)'
pnpm dev:port
```

**Terminal 2 (OpenClaw):**
```bash
cd ~/Documents/openclaw
source scripts/demo-env.sh
node -e 'console.log("OpenClaw secret len:", process.env.JARVIS_INGRESS_OPENCLAW_SECRET?.length, "base:", process.env.JARVIS_BASE_URL)'
curl -s "$JARVIS_BASE_URL/api/config" | head -c 120; echo
pnpm jarvis:smoke
```

If the curl doesn't return JSON-ish immediately, you're not talking to the Jarvis you think you are.

**401 after this?** Almost certainly allowlist connector mismatch (`source.connector` must be `"openclaw"`) or the Jarvis process was started earlier without the demo env—restart and retry.

### Fastest fix when 401 persists: inline env

Don't rely on `source`; start Jarvis with inline env so the process gets the exact vars:

```bash
cd ~/Documents/jarvis-hud
killall node 2>/dev/null || true

PORT=3001 \
JARVIS_INGRESS_OPENCLAW_ENABLED=true \
JARVIS_INGRESS_OPENCLAW_SECRET="openclaw-jarvis-demo-secret-minimum-32chars" \
JARVIS_INGRESS_ALLOWLIST_CONNECTORS="openclaw" \
pnpm dev:port
```

Then OpenClaw smoke (inline env):

```bash
cd ~/Documents/openclaw
JARVIS_BASE_URL="http://localhost:3001" \
JARVIS_INGRESS_OPENCLAW_SECRET="openclaw-jarvis-demo-secret-minimum-32chars" \
pnpm jarvis:smoke
```

If that still 401s, it's no longer "env not loaded"—it's signing/bytes/headers.

### Prove the running Jarvis process has the env (optional)

```bash
PID=$(lsof -tiTCP:3001 -sTCP:LISTEN)
echo "PID=$PID"
ps eww -p "$PID" 2>/dev/null | tr ' ' '\n' | grep -E 'JARVIS_INGRESS_OPENCLAW|JARVIS_INGRESS_ALLOWLIST|PORT' || echo "(vars not visible)"
```

### Diagnose 401 with debug + local verify

1. Run smoke with debug: `JARVIS_DEBUG=1 pnpm jarvis:smoke` (after sourcing demo-env). Note timestamp, nonce, rawBodyLen, sig prefix/suffix.

2. Run Jarvis verify with same values:
   ```bash
   cd ~/Documents/jarvis-hud
   source scripts/demo-env.sh
   TIMESTAMP="..." NONCE="..." RAW_BODY='{"kind":"system.note",...}' JARVIS_INGRESS_OPENCLAW_SECRET="..." node scripts/verify-ingress-signature.mjs
   ```
   - If verifier matches: body bytes are changing between signing and verification.
   - If it doesn't match: secret mismatch or wrong Jarvis instance.

### Telegram proof run (optional)

For Telegram conversational chat, use `pnpm dev` (channels enabled). **Do not use** `pnpm gateway:dev` — it sets `OPENCLAW_SKIP_CHANNELS=1` and Telegram won't receive updates.

```bash
cd ~/Documents/openclaw
pkill -f openclaw || true
pnpm dev
```

Then DM the bot: `/start` → `pair` → `ping`. Expect inbound logs for each message.

| Log outcome | Cause | Next step |
|-------------|-------|-----------|
| Nothing | Bot not receiving (token, channels, webhook/polling) | Paste first ~30 lines of startup logs (redact tokens) |
| Inbound logs, no reply | Pairing / allowlist / agent binding | Complete pairing, add `allowFrom` or `agents.list` bound to telegram |

Even without reply, you can film: Telegram inbound → OpenClaw logs → proposal to Jarvis → approve → receipts.

### Live Gateway chat (jarvis-hud skill)

If the agent says it doesn't have the "jarvis" skill:

1. **`~/.openclaw/.env`** — Set `JARVIS_BASE_URL=http://localhost:3001` (Jarvis demo uses port 3001).
2. **Plugin id** — The extension is `jarvis-hud`, not `jarvis`. In `~/.openclaw/openclaw.json`, ensure `plugins.entries.jarvis-hud.enabled: true` and that `plugins.installs.jarvis-hud` points to the extension.
3. **Prompt phrasing** — Ask to "use the jarvis-hud skill" or "propose a system note to Jarvis HUD" so the agent invokes `jarvis_propose_system_note`.
4. **Restart** — After config or env changes, restart the OpenClaw Gateway.

---

## Goal

Prove:

1. OpenClaw can **sign + POST** to `POST /api/ingress/openclaw`
2. Jarvis HUD **accepts ingress**, writes a **pending** proposal only
3. Human can **Approve → Execute** in Jarvis
4. Jarvis produces **receipts** (bundle + action log) and **trace** is reconstructable

## Non-Goals

- No auto-approval
- No auto-execution
- No push-to-remote
- No background orchestration

This is strictly "proposal ingress → human gate → deterministic execution".

---

## Threat model

Jarvis HUD assumes the following threats and mitigations:

| Threat | Mitigation |
|--------|------------|
| Agents hallucinate or misinterpret intent | Human approval before execution; proposals are reviewed, not auto-applied |
| Prompt injection / malicious inputs | HMAC-signed ingress; connector allowlist; kind allowlist; nonce replay protection |
| Connector compromise (secret leaked) | Rotate secret; nonce + timestamp limits; rate limiting |
| Irreversible action risk (e.g. `code.apply`) | Human gate; clean worktree check; patch size limits; reject binary blobs; git-based apply with receipts |
| Lack of auditable trail | Every execution produces receipts (manifest, patch, action log); commit trailers with trace/approval IDs |
| Unauthorized execution | Optional auth + step-up; approval ≠ execution; policy blocks at execute time |

Core principle: **the model is never a trusted principal**. Execution authority originates with the human.

---

## Proposal lifecycle

Proposals move through explicit statuses. UI and trace timeline reflect these transitions.

| Status | Meaning |
|--------|---------|
| `proposed` | Ingested; not yet validated |
| `validated` | Validation passed (if applicable) |
| `pending_approval` | Awaiting human approval |
| `approved` | Approved; awaiting execution |
| `executing` | Execution in progress |
| `executed` | Execution completed; receipts written |
| `rejected` | Human denied |
| `failed` | Execution attempted but failed |
| `archived` | Archived (future use) |

**Transitions:**

- Ingress → `pending_approval` (with `createdAt`)
- Approve → `approved` (with `approvedAt`)
- Deny → `rejected` (with `rejectedAt`)
- Execute start → `executing`
- Execute success → `executed` (with `executedAt`)
- Execute error → `failed` (with `failedAt`)

Legacy events without `proposalStatus` are normalized at read time from `status`, `executed`, etc.

---

## Preconditions

- Jarvis HUD is running locally with **OpenClaw ingress enabled**
- Jarvis is bound to a known port (recommend **3001** to avoid conflicts)
- OpenClaw has the Jarvis extension/tool wired and a smoke command (`pnpm jarvis:smoke`)

---

## Step 0 — Start Jarvis HUD with ingress enabled (clean port)

In the **jarvis-hud** repo:

```bash
# Stop stray dev servers (macOS)
killall node 2>/dev/null || true

JARVIS_INGRESS_OPENCLAW_ENABLED=true \
JARVIS_INGRESS_OPENCLAW_SECRET="your-32-char-secret-min-32" \
JARVIS_INGRESS_ALLOWLIST_CONNECTORS=openclaw \
PORT=3001 pnpm dev:port
```

Expected output includes:

- Local: http://localhost:3001

Open the UI: http://localhost:3001

---

## Step 1 — Jarvis Doctor (proves server env is correct)

In a second terminal (still jarvis-hud):

```bash
JARVIS_HUD_BASE_URL="http://localhost:3001" pnpm jarvis:doctor
```

Expected:

- ✅ Ingress enabled
- ✅ Secret present and length >= 32 (never prints secret)
- ✅ Allowlist includes openclaw
- ✅ Server config matches env (no "restart server with env" warning)

If doctor says "server needs same env", restart Jarvis with the vars in Step 0.

---

## Step 2 — Build OpenClaw (ensure clean baseline)

In the openclaw repo:

```bash
pnpm install
pnpm typecheck
pnpm build
```

If typecheck fails, stop here and fix it before running smoke.

When requesting help, capture:

- The command you ran
- The first error block (don't paste giant logs)
- `node -v` and `pnpm -v`

---

## Step 3 — Run OpenClaw → Jarvis smoke (proposes a system.note)

In openclaw repo:

```bash
JARVIS_BASE_URL="http://localhost:3001" \
JARVIS_INGRESS_OPENCLAW_SECRET="your-32-char-secret-min-32" \
pnpm jarvis:smoke
```

Expected success output:

- `ok: true`
- `id: <uuid>`
- `traceId: <uuid>`
- `status: pending`

No secrets or raw request body should be logged.

### Safe smoke (no secret in shell history)

Run from jarvis-hud. Prompt for secret once so it doesn't get saved in scrollback:

```bash
read -s JARVIS_INGRESS_OPENCLAW_SECRET; echo
export JARVIS_INGRESS_OPENCLAW_SECRET
export JARVIS_HUD_BASE_URL="http://localhost:3001"

cd ~/Documents/jarvis-hud
pnpm ingress:smoke
pnpm jarvis:smoke:apply
```

If either smoke fails, triage:

| Check | Command |
|-------|---------|
| A) Jarvis reachable? | `curl -I http://localhost:3001` |
| B) Secret mismatch? | Restart dev server after exporting env; 401/403 usually means wrong secret or server not reading env |
| C) Wrong base URL? | Jarvis HUD scripts use `JARVIS_HUD_BASE_URL`; OpenClaw may use `JARVIS_BASE_URL` |
| D) Expected | Both smokes report `status: pending` — approval/apply is the next step |

---

## Step 4 — Verify in Jarvis UI

In Jarvis UI (Approvals panel):

- Find the newly created pending event
- Confirm badges:
  - OpenClaw (verified)
  - Ingress: passed

Then:

1. Approve
2. For `code.apply`: complete the irreversible confirmation (checkbox + type `APPLY`)
3. Execute
4. Verify:
   - Action log entry exists
   - Bundle path exists (artifact output path)
   - Trace timeline shows the event and receipt linkage

---

## Troubleshooting by HTTP Status

### 403 — Ingress disabled / not allowlisted

**Causes:**

- Jarvis dev server didn't start with ingress env vars
- Allowlist missing openclaw
- OpenClaw posting to wrong base URL/port

**Fix:**

- Run `pnpm jarvis:doctor` against the same base URL OpenClaw uses
- Restart Jarvis with Step 0 env vars
- Confirm `JARVIS_BASE_URL`

### 401 — Signature/timestamp invalid

**Causes:**

- Secret mismatch (Jarvis secret ≠ OpenClaw secret)
- Clock skew (rare locally; check system time)
- Body signed differs from body sent (must `JSON.stringify` once, no mutations)

**Fix:**

- Ensure OpenClaw signs exactly: `${timestamp}.${nonce}.${rawBody}`
- Ensure HMAC-SHA256 hex digest (`digest("hex")`)
- Ensure rawBody is the exact POST body string

**Debug (no secrets leaked):**

1. OpenClaw: `JARVIS_DEBUG=1 JARVIS_INGRESS_OPENCLAW_SECRET=... pnpm jarvis:smoke` → prints secretLen, timestamp, nonce, rawBodyLen, messageLen, sig prefix/suffix
2. Both sides: `node -e 'console.log("len=", process.env.JARVIS_INGRESS_OPENCLAW_SECRET?.length)'` (run in each env) → lengths must match
3. Jarvis verify locally: `TIMESTAMP=... NONCE=... RAW_BODY='...' JARVIS_INGRESS_OPENCLAW_SECRET=... node scripts/verify-ingress-signature.mjs` (in jarvis-hud)

### 409 — Nonce replay

**Causes:**

- Nonce reused (should be `crypto.randomUUID()` each request)
- Request retried with same headers

**Fix:**

- Generate a new nonce per call
- Don't reuse the same request object

### 429 — Rate limited

**Cause:**

- Too many requests per IP in 60 seconds

**Fix:**

- Wait 60 seconds
- Reduce retries

---

## What to paste back for help

Paste either:

1. First failing block from `pnpm typecheck`, or
2. Full output of `pnpm jarvis:smoke`

Plus:

```
node -v
pnpm -v
```

---

## Validation

Ingress validation defaults ON unless `JARVIS_INGRESS_OPENCLAW_VALIDATE=false`. When ON, the ingress route validates proposal payloads before writing:

- **Required fields:** `kind`, `title`, `summary`, `source.connector` (must be `"openclaw"`)
- **Size limits:** raw body ≤ 1 MB; title ≤ 120 chars; summary ≤ 500 chars; `patch` ≤ 1 MB (when present)
- **Allowed kinds:** Must be in the execution allowlist (see policy)
- **Patch sanity:** For `code.apply`/`code.diff`, patch must contain `diff --git` or `--- ` and `+++ `; must not contain binary markers (`GIT binary patch`, `literal `) or null bytes
- **Unknown keys:** Rejects top-level keys not in the allowlist

**HTTP status codes:**

| Condition                  | Status |
|---------------------------|--------|
| Validation fail (bad_request) | 400 |
| Body or patch too large   | 413 |
| Kind not in allowlist      | 422 |

To bypass validation for demos, set `JARVIS_INGRESS_OPENCLAW_VALIDATE=false`. HMAC and auth remain enforced.

---

## Irreversible action confirmation

For high-risk kinds (e.g. `code.apply`), the UI enforces an extra confirmation step between **Approve** and **Execute**:

1. **Approve** — changes status only
2. **Confirm** — checkbox “I understand this will modify a repo” + type `APPLY` in the input
3. **Execute** — only enabled when confirmation is complete

This is UI-only; the execute API is unchanged. Set `JARVIS_UI_CONFIRM_IRREVERSIBLE=false` to skip the confirmation step (Execute behaves as before).

---

## Definition of "Integration Verified"

Integration is verified when:

- `pnpm jarvis:smoke` returns `{ ok: true, id, traceId, status: "pending" }`
- Jarvis UI shows the pending event with OpenClaw verified / ingress passed badges
- Approve → Execute produces receipts and trace linkage
