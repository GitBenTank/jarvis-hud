# Video Insights Intake System

A structured method for ingesting security and operational concepts from external sources (videos, articles, talks) into Jarvis HUD without dumping raw transcripts or compromising Thesis Lock.

---

## Method

1. **Summarize** — Capture the high-level thesis and themes at 2–3 paragraphs.
2. **Extract controls** — Identify concrete security controls, patterns, or recommendations.
3. **Map to Jarvis** — For each control:
   - **Exists now** — What in current state already addresses it.
   - **Add now** — Docs, UI copy, or lightweight documentation only (no new integrations).
   - **Future** — Policy, connectors, or hardening for later.

---

## Template (per insight)

| Field | Description |
|-------|-------------|
| **Insight** | One-sentence description of the concept |
| **Risk** | What threat or gap it mitigates |
| **Jarvis Control** | How we would implement or align |
| **Implementation Plan** | Concrete steps (docs / UI / policy / code) |
| **Status** | `now` / `next` / `later` |

---

## Rules

- No long transcript dumps. Summaries only.
- Professional, GitHub-safe, accessible language.
- Every mapped control must respect Thesis Lock and local-first constraints.
- Do not add real external integrations in the intake phase—only policy models and docs.
