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

`launch:validate` is the small post-deployment gate. Supply only affected canonical paths through `PUBLIC_LAUNCH_PATHS`. The exhaustive `launch:audit` command is not a routine release command; production use is guarded and belongs only to the explicit local `$tnm-site-assurance` workflow.

Follow the startup routing in [AGENTS.md](AGENTS.md) and the [Codex Workflow Contract](context/governance/Codex%20Workflow%20Contract.md) once per task. Read other contracts only for the affected system; this README adds no mandatory reading stack.

Use `content/brand/True North Map Brand System.md` for approved brand assets and language, `app/README.md` for application development, and `research/README.md` for the evidence workflow. Run the scoped checks during development and `pnpm release:validate` before production release.

## File placement

| Area | Owns | Does not own |
| --- | --- | --- |
| `app/` | Next.js source, public/private routes, runtime configuration, tests, current research scripts, and production-database migrations | Research source books, review packets, product planning, alternate runtime datasets |
| `research/` | Source discovery, staged evidence, ingestion schemas, review artifacts, analysis | Runtime code or promoted seed data |
| `context/` | Canonical governance, durable plans and decision history | Candidate data or application implementation |
| `content/` | Approved brand/copy, email templates and explicitly requested collateral | Product UI assets required at runtime |
### Working conventions

- Run standard commands from the repository root. The root `package.json` forwards them to `app/`.
- Treat `research/ingestion/` as immutable, versioned private-review lineage and Supabase project `facoactpdckkhciamflk` as the sole canonical dataset. Commit validated research artifacts separately from UI or runtime work; local scratch output and raw private material stay ignored.
- Treat `app/supabase/seed.sql` only as a reproducible migration/test fixture. It is not a runtime source or promotion target.
- Do not retain alternate schemas, CSV-era seed stores, or legacy ingestion commands inside the deployable application.
- Put application-specific types and repositories under `app/src/types/atlas.ts` and `app/src/lib/atlas/`.
- Production-backed operations require their documented configuration and valid canonical baselines. Missing essential database access blocks the dependent operation, not unrelated local instruction work or authorized public investigation. Follow the Cross-System Contract for local fixture, instruction-only and release checks; do not query production merely to validate documentation.
- Put durable product decisions in `context/governance/`, not in source-code comments or research reports.
- Use `context/governance/INDEX.md` as the single entrance to conditional contracts and historical records.
- Use `context/governance/plans/` only for multi-session coordination; routine task handoffs remain in the completion response.
- Keep executable operator-only research and visibility skills in ignored `.agents/skills/`. The public repository tracks only the application contracts, schemas, governance boundaries, and reviewed lineage needed for safe interoperability.
- Keep runtime imagery in `app/public/` and approved reusable content in `content/`. Generate reports, screenshots and collateral only on explicit request and keep private/generated working output ignored.
- Avoid adding another top-level folder unless it represents a genuinely new operating concern.
