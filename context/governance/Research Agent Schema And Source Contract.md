# Research Agent Schema and Source Contract

Date: 2026-07-23
Status: active public-atlas contract

## Purpose

This contract governs autonomous and manual research for True North Map, the Canadian Ecosystem Intelligence Public Atlas.

Research agents may discover sources, measure gaps, and draft review candidates. They must not write directly to canonical published tables or public storage.

The promotion path is:

```mermaid
flowchart LR
  A["Saturation gap"] --> I["Intelligence requirement and collection plan"]
  I --> P["Broad prospect inventory"]
  P --> B["Durable source lead"]
  B --> L["Atomic claim ledger and dossier coverage"]
  L --> C["Green or amber candidate change"]
  C --> D["Schema and evidence validation"]
  D --> E["Human review decision"]
  E --> F["Explicit promotion"]
  F --> G["Published record"]
```

## Source visibility

Every source must be labelled:

- `public`: canonical URL can support a public claim after review
- `permissioned`: the project can use it under a recorded permission basis, but public display depends on that permission
- `internal`: informs research or requirements only and cannot appear as a public citation

Rules:

- Colleague emails are internal unless the sender explicitly authorizes publication.
- Uploaded PDFs remain in the `atlas-private-intake` bucket until review.
- Public claims require a canonical HTTPS source or an approved first-party submission.
- Named contacts require official publication or explicit approved submission.
- Social posts and video transcripts are discovery inputs unless they resolve to a durable source.
- Long copied passages are not evidence snippets. Use concise paraphrases or compliant short excerpts.

## Source order

1. Official company product, documentation, newsroom, investor, or press-release page.
2. Government, NATO, defence program, policy, procurement, or official challenge page.
3. Reputable industry publication with a direct company or program reference.
4. Social media and video only as a path to durable sources.
5. Secondary summaries only when they lead to better evidence.

Use specialized Canadian OSINT lanes when relevant: corporate registries for identity and status; patent/IP sources for published technical claims and assignee trails; CanadaBuys and proactive disclosure for procurement lifecycle; official customer, prime, program, exercise, trial, or funding pages for independent corroboration; official sitemaps, documents, PDFs, datasheets, manuals, and bilingual search for technical depth. Lobbying records, patents, job postings, newsletters, and social posts retain their specific limitations and never prove contract award, product maturity, or customer interest by implication.

## Collection plan, claims, and coverage

Every new run prepared by the current coordinator uses:

- `research_collection_plan_v1` for the intelligence requirement, named subjects and aliases, priority questions, target fields, English/French search posture, source lanes, evidence thresholds, stop conditions, and prohibited actions;
- `research_claim_ledger_v1` for atomic subject-predicate-value claims, units and dates, original and canonical URLs, source independence, corroboration, contradictions, supersession, dispositions, and candidate targets;
- a twelve-dimension dossier coverage vector for identity/ownership, Canadian presence, offering/mandate, technical specifications, maturity/deployment, customers/contracts/programs, procurement/demand, partnerships/financing, public contacts, current activity, source diversity, and contradictions.

Syndicated copies of one release are one source family. Discovery-only material cannot become source-backed field evidence. Every source-backed candidate evidence item must match a ledger claim by candidate ID, field path, and source ID. Conflicting values remain visible as reviewer warnings until resolved or explicitly deferred.

Reject or defer:

- non-canonical or non-HTTPS URLs
- browser citation tokens or report-local markers
- unsupported marketing claims
- copied contact data
- inferred metrics, maturity, financing, or employee counts
- media without a recorded source and rights posture
- unresolved duplicate organizations or capabilities

## Canonical tables

Agents may propose changes for these records, but promotion remains human-controlled:

| Group | Tables |
| --- | --- |
| Identity | `organizations` (one canonical row per organization, including common profile fields and type-specific `profile_data`) |
| Geography | `locations`, `organization_locations` |
| Capability | `capabilities`, `technical_domains`, `capability_domains` |
| Mission landscape | `mission_areas`, `capability_mission_matches`, `ecosystem_clusters`, `capability_clusters` |
| Public demand | `demand_sources`, `demand_requirements`, `capability_demand_matches` |
| Participation | `programs`, `program_participations`, `funding_events`, `organization_relationships` |
| Media | `media_assets` |
| Evidence | `sources`, `evidence_snippets`, `field_citations` |

