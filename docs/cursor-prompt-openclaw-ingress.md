# Cursor Prompt: Jarvis HUD Ingress Extension (OpenClaw)

**Where to run:** OpenClaw repo.

**Goal:** Add a Jarvis HUD ingress extension that signs and POSTs proposals to `POST {JARVIS_BASE_URL}/api/ingress/openclaw` following the Jarvis signing spec. Proposal-only. No auto-approval, no execution logic.

**Constraints:**
- Do not commit secrets; env vars only
- Do not log raw bodies, response bodies, or secrets
- Clear error messages for 400/401/403/409/429
- Built-ins only (no extra deps)
- Extensions live under `extensions/` and use `api.registerTool()`
- Use ESM (`type: module`) consistent with repo patterns

---

## Environment Variables (document; do not commit real values)

| Variable | Default | Notes |
|----------|--------|------|
| `JARVIS_BASE_URL` | `http://127.0.0.1:3000` | Must match the running Jarvis origin ([local stack startup](setup/local-stack-startup.md)) |
| `JARVIS_INGRESS_OPENCLAW_SECRET` | (required) | Min 32 chars |
| `JARVIS_PREFLIGHT` | `true` | Set to `"false"` to skip preflight |

---

## OpenClaw Conventions (match exactly)

**Import paths (source checkout):**
- From `extensions/jarvis/index.ts`: `import type { AnyAgentTool, OpenClawPluginApi } from "../../src/plugins/types.js"`
- From `extensions/jarvis/src/jarvis-tool.ts`: `import type { OpenClawPluginApi } from "../../../src/plugins/types.js"`
- From `extensions/jarvis/src/ingress.ts`: no plugin types; use `node:crypto`, `node:https`/`node:http` as needed

**Extension registration (mirror llm-task):**
```ts
// extensions/jarvis/index.ts
import type { AnyAgentTool, OpenClawPluginApi } from "../../src/plugins/types.js";
import { createJarvisIngressTool } from "./src/jarvis-tool.js";

export default function register(api: OpenClawPluginApi) {
  api.registerTool(createJarvisIngressTool(api) as unknown as AnyAgentTool, { optional: true });
}
```

**Package.json (mirror llm-task, lobster):**
- Use `openclaw.extensions` (not top-level `extensions`): `"openclaw": { "extensions": ["./index.ts"] }`
- Add to pnpm workspace if OpenClaw discovers extensions via workspace packages (check root `pnpm-workspace.yaml` for `extensions/*`)

**Node version:** OpenClaw runs on Node 20+ (per deps). Use native `fetch` — no fallback to `http`/`https` needed.

**Signature format:** HMAC-SHA256 **hex digest** (`.digest("hex")`), not base64. Jarvis expects hex per signing spec.

---

## Implementation

### A) Ingress client module

Create: `extensions/jarvis/src/ingress.ts`

**Export:**

1. **`preflightJarvis()`**
   - `GET ${baseUrl}/api/config`
   - Require: `ingressOpenclawEnabled === true` AND `openclawAllowed === true`
   - Return safe subset: `{ ingressOpenclawEnabled, openclawAllowed, serverTime }`
   - On failure: throw `Error("Jarvis ingress disabled or connector not allowlisted (restart Jarvis with ingress env vars)")`

2. **`postJarvisIngress(input)`**

   Input shape:
   ```ts
   {
     kind: "system.note" | "code.diff" | "code.apply" | "content.publish" | "youtube.package" | "reflection.note";
     title: string;
     summary: string;
     payload?: Record<string, unknown>;
   }
   ```

   Build body:
   ```json
   { "kind", "title", "summary", "payload": payload ?? {}, "source": { "connector": "openclaw" } }
   ```

   **Signing:**
   - `rawBody = JSON.stringify(body)` (serialize once)
   - `timestamp = Date.now().toString()`
   - `nonce = crypto.randomUUID()`
   - `message = \`${timestamp}.${nonce}.${rawBody}\``
   - `signature = crypto.createHmac("sha256", secret).update(message, "utf8").digest("hex")`

   **POST:**
   - URL: `${baseUrl}/api/ingress/openclaw`
   - Headers: `Content-Type: application/json`, `X-Jarvis-Timestamp`, `X-Jarvis-Nonce`, `X-Jarvis-Signature`
   - Body: `rawBody` (string)

   **Response:**
   - On 200: parse JSON, return `{ ok, id, traceId, status }`

   **Error mapping (never print raw response body):**

   | Status | Throw |
   |--------|-------|
   | 400 | `Error("Jarvis ingress rejected request (bad request)")` |
   | 401 | `Error("Jarvis ingress signature/timestamp invalid (check secret + clock)")` |
   | 403 | `Error("Jarvis ingress disabled or connector not allowlisted (restart Jarvis with ingress env vars)")` |
   | 409 | `Error("Jarvis ingress nonce replay (retry with new nonce)")` |
   | 429 | `Error("Jarvis ingress rate limited (retry later)")` |
   | Other | `Error(\`Jarvis ingress failed (${status})\`)` |

