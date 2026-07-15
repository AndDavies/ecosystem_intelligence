# Evidence And Mapping Skill

Project-local skill for mapping capabilities to use cases and creating evidence records for reviewable ingestion.

## Purpose

Translate approved company/capability candidate records into source-backed capability-use-case mappings with evidence snippets, field citations, confidence notes, and clear rationale.

## When To Use

Use this skill when the task is to:

- map a capability to an existing Use Case and Cluster
- decide `pathway`, `relevance_band`, `defence_relevance`, and `suggested_action_type`
- write `why_it_matters` from source-backed evidence
- create evidence snippets and field citations
- assign evidence strength and actionability scores

Do not use this skill to:

- create new use cases or clusters
- map weak evidence as high relevance
- cite a claim that is not supported by a source
- write directly to Supabase
- promote candidate batches

## Inputs

- Candidate company records
- Candidate capability records
- Approved source records
- Existing `use_case_id`, `domain_id`, and `cluster_id` values
- Source excerpts or paraphrased evidence
- Human review notes

## Outputs

- Candidate `capabilityUseCases` records
- Candidate `signals` records when concrete dated events exist
- Candidate `evidenceSnippets` records
- Candidate `fieldCitations` records
- Confidence and research rationale for each mapping

## Mapping Rules

- Use only existing `use_case_id`, `domain_id`, and `cluster_id` values.
- High relevance plus high defence relevance requires evidence strength of at least `3`.
- Use `signals` only for concrete dated events such as funding, contract, pilot, partnership, strategic hiring, accelerator, or technical milestone.
- Treat public-source mission fit as alignment, not classified demand.
- Prefer `moderate` or `needs_validation` when mission fit is plausible but not directly supported.

## Citation Rules

Field citations are required for:

- company `overview`
- capability `summary`
- mapping `why_it_matters`

Evidence snippets should be concise paraphrases or short compliant excerpts. Do not copy long passages from source material.

## Workflow

1. Confirm the capability has a reviewed company and source basis.
2. Select existing use case and cluster IDs that match the evidence.
3. Draft `why_it_matters` from source-backed facts and public mission alignment.
4. Assign pathway, relevance, defence relevance, suggested action, evidence strength, and actionability.
5. Create evidence snippets and field citations for required fields.
6. Flag uncertain mappings rather than overfitting them.
7. Hand complete candidate batch to Database And Review Steward.

## Allowed Tools

- Local taxonomy, schema, and seed reads
- Supabase MCP read inspection for taxonomy and duplicate checks
- `pnpm ingest:validate` once a full candidate batch exists

## Restricted Actions

- Do not invent taxonomy IDs.
- Do not cite browser tokens or local report markers.
- Do not use social/YouTube-only evidence for promoted mappings in v1.
- Do not write to Supabase.

## Quality Checklist

- Every important claim has evidence support.
- Mapping rationale is useful to BD/review users.
- Confidence reflects source strength and mission-fit uncertainty.
- Required citations are present.
- Candidate output validates against the current schema.

## Change Log

- `2026-04-30`: Initial focused skill created.
