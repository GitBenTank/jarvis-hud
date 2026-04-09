# Contributing to Jarvis HUD

Thanks for your interest in contributing.

## Workflow

1. **Open an issue** to discuss substantial changes or new features
2. **Fork** the repository and create a branch from `main`
3. **Make your changes** — keep the scope focused
4. **Run tests:** `pnpm test:unit`
5. **Open a pull request** with a clear description of the change

## Guidelines

- Preserve the project's thesis: agents propose, humans approve, execution is separate, every action leaves proof (receipt + artifact + trace)
- Follow existing code style and patterns
- Add tests for new behavior where appropriate
- Do not commit secrets; use `env.example` as reference for env vars

## Setup

```bash
pnpm install
cp env.example .env.local   # optional; set vars as needed
pnpm dev
```

See [README.md](README.md) and [docs/setup/env.md](docs/setup/env.md) for more.
