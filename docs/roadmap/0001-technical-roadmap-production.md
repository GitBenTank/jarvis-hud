# Jarvis HUD Technical Roadmap: Demo → Safe AI Agent Control Plane

**Status:** Draft  
**Date:** 2026-02  
**Owner:** Ben Tankersley  
**Related:** [Master Plan](./0000-master-plan.md) · [Agent Execution Model](../security/agent-execution-model.md) · [ADR-0001: Thesis Lock](../decisions/0001-thesis-lock.md)

---

## SECTION 1 — Current Architecture Summary

Based on repository analysis.

### 1.1 Data Flow

```
LLM (OpenClaw) → jarvis_propose_* tool → POST /api/ingress/openclaw (HMAC)
    → events/{date}.json (pending)
    → Human Approve (POST /api/approvals/[id])
    → Human Execute (POST /api/execute/[approvalId])
    → Policy check → Adapter → actions/{date}.jsonl + artifact
```

### 1.2 Ingress Layer

- **Endpoint:** `POST /api/ingress/openclaw`
- **Auth:** HMAC-SHA256 (X-Jarvis-Timestamp, X-Jarvis-Nonce, X-Jarvis-Signature)
- **Replay:** Nonce cache (LRU ~2000), timestamp window (5 min past, 2 min future)
- **Allowlist:** `JARVIS_INGRESS_ALLOWLIST_CONNECTORS` (comma-separated)
- **Payload sanitization:** Strips `status`, `requiresApproval`, `executedAt`, etc. from ingress body
- **Rate limit:** 60 req/min per IP (fixed window)
- **Feature flag:** `JARVIS_INGRESS_OPENCLAW_ENABLED=true`; off by default

### 1.3 Execution Policy (Policy v1)

- **Location:** `src/lib/policy.ts`
- **Allowed kinds:** `content.publish`, `reflection.note`, `system.note`, `code.diff`, `code.apply`, `youtube.package`
- **Gates:** Kind allowlist, step-up (when auth enabled), code.apply preflight (JARVIS_REPO_ROOT, clean worktree)
- **Invariant:** Policy blocks before any adapter runs

### 1.4 Execution Adapters

| Kind | Output | Irreversible |
|------|--------|--------------|
| system.note | Markdown + manifest | No |
| reflection.note | Reflection artifact | No |
| code.diff | Diff bundle (no apply) | No |
| code.apply | Git commit | Yes |
| content.publish | Publish queue JSON | No |
| youtube.package | Package bundle | No |

### 1.5 Storage

- **Root:** `JARVIS_ROOT` (default `~/jarvis`)
- **Events:** `events/{dateKey}.json` (proposals, approvals)
- **Actions:** `actions/{dateKey}.jsonl` (receipts)
- **Artifacts:** Date-keyed directories per adapter
- **Path safety:** `ensurePathSafe` enforces no escape from JARVIS_ROOT

### 1.6 APIs

| Route | Purpose |
|-------|---------|
| GET/POST /api/events | Read/create events (no ingress auth) |
| GET /api/approvals?status= | List pending/approved/denied |
| POST /api/approvals/[id] | Approve or deny |
| POST /api/execute/[approvalId] | Execute (policy + adapters) |
| GET /api/actions | Action log (receipts) |
| GET /api/traces/[traceId] | Reconstruct trace (7-day lookback) |
| POST /api/ingress/openclaw | OpenClaw connector ingress |

### 1.7 UI Panels

- Agent Runtime Status, System Status, Today's Activity (Receipts)
- Agent Activity (mock), Runtime Control Plane, Execution Authority, Security Posture
- Trace Timeline (manual traceId lookup)
- Agent Proposals (pending + last executed), Execution Timeline, Executed Actions

### 1.8 Auth (Optional)

- `JARVIS_AUTH_ENABLED`; step-up for execution when enabled
- Middleware exempts ingress, auth/init, auth/status, config

