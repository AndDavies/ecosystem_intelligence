# Project Structure

## Purpose

The repository root is a workspace map rather than an application directory. Product code, evidence work, durable context, and outward-facing collateral have separate homes so each can grow without obscuring the others.

## Top-level areas

| Area | Owns | Does not own |
| --- | --- | --- |
| `app/` | Next.js source, public/private routes, runtime configuration, tests, current research scripts, and production-database migrations | Research source books, review packets, product planning, alternate runtime datasets |
| `research/` | Source discovery, staged evidence, ingestion schemas, review artifacts, analysis | Runtime code or promoted seed data |
| `context/` | PRD, plans, audits, handoffs, agent role guidance | Candidate data or application implementation |
| `content/` | Launch collateral, media, and future copy or demo assets | Product UI assets required at runtime |

## Working conventions

- Run standard commands from the repository root. The root `package.json` forwards them to `app/`.
- Treat `research/ingestion/` as typed v2 private review staging and Supabase project `facoactpdckkhciamflk` as the sole canonical dataset.
- Treat `app/supabase/seed.sql` only as a reproducible migration/test fixture. It is not a runtime source or promotion target.
- Do not retain alternate schemas, CSV-era seed stores, or legacy ingestion commands inside the deployable application.
- Put application-specific types and repositories under `app/src/types/atlas.ts` and `app/src/lib/atlas/`.
- Require production database configuration for application startup, research coverage, taxonomy validation, duplicate checks, and release validation. Missing or failed database access is a hard stop.
- Put durable product decisions in `context/governance/`, not in source-code comments or research reports.
- Put project-local agent role instructions in `context/agent-skills/`.
- Keep runtime imagery in `app/public/`; keep campaign or production media in `content/`.
- Avoid adding another top-level folder unless it represents a genuinely new operating concern.
