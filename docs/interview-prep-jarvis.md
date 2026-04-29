# Interview Prep: "Walk Me Through Jarvis"

How to explain Jarvis HUD in 2–3 minutes and answer common follow-ups.

---

## The 2–3 Minute Answer

**Opening (15 sec)**  
> "Jarvis HUD is an AI control plane for governed automation. The problem is that most AI agents execute actions directly — no approval, no receipt, no audit trail. Jarvis inserts a control plane between agents and execution."

**The lifecycle (30 sec)**  
> "Everything flows through a structured lifecycle: Agent proposes → human optionally approves → policy evaluates → execution runs → receipt is written → trace links it all. Agents don’t execute; they propose. Humans gate execution. Every action produces a receipt and a trace. So you get observability, auditability, and safety."

**What it does (30 sec)**  
> "Technically it’s Next.js and TypeScript with API routes as the control plane. We have HMAC-signed ingress for trusted connectors like OpenClaw, a policy gate that runs before any adapter, and a receipt log. The trace ID ties proposal, approval, execution, and receipt together. You can reconstruct any session from the trace."

**Close (15 sec)**  
> "The goal is to turn AI from a black box into a governed system. It’s still early — alpha — but the core flow works: propose, approve, execute, trace."

---

## Common Follow-Ups

### "Why a control plane? Why not just trust the agent?"

> "Because the model isn’t a trusted principal. It can hallucinate, misinterpret, or be prompted to do something harmful. A control plane separates reasoning from authority. The agent proposes; the human authorizes. Execution happens only after that gate."

### "What happens if someone bypasses the approval?"

> "On **the Jarvis-approved path**, execution routes through our API: policy runs before adapters, approvals gate execution, ingress can limit who may submit proposals, and governed runs produce receipts. **Jarvis guarantees the trusted, auditable path — not every possible execution path outside its control.** Work that never touches Jarvis is **outside** governance unless you deliberately hook it through the control plane. **Least privilege:** don’t hand dangerous credentials directly to agent runtimes. For runtime bypass and production packaging, see **[Runtime Bypass, Production Packaging, and Risk Tiers](#runtime-bypass-production-packaging-and-risk-tiers)** below; for formal guarantees, see [trust boundary](../trust-boundary.md)."

### "How does this scale? What about high-throughput agents?"

> "Right now it’s optimized for single-developer, local-first workflows. High-throughput is a future concern. The architecture supports it — events are append-only, receipts are written asynchronously — but we haven’t built workers or batching yet. The focus is depth of governance, not breadth of throughput."

### "What’s the hardest technical problem you solved?"

> "Keeping the client/server boundary clean. We had recovery types used in both API routes and React components. The API routes need Node — filesystem, storage — but the client can’t import that. We split into `recovery-shared.ts` for client-safe types and `recovery.ts` for server-only logic. Simple in hindsight, but it broke the build until we got it right."

### "How would you add a new action type? New connector?"

> "New action type: add the kind to the policy allowlist, implement an adapter in the execute route, add UI handling if needed. New connector: add it to the ingress allowlist, ensure it signs with the shared secret, and follows the proposal schema. The control plane is designed so new kinds and connectors plug in without changing core logic."

### "What would you do differently?"

> "I’d introduce the trace concept earlier. We had receipts before we had trace assembly. Having traceId from day one would’ve simplified the data model. Also, the policy decision log — logging every allow/deny — that was a late add. Doing it from the start would’ve made debugging policy denials much easier."

---

## One-Liners (Memorize One)

- **Elevator:** "Jarvis is a control plane for AI agents — propose, approve, execute, trace. Governance instead of a black box."
- **Technical:** "We enforce Agent → Proposal → Approval → Execution → Receipt → Trace. Policy runs before adapters; every action produces an auditable receipt."
- **Problem:** "AI agents can act — but those actions are opaque. Jarvis makes them observable, auditable, and human-gated."

---

## Runtime Bypass, Production Packaging, and Risk Tiers

Use this for diligence alongside [trust boundary](../trust-boundary.md) and [Competitive landscape 2026](./strategy/competitive-landscape-2026.md).

### 1. How do we guarantee proposals route through Jarvis?

Jarvis is not designed around trusting model or runtime behavior. The production guarantee comes from architecture: Jarvis becomes the trusted execution boundary for sensitive actions. Agent runtimes can propose actions, but sensitive execution routes through Jarvis-controlled connectors, approval policy, scoped credentials, receipts, and traces.

### 2. What prevents a rogue AI from bypassing Jarvis?

The prevention mechanism is credentials and permissions. Jarvis cannot stop a rogue runtime that already has unrestricted credentials. The correct production posture is least privilege: do not give the agent runtime direct access to dangerous credentials. The runtime can think, draft, summarize, and propose, but Jarvis owns or gates the credentials needed to send external emails, modify code, deploy, access production data, or call sensitive APIs. A rogue agent cannot bypass a locked door if it was never given the key.

In production, agents don't fail safely because they behave — they fail safely because they lack authority.

### 3. Can OpenClaw still execute on its own?

Yes—OpenClaw or another runtime may have native execution capabilities. Jarvis does not claim to magically remove those capabilities. In a Jarvis-managed deployment, sensitive execution tools are either routed through Jarvis adapters or configured with limited permissions. Anything outside Jarvis lacks Jarvis approval, receipt, trace, and policy coverage, and should be considered outside the trusted control plane.

### 4. How will Jarvis be packaged for production?

Think of Jarvis as the approval and execution layer that sits between AI agents and real-world systems.

Jarvis should be packaged as a control-plane application, not only a browser extension. The likely production model includes:

- Hosted Jarvis web app for approvals, receipts, traces, policy, and audit views.
- Runtime connectors for OpenClaw, LangGraph-style agents, internal scripts, browser agents, and custom automation systems.
- Execution adapters for email, GitHub, code patches, APIs, tickets, deploys, and database actions.
- Optional local agent or CLI for developer-machine actions.
- Optional browser extension later for browser-based agents and web workflows.

### 5. Does every action need approval?

No. Jarvis should use risk-based control.

Risk is defined by real-world impact, not by the type of action.

Low-risk actions can run automatically or with light policy checks—such as summarizing docs, drafting emails, searching internal files, formatting notes, or generating reports.

Medium-risk actions may require confirmation or scoped approval—such as creating tickets, scheduling calendar events, opening pull requests, or updating non-critical docs.

High-risk actions require explicit approval, scoped credentials, receipts, and traceability—such as sending external emails, modifying code directly, deploying, deleting data, accessing sensitive customer data, or calling production systems.

**Investor-ready summary:**

> Jarvis does not try to make models obedient. It removes dangerous authority from the model’s environment. Safe actions can move fast. Risky actions go through approval, scoped credentials, receipts, and traces.

---

## Red Flags to Avoid

- Don’t say "it’s just a demo" — it’s a real system with a clear thesis
- Don’t oversell scale — we’re focused on single-developer, local-first
- Don’t trash other agent frameworks — we integrate with them, we don’t replace them
- Don’t say "AI safety" in a vague way — say "governance, observability, human-in-the-loop"

---

## Related

- **[Investor live proof map](./strategy/investor-live-proof-map.md)** — one-page **trigger → say → show → proof** for live rooms (5-minute prep).
