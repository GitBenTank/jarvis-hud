# Local stack startup — Jarvis HUD + OpenClaw (locked-in flow)

Use this as the **single** routine for daily development. It avoids the common failure modes: **two gateways**, **mixed state directories**, and **Jarvis env pointing at the wrong Control UI port**.

### Blessed path (default — Jarvis + OpenClaw integration)

| | |
|--|--|
| **OpenClaw checkout** | **`~/Documents/openclaw-runtime`** (clean; release tag, e.g. **`v2026.4.14`** — **supported runtime pin** for this repo’s operator docs) |
| **Start from jarvis-hud** | **`OPENCLAW_ROOT=~/Documents/openclaw-runtime pnpm openclaw:dev`** (two shell lines: `cd` jarvis-hud, then the command — do not paste `cd ...OPENCLAW_ROOT=...` as one token) |
| **State dir** | **`OPENCLAW_STATE_DIR=$HOME/.openclaw-dev`** (set by the script unless you override) |
| **Rule** | **One** gateway, **one** state dir; turn **off** duplicate Homebrew/LaunchAgent gateways for this flow |

### Dev / hacking path (editing OpenClaw itself)

| | |
|--|--|
| **OpenClaw checkout** | **`~/Documents/openclaw`** (or your fork) — omit **`OPENCLAW_ROOT`** or set it to this path |
| **Expect** | **`dirty_watched_tree`**, long **`Building TypeScript…`** before **19001** listens |
| **Rule** | This lane is for **runtime development**, not the default **integration / demo** proof |
| **If `pnpm gateway:dev` fails** with **`Unknown module type: copy`** (rolldown/tsdown) | Your tree’s build toolchain is broken or mismatched—**do not** block demos on it. Use **`OPENCLAW_ROOT=~/Documents/openclaw-runtime`** (clean tag + `pnpm install`) for **`pnpm openclaw:dev`**, or fix **`pnpm install`** / pin the release in **`~/Documents/openclaw`**. |

**TL;DR (this repo):** Terminal A — `pnpm dev` · Terminal B — **`OPENCLAW_ROOT=~/Documents/openclaw-runtime pnpm openclaw:dev`** (loads `JARVIS_BASE_URL` / ingress secret / `OPENAI_API_KEY` from `.env.local`; syncs **`auth-profiles.json`** for embedded chat when the key is set) · wait **gateway ready** + **19001** · check — `pnpm local:stack:doctor`. (**Locked-in** clean runtime clone — see **One-time: runtime clone** below. Hacking OpenClaw still uses **`~/Documents/openclaw`** without **`OPENCLAW_ROOT`**.)

