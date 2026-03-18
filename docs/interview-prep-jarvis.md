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

> "Execution goes through our API. The policy gate runs before any adapter. If there’s no approved proposal for that ID, or the proposal was rejected, execution fails. We also have HMAC-signed ingress — so only trusted connectors can even create proposals. No approval, no execution."

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

## Red Flags to Avoid

- Don’t say "it’s just a demo" — it’s a real system with a clear thesis
- Don’t oversell scale — we’re focused on single-developer, local-first
- Don’t trash other agent frameworks — we integrate with them, we don’t replace them
- Don’t say "AI safety" in a vague way — say "governance, observability, human-in-the-loop"
