# Live demo reliability checklist

The goal is **not** perfection — the goal is **deterministic behavior under failure**. When something breaks, you name it, recover, and continue — without panic.

**Default path (same as [local stack startup](setup/local-stack-startup.md)):** **`pnpm dev`** on **http://127.0.0.1:3000**, **`OPENCLAW_ROOT=~/Documents/openclaw-runtime pnpm openclaw:dev`**, **`pnpm local:stack:doctor`**. Optional helper: **`pnpm dev:stack`**.

**Optional scripted path on port 3001:** [DEMO.md](../DEMO.md) (`pnpm demo:boot`, `pnpm demo:verify`, `pnpm demo:smoke`) — use only when you want that flow.

**Tune this file** as your machine paths or ports change.

---

## Demo spine (say this out loud)

Use this as the narrative backbone so you don’t ramble or get lost in the UI:

1. **Agent proposes** (ingress / connector)
2. **Human approves** (explicit gate)
3. **Execution is separate** (approve ≠ run)
4. **System produces a receipt** (proof on disk + UI)
5. **We can trace it later** (same `traceId`, deep link, export mindset)

---

## Preconditions (once per machine / session)

- [ ] `pnpm install` completed in the Jarvis HUD repo
- [ ] **`.env.local`:** `JARVIS_BASE_URL` and `JARVIS_HUD_BASE_URL` = **http://127.0.0.1:3000** when using **`pnpm dev`**; `OPENCLAW_CONTROL_UI_URL` matches the gateway (often **http://127.0.0.1:19001**); ingress enabled + secret + allowlist (see [env.md](setup/env.md))
- [ ] Clean OpenClaw runtime: **`OPENCLAW_ROOT=~/Documents/openclaw-runtime`** (or your path) — see [local-stack-startup.md](setup/local-stack-startup.md)
- [ ] `JARVIS_ROOT` is intentional (default `~/jarvis`); old events can clutter Approvals — acceptable if you filter by `traceId`
- [ ] For **code.apply** execution: `JARVIS_REPO_ROOT` points at a **clean** git repo (policy + adapter require it)

---

## Terminal 1 — Jarvis

From the **jarvis-hud** repo root:

```bash
pnpm dev
```

- [ ] Dev server **Ready** — **http://127.0.0.1:3000**
- [ ] No fatal compile errors

---

## Terminal 2 — OpenClaw

```bash
OPENCLAW_ROOT=~/Documents/openclaw-runtime pnpm openclaw:dev
```

- [ ] Log shows **`[gateway] ready`** before you open the Control UI
- [ ] Control UI origin matches **`OPENCLAW_CONTROL_UI_URL`** in `.env.local`; restart **`pnpm dev`** if you change it

---

## Verify (every session, ~5 seconds)

```bash
pnpm local:stack:doctor
```

- [ ] **3000** and **19001** (or your configured Control UI port) show listeners as expected
- [ ] **`GET /api/config`** on Jarvis returns 200 — if not, fix env and restart **`pnpm dev`**

**Stricter checks (optional):** `pnpm machine-wired` · `pnpm auth-posture`

---

## Browser — Operator ritual: runtime alive (before you “do” the demo)

Open **http://127.0.0.1:3000/activity** (or your live Jarvis origin + `/activity`).

**Say:** *Before I do anything, I check whether my runtime connector is alive.*

- [ ] Click **Refresh** on the **OpenClaw** health badge
- [ ] After proposals land, expect **Connected** when inside the liveness window (see [connectors.md](connectors.md))
- [ ] If **Degraded** / **Disconnected**: read badge subtext; fix env or confirm you’re hitting the right server — **do not** narrate past it as “fine”

---

## Smoke proposals (optional, from jarvis-hud)

With Jarvis running on the same origin as **`JARVIS_HUD_BASE_URL`**:

```bash
pnpm ingress:smoke
pnpm jarvis:smoke:apply
```

- [ ] Output shows **Ingress smoke OK** and **code.apply ingress smoke OK** with **`traceId`** / **pending**
- [ ] Visible in HUD **Activity** / traces

For the packaged pair + assertions: **`pnpm demo:smoke`** (expects **demo-env** / **3001** unless you align env — prefer **`ingress:smoke`** + **`jarvis:smoke:apply`** on **3000** for the default stack).

---

## Optional appendix — Scripted demo on 3001

When you intentionally use [DEMO.md](../DEMO.md):

