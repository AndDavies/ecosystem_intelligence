---
name: tnm-candidate-builder
description: Convert qualified True North Map source leads into typed, private, review-ready organization, demand-signal, organization-refresh, or demand-refresh candidate bundles. Use after durable lead qualification when building candidates for human review; enforce organization-kind-specific evidence and never approve, publish, or write live Supabase records.
---

# True North Map Candidate Builder

This project-local skill is the candidate-building skill of record. Use it only within the current repository workflow and executable schemas.

Build the record shape appropriate to the actor or demand source. Do not force non-company organizations into company-and-capability records.

## Workflow

1. Read the qualified lead batch and executable schema in `app/src/lib/research/pipeline-schema.ts`. Process every qualified lead automatically; no separate source-lead approval is required.
2. Recheck identity against published organizations and typed pending candidates in the production database.
3. Choose exactly one candidate bundle:
   - `organization_bundle_v2`
   - `demand_signal_bundle_v1`
   - `organization_refresh_bundle_v1`
   - `demand_refresh_bundle_v1`
4. Use only controlled organization kinds, categories, issuer types, mission slugs, and domain slugs. For a demand issuer with `parentIssuerSlug`, resolve that parent against the published `demand_issuers` taxonomy before staging. A candidate may introduce an issuing body, but it must not introduce an unreviewed parent hierarchy through a demand signal.
5. Leave unknown fields null. Keep `reviewStatus` as `candidate_pending` and batch `status` as `candidate`.
6. For organization candidates, resolve a Canadian primary city, province or territory, latitude, longitude, and geographic confidence. City-centroid or regional coordinates are acceptable when exact public coordinates are unavailable; null coordinates are not review-ready because the organization would disappear from the public map.
7. Score inclusion and completeness separately. Inclusion weighs resolved identity, Canadian presence, concrete capability or mandate, durable evidence, taxonomy fit, and duplicate clearance. Completeness measures useful enrichment already captured and must not become a disguised exclusion score.
8. Enrich the candidate with every material, supported detail found during discovery: legal identity and aliases, useful classification, role-specific profile data, concrete capabilities or programs, public relationships, official contact paths, current official activity, and complementary sources. Do not pad the record or infer unsupported facts.
9. Assign `reviewTier: green` when the core inclusion case is strong and material fields are well supported. Assign `reviewTier: amber` with `confidence: moderate` or `needs_review` when the core inclusion case is sound but optional details need reviewer verification. Include explicit `reviewWarnings` on every amber candidate.
10. Add sources, field evidence, duplicate results, scores, confidence, source-lead IDs, and a generated `reviewerRationale` explaining why the record may belong, what supports it, what remains incomplete, and what the reviewer should verify.
11. Route the bundle through `$tnm-evidence-mapper` before validation.
12. Keep programs and relationships inside the organization bundle when an operator organization is known. `program_relationship_bundle_v1` remains a reserved schema shape but is not currently accepted because it lacks an end-to-end deployed Review and Publish path.
13. Do not declare the candidate-builder work complete until the bundle has been handed to `$tnm-review-steward` for direct Admin Review intake.

For refresh candidates, keep the intentional canonical record in `targetMatch`, preserve a complete `beforeRecord`, and emit explicit additive `set_field`, `add_child`, or `update_child` operations. Consolidate all qualified signals for the same target into one candidate. Do not change stable IDs or slugs and do not emit deletes.

## Conditional organization rules

- Company: require at least one cited concrete capability.
- Accelerator or incubator: require a cited program, cohort, or challenge.
- Investor or funder: require a sourced mandate and public portfolio or funding relationship.
- Research or test centre: require a sourced technical mandate.
- Ecosystem organization or government innovation office: require a sourced mandate plus a program or relationship.

Missing public legal name, a direct email or phone number, exact street coordinates, founding date, complete leadership, or exhaustive relationship coverage does not block an otherwise useful amber candidate.

Read [references/candidate-contract.md](references/candidate-contract.md) before writing JSON.
