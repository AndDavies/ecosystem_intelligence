# Ingestion Candidate Workflow

Research-agent artifacts live here before validated typed candidates enter the existing private Admin Review queue.

## Autonomous v2 workflow

The implemented True North Map coordinator uses typed artifacts through research, validation, and review-packet generation, then sends validated candidates directly into the private Admin Review workflow:

```text
research/ingestion/runs/                 bounded run manifests
research/ingestion/briefs/               generated gap-selection briefs
research/ingestion/source-leads-v2/      typed organization/demand/program/relationship leads
research/ingestion/candidate-batches-v2/ typed private candidate bundles
research/ingestion/reviews-v2/           human review packets
research/ingestion/staging/              non-publishable database-shaped exports
```

Run a manual cycle from the repository root:

```bash
pnpm data:readiness
pnpm research:coverage
pnpm research:prepare -- --trigger manual
```

Complete the generated brief with the project skills under `.agents/skills/`, update the run manifest, then execute the recorded smoke command. The exact form is:

```bash
pnpm research:smoke -- \
  --run research/ingestion/runs/<run-id>.json \
  --leads research/ingestion/source-leads-v2/<run-id>.json \
  --candidates research/ingestion/candidate-batches-v2/<run-id>.json
```

The smoke test validates the run, source leads, candidates, generated reviewer rationales, taxonomy, duplicate status, and field evidence. It creates a reviewer packet and non-publishable staging export, then uses a service-role-only idempotent intake function to create private `candidate_changes` rows in Admin Review. It does not approve or publish a record. Use `pnpm research:import -- --staging <path>` to retry intake when local credentials are available. A Codex run without a local service-role credential uses `--file-only` and then calls only `public.stage_research_candidates_for_review` through the Supabase connector; it must still verify that every current-run candidate is pending in Admin Review with its reviewer rationale before declaring success. A run that stops at files is incomplete.

Organization and public-demand bundles are first-class review objects. Demand sources may come from the Government of Canada, DND/CAF, RCN, RCAF, Canadian Army, procurement and innovation authorities, NATO, or another supported public issuer. Accepted organization and demand candidates move to the same separate human Publish checkpoint.

Repository skills:

- `$tnm-autonomous-research`: bounded coordinator and stop conditions
- `$tnm-source-discovery`: durable source expansion and typed leads
- `$tnm-candidate-builder`: role-specific candidate construction and generated inclusion rationale
- `$tnm-evidence-mapper`: source-backed facts and labelled derived analysis
- `$tnm-review-steward`: deterministic validation and direct private review intake

## Schema Files

- `research/ingestion/schema/research-run.schema.json`: bounded coordinator run and audit metadata.
- `research/ingestion/schema/source-leads-v2.schema.json`: typed organization, demand, program, and relationship leads.
- `research/ingestion/schema/research-candidate-batch-v2.schema.json`: typed private candidate bundles.
- `research/ingestion/schema/source-leads.schema.json`: source-discovery backlog before full candidate records exist.
- `research/ingestion/schema/research-candidate-batch.schema.json`: staged database-ready research output for review.
- `context/governance/Research Agent Schema And Source Contract.md`: plain-language field policy, nullable fields, and source rules.

The TypeScript/Zod definitions in `app/src/lib/research/pipeline-schema.ts` are the executable v2 contract. The JSON Schemas are portable documentation contracts.

## Contract

Legacy company-and-capability candidate batches live in `research/ingestion/candidate-batches/*.json`.

Legacy company source-lead batches live in `research/ingestion/source-leads/*.json`.

Each batch must remain a `candidate` and include:

- canonical company, capability, mapping, source, evidence snippet, and field citation records
- confidence and research rationale on each company, capability, and mapping
- canonical `https` source URLs, not browser citation tokens or copied report markers
- paraphrased evidence snippets, not long copied source text
- citations for every company overview, capability summary, and mapping `why_it_matters`
- operational metadata is preserved during promotion as `data_stage`, `source_confidence`, `research_rationale`, and `source_batch_id`

## Source Lead Validation

Run:

```bash
pnpm leads:validate
```

Source leads are the preferred first output from a research agent. They are not promoted and do not create database records. Use them to review:

- whether the organization is real and relevant
- whether the source URL is canonical and durable
- which Mission Areas and Technical Domains the lead may support
- what follow-up research is required before candidate creation

## Validation

Run:

```bash
pnpm ingest:validate
```

The validator checks candidate data against the current seed taxonomy and fails on:

- duplicate ids, slugs, or source URLs
- `example.com` or non-HTTPS source URLs
- non-portable citation tokens
- missing overview, summary, or `why_it_matters` citations
- mappings to inactive or unknown use cases
- cluster/domain mismatches
- weak evidence on high-relevance, high-defence mappings
- invalid dates, enums, or stale-review windows

## Data Readiness

Run:

```bash
pnpm data:readiness
```

The readiness report shows:

- the current published organization, capability, and demand counts
- coverage by organization kind, Mission Area, Technical Domain, and demand issuer type
- reviewed candidate artifacts that are not already present in the published atlas
- missing ecosystem and public-demand lanes for the next bounded research run

## Review

Generate a reviewer packet:

```bash
pnpm ingest:review
```

Or review one batch:

```bash
pnpm ingest:review research/ingestion/candidate-batches/arctic-domain-awareness-pilot.json
```

Review packets are written to `research/ingestion/reviews/*.md`. They include validation status, review checklist, candidate records, mappings, sources, and the exact promotion command to run after human acceptance.

## Promotion

Candidate batches are not imported automatically. A reviewer should inspect the validation report, source quality, realism, and duplicate risk before promotion.

Promote an approved batch into seed CSVs:

```bash
pnpm ingest:promote research/ingestion/candidate-batches/arctic-domain-awareness-pilot.json --reviewer "Reviewer Name"
```

Preview promotion without writing seed files:

```bash
pnpm ingest:promote research/ingestion/candidate-batches/arctic-domain-awareness-pilot.json --reviewer "Reviewer Name" --dry-run
```

Promotion appends approved rows to `app/supabase/seed/*.csv` and writes an audit-style promotion log to `research/ingestion/promotions/*.json`. It will refuse to promote a batch with validation errors or a batch that already has a promotion log.
