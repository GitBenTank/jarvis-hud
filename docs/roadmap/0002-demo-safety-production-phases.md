# Demo → Safety → Production Phases

**Status:** Draft  
**Date:** 2026-02  
**Related:** [0001 Technical Roadmap](./0001-technical-roadmap-production.md) · [0000 Master Plan](./0000-master-plan.md)

---

## Overview

Three phased layers to move from demo-ready boundary to safe-by-default control plane.

| Phase | Focus | Timeline |
|-------|-------|----------|
| Demo Layer | Current capability + polish | 1–2 weeks |
| Safety Layer | Hardening for irreversible actions | 2–4 weeks |
| Production Layer | Audit, replay, identity, multi-repo | 4–12 weeks |

---

## Phase 1: Demo Layer

**Goal:** Stable, demo-ready boundary layer with clear UX.

### Current Capability (Already Implemented)

- [x] OpenClaw ingress (HMAC, nonce, allowlist)
- [x] Proposal lifecycle (pending → approved → executed)
- [x] Approve → Execute → Receipts flow
- [x] `code.apply` with patch preview, audit metadata (patchSha256, treeBefore/After)
- [x] `system.note`, `code.diff`, `content.publish`, `youtube.package`, `reflection.note`
- [x] Trace timeline with lifecycle display
- [x] Policy: JARVIS_REPO_ROOT, clean worktree for code.apply

### Remaining Demo Polish

- [ ] Smoke scripts pass reliably (ingress:smoke, jarvis:smoke:apply)
- [ ] Clear “what happens” copy in approval modals
- [ ] Last executed proposal visible when queue empty

### Acceptance Criteria

- `pnpm ingress:smoke` creates pending proposal
- `pnpm jarvis:smoke:apply` creates code.apply proposal
- Approve → Execute produces receipts for both
- UI shows accurate lifecycle labels
- No breaking changes to stored event formats

**Timeline:** 1–2 weeks

---

## Phase 2: Safety Layer

**Goal:** Safe-by-default for irreversible actions without blocking demos.

### Milestone 2.1: Irreversible Action Confirmation (UI)

- [x] Risk tier per kind: LOW | MEDIUM | HIGH | CRITICAL
- [x] `code.apply` marked HIGH
- [x] HIGH/CRITICAL require confirmation before Execute:
  - Checkbox: “I understand this will modify files”
  - Typed confirmation (e.g., type `APPLY`)
- UI-only; no backend changes
- Feature flag: `JARVIS_UI_CONFIRM_IRREVERSIBLE` (default ON unless `"false"`)

### Milestone 2.2: Policy Hooks (Backend)

- [ ] Optional backend policy hook: reject execution if client didn’t pass confirmation token
- [ ] Step-up gating for CRITICAL (when auth enabled)
- [ ] Code.apply path allowlist (e.g., only certain dirs)

### Milestone 2.3: Proposal Validation

- [ ] Ingress: schema validation per kind
- [ ] Size limits for payloads
- [ ] Reject obvious injection patterns

### Acceptance Criteria

- system.note: one-click Execute (LOW risk, no confirmation)
- code.apply: confirmation step before Execute enabled
- Build + unit tests pass
- Ingress smoke flows unchanged

**Timeline:** 2–4 weeks

---

## Phase 3: Production Layer

**Goal:** Audit, replay, identity, multi-repo for team use.

### Milestone 3.1: Audit & Replay

- [ ] Full trace replay (re-apply receipts in order)
- [ ] Receipt verification (patchSha256, tree hashes)
- [ ] Export audit logs (CSV, JSON)

### Milestone 3.2: Identity

- [ ] Per-user approval attribution
- [ ] Session-aware UI (who approved, who executed)
- [ ] Optional SSO integration

### Milestone 3.3: Multi-Repo

- [ ] `allowedRepos` config
- [ ] Proposal specifies `repo`; execution routes to correct root
- [ ] Per-repo policy overrides

### Milestone 3.4: Observability

- [ ] Metrics (proposals/day, approval rate, execution success)
- [ ] Health checks for ingress, storage, policy
- [ ] Optional webhook on execution

### Acceptance Criteria

- Trace replay produces identical output
- Multi-repo proposals execute in correct repo
- Audit exports include all required fields

**Timeline:** 4–12 weeks

---

## Risk Tier Defaults

| Kind | Default Tier | Irreversible |
|------|--------------|--------------|
| system.note | LOW | No |
| reflection.note | LOW | No |
| code.diff | LOW | No |
| content.publish | LOW | No |
| youtube.package | LOW | No |
| code.apply | HIGH | Yes |

Override via `JARVIS_POLICY_RISK_TIERS` (future env, format TBD).
