# Company Profile Builder Skill

Project-local skill for converting approved source leads into staged company and capability candidate records.

## Purpose

Turn human-approved source leads into reviewable company and capability profiles while preserving source-backed evidence, taxonomy discipline, and the review-first ingestion model.

## When To Use

Use this skill when the task is to:

- convert approved source leads into candidate company records
- draft company overviews and capability summaries
- normalize company IDs, slugs, headquarters, geography, website URLs, and public context
- prepare candidate batch records before evidence mapping

Do not use this skill to:

- work from unreviewed source leads unless explicitly approved
- invent companies or capabilities from weak sources
- create or modify use cases, domains, or clusters
- write directly to Supabase
- promote candidate records

## Inputs

- Approved source leads
- Existing companies and capabilities for duplicate checks
- Existing domain IDs
- Source URLs and source metadata
- Human review notes

## Outputs

- Candidate `companies` records
- Candidate `capabilities` records
- Draft `sources` records for evidence support
- Research rationale and confidence for each company and capability
- Follow-up notes for missing nullable fields

## Required Company Fields

- `id`
- `slug`
- `name`
- `overview`
- `geography`
- `headquarters`
- `market_context`
- `website_url`
- `public_contact_email`
- `public_contact_phone`
- `last_updated_at`
- `confidence`
- `research_rationale`

## Required Capability Fields

- `id`
- `company_id`
- `slug`
- `name`
- `capability_type`
- `domain_id`
- `summary`
- `company_facing_context`
- `last_updated_at`
- `confidence`
- `research_rationale`

## Workflow

1. Confirm source leads were reviewed and approved for candidate conversion.
2. Check duplicate risk against existing seed data and, when available, Supabase read inspection.
3. Create stable lowercase kebab-case IDs and slugs.
4. Draft company overviews only from source-backed facts.
5. Draft capability summaries at controlled granularity.
6. Use null for allowed follow-up fields when evidence is not available.
7. Hand records to Evidence And Mapping Analyst for mappings, snippets, and citations.

## Allowed Tools

- Local seed/schema reads
- Supabase MCP read inspection for duplicate checks
- `pnpm ingest:validate` after a complete candidate batch exists

## Restricted Actions

- Do not run `pnpm ingest:promote`.
- Do not insert or update Supabase records.
- Do not scrape private contact data.
- Do not classify a record as `validated`; candidate data remains reviewable until promotion.

## Quality Checklist

- Each company and capability has a source-backed rationale.
- IDs and slugs are stable and unique.
- Confidence is not inflated beyond source support.
- Nullable fields are null rather than guessed.
- Output can be represented in `research-candidate-batch.schema.json`.

## Change Log

- `2026-04-30`: Initial focused skill created.