---

## SECTION 2 — What Is Missing for a Production-Grade Control Plane

### 2.1 Safety Architecture

| Gap | Severity | Notes |
|-----|----------|-------|
| Irreversible action confirmation | High | code.apply modifies git; no explicit "this is irreversible" UX gate |
| Tool allowlists | Medium | Kind allowlist exists; no per-kind capability scoping (e.g. which files) |
| Sandbox boundaries | Medium | Paths scoped to JARVIS_ROOT; no explicit workspace isolation for adapters |
| Prompt injection mitigation | Medium | Payload sanitization strips keys; no content validation or injection checks |
| Proposal validation | Medium | Kind + body shape at ingress; no depth validation, size caps, or schema |

### 2.2 Control Plane Improvements

| Gap | Severity | Notes |
|-----|----------|-------|
| Execution policies (risk tiers) | Medium | Single allowlist; no low/medium/high or per-kind rules |
| Deterministic receipts | Low | Receipts exist; no content-addressable hashing or integrity proof |
| Trace timeline reconstruction | Medium | Trace API works; 7-day limit, manual lookup, no cross-day linking |
| Audit logs | Medium | Action log is append-only; no structured audit export or retention policy |

### 2.3 UX / Demonstration

| Gap | Severity | Notes |
|-----|----------|-------|
| Execution authority display | Low | Thesis Lock panel exists; could surface policy decisions inline |
| Proposal pipeline visibility | Low | Agent Proposals + Execution Timeline; trace ID not prominently linked |
| Trace ID linking | Low | Trace panel requires paste; no click-through from proposal to trace |
| Agent activity visualization | Low | Agent Activity uses mock events; no real-time ingestion |

### 2.4 Integration

| Gap | Severity | Notes |
|-----|----------|-------|
| OpenClaw integration hardening | Medium | Smoke works; no health check, version handshake, or degraded-mode handling |
| Agent identity verification | Medium | Connector allowlist only; no per-agent identity or binding |
| Telegram notification layer | Low | Telegram is OpenClaw-side; Jarvis has no notification API |

---

## SECTION 3 — Step-by-Step Roadmap with Milestones

### Milestone 1: Irreversible Action Confirmation (Weeks 1–2)

**Goal:** Explicit UX confirmation for code.apply and any future irreversible adapters.

**Steps:**
1. Add `irreversible: boolean` to policy config or adapter metadata.
2. UI: When executing irreversible kinds, show a dedicated confirmation step (e.g. "This will modify your working tree. Type 'EXECUTE' to confirm").
3. No API changes; purely UI gate before calling execute.
4. Feature flag: `JARVIS_UI_CONFIRM_IRREVERSIBLE` (default ON unless `"false"`).

**Deliverables:**
- [ ] Policy/adapter metadata for irreversible flag
- [ ] Confirmation modal for code.apply
- [ ] Optional typing challenge (configurable)

### Milestone 2: Proposal Validation Layer (Weeks 2–3)

**Goal:** Validate proposal payloads before persisting; reject malformed or oversized inputs.

**Steps:**
1. Add `src/lib/proposal-validation.ts` with:
   - Max payload size (e.g. 256KB)
   - Schema validation per kind (optional; start with size + key presence)
   - Reject payloads with suspicious patterns (e.g. `__proto__`, excessive nesting)
2. Call validation in ingress route before writing event.
3. Return 400 with structured reasons on failure.

**Deliverables:**
- [ ] Proposal validation module
- [ ] Ingress integration
- [ ] Unit tests

### Milestone 3: Risk Tiers (Policy v2) (Weeks 3–5)

**Goal:** Per-kind risk classification; high-risk requires step-up when auth enabled.

**Steps:**
1. Extend `src/lib/policy.ts` with risk tiers:
   - Low: system.note, reflection.note, code.diff
   - Medium: content.publish, youtube.package
   - High: code.apply
