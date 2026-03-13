# Policy Decision Logs

Jarvis logs every policy evaluation (allow or deny) so the system can answer: *why was execution allowed or blocked?*

This closes the explainability gap between receipts ("what happened") and policy ("what rules fired").

---

## Location

`~/jarvis/policy-decisions/YYYY-MM-DD.jsonl`

One line per decision. Mirrors the action log pattern. Uses `JARVIS_ROOT` when set.

---

## Entry Format

Each line is a JSON object:

| Field | Type | Description |
|-------|------|-------------|
| `traceId` | string | Links to the proposal/approval/execution trace |
| `decision` | `"allow"` \| `"deny"` | Policy outcome |
| `rule` | string | Which rule fired (e.g. `kind.allowlist`, `code.apply.preflight`, `policy.passed`) |
| `reason` | string | Human-readable slug (e.g. `clean_worktree`, `adapter_not_permitted`, `dirty_worktree`) |
| `timestamp` | string | ISO 8601 |

---

## Example Entries

**Allowed (code.apply, clean worktree):**

```json
{"traceId":"abc123","decision":"allow","rule":"code.apply.preflight","reason":"clean_worktree","timestamp":"2026-03-13T02:18:11Z"}
```

**Blocked (kind not in allowlist):**

```json
{"traceId":"def456","decision":"deny","rule":"kind.allowlist","reason":"adapter_not_permitted","timestamp":"2026-03-13T02:19:10Z"}
```

**Blocked (code.apply preflight failed):**

```json
{"traceId":"ghi789","decision":"deny","rule":"code.apply.preflight","reason":"dirty_worktree","timestamp":"2026-03-13T02:20:00Z"}
```

---

## Rule / Reason Mapping

| Rule | Allow reason | Deny reason |
|------|--------------|-------------|
| `kind.allowlist` | — | `adapter_not_permitted` |
| `step_up` | — | `reauthenticate_required` |
| `code.apply.preflight` | `clean_worktree` | `dirty_worktree`, `repo_root_required`, etc. |
| `policy.passed` | `allowed` | — |

---

## Integration

Policy decisions are written inside `evaluateExecutePolicy()` in `src/lib/policy.ts`, before the result is returned. The execute API passes `traceId` so each decision links to the full lifecycle trace.

---

## Explainability Chain

With policy decision logs, Jarvis can answer three questions:

| Question | Source |
|----------|--------|
| What happened? | Receipts (action log) |
| Why was it allowed or blocked? | Policy decision logs |
| Did reality match intent? | Reconciliation (concept, future) |

---

## See Also

- [Security Model](security-model.md) — Defense in depth, audit trail
- [ADR-0003: Execution Policy v1](../decisions/0003-execution-policy-v1.md) — Policy gate design
- [Reconciliation Concept](reconciliation-concept.md) — Desired vs observed state