---

### B) Extension entry point

Create: `extensions/jarvis/index.ts`

- Default export: `function register(api: OpenClawPluginApi) { ... }`
- Import `createJarvisIngressTool` from `./src/jarvis-tool.js`
- Register with `api.registerTool(..., { optional: true })`

---

### C) Tool implementation

Create: `extensions/jarvis/src/jarvis-tool.ts`

- Tool name: `jarvis_propose_system_note`
- Params: `title` (string), `summary` (string), `markdown` (string, optional)
- Use `@sinclair/typebox` `Type.Object` for params (like llm-task, lobster)
- If `JARVIS_PREFLIGHT` !== `"false"`, run `preflightJarvis()` first
- Call `postJarvisIngress({ kind: "system.note", title, summary, payload: { note: markdown ?? "" } })`
- Return `{ ok, id, traceId, status }`

---

### D) Extension package.json

Create: `extensions/jarvis/package.json`

```json
{
  "name": "@openclaw/jarvis",
  "version": "2026.2.19",
  "private": true,
  "description": "Jarvis HUD ingress - propose system notes, code diffs, etc.",
  "type": "module",
  "devDependencies": { "openclaw": "workspace:*" },
  "openclaw": { "extensions": ["./index.ts"] }
}
```

Optional: `openclaw.plugin.json` with `id`, `name`, `description` (mirror lobster, llm-task).

---

### E) Skill doc

Create: `skills/jarvis/SKILL.md`

Mirror `skills/github/SKILL.md` style:
- Frontmatter: `name`, `description`, `metadata.openclaw` (emoji, requires, etc.)
- Usage examples calling `jarvis_propose_system_note`
- Note: Jarvis must be running with ingress enabled + allowlisted
- Show required env vars

---

### F) Enable extension

- Add `extensions/jarvis` to root `pnpm-workspace.yaml` if other extensions (llm-task, lobster) are listed there
- If OpenClaw uses `openclaw.json` or user config for plugin enablement, add `jarvis: { enabled: true }` (or equivalent) following the same pattern as other extensions

---

### G) Smoke script

Create: `scripts/jarvis-ingress-smoke.mjs`

- Read: `JARVIS_BASE_URL` (default `http://127.0.0.1:3000`), `JARVIS_INGRESS_OPENCLAW_SECRET`
- Send one `system.note`
- Log **only**: `ok`, `id`, `traceId`, `status`, `baseUrl` — **no secrets, no raw body, no response body**

Add to root `package.json`:
```json
"jarvis:smoke": "node scripts/jarvis-ingress-smoke.mjs"
```

---

## Acceptance criteria

After Cursor scaffolds, run:

- `pnpm typecheck`
- `pnpm build`
- `pnpm jarvis:smoke` (with Jarvis running and ingress env set; origin must match **`JARVIS_BASE_URL`**)

If anything fails, capture:

- The command you ran
- The first error block
- Your Node + pnpm versions (`node -v`, `pnpm -v`)

That makes debugging deterministic.
- Jarvis UI shows pending event with "OpenClaw (verified)"
- Approve + Execute in Jarvis produces receipts and trace timeline links

---

## References

- Jarvis signing spec: `jarvis-hud/docs/security/openclaw-ingress-signing.md`
- Jarvis `/api/config` returns: `ingressOpenclawEnabled`, `openclawAllowed`, `serverTime`
- Extensions: `extensions/llm-task/index.ts`, `extensions/lobster/index.ts`
- Skills: `skills/github/SKILL.md`, `skills/apple-notes/SKILL.md`
