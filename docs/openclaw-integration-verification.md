# OpenClaw → Jarvis HUD Integration Verification (Handoff Protocol)

This doc is the deterministic runbook to verify OpenClaw → Jarvis HUD ingress works end-to-end, without guesswork.

**Verified:** OpenClaw → Jarvis ingress → approval → execution → receipt flow is working. Smoke test (`pnpm jarvis:smoke` from OpenClaw) produces pending proposals; human approves and executes in Jarvis UI; receipts written to `~/jarvis/actions/YYYY-MM-DD.jsonl`.

**Operator checklist (mental model + daily order-of-operations):** [OpenClaw ↔ Jarvis operator checklist](setup/openclaw-jarvis-operator-checklist.md).

**Ingress in plain language (proposals vs approval vs execute):** [OpenClaw ingress for humans](setup/openclaw-ingress-for-humans.md).

**Documentation hub (which file when):** [docs/README.md](README.md).

## Phase 1 blessed deployment (normative)

**Contract:** [Operating assumptions §1](strategy/operating-assumptions.md#1-canonical-openclaw-deployment-for-this-project). **Setup routine:** [Local stack startup](setup/local-stack-startup.md). **Capture ground truth:** [Phase 1 freeze checklist](setup/phase1-freeze-checklist.md).

| Piece | Blessed choice |
|--------|----------------|
| **Jarvis HUD** | This repo; **`pnpm dev`** (default **http://127.0.0.1:3000**) or **`pnpm dev:port`**; **127.0.0.1** in `.env.local` for base URL |
| **OpenClaw** | **Clean** checkout **`~/Documents/openclaw-runtime`**; **`OPENCLAW_STATE_DIR=$HOME/.openclaw-dev`**; **`OPENCLAW_ROOT=~/Documents/openclaw-runtime pnpm openclaw:dev`** from jarvis-hud (hacking clone **`~/Documents/openclaw`** = omit **`OPENCLAW_ROOT`**) |
| **Homebrew / LaunchAgent gateway** | **Off** for this flow (avoid duplicate listeners) |
| **Control UI** | **`OPENCLAW_CONTROL_UI_URL`** in `.env.local` matches the live gateway origin |
| **Ingress** | **`POST {base}/api/ingress/openclaw`**; secret + allowlist in `.env.local` (≥32 chars) |
| **Machine pass/fail** | **`pnpm machine-wired`** (with Jarvis + gateway running) |

Everything below that documents **mixed state dirs**, **Homebrew-only**, or **recovery** still applies when **debugging** or **migrating** — it is not an alternate blessed path for Phase 1.

**Phase 2 (auth / human authority):** [Operating assumptions §2](strategy/operating-assumptions.md#2-auth-and-step-up-jarvis) · **`pnpm auth-posture`**.

## OpenClaw config directory (macOS gateway / dashboard)

**Dashboard setup (step-by-step):** [OpenClaw Control UI setup](setup/openclaw-control-ui.md) — includes **version alignment** when the CLI warns the config was written by a newer OpenClaw.

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

### Homebrew-only gateway (Option A)

Use this when **`lsof`** / **`ps`** show the listener on **`18789`** is **`openclaw-gateway`** with paths under **`/opt/homebrew/lib/node_modules/openclaw/`** (global/Homebrew install), not `~/Documents/openclaw`.

| Rule | Why |
|------|-----|
| **One gateway** | Do not also run `pnpm gateway:dev` from a git checkout on the same port — only one process should own **`18789`**. |
| **State dir = `~/.openclaw`** | The Homebrew/service gateway uses the **default** state directory unless you changed **`OPENCLAW_STATE_DIR`** in the service’s environment. Use **`openclaw dashboard`** (and CLI) **without** setting `OPENCLAW_STATE_DIR` to `~/.openclaw-dev`, or tokens and URLs will not match the running process. |
| **Env on the running process** | Set **`OPENAI_API_KEY`** (or use the **Codex/OAuth** model route your build documents), **`JARVIS_BASE_URL`** (e.g. `http://127.0.0.1:3000`), and **`JARVIS_INGRESS_OPENCLAW_SECRET`** (same string as Jarvis, ≥32 chars) in **OpenClaw Control → Settings → Config → Environment** (or the env file your install reads under **`~/.openclaw`** — follow upstream docs). Editing only **`~/Documents/openclaw`** does **not** change this binary. |
| **Restart after env changes** | Restart the gateway the same way it is installed (e.g. **`brew services restart …`**, LaunchAgent reload, or your documented **`openclaw gateway`** command — exact name varies by install). |

**Identify the live binary (optional):**

```bash
lsof -nP -iTCP:18789 -sTCP:LISTEN
ps -p <PID> -ww -o args=
lsof -p <PID> | grep -E 'cwd|txt'
```

Replace `<PID>` with the PID from `lsof`. Paths under **`/opt/homebrew/lib/node_modules/openclaw`** confirm Homebrew/global.

### OpenAI & Codex: recovery checklist (local debugging)

Use this when logs show **mixed** paths (`~/Documents/openclaw/dist` vs `/opt/homebrew/.../openclaw`), **no API key**, **`refresh_token_reused`**, or **quota exceeded**.

| Symptom | Cause | Fix |
|--------|--------|-----|
| **`No API key found for provider "openai"`** while using **`openai/gpt-5.4`** | `OPENAI_API_KEY` is not in the **runtime environment** of the gateway that is actually running, or you’re editing **Config → Environment** for **`~/.openclaw`** while **`pnpm gateway:dev`** uses **`~/.openclaw-dev`**. | Run **only one** gateway. Set **`OPENAI_API_KEY`** in **Config → Environment** for the **same** state dir as that process (for dev: open Control with `OPENCLAW_STATE_DIR="$HOME/.openclaw-dev"` when editing, or set env under **`.openclaw-dev`** per upstream docs). **Restart** the gateway. |
| **`Use openai-codex/gpt-5.4 (OAuth) or set OPENAI_API_KEY`** | Default model is **`openai/gpt-5.4`** (API key) but you only have **Codex OAuth**, or vice versa. | Either set **`OPENAI_API_KEY`**, **or** set **Agent defaults → Model** `primary` to **`openai-codex/gpt-5.4`**, **or** pick **`openai/gpt-4o-mini`** for cheap API-key tests. |
| **`refresh_token_reused` / Codex token refresh 401** | Two gateways or clients raced OAuth refresh; session invalidated. | **Sign out** of OpenAI Codex in OpenClaw (**Settings → Authentication** or equivalent), **sign in once**. Stop duplicate gateways so only one process refreshes tokens. |
| **`You exceeded your current quota`** on **`gpt-4o-mini`** | OpenAI account/key has no usable quota (billing, limits, wrong project). | Fix **billing / usage limits** in OpenAI for the **same** project as the API key; create a new key under the funded project if needed. |

**Rule of thumb:** **Config → Environment** and **AI & Agents** apply to the **state directory** of the gateway you started. If **`pnpm gateway:dev`** uses **`~/.openclaw-dev`**, a Control UI session tied only to **`~/.openclaw`** will **not** update the dev gateway’s env.

## Default local flow (same as [local stack startup](setup/local-stack-startup.md))

**Terminal 1 — Jarvis**

```bash
cd ~/Documents/jarvis-hud
pnpm dev
```

**Terminal 2 — OpenClaw**

```bash
cd ~/Documents/jarvis-hud
OPENCLAW_ROOT=~/Documents/openclaw-runtime pnpm openclaw:dev
```

**Verify**

```bash
cd ~/Documents/jarvis-hud
pnpm local:stack:doctor
curl -sS http://127.0.0.1:3000/api/config | head -c 120; echo
```

**Smoke from OpenClaw checkout** (optional): `export JARVIS_BASE_URL=http://127.0.0.1:3000` and match **`JARVIS_INGRESS_OPENCLAW_SECRET`** to **`.env.local`**, then **`pnpm jarvis:smoke`**.

## Optional — Scripted demo on 3001 ([DEMO.md](../DEMO.md))

Source **`scripts/demo-env.sh`** in terminals that run **`pnpm demo:boot`**, **`pnpm demo:verify`**, **`pnpm demo:smoke`** so **`PORT`** and base URLs stay aligned. Do **not** mix **3000** `pnpm dev` with **3001** smoke env without updating **`JARVIS_HUD_BASE_URL`**.

**401 after smoke?** Allowlist / connector mismatch (`source.connector` must be `"openclaw"`), wrong secret, or Jarvis started without ingress env in **`.env.local`** — fix and restart **`pnpm dev`**.

### Troubleshooting 401 on port 3001 only (`demo-env.sh` / [DEMO.md](../DEMO.md))

```bash
cd ~/Documents/jarvis-hud
PORT=3001 \
JARVIS_INGRESS_OPENCLAW_ENABLED=true \
JARVIS_INGRESS_OPENCLAW_SECRET="openclaw-jarvis-demo-secret-minimum-32chars" \
JARVIS_INGRESS_ALLOWLIST_CONNECTORS="openclaw" \
pnpm dev:port
```

Then OpenClaw smoke (inline env):

```bash
cd ~/Documents/openclaw-runtime   # or your OpenClaw clone
JARVIS_BASE_URL="http://127.0.0.1:3001" \
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

1. **`~/.openclaw/.env`** — Set `JARVIS_BASE_URL=http://127.0.0.1:3001` (Jarvis demo uses port 3001; use 127.0.0.1 for origin alignment).
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

- Jarvis HUD running with **OpenClaw ingress enabled** (usually via `.env.local` — [environment](setup/env.md)).
- **One** live Jarvis origin for the session — **`127.0.0.1:3000`** (`pnpm dev`) is standard; **`3001`** is common for demo / `demo:boot` ([local dev truth map](setup/local-dev-truth-map.md)).
- OpenClaw checkout with **`pnpm jarvis:smoke`** (blessed clone: **`~/Documents/openclaw-runtime`** per [local stack startup](setup/local-stack-startup.md)).

### Executable checklist (do this first)

Follow the numbered steps in **[Local verification: OpenClaw → Jarvis HUD](local-verification-openclaw-jarvis.md)** — hard reset, gateway, Control UI, Jarvis, Alfred JSON, ingress, final truth test. That doc stays **short and ordered**; this file keeps **protocol detail** (below).

**Phase 1 wiring proof:** with both processes up, from jarvis-hud: **`pnpm machine-wired`**

**Jarvis env sanity:** **`JARVIS_HUD_BASE_URL=<live origin> pnpm jarvis:doctor`** (must match the URL bar / listening port).

### OpenClaw → Jarvis smoke (minimal)

From your **OpenClaw** repo (clone must match the gateway you run):

```bash
JARVIS_BASE_URL="http://127.0.0.1:3000"   # or :3001 — must match live HUD
JARVIS_INGRESS_OPENCLAW_SECRET="…"       # same value as Jarvis
pnpm jarvis:smoke
```

**Want:** `ok: true`, `id`, `traceId`, `status: pending`. No secrets or raw body in logs.

**Without putting the secret in shell history:** from jarvis-hud, **`pnpm ingress:smoke`** / **`pnpm jarvis:smoke:apply`** (same env alignment). If either fails:

| Check | Command |
|-------|---------|
| A) Jarvis reachable? | `curl -I "$JARVIS_HUD_BASE_URL"` |
| B) Secret mismatch? | Restart dev server after env changes; 401/403 usually means wrong secret or wrong HUD instance |
| C) Wrong base URL? | `JARVIS_HUD_BASE_URL` vs OpenClaw `JARVIS_BASE_URL` must be the **same origin** |

**Full CI-style OpenClaw build** (`pnpm typecheck` / `pnpm build`) is only needed when debugging OpenClaw itself — daily ingress proof is smoke + UI approval path above.

### Approve → execute in the HUD

In **Approvals**: pending row shows **OpenClaw (verified)** and **ingress passed** → **Approve** → for `code.apply`, confirm **`APPLY`** → **Execute** → confirm trace + receipts. Step-by-step: [Local verification — final truth test](local-verification-openclaw-jarvis.md).

---

## Troubleshooting by HTTP Status

### 403 — Ingress disabled / not allowlisted

**Causes:**

- Jarvis dev server didn't start with ingress env vars
- Allowlist missing openclaw
- OpenClaw posting to wrong base URL/port

**Fix:**

- Run `pnpm jarvis:doctor` against the same base URL OpenClaw uses
- Restart Jarvis with ingress env vars (see [environment](setup/env.md) and [local verification](local-verification-openclaw-jarvis.md))
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
