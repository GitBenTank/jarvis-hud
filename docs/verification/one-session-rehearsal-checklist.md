---
title: "One-session rehearsal — auth-on + export proof"
status: living-document
category: verification
owner: Ben Tankersley
related:
  - ./pilot-green-single-session.md
  - ./pilot-proof-bundle-checklist.md
  - ../runbooks/audit-export-operator-proof.md
  - ../audit-export.md
  - ../setup/local-stack-startup.md
---

# One-session rehearsal (auth-on + export proof)

**Purpose:** In **one sitting**, prove the stack you shipped recently—**verified session**, **step-up**, **approve → execute → receipts**, then **audit export**—without starting new product scope.

**Audience:** You or another operator with repo + `.env.local` access. **Evidence** lives under `evidence/` (gitignored); do not commit raw exports or secrets.

---

## Preconditions (write these down once)

- [ ] **`pnpm dev`** (or `pnpm start`) on a URL you will use for both browser and `curl` (e.g. `http://127.0.0.1:3000`).
- [ ] **`JARVIS_ROOT`** is the tree you intend to certify (absolute path). Same value for the whole session.
- [ ] **`JARVIS_AUTH_ENABLED=true`** and valid **`JARVIS_AUTH_SECRET`** (see `docs/setup/env.md`).
- [ ] Optional but good: **`pnpm machine-wired`** and **`pnpm auth-posture`** (serious host: **`JARVIS_EXPECT_AUTH=true pnpm auth-posture`**).

```bash
export HUD_BASE=http://127.0.0.1:3000
export REHEARSAL_DATE=2026-05-12
mkdir -p evidence
```

Pick **`REHEARSAL_DATE`** = UTC calendar day (`YYYY-MM-DD`) that will contain your test approval—same as `events/REHEARSAL_DATE.json` under `JARVIS_ROOT`.

---

## A — Auth-on smoke (browser)

Do these **in order** on **`$HUD_BASE`**.

1. [ ] **Open home** (`/`). Confirm strip shows **`AUTH: ON`**. If you see **`STEP-UP: REQUIRED`** before step-up, that is expected.
2. [ ] **Session:** use the HUD flow that calls **`POST /api/auth/init`** (e.g. system status / session CTA—see `HomeSessionCta` / `SystemStatus`). Confirm you are not getting **401** on gated API calls after init.
3. [ ] **Step-up:** click **Step up** (or equivalent) so **`POST /api/auth/step-up`** runs. Reload or wait for strip refresh.
4. [ ] **Expect after step-up:** strip shows **`STEP-UP: VALID`** (or **N/A** only if your config does not use step-up TTL—auth-on normally expects **VALID** after step-up).
5. [ ] **Activity** (`/activity`): load without errors; activity stream or approvals load (no blank screen from silent **401**—if broken, check browser **fetch** uses **`credentials: "include"`** for gated routes).
6. [ ] **One safe governed path** (pick one):
   - **Ingress:** OpenClaw → one **`system.note`** (or other low-risk kind you allow), **pending** in HUD; **or**
   - **Local:** only if **`JARVIS_ALLOW_EVENTS_AND_DRAFTS_PROPOSAL_APIS`** is not `false`, a deliberate test event (otherwise use ingress only).
7. [ ] **Approve** the pending item (human gate).
8. [ ] **Execute** (explicit execute, not “approve runs adapters”).
9. [ ] **Verify truth:**
   - [ ] Strip / config posture matches what you expect (no contradictory “dry run” vs live execute without reading execute JSON).
   - [ ] **Receipt** appears (action log / executed actions) with **`traceId`** / **`approvalId`** you can point at.
   - [ ] **Trace** or Activity shows the same **`traceId`** for correlation.

**Red flags:** step-up returns **200** but strip stays **REQUIRED** → cookie / `GET /api/config` / `trustPosture.stepUpValid` mismatch (debug with devtools Application → cookies + Network → `/api/config`). **401** on Activity after init → missing **`credentials: "include"`** or wrong origin.

---

## B — Audit export proof (same host, same `JARVIS_ROOT`)

Follow **[Audit export — operator proof](../runbooks/audit-export-operator-proof.md)** with **`START`/`END`** = **`$REHEARSAL_DATE`** (or the inclusive range that contains your run).

1. [ ] Save **`evidence/jarvis-audit-export_${START}_to_${END}.json`** using **`curl -b`** if auth is on (cookie jar from the same browser session as §A).
2. [ ] Run the **`jq`** sanity from that runbook (`schemaVersion`, `range`, `summary`, `index` keys).
3. [ ] **Outsider test (5 min):** hand the JSON file to someone (or your future self) with **only** the file—no narration. They should be able to answer:
   - [ ] What **calendar window** does this claim (`range` + `schemaVersion`)?
   - [ ] What **approval id** and **trace id** tie the proposal to receipts (`index` + matching rows in `events` / `receipts`)?
   - [ ] Where would a **human** show up in the row model (`humanPrincipals` on events when present)?

**Red flags:** **409** `identity_binding_integrity` → binding required but disk rows incomplete (fix data or relax env for rehearsal only). **401** on export → cookie not sent on `curl`.

---

## Done when (session)

- [ ] §A complete with **one** executed receipt and trace correlation.
- [ ] §B export file on disk with **`schemaVersion`** present and **`index`** containing your approval/trace ids.

---

## After this rehearsal week (product, not blocking)

- **Governance / accountability story next:** **B5** (attribution contract across export + UI).
- **Investigation / multi-day audit story next:** **C1** (machine-readable trace scope + ADR).

Full evidence pack (charter, deny repro, etc.): [Pilot proof bundle checklist](./pilot-proof-bundle-checklist.md). Ordered commands for a longer green path: [Pilot green — single-session](./pilot-green-single-session.md).
