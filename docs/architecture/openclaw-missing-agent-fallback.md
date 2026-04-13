# OpenClaw ingress — missing `agent` fallback (operator note)

When `POST /api/ingress/openclaw` omits `body.agent` (or sends only whitespace), Jarvis sets stored **`event.agent`** using this **single** rule:

1. **`source.agentId`** (trimmed), if non-empty — logical proposer label mirrors the upstream runtime id.
2. Otherwise **`unknown-proposer`** — an explicit sentinel meaning “no coordinator label and no upstream id on the wire.”

Jarvis **does not** substitute the string `"openclaw"` here; that read as a product default, not a proposer identity.

Full contract: [openclaw-proposal-identity-and-contract.md](./openclaw-proposal-identity-and-contract.md).
