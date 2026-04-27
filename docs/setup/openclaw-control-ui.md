# OpenClaw Control UI (dashboard) — local setup with Jarvis HUD

**Daily startup order (locked-in):** [Local stack startup — Jarvis + OpenClaw](local-stack-startup.md) · verify: `pnpm local:stack:doctor`.

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
# Pick TAG from upstream releases (link above). Do not use angle brackets in the shell (< is redirection).
TAG=v2026.4.14
# Tags for releases live on the official repo. If `origin` is a personal fork, `git fetch origin --tags` often has no release tags — add upstream once:
git remote add upstream https://github.com/openclaw/openclaw.git 2>/dev/null || true
git fetch upstream --tags
git checkout "$TAG"
pnpm install
```

**If `fatal: couldn't find remote ref refs/tags/…` or `pathspec … did not match`:** run **`git ls-remote --tags upstream | grep "$TAG"`** (after `git fetch upstream --tags`). If that prints a line, the tag exists upstream and checkout should work. If **`git remote get-url origin`** is a fork (not `github.com/openclaw/openclaw`) and you never added **`upstream`**, the block above fixes it. If `upstream` already exists but points somewhere else, run **`git remote set-url upstream https://github.com/openclaw/openclaw.git`** then **`git fetch upstream --tags`** again. Very shallow clones may need a one-time **`git fetch --unshallow`** (from `origin` or `upstream`) before tags behave normally.

**If `pnpm install` ends with `ETIMEDOUT`:** that is a **registry / network** timeout, not a bad lockfile. Retry **`pnpm install`**; if it repeats, try **`pnpm config set fetch-timeout 600000`**, optionally **`pnpm config set network-concurrency 4`**, then install again. Check VPN, proxy (`HTTP_PROXY` / `HTTPS_PROXY`), and connection stability.

`pnpm gateway:dev` will rebuild TypeScript when `dist/` is stale (you may see a one-time compile on first start). Logs like **`missing_build_stamp`** or **`config_newer`** on the first run after deleting **`dist/`** are normal. A full `pnpm build` is only needed for packaging or CI-style checks—not for local dashboard use.

**If `pnpm gateway:dev` fails with `Could not resolve 'acpx/runtime'` / “subpath is not defined by exports”:** the workspace is almost always resolving a **stale or wrong `acpx`** (for example after a partial **`ETIMEDOUT`** install). From the repo root, remove deps then reinstall—use **`rm -rf node_modules dist && pnpm install`** so **`pnpm install` does not start until removal finishes**. Confirm **`pnpm why acpx`** in `extensions/acpx` shows **`acpx@0.5.3`** (or the version pinned in `extensions/acpx/package.json` on your tag). Avoid mixing a **tag checkout** with **`node_modules` left over** from an older branch.

**If `rm -rf node_modules` reports “Directory not empty”:** something is still using the tree (another terminal running **`pnpm install`** / **`pnpm gateway:dev`**, or the editor indexing **`node_modules`**). Stop those processes, then retry. If needed: **`chmod -R u+w node_modules`** and **`rm -rf node_modules dist`** again, or **`mv node_modules ../openclaw-node_modules_trash`** and **`rm -rf ../openclaw-node_modules_trash`** after nothing is running.

**If `pnpm gateway:dev` fails with `Command "tsdown" not found`:** the dev toolchain is missing from **`node_modules/.bin`** (install aborted, or dev deps were skipped). Do **not** set **`NODE_ENV=production`** when running **`pnpm install`**. From the repo root, **`rm -rf node_modules dist && pnpm install`** until exit code **0**, then verify **`pnpm exec tsdown --version`** prints a version before **`pnpm gateway:dev`** again.

**If the CLI still says “current version is 2026.3.x” after checkout:** you are still on **old code or an incomplete install** (wrong cwd, stale **`dist/`**, or **`pnpm install`** never finished). Use the repo root, complete **`pnpm install`**, then **`pnpm gateway:dev`** until the TypeScript build succeeds; **`rm -rf dist`** before **`pnpm gateway:dev`** is a safe reset of bundled output for many tags (upstream will rebuild it).

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

**Using Homebrew / `openclaw-gateway` only?** Do not run this section if your live process is under **`/opt/homebrew/lib/node_modules/openclaw`**. Use **default `~/.openclaw`**, set env in **Control → Config → Environment**, and see [Homebrew-only gateway (Option A)](../openclaw-integration-verification.md#homebrew-only-gateway-option-a).

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
# Example only — use the origin your gateway prints (18789, 19001, etc.)
OPENCLAW_CONTROL_UI_URL=http://127.0.0.1:19001
```

Use the **exact** origin your gateway prints (`127.0.0.1` vs `localhost` can differ from the browser’s idea of “same site”; matching the log reduces surprises). **`pnpm local:stack:doctor`** compares `.env.local` to listening ports. Restart **`pnpm dev`** after changing env.

Jarvis will expose this in **`GET /api/config`** as `openclawControlUiUrl` and the HUD can show **Open OpenClaw Control**. This is **operator navigation only**; it does not start OpenClaw or fix ingress.

### Assistant display name in Control UI (OpenClaw-side)

The chat header / assistant label is **not** configured by Jarvis. It comes from **OpenClaw** agent identity (`agents.list[].identity.name` and the dev workspace `IDENTITY.md` / soul files). Dev gateway defaults in current OpenClaw use the visible name **`alfred`**.

If you still see an older default after upgrading:

- Adjust identity in **OpenClaw Control → Settings → Agents** (or your build’s equivalent), **or**
- Edit `openclaw.json` under your **`OPENCLAW_STATE_DIR`** (`~/.openclaw` or `~/.openclaw-dev`, etc.) and set `agents.list[].identity.name` to **`alfred`**, then restart the gateway.

This changes **display copy only**; it does not rename the ingress connector id (`openclaw`), routes, secrets, or Jarvis approval flow.

---

## 6. Wire OpenClaw → Jarvis (separate from the dashboard link)

On the **OpenClaw** side (env or `~/.openclaw/.env`, depending on your setup):

| Variable | Purpose |
|----------|---------|
| `JARVIS_BASE_URL` | Must match the **listening** Jarvis origin (e.g. **`http://127.0.0.1:3000`** for **`pnpm dev`**). |
| `JARVIS_INGRESS_OPENCLAW_SECRET` | Same shared secret as Jarvis (≥ 32 chars). |

Then run **`pnpm jarvis:smoke`** from OpenClaw (or use the jarvis-hud skill) and confirm proposals appear in Jarvis. See [Local verification: OpenClaw → Jarvis HUD](../local-verification-openclaw-jarvis.md).

---

## Quick verification

| Check | Command or action |
|-------|-------------------|
| Gateway up | Control UI loads; chat `hello` gets a normal reply (no “unauthorized” wall). |
| Jarvis link | `curl -sS http://127.0.0.1:3000/api/config \| jq .openclawControlUiUrl` matches your gateway URL. |
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