**Terminal 1:** `pnpm demo:boot` → **http://127.0.0.1:3001** (or printed URL)

**Terminal 2:** `pnpm demo:verify` then `pnpm demo:smoke`

- [ ] Nothing else steals **3001**
- [ ] OpenClaw **`JARVIS_BASE_URL`** matches **3001** if Jarvis is on **3001**

---

## Quick reset (when things feel off)

1. Ctrl+C both terminals
2. `pnpm local:stack:doctor` (expect failures if nothing is up — that is fine)
3. Restart **Terminal 1** `pnpm dev`, **Terminal 2** `OPENCLAW_ROOT=… pnpm openclaw:dev`
4. `pnpm local:stack:doctor` again

---

## Abort / recover (short)

| Failure | Action |
|---------|--------|
| **verify** / doctor: config not 200 | Jarvis not ready; wrong `JARVIS_HUD_BASE_URL`; restart **`pnpm dev`** |
| **Connection refused** on Control UI | Gateway not ready or wrong port; wait for **`[gateway] ready`**; run doctor |
| **Smoke** fails | Read message; align secret and base URL; see [DEMO.md](../DEMO.md) failure table for **demo:** scripts |

---

## Definition of “demo ready”

1. **`pnpm local:stack:doctor`** passes with both processes up
2. HUD loads on **127.0.0.1:3000** (or your chosen origin); OpenClaw Control loads
3. At least one ingress smoke shows **pending** in the HUD when you need scripted proof
4. **Optional (investor bar):** after **`pnpm demo:smoke`** on **3001**, **`pnpm demo:verify`** passes, **approve → execute** the `code.apply` smoke, open **`/activity?trace=<id>`** in a fresh tab — see [DEMO.md](../DEMO.md)

---

## Browser — Approve → Execute (human gate)

Open **`http://127.0.0.1:3000/`** (or your live Jarvis origin).

- [ ] **Approvals** shows pending proposal(s) from smoke
- [ ] **Approve** the target proposal
- [ ] For **`code.apply`**: complete confirmation (checkbox + type **`APPLY`**)
- [ ] **Execute**
- [ ] UI shows **executed** / success state

---

## Browser — Receipt + trace (proof)

**Receipt**

- [ ] Executed action shows **receipt**-style details (e.g. commit hash / rollback for `code.apply`)
- [ ] Optional: tail `~/jarvis/actions/$(date +%Y-%m-%d).jsonl` — new line with matching `traceId` / `approvalId`

**Trace — fresh tab**

- [ ] Open a **new** tab; paste **`http://127.0.0.1:3000/activity?trace=<traceId>`** (use your origin + printed `traceId`)
- [ ] Timeline loads **without** navigating from the dashboard first
- [ ] Lifecycle reads **proposed → approved → executed → receipt**

---

## Repeatability proof

Same session, Jarvis still up:

```bash
pnpm ingress:smoke
pnpm jarvis:smoke:apply
```

(or **`pnpm demo:smoke`** when using **3001** / [DEMO.md](../DEMO.md))

- [ ] Second run succeeds; **Recent traces** shows another row

---

## OpenClaw → Jarvis (connector proof)

- [ ] Gateway env **`JARVIS_BASE_URL`** = same origin as the HUD (**http://127.0.0.1:3000** when using **`pnpm dev`**)
- [ ] **`JARVIS_INGRESS_OPENCLAW_SECRET`** matches **`.env.local`**
- [ ] From OpenClaw tooling: **`pnpm jarvis:smoke`** (or Alfred) twice; both **pending** + **`traceId`**

[openclaw-integration-verification.md](openclaw-integration-verification.md)

---

## Optional — 3× reliability (scripted 3001 only)

From [DEMO.md](../DEMO.md), when Jarvis is on **3001**:

```bash
for i in 1 2 3; do echo "== run $i =="; pnpm demo:verify && pnpm demo:smoke || exit 1; sleep 5; done
```

---

## Closing line (optional)

**Say:** *Everything you just saw is reproducible from a single trace link.*

Paste: `http://127.0.0.1:3000/activity?trace=<traceId>` (adjust origin if needed).

---

## Related docs

- [DEMO.md](../DEMO.md) — scripted **3001** runbook, receipt shape, failure table
- [local-stack-startup.md](setup/local-stack-startup.md) — canonical **3000** + OpenClaw
- [connectors.md](connectors.md) — badge semantics
