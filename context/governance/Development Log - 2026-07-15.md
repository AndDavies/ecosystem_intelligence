# Development Log - 2026-07-15

## Canadian Defence Briefs publication slice - 2026-07-21

- Published a new public knowledge surface at `/briefs`, branded **Canadian Defence Briefs** rather than “wiki.” It provides concise, answer-first, source-backed pages that lead from a real question to public evidence and linked True North Map records.
- Added the first three reviewed briefs: Canada’s Arctic defence operations, Canada’s future submarine industrial opportunity, and Canadian defence demand signals.
- Added administrator-only authoring at `/admin/briefs`. Editors can create, revise, archive, or publish a brief, select approved public sources, add links to organizations, technologies, and demand signals, and record a review rationale.
- Added dedicated `wiki_pages`, `wiki_page_sources`, and `wiki_page_record_links` tables. Public access is restricted to published rows; source packets, private markdown, raw newsletter material, and compiler notes never enter the public runtime.
- Added Article and BreadcrumbList JSON-LD, unique metadata, canonical URLs, sitemap entries, visible authorship/review dates, source links, and labelled `Derived Read` sections. Question-led sections improve clarity for human search and answer systems, but remain people-first and evidence-bounded rather than keyword or FAQ-schema driven.
- Applied and verified production migrations `20260721114356_add_canadian_defence_briefs` and `20260721115301_fix_defence_brief_public_rls`. The latter corrected anonymous read access by separating public RLS policies from private staff-helper calls.
- Production commit: `ae1eeca` (`feat: publish Canadian defence briefs`). Final verification: 106 tests passed; lint, build, release validation, public RLS, sitemap entries, and live `/briefs` routes all passed.

## Public atlas foundation

The repository was stabilized around four high-level areas:

- `app/` for runnable product source
- `research/` for evidence and reviewed ingestion work
- `context/` for governance and agent operating guidance
- `content/` for outward-facing collateral

## Product shift

The product front door changed from an internal command-centre workspace to a free Canadian defence and dual-use public atlas. The selected visual direction is Option 3, refined into a map-first atlas with a synchronized, viewport-bounded evidence table and progressive disclosure.

## Implemented

- Added a clean public-atlas TypeScript model and repository boundary.
- Added a six-organization validated fallback dataset and excluded all scaffold records from the public path.
- Added a clean Supabase migration covering organizations, capabilities, locations, demand, programs, evidence, ingestion governance, media, and private collections.
- Added explicit Data API grants, RLS on every exposed table, controlled `app_metadata` staff authorization, private/public storage buckets, foreign-key and query indexes, and automatic `updated_at` triggers.
- Added a PGlite migration test that applies the schema and seed, verifies counts, checks public evidence, confirms RLS, and proves anonymous editorial access is denied.
- Added the national atlas with synchronized natural-language filters, map, table, URL, count, and CSV export.
- Added public organization, capability, region, and NATO demand pages.
- Added organization, capability, regional, and collection PDF exports.
- Added magic-link authentication, owner-only collections, and staged profile claims/corrections.
- Added private source/PDF intake, candidate review, and coverage dashboards.
- Simplified the dossier schema so identity and one-to-one profile fields live
  in one `organizations` row, with an explicit `entity_kind` and a small
  `profile_data` object for type-specific details.
- Added an RLS-preserving `organization_dossiers` view that presents normalized
  locations, capabilities, programs, funding, relationships, media, alignments,
  and citations as one predictable read payload for pages and exports.
- Made the map the default discovery surface and kept a synchronized accessible
  evidence table directly below it on desktop and tablet. Mobile retains a
  focused map/list toggle. Both contain only organizations inside the visible
  map bounds, and bounded CSV exports use the same extent.
- Added a synchronized Lookbook Peek interaction: marker and table-row selection
  highlight the same organization and expose its reviewed capability, evidence
  count, confidence, freshness, dossier action, collection action, and first
  public evidence link.
- Delayed initial viewport publication until map framing is stable and debounced
  later movement, preventing the first visible-results table from using stale
  pre-fit bounds.
- Switched MapLibre and the Leaflet fallback to the quiet MapTiler
  `dataviz-light` map ID when a protected browser key is configured.
- Added an editorially labelled placeholder-logo state without storing fake
  media records.
- Added a canonical public-atlas candidate schema, validator, review-packet
  generator, and guarded SQL migration generator. This replaces the retired
  CSV-era promotion path for new atlas research batches.
- Converted and promoted the approved 12-organization Underwater ISR batch with
  one canonical organization, location, reviewed capability, public source,
  evidence snippet, mission alignment, and field-level citations per record.