**Related:** [Documentation hub](../README.md) · [OpenClaw Control UI](openclaw-control-ui.md) (deep setup) · [Heartbeat & cron policy](openclaw-heartbeat-cron-policy.md) (idle API cost) · [OpenClaw integration verification](../openclaw-integration-verification.md) · [Operator checklist](openclaw-jarvis-operator-checklist.md) · [Operating assumptions §1](../strategy/operating-assumptions.md#1-canonical-openclaw-deployment-for-this-project).

---

## One-time: runtime clone (locked-in default)

**Phase 1 / proof / integration** use a **dedicated clean checkout** at **`~/Documents/openclaw-runtime`** so `gateway:dev` is not blocked on a dirty working tree. Shell placeholders like `<url>` will break — use a **real** URL.

```bash
cd ~/Documents
git clone https://github.com/openclaw/openclaw.git openclaw-runtime
cd openclaw-runtime
git fetch --tags
git checkout v2026.4.14
pnpm install
```

Match **`v2026.4.14`** to the release you standardize on (`git tag -l 'v2026*' | tail` if needed). **Do not** do day-to-day OpenClaw hacking in this directory—keep it **clean**; use **`~/Documents/openclaw`** for that (see **Intentional modes**).

---

## Best flow to use (pick this)

**Use (default):** Gateway code from **`~/Documents/openclaw-runtime`** via **`OPENCLAW_ROOT=~/Documents/openclaw-runtime pnpm openclaw:dev`** from jarvis-hud, plus **`OPENCLAW_STATE_DIR=$HOME/.openclaw-dev`**, and **Jarvis HUD** with **`pnpm dev`**.

**Use (OpenClaw hacking):** Omit **`OPENCLAW_ROOT`** so the script defaults to **`~/Documents/openclaw`** (expect **`dirty_watched_tree`** rebuilds when that tree is dirty).

**Do not also run** the **Homebrew** OpenClaw gateway (or any second LaunchAgent) while developing — that is what produced **wrong ports**, **connection refused**, and **`Missing config`** lines from **`/opt/homebrew/...`** while the real UI was on **19001** from the checkout.

**Jarvis:** keep **`OPENCLAW_CONTROL_UI_URL`** equal to whatever origin **`pnpm gateway:dev`** actually binds (often **`http://127.0.0.1:19001`** on your machine; confirm with **`pnpm local:stack:doctor`**).

Homebrew-only OpenClaw is fine for **other** workflows; for **Jarvis HUD + signed ingress + Control UI** day-to-day, the checkout flow above is the one to lock in.

---

## Canonical choice (recommended)

| Piece | What you run |
|--------|----------------|
| **Jarvis HUD** | This repo: `pnpm dev` (listens on **127.0.0.1:3000** by default). |
| **OpenClaw gateway** | **Clean** checkout **`~/Documents/openclaw-runtime`** via **`OPENCLAW_ROOT=~/Documents/openclaw-runtime pnpm openclaw:dev`** (or manual `pnpm gateway:dev` there) with a **fixed** `OPENCLAW_STATE_DIR`. |
| **Homebrew / LaunchAgent `openclaw`** | **Off** for this flow — or you will get duplicate listeners, `Missing config` spam from `/opt/homebrew/...`, and wrong tokens. |

**State directory:** Pick **one** and never mix CLI vs gateway:

- Dev profile (matches typical `agent:dev:main` / `~/.openclaw-dev` paths):  
  `export OPENCLAW_STATE_DIR="$HOME/.openclaw-dev"`

**Gateway config:** Under that state dir, `openclaw.json` must allow a local gateway (newer builds need **`gateway.mode`** such as **`"local"`**). If the process exits immediately, fix config **before** touching Jarvis.

---

## Intentional modes (Jarvis vs OpenClaw)

You do **not** need a new workflow: **`OPENCLAW_ROOT`** in `scripts/openclaw-gateway-dev.sh` already chooses which OpenClaw **checkout** runs the gateway. Treat these modes on purpose so friction matches the task.

### Rule of thumb

- **Dirty OpenClaw checkout → development.** A dirty git tree makes `gateway:dev` treat `dist` as stale and run a **full TypeScript rebuild** before **19001** listens (`dirty_watched_tree` in the log). That cost belongs to **agent/runtime hacking**, not to every Jarvis session.
- **Clean checkout → proof and fast startup.** Use the **locked-in** runtime clone at **`~/Documents/openclaw-runtime`** (see **One-time: runtime clone** above):  
  **`OPENCLAW_ROOT=~/Documents/openclaw-runtime pnpm openclaw:dev`**

Keep that clone on a **matching release tag**; **`pnpm install`** once after clone/checkout; **do not** hack OpenClaw there—keep it clean.

**Reframe:** If the stack “feels unstable,” you may be in the **wrong mode** for the task—not failing Jarvis architecture.

### Three modes

| Mode | What you run | When |
|------|----------------|------|
| **Jarvis only** | `pnpm dev` | HUD, docs, demo narrative, pitch, traces, receipts—**no** live OpenClaw. Fastest. |
| **Jarvis + fast gateway** | `pnpm dev` + **`OPENCLAW_ROOT=~/Documents/openclaw-runtime pnpm openclaw:dev`** | **Default** for signed ingress, Control UI, and integration when you are **not** editing OpenClaw. |
| **Jarvis + hacking OpenClaw** | `pnpm dev` + **`pnpm openclaw:dev`** (default **`~/Documents/openclaw`**) | Changing OpenClaw agent/runtime code—**accept** long **`Building TypeScript…`** as part of this lane. |

### Git tree vs runtime stack

**Clean OpenClaw tree** means **git cleanliness**. **Clean stack** means **runtime cleanliness** (processes, state dir, env). They are related; they are not the same failure mode.

| Focus | What it fixes |
|--------|----------------|
| **Git / clone** | `dirty_watched_tree`, long rebuilds, **19001** not listening yet. Use **`~/Documents/openclaw-runtime`** (clean) or **`OPENCLAW_ROOT`** to that path. |
| **Stack** | Phantom weirdness: **two** gateways, mixed **`OPENCLAW_STATE_DIR`**, wrong **`OPENCLAW_CONTROL_UI_URL`**, stale processes. Use **one** gateway, **one** HUD, **one** state dir, correct **`.env.local`**, **`pnpm local:stack:doctor`** green. |

**Mental rule:** **Dirty tree → build friction.** **Dirty stack → trust friction.** Use **proof mode** (clean clone) before you judge system stability; use **doctor** before you blame Jarvis.

> **One-liner:** Dirty tree → build friction. Clean stack → trust. Use a **clean clone** for proof.

**Three habits:** (1) **Clean clone** for proof / demo / default integration. (2) **One** gateway + **one** **`OPENCLAW_STATE_DIR`** per session. (3) **`pnpm local:stack:doctor`** before deciding the HUD is wrong.

**Canonical roles:** **Clean clone** = presentation, integration, reliable runtime. **Working clone** = OpenClaw development (expect rebuild cost). **Jarvis** = stable unless doctor fails.

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

This runs `scripts/openclaw-gateway-dev.sh`: loads **`JARVIS_BASE_URL`** (from **`JARVIS_HUD_BASE_URL`**), **`JARVIS_INGRESS_OPENCLAW_SECRET`**, and **`OPENAI_API_KEY`** from **jarvis-hud `.env.local`**. When **`OPENAI_API_KEY`** is set, it also writes **`openai:default`** into **`$OPENCLAW_STATE_DIR/agents/dev/agent/auth-profiles.json`** (OpenClaw embedded chat reads that file, not env alone). Run **`pnpm openclaw:sync-openai-auth`** anytime after you rotate the key. Then it sets **`OPENCLAW_STATE_DIR=$HOME/.openclaw-dev`**, **`cd ~/Documents/openclaw`** (override with **`OPENCLAW_ROOT`**), and **`pnpm gateway:dev`**. Override env file: **`JARVIS_HUD_ENV_FILE=/path/.env.local`**.

**Or** manually:

```bash
export OPENCLAW_STATE_DIR="$HOME/.openclaw-dev"
cd ~/Documents/openclaw   # or your clone path
pnpm gateway:dev
```

Leave this running. The first time (or after a dirty tree), you may see **`Building TypeScript…`** for several minutes — **no port listens until** the log shows something like **`[gateway] starting HTTP server`** and **`[gateway] ready`**.

**Do not open the Control UI** (`OPENCLAW_CONTROL_UI_URL`) until you see **gateway ready** in the log **and** the **port** is bound (e.g. **19001** — yours is authoritative; note it in the log). Opening the UI earlier yields **connection refused** and wastes time. Confirm with **`pnpm local:stack:doctor`** or **`lsof -nP -iTCP:19001 -sTCP:LISTEN`** if unsure.

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
- **`JARVIS_HUD_BASE_URL`** must use the **same host** as the address bar (`http://127.0.0.1:3000` **or** `http://localhost:3000`, not mixed). **Recommendation:** use **`http://127.0.0.1:3000`** everywhere for local work and demos so this repo’s examples and drift checks stay aligned. OpenClaw’s **`JARVIS_BASE_URL`** (inherited from **`pnpm openclaw:dev`**) must match that origin exactly so ingress signing and the HUD “origin drift” check stay green.

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
| **No API key for openai** (embedded chat / `auth-profiles.json`) | Set **`OPENAI_API_KEY`** in jarvis-hud **`.env.local`**, run **`pnpm openclaw:sync-openai-auth`**, restart gateway; or configure OpenAI in Control UI so the dev agent store is written. |
| **Control UI OK but chat fails**; logs: **`exceeded your current quota`**, **`embedded_run_agent_end`**, **`auth profile failure`** with **`rate_limit`** | **OpenAI billing** for the **account that owns the API key** (e.g. **negative credit balance**, **auto-recharge off**, org budget). The auth-profile line is **downstream** of the API error—not missing Jarvis config. Fix billing; optional: auto-recharge. [OpenAI error codes](https://platform.openai.com/docs/guides/error-codes/api-errors). |
| **Attention: skills with missing dependencies** | Optional. Skills need host apps (1Password, Notes, …). Ignore for Jarvis/ingress unless you rely on those tools. |
| **`Building TypeScript…` very long or “stuck”; 19001 not listening** | The OpenClaw repo you use for **`pnpm openclaw:dev`** likely has a **dirty** git tree, so the gateway rebuilds before bind. For daily integration, use a **clean** clone via **`OPENCLAW_ROOT`**, or **`git stash` / commit** in your working OpenClaw checkout. |
| **Integration debug: origin mismatch** (`localhost` vs `127.0.0.1`) | Pick **one** host for browser + **`JARVIS_HUD_BASE_URL`** + gateway env; restart **`pnpm dev`** and **`pnpm openclaw:dev`**. Prefer **`127.0.0.1`** (see **HUD signals** below). |
| **`ReferenceError: loadDocsLibraryIndex is not defined`** on **`/docs`** | Stale **`pnpm dev`** or an outdated `page.tsx`. Confirm **`src/app/docs/[[...path]]/page.tsx`** uses **`buildDocsLibrary`** (not `loadDocsLibraryIndex`); save files, stop the dev server (**Ctrl+C**), run **`pnpm dev`** again. |

---

## HUD signals (don’t mix them up)

Separate these three—they point to different fixes:

1. **`127.0.0.1:19001` refused (or your gateway port)** — Gateway **not** running, **still building** TypeScript, or **crashed** before bind. Jarvis can still show ingress as “configured”; that does **not** prove the gateway is listening.

2. **`localhost` vs `127.0.0.1`** — Real mismatch: keep **one** canonical host across **browser URL**, **`JARVIS_HUD_BASE_URL`**, and **`JARVIS_BASE_URL`** (from **`pnpm openclaw:dev`**). Mixed hosts make the stack feel “haunted.”

3. **Idle / no new proposals** — No new traffic hit the log; **by itself** it does not mean Jarvis is broken.

**Mental rule:** Control UI won’t open → **gateway problem.** Integration debug shows origin mismatch → **env / browser problem.** Idle banner → **traffic problem** (gateway down, Alfred quiet, or signing URL wrong).

### Recovery order (when multiple things look wrong)

1. From **jarvis-hud:** **`OPENCLAW_ROOT=~/Documents/openclaw-runtime pnpm openclaw:dev`** (or your clone).
2. Wait until the gateway log shows **ready** and the **port** is bound.
3. **`pnpm local:stack:doctor`**
4. If the HUD integration panel shows **origin mismatch**, fix **`.env.local`** (same host as the tab you use).
5. Restart **`pnpm dev`** and **`pnpm openclaw:dev`** so env is picked up end-to-end.
6. Open the HUD **only** on that canonical origin (e.g. always **`http://127.0.0.1:3000`**).

---

## Daily startup and shutdown (beside the terminal)

### Proof / demo / integration (default)

**Startup**

1. `cd` **jarvis-hud** → **`pnpm dev`**
2. **`OPENCLAW_ROOT=~/Documents/openclaw-runtime pnpm openclaw:dev`** (or your clean clone path; see **Intentional modes**)
3. Wait until the gateway log shows ready / **19001** listens
4. **`pnpm local:stack:doctor`** — fix anything red before demos or ingress debugging

**Demos / investor calls:** Always use a **clean** OpenClaw clone (**`OPENCLAW_ROOT`**) and run **`pnpm local:stack:doctor`** **before** you start the room—not after something fails.

**Shutdown:** **Ctrl+C** in the gateway terminal; **Ctrl+C** in the HUD terminal when done (or leave HUD running for Jarvis-only work).

### Hack / build OpenClaw (working clone)

**Startup:** **`pnpm dev`** → **`pnpm openclaw:dev`** (uses default **`~/Documents/openclaw`** unless **`OPENCLAW_ROOT`** is set). Accept **`Building TypeScript…`** when the tree is dirty—**do not** treat that as Jarvis instability.

**Shutdown:** **Ctrl+C** gateway; stop or keep HUD as needed.

### Jarvis only

**Startup:** **`pnpm dev`** · **Shutdown:** **Ctrl+C** HUD.

---

## Summary checklist

1. **One** gateway process; **one** `OPENCLAW_STATE_DIR`.
2. Terminal A: **`pnpm openclaw:dev`** (from jarvis-hud) or manual `pnpm gateway:dev` in the OpenClaw clone.
3. Terminal B: `pnpm dev` (jarvis-hud).
4. `OPENCLAW_CONTROL_UI_URL` = listener origin; OpenClaw env has `JARVIS_BASE_URL`, shared secret, and `OPENAI_API_KEY`.
5. `pnpm local:stack:doctor` before demos.
