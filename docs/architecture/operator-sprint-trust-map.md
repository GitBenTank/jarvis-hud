---
title: "Operator sprint — trust strip & repo map"
status: "draft"
category: architecture
related:
  - openclaw-v1-contract.md
  - ../strategy/jarvis-hud-video-thesis.md
  - control-plane.md
  - ../decisions/0001-thesis-lock.md
  - ../decisions/0003-execution-policy-v1.md
---

# Operator-usability sprint: file map + trust-strip contract

**Goal:** operator-usability sprint focused on legibility.

**Constraint (Thesis Lock):** every trust signal shown in the HUD must map to a **real enforced check** already present in the execution or ingress path, or be labeled **inferred / informational** until substrate exists.

**Outputs in this doc:**

1. Repo-specific map for priority themes **1–5** (trust strip, approval review, policy explainability, trace UX, mode clarity).
2. **Trust-strip contract:** signal names, semantics, sources, state rules, enforcement vs inference, UI ownership.
3. **Substrate gaps** where the UI cannot yet be honest without a small API or data change.
4. **Suggested implementation order.**

---

## 1. Trust-strip contract

### State legend

| State | Meaning |
|-------|--------|
| **green** | Precondition satisfied; boundary/enforcement is in a “go” posture for that dimension. |
| **yellow** | Degraded, optional, or “attention” — not a hard fail, or scope not engaged. |
| **red** | Hard fail or boundary would block the relevant path (ingress or execute). |
| **unknown** | Client could not load data, or server cannot compute without request context. |

### Signals (v1 — implement in this order)

