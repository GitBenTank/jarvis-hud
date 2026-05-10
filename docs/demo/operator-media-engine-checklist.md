# Operator Media Engine — rehearsal checklist

**Goal:** Run the first **business-use** proof loop: real-ish proposal payloads → Jarvis governance → manual publishing story. Aligns with [Operator Media Engine v1](../strategy/operator-media-engine-v1.md) and [Thesis Lock](../decisions/0001-thesis-lock.md).

**Not in scope:** auto-posting, email send, scheduling, secrets in logs.

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
