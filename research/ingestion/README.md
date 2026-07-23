# Research and review workflow

Research artifacts are private, review-first inputs. The production Supabase project is the sole source for published records, taxonomy, coverage, duplicate checks, and review state.

## Current workflow

```text
research/ingestion/runs/                 bounded run manifests
research/ingestion/briefs/               gap-selection briefs
research/ingestion/signal-batches-v1/    atomic multi-source signal ledgers
research/ingestion/source-leads-v2/      typed source leads
research/ingestion/candidate-batches-v2/ typed candidate bundles
research/ingestion/reviews-v2/           reviewer packets
research/ingestion/staging/              non-publishable staging exports
```

Run `pnpm data:readiness`, `pnpm research:coverage`, then `pnpm research:prepare -- --trigger manual`. Complete the generated brief with the skills in `.agents/skills/`, then execute its recorded smoke command.

The coordinator validates live taxonomy, coverage, duplicate risk, evidence, and reviewer rationale. Validated new-record and refresh candidates enter the same private Admin Review queue through `public.stage_research_candidates_for_review`. They never update published records and never publish automatically.

Live staging also requires the deployed `https://truenorthmap.ca/api/system/research-contract` response to support every candidate kind and schema version in the export. If the application is older, unavailable, or incompatible, intake stops before `candidate_changes` and the validated artifacts remain file-only until the matching Review and Publish interfaces are deployed.

In `refresh_batch` mode, `$tnm-signal-refresh` builds live organization and demand watchlists, extracts and deduplicates atomic signals, resolves durable evidence, and matches each signal to canonical entities before the normal source-lead, candidate, evidence, and review-steward stages. Existing-record matches produce `organization_refresh_bundle_v1` or `demand_refresh_bundle_v1` candidates containing a target ID, baseline `updated_at`, complete before-state, and explicit additive operations. The JSON is a private change proposal, not a merged canonical record.

If the production database cannot be reached, the run stops. Bundled records, seed files, remembered taxonomy, and file-only completion are not acceptable substitutes for a production readiness decision.

## Contracts

- `research/ingestion/schema/research-run.schema.json`
- `research/ingestion/schema/research-signal-batch-v1.schema.json`
- `research/ingestion/schema/source-leads-v2.schema.json`
- `research/ingestion/schema/research-candidate-batch-v2.schema.json`
- `app/src/lib/research/pipeline-schema.ts` — executable Zod contract
- `context/governance/Research Agent Schema And Source Contract.md` — field and evidence policy

Every candidate retains canonical public sources, field-level evidence, confidence, duplicate findings, and a generated reviewer rationale. Accepted candidates still require Andrew's separate, explicit Publish action.

## Validation

Run `pnpm release:validate`. The unified gate covers tests, lint, research contracts, live production coverage, and the production build. Historical reports are evidence of past runs, not current operating instructions.
