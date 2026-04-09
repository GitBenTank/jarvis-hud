# Execution scope (Phase 4)

Optional **blast-radius** limits on filesystem-touching execution. This is **not** authentication or RBAC: it only restricts **where** approved adapters may read/write when you configure allowlists.

## Behavior

- When **`JARVIS_EXEC_ALLOWED_ROOTS`** and **`JARVIS_EXEC_ALLOWED_REPOS`** are both unset or empty after parsing, **no extra scope check runs** (backward compatible).
- When at least one absolute root is configured, `POST /api/execute/[approvalId]` validates **adapter target paths** (and `code.apply` **git repo root**) **before** adapters run.
- Out-of-scope attempts return **403** with `code: "execution_scope_denied"` (or **400** with `code: "invalid_target_path"` for empty paths). Server logs use the prefix **`[execution-scope]`**.

## Environment variables

| Variable | Meaning |
|----------|---------|
| `JARVIS_EXEC_ALLOWED_ROOTS` | Comma-separated list of absolute paths; each entry is trimmed; empty segments ignored. |
| `JARVIS_EXEC_ALLOWED_REPOS` | Same format; merged with `JARVIS_EXEC_ALLOWED_ROOTS` and deduplicated after `path.resolve`. |

Typical production-style example (adjust paths):

```bash
JARVIS_EXEC_ALLOWED_ROOTS=/Users/you/jarvis,/Users/you/repos/my-app
JARVIS_REPO_ROOT=/Users/you/repos/my-app
```

Include **`JARVIS_ROOT`** (or your `~/jarvis` path) in the allowlist if you want scope checks to cover artifact directories under that tree (e.g. `system.note`, `code-applies` bundles, `publish-queue`).

## Scoped kinds

Paths collected per kind include at least:

- `code.apply` — `JARVIS_REPO_ROOT` (resolved) + code-apply bundle directory under `JARVIS_ROOT`
- `system.note`, `reflection.note`, recovery runbooks, `code.diff`, `youtube.package`, `content.publish` — respective artifact paths under `JARVIS_ROOT` (and optional `youtube.videoFilePath` when set)

Control-plane writes such as `events/*.json` are **not** part of this allowlist (they remain governed by existing `JARVIS_ROOT` path safety).

## API errors (machine-readable)

| `code` | HTTP | Meaning |
|--------|------|---------|
| `execution_scope_denied` | 403 | Resolved path not under any allowed root. |
| `invalid_target_path` | 400 | Empty or unusable path for a labeled target. |

Response body may include `label` and `targetPath` for debugging.

## Purpose

External audit and **bounded execution surface**: use with human approval and policy; do not treat this as a substitute for OS-level access control.
