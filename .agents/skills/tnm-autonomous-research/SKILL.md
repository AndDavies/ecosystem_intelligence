---
name: tnm-autonomous-research
description: Run a bounded, review-first True North Map ecosystem research cycle from coverage selection through durable public-source discovery, typed private candidates, validation, and direct private Admin Review intake. Use for manual or scheduled Canadian defence and strategic-tech research runs that must find companies, accelerators, incubators, investors or funders, programs, relationships, or public demand signals without publishing them.
---

# True North Map Autonomous Research

Run one reproducible coordinator cycle. Research is not organization-only: select the highest-priority gap across supply, ecosystem support, or public demand. Keep the public corpus frozen and stop after every completed cycle has placed at least one typed candidate with a generated reviewer rationale in Admin Review.

## Workflow

1. Work from the repository root and read `AGENTS.md`.
2. Run `pnpm data:readiness` and `pnpm research:coverage`.
3. Create a run with `pnpm research:prepare -- --trigger manual` or `--trigger weekly`. Add `--mode bootstrap` only for an explicitly requested balanced bootstrap.
4. Read the generated brief in `research/ingestion/briefs/`.
5. Apply `$tnm-source-discovery`, `$tnm-candidate-builder`, `$tnm-evidence-mapper`, and `$tnm-review-steward` in that order. Read each skill before doing its work.
6. Update the run JSON with queries, counters, output paths, validation results, completion time, and a clear stop reason.
7. Run the exact smoke command recorded in the run brief.
8. Confirm every completed-run candidate is visible in Admin Review with its generated reviewer rationale, then report organization candidates, demand-signal candidates, deferred leads, duplicates, warnings, and reviewer packet paths. Stop.

## Run limits

- Use at most 90 minutes, including at most 30 minutes of recursive Source Book expansion.
- Create no more than 25 qualified leads and 10 candidates.
- Treat ceilings as safety limits, not quotas.
- Stop cleanly on rate limits, access failures, unresolved duplicates, invalid taxonomy, or missing evidence.
- Resume from the existing run manifest; never create a second run for the same interruption.

## Publication boundary

- Write research artifacts under `research/`, then use only the trusted review-intake function invoked by `research:smoke` to create private candidates.
- A run that only leaves files under `research/` is incomplete. The terminal handoff is a verified pending Admin Review row; `research_runs` remains audit metadata only.
- Never approve candidates, publish canonical records, apply migrations, or write core ecosystem tables.
- Keep source-backed facts, derived alignment, and suggested next steps structurally separate.
- Preserve unknown values as null.

Read [references/run-contract.md](references/run-contract.md) before creating artifacts.