## Trust decisions

- City-centroid coordinates are labelled `City-level` in public profiles while
  the stored geographic-confidence value remains unchanged.
- Existing mission mappings are labelled analyst assessments in public pages
  while retaining their reviewed derived status internally.
- The five NATO problem families are public with zero capability matches until new mappings pass review.
- Empty regions and demand pages use explicit coverage states.
- Confidential emails and local research PDFs remain private inputs unless publicly corroborated and approved.

## Hosted database status

The new free-plan Supabase project exists and is connected locally and in
Vercel. The foundation and security-hardening migrations were approved,
applied, and verified with all public tables protected by RLS and no
security-advisor findings. The six verified organizations, their reviewed
capabilities, public sources, field citations, and NATO demand requirements
were imported. The first two reviewed expansion batches raise the live total to
30 published organizations and 30 published capabilities. Production and Preview
use `ATLAS_DATA_SOURCE=supabase`.

## Former invitation preview - 2026-07-16 (historical)

- Reframed the 18-record release as a narrow workflow-validation preview before the independent public beta.
- Applied restrained marine visual cues: a deep navy public header, ocean teal and cyan accents, editorial rules, and light data surfaces without using third-party assets or implying endorsement.
- Removed the empty demand workflow from primary navigation while retaining a clearly labelled early-preview route and its public-source caveats.
- Added a delayed, dismissible, affirmative-consent update prompt and a persistent unauthenticated product-feedback workflow.
- Added `pilot_update_signups`, `pilot_feedback`, and `pilot_events` as private, RLS-enabled tables with no `anon` or `authenticated` Data API privileges. Validated server routes write with server-only credentials.
- Added bounded event capture for search, filter, marker, dossier, evidence, export, signup, and feedback actions without storing raw search text or raw IP addresses.
- Added a pilot privacy page, no-index metadata and robots posture, aggregate Vercel Web Analytics, and sampled Speed Insights with URL query strings removed before collection.

## Search learning and HRM geography - 2026-07-17

- Added deterministic Halifax Regional Municipality geography resolution so `Halifax`, `HRM`, and `Dartmouth` can resolve to the same metro area while continuing to filter published records only.
- Split genuine search failures from map-bounds empty states and added clear-search and missing-record actions.
- Replaced the initial no-query-text telemetry posture with a disclosed, private `pilot_searches` ledger after design-partner testing showed that zero-result counts alone could not explain search failures.
- Submitted search terms are isolated from generic events, marked for 90-day expiry, written only through server routes, and unavailable to `anon` and `authenticated` Data API roles.
- Added random per-tab session identifiers and search attribution for semantic page, filter, result, marker, dossier, evidence, export, signup, and feedback events. Keystrokes, arbitrary clicks, mouse movement, and session replay remain out of scope.
- Fixed the mobile map/list failure by rejecting collapsed map bounds while the hidden map has zero layout dimensions and preserving the last usable visible-result set.
- Added validation tests for affirmative consent, feedback normalization, bounded event vocabulary, and collapsed map bounds.

## Independent Canadian Public Beta - 2026-07-17

- Replaced invitation and partner-specific public language with an independent Canadian Public Beta created and stewarded by Andrew Davies.
- Replaced public magic-link sign-in with Google OAuth through the existing Supabase PKCE callback.
- Added private connection requests, a rate-limited contact inbox, and a unified public-beta administration surface for subscribers, feedback, contact, searches, contributions, workflow events, and introductions.
- Enabled indexing for canonical public pages, added a public-only sitemap, structured data, social metadata, and explicit blocking for private workflows.
- Separated the five-minute public atlas cache from cookie-bound authentication and retained 90-day searches and 30-day workflow events.
- Added About, Methodology, Contact, Terms, and revised Privacy pages with public-source and non-endorsement boundaries.
- Created the True North Map GA4 property and production stream, linked it to the verified Search Console property, disabled advertising personalization, kept Google Signals and user-provided data collection off, and limited event retention to two months.
- Added opt-in Google Analytics measurement for sanitized public routes only, with persistent preferences, withdrawal, private-route exclusions, and no raw URL search parameters.
- Set the release corpus floor at 30 verified organizations, with 36 as the operating target; promotion remains explicitly human-approved.

## Public terminology simplification - 2026-07-17

- Replaced public editorial-workflow language such as `reviewed derived fit`,
  `derived read`, and `review posture` with `analyst assessment`, `assessment
  confidence`, and `data quality`.
- Separated public evidence strength from assessment confidence without changing
  the underlying confidence fields, match logic, filters, schemas, or records.
