# Live demo reliability checklist

The goal is **not** perfection — the goal is **deterministic behavior under failure**. When something breaks, you name it, recover, and continue — without panic.

Run the **same path every time** so the demo is boring before you show it to anyone. This checklist matches the repo scripts (`pnpm demo:*`) and the investor-style flow in [DEMO.md](../DEMO.md).

**Tune this file** as your machine paths, ports, or OpenClaw package names change.

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
- [ ] Nothing else must steal **port 3001** (demo default) — `demo:boot` tries to clear 3000/3001; confirm if you use a custom `PORT`
- [ ] `JARVIS_ROOT` is intentional (default `~/jarvis`); old events can clutter Approvals — acceptable if you filter by `traceId`
- [ ] For **code.apply** execution: `JARVIS_REPO_ROOT` points at a **clean** git repo (policy + adapter require it)
- [ ] Optional: `pnpm jarvis:doctor` — ingress secret length, allowlist, base URL hints

---

## Terminal 1 — Boot Jarvis

From the **jarvis-hud** repo root:

```bash
pnpm demo:boot
```

- [ ] Dev server reaches **Ready** / shows **Local: `http://localhost:3001`** (or your `PORT`)
- [ ] No fatal compile errors in the terminal

`demo:boot` sources [scripts/demo-env.sh](../scripts/demo-env.sh): ingress **on**, demo secret (≥32 chars), allowlist `openclaw`, `JARVIS_HUD_BASE_URL` aligned with `PORT`.

---

## Terminal 2 — Sanity check (do this first, every time)

**Right after boot** — ~5 seconds, blocks the whole demo if the base is wrong:

```bash
pnpm demo:verify
```

- [ ] **`OK: config + stream reachable`** (or equivalent success lines)
- [ ] Note printed **`BASE_URL`** — use this exact origin in browser and OpenClaw config

**If this fails → do not proceed.** Fix boot, port, or env; run `pnpm demo:verify` again until it passes.

Checks performed: `GET /api/config` → 200, `GET /api/activity/stream` → 200 (see [scripts/demo-verify.sh](../scripts/demo-verify.sh)).

---

## Browser — Operator ritual: runtime alive (before you “do” the demo)

Open **`{BASE_URL}/activity`** (e.g. `http://localhost:3001/activity`).

**Say:** *Before I do anything, I check whether my runtime connector is alive.*

- [ ] Click **Refresh** on the **OpenClaw** health badge
- [ ] After smokes (next section), expect **Connected** (green) when proposals just landed inside the liveness window (see [connectors.md](connectors.md))
- [ ] If **Degraded** / **Disconnected**: read badge subtext; fix env or confirm you’re hitting the right server — **do not** narrate past it as “fine”

This is **operator behavior**, not decoration.

---

## Terminal 2 — Smoke (signed proposals into Jarvis)

```bash
pnpm demo:smoke
```

Runs, in order:

1. `pnpm ingress:smoke` — **system.note**-style ingress smoke  
2. `pnpm jarvis:smoke:apply` — **code.apply** ingress smoke  

**Terminal 2 success = all three:**

- [ ] **Ingress accepted** — output includes **`Ingress smoke OK`** and **`code.apply ingress smoke OK`**
- [ ] **`traceId` returned** — both runs show a `traceId` and **`pending`**
- [ ] **Visible in the HUD** — open **`{BASE_URL}/activity`**: the run appears under **Recent traces** and/or you can **Fetch** with the printed `traceId` (proves it isn’t a silent no-op)

- [ ] **Copy the printed `traceId`** (from the apply smoke) and keep **`BASE_URL`** handy for the deep-link moment below

If any step fails: **Quick reset** or **Abort / recover** at the bottom.

---

## Browser — Approve → Execute (human gate)

Open **`{BASE_URL}/`** (dashboard).

- [ ] **Approvals** shows pending proposal(s) from smoke (at least the `code.apply` if you plan to execute it)
- [ ] **Approve** the target proposal
- [ ] For **`code.apply`**: complete **irreversible** confirmation (checkbox + type **`APPLY`**)
- [ ] **Execute**
- [ ] UI shows **executed** / success state (not stuck on executing / failed)

---

## Browser — Receipt + trace (proof)

**Receipt**

- [ ] Executed action shows **receipt**-style details where the UI surfaces them (e.g. commit hash / rollback for `code.apply`)
- [ ] Optional: tail `~/jarvis/actions/$(date +%Y-%m-%d).jsonl` — new line with matching `traceId` / `approvalId`

