# Ingestion lineage

`research/ingestion/` is the repository record of a reviewed, reproducible research handoff. It is not an alternate runtime dataset, a queue, or publication authority. Supabase project `facoactpdckkhciamflk` remains the sole canonical runtime and publication source.

## What belongs here

Commit only validated, typed artifacts that explain how a review candidate was prepared:

| Path | Purpose |
| --- | --- |
| `schema/` | Versioned file contracts for the research workflow. |
| `collection-plans-v1/` | Intelligence requirements, named subjects, priority questions, source lanes, and stop conditions. |
| `claim-ledgers-v1/` | Atomic claims, source independence, conflicts, candidate targets, and dossier coverage. |
| `prospect-inventories-v1/` | Enumerated prospects and coverage selection rationale. |
| `signal-batches-v1/` | Atomic refresh signals and dispositions. |
| `source-leads-v2/` | Qualified, deferred, and rejected source leads. |
| `candidate-batches-v2/` | Reviewable proposed organization, demand, or refresh changes. |
| `reviews-v2/` and `briefs/` | Human-readable review packets and run summaries. |
| `staging/` | Validated, non-publishable payloads submitted to private Admin Review. |
| `runs/` and `reports/` | Deterministic run metadata and validation reports. |

Keep artifacts immutable once staged. A correction or later refresh creates a new run with a new identifier; it does not rewrite prior evidence or publish a record.

## Workflow safeguards

Run `pnpm data:readiness`, `pnpm research:coverage`, then `pnpm research:prepare -- --trigger manual`. Complete the generated brief, collection plan, and claim ledger using the project-local skills in `.agents/skills/`, then run the recorded smoke command with `--collection-plan` and `--claims`.

The coordinator validates live taxonomy, coverage, duplicate risk, evidence, and reviewer rationale. Validated new-record and refresh candidates enter private Admin Review only through `public.stage_research_candidates_for_review`. They never update published records or publish automatically.

Before live staging, the importer must confirm that `https://truenorthmap.ca/api/system/research-contract` supports every candidate kind and schema version in the export. If the deployed application is unavailable or incompatible, intake stops before `candidate_changes`; validated files remain evidence only until matching Review and Publish interfaces are deployed.

In `refresh_batch` mode, `$tnm-signal-refresh` resolves durable evidence and matches signals to live entities before the ordinary source-lead, candidate, evidence, and review-steward stages. An existing-record proposal includes its stable target ID, captured baseline, complete before-state, and explicit additive operations. It remains a private change proposal until human publication.

If the production database cannot be reached, the run stops. Bundled records, seed files, remembered taxonomy, and file-only completion are not substitutes for a production readiness decision.

## What does not belong here

Do not commit raw email, private uploads, browser downloads, credentials, copied third-party content, local scratch files, Python bytecode, editor metadata, or generated build output. Use `research/raw/`, the private knowledge base, or ignored `ingestion/local/` and `ingestion/.tmp/` for material that is not a validated handoff.

## Commit discipline

Validate the relevant batch before committing it. Keep a research-artifact commit separate from application, UI, migration, or documentation work unless the change is the shared typed contract itself. A committed artifact documents review provenance only: it never accepts, publishes, or alters canonical tables.

## Contracts and validation

- `research/ingestion/schema/research-run.schema.json`
- `research/ingestion/schema/research-collection-plan-v1.schema.json`
- `research/ingestion/schema/research-claim-ledger-v1.schema.json`
- `research/ingestion/schema/research-signal-batch-v1.schema.json`
- `research/ingestion/schema/source-leads-v2.schema.json`
- `research/ingestion/schema/research-candidate-batch-v2.schema.json`
- `app/src/lib/research/pipeline-schema.ts` is the executable Zod contract.
- `context/governance/Research Agent Schema And Source Contract.md` defines the field and evidence policy.

Run `pnpm release:validate` for the full application, research-contract, live-coverage, and build gate. Historical reports are evidence of prior runs, not current operating instructions.
