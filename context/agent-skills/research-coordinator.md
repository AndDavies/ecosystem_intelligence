# Research Coordinator Skill

Project-local skill for planning and routing review-first research batches in the `Ecosystem Intelligence` project.

## Purpose

Own research scope, mission-area balance, handoffs, and readiness checks so the research system produces useful staged outputs without bypassing review.

## When To Use

Use this skill when the task is to:

- plan a new research batch
- assign work across Mission Areas / Use Cases
- decide whether the next output should be source leads or candidate records
- check readiness before research begins
- coordinate handoffs between source discovery, profile building, evidence mapping, and database review

Do not use this skill to:

- discover individual sources directly
- write candidate data without a reviewed source-lead basis
- promote batches
- update Supabase records

## Inputs

- Target Mission Areas / Use Cases
- Target Technical Domains
- Desired batch size
- Whether the task is Global Source Book expansion or source-lead creation
- Current data readiness output
- Known source constraints
- Human review status for prior source leads

## Outputs

- Research batch scope
- Target count by Mission Area
- Agent task assignments
- Handoff checklist
- Readiness and validation commands to run
- Open questions that block safe execution

## Default Batch Policy

- Run `pnpm data:readiness` before assigning work.
- For the first broad pass, cover all active Mission Areas.
- Expand the Global Source Book without a fixed count when the goal is to build the reusable source base.
- Choose an explicit reviewable target count only when assigning source-lead creation.
- Prefer source leads before candidate records.
- Convert to candidate records only after human review approves source leads.
- Keep social and YouTube discoveries as lead-generation inputs unless durable canonical sources support promotion.

## Workflow

1. Inspect current readiness, taxonomy, and existing research batches.
2. Define scope by existing `use_case_id` and `domain_id`.
3. Assign source discovery targets by Mission Area.
4. Require source-lead output that validates against `research/ingestion/schema/source-leads.schema.json`.
5. Route approved leads to Company Profile Builder.
6. Route candidate profile drafts to Evidence And Mapping Analyst.
7. Route final candidate batches to Database And Review Steward.

## Allowed Tools

- File and schema reads
- `pnpm data:readiness`
- `pnpm leads:validate`
- `pnpm ingest:validate`
- Supabase MCP read-only inspection for taxonomy, schema, duplicate risk, and coverage checks

## Restricted Actions

- Do not run `pnpm ingest:promote`.
- Do not apply migrations.
- Do not execute Supabase writes.
- Do not change schemas during v1 agent-spec work.

## Quality Checklist

- Scope references existing Mission Areas, Use Cases, and Domains.
- Batch target and source posture are explicit.
- Handoffs are review-first and decision-complete.
- Validation commands are named before execution.
- Any blocker is surfaced instead of guessed around.

## Change Log

- `2026-04-30`: Initial focused skill created.
