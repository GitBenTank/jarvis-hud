# Episode 2: Artifacts

**Mission 002:** Connecting an AI Agent to Jarvis (OpenClaw Integration)

---

## Best Prompt

```
Propose a system note to Jarvis with title "Hello from OpenClaw" and summary "Episode 2 demo test".
```

---

## Best Terminal Moment

```
[ingress] proposal kind=system.note traceId=...
```

This proves the agent hit Jarvis ingress.

---

## Best UI Moment

Jarvis dashboard showing:

- pending proposal
- OpenClaw (verified) badge

---

## Best Receipt Moment

```bash
tail -n 3 ~/jarvis/actions/$(date +%Y-%m-%d).jsonl
```

Showing the action log entry.

---

## Thumbnail Idea

**Text:** AI AGENT ↓ APPROVAL REQUIRED

**Background:** Jarvis dashboard + terminal.

---

## Short-Form Clip Ideas

1. "Why AI agents shouldn't execute actions directly."
2. "This is what an AI control plane looks like."
3. "Watch an AI agent propose an action instead of executing it."

---

# Episode 2 Narrative

## Opening Hook (10–15 seconds)

Start with the system already working.

Show the proposal appear in Jarvis.

**Script:**

> "Watch this.  
> A real AI agent just proposed an action to my system instead of executing it."

Show the pending proposal in Jarvis.

> "That's the entire point of Jarvis.  
> AI agents don't just *do things*.  
> They have to go through a control plane first."

**Title card:** Mission 002 — Connecting an AI Agent to Jarvis

---

## Recap Line

> "Last episode we designed Jarvis — an AI control plane where agents propose actions instead of executing them directly.  
> Today we're connecting a real AI agent to it using OpenClaw."

---

# Editing Timeline

- 0:00 — Hook (proposal appears)
- 0:10 — Explain what happened
- 0:25 — Recap Jarvis concept
- 0:40 — Explain OpenClaw integration
- 1:10 — Demo start
- 3:00 — Approval moment
- 4:00 — Receipt proof
- 5:00 — Closing + next mission

**Target runtime:** 5–7 minutes

---

# First Proof Moment

When the terminal shows:

```
[ingress] proposal kind=system.note traceId=…
```

**Say:**

> "That right there is the agent hitting the Jarvis ingress endpoint."

Pause for a second so viewers can read it.

---

# Closing Line

> "Now that Jarvis can receive proposals from a real AI agent, the next question is even more interesting…  
> can it stop an agent from executing code without approval?"

**Tease:** code.diff, code.apply

**Next episode:** Mission 003 — Human Approval

---

# Shorts to Cut From Episode 2

## Short 1 — "Watch this"

**Length:** 15–20 seconds

**Show:** Terminal + Jarvis UI, trigger proposal

**Script:**

> "Watch this.  
> A real AI agent just proposed an action to my system instead of executing it."

**Hook:** AI proposes instead of executes.

---

## Short 2 — "That right there"

**Length:** 15–20 seconds

**Show:** `[ingress] proposal kind=system.note traceId=…`

**Script:**

> "That right there is the agent hitting the Jarvis ingress endpoint."

**Hook:** Clear technical proof of agent → Jarvis.

---

## Short 3 — "Why AI agents shouldn't execute directly"

**Length:** 30–45 seconds

**Show sequence:** proposal → approval → execution → receipt

**Script:**

> "AI agents shouldn't execute actions directly.  
> They should propose.  
> Humans approve.  
> Jarvis is the control plane in between."

**Hook:** The thesis of the system.
