# Controller Runtime

Jarvis is evolving from a request/response workflow into a control-plane system with controller loops.

## Purpose

The controller runtime coordinates background control loops that ensure approved intent is executed, verified, and reflected in trace data.

## Current state

Today Jarvis includes:

- **Reconciliation Controller** — verifies whether observed state matches approved intent
- Immediate execution-time reconciliation for supported actions
- Background reconciliation pass for backfill and follow-up checks

## Direction

Jarvis may evolve toward a multi-controller architecture with focused responsibilities.

Possible controllers:

- **Execution Controller** — runs approved work and writes receipts
- **Reconciliation Controller** — compares desired vs observed state and emits verified/drift outcomes
- **Trace Assembly Controller** — rebuilds and materializes traces from logs
- **Approval Controller** — advances approved items into execution-ready state
- **Proposal Controller** — normalizes incoming proposals and prepares trace metadata

## Runtime model

A controller follows a simple pattern:

1. discover candidate work
2. evaluate current state
3. perform a control action
4. write logs / state transitions
5. repeat on a loop

## Why this matters

This model makes Jarvis behave more like a control plane than a one-shot automation tool.

It enables:

- drift detection
- backfill and retry behavior
- durable trace reconstruction
- clearer operational boundaries

## Near-term roadmap

1. Trace replay / trace assembly
2. Controller health metrics
3. Reconciliation support for more adapters

## See Also

- [Control Plane Architecture](control-plane.md)
- [Reconciliation](reconciliation.md)
- [Reconciliation Concept](reconciliation-concept.md)
- [Security Model](security-model.md)
- [Agent Trust Model](agent-trust-model.md)
