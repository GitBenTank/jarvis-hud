# Episode 2 Runbook: OpenClaw → Jarvis Ingress Smoke Flow

## Demo Goal

This runbook proves the **OpenClaw → Jarvis ingress → approval → execution → receipt** flow works end-to-end. When you follow it successfully, you demonstrate:

1. An agent (or simulated agent) can sign and POST proposals to Jarvis
2. Jarvis verifies the HMAC signature and creates a pending proposal
3. A human can Approve → Execute in the Jarvis UI
4. Jarvis produces receipts and trace metadata (traceId, correlationId, connector)

**Use case:** Filming, live demos, or verifying the integration after changes.

---

## Pre-Roll Checklist

- [ ] Jarvis builds and runs locally
- [ ] Browser positioned on Jarvis dashboard
- [ ] Terminal windows arranged (see layout below)
- [ ] `scripts/demo-env.sh` available (or env vars set manually)

**Layout:**
- **Terminal 1** → **`pnpm dev`** (Jarvis **http://127.0.0.1:3000**)
- **Terminal 2** → **`OPENCLAW_ROOT=~/Documents/openclaw-runtime pnpm openclaw:dev`**
- **Terminal 3** (optional) → smokes from jarvis-hud
- **Browser** → Jarvis **http://127.0.0.1:3000**

Canonical detail: [local stack startup](../setup/local-stack-startup.md).

---

## Section 1 — Start Jarvis (Terminal 1)

```bash
cd ~/Documents/jarvis-hud
pnpm dev
```

**Wait for:** Next **Ready** — **http://127.0.0.1:3000**

**Success criteria:** `.env.local` has ingress enabled, secret ≥32 chars, allowlist includes `openclaw`. **`pnpm jarvis:doctor`** / **`pnpm machine-wired`** pass when the server is up.

**Optional — same as [DEMO.md](../../DEMO.md) on 3001:** `pnpm demo:boot` instead of **`pnpm dev`**.

---

## Section 2 — Smoke Test

**From jarvis-hud** (Jarvis on **3000**; **`JARVIS_HUD_BASE_URL=http://127.0.0.1:3000`** in **`.env.local`**):

```bash
cd ~/Documents/jarvis-hud
pnpm ingress:smoke
pnpm jarvis:smoke:apply
```

**From OpenClaw checkout** (must match Jarvis origin and secret):

```bash
export JARVIS_BASE_URL="http://127.0.0.1:3000"
export JARVIS_INGRESS_OPENCLAW_SECRET="<same as .env.local>"
pnpm jarvis:smoke
```

**Success criteria:** Output includes:
- `ok: true`
- `traceId: <uuid>`
- `correlationId: <uuid>` (when present)
- `status: pending` (or equivalent)

---

## Section 3 — Verify Ingress (Terminal 1)

Jarvis terminal will show:

```
POST /api/ingress/openclaw 200
```

**Success criteria:** 200 response; no 401 or 403.

---

## Section 4 — Pending Proposal (Browser)

Open: **http://127.0.0.1:3000** (or your live origin)

**Success criteria:**
- Pending proposal appears in Agent Proposals / Approvals panel
- **OpenClaw (verified)** badge visible
- **Ingress: passed** badge (when shown)

---

## Section 5 — Trace Metadata Verification

After opening a proposal (Details) or loading the trace by `?trace=<traceId>`:

**Success criteria:**
- Trace header shows **Trace ID** + **Correlation ID** + **Connector** metadata
- Connector displays `openclaw` (verified)

---

## Section 6 — Approve & Execute (Browser)

1. Click **Approve**
2. (For `code.apply`: complete irreversible confirmation if prompted)
3. Click **Execute**
4. Wait for **Executed** confirmation

**Success criteria:** Status transitions to executed; no error toast.

---

## Section 7 — Receipt (Browser + Terminal)

**Browser:** Show Today's Activity / Executed Actions; receipt entry with traceId.

**Terminal (optional proof):**

```bash
tail -n 3 ~/jarvis/actions/$(date +%Y-%m-%d).jsonl
```

**Success criteria:** Receipt exists; output path or artifact path visible.

---

## If Something Is Wrong

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Connection refused, curl fails | Jarvis not ready on **3000** (or wrong port) | Wait for Next **Ready**; **`lsof -nP -iTCP:3000 -sTCP:LISTEN`**; align **`.env.local`** and browser to the **live** port |
| 401 Unauthorized | Wrong `JARVIS_INGRESS_OPENCLAW_SECRET` | Same secret in Jarvis **`.env.local`** and OpenClaw; ≥32 chars; restart **`pnpm dev`** and gateway |
| 403 Forbidden | Wrong `JARVIS_BASE_URL` or ingress disabled | **`JARVIS_BASE_URL`** / **`JARVIS_HUD_BASE_URL`** = **`http://127.0.0.1:3000`** when using **`pnpm dev`**; ingress **on** in **`.env.local`** |
| Plugin / gateway not working | OpenClaw plugin not enabled or gateway not restarted | Enable `jarvis-hud` (or equivalent) in `~/.openclaw/openclaw.json`; set `JARVIS_BASE_URL` in `~/.openclaw/.env`; restart OpenClaw Gateway. |
| No pending proposal in Jarvis | Smoke succeeded but event not visible | Refresh page; check dateKey matches (same day); confirm storage path `~/jarvis` writable. |

---

## Filming Notes — Best Demo Moments

Capture these for editing:

1. **Smoke output** — Terminal showing `ok: true`, `traceId`, `correlationId` (if present)
2. **Pending proposal** — Jarvis UI with OpenClaw (verified) badge in Agent Proposals
3. **Receipt after execute** — Executed Actions / Today's Activity with the new receipt entry
4. **Trace header** — Trace panel showing Trace ID + Correlation ID + Connector metadata (openclaw verified)

---

## Env Vars Reference

| Var | Where | Example |
|-----|-------|---------|
| `JARVIS_INGRESS_OPENCLAW_SECRET` | Jarvis + OpenClaw / smoke | ≥32 chars, same everywhere |
| `JARVIS_HUD_BASE_URL` | jarvis-hud **`.env.local`** | **`http://127.0.0.1:3000`** (`pnpm dev`) |
| `JARVIS_BASE_URL` | OpenClaw (injected by **`pnpm openclaw:dev`**) | Same origin as HUD |
| `PORT` | Jarvis | **`3000`** default; **3001** only for [DEMO.md](../../DEMO.md) **`demo:boot`** |

For **3001** rehearsal, source [scripts/demo-env.sh](../../scripts/demo-env.sh) so smoke scripts match **`demo:boot`**.
