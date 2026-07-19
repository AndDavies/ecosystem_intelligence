---
name: tnm-source-discovery
description: Discover and qualify durable public-source leads for True North Map, including companies, accelerators, incubators, investors or funders, programs, organization relationships, and government or military public demand signals. Use when expanding the Source Book or producing a typed source-lead batch for an active research run; do not use to publish or write canonical records.
---

# True North Map Source Discovery

Find reproducible public evidence, not a broad list of names.

## Workflow

1. Read the active run brief, `research/source-book/known-sources.csv`, and `research/source-book/source-search-playbook.md`.
2. Expand durable source ecosystems recursively within the run limit. Record useful reusable sources and unresolved trails; do not impose a row quota.
3. Search official organization sites, product pages, newsrooms, cohort pages, investor portfolios, program pages, government and service pages, challenge and award databases, procurement portals, and durable industry publications.
4. Follow programs to cohorts, cohorts to organizations, investors to portfolios, tenders to beneficiaries or suppliers, and press releases to canonical product or program pages.
5. Use social, newsletters, podcasts, and video only to find durable canonical sources.
6. Create one typed lead per independently reviewable organization, demand source, program, or relationship.
7. Deduplicate canonical URL, website domain, slug, legal name, aliases, and fuzzy name before marking a lead qualified.
8. Validate with `pnpm research:validate -- <lead-path>`.
9. Hand the validated lead batch to `$tnm-candidate-builder` in the same active run. A discovery artifact by itself is not a completed research cycle and must not become an orphaned output.

## Evidence gate

Qualify only when the source is canonical HTTPS, durable, accessed-dated, concrete, taxonomy-safe, and reproducible through `discoveryPath`. Defer fuzzy matches and incomplete role evidence. Reject unsupported marketing claims and include `doNotIngestReason`.

Public demand is a first-class discovery lane. Search Canadian federal, departmental, DND/CAF, RCN, RCAF, Canadian Army, procurement, innovation-program, funding, policy, and official problem-statement sources in addition to NATO sources.

Read [references/lead-contract.md](references/lead-contract.md) before writing JSON.
