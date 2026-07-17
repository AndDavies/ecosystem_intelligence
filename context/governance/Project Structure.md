# Project Structure

## Purpose

The repository root is a workspace map rather than an application directory. Product code, evidence work, durable context, and outward-facing collateral have separate homes so each can grow without obscuring the others.

## Top-level areas

| Area | Owns | Does not own |
| --- | --- | --- |
| `app/` | Next.js source, public/private routes, runtime configuration, tests, scripts, clean hosted-database migration, validated seed | Research source books, review packets, product planning |
| `research/` | Source discovery, staged evidence, ingestion schemas, review artifacts, analysis | Runtime code or promoted seed data |
| `context/` | PRD, plans, audits, handoffs, agent role guidance | Candidate data or application implementation |
| `content/` | Launch collateral, media, and future copy or demo assets | Product UI assets required at runtime |

## Working conventions

- Run standard commands from the repository root. The root `package.json` forwards them to `app/`.
- Treat `research/ingestion/` as file-based review staging and `app/supabase/seed.sql` as the clean promoted public seed.
- Keep prior internal-workspace migrations and CSV seed material under `app/supabase/legacy/`; they are readable reference data, not inputs to the public atlas.
- Put application-specific types and repositories under `app/src/types/atlas.ts` and `app/src/lib/atlas/`.
- Use `ATLAS_DATA_SOURCE=supabase` for the migrated and verified hosted project.
  `validated_seed` remains an explicit local fallback; the app must not silently
  fall back when hosted data is requested.
- Put durable product decisions in `context/governance/`, not in source-code comments or research reports.
- Put project-local agent role instructions in `context/agent-skills/`.
- Keep runtime imagery in `app/public/`; keep campaign or production media in `content/`.
- Avoid adding another top-level folder unless it represents a genuinely new operating concern.
