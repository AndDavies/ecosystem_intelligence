# Research Analyst Skill

Project-local skill for source-backed ecosystem research in the `Ecosystem Intelligence` project.

Status: umbrella contract for project-local research agents. Use this skill for shared research rules, then apply the focused skill that matches the task.

Focused companion skills:

- `context/agent-skills/research-coordinator.md`
- `context/agent-skills/source-discovery.md`
- `context/agent-skills/company-profile-builder.md`
- `context/agent-skills/evidence-mapping.md`
- `context/agent-skills/database-review-steward.md`

## Purpose

Help a research agent discover real public sources, assess whether they are useful, and prepare staged candidate data that can be reviewed in the app before promotion.

The research analyst should strengthen the corpus while preserving the product's trust model: public-source only, source-backed, evidence-linked, and reviewable.

## When To Use

Use this skill when the task is to:

- find companies or capabilities relevant to existing use cases
- collect source leads for later review
- convert approved leads into candidate batch JSON
- assess whether a source supports a company, capability, signal, or mapping claim
- prepare evidence snippets and field citations

Do not use this skill to:

- write directly to Supabase
- promote ingestion candidates
- create new active use cases
- invent taxonomy IDs
- scrape private contact data
- imply classified CAF, DND, NORAD, NATO, or procurement target guidance

Use the companion skill directly when the task has a clear agent posture:

- batch planning and handoffs: `research-coordinator`
- broad source discovery: `source-discovery`
- approved-lead profile conversion: `company-profile-builder`
- mapping and citation work: `evidence-mapping`
- schema, validation, and Supabase inspection: `database-review-steward`

## Canonical References

Read these before producing candidate data:

- `context/governance/Research Agent Schema And Source Contract.md`
- `research/ingestion/schema/source-leads.schema.json`
- `research/ingestion/schema/research-candidate-batch.schema.json`
- `research/ingestion/README.md`
- `supabase/migrations/001_init.sql`
- `supabase/migrations/002_use_case_realism.sql`

## Operating Workflow

1. Confirm the target use cases and domains.
2. Gather source leads first unless the user explicitly provides approved leads.
3. Prefer official and canonical sources.
4. Reject weak or non-durable sources before drafting records.
5. Map only to existing `use_case_id`, `domain_id`, and `cluster_id` values.
6. Create candidate records only when evidence supports the field.
7. Add `confidence` and `research_rationale` to every company, capability, and mapping.
8. Add sources, evidence snippets, and field citations for every important claim.
9. Run or ask the operator to run `pnpm ingest:validate`.
10. Leave promotion to the `/review` route or explicit human action.

For Global Source Book expansion, do not use a fixed row cap. Search recursively, save durable repeatable sources, and record unresolved trails for later passes. When creating source leads, choose a reviewable batch size before work begins. Social media, YouTube channels, and YouTube transcripts can guide discovery, but promoted evidence should resolve to durable company, government/program, press-release, or reputable publication sources.

## Output Modes

### Source Leads

Use source leads when evidence is promising but incomplete.

Output must follow:

```text
research/ingestion/schema/source-leads.schema.json
```

Source leads are allowed to include rejected or uncertain records if `confidence` and `doNotIngestReason` explain the status.

### Candidate Batch

Use candidate batches only after source quality is strong enough for review.

Output must follow:

```text
research/ingestion/schema/research-candidate-batch.schema.json
```

Candidate batches must include companies, capabilities, mappings, sources, evidence snippets, and field citations.

## Required Candidate Fields

Companies require:

- `id`
- `slug`
- `name`
- `overview`
- `geography`
- `headquarters`
- `last_updated_at`
- `confidence`
- `research_rationale`

Capabilities require:

- `id`
- `company_id`
- `slug`
- `name`
- `capability_type`
- `domain_id`
- `summary`
- `last_updated_at`
- `confidence`
- `research_rationale`

Capability-use-case mappings require:

- `id`
- `capability_id`
- `use_case_id`
- `cluster_id`
- `pathway`
- `relevance_band`
- `defence_relevance`
- `suggested_action_type`
- `why_it_matters`
- `reviewer_override_delta`
- `evidence_strength`
- `actionability_score`
- `stale_after_days`
- `confidence`
- `research_rationale`

Sources require:

- `id`
- `source_type`
- `title`
- `url`
- `publisher`

Evidence snippets require:

- `id`
- `source_id`
- `excerpt`

Field citations require:

- `id`
- `entity_type`
- `entity_id`
- `field_name`
- `evidence_snippet_id`

## Nullable Or Follow-Up Fields

These may be null and filled manually or through later research:

- company `market_context`
- company `website_url`
- company `public_contact_email`
- company `public_contact_phone`
- capability `company_facing_context`
- mapping `action_note`
- mapping `last_signal_at`
- source `published_at`
- evidence snippet `capability_id` when supporting company context only

Do not use null to avoid evidence. Required summary, rationale, mapping, and citation fields must be complete.

## Source Quality

Preferred source order:

1. Official company product, news, investor, or documentation pages
2. Government, NATO, defence program, procurement, or policy sources
3. Reputable industry publications with direct company or program references
4. Secondary summaries only when they lead to primary sources

Reject or defer:

- non-canonical URLs
- non-HTTPS URLs
- browser citation tokens
- social posts without durable links
- sources that imply classified or internal target guidance
- vague marketing pages that do not describe a concrete capability
- claims that cannot be tied to a field citation

## Confidence Guidance

- `high`: source directly supports the record and the mapping is not speculative
- `moderate`: capability is real, but mission fit still needs operator validation
- `needs_validation`: plausible but too thin for promotion; prefer source leads unless the uncertainty is intentional

## Validation

Candidate batches must pass:

```bash
pnpm ingest:validate
```

Promotion happens in `/review`; this skill should not promote.

## Change Log

- `2026-04-19`: Initial scaffold created.
- `2026-04-25`: Expanded into a research-agent data contract aligned to candidate ingestion schemas and review workflow.
- `2026-04-30`: Reframed as the shared umbrella contract for five focused research-agent skills.
