# OpenClaw strict-governed (first slice)

Reference implementation for [OpenClaw strict mode — capability-layer enforcement](../../docs/architecture/openclaw-strict-mode-enforcement.md) and the trust theorem: **Jarvis is the only place where governed reality changes** (for the configured repo).

## Environment

| Variable | Purpose |
|----------|---------|
| `OPENCLAW_STRICT_GOVERNED` | `"true"` — block direct governed mutation tools at the registry choke point. |
| `OPENCLAW_GOVERNED_REPO_ROOT` | Governed git repo (path checks for reads/writes). Falls back to `JARVIS_REPO_ROOT`. |
| `JARVIS_BASE_URL` / `JARVIS_HUD_BASE_URL` | Jarvis origin for ingress. |
| `JARVIS_INGRESS_OPENCLAW_SECRET` | ≥32 chars — HMAC signing (same as Jarvis server). |

## API

```ts
import { createStrictGovernedRegistry } from "@/openclaw-strict-governed";

const registry = createStrictGovernedRegistry();

// Read-only (allowed in strict mode)
await registry.invoke("readGovernedFile", { path: "README.md" });

// Governed path: proposal only — no local repo mutation
await registry.invoke("proposeCodeApply", {
  title: "…",
  summary: "…",
  diffText: "diff --git a/…",
  agent: "alfred",
  sourceAgentId: "main",
});

// Direct mutation — throws GovernanceBlockError in strict mode
await registry.invoke("applyPatchDirect", { relativePath: "x.txt", content: "…" });
```

OpenClaw integration:

- Wire your tool runner so **every** tool invocation goes through an equivalent of `invoke`, or call `assertGovernedMutationAllowed("governed-mutation")` before any direct mutation handler.
- After building the **agent-visible** tool list, call **`assertNoUnsafeGovernedToolsInStrictMode(tools)`** so misconfiguration fails at startup with `STRICT_MODE_VIOLATION` (no silent registration of raw mutation tools).

## Manual verification

1. Set `OPENCLAW_GOVERNED_REPO_ROOT` (or `JARVIS_REPO_ROOT`) to a **clean** test git repo; set `JARVIS_INGRESS_*` on Jarvis and the same secret here.
2. `OPENCLAW_STRICT_GOVERNED=true` — run a small script that calls `applyPatchDirect` → expect `GOVERNANCE_BLOCK: strict mode — route through Jarvis`; confirm file **not** created.
3. Call `proposeCodeApply` with a valid unified diff → Jarvis Approvals shows a new **pending** `code.apply`; `git status` in the repo **unchanged**.
4. **Approve** in HUD → still no repo change until **Execute**.
5. **Execute** in HUD → patch applies / commit (Jarvis execute path).
6. `readGovernedFile` with `OPENCLAW_STRICT_GOVERNED=true` → returns file contents.

## Tests

```bash
npm test -- tests/unit/openclaw-strict-governed.test.ts
```
