# Solo operator pass — TrustPostureStrip

**When:** 2026-05-10  
**How:** Live HUD at `http://127.0.0.1:3000` (dev server already bound to port 3000) + aria snapshot / viewport review. States **B** and **C** need env restarts; those rows are from **re-reading the shipped copy** in `src/components/TrustPostureStrip.tsx`, not a second server run in this pass.

---

## Live snapshot (default dev env on this machine)

Observed strip (auth **on**, binding **not required**, SoD **off**, no session cookie, prior policy deny on disk):

- Pills included: **Auth: On**, **Binding: Off**, **SoD: Off**, **Session: None**, **Step-up: Required**, plus ingress/connector/apply/scope/execute as usual.
- Amber line: **`Latest policy deny: reauthenticate_required`**

**Understood immediately:** Auth is on; I am not signed in (**Session: None**); step-up is not valid (**Step-up: Required**); something already denied policy for **`reauthenticate_required`** (same language as execute policy).

**Paused >5s:** Whether **Binding: Off** means “OIDC not wired” vs “binding not required by config” — it is the latter, but the word **Off** reads like a switch, not “not required.”

**Felt vague:** **Binding: Off** next to a big “HUD session required” banner — two different problems (session vs binding policy) compete for attention.

---

## Three requested states (full matrix)

### 1 — Auth off / convenience

| | |
|--|--|
| **Instant read** | Auth pill **Off**; Binding **N/A**; Session **N/A**; Step-up **N/A**; SoD still reflects `trustPosture` if config loads (often **SoD: Off** in dev). |
| **Pause >5s** | None expected; strip is quieter. |
| **Vague** | None critical. |

### 2 — Auth on + binding **required** but session **not bound**

| | |
|--|--|
| **Instant read** (expected) | **Binding: Missing** (warn); warning text about completing bind before governed actions. |
| **Pause >5s** | Where to click — strip does not link; main page still drives to **Establish session** / Security. Acceptable for strip-only scope. |
| **Vague** | “**stub-bind**” only appears in pill **title** tooltip, not in the amber line — tired operator may never hover. |

### 3 — SoD on + maps incomplete

| | |
|--|--|
| **Instant read** (expected) | **SoD: On · incomplete** (warn); amber line mentions **503** and **JARVIS_SOD_\*** lists. |
| **Pause >5s** | Which file/env — line says env vars, not path; OK for glance. |
| **Vague** | Low; copy is explicit. |

---

## Stricter pass — “tired and slightly annoyed”

| Trigger | Does the strip say what to do next? |
|---------|-------------------------------------|
| **Policy deny** (`reauthenticate_required` seen live) | **Yes-ish:** **Step-up: Required** + deny reason align. Next action: open Security / step-up flow (not named on strip). |
| **SoD deny** (e.g. `sod_same_principal`; not re-run live here) | **Partially:** If `latestBlockReason` is only `sod_same_principal`, operator knows *category*; **not** “use a different executor session” until they read docs or API body. Acceptable for v1. |
| **Binding required + missing** (expected from copy) | **Partially:** Warning says bind before governed actions; **tooltip** mentions stub-bind. Next action still “find Security / bind” — same gap as policy case. |

---

## Three columns — **state · hesitation · fix**

| state | hesitation | fix |
|--------|------------|-----|
| **Live: auth on, binding not required, no session, policy deny** | **Binding: Off** vs “not logged in” — two different issues | Later: consider **Binding: Not required** instead of **Off**; keep session pill as primary for “no cookie” |
| **Live: same** | “Latest policy deny” without **when** / **which trace** | Defer unless operators ask; strip stays glanceable |
| **Auth on + binding required + unbound session** (expected) | “stub-bind” only in tooltip | Later: add **one word** in amber line: “(stub-bind or OIDC)” if pilot confusion |
| **SoD on + incomplete maps** (expected) | None major | **Stop** — already names 503 and env lists |
| **SoD deny reason only on strip** | “Use another principal” not spelled | **Stop** until pilot says reason slug is insufficient |

**Verdict:** No mandatory code change from this pass. Optional copy tweak later: rename **Binding: Off** → **Binding: Not required** to kill ambiguity with “OIDC off.”

---

## Follow-up if you want automation

A small **env-flip script** or `pnpm` task that starts three disposable env files and opens three ports is the engineering alternative; not built in this pass.
