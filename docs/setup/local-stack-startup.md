# Local stack startup — Jarvis HUD + OpenClaw (locked-in flow)

Use this as the **single** routine for daily development. It avoids the common failure modes: **two gateways**, **mixed state directories**, and **Jarvis env pointing at the wrong Control UI port**.

**TL;DR (this repo):** Terminal A — `pnpm dev` · Terminal B — `pnpm openclaw:dev` (loads `JARVIS_BASE_URL` / ingress secret / `OPENAI_API_KEY` from `.env.local`) · check — `pnpm local:stack:doctor`.

**Related:** [OpenClaw Control UI](openclaw-control-ui.md) (deep setup) · [OpenClaw integration verification](../openclaw-integration-verification.md) · [Operator checklist](openclaw-jarvis-operator-checklist.md).

---

## Best flow to use (pick this)

**Use:** OpenClaw from a **local git checkout** (`~/Documents/openclaw` or your clone) + **`OPENCLAW_STATE_DIR=$HOME/.openclaw-dev`** + **`pnpm gateway:dev`**, and **Jarvis HUD** with **`pnpm dev`**.

**Do not also run** the **Homebrew** OpenClaw gateway (or any second LaunchAgent) while developing — that is what produced **wrong ports**, **connection refused**, and **`Missing config`** lines from **`/opt/homebrew/...`** while the real UI was on **19001** from the checkout.

**Jarvis:** keep **`OPENCLAW_CONTROL_UI_URL`** equal to whatever origin **`pnpm gateway:dev`** actually binds (often **`http://127.0.0.1:19001`** on your machine; confirm with **`pnpm local:stack:doctor`**).

Homebrew-only OpenClaw is fine for **other** workflows; for **Jarvis HUD + signed ingress + Control UI** day-to-day, the checkout flow above is the one to lock in.

---

## Canonical choice (recommended)

| Piece | What you run |
|--------|----------------|
| **Jarvis HUD** | This repo: `pnpm dev` (listens on **127.0.0.1:3000** by default). |
| **OpenClaw gateway** | Your **git checkout** (e.g. `~/Documents/openclaw`): `pnpm gateway:dev` with a **fixed** `OPENCLAW_STATE_DIR`. |
| **Homebrew / LaunchAgent `openclaw`** | **Off** for this flow — or you will get duplicate listeners, `Missing config` spam from `/opt/homebrew/...`, and wrong tokens. |

**State directory:** Pick **one** and never mix CLI vs gateway:

- Dev profile (matches typical `agent:dev:main` / `~/.openclaw-dev` paths):  
  `export OPENCLAW_STATE_DIR="$HOME/.openclaw-dev"`

**Gateway config:** Under that state dir, `openclaw.json` must allow a local gateway (newer builds need **`gateway.mode`** such as **`"local"`**). If the process exits immediately, fix config **before** touching Jarvis.

---

## One-time: disable the duplicate (Homebrew) gateway

If logs show errors from **`/opt/homebrew/lib/node_modules/openclaw`** while you intend to use the **checkout** gateway:

1. List services: `brew services list` (look for `openclaw` or similar).
2. Stop them: `brew services stop <name>` (exact name depends on your install).
3. **LaunchAgents:** check `~/Library/LaunchAgents` for **`ai.openclaw.gateway.plist`** (Homebrew gateway). Unload: `launchctl bootout "gui/$(id -u)" "$HOME/Library/LaunchAgents/ai.openclaw.gateway.plist"`. If that errors, **rename** the plist (e.g. to `ai.openclaw.gateway.plist.bak`) so it is **not** reloaded at login — keep the backup private (it may contain env). **Restore later:** rename back to `.plist`, then `launchctl load "$HOME/Library/LaunchAgents/ai.openclaw.gateway.plist"`.

Until only **one** process owns the Control UI port, you will see confusing log mixes and intermittent **connection refused**.

---

## Every session: start order

### Terminal 1 — OpenClaw gateway

**From this repo (locked-in):**

```bash
cd /path/to/jarvis-hud
pnpm openclaw:dev
```

This runs `scripts/openclaw-gateway-dev.sh`: loads **`JARVIS_BASE_URL`** (from **`JARVIS_HUD_BASE_URL`**), **`JARVIS_INGRESS_OPENCLAW_SECRET`**, and **`OPENAI_API_KEY`** from **jarvis-hud `.env.local`**, sets **`OPENCLAW_STATE_DIR=$HOME/.openclaw-dev`**, **`cd ~/Documents/openclaw`** (override with **`OPENCLAW_ROOT`**), then **`pnpm gateway:dev`**. Override env file: **`JARVIS_HUD_ENV_FILE=/path/.env.local`**.

