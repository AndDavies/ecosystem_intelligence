---
name: tnm-review-steward
description: Validate, deduplicate, and send True North Map autonomous research candidates directly into the existing private Admin Review workflow. Use for smoke tests, schema and taxonomy checks, duplicate audits, reviewer packets, and trusted candidate intake; never approve, publish, or apply migrations.
---

# True North Map Review Steward

This project-local skill is the review-steward skill of record. Use it only within the current repository workflow and executable schemas.

Protect the review and publication boundary with deterministic checks.

## Workflow

1. Run `pnpm research:validate -- <run-path> <prospect-path> <lead-path> <candidate-path>` for discovery batches. Deep dossiers may omit the prospect argument only when the run manifest does not require it.
2. Resolve every schema, taxonomy, evidence, date, URL, and duplicate error. Do not waive errors. Confirm each qualified lead proceeded automatically or has an explicit candidate-level deferral reason; a missing human source-lead approval is never an error.
3. Confirm the run counters and output paths match the artifacts.
4. Run:

```bash
pnpm research:smoke -- --run <run-path> --prospects <prospect-path> --leads <lead-path> --candidates <candidate-path>
```

If the local service-role credential is unavailable, rerun the same command with `--file-only`, then use the Supabase connector only to call `public.stage_research_candidates_for_review` with that validated staging export. Do not substitute direct table writes.

5. Confirm the command reports the target candidate count in Admin Review. A discovery batch targets 10 and requires at least eight unless its manifest proves exhaustion; a deep dossier requires its 1-5 named candidates. Verify review tier, warnings, scores, candidate kind, and generated rationale on every row. Confirm candidates are enriched to the depth supported by official sources rather than merely schema-minimal.
6. Run the current project release contract:

```bash
pnpm release:validate
```

The release contract validates typed v2 artifacts and live production coverage. A local seed, CSV-era candidate batch, or remembered taxonomy is never an acceptable fallback.

7. Report readiness, warnings, deferred items, and exact output paths. Stop before review decisions or publication.

## Hard stops

- unresolved `possible_match` or exact duplicate
- unknown taxonomy or free-form controlled category
- missing role-specific organization evidence
- organization candidate with no resolvable Canadian operating location or otherwise unusable map location
- missing field evidence or missing source
- missing, generic, unsupported, or under-length generated reviewer rationale
- materially thin candidate output when available official sources support useful identity, capability, program, relationship, location, contact, or current-activity detail
- non-canonical or non-HTTPS URL
- browser citation token or copied report marker
- candidate or lead ceiling exceeded
- discovery batch below target without specific exhaustion evidence
- candidate approval, publication, or canonical-table mutation requested

## Reviewer warnings, not hard stops

- public legal name or alias not found
- no direct public email or phone number
- city-centroid rather than street-level coordinates
- founding date, leadership, parent, or history not fully confirmed
- useful but incomplete programs, portfolio, or relationship coverage
- moderate source confidence when the identity, Canadian presence, concrete role, and durable evidence still support review

Read [references/review-contract.md](references/review-contract.md) before declaring success.
