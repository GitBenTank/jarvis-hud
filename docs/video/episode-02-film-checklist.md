# Episode 2: Film Checklist

**Mission:** Connect a real AI agent to Jarvis and prove the proposal → approval → execution → receipt flow.

---

## Pre-Roll Setup

Before recording:

- [ ] Jarvis builds and runs locally
- [ ] OpenClaw repo accessible
- [ ] Browser positioned on Jarvis dashboard
- [ ] Terminal windows arranged

**Recommended layout:**

- Terminal 1 → Jarvis
- Terminal 2 → OpenClaw
- Browser → Jarvis UI

---

## Steps (run in order)

### 1 — Preflight

From **jarvis-hud** (ingress vars in **`.env.local`**):

```bash
pnpm jarvis:doctor
```

**Expected:** Ready for ingress

---

### 2 — Terminal 1: Jarvis

```bash
cd ~/Documents/jarvis-hud
pnpm dev
```

**Wait for:** Next **Ready** — **http://127.0.0.1:3000**

---

### 3 — Terminal 2: OpenClaw gateway

```bash
cd ~/Documents/jarvis-hud
OPENCLAW_ROOT=~/Documents/openclaw-runtime pnpm openclaw:dev
```

**Wait for:** **`[gateway] ready`**

---

### 4 — Smoke test (OpenClaw → Jarvis)

Same secret as **`.env.local`**. From **openclaw-runtime** (or your OpenClaw clone):

```bash
export JARVIS_BASE_URL="http://127.0.0.1:3000"
export JARVIS_INGRESS_OPENCLAW_SECRET="<same as jarvis-hud .env.local>"
pnpm jarvis:smoke
```

**Or** from **jarvis-hud** only: `pnpm ingress:smoke` (no OpenClaw repo needed).

**Expected output:**

```
ok: true
traceId: ...
status: pending
```

---

### 5 — Terminal 1: Capture ingress log

Jarvis terminal will show Next.js request log:

```
POST /api/ingress/openclaw 200
```

That proves the proposal reached Jarvis. Capture this moment.

---

### 6 — Browser: Jarvis dashboard

Open: **http://127.0.0.1:3000**

Show:

- pending proposal
- OpenClaw (verified) badge

---

### 7 — Approve

Click Approve.

Explain briefly what approval means.

---

### 8 — Execute

Click Execute.

**Wait for:** Executed

---

### 9 — Receipt

Show:

- Today's Activity
- receipt entry
- traceId if visible

---

### 10 — Terminal receipt proof

```bash
tail -n 3 ~/jarvis/actions/$(date +%Y-%m-%d).jsonl
```

Show the most recent receipt line(s).

---

## If Using Live Agent Instead of Smoke

Replace steps 4–5 with:

```bash
cd openclaw
pnpm dev
```

Then paste a prompt such as:

> Propose a system note to Jarvis with title "Hello from OpenClaw" and summary "Episode 2 demo test".

---

## Moments to Capture (for editing)

Make sure to capture:

- [ ] The first ingress log line
- [ ] The proposal appearing in Jarvis UI
- [ ] The approval click
- [ ] The execution confirmation
- [ ] The receipt entry
- [ ] The traceId visible somewhere on screen

These will become the key cuts in the video.
