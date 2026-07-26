# True North Map / Ecosystem Intelligence

This workspace powers [True North Map](https://truenorthmap.ca), the independent public brand for the Ecosystem Intelligence project. It separates the runnable product from the evidence and context that support it.

## Project map

- `app/` — Next.js application, tests, scripts, hosted-database migrations, and seed data.
- `research/` — source books, research playbooks, staged ingestion batches, review packets, and research analysis.
- `context/` — product governance, plans, handoffs, and project-local agent guidance.
- `content/` — outward-facing collateral and media projects.

Inside the deployable product, `app/src/app/` is the standard Next.js App Router directory: the outer `app/` is the product package, `src/` contains source code, and the inner `app/` defines routes and APIs. It is not the retired `/app` URL.

## Common commands

Run product commands from the project root; they are forwarded to `app/`:

```bash
pnpm dev
pnpm test
pnpm lint
pnpm build
pnpm data:readiness
pnpm release:validate
pnpm launch:validate
```

Before material work, read:

- `context/governance/True North Map Project Overview.md`
- `context/governance/Project Status.md`
- `context/governance/Cross-System Change And Regression Contract.md`
- `context/governance/Skills And Automation Map.md`

Use `content/brand/True North Map Brand System.md` for approved brand assets and language, `app/README.md` for application development, and `research/README.md` for the evidence workflow. Run the scoped checks during development and `pnpm release:validate` before production release.
