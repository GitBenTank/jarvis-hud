---
title: "Agent Execution Model"
status: "living-document"
category: security
related:
  - ../strategy/jarvis-hud-video-thesis.md
  - ../architecture/control-plane.md
---

# Agent Execution Model

> **Security model.** This document defines how agents are constrained at runtime.
> It implements the principles in [Jarvis HUD Video Thesis](../strategy/jarvis-hud-video-thesis.md#thesis-lock-do-not-drift).

## Overview

The execution model enforces Thesis Lock at runtime:

- **The model is not a trusted principal.** Proposals are not execution authority.
- **Explicit human approval** gates all execution.
- **Receipts** (artifact + log) are mandatory for every executed action.

## Non-Negotiable Constraints

1. Propose ≠ Execute
2. Approval is a separate step from execution
3. No silent execution — all actions produce audit trail
4. Dry-run and staging modes before any production path

## Implementation Notes

- Current HUD: dry-run only, local artifact + action log
- Future: policy thresholds, scope narrowing, escalation paths

---

See: [Control Plane Architecture](../architecture/control-plane.md) for the system design.
