# Operator Media Engine — rehearsal checklist

**Goal:** Run the first **business-use** proof loop: real-ish proposal payloads → Jarvis governance → manual publishing story. Aligns with [Operator Media Engine v1](../strategy/operator-media-engine-v1.md) and [Thesis Lock](../decisions/0001-thesis-lock.md).

**Not in scope:** auto-posting, email send, scheduling, secrets in logs.

---

## Day 1: one full loop (today)

Do this **once** before tuning cadence. Goal: **one** real artifact → **one** approved proposal → **Execute** → manual publish → proof you can reuse.

1. **Pick a real artifact** — One concrete input only, e.g. a meaningful **commit**, **debug breakthrough**, **DevHouse insight**, or **doc/architecture** change you care about.

2. **Generate proposals** — From repo root:
   ```bash
   pnpm operator:media:rehearsal
   ```
   Optional: save files for easier editing:
   ```bash
   pnpm operator:media:rehearsal -- --out-dir=artifacts/operator-media-engine
   ```

3. **Shape 2–3 drafts, submit ONE** — Copy one JSON object (or edit a saved file): align `payload.note` **Context** / **Proposed content** with your artifact; keep `evidenceStatus` / `uncertaintySummary` honest. Discard or defer the others. Submit with **`pnpm jarvis:submit --file …`** (or your OpenClaw ingress path). **Do not** commit `.env.local`; export the ingress secret only in your shell.

4. **Approve in HUD** — **Approve** the one you want authorized (still not executed).

5. **Execute** — Open proposal **Details** → **Execute** as `system.note`; confirm artifact path / receipt.

6. **Publish manually** — Post or send from the real channel (LinkedIn, mail client, etc.). Jarvis does not publish for you.

7. **Export / keep proof** — Open **Activity** with the proposal’s trace: `/activity?trace=<traceId>` (from the row or detail). Optionally pull the same day from **`GET /api/audit/export`** (see [SoD proof repro](../runbooks/sod-proof-repro.md) for curl patterns) or `GET /api/traces/<traceId>` and save a copy under your operator evidence folder — **outside git** if it contains anything sensitive.

**Done for Day 1:** One executed `system.note` + trace headline **Executed · receipt recorded** + you shipped one thing manually and know which proposal id to cite.

---

## Steps

1. **Generate samples** — From repo root:
   ```bash
   pnpm operator:media:rehearsal
   ```
   Optional: write files only (no extra secrets):
   ```bash
   pnpm operator:media:rehearsal -- --out-dir=artifacts/operator-media-engine
   ```

2. **Inspect** — Open one JSON payload; confirm `kind`, `title`, `summary`, `evidenceStatus`, `uncertaintySummary`, `source.connector`, `payload.note` sections (**Context**, **Proposed content**, **Evidence / source notes**, **Operator decision needed**).

3. **Submit** — Use your existing path (`pnpm jarvis:submit --file …` or OpenClaw tool) with **ingress secret from your environment** — do not commit env files. Submit **one** payload first.

4. **Approve in HUD** — Pending proposal → **Approve** (authorization only).

5. **Execute** — **Execute** as `system.note`; confirm artifact + action log.

6. **Verify trace** — Activity trace for the proposal’s `traceId`: execution truth **Executed · receipt recorded** (or equivalent) and lifecycle line consistent with [Governed execution checklist](../demo-governed-execution-checklist.md).

7. **Record outcome** — Note in your friction log or CRM: suitable for blog / LinkedIn / outreach / video? **Manual** publish only; mark whether the draft cleared your bar.

---

## Done when

You have at least one **approved → executed** rehearsal with a clean trace/receipt and a honest note on whether the content was worth shipping manually.
