# Proposal submit CLI (`pnpm jarvis:submit`)

Narrow path: **normalize** ad-hoc or nested proposal JSON → **sign** like existing smoke scripts → **POST** to `POST /api/ingress/openclaw`. Nothing else.

## Non-goals (v1)

- No auto-approval  
- No auto-execution  
- No polling Jarvis for state changes  
- No new persistence layer in OpenClaw (or other callers)  
- No background daemon beyond this explicit submission  

## Prerequisites

Same as `pnpm ingress:smoke`:

- `JARVIS_INGRESS_OPENCLAW_SECRET` (≥ 32 chars)  
- `JARVIS_INGRESS_OPENCLAW_ENABLED=true`  
- `JARVIS_INGRESS_ALLOWLIST_CONNECTORS=openclaw`  
- Jarvis dev server reachable (**`pnpm dev`**; optional **`pnpm demo:boot`** on **3001** per [DEMO.md](DEMO.md))  
- `JARVIS_BASE_URL` or `JARVIS_HUD_BASE_URL` — use **`http://127.0.0.1:3000`** with **`pnpm dev`**  

Signing and headers match [openclaw-ingress-signing.md](security/openclaw-ingress-signing.md) and `scripts/ingress-smoke.mjs` (shared `scripts/lib/openclaw-ingress-fetch.mjs`). Submission logic lives in `src/jarvis/submitProposal.ts`; normalization in `src/jarvis/normalizeProposal.ts`. The CLI is `scripts/jarvis-submit.ts` (run with **tsx** so imports resolve reliably).

## Usage

```bash
cd ~/Documents/jarvis-hud
export JARVIS_INGRESS_OPENCLAW_SECRET="…same as Jarvis .env.local…"
export JARVIS_BASE_URL=http://127.0.0.1:3000   # must match live Jarvis
pnpm jarvis:submit --file examples/openclaw-proposal-alfred-nested.sample.json
```

**Flagship Flow 1 (full bundle):** `examples/openclaw-proposal-flagship-flow1-alfred-intake.sample.json` then `examples/openclaw-proposal-flagship-flow1-research.sample.json` — shared `correlationId`, distinct `agent` + grep anchors; see [Local verification](local-verification-openclaw-jarvis.md#4b-flagship-flow-1--alfred-intake--research-digest-full-bundle).

From another repo (OpenClaw), env vars must still be set in **that** shell (they are not read from `jarvis-hud/.env.local` automatically):

```bash
export JARVIS_INGRESS_OPENCLAW_SECRET="…"
export JARVIS_BASE_URL=http://127.0.0.1:3000
pnpm --dir ~/Documents/jarvis-hud jarvis:submit --file ~/Documents/jarvis-hud/examples/openclaw-proposal-alfred-nested.sample.json
```

**Input:** Either a **flat** ingress body (`kind`, `title`, `summary`, `source`, `payload`, …) or an object with a nested **`proposal`** object (common Alfred shape). Unknown top-level keys are **dropped** so Jarvis validation is not tripped.

**Defaults** (when missing): `agent`, `builder`, `provider`, `model`, and `source.connector: "openclaw"`. If `title` / `summary` are missing, they are derived from `payload.note` or top-level `content` (mapped into `payload.note`).

**Output contract** (always flat, allowlisted fields only):

```json
{
  "agent": "alfred",
  "builder": "forge",
  "provider": "openai",
  "model": "openai/gpt-4o",
  "kind": "…",
  "title": "…",
  "summary": "…",
  "source": { "connector": "openclaw" },
  "payload": { … }
}
```

## Definition of done (manual E2E)

1. Create a `system.note` JSON file (flat or nested `proposal`).  
2. Run `pnpm jarvis:submit --file …`.  
3. See the proposal in the Jarvis feed.  
4. **Approve** in the UI (human).  
5. **Execute** only in Jarvis; confirm receipt / trace.  

## Implementation pieces

| Piece | Location |
|--------|----------|
| `normalizeProposal` | `src/jarvis/normalizeProposal.ts` |
| `submitProposal` | `src/jarvis/submitProposal.ts` |
| Signed fetch (smoke only) | `scripts/lib/openclaw-ingress-fetch.mjs` |
| CLI | `scripts/jarvis-submit.ts` (run with `tsx`) |

Later: have Alfred (or OpenClaw) emit JSON files or call the same normalizer — **after** this CLI path is boring.
