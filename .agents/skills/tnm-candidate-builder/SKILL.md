---
name: tnm-candidate-builder
description: Convert qualified True North Map source leads into typed, private, review-ready organization, demand-signal, or program-relationship candidate bundles. Use after durable lead qualification when building candidates for human review; enforce organization-kind-specific evidence and never approve, publish, or write live Supabase records.
---

# True North Map Candidate Builder

Build the record shape appropriate to the actor or demand source. Do not force non-company organizations into company-and-capability records.

## Workflow

1. Read the qualified lead batch and executable schema in `app/src/lib/research/pipeline-schema.ts`.
2. Recheck identity against published organizations and typed pending candidates in the production database.
3. Choose exactly one candidate bundle:
   - `organization_bundle_v2`
   - `demand_signal_bundle_v1`
   - `program_relationship_bundle_v1`
4. Use only controlled organization kinds, categories, issuer types, mission slugs, and domain slugs.
5. Leave unknown fields null. Keep `reviewStatus` as `candidate_pending` and batch `status` as `candidate`.
6. For organization candidates, resolve a Canadian primary city, province or territory, latitude, longitude, and geographic confidence. City-centroid or regional coordinates are acceptable when exact public coordinates are unavailable; null coordinates are not review-ready because the organization would disappear from the public map.
7. Add sources, field evidence, duplicate results, confidence, source-lead IDs, and a generated `reviewerRationale` explaining why the record may belong in True North Map, what evidence supports it, and what the reviewer must verify.
8. Route the bundle through `$tnm-evidence-mapper` before validation.
9. Do not declare the candidate-builder work complete until the bundle has been handed to `$tnm-review-steward` for direct Admin Review intake.

## Conditional organization rules

- Company: require at least one cited concrete capability.
- Accelerator or incubator: require a cited program, cohort, or challenge.
- Investor or funder: require a sourced mandate and public portfolio or funding relationship.
- Research or test centre: require a sourced technical mandate.
- Ecosystem organization or government innovation office: require a sourced mandate plus a program or relationship.

Read [references/candidate-contract.md](references/candidate-contract.md) before writing JSON.