| Signal ID | What it means | Source (file / route / function) | Green | Yellow | Red | Unknown | Enforced in code today? | UI owner (suggested) |
|-------------|----------------|-----------------------------------|-------|--------|-----|---------|-------------------------|------------------------|
| `ingress.openclaw` | OpenClaw ingress endpoint is configured to accept **signed** proposals (`JARVIS_INGRESS_OPENCLAW_ENABLED`, secret length ≥ 32, connector allowlist contains `openclaw`). | `src/lib/ingress-openclaw.ts` — `isIngressEnabled()`, `getIngressSecret()`, `getConnectorAllowlist()`; exposed in `GET /api/config` as `ingressOpenclawEnabled`, `openclawAllowed`. Ingress rejects when off: `src/app/api/ingress/openclaw/route.ts`. | `ingressOpenclawEnabled && openclawAllowed` | — | Ingress disabled, secret invalid/missing, or connector not allowlisted | Config fetch failed | **Yes** — 403 on `POST /api/ingress/openclaw` | `TrustPostureStrip` — **Ingress** and **Connector** pills (two booleans; no inference) |
| `ingress.validation` | Strict OpenClaw proposal validation (size, shape, kinds) is enabled vs relaxed path. | `src/app/api/ingress/openclaw/route.ts` (`JARVIS_INGRESS_OPENCLAW_VALIDATE`); `src/lib/ingress/validate-openclaw-proposal.ts`; `GET /api/config` → `ingressValidationEnabled` | `ingressValidationEnabled === true` | Validation off but ingress still requires HMAC + allowlist | — (optional: treat “off” as yellow for operators) | Config fetch failed | **Yes** — validation branches in ingress route | `ModePills` (transitional) — **Ingress validation** pill; not duplicated on `TrustPostureStrip` |
| `auth.boundary` | Password/session gate is configured for the HUD. | `src/lib/auth.ts` — `isAuthEnabled()`; `GET /api/config` → `authEnabled` | `authEnabled === false` (no gate) **or** `authEnabled === true` with valid session | — | `authEnabled === true` but misconfigured secret (server 500 / `AuthConfigError`) | Config fetch failed | **Yes** — execute route requires session when auth on: `src/app/api/execute/[approvalId]/route.ts` | `TrustPostureStrip` — **Auth** pill |
| `auth.step_up` | For the **current browser session**, step-up is satisfied for high-risk execution (when auth enabled). | `src/lib/auth.ts` — `isStepUpValid()`; `GET /api/config` computes `trustPosture.stepUpValid` from **request cookies** (`NextRequest` in route). | Auth off → strip shows **Step-up: N/A** (when `trustPosture` present); auth on and TTL valid → **Valid**; auth on, not stepped up → **Required** | Auth on, not stepped up (execute will 403 policy) | Same as yellow for strip purposes | Config fetch failed, or `trustPosture` absent/malformed → omit step-up pills (no guessing) | **Yes** at execute/preflight; **Yes** on `GET /api/config` for browser clients using `credentials: "include"` | `TrustPostureStrip` — **Step-up** pill(s) |
| `policy.kind_allowlist` | Action kind is permitted for execution (global list). | `src/lib/policy.ts` — `ALLOWED_KINDS`, `isAllowedKind()`; `evaluateExecutePolicy()`; ingress also checks kind | N/A per-strip aggregate; use **per-action** preflight. For strip: assume **green** if HUD loaded | — | — | — | **Yes** | Strip optional: “Policy engine: active”; detail in approval UI |
| `execution.gate` | Approved proposal has required actor chain before adapters run. | `src/lib/execution-gate.ts` — `validateExecutionPreconditions()`; `src/app/api/execute/[approvalId]/route.ts` | Implicit green when no execute attempted; **per approval** | — | Gate failure codes on execute | — | **Yes** | Per-proposal UI (`ApprovalsPanel` / execute errors); optional aggregate “no stuck approvals failing gate” (inferred) |
| `policy.execute` | Execute-time policy (allowlist + step-up + code.apply preflight) passes for a given run. | `src/lib/policy.ts` — `evaluateExecutePolicy()`; log `src/lib/policy-decision-log.ts` | Per trace / last decision | — | Deny logged / API error with `reasonDetails` | — | **Yes** | `TracePanel`, activity stream, execute error UI; strip can show **latest deny reason** from `buildRuntimePosture` → `latestBlockReason` (`src/lib/runtime-posture.ts` + `GET /api/config`) |
| `execution.scope` | Filesystem blast-radius guard: targets must sit under configured roots when env is set. | `src/lib/execution-scope.ts` — `loadExecutionAllowedRoots()`, `validateExecutionScopeTargets()`; `src/app/api/execute/[approvalId]/route.ts`; `GET /api/config` → `trustPosture.executionScopeEnforced` | Roots non-empty → **Enforced**; roots empty → **Open** (backward compatible) | — | Scope violation → 400/403 with `execution_scope_denied` | `trustPosture` missing / bad shape → omit **Scope** pill | **Yes** when roots non-empty | `TrustPostureStrip` — **Scope** pill |
| `code_apply.repo` | For `code.apply`, repo root set, git clean enough, etc. | `src/lib/code-apply.ts` — `getCodeApplyBlockReasons()`, `isCodeApplyAvailable()`; `GET /api/config` → `codeApplyAvailable`, `trustPosture.codeApplyBlockReasons` | `codeApplyAvailable && reasons.length === 0` | `codeApplyAvailable` false or reasons non-empty | No repo / not a git repo | — | **Yes** at execute via policy | `TrustPostureStrip` — **Apply** pill + optional **Apply detail** tooltip when `codeApplyBlockReasons` is a non-empty string array |
| `execution.dry_run` | Whether executed adapters mutate external state vs local artifacts only. | `src/app/api/execute/[approvalId]/route.ts` — response `dryRun: executionKind !== "code.apply"`; `src/lib/execution-surface.ts` — `buildExecutionCapabilities()`; `GET /api/config` → `runtimePosture.executionCapabilities`, `trustPosture.executionSurfaceLabel` | Honest labeling **per kind** | — | — | — | **Yes** | **Surfaced** — no global “HUD is dry-run” claim |
| `safety.irreversible_ui` | UI requires typed confirmation for high-risk kinds before execute. | `src/lib/risk.ts` — `requiresIrreversibleConfirmation`, etc.; `src/components/SafetyGatePanel.tsx`, `ApprovalsPanel.tsx` | Confirm enabled (`JARVIS_UI_CONFIRM_IRREVERSIBLE` / `JARVIS_IRREVERSIBLE_CONFIRM_ENABLED` not `false`) | — | — | — | **UI enforcement** (not server-only) | `SafetyGatePanel` + strip mirror of `irreversibleConfirmEnabled` from config |

### Substrate gaps (honesty blockers)

**Resolved in code (canonical posture on `GET /api/config`):**

- `runtimePosture.executionCapabilities` + `trustPosture.executionSurfaceLabel` replace the misleading global `mode: "dry-run"` (removed).
- `trustPosture.stepUpValid` (cookie-aware; browser strip uses `credentials: "include"`). **CLI / cookieless** clients still do not get meaningful step-up from `GET /api/config` alone — treat as unknown there, not as “Valid.”
- `trustPosture.executionScopeEnforced` from `loadExecutionAllowedRoots().length > 0`.
- `trustPosture.codeApplyBlockReasons` from `getCodeApplyBlockReasons()`.