2. When auth enabled, high-risk execution requires step-up (already supported).
3. Add `JARVIS_POLICY_RISK_TIERS` (optional override; default from code).
4. UI: Show risk badge on proposal cards.

**Deliverables:**
- [ ] Risk tier config
- [ ] Policy integration
- [ ] UI risk badges

### Milestone 4: Trace ID Linking & Cross-Day Support (Weeks 4–5)

**Goal:** Click trace ID from proposal → Trace Timeline; support traces spanning multiple days.

**Steps:**
1. Trace API: extend lookback from 7 to 30 days (configurable).
2. UI: Proposal cards show trace ID as link; click opens Trace Timeline with traceId pre-filled.
3. Trace panel: accept traceId from URL query param (e.g. `?trace=uuid`).

**Deliverables:**
- [ ] Trace API lookback config
- [ ] Trace link in proposal cards
- [ ] URL param support in Trace panel

### Milestone 5: Tool Allowlists (Per-Kind) (Weeks 5–7)

**Goal:** Scope code.apply to allowed paths; block execution outside workspace.

**Steps:**
1. Add `JARVIS_CODE_APPLY_ALLOWED_PATHS` (glob or prefix list).
2. code.apply adapter: validate `files` against allowlist before apply.
3. Policy: return 400 if paths outside allowlist.
4. Document in env.example.

**Deliverables:**
- [ ] Path allowlist for code.apply
- [ ] Adapter integration
- [ ] Docs

### Milestone 6: Audit Log Export (Weeks 6–8)

**Goal:** Structured audit export for compliance and debugging.

**Steps:**
1. Add `GET /api/audit?dateKey=&format=json` (or similar).
2. Export: events + actions for date range, no raw payloads (summary only).
3. Optional: append-only audit file per day.
4. Auth: require session when auth enabled.

**Deliverables:**
- [ ] Audit API
- [ ] Export format (JSON)
- [ ] Retention note in docs

### Milestone 7: OpenClaw Health Check (Weeks 7–8)

**Goal:** Jarvis can verify OpenClaw connectivity; optional degraded-mode handling.

**Steps:**
1. OpenClaw: expose optional `GET /health` or equivalent.
2. Jarvis: add `GET /api/connectors/openclaw/status` that checks:
   - Ingress enabled
   - Last successful ingress (if we log it)
   - Config consistency
3. UI: optional "OpenClaw status" in System Status or Agent Runtime.

**Deliverables:**
- [ ] Connector status API
- [ ] Optional UI indicator

### Milestone 8: Optional Notification Webhook (Weeks 8–10)

**Goal:** Allow external systems (e.g. Telegram bot) to receive proposal/approval/execution events.

