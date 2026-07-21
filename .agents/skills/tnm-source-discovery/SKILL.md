---
name: tnm-source-discovery
description: Discover and qualify durable public-source leads for True North Map, including companies, accelerators, incubators, investors or funders, programs, organization relationships, and government or military public demand signals. Use when expanding the Source Book or producing a typed source-lead batch for an active research run; do not use to publish or write canonical records.
---

# True North Map Source Discovery

This project-local skill is the source-discovery skill of record. Use it only within the current repository workflow and executable schemas.

Build a broad prospect universe first, then find reproducible public evidence for inclusion.

## Workflow

1. Read the active run brief, `research/source-book/known-sources.csv`, and `research/source-book/source-search-playbook.md`.
2. Rank Source Book rows by Canadian relevance, expected organization yield, source credibility, freshness, target kind, and prior successful discovery. Backfill operational metadata on useful rows encountered during the run.
3. In discovery-batch mode, enumerate 40-75 unique prospects before deep qualification. Use at least six distinct lanes: official directories, government awards, government programs, procurement, accelerator cohorts or investor portfolios, industry associations or conference directories, company newsrooms, and broad web search. Record selected, queued, duplicate, and rejected prospects in `research/ingestion/prospect-inventories-v1/`.
4. Follow programs to cohorts, cohorts to organizations, investors to portfolios, tenders to beneficiaries or suppliers, and press releases to canonical product or program pages.
5. Use social, newsletters, podcasts, and video only to find durable canonical sources.
6. Score plausible prospects separately for inclusion and completeness. Inclusion asks whether the identity, Canadian presence, concrete role or offering, and durable evidence support review. Completeness asks how much useful profile detail is already available. Low completeness does not negate a strong inclusion case.
7. For each promising but thin prospect, run evidence recovery across at least three distinct lanes before deferral: canonical site or newsroom, government or program evidence, and a durable directory, portfolio, award, procurement, partner, or industry source. Record each attempt and outcome.
8. Create one typed lead per independently reviewable organization, demand source, program, or relationship. Preserve non-blocking gaps as reviewer warnings. Queue plausible prospects that fall outside the current candidate capacity so a later run can resume them.
9. Deduplicate canonical URL, website domain, slug, legal name, aliases, and fuzzy name before marking a lead qualified.
10. Validate the prospect inventory and lead artifact with `pnpm research:validate -- <prospect-path> <lead-path>`.
11. Hand every validated `qualified` lead to `$tnm-candidate-builder` automatically in the same active run. Do not pause or request human source-lead approval.

## Evidence gate

Qualify when the source is canonical HTTPS, durable, accessed-dated, concrete, taxonomy-safe, and reproducible through `discoveryPath`. Qualification authorizes drafting, not publication. Hard-stop exact or unresolved duplicates, unresolvable identity, no Canadian presence, no concrete offering or mandate, no durable evidence, defunct status, and invalid taxonomy. Do not defer only because legal name, direct contact, exact address, or full relationship coverage is missing.

Public demand is a first-class discovery lane. Search Canadian federal, departmental, DND/CAF, RCN, RCAF, Canadian Army, procurement, innovation-program, funding, policy, and official problem-statement sources in addition to NATO sources.

Read [references/lead-contract.md](references/lead-contract.md) before writing JSON.
