# Reconciliation

Reconciliation compares approved intent to observed reality. It answers: *did execution match what was authorized?*

---

## Status Values

| Status | Meaning |
|--------|---------|
| `verified` | Observed state matches expected. Artifact exists and content matches. |
| `drift_detected` | Mismatch: artifact missing or content differs from approved intent. |
| `not_reconcilable_yet` | Insufficient data to reconcile (e.g. no receipt yet). |

---

## Expected vs Observed

| Concept | Description |
|---------|-------------|
| **Expected** | What the proposal/approval authorized — title, note content, kind. |
| **Observed** | What the system produced — artifact path, existence, content. |

Reconciliation compares the two. Drift is logged when they differ.

---

## system.note Implementation

For `system.note`, reconciliation checks:

1. **Artifact exists** — `outputPath` from receipt points to a file that exists.
2. **Content matches** — File content equals expected `note`.

| Condition | Result |
|-----------|--------|
| File missing | `drift_detected`, reason: `artifact_missing` |
| Content differs | `drift_detected`, reason: `content_mismatch` |
| File exists, content matches | `verified`, reason: `artifact_matches_expected` |

---

## Log Location

`~/jarvis/reconciliation/YYYY-MM-DD.jsonl`

Entry format: `traceId`, `status`, `expected`, `observed`, `reason`, `timestamp`.

---

## Reconciliation Controller

Jarvis runs a **Reconciliation Controller** when `JARVIS_CONTROLLER_ENABLED=1` or in development. The controller:

1. Finds approved+executed actions with no reconciliation entry.
2. Compares observed state to desired state.
3. Writes reconciliation logs (verified / drift_detected).

This shifts Jarvis from *approve → execute once* to *approve → controller reconciles until reality is recorded*.

The controller runs every 5 seconds. On startup, one pass runs immediately.

---

## Future Adapters

| Adapter | Drift detection |
|---------|-----------------|
| `system.note` | Artifact missing, content mismatch |
| `system.file` | File missing |
| `code.apply` | File contents differ from applied diff |

---

## See Also

- [Controller Runtime](controller-runtime.md) — Controller loop, multi-controller architecture
- [Reconciliation Concept](reconciliation-concept.md) — desired vs observed state
- [Control Plane Architecture](control-plane.md) — lifecycle
- [Agent Trust Model](agent-trust-model.md) — agents as proposers
