---
title: "Network proxy boundary (Next.js)"
status: living-document
category: architecture
owner: Ben Tankersley
last_reviewed: 2026-05-09
related:
  - ./security-model.md
  - ../security/trusted-ingress.md
  - ../decisions/0001-thesis-lock.md
  - ../strategy/operating-assumptions.md
---

# Network proxy boundary (Next.js)

## What this is

Jarvis HUD uses Next.js **`proxy.ts`** (formerly `middleware.ts`) as a **named network boundary** in front of the app: code that runs at the edge of request handling, before route handlers execute. Next.js renamed the convention to **`proxy`** to stress **network interception**, not an Express-style middleware chain ([migration note](https://nextjs.org/docs/messages/middleware-to-proxy)).

That naming matches how Jarvis already thinks about **explicit boundaries**: ingress, session shell, approval UI, execute API, policy gate, receipts—not one undifferentiated “middleware soup.”

## Why the proxy stays thin

The proxy must **not** become a second control plane.

**In scope (thin):**

- Path-scoped interception (here: `/api/:path*`).
- **Lightweight posture:** when `JARVIS_AUTH_ENABLED=true`, require **presence** of the session cookie for protected API paths (see `src/lib/auth-edge.ts`). Cryptographic verification of the session belongs in **Node route handlers**.

**Defense in depth (B1/B2):** session-backed `/api` handlers that are not intentionally public (`GET /api/config`, `POST /api/auth/init`, `GET /api/auth/status`, `POST /api/ingress/*`) call **`requireVerifiedSessionGate`** in `src/lib/api-session-guard.ts` so a **forged or malformed cookie** cannot rely on proxy cookie-presence alone. `POST /api/preflight` intentionally allows missing sessions when auth is on (it reports `stepUpValid: false` instead of hard-401).
- **Allowlisted passthrough** for paths that must stay reachable without a browser session (e.g. auth bootstrap, **`GET /api/config`**, **`/api/ingress/*`** headless ingress).

**Out of scope (anti-patterns):**

- **Ingress capability checks** — HMAC, connector allowlist, proposal validation live in **`/api/ingress/*`** (and related modules), not in the proxy.
- **Human authority** — who may approve or execute is enforced in HUD flows and execute-time APIs, not at the network edge.
- **Execution authority / policy** — kind allowlists, step-up, preflight, adapters: **execute paths and policy gate**, not the proxy.
- **Business rules** — anything that needs durable state, `JARVIS_ROOT`, or rich error semantics belongs in **route handlers** or **server-only libraries**.

Thick logic in the proxy **obscures** the trust model and makes behavior **harder to probe** (contract / narrative / probe must stay aligned per [operating assumptions](../strategy/operating-assumptions.md)).

## Three authorities (do not conflate)

| Concept | Meaning | Where it is enforced |
|--------|---------|----------------------|
| **Ingress capability** | Who can **propose** via signed connector HTTP (possession of shared secret + valid body). **Not** proof of which human is at the keyboard. | Ingress routes, signing verification |
| **Human authority (session)** | Who may use **browser-backed** HUD/API flows when auth is on. | Session issuance in auth routes; cookie **verification** in Node; proxy only enforces cookie **presence** for selected `/api` paths |
| **Execution authority** | **Approve** vs **execute** vs **policy allow** — explicit steps after a proposal exists. | Approval/execute APIs, policy gate, Thesis Lock |

The proxy touches only a **narrow slice** of human authority: “does this `/api` call include a session cookie when auth is on?” It does **not** decide execution.

## Operational guidance

**Expected responsibilities of `src/proxy.ts`**

1. Run only on configured matchers.
2. If auth is off, pass through.
3. If auth is on, allow explicit public `/api` paths; otherwise require session cookie presence or return **401**.

**Falsifiable integrity**

- Operators verify the stack with **`pnpm machine-wired`**, **`pnpm auth-posture`**, and docs—not by reading proxy source for business rules.
- Keeping the proxy thin means **probes and route behavior** stay easier to reason about and document.

**Changes to allowlists** (e.g. new `/api` routes that must work without session) are **operational contract changes**: update code, update narrative (runbooks), confirm probes still describe the same host.

**Browser clients:** HUD code that calls session-gated `/api` routes should pass **`fetch(..., { credentials: "include" })`** so the `jarvis_session` cookie is always sent when operators use **`JARVIS_AUTH_ENABLED=true`** (explicit and consistent; same-origin defaults are easy to misread in refactors).

## See also

- [Security model](./security-model.md) — boundary table (includes **verified session / Node** row)
- **`src/lib/api-session-guard.ts`** — `requireVerifiedSessionGate`: signed cookie verification for session-backed handlers (discoverability from architecture docs)
- [Trusted ingress](../security/trusted-ingress.md) — ingress as separate boundary
- [Thesis Lock](../decisions/0001-thesis-lock.md)
