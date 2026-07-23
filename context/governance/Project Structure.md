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

The private defence synthesis layer is intentionally outside the repository at `Andrew's Vault/True North Map Defence Wiki`. The repository owns packet contracts and read-only exporters; the private sibling root owns raw packets, evergreen markdown, and compiler reports. Neither is a runtime data source for the public application.

## Working conventions

- Run standard commands from the repository root. The root `package.json` forwards them to `app/`.
- Treat `research/ingestion/` as typed v2 private review staging and Supabase project `facoactpdckkhciamflk` as the sole canonical dataset.
- Treat `app/supabase/seed.sql` only as a reproducible migration/test fixture. It is not a runtime source or promotion target.
- Do not retain alternate schemas, CSV-era seed stores, or legacy ingestion commands inside the deployable application.
- Put application-specific types and repositories under `app/src/types/atlas.ts` and `app/src/lib/atlas/`.
- Require production database configuration for application startup, research coverage, taxonomy validation, duplicate checks, and release validation. Missing or failed database access is a hard stop.
- Put durable product decisions in `context/governance/`, not in source-code comments or research reports.
- Put executable project-local research skills in `.agents/skills/`; governance documents describe their contracts but do not duplicate their instructions.
- Keep runtime imagery in `app/public/`; keep campaign or production media in `content/`.
- Avoid adding another top-level folder unless it represents a genuinely new operating concern.
- Keep public wiki publication deferred until a reviewed Supabase candidate workflow is separately designed and approved.
