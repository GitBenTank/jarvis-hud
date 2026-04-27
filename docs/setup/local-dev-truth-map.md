# Local dev truth map (Jarvis HUD + OpenClaw)

**Default (documented everywhere):** **`pnpm dev`** on **http://127.0.0.1:3000** + **`OPENCLAW_ROOT=~/Documents/openclaw-runtime pnpm openclaw:dev`** — [local stack startup](local-stack-startup.md).

This page explains **why** things break when layers disagree. There is a second mode — **scripted demo on 3001** ([DEMO.md](../../DEMO.md)) — that is optional.

**Jarvis rule:** The UI and `/api/config` must reflect reality. If `.env` intention and the running process disagree, **runtime wins** — fix URLs and scripts to match the live origin.

When `JARVIS_HUD_BASE_URL` is set but its **origin** does not match where you opened the HUD, the UI shows a non-blocking **Origin mismatch** banner (compares `window.location.origin` to the configured base URL).

### Quick reset (when things feel off)

Find which port Jarvis is actually using, then align browser, OpenClaw, `JARVIS_HUD_BASE_URL`, and smoke scripts to **that** origin.

```bash
# Which port is Jarvis listening on right now?
curl -sS http://127.0.0.1:3000/api/config || true
curl -sS http://127.0.0.1:3001/api/config || true
```

Whichever request returns JSON is your current Jarvis base URL for this session. Point everything there.

---

## Two supported launch stories

| Mode | Typical command | Expected browser origin |
|------|-----------------|-------------------------|
| **Standard dev** | `pnpm dev` | `http://127.0.0.1:3000` (or `localhost` — pick **one** per session) |
| **Demo / ingress rehearsal** | `PORT=3001 pnpm dev:port` or `pnpm demo:boot` | `http://127.0.0.1:3001` |

**Wording:** Do not treat “default is 3000” as the only story. **Demo boot intentionally uses 3001** (see `scripts/demo-env.sh`, `DEMO.md`). The live process port is what matters for a given session.

**Recommendation:** use **`127.0.0.1`** everywhere in `.env.local`, OpenClaw `JARVIS_BASE_URL`, and the browser for local work — avoids “same machine, different host” drift (see [local stack startup](local-stack-startup.md)).

---

## Source of truth

**The listening socket of the running Jarvis HUD process is authoritative.**

Discover the real origin with `curl`, `lsof`, or the browser URL bar, then align **every dependent layer** to that same origin string. Same idea as **Quick reset** above; you can shorten output with `| head -c 120` when you only need a sanity peek.

---

## Layers that must match

| Layer | Must match live Jarvis origin? | Notes |
|-------|-------------------------------|--------|
| Browser / manual testing | Yes | Open the URL the server actually printed (e.g. “Local: …”). |
| `JARVIS_HUD_BASE_URL` | Yes | Used by `jarvis:doctor`, `ingress:smoke`, and similar scripts. |
| OpenClaw `JARVIS_BASE_URL` | Yes | Signed ingress must target the **live** HUD. |
| `.env.local` URL fields | Yes | Helpful only when they reflect the **running** process, not a wish. |
| `curl` / smoke helpers | Yes | Do not assume a port is live without checking. |

---

## Session invariant

Pick **one** canonical origin per session:

- **`http://127.0.0.1:3000`** for **`pnpm dev`**, **or**
- **`http://127.0.0.1:3001`** for [DEMO.md](../../DEMO.md) / **`demo:boot`**.

**Do not mix them:** if the process is on **3000**, do not leave `.env.local`, OpenClaw, or smoke scripts pointed at **3001**, and vice versa.

Quick checklist:

1. Find the live Jarvis port (curl / lsof / dev server banner).
2. Set `JARVIS_HUD_BASE_URL` to that exact origin.
3. Set OpenClaw’s `JARVIS_BASE_URL` to the **same** origin.
4. Run smoke / doctor against that same origin.
5. Run one **real ingress proof** (below), not only port checks.

---

## Validation (config only)

```bash
curl -sS "http://127.0.0.1:3000/api/config"
# or, if you intentionally run on 3001:
curl -sS "http://127.0.0.1:3001/api/config"
```

Use the origin that matches **your** running server.

---

## Proof of correctness (end-to-end)

Port checks are **not** enough. A valid setup should complete:

1. OpenClaw sends **signed** `POST /api/ingress/openclaw`.
2. Jarvis HUD shows a **pending** proposal.
3. Operator **approves** (or denies).
4. **Execute** runs or is **blocked** truthfully (policy / preflight).
5. **Receipt** and **trace** are visible for that flow.

See [OpenClaw integration verification](../openclaw-integration-verification.md) and [Governed execution checklist](../demo-governed-execution-checklist.md).

---

## Common failure cases

| Symptom | Likely cause |
|---------|----------------|
| `connection refused` on curl or smoke | Wrong port — nothing listening, or Jarvis on the *other* story (3000 vs 3001). |
| `401` on ingress | Secret / allowlist mismatch, or smoke pointed at a **different** HUD instance than the one with your env. |
| Doctor says “missing env” but UI works | Doctor reads **your shell**; the server may have loaded `.env.local`. Align `JARVIS_HUD_BASE_URL` and re-run against the **live** origin. |
| Browser on 3000, OpenClaw still targeting 3001 | **Crossed streams** — update OpenClaw `JARVIS_BASE_URL` to the live origin. |
| OpenClaw Control UI “wrong” token or URL | Mixed **`OPENCLAW_STATE_DIR`** vs the gateway process (see [OpenClaw integration verification — OpenClaw config directory](../openclaw-integration-verification.md)). |

---

## See also

- [Environment variables](env.md) — `PORT`, `JARVIS_HUD_BASE_URL`, ingress secrets
- [OpenClaw integration verification](../openclaw-integration-verification.md) — handoff runbook
- [Local verification (OpenClaw + Jarvis)](../local-verification-openclaw-jarvis.md) — shorter checklist
