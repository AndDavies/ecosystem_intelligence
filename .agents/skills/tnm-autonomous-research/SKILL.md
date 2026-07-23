---
name: tnm-autonomous-research
description: Run a bounded, review-first True North Map ecosystem research cycle from coverage selection through durable public-source discovery, typed private candidates, validation, and direct private Admin Review intake. Use for manual or scheduled Canadian defence and strategic-tech research runs that must find companies, accelerators, incubators, investors or funders, programs, relationships, or public demand signals without publishing them.
---

# True North Map Autonomous Research

This project-local skill is the coordinator skill of record. Use it with the five project-local downstream skills named below; do not substitute cached copies or older operator-guide workflows.

Run one reproducible coordinator cycle. Research is not organization-only: select the highest-priority saturation gap across supply, ecosystem support, or public demand. Read coverage and taxonomy only from the production database. Broad discovery aims to place 8-10 enriched candidates in Admin Review; named-organization deep dossiers use a separate 1-5 candidate mode.

## Workflow

1. Work from the repository root and read `AGENTS.md`.
2. Run `pnpm data:readiness` and `pnpm research:coverage`.
   Both commands must reach the production database. Missing credentials or failed reads are hard stops; never substitute bundled records or remembered taxonomy.
3. Create a run with `pnpm research:prepare -- --trigger manual --mode discovery-batch` or `--trigger weekly --mode discovery-batch`. For database enrichment use `pnpm research:prepare -- --trigger weekday --mode refresh-batch`; this is a 45-minute, 50-source-item, 10-candidate maximum run. Use `--mode deep-dossier --target-candidates <1-5>` for named organizations and `--mode bootstrap` only for an explicitly requested balanced bootstrap. Optionally scope organization research with `--organization-kinds company,accelerator`. Resume an existing manifest instead of duplicating it.
4. Read the generated brief in `research/ingestion/briefs/`.
5. In `refresh_batch`, apply `$tnm-signal-refresh` first. Then apply `$tnm-source-discovery`, `$tnm-candidate-builder`, `$tnm-evidence-mapper`, and `$tnm-review-steward` in that order. Read each skill before doing its work. Discovery-batch mode first creates a 40-75 prospect inventory across at least six lanes, then qualifies the strongest prospects. Every validated `qualified` lead proceeds automatically. Do not pause or request source-lead approval.
6. Update the run JSON with prospect, lane, recovery, green/amber, query, output, and validation counters. If a discovery batch is below target, record both `underTargetReason` and concrete `exhaustionEvidence`; a vague time-limit statement is insufficient.
7. Run the exact smoke command recorded in the run brief.
8. Before live staging, require the deployed `/api/system/research-contract` endpoint to advertise support for every candidate kind and schema version in the batch. If the endpoint is unavailable or incompatible, stop before database intake and retain only the validated file artifacts. Never stage a candidate kind ahead of its deployed Review and Publish interfaces.
9. Confirm every completed-run candidate is visible in Admin Review with its generated reviewer rationale, then report organization candidates, demand-signal candidates, deferred leads, duplicates, warnings, and reviewer packet paths. Stop.

## Run limits

- Use at most 90 minutes, including at most 30 minutes of recursive Source Book expansion.
- Discovery batch: enumerate at least 40 unique prospects across at least six productive lanes; target 10 candidates and require at least eight unless documented exhaustion is proven.
- Deep dossier: research 1-5 named organizations across at least three source lanes; prioritize breadth of the organization profile over prospect volume.
- Create no more than 25 qualified leads and 10 candidates. Ceilings are safety limits; minimums and targets are throughput controls.
- Stop cleanly on rate limits, access failures, exact or unresolved duplicates, invalid taxonomy, unresolvable Canadian identity, no concrete offering or mandate, no durable evidence, or defunct status.
- Resume from the existing run manifest; never create a second run for the same interruption.

## Enrichment standard

- Follow qualified leads beyond the first source until available official evidence covers identity, role, concrete capabilities or programs, public relationships, location, and current activity.
- Add legal name, aliases, categories, public contact paths, programs, relationships, capability details, and relevant official announcements when supported and useful.
- Prefer several complementary canonical sources over one thin landing page. Do not add fields merely to make a record look complete.
- Preserve unresolved non-blocking questions in `reviewWarnings` and `reviewerRationale`; route useful evidence-anchored records to amber review instead of deferring them. Missing legal name, direct contact, exact street address, or a fully mapped relationship set is not by itself a hard stop.
- Keep standalone programs and relationships inside an organization bundle when the operator can be identified. Do not create a standalone program-relationship candidate unless the active Admin Review and publication workflow supports that type end to end.

## Publication boundary

- Write research artifacts under `research/`, then use only the trusted review-intake function invoked by `research:smoke` to create private candidates.
- A run that only leaves files under `research/` is incomplete. The terminal handoff is a verified pending Admin Review row; `research_runs` remains audit metadata only.
- The exception is a deliberate compatibility stop: when the deployed application cannot review and publish the candidate schema end to end, file-only artifacts are the correct safe terminal state until that application support is deployed.
- Lead qualification is not human review or publication approval. Human review begins on the enriched candidate in Admin Review.
- Never approve candidates, publish canonical records, apply migrations, or write core ecosystem tables.
- Keep source-backed facts, derived alignment, and suggested next steps structurally separate.
- Preserve unknown values as null.

Read [references/run-contract.md](references/run-contract.md) before creating artifacts.
