---
title: "Pilot proof bundle — operator checklist"
status: living-document
category: verification
owner: Ben Tankersley
related:
  - ./policy-deny-repro.md
  - ./pilot-charter-template.md
  - ../audit-export.md
  - ../runbooks/audit-export-operator-proof.md
  - ../setup/phase1-freeze-checklist.md
  - ../strategy/operating-assumptions.md
---

# Pilot proof bundle — operator checklist

**Purpose:** Produce a **defensible evidence chain** in one sitting: **same host, same `JARVIS_ROOT`, same calendar window** for run + audit export. **Do not** mix a CI-only `pnpm golden-loop` temp tree (it is **deleted** after the script—see `scripts/golden-loop-smoke.mjs`) with a separate export unless you rerun against **persisted** data.

**One sitting, exact command order:** [Pilot green — single-session runbook](./pilot-green-single-session.md).

**Discipline:** host → path → export → narrative (see [docs README](../README.md) deeper map).

---

## 0. Preconditions

- [ ] **`pnpm dev`** (or `pnpm start`) running against the **`JARVIS_ROOT` you intend to certify** (pilot or copy of prod shape).
- [ ] `.env.local` aligned with [operating assumptions §1–§2](../strategy/operating-assumptions.md); [Phase 1 freeze](../setup/phase1-freeze-checklist.md) row filled for this machine (paths, origins, how gateway starts).

---

## 1. Host proof

From repo root:

```bash
pnpm machine-wired
pnpm local:stack:doctor
```

Optional (auth rehearsal):

```bash
pnpm auth-posture
# Serious host guard:
# JARVIS_EXPECT_AUTH=true pnpm auth-posture
```

- [ ] Capture **stdout** (redact secrets) → e.g. `evidence/<date>-machine-wired.txt`, `evidence/<date>-doctor.txt`.

---

## 2. Path proof (governed path you care about)

Pick **one** (document which):

- [ ] **Default:** full OpenClaw ingress → pending → approve → execute → trace/replay, using your real connector + HUD; or  
- [ ] **`GOLDEN_LOOP_USE_EXISTING=1`** with **`JARVIS_ROOT`** and **`JARVIS_HUD_BASE_URL`** set to that same tree and HUD — see [golden-loop smoke](../../scripts/golden-loop-smoke.mjs) (path hits **your** disk, not a deleted tmp dir).

Record for the appendix:

- [ ] **`JARVIS_ROOT`** absolute path  
- [ ] **`dateKey`** for the run (`GET /api/approvals` exposes `dateKey`, or use the date in `events/` / `actions/` under `JARVIS_ROOT`)

---

## 3. Audit export (same window, same root)

With the **same server** still up and **`JARVIS_ROOT`** unchanged:

```bash
# Replace START and END with the same calendar day(s) as the run (inclusive, UTC YYYY-MM-DD).
curl -sS "http://127.0.0.1:3000/api/audit/export?start=START&end=END" \
  -o "evidence/jarvis-audit-export_START_to_END.json"
```

If **`JARVIS_AUTH_ENABLED=true`**, add session cookie per [audit export](../audit-export.md) and [Audit export — operator proof](../runbooks/audit-export-operator-proof.md).

- [ ] Saved file: **`evidence/jarvis-audit-export_<start>_to_<end>.json`**
- [ ] **`jq '.schemaVersion'`** matches **`AUDIT_EXPORT_SCHEMA_VERSION`** in `src/lib/audit-export.ts` (frozen envelope — see snapshot test in `tests/unit/audit-export.test.ts`).
- [ ] Confirm **`index.approvalIds`** / **`index.traceIds`** include the pilot approval.

Store **`evidence/`** locally; do not commit secrets or raw exports unless counsel/redaction allows. Repo lists `/evidence/` in `.gitignore`.

---

## 4. Policy deny repro (appendix link)

- [ ] Attach or link **[`policy-deny-repro.md`](./policy-deny-repro.md)** so reviewers can rerun a **negative** execute-time policy line in `policy-decisions/*.jsonl`.

---

## 5. Pilot charter

- [ ] Fill **[`pilot-charter-template.md`](./pilot-charter-template.md)** (auth posture, ingress charter, blast envelope, backups).
- [ ] Explicit line: if **allowed kind set, target scope, and backup boundary** are not written before the pilot, you have **permission drift**, not a pilot.

---

## Artifact pack (what the skeptical reader gets)

| Item | Path / command |
|------|-----------------|
| Host | Probe stdout files |
| Path | Notes + `JARVIS_ROOT` + `dateKey` |
| Export | `evidence/jarvis-audit-export_*.json` |
| Negative policy | [`policy-deny-repro.md`](./policy-deny-repro.md) |
| Charter | Completed `pilot-charter-template.md` |