**UI rule (anti-drift):** if a field is not present or fails strict parsing on the client, **do not** render that pill — no placeholder pretending the server said something.

**Remaining / optional:**

- Dedicated `GET /api/runtime-health` if non-browser clients need posture without full config.
- Further **per-kind** surface labels if more kinds become non–dry-run in execute.

---

## 2. Priority theme 1 — Runtime trust strip (implementation map)

| Piece | Role | Location |
|-------|------|----------|
| Config / posture aggregation | Single read model for strip | `src/app/api/config/route.ts`, `src/lib/runtime-posture.ts` |
| Ingress enforcement | HMAC, nonce, allowlist, validation | `src/app/api/ingress/openclaw/route.ts`, `src/lib/ingress-openclaw.ts`, `src/lib/ingress/validate-openclaw-proposal.ts` |
| Policy at execute | Allowlist, step-up, code.apply preflight | `src/lib/policy.ts`, `src/app/api/execute/[approvalId]/route.ts` |
| Execution gate | Approval chain | `src/lib/execution-gate.ts` |
| Existing HUD hints | Counts, agent idle | `src/components/StatusStrip.tsx` |
| **Trust / boundary strip (glanceable)** | Ingress, connector, auth, apply, optional block reason; `trustPosture` pills when keys valid | `src/components/TrustPostureStrip.tsx` — mounted **above** `MissionStrip` on `src/app/page.tsx` |
| **Transitional env toggles** | Safety confirm + ingress validation (not duplicated on strip) | `src/components/ModePills.tsx` (dark bar next to `ExecutionAuthorityBanner`) |
| Safety gate state | Risk-based green/amber/red | `src/components/SafetyGatePanel.tsx` |

**UI structure (shipped):** `TrustPostureStrip` is the primary **boundary posture** surface; `StatusStrip` stays **throughput**; `ModePills` avoids duplicating trust signals already on the strip.

**Implementation status (theme 1):**

1. ~~Extend `GET /api/config` with honest fields~~ — done: `trustPosture` (`stepUpValid`, `executionScopeEnforced`, `codeApplyBlockReasons`, `executionCapabilities`, `executionSurfaceLabel`); `runtimePosture` includes `latestBlockReason`, `executionCapabilities`.
2. ~~`TrustPostureStrip` on home~~ — done: first operational block under the page header, above `MissionStrip` and the proposals row.
3. ~~`ModePills` alignment~~ — done: only **Safety** and **Ingress validation**; execute/auth/step-up/scope live on `TrustPostureStrip`.

### Suggested manual QA — `TrustPostureStrip`

Run the home page with `GET /api/config` succeeding and exercise:

- **Ingress** off (env/secret) vs on; **Connector** off allowlist vs on.
- **Auth** off (expect **Step-up: N/A** when `trustPosture` loads) vs on.
- **Auth** on without step-up cookie vs with valid step-up (expect **Required** vs **Valid**).
- **Apply** blocked vs available; when blocked, confirm **Apply detail** tooltip lists `codeApplyBlockReasons` only if the array is non-empty.
- **Malformed / missing `trustPosture`:** strip should omit trust-bundle pills, not invent values (V1A top-level pills still follow strict `typeof` checks).
- **`runtimePosture.latestBlockReason`:** present (policy deny reason) vs absent — **Block** chip appears only for a non-empty string.

---

## 3. Priority theme 2 — Approval review upgrade

| Capability | Already in repo | Where to extend |
|------------|-----------------|-----------------|
| Preflight (policy simulation) | `POST /api/preflight/route.ts`, `evaluatePreflightPolicy()` | `src/components/ApprovalsPanel.tsx` (already fetches preflight in places — deepen “checklist” UI) |
| Risk level | `getRiskLevel()` in preflight, `src/lib/risk.ts` | Chips + copy in `ApprovalsPanel` |
| Expected outputs | `expectedOutputs()` in preflight | Surface explicitly as checklist |
| code.apply block reasons | `getCodeApplyBlockReasons()` | Already plumbed into policy; show as **touched paths / rollback** when execute returns `rollbackCommand`, `filesChanged` (`ApprovalsPanel` execute result types) |
| Irreversible confirmation | `requiresIrreversibleConfirmation()`, `SafetyGatePanel` | Tighter coupling between preflight summary and execute button states |

