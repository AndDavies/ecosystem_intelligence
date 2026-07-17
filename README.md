# Ecosystem Intelligence

This workspace separates the runnable product from the evidence and context that support it.

## Project map

- `app/` — Next.js application, tests, scripts, hosted-database migrations, and seed data.
- `research/` — source books, research playbooks, staged ingestion batches, review packets, and research analysis.
- `context/` — product governance, plans, handoffs, and project-local agent guidance.
- `content/` — outward-facing collateral and media projects.

## Common commands

Run product commands from the project root; they are forwarded to `app/`:

```bash
pnpm dev
pnpm test
pnpm lint
pnpm build
pnpm data:readiness
```

See `app/README.md` for application development and `research/README.md` for the evidence workflow.
