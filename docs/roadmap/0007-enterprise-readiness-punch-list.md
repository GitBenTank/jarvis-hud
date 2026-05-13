# Enterprise readiness punch list (P0–P4 + workstreams)

**Status:** Living document  
**Owner:** Ben Tankersley  
**Created:** 2026-05  
**Primary order:** **P0 → P4** (sequencing discipline)  
**Secondary tag:** **Workstream A / B / C / D** (parallel ownership without priority inversion)

**Related:**

- [Thesis Lock — ADR-0001](../decisions/0001-thesis-lock.md) · [Product narrative thesis](../strategy/jarvis-hud-video-thesis.md#thesis-lock-do-not-drift)
- [Technical roadmap (0001)](./0001-technical-roadmap-production.md)
- [Operator integration phases (0003)](./0003-operator-integration-phases.md)
- [Phased platform plan (0004)](./0004-phased-platform-plan.md)
- [v0.2 golden loop sprint (0005)](./0005-v02-golden-loop-sprint.md)
- [Pilot proof bundle checklist](../verification/pilot-proof-bundle-checklist.md)
- [Activity — trace vs receipt card](../strategy/activity-trace-scope-collision-fix-spec.md) · `src/lib/executed-receipt-card-selection.ts`

---

## Summary

Jarvis HUD is a **strong demo-capable governed control plane**: ingress → approval → explicit execute → receipts → traces is real in code. It is **not yet enterprise-hardened**: hosted trust boundaries, unsigned proposal surfaces, day-bounded approvals payloads, and operator-scale concerns need deliberate closure.

This document is the **cross-cutting readiness plan**: ordered by **P0–P4**, sliceable by **Workstream A–D**, each row with **done-when** checks and placeholder **owner / status**.

**Non-negotiable standard (enterprise bar):** **no silent bypass of the approval plane** — any path that creates executable intent or runs adapters without the same human-gated chain as the blessed flow must be **prevented**, **detected**, or **explicitly out of scope** with docs and tests.

---

## “Enterprise-ready” (working definition)

Use this label only when the product can credibly promise:

- [ ] **Safe execution boundaries** — policy, scope, and adapter allowlists enforced server-side  
- [ ] **Honest receipts** — UI labels match execute semantics (e.g. dry-run vs live)  
- [ ] **Attributable actions** — who approved / who executed (and principals when auth is on) on durable records  
- [ ] **Exportable proof** — audit bundle with frozen schema and operator-run validation  
- [ ] **Stable operator workflows** — smoke paths pass without narrator interpretation  
- [ ] **Observable failures** — operator-visible errors; no silent drops of queue or execution  
- [ ] **Multi-boundary story** — more than one repo / environment / day is either supported or honestly scoped with API-declared limits  

---

## Workstreams (secondary tags)

| Tag | Name | Intent |
|-----|------|--------|
| **A** | Trust and safety | Ingress, execution surface, auth boundary, bypass detection |
| **B** | Proof and operations | Demos, receipt language, audit export, attribution |
| **C** | Scale foundations | Multi-day trace, multi-repo/env, retention, query model |
| **D** | Technical hygiene | Deprecations, doc/runtime drift, fragile edge cases |

---

## P0 — Safety hardening (first gate)

| ID | Priority | Workstream | Item | Owner | Status |
|----|----------|------------|------|-------|--------|
| A1 | P0 | A | **Ingress validation** — schema, size, depth, batch limits; failures operator-readable; tests for oversize / malformed. Touch: `src/lib/ingress-schema.ts`, `src/app/api/ingress/openclaw/route.ts`. | | Not started |
| **A2** | P0 | A | **Untrusted proposal surfaces — thesis-risk.** **`POST /api/events`** and **`POST /api/drafts/content`** are **not** signed ingress. **Mitigated:** set **`JARVIS_ALLOW_EVENTS_AND_DRAFTS_PROPOSAL_APIS=false`** → both POST handlers return **403** (`local_proposal_apis_disabled`); default **on** for local/scripts. Hosted prod should set **false** and use **`POST /api/ingress/openclaw`** only. Touch: `src/lib/local-proposal-apis.ts`, `src/app/api/events/route.ts`, `src/app/api/drafts/content/route.ts`, [roadmap 0001 § surface table](./0001-technical-roadmap-production.md). | | Mitigated (env gate) |
| A3 | P0 | A | **Execution allowlist + workspace boundaries** — policy + execution scope + adapter behavior aligned; expanded deny-path tests. Touch: `src/lib/policy.ts`, `src/lib/execution-scope.ts`, `src/app/api/execute/[approvalId]/route.ts`. | | Not started |
| A4 | P0 | A | **Server-side irreversible gates** — high-risk kinds cannot execute on UI confirmation alone; policy / preflight / step-up as designed. Touch: `src/lib/risk.ts`, execute route, `docs/execution-scope.md`. | | Not started |
| A5 | P0 | A | **API trust boundary** — with auth enabled, no inconsistent session requirements between proxy and handlers for sensitive reads/writes. Touch: `src/proxy.ts`, gated routes (`/api/activity/stream`, approvals, actions, execute). | | Not started |
| A6 | P0 | A | **Approval-plane bypass detection** (not only prevention) — inventory and test **any** route that can enqueue “executable-shaped” state or run adapters without the normal approval → execute chain; static checklist + optional automated probe (e.g. extend `pnpm auth-posture` / `machine-wired` class); CI or doc gate for new `/api` routes. | | Not started |

### P0 — Done when (aggregate)

- [ ] **Appendix A** matrix filled with owner + disposition for every route (**this revision**).  
- [ ] Matrix completed: every externally reachable **write** and **execute** path mapped to A1–A6 with owner sign-off  
- [x] **A2** — env gate: **`JARVIS_ALLOW_EVENTS_AND_DRAFTS_PROPOSAL_APIS=false`** disables **`POST /api/events`** and **`POST /api/drafts/content`** (403); default on for local/scripts; docs in `README`, `docs/setup/env.md`, `env.example`  
- [ ] **A6** produces an artifact (doc table + test/probe output) updated when API surface changes  

---

## P1 — Demo reliability and receipt truth

| ID | Priority | Workstream | Item | Owner | Status |
|----|----------|------------|------|-------|--------|
| B1 | P1 | B | **Demo reliability sweep** — golden loops + runbook steps pass repeatedly; reduce operator interpretation. Touch: `scripts/golden-loop-*.mjs`, `docs/video/investor-demo-rehearsal-run-sheet.md`, [buyer-proof pass](../strategy/research-batch-v1-buyer-proof-demo-pass.md). | | Not started |
| B2 | P1 | B | **Receipt language consistency** — single source for dry-run vs live across panels (`execution-surface` + consumers); no “truth-adjacent” labels. Touch: `src/lib/execution-surface.ts`, `ActionsPanel`, `ApprovalsPanel`, Activity surfaces. | | Not started |

### P1 — Done when

- [ ] B1: defined “green path” script list + **pass/fail** recorded per release candidate  
- [ ] B2: UI audit checklist completed; contradictions filed as bugs with AC  

---

## P2 — Enterprise proof features

| ID | Priority | Workstream | Item | Owner | Status |
|----|----------|------------|------|-------|--------|
| **B3a** | P2 | B | **Audit export — schema frozen** — **`schemaVersion`** + `AUDIT_EXPORT_SCHEMA_VERSION` in `src/lib/audit-export.ts`; snapshot envelope test; response header `X-Jarvis-Audit-Export-Schema`; docs. | | Done |
| **B3b** | P2 | B | **Audit export — operator bundle flow proven** — [Audit export — operator proof](../runbooks/audit-export-operator-proof.md) + pilot checklist §3 (`schemaVersion` jq line). | | Done |
| B5 | P2 | B | **Attribution contract** — approve / execute (and principals when bound) on events and in export; gaps documented. Touch: `src/lib/governed-human-principal.ts`, `src/app/api/approvals/[id]/route.ts`, execute route, export. | | Not started |

### P2 — Done when

- [x] B3a: export schema versioned; breaking change requires doc + test bump  
- [x] B3b: one operator can produce a bundle from runbook without ad-hoc tooling  
- [ ] B5: attribution fields defined in a short contract doc + export includes them  

---

## P3 — Scale and topology

| ID | Priority | Workstream | Item | Owner | Status |
|----|----------|------------|------|-------|--------|
| C1 | P3 | C | **Multi-day trace lookup — ADR** — pick **widen approvals API**, **targeted trace-by-id fetch**, or **explicit non-goal**. **Requirement:** any response used for trace ↔ receipt alignment **declares machine-readable search scope** (e.g. `dateKeysScanned`, `approvalsDateKey`, `traceFoundInApprovalsPayload: boolean`) so fallback behavior is **verifiable** in tests and logs, not only explained in copy. Touch: `src/app/api/approvals/route.ts`, `pickExecutedReceiptCardEvent` consumers, trace APIs. | | Not started |
| C2 | P3 | C | **Multi-repo / multi-environment** — `JARVIS_REPO_ROOT`, `JARVIS_EXEC_ALLOWED_*`, tenancy or env labels; policy by environment deferred or scoped in ADR. | | Not started |
| C3 | P3 | C | **Retention** — events, actions, artifacts; max age / size; redaction; no silent unbounded growth in prod configs. | | Not started |

### P3 — Done when

- [ ] C1: ADR merged; APIs or UI expose scope fields where applicable  
- [ ] C2–C3: either implemented or **explicitly** scoped out with owner approval  

---

## P4 — Technical cleanup

| ID | Priority | Workstream | Item | Owner | Status |
|----|----------|------------|------|-------|--------|
| D1 | P4 | D | **Build / runtime hygiene** — e.g. Node `DEP0205` (`module.register`), Next/Turbopack warnings; track upgrades or suppression policy. | | Not started |
| D2 | P4 | D | **Doc / runtime drift** — investor paths vs app (`/demo`, pitch docs); periodic diff checklist. | | Not started |

### P4 — Done when

- [ ] D1: CI or release notes track deprecation debt  
- [ ] D2: checklist run at least once per milestone  

---

## Near-term tranche (suggested execution order)

1. **A1–A6** — complete **Appendix A** safety audit matrix (owner + OK/Gap/Won’t fix per row) + **A2** resolution + **A6** bypass detection automation or CI hook as scoped  
2. **B1–B2** — demo reliability + receipt consistency  
3. **B3a / B3b / B5** — export schema freeze + operator bundle + attribution contract  
4. **C1** — ADR for multi-day trace lookup (with **declared search scope** in API contracts)  
5. **D1–D2** — hygiene cleanup  

---

## Workstream view (same items, grouped for parallel work)

### Workstream A — Trust and safety

- [ ] A1 Ingress validation  
- [ ] **A2** **Untrusted proposal surfaces (thesis-risk)**  
- [ ] A3 Execution allowlist + scope  
- [ ] A4 Irreversible server-side gates  
- [ ] A5 API trust boundary  
- [ ] A6 Approval-plane bypass **detection**  

### Workstream B — Proof and operations

- [ ] B1 Demo reliability  
- [ ] B2 Receipt language consistency  
- [ ] B3a Audit export schema frozen  
- [ ] B3b Operator bundle flow proven  
- [ ] B5 Attribution contract  

### Workstream C — Scale foundations

- [ ] C1 Multi-day trace ADR (+ machine-verifiable scope in responses)  
- [ ] C2 Multi-repo / multi-environment  
- [ ] C3 Retention  

### Workstream D — Technical hygiene

- [ ] D1 Deprecation / build hygiene  
- [ ] D2 Doc/runtime drift  

---

## Appendix A — Safety audit matrix (v0 draft, repo-backed)

**Purpose:** Close **A1–A6** with evidence. Update this table when routes or auth behavior change.

**Convention — `proxy` column:** When `JARVIS_AUTH_ENABLED` is **false**, `src/proxy.ts` passes all `/api` traffic (no cookie gate). Values below describe behavior when auth is **true** (see exemptions in `src/proxy.ts` lines 25–31).

**Convention — approval plane:** “**Chain**” means proposal enters with explicit human **approve** then **execute** (or equivalent documented gate). “**Bypass**” means durable queue or execution-shaped state without that chain (thesis-risk — see **A2**, **A6**).

### A. Read-only or low-risk GET (still map for A5 / data exfil)

| Route | `proxy` (auth on) | Handler session / identity | Sensitive read? | A-map | Initial | Owner |
|-------|-------------------|-----------------------------|-----------------|-------|---------|-------|
| `GET /api/config` | Exempt | No | Config surface | A5 | OK — intentional public | |
| `GET /api/auth/status` | Exempt | Uses cookie if present | Session | A5 | OK | |
| `GET /api/approvals` | Session required | No extra check in handler (`src/app/api/approvals/route.ts`) | Today’s approvals | A5 | **Investigate** — relies on proxy only | |
| `GET /api/approvals/[id]/preflight-snapshot` | Session required | No | Preflight snapshot | A5 | **Investigate** | |
| `GET /api/actions` | Session required | No | Receipts / action log | A5 | **Investigate** | |
| `GET /api/activity/stream` | Session required | No | Merged activity | A5 | **Investigate** | |
| `GET /api/traces/[traceId]` | Session required | No | Trace bundle | A5 | **Investigate** | |
| `GET /api/traces/[traceId]/replay` | Session required | No | Replay | A5 | **Investigate** | |
| `GET /api/traces/recent` | Session required | No | Recent ids | A5 | **Investigate** | |
| `GET /api/audit/export` | Session required | Verified session gate | Full audit JSON + `schemaVersion` | A5, B3 | **OK** — B3a/B3b: versioned envelope + runbook | |
| `GET /api/connectors/openclaw/health` | Session required | No | Health | A5 | OK | |
| `GET /api/proof-path` | Session required | Unknown | Proof hints | A5 | **Investigate** — confirm handler | |
| `GET /api/incidents` | Session required | Unknown | Incidents | A5 | **Investigate** | |
| `GET /api/alfred/status` | Session required | No | Log tail | A5 | OK | |

### B. Writes, side effects, and ingress (approval-plane focus)

| Route | Methods | Effect | `proxy` (auth on) | Handler auth / gate | Approval plane | A-map | Initial | Owner |
|-------|---------|--------|-------------------|---------------------|------------------|-------|---------|-------|
| `POST /api/ingress/openclaw` | POST | Append pending events | **Exempt** (HMAC ingress) | HMAC + schema + policy ingress rules | **Chain** — pending only per ADR-0004 | A1, A3 | OK — not cookie session | |
| `POST /api/approvals/[id]` | POST | Approve / deny | Session required | Session + principal resolution (`src/app/api/approvals/[id]/route.ts`) | **Chain** | A4, A5 | OK | |
| `POST /api/execute/[approvalId]` | POST | Execute adapter | Session required | Session + step-up + policy + gate + SoD (`src/app/api/execute/[approvalId]/route.ts`) | **Chain** | A3, A4, A5 | OK | |
| `POST /api/preflight` | POST | Preflight evaluation | Session required | Session (`src/app/api/preflight/route.ts`) | Supports chain, does not execute | A4, A5 | OK | |
| `POST /api/auth/init` | POST | Session cookie | **Exempt** | N/A | N/A | A5 | OK | |
| `POST /api/auth/step-up` | POST | Step-up | Session required | Session | N/A | A5 | OK | |
| `POST /api/auth/oidc/stub-bind` | POST | Bind principal | Session required | Stub guard env | N/A | A5 | **Investigate** — dev-only surface | |
| `POST /api/events` | GET+**POST** | **POST** writes `events/{date}.json` | Session required when auth on | **No** auth in handler (`src/app/api/events/route.ts`); **403** when `JARVIS_ALLOW_EVENTS_AND_DRAFTS_PROPOSAL_APIS=false` | **Bypass** when env allows — unsigned proposal creation (**A2**, **A6**) | **A2**, A6 | **Mitigated** — strict: env false; **Gap** if left default on in prod | |
| `POST /api/drafts/content` | POST | Writes proposal-shaped events | Session required when auth on | **No** auth in handler (`src/app/api/drafts/content/route.ts`); **403** when `JARVIS_ALLOW_EVENTS_AND_DRAFTS_PROPOSAL_APIS=false` | **Bypass** when env allows — UI/demo path (**A2**, **A6**) | **A2**, A6 | **Mitigated** — strict: env false; **Gap** if left default on in prod | |
| `POST /api/reflections` | POST | Writes reflection / events | Session required when auth on | **No** session check in handler (`src/app/api/reflections/route.ts`) | **Partial** — creates work from prior execute; confirm policy | A6 | **Investigate** | |
| `POST /api/recovery/verify` | POST | Writes verification state | Session required when auth on | **No** handler auth (`src/app/api/recovery/verify/route.ts`) | Post-execute operator mark | A6 | **Investigate** | |
| `POST /api/reset/today` | POST | Archives day files | Session required when auth on | **`x-jarvis-reset: YES`** header — not session identity | **Bypass** of normal UX — operator secret | A6 | **Gap** — document + restrict | |
| `POST /api/os/open` | POST | **`open` process** (Finder/Cursor) | Session required when auth on | Path allowlist only (`src/app/api/os/open/route.ts`) | **Side effect** outside Jarvis files | A3, A6 | **Gap** — OS spawn | |

### C. `GET /api/events`

| Route | Effect | `proxy` | Handler | Approval plane | A-map | Initial | Owner |
|-------|--------|---------|---------|------------------|-------|---------|-------|
| `GET /api/events` | Read today’s events | Session when auth on | No | Read | A5 | **Investigate** | |

### D. Matrix completion (A6 deliverable)

- [ ] Every row above has **Owner** + **Initial** resolved to **OK**, **Gap** (with ticket/ADR), or **Won’t fix** (with explicit prod stance)  
- [ ] New `src/app/api/**/route.ts` files added since this revision are **appended** within one release  
- [ ] Optional: automated inventory test that fails if an unlisted API route ships (link from CI doc when built) — **`tests/unit/api-route-surface-manifest.test.ts`** (update manifest when adding `src/app/api/**/route.ts`)

---

## Owner / status (how to use this doc)

| Field | Guidance |
|-------|----------|
| **Owner** | Single DRI per row (person or team); leave blank until assigned |
| **Status** | `Not started` · `In progress` · `Blocked` · `Done` — update in place; link PRs in row footnotes if helpful |

---

## Friction log

Buyer-proof or operator sessions: append rows to [Research batch workflow — friction log](../strategy/research-batch-workflow-v1.md#friction-log-after-rehearsals) when this punch list surfaces UX or comprehension gaps.