**Files:** `src/components/ApprovalsPanel.tsx`, `src/components/AgentProposalsFeed.tsx`, `src/lib/risk.ts`, `src/app/api/preflight/route.ts`.

---

## 4. Priority theme 3 — Policy explainability

| Capability | Location |
|------------|----------|
| Machine-readable reasons | `src/lib/reason-taxonomy.ts` — `ReasonDetail`, `reasonFromPolicyReason()` |
| Persisted decisions | `src/lib/policy-decision-log.ts`, files via `src/lib/storage.ts` |
| Execute-time evaluation + log | `src/lib/policy.ts` — `evaluateExecutePolicy()` |
| API error payload | `POST .../execute` returns `reasonDetails` |
| Trace / activity | `src/app/api/traces/[traceId]/route.ts`, `src/app/api/activity/stream/route.ts`, `src/components/TracePanel.tsx` |

**UI work:** ensure deny/allow paths always surface `rule` + human summary from `reasonDetails` (not only `error` string). `ApprovalsPanel` already types `ReasonDetail[]` on errors.

---

## 5. Priority theme 4 — Trace playback UX

| Capability | Location |
|------------|----------|
| Trace API | `src/app/api/traces/[traceId]/route.ts` |
| Replay / merge | `src/lib/trace-replay.ts` |
| UI | `src/components/TracePanel.tsx`, `src/context/TraceContext.tsx` |
| Policy on trace | Policy decisions merged in trace route; `TracePanel` policy sections |

**Direction:** narrative ordering is already partly there; tighten labels to match governance story: proposal → verified → approved → policy → executed → artifacts (map to existing event types in route + panel). Implementation and manual QA should satisfy the checklist below (not an ADR — an operator-facing acceptance contract).

### Trace legibility checklist (operator UX acceptance)

Use **`TracePanel`** + **`GET /api/traces/[traceId]`** (and activity/replay as needed). Without reading code or external narration, an operator should be able to answer:

- [ ] **Who proposed** — actor/agent/source for the originating proposal event.
- [ ] **Who approved** — human (or system) approval identity when an approval step exists.
- [ ] **What policy said** — allow/deny and rule or summary tied to logged policy decisions for this trace.
- [ ] **What actually ran** — executed action kinds / adapter outcome, not confused with proposal-only state.
- [ ] **What was produced** — artifacts, file changes, or explicit “nothing executed” when applicable.
- [ ] **Where the proof lives** — paths, trace id, receipt/log pointers the operator can follow (e.g. artifact paths, links to the same trace).

**Blocked, denied, or aborted paths**

- [ ] The **reason shown in the UI** matches the **reason recorded** by the API / persisted logs / policy decision for that trace (same rule id or same human-readable line — no generic “failed” when a specific deny reason exists).

**How to use this doc**

- Treat unchecked items as **backlog** for `TracePanel`, trace API payload shape, and labels — implement until the checklist passes on representative traces (happy path, policy deny, execute error).

### Trace legibility — gap list (issue-ready)

**Method:** Initial pass = **static review** of `TracePanel` + `GET /api/traces/[traceId]` response shape vs the checklist (not yet validated against 2–3 live traces). When you QA, add a **Trace id** column or prefix each row with the real id.

**Suggested issue row shape**

| Field | Purpose |
|-------|---------|
| **Trace id** | Real uuid from QA (or scenario label until then). |
| **Checklist item** | Which bullet from the checklist fails. |
| **Observed** | What the operator sees vs what they need. |
| **Source** | File(s) or API field. |
| **Fix** | One concrete change. |
| **Severity** | P0–P3 or High/Med/Low. |

**Initial gaps (fill `Trace id` during QA)**

