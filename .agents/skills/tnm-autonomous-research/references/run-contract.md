# Run contract

## Canonical artifacts

- Run: `research/ingestion/runs/<run-id>.json`
- Brief: `research/ingestion/briefs/<run-id>.md`
- Prospect inventory: `research/ingestion/prospect-inventories-v1/<run-id>.json`
- Leads: `research/ingestion/source-leads-v2/<batch-id>.json`
- Candidates: `research/ingestion/candidate-batches-v2/<batch-id>.json`
- Review: `research/ingestion/reviews-v2/<batch-id>.md`
- Staging export: `research/ingestion/staging/<run-id>.json`

## Executable schemas

- `app/src/lib/research/pipeline-schema.ts`
- `research/ingestion/schema/research-run.schema.json`
- `research/ingestion/schema/research-prospect-inventory-v1.schema.json`
- `research/ingestion/schema/source-leads-v2.schema.json`
- `research/ingestion/schema/research-candidate-batch-v2.schema.json`

## Completion

Set a discovery-batch run to `completed` only after it enumerates at least 40 prospects across six source lanes, produces at least eight candidates or proves exhaustion, passes validators, and places every candidate in Admin Review. The target is 10. A below-target run needs both a specific `underTargetReason` and `exhaustionEvidence`; it may not hide weak discovery behind a stop reason. Deep-dossier runs use 1-5 named prospects and at least three lanes. Every `qualified` lead continues automatically without a human approval pause.

Candidates must be enriched to the depth supported by durable public evidence. A useful organization bundle normally covers identity and aliases, controlled classification, a concrete role or capability, Canadian location, public contact paths when available, programs or relationships when relevant, and multiple complementary sources with field evidence. Missing public facts remain null; unsupported detail is never invented.

The selected gap may produce organization or public-demand candidates. Programs and relationships should normally be nested in an organization bundle so they share the same review and publication path. Create a standalone program-relationship candidate only when the current Admin Review and publication workflow supports it end to end. Public demand includes official signals from Canadian governments, DND/CAF, the RCN, RCAF, Canadian Army, procurement or innovation authorities, NATO, and other public issuers; it is not limited to NATO.

## Required final command

```bash
pnpm research:smoke -- --run <run-path> --prospects <prospect-path> --leads <lead-path> --candidates <candidate-path>
```

When the local service-role credential is unavailable, run the command with `--file-only`, then call only `public.stage_research_candidates_for_review` through the Supabase connector with the validated staging export. Completion still requires a verified current-run `pending` candidate in Admin Review.
