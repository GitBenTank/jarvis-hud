# OpenClaw heartbeat & cron — cost policy (Jarvis HUD operators)

**Scope:** OpenClaw **gateway** config only. Jarvis HUD does **not** run OpenClaw’s heartbeat; idle API spend usually comes from the **gateway’s periodic heartbeat** (default **30m**), not from Jarvis ingress.

**Canonical upstream:** In your OpenClaw checkout, read `docs/gateway/heartbeat.md` (e.g. `~/Documents/openclaw-runtime/docs/gateway/heartbeat.md`).

---

## Inspected config shape (dev profile)

This repo’s typical dev state file is:

**`$HOME/.openclaw-dev/openclaw.json`**

Observed structure (keys only — **no secrets copied here**):

| Path | Notes |
|------|--------|
| `gateway.mode`, `gateway.bind`, `gateway.auth` | Local gateway + token auth — **leave unchanged** when editing heartbeat. |
| `agents.defaults.workspace`, `agents.defaults.skipBootstrap` | Present in a typical dev file. |
| `agents.defaults.heartbeat` | Often **absent**; when absent, OpenClaw uses built-in defaults (**`every` ≈ 30m** in current releases — see gateway logs for `intervalMs`). |
| `agents.list[]` | e.g. one default agent (`id: "dev"`). |

**Per-agent rule (upstream):** If **any** `agents.list[]` entry defines `heartbeat`, **only those** agents run heartbeats. If **none** do, defaults apply to the default agent. For a single default agent and no per-agent `heartbeat`, add policy under **`agents.defaults.heartbeat`**.

---

## Recommendation (build phase — less idle burn)

1. **Disable periodic heartbeat:** `every: "0m"` (documented in upstream heartbeat guide).
2. **Schedule explicit check-ins:** Use **Control UI → Cron Jobs** for **morning / afternoon / evening** (or whatever cadence you want). That gives **clock-accurate** times; a single `activeHours` window is only one continuous band per day, not three disjoint slots.
3. **Keep a strong model for interactive chat** (default agent model in Control UI / config).
4. **Optional later:** Set `heartbeat.model` (or cron-specific model, per upstream automation docs) to a **cheaper** model **only** for scheduled / background turns.

**Already upstream:** If the **main agent queue is busy**, heartbeat ticks can be **skipped** and retried — useful when you’re actively working, but it does **not** replace turning down `every` or switching to cron.

**Cost knobs when heartbeat is on:** `lightContext: true` and `isolatedSession: true` reduce transcript replay per tick (see upstream doc).

---

## Minimal merge snippet (valid JSON)

Under **`agents.defaults`**, add a **`heartbeat`** key whose value is the object below (keep existing `workspace`, `skipBootstrap`, etc.). **Do not** remove or overwrite `gateway` or `meta`.

**`heartbeat` value:**

```json
{
  "every": "0m",
  "lightContext": true,
  "isolatedSession": true
}
```

**After `every: "0m"`:** periodic heartbeat **stops**; `lightContext` / `isolatedSession` matter again if you set `every` back to a non-zero interval — keeping them documents intent and avoids a second edit when you tune cadence.

**Optional:** add a **`model`** string inside that same object when you want a **cheaper model only** for heartbeat ticks (only applies when `every` is not `0m`):

```json
{
  "every": "0m",
  "lightContext": true,
  "isolatedSession": true,
  "model": "openai/gpt-4o-mini"
}
```

Use a provider/model string valid for **your** OpenClaw install. For **`every: "0m"`**, prefer a **cheaper model on cron jobs** (per upstream automation docs) instead of relying on `heartbeat.model`.

**Example full `agents.defaults`** (illustrative — preserve your real `workspace` path and flags):

```json
{
  "workspace": "/Users/you/.openclaw/workspace-dev",
  "skipBootstrap": true,
  "heartbeat": {
    "every": "0m",
    "lightContext": true,
    "isolatedSession": true
  }
}
```

---

## Cron (three daily runs)

1. Open **http://127.0.0.1:19001** (or your Control UI origin) → **Cron Jobs**.
2. Add **three** jobs at your chosen local times (e.g. morning / afternoon / evening).
3. Align prompts / session targets with what you previously relied on **`HEARTBEAT.md`** + heartbeat for (upstream: empty or comment-only `HEARTBEAT.md` can skip heartbeat **API** calls when heartbeat is enabled — cron paths follow automation docs).

Restart or reload the gateway if your setup requires it after editing `openclaw.json`.

---

## Safety

- **Never commit** `~/.openclaw-dev/openclaw.json` to this repo — it contains **secrets** (gateway token, paths).
- Edit via **Settings → Config** in Control UI if you prefer not to hand-edit JSON.

---

## See also

- [Local stack startup](local-stack-startup.md) — state dir and `OPENCLAW_ROOT`
- [OpenClaw Control UI](openclaw-control-ui.md)
- [Documentation hub](../README.md)
