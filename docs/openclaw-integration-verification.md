# OpenClaw → Jarvis HUD Integration Verification (Handoff Protocol)

This doc is the deterministic runbook to verify OpenClaw → Jarvis HUD ingress works end-to-end, without guesswork.

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

## Preconditions

- Jarvis HUD is running locally with **OpenClaw ingress enabled**
- Jarvis is bound to a known port (recommend **3001** to avoid conflicts)
- OpenClaw has the Jarvis extension/tool wired and a smoke command (`pnpm jarvis:smoke`)

---

## Step 0 — Start Jarvis HUD with ingress enabled (clean port)

In the **jarvis-hud** repo:

```bash
# Stop stray dev servers (macOS)
killall node 2>/dev/null || true

JARVIS_INGRESS_OPENCLAW_ENABLED=true \
JARVIS_INGRESS_OPENCLAW_SECRET="your-32-char-secret-min-32" \
JARVIS_INGRESS_ALLOWLIST_CONNECTORS=openclaw \
PORT=3001 pnpm dev:port
```

Expected output includes:

- Local: http://127.0.0.1:3001

Open the UI: http://127.0.0.1:3001

---

## Step 1 — Jarvis Doctor (proves server env is correct)

In a second terminal (still jarvis-hud):

```bash
JARVIS_HUD_BASE_URL="http://127.0.0.1:3001" pnpm jarvis:doctor
```

Expected:

- ✅ Ingress enabled
- ✅ Secret present and length >= 32 (never prints secret)
- ✅ Allowlist includes openclaw
- ✅ Server config matches env (no "restart server with env" warning)

If doctor says "server needs same env", restart Jarvis with the vars in Step 0.

---

## Step 2 — Build OpenClaw (ensure clean baseline)

In the openclaw repo:

```bash
pnpm install
pnpm typecheck
pnpm build
```

If typecheck fails, stop here and fix it before running smoke.

When requesting help, capture:

- The command you ran
- The first error block (don't paste giant logs)
- `node -v` and `pnpm -v`

---

## Step 3 — Run OpenClaw → Jarvis smoke (proposes a system.note)

In openclaw repo:

```bash
JARVIS_BASE_URL="http://127.0.0.1:3001" \
JARVIS_INGRESS_OPENCLAW_SECRET="your-32-char-secret-min-32" \
pnpm jarvis:smoke
```

Expected success output:

- `ok: true`
- `id: <uuid>`
- `traceId: <uuid>`
- `status: pending`

No secrets or raw request body should be logged.

---

## Step 4 — Verify in Jarvis UI

In Jarvis UI (Approvals panel):

- Find the newly created pending event
- Confirm badges:
  - OpenClaw (verified)
  - Ingress: passed

Then:

1. Approve
2. Execute
3. Confirm:
   - Action log entry exists
   - Bundle path exists (artifact output path)
   - Trace timeline shows the event and receipt linkage

---

## Troubleshooting by HTTP Status

### 403 — Ingress disabled / not allowlisted

**Causes:**

- Jarvis dev server didn't start with ingress env vars
- Allowlist missing openclaw
- OpenClaw posting to wrong base URL/port

**Fix:**

- Run `pnpm jarvis:doctor` against the same base URL OpenClaw uses
- Restart Jarvis with Step 0 env vars
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

## Definition of "Integration Verified"

Integration is verified when:

- `pnpm jarvis:smoke` returns `{ ok: true, id, traceId, status: "pending" }`
- Jarvis UI shows the pending event with OpenClaw verified / ingress passed badges
- Approve → Execute produces receipts and trace linkage
