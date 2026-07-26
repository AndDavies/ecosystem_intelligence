# Skills And Automation Map

Status: current architecture and integration map

Last reviewed: 2026-07-26

## Research and ingestion skill chain

| Skill | Job | Primary input | Reviewable output | Authority boundary |
| --- | --- | --- | --- | --- |
| `tnm-autonomous-research` | Chooses live coverage gaps, prepares bounded runs, enforces limits, and coordinates handoffs | Production coverage, taxonomy, run mode | Completed run manifest and verified Admin Review intake | Coordinates only; never publishes |
| `tnm-signal-refresh` | Monitors official and discovery sources for changes to known records and public demand | Live watchlist and bounded source portfolio | Atomic signal batch plus new-record or refresh leads | Discovery feeds cannot support public fields without durable corroboration |
| `tnm-source-discovery` | Builds broad prospect inventories and durable source leads | Source Book, official sources, government/program sources, broad discovery | Typed qualified, deferred, or rejected source leads | Qualification authorizes drafting only |
| `tnm-candidate-builder` | Converts every qualified lead into the supported organization, demand, or refresh bundle | Qualified lead and live duplicate/taxonomy checks | Green or amber typed private candidate | Unknown fields stay null; unsupported candidate kinds stop |
| `tnm-evidence-mapper` | Adds field evidence, citations, source confidence, and conservative derived relevance | Typed candidate and durable sources | Traceable claims and labelled assessments | Source-backed facts remain separate from Derived Reads |
| `tnm-candidate-logo` | Locates an official-site logo and records private provenance for an organization candidate | Organization candidate and official website | `ready`, `review_required`, or `not_found` logo packet | No public media upload or publication during research |
| `tnm-review-steward` | Validates schema, taxonomy, duplicates, evidence, deployed compatibility, and private intake | Complete candidate batch and run artifacts | Pending `candidate_changes` row visible in Admin Review | Stops before accept or Publish |

The executable contract in `app/src/lib/research/pipeline-schema.ts` wins when prose and code differ. A clean checkout must contain the skill, its references, commands, tests, and compatible deployed application contract before that stage can be claimed operational.

## Operating modes

| Mode | Scope | Throughput control | Terminal state |
| --- | --- | --- | --- |
| `discovery_batch` | Broad ecosystem expansion across at least six source lanes | 40-75 prospects; target 8-10 candidates | Private Admin Review |
| `deep_dossier` | One to five named organizations | At least three complementary source lanes per dossier | Private Admin Review |
| `refresh_batch` | Changes to known organizations, technologies, relationships, and demand | 45 minutes; 50 inspected items; four source families; at most 10 candidates | Private Admin Review |

## Publication boundary

```text
Research files and private staging
  -> Admin Review
  -> human edit and acceptance
  -> separate Publish action
  -> canonical Supabase mutation
  -> audit and route revalidation
```

`research_runs` is audit metadata. Candidate files, smoke tests, staging rows, accepted candidates, and logo packets are not public records.

## Visibility and SEO intelligence skill

`tnm-visibility` is a separate private measurement workflow. It covers:

- Google Search Console and GA4 owned-property evidence;
- PageSpeed and public-route technical checks;
- Bing and Ahrefs imports;
- explicitly capped DataForSEO validation;
- SEO, GEO, and AEO opportunity analysis;
- answer quality, internal-link, and earned-link recommendations;
- an allowlisted aggregate owner-only dashboard projection.

Its local artifacts live under ignored `research/visibility/local/`. The skill does not publish content, change providers, submit indexing requests, send outreach, purchase links, or write to the public corpus. A recommended content or technical change enters the ordinary product or editorial workflow and must pass the cross-system regression contract.

Visibility is an operator-only local system. Its installed skill, credentials, provider exports, query evidence, and generated reports are ignored and never form part of a public application deployment. When visibility work changes, validate it locally and promote only an approved application, content, or editorial change through the ordinary regression workflow.

## Scheduled and manual operations

| Operation | Normal cadence | Writes | Human gate |
| --- | --- | --- | --- |
| Broad discovery | Weekly or manual | Typed research lineage and private candidates | Review and Publish |
| Signal refresh | Weekday or manual | Atomic signals and private refresh candidates | Review and Publish |
| Visibility baseline or weekly report | Manual or scheduled private run | Ignored local snapshots/reports and optional sanitized owner-only summary | Product/editorial prioritization |
| Privacy retention | Daily production job | Deletes expired detailed telemetry under the published retention policy | Versioned migration and release review |
| Public launch crawl | Before release or metadata changes | Validation output only | Release owner decides go/no-go |

## Required checks

- Research changes: `pnpm data:readiness`, `pnpm research:validate`, deployed research-contract compatibility, and review-card inspection.
- Visibility changes: `pnpm visibility:validate`, then tests, lint, and build for related application work.
- Production releases: `pnpm release:validate`, relevant browser matrix, `/api/health`, affected public routes, deployment logs, and live database state. Research and visibility checks remain separate and are required only when those local operator systems or their tracked interoperability contracts change.
