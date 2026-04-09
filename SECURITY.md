# Security

## Reporting a vulnerability

If you believe you have found a security issue in Jarvis HUD, please **do not** open a public GitHub issue.

Instead, contact the maintainer privately with:

- A short description of the issue and its impact
- Steps to reproduce (or a proof of concept), if safe to share
- Any relevant version / commit and environment details

We will treat reports seriously and work with you on a coordinated disclosure timeline.

## Scope

This project is a **local-first control plane** demo and development tool. It is not positioned as a hardened multi-tenant production service. Still, we welcome responsible disclosure of defects that could affect operators running the software as documented.

## Secrets and configuration

- Do not commit `.env.local`, API keys, or ingress signing secrets.
- Use `env.example` and [docs/setup/env.md](docs/setup/env.md) as references only.

## Design intent (thesis)

Execution is intentionally separated from proposal and approval. That boundary is a product and safety property, not a substitute for full security review of your deployment.
