# Local verification: OpenClaw → Jarvis HUD

Tight pass to confirm **OpenClaw is the live variable** and Jarvis is structurally correct. Run **in order**.

**Daily routine (terminals, clone paths, doctor):** [Local stack startup](setup/local-stack-startup.md) — that doc is authoritative for **`OPENCLAW_ROOT=~/Documents/openclaw-runtime`** and **`pnpm local:stack:doctor`**.

**Exit bar (demos / distribution):** [OpenClaw ↔ Jarvis operator sprint](setup/openclaw-jarvis-operator-sprint.md).

**Origin discipline:** [Local dev truth map](setup/local-dev-truth-map.md). Prefer **`127.0.0.1`** for `JARVIS_URL`, `JARVIS_HUD_BASE_URL`, and OpenClaw `JARVIS_BASE_URL` so checks and the browser stay aligned.

**Ports:** Standard dev is **`http://127.0.0.1:3000`** (`pnpm dev`). Demo / ingress rehearsal is often **`http://127.0.0.1:3001`**. Replace `JARVIS_URL` below with the **live** origin. OpenClaw must use the **same** base URL and **`JARVIS_INGRESS_OPENCLAW_SECRET`** as Jarvis for signed ingress.

---

## Hard reset (ghost processes)

Most “it worked yesterday” bugs are **duplicate or stale processes**. Prefer **Ctrl+C** in the terminals that started OpenClaw / Jarvis. If things are wedged:

```bash
pkill -f openclaw || true
pkill -f next || true
```

`pkill -f` matches **any** process whose full command line contains that substring, so it can touch unrelated tools. Use only when you mean to clear local dev junk, then start **one** gateway and **one** Jarvis dev server.

---

## 1. OpenClaw gateway

**Blessed (from jarvis-hud):**

```bash
cd ~/Documents/jarvis-hud
OPENCLAW_ROOT=~/Documents/openclaw-runtime pnpm openclaw:dev
```

**Or** manual `pnpm gateway:dev` inside the OpenClaw clone with **`OPENCLAW_STATE_DIR="$HOME/.openclaw-dev"`** — same as [local stack startup](setup/local-stack-startup.md).

**Want in logs:** gateway **ready**; HTTP listener on your Control UI port (often **19001**); no second Homebrew gateway spamming **`/opt/homebrew/...`**. If the tree is dirty, expect **`Building TypeScript…`** before the port binds — use a **clean** `openclaw-runtime` clone for fast proof.

---

## 2. OpenClaw Control UI

Step-by-step: [OpenClaw Control UI setup](setup/openclaw-control-ui.md).

Open the Control UI. On **Overview**, WebSocket should show **OK**; gateway token matches **`gateway.auth.token`** for the same **`OPENCLAW_STATE_DIR`** as the process.

Chat: `hello`

**Want:** authenticated session; **no** persistent “no API key” for your provider. If **Overview is OK** but chat fails with **quota / billing** errors, that is an **OpenAI (or provider) account** issue — not Jarvis. See **OpenAI & Codex recovery** in [OpenClaw integration verification](openclaw-integration-verification.md).

---

## 3. Jarvis HUD

From this repo:

```bash
cd ~/Documents/jarvis-hud
pnpm dev
```

Demo-style ingress on **3001**:

```bash
pnpm demo:boot
```

**Want:** app loads; Activity responds:

```bash
export JARVIS_URL=http://127.0.0.1:3000
# or: export JARVIS_URL=http://127.0.0.1:3001

curl -sS -o /dev/null -w "%{http_code}\n" "$JARVIS_URL/activity"
```

**Phase 1 pass (both stacks running):**

```bash
pnpm machine-wired
pnpm local:stack:doctor
```

Connector health (optional):

```bash
curl -sS "$JARVIS_URL/api/connectors/openclaw/health" | head -c 500
echo
```

---

## 4. Alfred → proposal JSON (OpenClaw chat)

After Alfred replies normally, ask for **JSON only**, for example:

```text
Create a Jarvis proposal for a system note called "Alfred live test". Output JSON only.
```

**Want in the emitted body (top-level metadata for Jarvis ingress):**

- `agent`: `"alfred"`
- `builder`, `provider`, `model` as your workspace expects
- `source.connector`: `"openclaw"`

Use a valid `kind` (e.g. `system.note`). For `system.note`, put body text in `payload.note` (not only `content`) so Jarvis normalizes correctly.

### 4b. Flagship Flow 1 — Research `system.note` (end-to-end shape)

**Product intent:** Alfred handles intake; **Research** owns the evidence proposal; Jarvis holds approve + execute.

**A. Submit the canonical sample (signed `jarvis:submit`):**

```bash
cd ~/Documents/jarvis-hud
pnpm jarvis:submit --file examples/openclaw-proposal-flagship-flow1-research.sample.json
```

The file uses **`agent`: `research`**, kind **`system.note`**, and grep anchor **`flagship-flow-1-eu-ai-act-digest`** inside `payload.note` (see [Flagship team bundle v1](strategy/flagship-team-bundle-v1.md)).

**B. Strict-governed OpenClaw (reference registry):** tool **`proposeResearchSystemNote`** in `src/openclaw-strict-governed/` builds the same ingress shape and calls `submitOpenClawIngress` — wire it after Research produces `title` / `summary` / `note` from an Alfred-routed task.

**C. In Jarvis:** open the proposal card — expect **Research** metadata, **Low** risk posture for `system.note`, then **Approve** and **Execute** only in the HUD.

---

## 5. Ingest into Jarvis

**From a JSON file (normalized + signed):**

```bash
cd ~/Documents/jarvis-hud
pnpm jarvis:submit --file path/to/proposal.json
```

See [jarvis-proposal-submit.md](jarvis-proposal-submit.md). Same env vars as `pnpm ingress:smoke`.

**Or** `pnpm ingress:smoke`, an OpenClaw plugin, or HMAC `curl` per [OpenClaw integration verification](openclaw-integration-verification.md).

**Want in Jarvis UI:** proposal in feed; Approvals show metadata; **approval** still requires a human; **execution** only via Jarvis after approve.

---

## 6. Final truth test

After **approve** and **execute** in Jarvis:

**Want:** trace exists for that `traceId`; receipt / action log reflects execution; no governed outcome claimed from OpenClaw chat alone.

---

## Quick start (two terminals)

After a **hard reset**, shortest path to both stacks up:

**Terminal A — from jarvis-hud**

```bash
cd ~/Documents/jarvis-hud
OPENCLAW_ROOT=~/Documents/openclaw-runtime pnpm openclaw:dev
```

**Terminal B — Jarvis**

```bash
cd ~/Documents/jarvis-hud
pnpm dev
```

For **demo ingress** on port **3001**, use **`pnpm demo:boot`** in terminal B instead of **`pnpm dev`**.

**Then:** Control UI (token on Overview if needed) → chat `hello` → Jarvis URL → `/activity` → steps 4–6 above.

---

## One-liner reminders

```bash
# Jarvis URL (pick one; must match live process)
export JARVIS_URL=http://127.0.0.1:3000

curl -sS -o /dev/null -w "activity HTTP %{http_code}\n" "$JARVIS_URL/activity"
```
