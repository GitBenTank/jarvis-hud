---
marp: true
theme: default
size: 16:9
paginate: true
footer: "Jarvis · Confidential"
title: Jarvis — Investor Deck
description: Control plane for AI agent execution — investor pitch
style: |
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=EB+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=JetBrains+Mono:wght@400;600&display=swap');
  section {
    background-color: #070a0f;
    background-image:
      linear-gradient(rgba(148, 163, 184, 0.045) 1px, transparent 1px),
      linear-gradient(90deg, rgba(148, 163, 184, 0.045) 1px, transparent 1px),
      radial-gradient(ellipse 85% 65% at 50% -15%, rgba(56, 189, 248, 0.07), transparent 52%),
      linear-gradient(158deg, #06080d 0%, #0c1119 42%, #080b12 100%);
    background-size: 64px 64px, 64px 64px, 100% 100%, 100% 100%;
    color: #e8eaed;
    font-family: 'DM Sans', 'Segoe UI', system-ui, sans-serif;
    font-size: 30px;
    line-height: 1.42;
    letter-spacing: 0.008em;
    padding: 52px 68px 76px 68px;
    box-shadow: inset 0 0 140px rgba(0, 0, 0, 0.22);
  }
  section::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.14) 20%, rgba(255, 255, 255, 0.14) 80%, transparent);
    opacity: 0.9;
  }
  section::after {
    content: '';
    position: absolute;
    top: 4px; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, #1d4ed8, #38bdf8 45%, #6366f1);
    opacity: 0.88;
  }
  h1 {
    font-family: 'EB Garamond', 'Georgia', 'Times New Roman', serif;
    color: #a8c5ee;
    font-size: 1.42em;
    font-weight: 600;
    letter-spacing: 0.015em;
    margin: 0 0 0.32em 0;
    line-height: 1.12;
    font-feature-settings: 'kern' 1, 'liga' 1;
  }
  h2 {
    font-family: 'DM Sans', sans-serif;
    color: #f1f5f9;
    font-size: 0.98em;
    font-weight: 600;
    border-left: 2px solid rgba(56, 189, 248, 0.85);
    padding: 0.08em 0 0.08em 0.72em;
    margin: 0.1em 0 0.72em 0;
    background: linear-gradient(90deg, rgba(56, 189, 248, 0.06), transparent 88%);
  }
  h3 { color: #b9e0fb; font-size: 0.92em; font-weight: 600; }
  strong { color: #93d4f8; font-weight: 700; }
  em { color: #94a3b8; }
  ul, ol { padding-left: 1.12em; }
  li { margin: 0.32em 0; }
  li::marker { color: #5abbf0; }
  blockquote {
    border-left: 1px solid rgba(129, 140, 248, 0.75);
    background: rgba(99, 102, 241, 0.06);
    padding: 0.62em 1em 0.62em 1.05em;
    margin: 0.55em 0;
    font-size: 0.9em;
    color: #cbd5e1;
    font-family: 'EB Garamond', Georgia, serif;
    font-style: italic;
    letter-spacing: 0.01em;
  }
  pre {
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    background: rgba(0, 0, 0, 0.42);
    border: 1px solid rgba(148, 163, 184, 0.18);
    border-radius: 8px;
    padding: 0.82em 1em;
    font-size: 0.58em;
    line-height: 1.48;
    color: #b0dafb;
    letter-spacing: 0.02em;
  }
  code { font-family: 'JetBrains Mono', monospace; color: #7ec8f5; font-size: 0.88em; }
  table {
    font-size: 0.74em;
    border-collapse: collapse;
    width: 100%;
    margin: 0.45em 0;
    border: 1px solid rgba(148, 163, 184, 0.16);
    border-radius: 6px;
    overflow: hidden;
  }
  th {
    background: rgba(30, 58, 138, 0.28);
    color: #f8fafc;
    padding: 0.5em 0.68em;
    text-align: left;
    font-size: 0.72em;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    border-bottom: 1px solid rgba(56, 189, 248, 0.35);
  }
  td {
    padding: 0.48em 0.68em;
    border-bottom: 1px solid rgba(148, 163, 184, 0.12);
    color: #e2e8f0;
  }
  tr:last-child td { border-bottom: none; }
  tr:nth-child(even) td { background: rgba(255, 255, 255, 0.02); }
  footer {
    color: #5c6578;
    font-size: 0.42em;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    font-weight: 600;
  }
  section.lead {
    background-image:
      linear-gradient(rgba(148, 163, 184, 0.035) 1px, transparent 1px),
      linear-gradient(90deg, rgba(148, 163, 184, 0.035) 1px, transparent 1px),
      radial-gradient(ellipse 95% 70% at 50% 8%, rgba(37, 99, 235, 0.18), transparent 58%),
      linear-gradient(168deg, #04060a 0%, #0a0f18 52%, #06080e 100%);
    background-size: 64px 64px, 64px 64px, 100% 100%, 100% 100%;
    justify-content: center;
    text-align: center;
  }
  section.lead h1 {
    font-size: 2.35em;
    font-weight: 600;
    color: #f8fafc;
    background: linear-gradient(135deg, #bfdbfe, #38bdf8 42%, #a5b4fc);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: 0.02em;
  }
  section.lead h2 { border: none; background: none; color: #8b95a8; font-size: 1.02em; font-weight: 500; letter-spacing: 0.01em; }
  section.lead strong { color: #7dd3fc; }
  section.lead p { color: #aeb8c9; font-size: 0.92em; margin-top: 1.15em; letter-spacing: 0.02em; }
  .kicker {
    font-family: 'DM Sans', sans-serif;
    font-size: 0.34em;
    font-weight: 700;
    letter-spacing: 0.26em;
    text-transform: uppercase;
    color: #6b7289;
    margin: 0 0 0.95em 0;
    padding-bottom: 0.55em;
    border-bottom: 1px solid rgba(148, 163, 184, 0.22);
  }
  section.lead .kicker {
    border-bottom-color: rgba(148, 163, 184, 0.18);
    color: #5c6378;
    letter-spacing: 0.3em;
  }
  .pill-row {
    display: flex;
    flex-wrap: wrap;
    gap: 9px;
    justify-content: center;
    margin: 1.05em 0 0.25em 0;
  }
  .pill {
    display: inline-block;
    background: linear-gradient(180deg, rgba(56, 189, 248, 0.14), rgba(37, 99, 235, 0.08));
    border: 1px solid rgba(56, 189, 248, 0.38);
    color: #dbeafe;
    padding: 9px 18px;
    border-radius: 999px;
    font-size: 0.68em;
    font-weight: 700;
    letter-spacing: 0.14em;
  }
  .pill-arrow { color: #5c6578; font-size: 0.8em; align-self: center; font-weight: 500; }
  .callout {
    margin-top: 0.7em;
    padding: 0.62em 0.95em;
    border-radius: 6px;
    background: rgba(248, 113, 113, 0.08);
    border: 1px solid rgba(248, 113, 113, 0.22);
    border-left-width: 3px;
    border-left-color: #f87171;
    color: #fecaca;
    font-size: 0.86em;
    font-weight: 600;
    letter-spacing: 0.01em;
  }
  .subtle {
    color: #8b95a8;
    font-size: 0.84em;
    margin-top: 0.48em;
    letter-spacing: 0.015em;
    line-height: 1.35;
  }
  .product-mock {
    margin: 0.48em 0 0.2em 0;
    border-radius: 10px;
    border: 1px solid rgba(148, 163, 184, 0.2);
    background: linear-gradient(168deg, rgba(12, 17, 26, 0.96) 0%, rgba(6, 8, 12, 0.94) 100%);
    overflow: hidden;
    box-shadow:
      0 1px 0 rgba(255, 255, 255, 0.06) inset,
      0 28px 64px rgba(0, 0, 0, 0.48);
  }
  .product-mock .mock-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 16px;
    background: rgba(0, 0, 0, 0.38);
    border-bottom: 1px solid rgba(148, 163, 184, 0.14);
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-size: 0.48em;
    color: #7c8499;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .product-mock .mock-dots { display: flex; gap: 6px; margin-right: 8px; }
  .product-mock .mock-dots span {
    width: 9px; height: 9px; border-radius: 50%;
    background: #334155;
  }
  .product-mock .mock-dots span:nth-child(1) { background: #ef4444; }
  .product-mock .mock-dots span:nth-child(2) { background: #eab308; }
  .product-mock .mock-dots span:nth-child(3) { background: #22c55e; }
  .product-mock .mock-body {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 12px;
    padding: 16px 16px 18px 16px;
    font-size: 0.64em;
  }
  .product-mock .mock-card {
    border-radius: 8px;
    padding: 13px 11px;
    background: rgba(0, 0, 0, 0.32);
    border: 1px solid rgba(148, 163, 184, 0.14);
    text-align: center;
  }
  .product-mock .mock-card strong {
    display: block;
    color: #f8fafc;
    font-size: 1.06em;
    margin-bottom: 5px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    font-family: 'DM Sans', sans-serif;
    font-weight: 700;
  }
  .product-mock .mock-card span {
    color: #8b95a8;
    font-size: 0.9em;
    line-height: 1.38;
    letter-spacing: 0.01em;
  }
  .product-mock .mock-card.accent {
    border-color: rgba(56, 189, 248, 0.4);
    background: rgba(29, 78, 216, 0.1);
    box-shadow: 0 0 0 1px rgba(56, 189, 248, 0.08);
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

<div class="kicker">Market shift</div>
# The shift

## Agents are moving from **generation** to **action**

- Send real outbound messages to customers
- Modify live systems and production data
- Trigger APIs, payments, and workflows

<div class="callout">The question is not only “what did it say?” — it’s “what did it do?”</div>

---

<div class="kicker">Risk</div>
# The problem

## Execution is not **trusted**

- Actions execute **without explicit human authorization**
- **Approval and execution collapse** into a single step
- **Logs ≠ proof** — no record of who actually authorized the action

<p class="subtle">That is a <strong>governance and liability</strong> problem: unbounded authority in production systems.</p>

---

<div class="kicker">Category heat</div>
# Market validation

## Enterprises are investing in **agent infrastructure**

- Major platform and cloud investment in agent infrastructure
- **Registries and catalogs** — what exists, who owns it
- **Orchestration and platforms** — how agents are wired
- **Governance layers** — policy, visibility, reuse

<p class="subtle"><strong>Validates the category.</strong> It does not close the execution accountability gap.</p>

---

<div class="kicker">Blind spot</div>
# The gap

## **Visibility ≠ control**

Platforms answer: *What can be discovered and shared?*

They do not answer:

> *What is allowed to happen — at the exact moment an agent takes action — under whose authority — with what proof?*

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

<div class="kicker">Solution</div>
# Jarvis

## The **authority layer** for every action

| Stage | What actually happens |
|-------|----------------------|
| **Propose** | Agent or connector submits an explicit action |
| **Approve** | Human gate — authorization is deliberate |
| **Execute** | **Separate** step — approval is not execution |
| **Receipt** | Artifact + outcome record |
| **Trace** | Reconstruct the story end-to-end |

<p class="subtle"><strong>Agents can propose anything.</strong> Authority lives in the control plane — not in the model.</p>

---

<div class="kicker">Product</div>
# Product proof

## Governed path in the **HUD**

<div class="product-mock">
<div class="mock-bar"><span class="mock-dots"><span></span><span></span><span></span></span> Execution console · approval queue</div>
<div class="mock-body">
<div class="mock-card accent"><strong>Approve</strong><span>Human gate before side effects</span></div>
<div class="mock-card"><strong>Execute</strong><span>Deliberate run — not the same as approval</span></div>
<div class="mock-card"><strong>Receipt + trace</strong><span>Artifact, log, end-to-end story</span></div>
</div>
</div>

<p class="subtle">Side effects become <strong>deliberate, attributable, and reconstructable</strong> — what audit and procurement teams actually need to sign off.</p>

---

<div class="kicker">Timing</div>
# Why now

## Three forces at once

1. **Capability** — tool-using agents are productized, not experimental
2. **Adoption** — agents touch production systems and real credentials
3. **Pressure** — governance expects **accountability**, not vibes

<div class="callout" style="border-left-color:#38bdf8;border-color:rgba(56,189,248,0.22);background:rgba(56,189,248,0.08);color:#bae6fd;">
The missing layer: execution control with evidence.
</div>

---

<div class="kicker">Why us</div>
# Why this wins

## The missing **execution layer**

- Between **intent** (models, frameworks, connectors) and **side effects**
- **Authority boundaries** — who may cause what
- **Receipts + traces** for audit and ops — not log archaeology

<p class="subtle"><strong>Wedge:</strong> not the catalog — the <em>moment of execution</em>.</p>

---

<div class="kicker">End state</div>
# Vision

## Every production AI action is **governed**

<div class="pill-row" style="justify-content:flex-start;margin-top:0.55em;">
<span class="pill" style="font-size:0.64em;">CONTROL</span>
<span class="pill" style="font-size:0.64em;">AUDIT</span>
<span class="pill" style="font-size:0.64em;">TRUST</span>
</div>

- **Control** — authorization before irreversible change
- **Audit** — proof, not inference from logs
- **Trust** — humans remain the trust root for action

---

<!-- _class: lead -->
<div class="kicker">Next step</div>
# Thank you

## Traction · team · raise · contact

**Jarvis** — control plane for AI execution

<p class="subtle" style="text-align:center;color:#5c6578;">Demo and materials available on request</p>

---
