# OpenClaw Control UI (dashboard) — local setup with Jarvis HUD

This page gets the **OpenClaw gateway Control UI** running locally and linked from Jarvis. It does **not** configure signed ingress by itself; for that, keep **`JARVIS_BASE_URL`**, **`JARVIS_INGRESS_OPENCLAW_SECRET`**, and Jarvis ingress env aligned per [Local dev truth map](local-dev-truth-map.md) and [OpenClaw integration verification](../openclaw-integration-verification.md).

Official reference: [OpenClaw — Dashboard](https://docs.openclaw.ai/web/dashboard) · CLI: [dashboard](https://docs.openclaw.ai/cli/dashboard).

Releases (pick a tag to match): [openclaw/openclaw releases](https://github.com/openclaw/openclaw/releases).

---

## 0. Align checkout / CLI with your config (fix “config written by a newer OpenClaw”)

If the CLI prints something like **“Config was last written by a newer OpenClaw (2026.4.x); current version is 2026.3.x”**, your **on-disk config** under `~/.openclaw` (or `OPENCLAW_STATE_DIR`) was saved by a **newer** build than the **code** you are running from `~/Documents/openclaw` (or your global `openclaw` binary).

**Goal:** run the **same** (or newer) OpenClaw version as wrote the config—typically the current **Latest** [release tag](https://github.com/openclaw/openclaw/releases) on GitHub, unless you intentionally track **beta**.

**From a clean `~/Documents/openclaw` worktree** (stash or commit local changes first if `git status` is not clean):

```bash
cd ~/Documents/openclaw
git fetch origin --tags
git checkout <tag>   # e.g. v2026.4.14 — use the Latest tag shown on GitHub releases (not “beta” unless you mean it)
pnpm install
```

`pnpm gateway:dev` will rebuild TypeScript when `dist/` is stale (you may see a one-time compile on first start). A full `pnpm build` is only needed for packaging or CI-style checks—not for local dashboard use.

Then restart **`pnpm gateway:dev`** (or your LaunchAgent gateway) and re-run:

```bash
cd ~/Documents/openclaw && node openclaw.mjs dashboard --no-open
```

**If you cannot upgrade yet:** run the **same older** OpenClaw version that matches how the machine was previously set up, or restore a config backup—but mixed “new config + old CLI” is unsupported territory.

**`openclaw` not on `PATH`:** from the repo root use **`node openclaw.mjs`** instead of `openclaw` for any subcommand (`dashboard`, `doctor`, etc.).

---

## 1. Pick one state directory (avoid token / port confusion)

The gateway reads config from **`OPENCLAW_STATE_DIR`** when set, otherwise **`~/.openclaw`** (see [OpenClaw integration verification — config directory](../openclaw-integration-verification.md)).

**Rule:** The same state directory must be used for:

- the process that **listens** for the Control UI, and  
- the CLI you use to run **`openclaw dashboard`**.

If a LaunchAgent runs the gateway with `~/.openclaw` but you run `OPENCLAW_STATE_DIR=~/.openclaw-dev openclaw dashboard`, the printed URL can **disagree** with the live listener (wrong token or connection refused).

Optional shell aliases (from integration doc):

```bash
alias oc-dev='OPENCLAW_STATE_DIR="$HOME/.openclaw-dev" openclaw'
alias oc-prod='env -u OPENCLAW_STATE_DIR openclaw'
```

---

## 2. Ensure gateway config can start

In the state directory you chose, `openclaw.json` (or the layout your build expects) must allow a local gateway. Newer builds expect **`gateway.mode`** (for example **`"local"`**). If the gateway exits immediately, fix config first—Jarvis cannot help.

Set **`gateway.auth.token`** (or your build’s equivalent) so the Control UI can authenticate. The **Overview** screen in the UI should show a token that matches what you configured.

---

## 3. Start the gateway (OpenClaw checkout)

From your OpenClaw clone (adjust path if needed):

```bash
cd ~/Documents/openclaw
pnpm install   # once, or when deps change
pnpm gateway:dev
```

**Note:** `gateway:dev` sets **`OPENCLAW_SKIP_CHANNELS=1`** — fine for Control UI + Jarvis ingress smoke. For **Telegram** and other channels, use the full dev entrypoint from OpenClaw’s docs (often `pnpm dev`) so channels are not skipped.

Leave this terminal running. Watch the log for the **local Control UI URL** and port (commonly **`18789`**; your build may differ).

---

## 4. Open the dashboard

**Option A — CLI (recommended):**

```bash
# Same OPENCLAW_STATE_DIR as the running gateway, if you use one
openclaw dashboard
# If `openclaw` is not on PATH, from your clone:
cd ~/Documents/openclaw && node openclaw.mjs dashboard
```

To **print** the URL without opening a browser (useful for pasting into Jarvis):

```bash
openclaw dashboard --no-open
# or:
cd ~/Documents/openclaw && node openclaw.mjs dashboard --no-open
```

**Option B —** Open the URL printed in the gateway startup log, and append the token query parameter if your build requires it (see Overview in the UI).

---

## 5. Point Jarvis HUD at the Control UI (navigation only)

In **jarvis-hud** `.env.local` (or `.env`), set:

```bash
OPENCLAW_CONTROL_UI_URL=http://127.0.0.1:18789
```

Use the **exact** origin your gateway prints (`127.0.0.1` vs `localhost` can differ from the browser’s idea of “same site”; matching the log reduces surprises). Restart **`pnpm dev`** after changing env.

Jarvis will expose this in **`GET /api/config`** as `openclawControlUiUrl` and the HUD can show **Open OpenClaw Control**. This is **operator navigation only**; it does not start OpenClaw or fix ingress.

---

## 6. Wire OpenClaw → Jarvis (separate from the dashboard link)

On the **OpenClaw** side (env or `~/.openclaw/.env`, depending on your setup):

| Variable | Purpose |
|----------|---------|
| `JARVIS_BASE_URL` | Must match the **listening** Jarvis origin (e.g. `http://localhost:3000`). |
| `JARVIS_INGRESS_OPENCLAW_SECRET` | Same shared secret as Jarvis (≥ 32 chars). |

Then run **`pnpm jarvis:smoke`** from OpenClaw (or use the jarvis-hud skill) and confirm proposals appear in Jarvis. See [Local verification: OpenClaw → Jarvis HUD](../local-verification-openclaw-jarvis.md).

---

## Quick verification

| Check | Command or action |
|-------|-------------------|
| Gateway up | Control UI loads; chat `hello` gets a normal reply (no “unauthorized” wall). |
| Jarvis link | `curl -sS http://localhost:3000/api/config \| jq .openclawControlUiUrl` matches your gateway URL. |
| Ingress | From OpenClaw, `pnpm jarvis:smoke` → pending proposal in Jarvis (same secret + base URL). |

---

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| **Connection refused** on the Control UI port | Gateway not running, wrong port in `OPENCLAW_CONTROL_UI_URL`, or firewall. |
| **Unauthorized** / token rejected in the UI | **`OPENCLAW_STATE_DIR`** (or default `~/.openclaw`) for `openclaw dashboard` does not match the gateway process. |
| CLI warns **config written by a newer OpenClaw** | Your checkout or global CLI is older than the config on disk; upgrade the OpenClaw install or use the matching version. |

---

## Related

- [OpenClaw integration verification](../openclaw-integration-verification.md) — full handoff, 401 diagnosis, LaunchAgent notes.  
- [OpenClaw ↔ Jarvis operator sprint](openclaw-jarvis-operator-sprint.md) — acceptance bar before demos.  
- [Environment variables](env.md) — `OPENCLAW_CONTROL_UI_URL` and Jarvis ingress vars.
