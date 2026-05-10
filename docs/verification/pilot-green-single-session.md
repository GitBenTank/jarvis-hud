---
title: "Pilot green — single-session runbook (ordered commands)"
status: living-document
category: verification
owner: Ben Tankersley
related:
  - ./pilot-proof-bundle-checklist.md
  - ./pilot-charter-template.md
  - ./policy-deny-repro.md
  - ../audit-export.md
---

# Pilot green — single-session runbook

**Goal:** One sitting → **probe outputs**, **governed-run log**, **audit export JSON**, **policy deny evidence**, **filled charter**, all for the **same host**, **`JARVIS_ROOT`**, and **calendar window**.

**Before you type:** set shell variables (adjust paths/ports):

```bash
export PILOT_DATE=2026-05-10          # UTC calendar day for export + policy file name (YYYY-MM-DD)
export HUD_BASE=http://127.0.0.1:3000 # must match listening dev server (no trailing slash)
export JARVIS_ROOT=/absolute/path/to/pilot-jarvis-data
export REPO=/absolute/path/to/jarvis-hud
```

Ensure **`pnpm dev`** was started with **`JARVIS_ROOT`** pointing at **`$JARVIS_ROOT`** (or rely on default `~/jarvis` only if that *is* the pilot tree).

```bash
mkdir -p "$REPO/evidence"
cd "$REPO"
```

---

## 1. Prep (two terminals)

**Terminal A — Jarvis HUD**

```bash
cd "$REPO"
# If pilot data is not default ~/jarvis:
export JARVIS_ROOT="$JARVIS_ROOT"
pnpm dev
```

**Terminal B — OpenClaw gateway** (blessed stack per [operating assumptions §1](../strategy/operating-assumptions.md)):

```bash
cd "$REPO"
OPENCLAW_ROOT=~/Documents/openclaw-runtime pnpm openclaw:dev
```

Wait until **Jarvis** answers on **`$HUD_BASE`** and **gateway** is up (doctor will check).

---

## 2. Host truth (save everything)

```bash
cd "$REPO"
pnpm machine-wired   2>&1 | tee "evidence/${PILOT_DATE}-machine-wired.txt"
pnpm local:stack:doctor 2>&1 | tee "evidence/${PILOT_DATE}-local-stack-doctor.txt"
pnpm auth-posture    2>&1 | tee "evidence/${PILOT_DATE}-auth-posture.txt"
# Serious guard (optional): JARVIS_EXPECT_AUTH=true pnpm auth-posture 2>&1 | tee "evidence/${PILOT_DATE}-auth-posture-expect.txt"
```

**Pass:** `machine-wired` exits `0`. Fix stack until it does.

---

## 3. Governed path on the **real** `JARVIS_ROOT` (pick one)

### Option A — Scripted (same as golden loop, **no** temp tree wipe)

Requires **`JARVIS_INGRESS_OPENCLAW_SECRET`** in the environment (from `.env.local` or `set -a && source .env.local && set +a`).

```bash
cd "$REPO"
export GOLDEN_LOOP_USE_EXISTING=1
export JARVIS_HUD_BASE_URL="$HUD_BASE"
export JARVIS_ROOT="$JARVIS_ROOT"
pnpm golden-loop 2>&1 | tee "evidence/${PILOT_DATE}-governed-run-golden-loop.txt"
unset GOLDEN_LOOP_USE_EXISTING
```

### Option B — Manual (OpenClaw → HUD)

Do ingress → approve → execute in UI; append **approval id**, **trace id**, and **HUD_BASE** to:

```bash
echo "manual run $(date -u +%Y-%m-%dT%H:%M:%SZ) approvalId=… traceId=…" >> "$REPO/evidence/${PILOT_DATE}-governed-run-notes.txt"
```

**Record `dateKey`:** must match **`$PILOT_DATE`** if the run is that UTC day.

```bash
curl -sS "$HUD_BASE/api/approvals?status=pending" | tee "$REPO/evidence/${PILOT_DATE}-approvals-pending-snapshot.json"
# Read top-level "dateKey" in JSON; set PILOT_DATE to match if different.
```

---

## 4. Audit export (same window, same tree)

```bash
cd "$REPO"
# Auth off: no cookies.
curl -sS "$HUD_BASE/api/audit/export?start=${PILOT_DATE}&end=${PILOT_DATE}" \
  -o "evidence/jarvis-audit-export_${PILOT_DATE}_to_${PILOT_DATE}.json"
# Auth on: obtain session first (see ../audit-export.md), then curl with -b jarvis.cookies
```

**Sanity:** `jq '.index.approvalIds, .index.traceIds, .summary' "evidence/jarvis-audit-export_${PILOT_DATE}_to_${PILOT_DATE}.json"`

---

## 5. Policy deny repro + copy artifact

Follow **[`policy-deny-repro.md`](./policy-deny-repro.md)** (step-up path needs **`JARVIS_AUTH_ENABLED=true`**). Save HTTP transcript:

```bash
cd "$REPO"
# After running the curl steps from policy-deny-repro.md (use $HUD_BASE and your APPROVAL_ID):
# tee responses to evidence/${PILOT_DATE}-policy-deny-curl.txt
```

Copy the **matching** policy log line (redact if sharing externally):

```bash
cp "${JARVIS_ROOT}/policy-decisions/${PILOT_DATE}.jsonl" "$REPO/evidence/${PILOT_DATE}-policy-decisions.jsonl" 2>/dev/null || true
# If file missing, cat the file for the actual day you ran the repro.
```

**Do not** commit `jarvis.cookies`. Add `jarvis.cookies` to local ignore if needed; default is keep under `evidence/` only on disk.

---

## 6. Charter + consistency

1. Copy **`docs/verification/pilot-charter-template.md`** to a **dated** name (outside repo or in secure share) and fill all tables.
2. **Final check — all five must agree:**

| Check | Must match |
|-------|------------|
| Host | Probe files hostname / URLs |
| `JARVIS_ROOT` | Same path in charter, env used for `pnpm dev`, and on-disk `events/` / `policy-decisions/` |
| Window | `PILOT_DATE` = export `start`/`end` = run day |
| Export | `index.*` contains ids from governed run |
| Deny | `policy-decisions` line `traceId` ties to an event in **`$JARVIS_ROOT`** |

---

## Definition of green

A skeptical reviewer can open **without you**:

| # | Artifact |
|---|----------|
| 1 | `evidence/<date>-machine-wired.txt` (+ doctor + auth-posture) |
| 2 | `evidence/<date>-governed-run-*.txt` or `-notes.txt` |
| 3 | `evidence/jarvis-audit-export_<start>_to_<end>.json` |
| 4 | `evidence/<date>-policy-decisions.jsonl` (or deny curl transcript) + procedure **`policy-deny-repro.md`** |
| 5 | Filled charter (copy of **`pilot-charter-template.md`**) |

Same box, same run, same boundary.

---

## See also

- [Pilot proof bundle checklist](./pilot-proof-bundle-checklist.md) — narrative version of the same flow