- Standardized the web experience on `organization profile` and `capability
  profile`, reserving `lookbook` for generated multi-record reports.
- Replaced GIS and maintenance jargon with `location accuracy`, `city-level`,
  `last verified`, and `sources` across public pages and PDF exports.
- Kept the change presentation-only: no database migration, matching behavior,
  query behavior, publication status, or review workflow changed.

## Account and administrator hardening - 2026-07-17

- Added passwordless email sign-in alongside Google OAuth so personal and work email users can create the same type of private account without a password.
- Added explicit pending states and progress labels to Google, email-link, sign-out, and deletion actions.
- Made public navigation session-aware: signed-out users see `Sign in`, signed-in users see `Account`, and a reserved checking state prevents misleading flashes.
- Added `/account` with verified identity methods, Working Lists, connection-request status, contribution status, sign-out, and transparent private-data deletion.
- Account deletion requires a recent sign-in and exact-email confirmation, revokes sessions first, removes owner-bound private records, can unsubscribe the email, and retains only published records and anonymized audit history.
- Protected the sole administrator account from self-service deletion and restricted every admin page, server action, API, and atlas editorial RLS policy to Andrew's immutable Supabase user ID, exact email, and controlled `app_metadata.role = admin`.
- Kept admin navigation internal to `/admin`; no public account or header link exposes it.
- Enabled the Supabase email provider. The free-tier default mailer prevents template customization without custom SMTP, so the beta uses secure email links; the code-entry variant remains deferred until a verified sender/SMTP is configured.

## Review-to-publication workflow and map clustering - 2026-07-17

- Added 12 source-backed national-expansion organization dossiers covering aerospace, space, communications, cyber, advanced manufacturing, test, training, and sustainment.
- Validated the batch, staged all 12 dossiers in the private review queue with clear duplicate checks, recorded substantive approval rationales, and published the batch atomically. The live public atlas now contains 30 organizations and 30 capabilities.
- Replaced raw candidate JSON as the primary review experience with structured organization, capability, location, domain, cluster, evidence, and source fields.
- Added per-field edits, duplicate merge resolution, editorial acceptance, and a separate publication checkpoint.
- Added a transaction-safe publication function that creates the canonical organization dossier, evidence, citations, domain links, cluster links, and reviewed mission alignments together or publishes nothing.
- Added four high-level technical domains required by the expansion batch: Aerospace & Mobility; Communications & Cyber; Test, Training & Sustainment; and Advanced Manufacturing & Integration.
- Increased primary map clustering and implemented matching numbered clusters in the Leaflet fallback. Selecting a numbered cluster zooms to its member organizations and progressively separates their markers.
- Removed database-vendor wording from user-visible application copy and replaced it with plain system, database, authentication, and access-control terminology.

## Published-record maintenance - 2026-07-18

- Reduced the final publication checkpoint to one explicit button that publishes
  every approved record shown on the page. The transaction-safe validation,
  reviewer authorization, audit event, and all-or-nothing boundary remain in
  place; selection controls and typed confirmation were removed.
- Added a private published-organization manager with search, public-profile
  preview, and direct edit routes.
- Added a unified published-dossier editor for organization identity, business
  profile, primary map location, capability detail, technical domains, cluster,
  evidence confidence, freshness, and editorial rationale.
- Published edits preserve organization and capability slugs, save atomically,
  record complete before/after audit data, and refresh the public atlas cache.
  Existing citations remain visible and source replacement still uses the
  review-first workflow.

## Field Atlas visual refresh and release control - 2026-07-18

- Replaced the former navy/ocean public presentation with an independent Field
  Atlas system: warm neutral canvas, white surfaces, spruce primary actions,
  coral selection, violet analyst-assessment states, and rounded shells, cards,
  drawers, controls, and chips.
- Consolidated the atlas search, filters, caveat, map, viewport count, compact
  organization preview, and synchronized table into one calmer map-led workspace.
- Changed map clusters to graphite, standard markers to spruce, and selected
  markers to coral while retaining cluster expansion and non-map equivalence.
- Reworked organization profiles into editorial intelligence briefs with a
  narrower sticky facts rail, clearer Connect/Save/Export/website hierarchy,
  capability sections, and source links attached directly to analyst assessments.
- Carried the public visual system through supporting pages, authentication,
  contributions, connections, contact, feedback, update signup, icon, and Open
  Graph output.
- Fixed ordinary natural-language discovery requests that supplied a null
  campaign cohort; `Halifax` now resolves correctly without campaign context and
  the validation regression is covered by a test.
