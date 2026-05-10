# Jarvis HUD documentation

Prose in this tree supports **narrative**, **diligence**, **setup**, **architecture**, and **verification** for the governed-execution control plane.

**In the HUD:** open **`/docs`** for the documentation home (audience-first layout and curated file index). Use **`?library=all`** for the complete file list. Long pages support **Slides** mode (split on `##` headings).

---

## Operators — start here

If you run Jarvis + OpenClaw locally, use this row first—before browsing the full library:

1. **[Local stack startup](setup/local-stack-startup.md)** — blessed path, terminals, doctor.
2. **[Operator checklist](setup/openclaw-jarvis-operator-checklist.md)** — authority, ingress, anti-patterns.
3. **[OpenClaw ingress for humans](setup/openclaw-ingress-for-humans.md)** — what ingress proves vs what it does not (no code).
4. **[Return after a pause](setup/return-after-pause.md)** — coming back after days away without re-deriving the stack.
5. **[Serious-mode rehearsal](setup/serious-mode-rehearsal-checklist.md)** — `JARVIS_AUTH_ENABLED=true`, probes, one batched approve/execute, record UX gaps.

Then **`pnpm machine-wired`**, **`pnpm local:stack:doctor`**, and (when exercising auth) **`pnpm auth-posture`**.

---

## Start here (by role)

