# Research and review workflow

Research artifacts are private, review-first inputs. The production Supabase project is the sole source for published records, taxonomy, coverage, duplicate checks, and review state.

## Current workflow

```text
research/ingestion/runs/                 bounded run manifests
research/ingestion/briefs/               gap-selection briefs
research/ingestion/source-leads-v2/      typed source leads
research/ingestion/candidate-batches-v2/ typed candidate bundles
research/ingestion/reviews-v2/           reviewer packets
research/ingestion/staging/              non-publishable staging exports
```

Run `pnpm data:readiness`, `pnpm research:coverage`, then `pnpm research:prepare -- --trigger manual`. Complete the generated brief with the skills in `.agents/skills/`, then execute its recorded smoke command.

The coordinator validates live taxonomy, coverage, duplicate risk, evidence, and reviewer rationale. Validated candidates enter the private Admin Review queue through `public.stage_research_candidates_for_review`. They never update published records and never publish automatically.

If the production database cannot be reached, the run stops. Bundled records, seed files, remembered taxonomy, and file-only completion are not acceptable substitutes for a production readiness decision.

## Contracts

- `research/ingestion/schema/research-run.schema.json`
- `research/ingestion/schema/source-leads-v2.schema.json`
- `research/ingestion/schema/research-candidate-batch-v2.schema.json`
- `app/src/lib/research/pipeline-schema.ts` — executable Zod contract
- `context/governance/Research Agent Schema And Source Contract.md` — field and evidence policy

Every candidate retains canonical public sources, field-level evidence, confidence, duplicate findings, and a generated reviewer rationale. Accepted candidates still require Andrew's separate, explicit Publish action.

## Validation

Run `pnpm release:validate`. The unified gate covers tests, lint, research contracts, live production coverage, and the production build. Historical reports are evidence of past runs, not current operating instructions.
