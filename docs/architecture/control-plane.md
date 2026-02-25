---
title: "Control Plane Architecture"
status: "living-document"
category: architecture
related:
  - ../strategy/jarvis-hud-video-thesis.md
  - ../security/agent-execution-model.md
---

# Control Plane Architecture

> **Architecture layer.** This document describes the Jarvis HUD control plane design.
> It implements the [Video Thesis](../strategy/jarvis-hud-video-thesis.md) and [Agent Execution Model](../security/agent-execution-model.md).

## Overview

The control plane sits between local agents (with root access) and execution:

```
Agent → Propose → Human Approval → Execute → Artifact + Log → Archive
```

## Components

- **Proposal Layer** — Agents submit action packets (e.g. content.publish)
- **Approval Layer** — Human gates execution; approve/deny with visibility
- **Execution Layer** — Explicit, logged, receipt-producing
- **Artifact + Log** — Every action produces traceable output
- **Archive** — Demo reset archives events, actions, publish-queue

## Design Constraints

All components must respect [Thesis Lock](../strategy/jarvis-hud-video-thesis.md#thesis-lock-do-not-drift).

---

See: [Agent Execution Model](../security/agent-execution-model.md) for security constraints.
