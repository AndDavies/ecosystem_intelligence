---
name: tnm-review-steward
description: Validate, deduplicate, and send True North Map autonomous research candidates directly into the existing private Admin Review workflow. Use for smoke tests, schema and taxonomy checks, duplicate audits, reviewer packets, and trusted candidate intake; never approve, publish, or apply migrations.
---

# True North Map Review Steward

Protect the review and publication boundary with deterministic checks.

## Workflow

1. Run `pnpm research:validate -- <run-path> <lead-path> <candidate-path>`.
2. Resolve every schema, taxonomy, evidence, date, URL, and duplicate error. Do not waive errors.
3. Confirm the run counters and output paths match the artifacts.
4. Run:

```bash
pnpm research:smoke -- --run <run-path> --leads <lead-path> --candidates <candidate-path>
```

If the local service-role credential is unavailable, rerun the same command with `--file-only`, then use the Supabase connector only to call `public.stage_research_candidates_for_review` with that validated staging export. Do not substitute direct table writes.

5. Confirm the command reports that at least one candidate is available in Admin Review. Verify each current-run queue row has the expected candidate kind and generated reviewer rationale. Inspect the generated reviewer packet and private staging export used by the trusted intake.
6. Run legacy validators to protect existing contracts:

```bash
pnpm leads:validate
pnpm ingest:validate
pnpm atlas:validate
pnpm seed:validate
```

7. Report readiness, warnings, deferred items, and exact output paths. Stop before review decisions or publication.

## Hard stops

- unresolved `possible_match` or exact duplicate
- unknown taxonomy or free-form controlled category
- missing role-specific organization evidence
- organization candidate with a null, partial, non-Canadian, or otherwise unusable primary map location
- missing field evidence or missing source
- missing, generic, unsupported, or under-length generated reviewer rationale
- non-canonical or non-HTTPS URL
- browser citation token or copied report marker
- candidate or lead ceiling exceeded
- approval, publication, or canonical-table mutation requested

Read [references/review-contract.md](references/review-contract.md) before declaring success.