**Or** manually:

```bash
export OPENCLAW_STATE_DIR="$HOME/.openclaw-dev"
cd ~/Documents/openclaw   # or your clone path
pnpm gateway:dev
```

Leave this running. The first time (or after a dirty tree), you may see **`Building TypeScript…`** for several minutes — **no port listens until** the log shows something like **`[gateway] starting HTTP server`** and **`[gateway] ready`**. Opening `OPENCLAW_CONTROL_UI_URL` before that yields **connection refused**. Note the **port** in the log (examples: **18789**, **19001** — yours is authoritative).

**VS Code / Cursor:** **Terminal → Run Task… →** `OpenClaw: gateway:dev` (or **Local stack: both (parallel)** for gateway + Jarvis).

Override clone path: `OPENCLAW_ROOT=~/src/openclaw pnpm openclaw:dev`

### Terminal 2 — Jarvis HUD

From **this** repo:

```bash
cd /path/to/jarvis-hud
pnpm dev
```

### `.env.local` (Jarvis)

- **`OPENCLAW_CONTROL_UI_URL`** = **exact** origin of the running gateway, e.g. `http://127.0.0.1:19001` (must match the listener, not a guess from docs).
- **`JARVIS_HUD_BASE_URL`** must use the **same host** as the address bar (`http://127.0.0.1:3000` **or** `http://localhost:3000`, not mixed). OpenClaw’s **`JARVIS_BASE_URL`** should match that origin exactly so ingress signing and the HUD “origin drift” check stay green.

Restart **`pnpm dev`** after changing `.env.local`.

### OpenClaw → Jarvis ingress (env)

If you start the gateway with **`pnpm openclaw:dev`** from jarvis-hud, **`JARVIS_BASE_URL`**, **`JARVIS_INGRESS_OPENCLAW_SECRET`**, and **`OPENAI_API_KEY`** are taken from **jarvis-hud `.env.local`** automatically — no need to duplicate them in Control UI unless you run the gateway some other way.

Otherwise, in **Settings → Config → Environment** (same state dir as the gateway), set the same three values and restart the gateway.

---

## Verify

```bash
# From jarvis-hud (loads .env.local if you use direnv, or export vars manually)
pnpm local:stack:doctor
```

Manual checks:

- Control UI loads; chat returns a normal reply (no “No API key” / unauthorized).
- `curl -sS http://127.0.0.1:3000/api/config | jq .openclawControlUiUrl` matches your gateway origin.

---

## If something breaks

| Symptom | Action |
|---------|--------|
| **Connection refused** on Control UI | Gateway not running, or wrong port in `OPENCLAW_CONTROL_UI_URL`. Run `pnpm local:stack:doctor`. |
| **Overview shows OK but Gateway Logs spam `Missing config` / `gateway.mode=local`** (stack traces from **`/opt/homebrew/.../openclaw`**) | Your **checkout** gateway is fine; a **second** Homebrew OpenClaw is crash-looping. **Stop** brew services / LaunchAgent for OpenClaw (`brew services list`, `~/Library/LaunchAgents`). Run **`pnpm local:stack:doctor`** — it prints Homebrew `openclaw` PSp lines if present. |
| **`Missing config`** and the **only** gateway you want is Homebrew | Run **`openclaw setup`** or set **`gateway.mode`** to **`local`** in **`~/.openclaw`** (or your real state dir). |
| **Token / URL mismatch** | CLI and gateway must share the same **`OPENCLAW_STATE_DIR`**. |
| **No API key for openai** | Set **`OPENAI_API_KEY`** in OpenClaw Control → Environment; restart gateway. |
| **Attention: skills with missing dependencies** | Optional. Skills need host apps (1Password, Notes, …). Ignore for Jarvis/ingress unless you rely on those tools. |

---

## Summary checklist

1. **One** gateway process; **one** `OPENCLAW_STATE_DIR`.
2. Terminal A: **`pnpm openclaw:dev`** (from jarvis-hud) or manual `pnpm gateway:dev` in the OpenClaw clone.
3. Terminal B: `pnpm dev` (jarvis-hud).
4. `OPENCLAW_CONTROL_UI_URL` = listener origin; OpenClaw env has `JARVIS_BASE_URL`, shared secret, and `OPENAI_API_KEY`.
5. `pnpm local:stack:doctor` before demos.
