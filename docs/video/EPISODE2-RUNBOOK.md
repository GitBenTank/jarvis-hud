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
- **Terminal 1** → Jarvis (dev server)
- **Terminal 2** → Smoke / OpenClaw
- **Browser** → Jarvis UI (http://localhost:3001)

---

## Section 1 — Start Jarvis (Terminal 1)

```bash
cd ~/Documents/jarvis-hud   # or path to jarvis-hud
source scripts/demo-env.sh
killall node 2>/dev/null || true

JARVIS_DEMO_LOG=1 pnpm demo:boot
```

**Wait for:** `Ready` or `Local: http://localhost:3001`

**Success criteria:** Jarvis UI loads at http://localhost:3001. `pnpm jarvis:doctor` shows ingress enabled, secret present, allowlist includes openclaw.

---

## Section 2 — Smoke Test (Terminal 2)

**Preferred (no OpenClaw repo):** From jarvis-hud, run ingress smoke. Same secret, same port.

```bash
cd ~/Documents/jarvis-hud
source scripts/demo-env.sh
pnpm ingress:smoke
```

**Fallback (with OpenClaw repo):** From openclaw, run jarvis smoke. Requires `JARVIS_BASE_URL` and `JARVIS_INGRESS_OPENCLAW_SECRET` to match Jarvis.

```bash
cd ~/Documents/openclaw   # or path to OpenClaw repo
source scripts/demo-env.sh   # if OpenClaw has it
export JARVIS_BASE_URL="http://localhost:3001"
export JARVIS_INGRESS_OPENCLAW_SECRET="openclaw-jarvis-demo-secret-minimum-32chars"
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

Open: http://localhost:3001

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
| Connection refused, curl fails | Jarvis not ready on port 3001 | Wait for `Ready`; confirm `pnpm demo:boot` finished; check `lsof -i :3001` |
| 401 Unauthorized | Wrong `JARVIS_INGRESS_OPENCLAW_SECRET` | Ensure Jarvis and smoke client use the **same** secret (min 32 chars). Restart Jarvis after exporting env. |
| 403 Forbidden | Wrong `JARVIS_BASE_URL` or ingress disabled | Set `JARVIS_BASE_URL=http://localhost:3001` (OpenClaw). For jarvis-hud smoke use `JARVIS_HUD_BASE_URL`. Run `pnpm jarvis:doctor` and restart Jarvis with env from `demo-env.sh`. |
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
| `JARVIS_INGRESS_OPENCLAW_SECRET` | Jarvis + OpenClaw / smoke | `openclaw-jarvis-demo-secret-minimum-32chars` (min 32 chars) |
| `JARVIS_HUD_BASE_URL` | jarvis-hud scripts (ingress:smoke) | `http://localhost:3001` |
| `JARVIS_BASE_URL` | OpenClaw (jarvis:smoke) | `http://localhost:3001` |
| `PORT` | Jarvis dev server | `3001` (demo default) |

Source `scripts/demo-env.sh` in both terminals to keep values in sync.