| Trace id | Checklist item | Observed | Likely source | Recommended fix | Severity |
|----------|----------------|----------|---------------|-----------------|----------|
| *TBD — verify in QA* | What policy said; blocked path reason | **Mitigated (code):** Policy lifecycle includes **Effect**, **Rule**, **Reason** (persisted log text). Trace health strip shows deny/block reason in red (full wrap) or allow reason truncated with `title`. Re-verify with a real deny trace id. | `src/components/TracePanel.tsx` — `lifecycleSteps` policy branch, `policyHealthSecondaryLine`, trace health row | Close after QA attaches trace id. | — |
| *TBD — verify in QA* | What policy said | **Mitigated (code):** “Policy decision(s)” block renders when `policyDecisions.length >= 1` (single decision no longer hidden). | `TracePanel.tsx` | Close after QA on one-decision trace. | — |
| *TBD — execute failure* | What actually ran; blocked/deny parity | Execution stage for `failedAt` is only **“Failed”** + timestamp — no **execute error / reasonDetails** string if the event or action log carries it. Checklist asks UI to match logged API reason. | `TracePanel.tsx` (~778–788); event payload from execute path | Plumb failure reason from persisted event/action (if present) into the Execution stage and timeline; fall back to “see action log” only if truly absent. | Med |
| *TBD — any approved path* | Who approved | Approver column and approval stage fall back to **“Human”** when `approvalActorLabel` / `approvalActorId` missing — reads as identity, not uncertainty. | `TracePanel.tsx` (~721, ~633–635); persistence on approve | If unknown, show **“Unknown (check audit)”** or omit label; ensure `POST` approve/execute paths persist actor fields consistently (`src/app/api/approvals/...`, events merge in trace route). | Med |
| *TBD — system.note success* | What was produced; where proof lives | Non-file kinds may leave **artifact/receipt paths empty**; UI can look “empty” without explaining that **the note content is the proposal/event payload**. | `TracePanel.tsx` receipt/artifact sections | For kinds without paths, add an explicit **“Output: in-event note”** (or similar) and surface `summary`/payload snippet so “produced” is legible. | Med |
| *TBD — multi-event trace* | Who proposed / ordering | **Primary** trace row is `sortedEvents[0]` (earliest by time heuristic). Messy traces with retriggers may not match operator mental model of “the” proposal. | `TracePanel.tsx` `sortedEvents`, `primaryEvent` | Document selection rule in UI microcopy; consider pinning “primary proposal” explicitly when multiple proposal-shaped events exist. | Low |

**QA sweep to run next**

1. One successful **`system.note`** (happy path).
2. One **policy deny** or ingress/execute block with a **known logged reason**.
3. One **older or noisy** trace (multi-event or missing actor fields), if available.

After the sweep, replace *TBD* trace ids, add rows, or mark gaps **closed** with PR links. **Not more design first** — validate mitigated rows with real ids, then file/fix what still fails.

**Recommended fix order for remaining gaps** (trust impact)

1. Execute failure text — parity with logged/API reason (`failedAt` / action log).
2. Approver fallback — avoid fake **“Human”**; persist or label unknown honestly.
3. Multi-event primary — selection rule + microcopy (or explicit primary proposal).
4. `system.note` output copy — explicit in-event output when no file paths (polish after 1–3).

---

## 6. Priority theme 5 — Mode clarity (demo vs live vs dry-run)

| Topic | Location | Note |
|-------|----------|------|
| Demo seed / drafts | `src/components/DraftsPanel.tsx` (`DEMO_SEED`) | Label as demo path in UI |
| Global HUD “mode” | Removed | Do not resurrect a single `mode: "dry-run"` on `GET /api/config`; use `executionCapabilities` + `trustPosture.executionSurfaceLabel` (`src/lib/execution-surface.ts`, strip **Execute** pill). |
| Per-adapter dry run | `src/app/api/execute/[approvalId]/route.ts`, `src/lib/normalize.ts` | Execute response `dryRun`; strip summarizes surface from config |
| System status / archive demo | `src/components/SystemStatus.tsx`, `src/app/api/proof-path/route.ts` | Keep explicit “demo data” language |

---

## 7. Sacred choke points (keep centralized)

| Concern | File |
|---------|------|
| Execute-time policy | `src/lib/policy.ts` |
| Approval chain before adapters | `src/lib/execution-gate.ts` |
| Ingress verification | `src/app/api/ingress/openclaw/route.ts` + `src/lib/ingress-openclaw.ts` |
| Storage paths | `src/lib/storage.ts` (future: split concerns per Alfred note — not blocking strip v1) |

---

## 8. Thesis Lock cross-check

This sprint strengthens **human authority**, **approval ≠ execution**, and **receipts/traces** without granting the model execution. Trust signals must **not** imply the model is trusted; they describe **enforcement posture** and **last known policy outcome**. If a signal cannot be tied to enforcement, ship it as **unknown** or **informational**, not green.

---

## See also

- [Control plane architecture](./control-plane.md)
- [OpenClaw ↔ Jarvis trust contract](./openclaw-jarvis-trust-contract.md)
- [Thesis Lock — `docs/strategy/jarvis-hud-video-thesis.md`](../strategy/jarvis-hud-video-thesis.md#thesis-lock-do-not-drift)
- [ADR-0003: Execution Policy v1](../decisions/0003-execution-policy-v1.md)
