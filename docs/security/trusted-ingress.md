# Trusted Ingress

**Status:** Policy model (not yet implemented)  
**Related:** [Agent Execution Model](./agent-execution-model.md) · [Video Insight: OpenClaw Secure Setup](../research/video-insights/2026-03-02-openclaw-secure-setup.md)

---

## Definition

**Trusted Ingress** is the principle that only allowlisted external inputs should be permitted to create proposals. Default deny.

When proposals can originate from email, webhooks, or other external channels, uncontrolled ingress increases the prompt injection surface. Malicious or unintended content can flow into the system and influence what the agent proposes. Trusted Ingress reduces that surface by restricting who and what can create proposals.

---

## Why It Matters

- **Prompt injection reduction** — Only known, vetted sources can inject content that becomes proposals.
- **Supply-chain-style risk** — Unverified inputs are a supply chain for bad proposals.
- **Audit trail** — Allowlisted sources provide clearer provenance.

---

## Allowlist Model (Policy Design)

When connectors are added in the future, the allowlist may include:

| Dimension | Example |
|-----------|---------|
| **Sources** | Email, webhook, API, CLI |
| **Senders / domains** | Specific email addresses, verified domains |
| **File types** | Whitelist of MIME types or extensions |
| **Origin classes** | Internal vs. external, verified vs. unverified |

Default: **deny**. Only explicitly allowlisted inputs create proposals.

---

## Connector Ingress (OpenClaw)

As of connector ingress v1, OpenClaw can submit proposals via `POST /api/ingress/openclaw` when explicitly enabled.

**Authentication and replay protection:**

- **HMAC-SHA256 signature** — Request body is signed with a shared secret. Headers: `X-Jarvis-Timestamp`, `X-Jarvis-Nonce`, `X-Jarvis-Signature`. Message format: `${timestamp}.${nonce}.${rawBody}`. Server verifies using `timingSafeEqual`.
- **Timestamp window** — Reject if timestamp older than 5 minutes or more than 2 minutes in the future.
- **Nonce cache** — In-memory LRU cache (~2000 entries) rejects reused nonces. Prevents replay attacks within the timestamp window.
- **Connector allowlist** — `JARVIS_INGRESS_ALLOWLIST_CONNECTORS` specifies which connectors are permitted. Default deny.

Ingress is **off by default**. Requires `JARVIS_INGRESS_OPENCLAW_ENABLED=true` and `JARVIS_INGRESS_OPENCLAW_SECRET` (min 32 chars). See [ADR-0004: Connector Ingress v1](../decisions/0004-connector-ingress-v1.md).

---

## Other Proposal Entry Points

Proposals also enter via:

- `POST /api/events` — Programmatic event creation
- `POST /api/drafts/content` — UI draft creation

Both require an explicit request. There is no automatic polling of inboxes, webhooks, or external APIs outside the connector ingress endpoint.

---

## Relationship to Execution Boundary

Trusted Ingress governs **how proposals enter** the system.

The [Agent Execution Model](./agent-execution-model.md) governs **how proposals become execution**—human approval, receipts, no model-as-authority.

Together:

- Trusted Ingress → control what can propose
- Execution boundary → control what can execute

Both are required for defense in depth.