`organization_dossiers` is a read-only, security-invoker view that assembles
each organization and its reviewed child records into one dossier payload. It
is for screens, PDFs, exports, and unified editing; agents still propose changes
through `candidate_changes` and never write through the view.

## Required organization candidate fields

- stable candidate identifier
- canonical name and proposed slug
- description
- website when publicly available
- one or more organization categories
- primary location or an explicit unresolved-location note
- source confidence
- at least one canonical source
- field citation for the public description
- duplicate-check result
- research rationale

Unknown fields stay null. Do not insert `YTD`, `TBD`, `unknown`, `N/A`, or an invented range.

## Required capability candidate fields

- parent organization candidate or canonical ID
- name and proposed slug
- concise source-backed summary
- controlled capability type when supported
- core features backed by evidence
- defence applications backed by evidence or clearly labelled as a derived candidate
- technical tags and existing domain IDs
- maturity or TRL only when a source supports the value
- source confidence
- at least one capability citation
- duplicate-check result

Commercial organizations require at least one reviewed capability before publication.

## Mission and demand mappings

Mission and demand mappings are independent records, not fields embedded in prose.

Every mapping candidate needs:

- canonical capability ID
- existing mission-area or demand-requirement ID
- concise alignment summary
- rationale
- `match_type`: `public_source_alignment` or `derived`
- confidence
- field-level evidence
- review status

Demand mappings must include this public caveat:

> Public-source alignment only. This is not procurement eligibility, NATO endorsement, or a classified requirement.

An agent must never promote a policy theme into a mission area without enough organization and capability coverage to make the landscape useful.

## Evidence records

### Source

Required:

- title
- canonical URL for public sources
- publisher
- source type
- visibility
- accessed date
- public-approval state

### Evidence snippet

Required:

- source ID
- concise excerpt or paraphrase
- source locator when useful
- visibility
- public-approval state

### Field citation

Required:

- entity type
- entity ID
- exact field name
- evidence snippet ID

Company descriptions, capability summaries, mission/demand alignment summaries, program participation, financing, and public relationships need field citations before promotion.

## Candidate-change envelope

Database-backed candidates use `candidate_changes`:

- `research_run_id`
- `candidate_kind`
- `target_entity_type`
- `target_entity_id`
- `proposed_record`
- `before_record`
- `field_evidence`
- `duplicate_check`
- `confidence`
- `status`

New research candidates also carry `reviewTier`, `inclusionScore`, `completenessScore`, and `reviewWarnings`. Inclusion and completeness are separate: a strong core inclusion case with incomplete optional enrichment belongs in amber review, not silent exclusion.

File-backed research batches must preserve the same information and validate against the applicable schema under `research/ingestion/schema/`.

### Signal and refresh envelopes

Multi-source refresh runs first create `research_signal_batch_v1`. Each atomic signal records its deterministic fingerprint, source channel and family, discovery origin, canonical URLs, extracted entities and event details, evidence status, live entity matches, intended outcome, recovery attempts, disposition, and deferral rationale.

Existing-record matches use `organization_refresh_bundle_v1` or `demand_refresh_bundle_v1`. A refresh bundle requires:

- a high-confidence `targetMatch` with entity type, UUID, slug, match methods, and baseline `updated_at`
- a `beforeRecord` snapshot of every touched canonical row
- explicit `set_field`, `add_child`, or `update_child` operations
- before and after values where applicable
- evidence IDs and a reviewer explanation for every operation
- source-channel provenance, corroboration, reviewer rationale, and warnings

Additive child values must satisfy the same typed technology, program, relationship, or demand-statement contract used at publication. Every declared parent must equal the matched canonical target. Refreshes fail validation when they mix organization and demand operation families or reference unknown Technical Domain and Mission Area values.

The intended existing target is not treated as a duplicate collision. Accidental matches remain blocking. Refresh publication is additive in v1; automated delete operations are prohibited.

## Autonomous discovery and refresh loops