**Trace — single source of truth (fresh tab)**

Prove **stateless reproducibility** — not a trick of “already being on the right screen”:

- [ ] Open a **new browser tab** (or window)
- [ ] **Paste the full URL:** `{BASE_URL}/activity?trace=<traceId>` (replace `<traceId>` with the UUID you copied)
- [ ] Confirm the timeline loads **without** clicking through from the dashboard first
- [ ] Lifecycle reads **proposed → approved → executed → receipt** and matches this run

You may still use **Recent traces** or **Fetch** for convenience — the **paste-in-fresh-tab** step is the investor-grade moment.

---

## Repeatability proof (pipeline, not one-off)

Still in the same session (server still up):

```bash
pnpm demo:smoke
```

- [ ] Smoke passes again
- [ ] On **`/activity`**, **Recent traces** shows **another** row (second run) — the pipeline is repeatable, not a single happy accident

---

## Optional path — Real OpenClaw connector (separate repo)

When the demo story includes **OpenClaw → Jarvis** (not only Node smokes):

- [ ] OpenClaw checkout has **`JARVIS_BASE_URL`** (or your tool’s equivalent) = same origin as **`demo:verify`** printed `BASE_URL`
- [ ] Secret matches Jarvis: **`JARVIS_INGRESS_OPENCLAW_SECRET`** (same value Jarvis loaded — demo uses [demo-env.sh](../scripts/demo-env.sh) `DEMO_SECRET` unless you overrode)
- [ ] From OpenClaw: run your packaged smoke (e.g. **`pnpm jarvis:smoke`**) **twice**; both should return pending + `traceId`
- [ ] Repeat **Approve → Execute → trace** for that proposal if you want a second narrative beat

Details: [openclaw-integration-verification.md](openclaw-integration-verification.md).

---

## Optional — 3× reliability (same session)

Prove the loop is stable without restarting the server (from [DEMO.md](../DEMO.md)):

```bash
for i in 1 2 3; do echo "== run $i =="; pnpm demo:verify && pnpm demo:smoke || exit 1; sleep 5; done
```

- [ ] All three runs: **verify** OK + **smoke** OK

---

## Quick reset (~30 seconds, muscle memory)

If anything is weird and you need a clean runtime:

1. **Stop** the dev server: `Ctrl+C` in the terminal running `demo:boot`
2. **Restart:**

```bash
pnpm demo:boot
```

3. **Sanity gate** (do not skip):

```bash
pnpm demo:verify
```

If verify fails, fix before smoke or UI. This is your **panic button** — one path, every time.

---

## Abort / recover (symptoms)

| Symptom | Likely fix |
|--------|------------|
| `demo:verify` /api/config not 200 | Wait for boot; correct `JARVIS_HUD_BASE_URL` / `PORT`; **Quick reset** |
| `demo:verify` stream not 200 | Stale Next build / wrong server — **Quick reset** |
| Smoke 401 / signature | Secret mismatch between smoke script env and server |
| Smoke 403 ingress disabled | `JARVIS_INGRESS_OPENCLAW_ENABLED` not true on server |
| Execute fails policy / scope | `JARVIS_REPO_ROOT`, clean tree, execution allowlists, optional `JARVIS_EXEC_ALLOWED_ROOTS` |
| OpenClaw badge wrong after smoke | **Refresh** badge; confirm smokes hit this instance |

Full table: [DEMO.md](../DEMO.md) (section *If it fails*).

---

## Definition of “demo ready”

You are ready when:

1. **`pnpm demo:verify`** passes immediately after boot, then **`pnpm demo:smoke`** passes once with **all three** terminal success checks above.  
2. You can **approve → execute** the `code.apply` smoke proposal and see a **receipt**.  
3. You can open **`/activity?trace=<id>` in a fresh tab** and the story matches that run.  
4. A **second** `pnpm demo:smoke` shows up in **Recent traces**.

Optional bar: run the **3× loop**; optional **OpenClaw** smoke twice from the connector repo.

---

## Closing line (optional, high impact)

**Say:** *Everything you just saw is reproducible from a single trace link.*

Then **paste** (or show the bar):

`{BASE_URL}/activity?trace=<traceId>`

That’s the closing shot: proof without the app already being “warmed up” on the right screen.

---

## Related docs

- [DEMO.md](../DEMO.md) — runbook, receipt shape, 3× test  
- [OpenClaw integration verification](openclaw-integration-verification.md)  
- [OpenClaw connector health](connectors.md) — badge semantics and time windows  