- Updated the July 18 public-beta release plan to treat the product as a release
  candidate. The remaining work is production verification, privacy/RLS review,
  repository-path reconciliation, launch collateral, indexing registration,
  final deployment, and Monday release operations rather than new feature work.

## True North Map working brand and research-path restoration - 2026-07-18

- Restored the canonical `research/` directory so the tracked ingestion history,
  source book, schemas, audits, and validators again resolve through the paths
  used by the project contract.
- Adopted `True North Map` as the working public brand for the Ecosystem
  Intelligence system and `truenorthmap.ca` as its canonical public domain.
- Updated public navigation, metadata, Open Graph output, legal and methodology
  copy, signup messaging, downloadable reports, and current governance while
  preserving historical research references and stable internal storage keys.

## Public-beta release verification - 2026-07-18

- Connected and verified `truenorthmap.ca` as the canonical production domain;
  `www.truenorthmap.ca` and the former Vercel production URL redirect to it.
- Updated Supabase and Google authentication origins, callback URLs, provider
  settings, and safe return paths for the canonical domain. Google OAuth and
  passwordless email links both pass fresh-account production tests.
- Verified the 30-organization corpus, zero-scaffold condition, explicit Data API
  grants, RLS, owner-only private data, Andrew-only administration, retention,
  account deletion, and public evidence boundaries.
- Registered the domain with Google Search Console and Bing Webmaster Tools,
  submitted the canonical sitemap, and requested indexing for priority pages.
- Enabled Vercel Web Analytics without purchasing the separate paid Speed
  Insights add-on; the deployed analytics scripts return successfully.
- Changed mobile discovery to an accessible results-first view and deferred the
  MapLibre/MapTiler payload until the user opens the map. Desktop retains the
  synchronized map and results layout.
- Improved assessment-label contrast and preconnected the MapTiler origin.
  Lighthouse now reports mobile 96/100/100/100 and desktop 100/100/100/100 for
  performance, accessibility, best practices, and SEO.
- Completed the full release suite: 24 test files and 83 tests, lint, two
  source-lead batches, seed validation, candidate ingestion validation, and a
  41-route production build all pass.
- Finalized the public launch package under `content/launch/`, including channel
  copy, four screenshots, an Open Graph image, and a 21-second demonstration.
- Froze the launch corpus at 30. Monday work is limited to the scheduled final
  readiness check, smoke test, release decision, and Andrew-led promotion.

## Autonomous ecosystem research and ingestion pipeline - 2026-07-18

- Added a bounded gap-selection coordinator with typed run manifests, coverage
  reporting, source-lead and candidate validation, reviewer packet generation,
  and non-publishable staging exports.
- Added five Codex repository skills for coordination, source discovery,
  role-specific candidate construction, evidence mapping, and review stewardship.
- Added distinct organization contracts for companies, accelerators, incubators,
  research and test centres, investors and funders, ecosystem organizations,
  and government innovation offices.
- Added hierarchical demand issuers and source commitment metadata so NATO,
  federal, departmental, CAF, service, procurement, and innovation demand can be
  represented separately from organization supply.
- Expanded the Global Source Book contract with yield, geography, actor type,
  issuer, cadence, domain-owner, discovery, access, and recursive-trail fields.
- Completed two file-only shadow cycles. The first staged Mission Control,
  L-SPARK, COVE, and Build Ventures candidates; the second filled the research
  and test-centre gap with C-CORE. Both generated review packets and private
  staging exports with zero validation errors.
- Added a weekly local Codex schedule contract for Monday morning operation. It
  stops at human review and does not expand the frozen public-beta corpus.
- Connected successful research smoke runs directly to the existing Admin
  Review workflow through idempotent trusted intake. Removed any implied
  research-run review step; run rows are audit metadata only. Added typed
  organization review and human publication support for all five test candidates.
- Made generated reviewer rationale mandatory for every typed candidate and
  persisted it as a first-class Admin Review queue field. Updated the manual
  skills and weekly automation so a run is incomplete until every validated
  candidate and its rationale are visible in the existing review workflow.
- Added structured demand-signal review cards and atomic human publication for
  approved public-demand sources, issuers, requirements, sources, evidence, and
  citations through the same Review to Publish checkpoint used by organizations.
- Completed a third validated live research cycle using the Canadian Army and
  IDEaS True North Precision innovation challenge. It is pending in Admin Review
  beside the five organization candidates and was not auto-published.

## Research publication visibility and typed workflow - 2026-07-19

- Verified that the reviewer correctly published all six research candidates:
  five canonical organizations and one Canadian Army public-demand source.