1. Run readiness and coverage checks.
2. Measure coverage by region x organization type x capability x demand requirement.
3. Choose the highest-value saturation gap and record the selection in `research_runs.selected_gap`.
4. Rank and expand the Global Source Book with durable public sources.
5. Enumerate 40-75 unique prospects across at least six lanes and preserve unused plausible prospects as queued backlog.
6. Create source leads before structured candidates. Qualified leads continue automatically without a separate human approval pause.
7. Recover evidence across at least three lanes before deferring a plausible thin lead.
8. Draft green and amber organizations, demand signals, capabilities, relationships, citations, scores, warnings, and rationales.
9. Validate schema, canonical URLs, duplicates, media rights, evidence completeness, taxonomy IDs, and discovery throughput.
10. Put candidates in the review queue. Stop. Do not publish.
11. After explicit human promotion, recalculate coverage and freshness.

The weekday refresh loop additionally reads published-record and public-demand watchlists, searches at least four source families, extracts atomic signals, resolves durable evidence, and matches signals before candidate building. It may complete with no candidates only when every inspected signal has a recorded disposition.

Rate limits, weak sources, extraction failures, unresolved duplicates, and missing coordinates produce review notes. They never produce partially published records.

### Implemented coordinator contract

The loops are implemented by `app/scripts/autonomous-research.ts` and the canonical local operator skills in ignored `.agents/skills/`, including `$tnm-signal-refresh`. The public repository tracks the executable data contract and review boundary, not the private skill instructions or credentials. A broad run produces `research_prospect_inventory_v1`, `source_lead_batch_v2`, and `research_candidate_batch_v2` artifacts. A refresh run also produces `research_signal_batch_v1`. Broad discovery targets 10 candidates and requires at least eight unless `underTargetReason` and `exhaustionEvidence` prove that 40 prospects and six lanes were genuinely exhausted. Deep dossiers preserve 1-5 candidate depth without the breadth floor. Every typed candidate requires a generated reviewer rationale. The `research_runs` row is audit metadata only.

The executable schema distinguishes organization, demand-signal, program-relationship, organization-refresh, and demand-refresh bundles. It also enforces conditional organization evidence so accelerators, incubators, investors, research centres, and ecosystem bodies are not forced into company-capability records.

The database migrations add organization aliases, hierarchical demand issuers, source-to-issuer roles, commitment metadata, durable reviewer rationales, richer run/candidate audit fields, idempotent trusted review intake, and typed human publication support for new and refresh organization and public-demand candidates. Refresh publication adds stale-baseline protection, stable-target updates, append-only evidence, and explicit operation auditing. Lead qualification is autonomous; human authority begins with candidate editing and review in Admin Review. Autonomous authority ends after private candidate intake, and acceptance, publication, and all canonical-table writes remain human controlled.

## Public contributions

Profile claims, corrections, and suggested organizations create rows in `submissions` owned by the authenticated submitter.

- The submitter can read only their own submission.
- Editors and reviewers can access submissions through controlled `app_metadata.role`.
- Submission payloads are private.
- A submission must become a reviewed candidate before canonical promotion.
- Direct self-service publication is prohibited.

## Media contract

Every asset candidate records:

- organization or capability owner
- asset type
- storage path or source URL
- source visibility
- permission basis
- attribution
- licence
- approval status
- publication status

Only approved media may enter `atlas-public-media`. Raw or uncertain media remains private.

## Validation

Before a reviewed batch is eligible for promotion, run:

```bash
pnpm data:readiness
pnpm release:validate
```

The public migration test additionally verifies:

- clean migration and seed execution
- six validated seed organizations and capabilities
- five NATO demand requirements
- zero unreviewed demand matches
- no scaffold names, example domains, or placeholder `YTD` values
- public canonical evidence for every published organization
- RLS on every exposed table
- anonymous denial from editorial candidate tables

## Promotion boundary

An accepted candidate is not a published record. Promotion must be a distinct reviewer-authorized operation that:

1. passes validation
2. records reviewer identity
3. writes canonical tables in one controlled transaction
4. records an audit event
5. preserves the before/after candidate and evidence
6. recalculates coverage and freshness

Agents do not own this step.
