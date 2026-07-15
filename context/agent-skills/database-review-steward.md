# Database And Review Steward Skill

Project-local skill for schema fit, validation, duplicate checks, Supabase inspection, and promotion guardrails.

## Purpose

Protect the database and review workflow by ensuring research output fits existing schemas, respects source/evidence rules, and does not bypass human approval.

## When To Use

Use this skill when the task is to:

- inspect Supabase table shape or taxonomy
- check duplicate risk before candidate creation
- validate source leads or candidate batches
- prepare review packets
- decide whether output is ready for human review
- assess whether a migration or SQL change is needed

Do not use this skill to:

- apply migrations without explicit approval
- execute database writes without explicit approval
- promote candidate batches without explicit approval
- silently assume schema state when Supabase reauthentication fails

## Inputs

- Source-lead or candidate-batch artifact
- Local ingestion schemas
- Local seed taxonomy
- Supabase MCP project `voqelrboikemyuvhzlsd`
- Validation command output
- Human approval status

## Outputs

- Schema-fit assessment
- Duplicate-risk notes
- Validation status
- Review readiness recommendation
- Supabase setup/auth blockers
- Exact next validation or review command

## Supabase MCP Policy

Allowed in normal runs:

- list tables and columns
- read taxonomy/reference data
- check current data-stage coverage
- check duplicate company, capability, source URL, or batch IDs
- verify whether candidate output can fit current constraints

Not allowed without explicit human approval:

- `apply_migration`
- `execute_sql` writes
- direct inserts or updates to core tables
- promotion of candidate batches

If Supabase MCP reports reauthentication or permission failure, stop database inspection and report the setup issue.

## Validation Workflow

Use these commands as appropriate:

```bash
pnpm data:readiness
pnpm leads:validate
pnpm ingest:validate
pnpm ingest:review
pnpm seed:validate
```

Do not run:

```bash
pnpm ingest:promote
```

unless the user explicitly approves promotion after review.

## Review Readiness Checks

- Source leads validate against `source-leads.schema.json`.
- Candidate batches validate against `research-candidate-batch.schema.json`.
- Candidate records map only to existing taxonomy IDs.
- Source URLs are canonical `https` URLs.
- Required field citations exist.
- Duplicate IDs, slugs, and URLs are resolved.
- Confidence and research rationale are present.
- Social/YouTube-only evidence is deferred or backed by durable canonical sources.

## Workflow

1. Inspect local schemas and seed taxonomy.
2. Use Supabase MCP read inspection when available and authenticated.
3. Run the relevant validation command.
4. Summarize blockers and required fixes.
5. Generate a review packet only when validation passes.
6. Leave promotion to explicit human approval.

## Quality Checklist

- No unapproved database writes occurred.
- Validation output is captured accurately.
- Blockers are specific and actionable.
- Review readiness is based on schema, evidence, and duplicate checks.
- Any Supabase auth issue is surfaced directly.

## Change Log

- `2026-04-30`: Initial focused skill created.
