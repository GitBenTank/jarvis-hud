# OpenClaw agent identity on proposals

OpenClaw may attach **optional metadata** on signed ingress so traces and approvals show who **coordinated**, who **drafted**, and (for LLM-backed runs) **which provider and model** produced the proposal text.

| Field (ingress JSON) | Meaning | Stored on event |
|----------------------|---------|-----------------|
| `agent` | Coordinator (e.g. **`alfred`**) | `event.agent` + durable actor fields (`actorId` / `actorLabel`) derived from the string |
| `builder` | Builder role that shaped the proposal (e.g. **Forge** as Alfred’s internal builder) | `event.builder` |
| `provider` | LLM provider label (e.g. **openai**) | `event.provider` |
| `model` | Model id string (e.g. **openai/gpt-4o**) | `event.model` |

**Governance is unchanged:** these fields are **labels for traceability only**. They do **not** grant approval, execution, or policy rights. Jarvis remains the control plane: humans approve, humans (or explicit Jarvis execution paths) execute, and receipts/logs remain authoritative. OpenClaw agents **propose only**. `provider` and `model` are descriptive metadata only and must not be interpreted as execution authority.

If `agent` is omitted, ingress resolves `event.agent` from `source.agentId` when present; otherwise it stores the explicit sentinel **`unknown-proposer`** (see `resolveOpenClawLogicalAgent` in jarvis-hud). The connector identifier **`openclaw`** remains on `source.connector` only and is not used as a silent substitute for the coordinator label.

Do not put `agent`, `builder`, `provider`, or `model` inside `payload`; ingress strips them from `payload` so metadata cannot be spoofed alongside arbitrary proposal data.