| If you are… | Open this first |
|-------------|-----------------|
| **New to Jarvis** | [Welcome — what is Jarvis?](getting-started/welcome.md) |
| **Investor or advisor** | **Start:** `/docs/tati` or [investor-read-pack.md](strategy/investor-read-pack.md) — one path, plain-English glosses, ~15 min. Then [Demo](/demo). **Compressed lines:** [execution integrity messaging](strategy/messaging-execution-integrity.md). **Positioning claims (3–5):** [workflow governance memo](strategy/positioning-memo-workflow-governance-agent-teams.md). Deeper: [Gener8tor pitch](strategy/gener8tor-pitch.md) · [90s proof](video/90s-proof-demo.md) |
| **Technical diligence** | [Thesis Lock ADR](decisions/0001-thesis-lock.md) · [System overview](architecture/jarvis-openclaw-system-overview.md) · [Security model](architecture/security-model.md) |
| **Operator / building locally** | [Operators — start here](#operators--start-here) · [Local stack startup](setup/local-stack-startup.md) · [Operator checklist](setup/openclaw-jarvis-operator-checklist.md) |
| **Maintainers — trust vs capability** | [Trust, determinism, and integrity signals](governance/trust-and-determinism.md) — golden loop, integrity signals, adapter gate |

---

## What appears in the docs UI (policy)

The browse index at **`/docs`** defaults to a **curated catalog**: investor- and newcomer-friendly, without dumping every internal note into the grid. **That is intentional:** staff-only or noisy paths stay in the repo and remain reachable by **direct URL** or **`/docs?library=all`**. Newcomers see a shorter grid; operators should bookmark **[Local stack startup](setup/local-stack-startup.md)** and the checklist above rather than relying on the default index alone.

| Still in the repo | Shown in default `/docs` index? |
|-------------------|----------------------------------|
| Most `docs/**/*.md` | **Yes** |
| `docs/archive/**` (superseded copies kept for history) | **No** — direct URL or stub links only |
| Dated video insight writeups under `research/video-insights/` (except [insight index](research/video-insights/insight-index.md) and the folder README) | **No** — intake notes; keep for staff |
| [Social copy draft](marketing/social-copy.md) | **No** — internal GTM |
| [Cursor ingress prompt](cursor-prompt-openclaw-ingress.md) | **No** — agent prompt fragment |
| [Interview prep](interview-prep-jarvis.md) | **No** — founder prep |
| Mission logs & episode production under `video/` (`MISSION-LOG*`, `EPISODE2-RUNBOOK`, `episode-02-artifacts`, `episode-02-film-checklist`) | **No** — production artifacts |

**Direct URLs always work** (e.g. bookmarked paths, links from GitHub). **`/docs?library=all`** lists every file. Adjust exclusions in `isExcludedFromPublicLibraryIndex` in `src/lib/docs-library-index.ts` when the policy changes.

---

## Deeper map (operators)

| If you need… | Open this |
|--------------|-----------|
| Daily Jarvis + OpenClaw terminals | [Local stack startup](setup/local-stack-startup.md) |
| Frozen deployment contract | [Operating assumptions §1](strategy/operating-assumptions.md#1-canonical-openclaw-deployment-for-this-project) |
| Ordered proof the stacks work | [Local verification](local-verification-openclaw-jarvis.md) |
| Policy deny + `policy-decisions` line (diligence repro) | [Policy deny repro](verification/policy-deny-repro.md) |
| Pilot proof bundle + charter | [Single-session runbook](verification/pilot-green-single-session.md) · [Pilot checklist](verification/pilot-proof-bundle-checklist.md) · [Charter template](verification/pilot-charter-template.md) |
| Ingress protocol & HTTP debugging | [OpenClaw integration verification](openclaw-integration-verification.md) |
| Ingress in plain language (non-coders) | [OpenClaw ingress for humans](setup/openclaw-ingress-for-humans.md) |
| Port / origin discipline | [Local dev truth map](setup/local-dev-truth-map.md) |
| Env reference | [Environment variables](setup/env.md) |
| Control UI / gateway | [OpenClaw Control UI](setup/openclaw-control-ui.md) |
| Heartbeat cost / cron check-ins | [OpenClaw heartbeat & cron policy](setup/openclaw-heartbeat-cron-policy.md) |
| Full narrative spec | [Video thesis](strategy/jarvis-hud-video-thesis.md) |
| Next.js network proxy vs governance layers | [Network proxy boundary](architecture/network-proxy-boundary.md) |
| Machine ground truth capture | [Phase 1 freeze checklist](setup/phase1-freeze-checklist.md) |
| Trust compounding, integrity signals, new adapters | [Trust and determinism](governance/trust-and-determinism.md) |
| Enterprise readiness gaps (dated snapshot) | [Enterprise readiness snapshot 2026-05-09](governance/enterprise-readiness-snapshot-2026-05-09.md) |
| v0.2 — golden loop sprint (determinism bar) | [0005 Golden Loop](roadmap/0005-v02-golden-loop-sprint.md) |
| Auth on — serious rehearsal | [Serious-mode rehearsal checklist](setup/serious-mode-rehearsal-checklist.md) |
| Multi-agent + Jarvis boundary | [Agent team contract v1](strategy/agent-team-contract-v1.md) — **read this first** among agent docs |
| First composable team (Alfred + Research + Creative) | [Flagship team bundle v1](strategy/flagship-team-bundle-v1.md) · operators: [proposal shapes & grep anchors](architecture/flagship-proposal-shape-examples-v1.md) |
| Research specialist (evidence) | [Research agent v1](strategy/research-agent-v1.md) |
| Creative specialist (messaging) | [Creative agent v1](strategy/creative-agent-v1.md) |
| OpenClaw runtime + team + Jarvis (one narrative) | [Runtime + team + Jarvis loop v1](strategy/runtime-openclaw-jarvis-team-loop-v1.md) |

---

## How the main ops docs relate

1. **[Local stack startup](setup/local-stack-startup.md)** — **Routine**: processes, duplicate-gateway avoidance, recovery.
2. **[Local verification](local-verification-openclaw-jarvis.md)** — **Short proof**: step order and “what good looks like.”
3. **[Integration verification](openclaw-integration-verification.md)** — **Spec + deep debug**: status codes, validation, threat model.
4. **[Operator checklist](setup/openclaw-jarvis-operator-checklist.md)** — **Contract**: authority split and anti-patterns.

If advice conflicts: **Thesis Lock / video thesis** → **operating assumptions** → **operator checklist** → **local stack startup** → integration verification.

---

## Folder map

| Folder | Contents |
|--------|----------|
| `getting-started/` | Plain-language entry |
| `setup/` | Stack startup, env, OpenClaw UI, checklists, truth map |
| `strategy/` | Thesis, pitch, workflows, positioning |
| `architecture/` | Control plane, trust, OpenClaw contracts |
| `security/` | Ingress signing, execution model |
| `decisions/` | ADRs |
| `roadmap/` | Phased plans — [integration (0003)](roadmap/0003-operator-integration-phases.md), [platform growth (0004)](roadmap/0004-phased-platform-plan.md) |
| `video/` | Demo and episode runbooks |
| `research/` | Structured insights intake |
| `marketing/` | Distribution copy |
| `receipts/` | Schema examples |

Root-level `*.md` files are mostly **integration bridges** (ingress verification, connectors, proposal submit).

---

## Docs Governance Contract

Documentation follows the same principle as Jarvis:

- Content can be written freely.
- Placement must follow intent rules.
- Visibility is controlled explicitly.
- Drift should leave a clear report.

This is enforced with:

```bash
pnpm lint:docs
```

Rules:

- Missing first `# Title` → hard failure
- Likely misplaced intent → warning
- Mixed intent → warning
- Intentional exceptions → allowlist in the lint script

The goal is not perfection. The goal is keeping the documentation system navigable as Jarvis grows.

Per-file confirmations (intent + placement):

```bash
pnpm lint:docs -- --verbose
```
