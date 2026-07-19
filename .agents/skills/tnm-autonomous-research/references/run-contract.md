# Run contract

## Canonical artifacts

- Run: `research/ingestion/runs/<run-id>.json`
- Brief: `research/ingestion/briefs/<run-id>.md`
- Leads: `research/ingestion/source-leads-v2/<batch-id>.json`
- Candidates: `research/ingestion/candidate-batches-v2/<batch-id>.json`
- Review: `research/ingestion/reviews-v2/<batch-id>.md`
- Staging export: `research/ingestion/staging/<run-id>.json`

## Executable schemas

- `app/src/lib/research/pipeline-schema.ts`
- `research/ingestion/schema/research-run.schema.json`
- `research/ingestion/schema/source-leads-v2.schema.json`
- `research/ingestion/schema/research-candidate-batch-v2.schema.json`

## Completion

Set the run to `completed` only after the lead and candidate validators pass and the trusted intake has produced at least one current-run pending row in Admin Review. Record every query and counter. Set `validation.passed` true only when the smoke test has zero errors. Every candidate must include a generated `reviewerRationale`. The staging export remains non-publishable and is sent by the smoke command through trusted intake directly into Admin Review.

The selected gap may produce organization, public-demand, or program-relationship candidates. Public demand includes official signals from Canadian governments, DND/CAF, the RCN, RCAF, Canadian Army, procurement or innovation authorities, NATO, and other public issuers; it is not limited to NATO.

## Required final command

```bash
pnpm research:smoke -- --run <run-path> --leads <lead-path> --candidates <candidate-path>
```

When the local service-role credential is unavailable, run the command with `--file-only`, then call only `public.stage_research_candidates_for_review` through the Supabase connector with the validated staging export. Completion still requires a verified current-run `pending` candidate in Admin Review.
