# Local verification: OpenClaw → Jarvis HUD

**Exit bar (before recording demos or pushing distribution):** [OpenClaw ↔ Jarvis operator sprint](setup/openclaw-jarvis-operator-sprint.md) — three clean full loops plus one deny/block path, config and ingress locked first.

Before running this checklist, ensure your local environment follows the [Local dev truth map](setup/local-dev-truth-map.md): **one canonical Jarvis origin per session** (standard dev is often `:3000`, demo / ingress rehearsal often `:3001`). Verification against the wrong port wastes time.

Tight pass to confirm **OpenClaw is the live variable** and Jarvis is structurally correct. Run in order. Adjust paths if your OpenClaw checkout is not `~/Documents/openclaw`.

**Ports:** Jarvis is often `http://localhost:3000` (`pnpm dev`) or `http://localhost:3001` (`pnpm demo:boot`). Replace `JARVIS_URL` below with whichever you use. OpenClaw must use the **same** base URL and **`JARVIS_INGRESS_OPENCLAW_SECRET`** as Jarvis for signed ingress.

## Hard reset (ghost processes)

Most “it worked yesterday” bugs are **duplicate or stale processes**. Prefer **Ctrl+C** in the terminals that started OpenClaw / Jarvis. If things are wedged, run:

```bash
pkill -f openclaw || true
pkill -f next || true
```

`pkill -f` matches **any** process whose full command line contains that substring, so it can touch unrelated tools (e.g. another app with “next” in its path). Use only when you mean to clear local dev junk, then start **one** gateway and **one** Jarvis dev server.

---

## 1. OpenClaw runtime

```bash
cd ~/Documents/openclaw
pnpm gateway:dev
```

**Want in logs:** gateway started; model resolves to OpenAI (or your configured provider); no Anthropic auth errors; no duplicate gateway (if unsure: `pkill -f openclaw-gateway` then start once).

**If Anthropic errors persist after config edit:** suspect stale gateway process, a per-agent override in OpenClaw, or a profile/workspace file under the dev agent directory overriding defaults—not Jarvis.

---

## 2. OpenClaw UI

Step-by-step (state dir, `openclaw dashboard`, Jarvis `OPENCLAW_CONTROL_UI_URL`): [OpenClaw Control UI setup](setup/openclaw-control-ui.md).

Open the OpenClaw control UI in the browser. On **Overview**, confirm the **gateway token** matches `gateway.auth.token` in the config you edited (so chat is authenticated).

Chat: `hello`

**Want:** no unauthorized banner; no missing provider/API key error; a normal agent reply.

---

## 3. Jarvis HUD runtime

From this repo:

```bash
cd ~/Documents/jarvis-hud
pnpm dev
```

For demo-style ingress env (port 3001):

```bash
pnpm demo:boot
```

**Want:** app loads at your local URL; Activity works:

```bash
export JARVIS_URL=http://localhost:3000
# or: export JARVIS_URL=http://localhost:3001

curl -sS -o /dev/null -w "%{http_code}\n" "$JARVIS_URL/activity"
```

Connector health (optional):

```bash
curl -sS "$JARVIS_URL/api/connectors/openclaw/health" | head -c 500
echo
```

Preflight (if using demo boot):

```bash
pnpm demo:verify
```

---

## 4. Alfred → proposal JSON (OpenClaw chat)

After Alfred replies normally, ask for **JSON only**, for example:

```text
Create a Jarvis proposal for a system note called "Alfred live test". Output JSON only.
```

**Want in the emitted body (top-level metadata for Jarvis ingress):**

- `agent`: `"alfred"`
- `builder`: `"forge"`
- `provider`: `"openai"`
- `model`: `"openai/gpt-4o"` (or your actual configured model string)

Use a valid `kind` (e.g. `system.note`) and `source.connector`: `"openclaw"`. For `system.note`, put body text in `payload.note` (not only `content`) so Jarvis normalizes the note correctly.

---

## 5. Ingest into Jarvis

**From a JSON file (normalized + signed):**

```bash
cd ~/Documents/jarvis-hud
pnpm jarvis:submit --file path/to/proposal.json
```

See [jarvis-proposal-submit.md](jarvis-proposal-submit.md). Same env vars as `pnpm ingress:smoke`.

**Or** use `pnpm ingress:smoke`, an OpenClaw plugin, or curl with HMAC per [openclaw-integration-verification.md](openclaw-integration-verification.md).

**Want in Jarvis UI:** proposal in feed; Approvals detail shows Coordinator / Builder / Provider / Model where applicable; **approval** still requires a human; **execution** only via Jarvis after approve.

---

## 6. Final truth test

After **approve** and **execute** in Jarvis:

**Want:** trace exists for that `traceId`; receipt/action log reflects execution; metadata still visible on trace; no automatic execution from OpenClaw alone.

---

## Quick start (two terminals)

Use after a **hard reset** if you want the shortest path to “both stacks up.” Run each block in its **own** terminal.

**Terminal A — OpenClaw**

```bash
cd ~/Documents/openclaw && pkill -f openclaw 2>/dev/null; pnpm gateway:dev
```

**Terminal B — Jarvis**

```bash
cd ~/Documents/jarvis-hud && pnpm dev
```

For **demo ingress** on port 3001 instead of plain `dev`, use `pnpm demo:boot` in terminal B (see step 3).

**Then manually:** open OpenClaw UI (token on Overview) → chat `hello` → open Jarvis URL → `/activity` → run the Alfred JSON proposal + signed ingress loop from steps 4–6.

---

## One-liner reminders

```bash
# Jarvis URL (pick one)
export JARVIS_URL=http://localhost:3000

# Quick reachability
curl -sS -o /dev/null -w "activity HTTP %{http_code}\n" "$JARVIS_URL/activity"
```
