# Ingestion Candidate Workflow

Research-agent output should land here before it is promoted into `supabase/seed` or a persisted Supabase environment.

## Schema Files

- `data/ingestion/schema/source-leads.schema.json`: source-discovery backlog before full candidate records exist.
- `data/ingestion/schema/research-candidate-batch.schema.json`: staged database-ready research output for review.
- `Governance Files/Research Agent Schema And Source Contract.md`: plain-language field policy, nullable fields, and source rules.

## Contract

Candidate batches live in `data/ingestion/candidate-batches/*.json`.

Source-lead batches live in `data/ingestion/source-leads/*.json`.

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

Optionally write a dated report:

```bash
pnpm data:readiness -- --write
```

The readiness report shows:

- validated versus scaffold companies, capabilities, and mappings
- scaffold debt by Mission Area
- whether each Mission Area has enough real companies, real capabilities, and top targets to support staged research
- the recommended order for source-lead and candidate batches

## Review

Generate a reviewer packet:

```bash
pnpm ingest:review
```

Or review one batch:

```bash
pnpm ingest:review data/ingestion/candidate-batches/arctic-domain-awareness-pilot.json
```

Review packets are written to `data/ingestion/reviews/*.md`. They include validation status, review checklist, candidate records, mappings, sources, and the exact promotion command to run after human acceptance.

## Promotion

Candidate batches are not imported automatically. A reviewer should inspect the validation report, source quality, realism, and duplicate risk before promotion.

Promote an approved batch into seed CSVs:

```bash
pnpm ingest:promote data/ingestion/candidate-batches/arctic-domain-awareness-pilot.json --reviewer "Reviewer Name"
```

Preview promotion without writing seed files:

```bash
pnpm ingest:promote data/ingestion/candidate-batches/arctic-domain-awareness-pilot.json --reviewer "Reviewer Name" --dry-run
```

Promotion appends approved rows to `supabase/seed/*.csv` and writes an audit-style promotion log to `data/ingestion/promotions/*.json`. It will refuse to promote a batch with validation errors or a batch that already has a promotion log.
