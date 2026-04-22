---
marp: true
theme: default
size: 16:9
paginate: true
footer: "Jarvis · Confidential"
title: Jarvis — Investor Deck
description: Control plane for AI agent execution — investor pitch
style: |
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,600;0,9..40,700;1,9..40,400&family=JetBrains+Mono:wght@400;600&display=swap');
  section {
    background: linear-gradient(155deg, #080b10 0%, #101620 38%, #0a0e16 100%);
    color: #e6e9ef;
    font-family: 'DM Sans', 'Segoe UI', system-ui, sans-serif;
    font-size: 32px;
    line-height: 1.38;
    letter-spacing: 0.01em;
    padding: 56px 64px 72px 64px;
  }
  section::after {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 5px;
    background: linear-gradient(90deg, #2563eb, #38bdf8, #6366f1);
    opacity: 0.95;
  }
  h1 {
    font-family: 'DM Sans', sans-serif;
    color: #93c5fd;
    font-size: 1.35em;
    font-weight: 700;
    letter-spacing: -0.03em;
    margin-bottom: 0.35em;
    text-shadow: 0 0 40px rgba(56, 189, 248, 0.15);
  }
  h2 {
    font-family: 'DM Sans', sans-serif;
    color: #f8fafc;
    font-size: 1.05em;
    font-weight: 600;
    border-left: 5px solid #38bdf8;
    padding: 0.12em 0 0.12em 0.65em;
    margin-top: 0.15em;
    margin-bottom: 0.75em;
    background: linear-gradient(90deg, rgba(56, 189, 248, 0.08), transparent);
  }
  h3 { color: #bae6fd; font-size: 0.95em; font-weight: 600; }
  strong { color: #7dd3fc; font-weight: 700; }
  em { color: #94a3b8; }
  ul, ol { padding-left: 1.15em; }
  li { margin: 0.35em 0; }
  li::marker { color: #38bdf8; }
  blockquote {
    border-left: 4px solid #6366f1;
    background: rgba(99, 102, 241, 0.08);
    padding: 0.65em 1em;
    margin: 0.6em 0;
    font-size: 0.92em;
    color: #cbd5e1;
  }
  pre {
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    background: rgba(0, 0, 0, 0.45);
    border: 1px solid rgba(56, 189, 248, 0.25);
    border-radius: 12px;
    padding: 0.85em 1em;
    font-size: 0.62em;
    line-height: 1.45;
    color: #a5d8ff;
  }
  code { font-family: 'JetBrains Mono', monospace; color: #7dd3fc; font-size: 0.9em; }
  table {
    font-size: 0.78em;
    border-collapse: collapse;
    width: 100%;
    margin: 0.5em 0;
  }
  th {
    background: rgba(37, 99, 235, 0.35);
    color: #f1f5f9;
    padding: 0.45em 0.65em;
    text-align: left;
    border-bottom: 2px solid #38bdf8;
  }
  td {
    padding: 0.45em 0.65em;
    border-bottom: 1px solid rgba(148, 163, 184, 0.2);
    color: #e2e8f0;
  }
  tr:nth-child(even) td { background: rgba(255,255,255,0.03); }
  footer {
    color: #64748b;
    font-size: 0.45em;
    letter-spacing: 0.04em;
  }
  section.lead {
    background: radial-gradient(ellipse 120% 80% at 50% 20%, rgba(37, 99, 235, 0.22), transparent 55%),
      linear-gradient(165deg, #050810 0%, #0c1220 50%, #080c14 100%);
    justify-content: center;
    text-align: center;
  }
  section.lead h1 {
    font-size: 2.15em;
    color: #f8fafc;
    background: linear-gradient(135deg, #93c5fd, #38bdf8, #a5b4fc);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  section.lead h2 { border: none; background: none; color: #94a3b8; font-size: 1.05em; font-weight: 500; }
  section.lead strong { color: #7dd3fc; }
  section.lead p { color: #cbd5e1; font-size: 0.95em; margin-top: 1.2em; }
  .pill-row {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    justify-content: center;
    margin: 1.1em 0 0.3em 0;
  }
  .pill {
    display: inline-block;
    background: linear-gradient(180deg, rgba(56, 189, 248, 0.22), rgba(37, 99, 235, 0.12));
    border: 1px solid rgba(56, 189, 248, 0.45);
    color: #e0f2fe;
    padding: 10px 20px;
    border-radius: 999px;
    font-size: 0.72em;
    font-weight: 600;
    letter-spacing: 0.03em;
  }
  .pill-arrow { color: #64748b; font-size: 0.85em; align-self: center; }
  .callout {
    margin-top: 0.75em;
    padding: 0.65em 0.9em;
    border-radius: 10px;
    background: rgba(248, 113, 113, 0.1);
    border-left: 4px solid #f87171;
    color: #fecaca;
    font-size: 0.88em;
    font-weight: 600;
  }
  .subtle { color: #94a3b8; font-size: 0.88em; margin-top: 0.5em; }
  .product-mock {
    margin: 0.55em 0 0.35em 0;
    border-radius: 14px;
    border: 1px solid rgba(56, 189, 248, 0.38);
    background: linear-gradient(165deg, rgba(15, 23, 42, 0.92) 0%, rgba(8, 11, 18, 0.88) 100%);
    overflow: hidden;
    box-shadow: 0 24px 56px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05) inset;
  }
  .product-mock .mock-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 11px 16px;
    background: rgba(0, 0, 0, 0.4);
    border-bottom: 1px solid rgba(56, 189, 248, 0.22);
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-size: 0.52em;
    color: #94a3b8;
    letter-spacing: 0.02em;
  }
  .product-mock .mock-dots { display: flex; gap: 7px; margin-right: 6px; }
  .product-mock .mock-dots span {
    width: 10px; height: 10px; border-radius: 50%;
    background: #334155;
  }
  .product-mock .mock-dots span:nth-child(1) { background: #f87171; }
  .product-mock .mock-dots span:nth-child(2) { background: #fbbf24; }
  .product-mock .mock-dots span:nth-child(3) { background: #4ade80; }
  .product-mock .mock-body {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 14px;
    padding: 18px 16px 20px 16px;
    font-size: 0.68em;
  }
  .product-mock .mock-card {
    border-radius: 10px;
    padding: 14px 12px;
    background: rgba(0, 0, 0, 0.35);
    border: 1px solid rgba(148, 163, 184, 0.18);
    text-align: center;
  }
  .product-mock .mock-card strong {
    display: block;
    color: #f8fafc;
    font-size: 1.05em;
    margin-bottom: 6px;
    letter-spacing: -0.02em;
  }
  .product-mock .mock-card span {
    color: #94a3b8;
    font-size: 0.92em;
    line-height: 1.35;
  }
  .product-mock .mock-card.accent {
    border-color: rgba(56, 189, 248, 0.45);
    background: rgba(37, 99, 235, 0.12);
    box-shadow: 0 0 28px rgba(56, 189, 248, 0.12);
  }
  .product-mock .mock-card.accent strong { color: #7dd3fc; }
---

<!-- _class: lead -->
# Jarvis

## The control plane for AI **execution**

<div class="pill-row">
<span class="pill">PROPOSE</span><span class="pill-arrow">→</span>
<span class="pill">APPROVE</span><span class="pill-arrow">→</span>
<span class="pill">EXECUTE</span><span class="pill-arrow">→</span>
<span class="pill">RECEIPT</span><span class="pill-arrow">→</span>
<span class="pill">TRACE</span>
</div>

---

# The shift

## Agents are moving from **generation** to **action**

- Sending email and messages
- Changing systems and configuration
- Triggering workflows and integrations

<div class="callout">The question is not only “what did it say?” — it’s “what did it do?”</div>

---

# The problem

## Execution is not **controlled**

- Side effects can run **without explicit human authorization**
- **Approval** is often conflated with **execution** — or skipped
- **Logs** record activity; they are not **proof** of who authorized what

<p class="subtle"><strong>Runtime risk is unbounded authority</strong> — not bad copy.</p>

---

# Market validation

## Enterprises are investing in **agent infrastructure**

- **Registries & catalogs** — what exists, who owns it
- **Orchestration & platforms** — how agents are wired
- **Governance layers** — policy, visibility, reuse

<p class="subtle"><strong>Proves the category.</strong> Does not close the execution gap.</p>

---

# The gap

## **Visibility ≠ control**

Platforms answer: *What can be discovered and shared?*

They do not answer:

> *What may happen **at the moment** an agent acts — under whose authority — with what proof?*

```
   Agents & tools
         │
         ▼
   Platforms (catalogs, orchestration)
         │
         ▼
    ┌─────────────┐
    │  EXECUTION  │  ← void
    │    VOID     │
    └─────────────┘
         │
         ▼
   Production systems
```

---

# Jarvis

## **Approval + proof** for every action

| Step | Meaning |
|------|---------|
| **Propose** | Agent or connector submits an explicit action |
| **Approve** | Human gate — authorization is deliberate |
| **Execute** | **Separate** step — approval is not execution |
| **Receipt** | Artifact + outcome record |
| **Trace** | Reconstruct the story end-to-end |

<p class="subtle"><strong>Agents can propose anything.</strong> Authority lives in the control plane.</p>

---

# Product proof

## Governed path in the **HUD**

<div class="product-mock">
<div class="mock-bar"><span class="mock-dots"><span></span><span></span><span></span></span> jarvis-hud · approval queue</div>
<div class="mock-body">
<div class="mock-card accent"><strong>Approve</strong><span>Human gate before side effects</span></div>
<div class="mock-card"><strong>Execute</strong><span>Deliberate run — not the same as approval</span></div>
<div class="mock-card"><strong>Receipt + trace</strong><span>Artifact, log, end-to-end story</span></div>
</div>
</div>

<p class="subtle"><strong>On video:</strong> replace with full-bleed HUD screen recording for the strongest proof; this frame reads clearly at 1080p.</p>

---

# Why now

## Three forces at once

1. **Capability** — tool-using agents are productized, not experimental
2. **Adoption** — agents touch production systems and real credentials
3. **Pressure** — governance expects **accountability**, not vibes

<div class="callout" style="border-left-color:#38bdf8;background:rgba(56,189,248,0.1);color:#bae6fd;">
The missing layer: execution control with evidence.
</div>

---

# Why this wins

## **Agent-agnostic** control plane

- Between **intent** (models, frameworks, connectors) and **side effects**
- **Authority boundaries** — who may cause what
- **Receipts + traces** for audit and ops — not log archaeology

<p class="subtle"><strong>Wedge:</strong> not the catalog — the <em>moment of execution</em>.</p>

---

# Vision

## Every production AI action is **governed**

<div class="pill-row" style="justify-content:flex-start;margin-top:0.6em;">
<span class="pill" style="font-size:0.68em;">CONTROL</span>
<span class="pill" style="font-size:0.68em;">AUDIT</span>
<span class="pill" style="font-size:0.68em;">TRUST</span>
</div>

- **Control** — authorization before irreversible change
- **Audit** — proof, not inference from logs
- **Trust** — humans remain the trust root for action

---

<!-- _class: lead -->
# Thank you

## *[Traction · team · raise · contact]*

**Jarvis** — control plane for AI execution

<p class="subtle" style="text-align:center;color:#64748b;">youtube.com / link in description</p>

---