- Found the post-publication break in the public presentation rather than the
  Supabase transaction: the static `/demand` index retained its pre-publication
  five-record render while the new demand detail page and all organization pages
  were already live.
- Made organization and demand indexes explicitly dynamic, generalized the
  demand presentation beyond NATO, and exposed demand source kind and commitment
  metadata in the public UI.
- Added organization-versus-demand counts to Admin Overview, Review, and Publish,
  plus a Recent publications confirmation section with direct links to every
  newly live record. A successful publish no longer requires a redeploy.

## Legacy workspace retirement - 2026-07-19

- Removed the obsolete authenticated workspace at `/app` together with the old
  company, domain, use-case, shortlist, help, review, taxonomy, and enrichment
  route families. The public True North Map atlas and current private admin
  workspace are now the only application surfaces.
- Kept canonical redirects for the five useful historical entry points while
  allowing unsupported nested legacy records to return a normal not-found state.
- Removed the old search endpoint and use-case export modes. Moved the active
  public-beta telemetry handlers to their canonical `/api/beta-*` routes.
- Made `/capabilities/[slug]` public-only. Unknown slugs now return 404 instead
  of opening the former authenticated capability workspace.
- Removed the legacy repository, mock data, scoring, freshness, use-case,
  shortlist, enrichment, review, help, and AppShell component stacks and their
  exclusive tests and UI primitives.
- Replaced the legacy seed-model readiness report with live public-atlas
  coverage. Research coverage now recognizes already-published candidates and
  reports the current 35-organization, 31-capability, six-demand-requirement
  corpus without double-counting reviewed artifacts.
- Matched the four local autonomous-research migration filenames to the versions
  already recorded by the production project, preventing accidental DDL replay.

## Decision-led profile and demand workflow - 2026-07-19

- Added organization-type discovery for companies, investors and funders,
  accelerators, incubators, research and test centres, ecosystem organizations,
  and government innovation offices. Natural-language interpretation, visible
  filter chips, structured filtering, URL state, map results, and exports now use
  the same canonical organization type.
- Reworked organization and technology profiles around the customer decision:
  clear breadcrumbs, “Company snapshot,” entity-appropriate technology or
  offering headings, “Where It Fits,” evidence and sources, Working List and
  introduction actions, and one compact research-gap state instead of empty
  mission and demand panels.
- Added official public contact paths to the canonical organization
  `profile_data` object rather than a second table. The Andrew-only editor can
  maintain an official contact page, public email, organization phone, and
  LinkedIn page through a narrow security-invoker RPC with explicit grants,
  rationale, before/after audit history, and immediate public-cache refresh.
- Replaced opaque editor labels with “Main technology area,” “Regional ecosystem
  group,” “Technology source support,” and “Review status.” The editor exposes
  the stored taxonomy summaries and click-to-open guidance without changing the
  canonical schema.
- Added a deterministic, private technology-to-demand comparison workspace.
  Stronger concept overlaps become `needs_review` candidates only. Existing
  pairs are excluded, no suggestion can auto-publish, and each public connection
  requires Andrew to inspect both records and select “Publish match” with a
  substantive rationale. Published matches remain labelled as derived, inherit
  the existing technology and demand citations, and are fully audited.
- Shifted public copy from system architecture to user consequence. “Ecosystem
  Map,” “technology or offering,” “Where It Fits,” and “source support” now carry
  across search, directories, profiles, public demand pages, trust content,
  metadata, social art, and downloadable PDFs. Internal route and database names
  remain unchanged.
- Updated the active corpus contract to the live 35 organizations and 31
  technologies or offerings. Future records remain evidence-backed and
  human-published but are no longer held to a fixed numeric freeze.

## Ask True North constrained discovery - 2026-07-20

- Recorded the public beta fallback point as the Git tag
  `beta-release-2026-07-20-pre-ask-true-north` before implementation.
- Upgraded the existing map question into Ask True North, a constrained
  OpenAI Responses API assessment over the canonical published snapshot.
- Kept the research and publication boundary unchanged. New records enter AI
  discovery only after the existing explicit human publication step and cache
  invalidation; there is no embedding index or second corpus to maintain.
- Added strict structured output, known organization, technology, and citation
  validation, fit-versus-evidence labels, exact, closest, and gap outcomes,
  public-source links, limitations, temporary follow-ups, safe fallbacks, and
  anonymous versus signed-in daily quotas.
- Reused the private 90-day search ledger for question, outcome, latency, and
  token measures. No model response is stored, no web tool is enabled, and no
  private drafts or research candidates enter the model context.