**Steps:**
1. Add `JARVIS_WEBHOOK_URL` (optional).
2. On proposal created, approved, executed: POST to webhook with event summary (no secrets).
3. Feature flag; fail open (log error, don't block).

**Deliverables:**
- [ ] Webhook module
- [ ] Config + docs

### Milestone 9: Replay Mode (Trace Playback) (Weeks 10–12)

**Goal:** Replay a trace event-by-event for debugging and demo.

**Steps:**
1. Trace API already returns events + actions in order.
2. UI: "Replay" button that steps through events with delay.
3. Read-only; no re-execution.

**Deliverables:**
- [ ] Replay UI component
- [ ] Trace API enhancement if needed

### Milestone 10: Agent Identity Binding (Future)

**Goal:** Per-agent identity beyond connector; allowlist agents by ID.

**Steps:**
1. Ingress body: optional `agentId` field.
2. Allowlist: `JARVIS_INGRESS_ALLOWED_AGENTS` (comma-separated).
3. Reject if agentId present and not in allowlist.

**Deliverables:**
- [ ] Agent allowlist
- [ ] Ingress validation

---

## SECTION 4 — Safe Implementation Strategy

### 4.1 Principles

1. **Additive only.** New modules, new routes, new UI components. Avoid refactoring working code.
2. **Feature flags.** Every new safety feature behind an env var; default to safe.
3. **Backward compatible.** Ingress and execute APIs remain stable; new optional fields only.
4. **Tests first.** Unit tests for policy, validation, allowlist; integration for critical paths.

### 4.2 Rollout Order

1. **UI-only changes first** (irreversible confirmation, trace links). No backend risk.
2. **Validation layers** (proposal validation). Fails fast at ingress; no execution path changes.
3. **Policy extensions** (risk tiers). Additive; existing behavior preserved when flag off.
4. **New APIs** (audit, connector status). Additive; no impact on existing flows.

### 4.3 Rollback Strategy

- Feature flags allow immediate disable.
- No schema migrations; storage format unchanged.
- New routes can be removed without touching core execute/approvals flow.

### 4.4 Testing Strategy

- **Unit:** policy, proposal-validation, path allowlist.
- **Integration:** `pnpm jarvis:smoke` remains green; add `pnpm test:integration` for full flow.
- **Manual:** Demo script unchanged; verify each milestone with existing OpenClaw setup.

---

## SECTION 5 — Estimated Timeline

**Assumption:** Solo developer, ~2–3 hours per day, 5 days/week.

| Milestone | Weeks | Effort (approx.) |
|-----------|-------|------------------|
| 1. Irreversible confirmation | 1–2 | 8–12 hrs |
| 2. Proposal validation | 2–3 | 6–10 hrs |
| 3. Risk tiers | 3–5 | 10–15 hrs |
| 4. Trace linking | 4–5 | 6–8 hrs |
| 5. Tool allowlists | 5–7 | 10–14 hrs |
| 6. Audit export | 6–8 | 8–12 hrs |
| 7. OpenClaw health | 7–8 | 4–6 hrs |
| 8. Notification webhook | 8–10 | 8–12 hrs |
| 9. Replay mode | 10–12 | 12–16 hrs |

**Total to Milestone 9:** ~12 weeks (3 months).

**Critical path for "safe enough to demo confidently":** Milestones 1–4 (≈5 weeks).

---

## SECTION 6 — Top 10 Highest-Impact Improvements

Ranked by impact on safety, demo quality, and production readiness.

| # | Improvement | Why High Impact |
|---|-------------|-----------------|
| 1 | **Irreversible action confirmation** | Directly addresses code.apply blast radius; aligns with OpenClaw safety audit recommendation for "explicit gating for irreversible actions." |
| 2 | **Trace ID click-through** | Makes pipeline visible in one click; strengthens demo narrative. |
| 3 | **Proposal validation** | Reduces prompt-injection and malformed-payload risk at ingress. |
| 4 | **Risk tiers (policy v2)** | Enables step-up and future per-kind rules; foundation for governance. |
| 5 | **Tool allowlists (path scoping)** | Limits code.apply to intended workspace; reduces confused-deputy risk. |
| 6 | **Agent Activity real-time feed** | Demo polish; replaces mock with real proposal/execution events. |
| 7 | **Audit export** | Compliance and debugging; minimal implementation, high trust value. |
| 8 | **OpenClaw health indicator** | Improves integration debuggability; low effort. |
| 9 | **Notification webhook** | Enables Telegram or Slack alerts; extends reach without coupling. |
| 10 | **Replay mode** | Debug and demo; visually reinforces trace integrity. |

---

## Appendix: Reference Documents

- [Agent Execution Model](../security/agent-execution-model.md)
- [ADR-0001: Thesis Lock](../decisions/0001-thesis-lock.md)
- [ADR-0003: Execution Policy v1](../decisions/0003-execution-policy-v1.md)
- [ADR-0004: Connector Ingress v1](../decisions/0004-connector-ingress-v1.md)
- [Trusted Ingress](../security/trusted-ingress.md)
- [OpenClaw Integration Verification](../openclaw-integration-verification.md)
