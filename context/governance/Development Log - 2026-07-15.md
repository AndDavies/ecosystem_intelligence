# Development Log - 2026-07-15

## Defence Briefs editorial experience and draft batch - 2026-07-22

- Replaced the question-and-answer content model with a publication-ready article contract: headline, standfirst, thesis, bottom line, executive takeaways, narrative sections, implications, recommended action, limitations, public sources, and linked atlas records.
- Refactored the `/briefs` feature layout so the editorial image can no longer cover its title or action. Individual briefs now open with a compact split hero that keeps the headline and image prominent while making the beginning of the analysis visible without an oversized image-first scroll.
- Rebuilt `/admin/briefs` as a blog-style article editor, including format, topic, audience, hero image and accessible description, paragraph-based narrative sections, supporting points, sources, related records, review status, and SEO fields.
- Added an administrator-managed Defence Brief image library in Supabase Storage. The editor can choose an existing approved image or upload a JPEG, PNG, or WebP file up to 10 MB; successful uploads become the article's main image and populate public page and social metadata. Anonymous visitors can load known public image URLs, while only the exact site administrator can list or modify the bucket.
- Preserved the existing `wiki_pages`, source links, record links, RLS, audit, and human publication controls; no parallel content store or autonomous publication path was introduced.

- Rebuilt `/briefs` as an editorial publication surface rather than a grid of database records. The route now leads with a featured answer, distinguishes explainers, guides, and analysis, exposes topic and reading-time context, and explains how readers can move from a public signal into related needs, technology, and organizations.
- Rebuilt each public brief around a consistent reading sequence: compact editorial hero, direct bottom line, executive takeaways, narrative article sections, clearly separated interpretation, visible sources, related records, review details, and author context.
- Added a reusable topic-aware image treatment that provides a deliberate placeholder until article-specific artwork is approved. Adding or replacing a future image does not alter the source, citation, research, or publication contracts.
- Added six Andrew-supplied editorial images to the canonical Supabase Storage library and mapped them to the collection homepage, Arctic operations, future submarines, public demand, sovereign capability, innovation pathways, and naval-industry briefs. Brief images now also populate article and social-preview metadata; the graphic fallback remains available for future briefs without approved artwork.
- Preserved the existing reviewed Supabase publication model. No raw Defence Wiki packets, newsletter bodies, or private compiler notes enter the public runtime, and no public brief is generated or published automatically.
- Prepared and staged five private drafts from approved public sources: sovereign defence capability, moving technology from prototype to operations, resilient Arctic communications, modular containerized naval systems, and the River-class Destroyer production milestone. The batch deliberately contains four evergreen explainers or guides and one clearly labelled timely analysis. Each draft remains private until Andrew reviews and publishes it through `/admin/briefs`.
- Preserved the unrelated uncommitted July 22 research-pipeline artifacts without staging, editing, publishing, or discarding them.

## Broader public sharing readiness - 2026-07-21

- Replaced the obsolete July 20 launch package with a current broader-sharing package at `content/launch/public-beta-launch-package.md`.
- Reconciled the launch story with the production work completed after the original package: corpus expansion, Ask True North, Google and work-email authentication, account management, expanded contribution and connection workflows, subscriber administration and MailerLite synchronization, Canadian Defence Briefs, and the larger private administration surface.
- Switched outward-facing proof points to rounded values, with an explicit requirement to read exact production totals before interviews, presentations, or exact-count claims.
- Added channel-specific UTM values, current LinkedIn, direct outreach, included-organization, Build Canada, BetaKit, defence-media, Show HN, and Reddit copy, plus a sequenced release-day checklist and first-week scorecard.
- Confirmed that new features and arbitrary corpus expansion are not release gates. The remaining work is operational: queue triage, subscriber-sync confirmation, unfinished-run disposition, fresh production walkthrough, asset review, release execution, and first-week monitoring.
- Preserved the unrelated uncommitted manual research-run artifacts; launch documentation work does not stage, publish, or discard research output.

## Founder story and release-queue clarification - 2026-07-21

- Reframed `/about` around Andrew Davies's background as a veteran and Combat Systems Engineering Officer, his decision to contribute to Canadian defence and sovereign capability, the talent and momentum he encountered across the ecosystem, and the missing shared picture that led to True North Map.
- Established the guiding North Star: map what Canada can build, connect the people ready to build it, and help the ecosystem move together.
- Preserved the independent public-source trust boundary and positioned transparency, reviewed contributions, and connection as part of the ethos rather than implementation detail.
- Confirmed that the three pending profile contributions and one new connection request are July 19 release-acceptance test fixtures under `/admin/insights`, not real external demand. They should be rejected or closed, not accepted or introduced.
- Confirmed the latest manual ecosystem-organization research run completed and its ten candidates were already dispositioned; production has no pending or approved candidate changes awaiting publication.
- Classified the July 18 screenshots, demo frames, Open Graph image, and short video as legacy previous-interface assets excluded from the broader release.

## Canadian Defence Briefs publication slice - 2026-07-21

- Published a new public knowledge surface at `/briefs`, branded **Canadian Defence Briefs** rather than “wiki.” It provides concise, source-backed analysis that leads from a clear thesis to public evidence and linked True North Map records.
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

## Ask True North operational hardening - 2026-07-21

- Added a deterministic, query-specific preselection pass over the live
  published snapshot before OpenAI ranking. It sends at most 16 current
  organizations while preserving relevant prior-turn records, public demand,
  evidence, and the existing server-side known-ID validation boundary.
- Kept the publication contract unchanged: there is no embedding store, copied
  corpus, or additional ingestion step, so newly published records remain
  immediately eligible for assistant discovery.
- Added sanitized operational failure classes for missing credentials,
  unavailable dependencies, authentication, API quota, rate limiting, model
  access, network, timeout, refusal, invalid output, and unknown failures. Public
  users continue to receive the existing safe deterministic fallback.
- Added candidate-count and failure-class measures to the private search ledger
  and Admin Insights, together with safe server logging that never records API
  keys or raw provider error messages.
- A live containerized naval-solutions validation retained five useful matches
  while reducing OpenAI input from 58,737 to 22,149 tokens and model latency from
  11.8 to 9.1 seconds.

## Frontend architecture hardening - 2026-07-22

- Published the first resilience and accessibility pass at commit `18550cf`:
  route-level loading and error recovery, a keyboard skip link, accessible
  feedback and update dialogs, pending action states, and semantic internal
  navigation. No public workflow or data contract changed.
- Implemented and approved the second frontend architecture pass. The public explorer now
  receives a compact, bounded projection of published records rather than full
  organization dossiers. The canonical Supabase-backed organization, research,
  review, export, and Ask True North contracts remain unchanged.
- The explorer loads at most 120 organizations initially, supports an explicit
  next-page contract up to 200 records per request, and fetches a full published
  organization only when a user expands a result. Newly published records still
  enter discovery automatically through the existing snapshot.
- Added server-rendered pagination to the organization directory, future-proofed
  the public-demand directory, and replaced the Admin Review queue's fixed
  50-row ceiling with counted 20-row pages.
- On the current 104-organization production corpus, the explorer API response
  fell from approximately 596 KB to 234 KB, a 60.7% reduction, while preserving
  the visible map, results, evidence links, full profiles, filters, and exports.
- Andrew approved Pass 2 for production after local map, expansion, profile,
  organization-directory, demand-directory, and full release validation.

## Frontend architecture hardening, Pass 3 - 2026-07-22

- Published the approved third architecture pass at commit `58e1030` and
  verified the production deployment and core public routes.
- Split the public explorer's result presentation, mobile cards, evidence
  ledger, map selection preview, and row helpers from the discovery
  orchestration component. The public routes, query state, analytics events,
  data projection, and full-profile loading contract are unchanged.
- Split published-organization editing and public-demand-signal editing into
  bounded server-action modules while retaining the same staff authorization,
  validation, database procedures, audit records, cache refreshes, and return
  paths.
- Added shared editorial badges, status chips, feedback banners, form fields,
  and section-card primitives. Replaced raw administrative colour literals with
  named semantic roles and removed the fragile CSS selectors that inferred
  colours from generated utility-class text. Resolved colours and visible
  hierarchy remain unchanged.
- Added architecture regression tests. The complete release gate passes with
  119 tests, lint, typed research validation, live production coverage, and the
  optimized production build. Desktop map/table expansion and mobile layout
  checks also pass locally.

## Frontend architecture hardening, Pass 4 - 2026-07-22

- Implemented the final measured data-access pass locally for approval. It is
  not yet committed or deployed.
- Replaced wildcard reads across the public atlas and Defence Brief repository
  with explicit public-column contracts. Private editorial screens retain their
  deliberate full-row reads where an editor needs the complete record.
- Replaced full national-snapshot loads on organization, technology, and demand
  detail pages with slug-targeted published-record loaders. The loaders reuse
  the canonical database assembler so presentation, evidence, and relationship
  semantics remain unchanged.
- Pre-rendered the current published organization, technology, demand, and brief
  detail routes with five-minute revalidation. Search-param-driven map and index
  routes remain request-rendered so filters, pagination, URL state, and newly
  published records continue to behave as before.
- Replaced full-snapshot link resolution in Defence Briefs and private Working
  Lists with small ID-targeted summaries. Publication actions now invalidate the
  brief cache explicitly alongside the existing public paths.
- Added public data-access regression tests covering explicit columns, targeted
  detail reads, cache boundaries, pre-rendered detail routes, and preserved live
  discovery indexes. Local browser checks confirm the map, organization,
  technology, demand, brief, and authentication boundary render without console
  errors.
- The complete release gate passes with 123 tests, lint, typed research
  validation, live production coverage, and a 243-page optimized build. The
  production-mode local server returns the pre-rendered profile and brief pages
  in roughly 1-15 ms in the bounded smoke sample; this is a local verification,
  not a claim about public-network latency.

## Defence Brief publication workflow - 2026-07-22

- Published the five reviewed, source-backed Defence Brief drafts prepared from
  the July 22 private knowledge-base compilation. The public collection now has
  eight briefs in total.
- Simplified the sole-administrator editorial workflow by removing the manual
  review-rationale field from Defence Brief saves and publication.
- Preserved the actual publication controls: administrator-only access,
  validated content, at least one approved public source for every published
  brief, reviewer identity and timestamps, stable source and record links, and
  an automatic audit event for every save or publication.

## Complete map coverage with paginated details - 2026-07-25

- Separated the map marker collection from paginated explorer cards. Every
  matching published organization is now represented by a compact ID, slug,
  name, type, location, and coordinate payload, while detailed evidence rows
  retain their bounded page size.
- Removed the hidden coupling that limited the national map to the first 120
  detailed results. Marker clustering, viewport counts, and map framing now use
  the complete matching corpus, including records beyond the first result page.
- Preserved marker selection for records outside the loaded detail page by
  fetching the published profile only after selection. No duplicate corpus,
  database migration, or publication-path change was introduced.
- Added regression coverage proving that 1,250 matching organizations all
  reach the map while detailed explorer records remain capped at 200 per
  request.

## Public language, evidence, and How It Works - 2026-07-25

- Added a single public-language contract separating source-backed facts, True
  North Map assessments, and visible coverage gaps without renaming canonical
  database or research-pipeline values.
- Source-gated the administrator Demand Signal editor with an HTTPS released
  source, exact source locator, concise supporting passage, administrator
  confirmation, rationale, reviewer identity, and public citations. The public
  loader and private suggestion engine both fail closed on unverified signals.
- Backfilled all 24 current published Demand Signals from their existing
  approved public evidence without hiding a signal or changing 30 published
  requirements and 85 published technology connections.
- Reframed public demand and technology pages around what needs to change, what
  success looks like, where technology may help, what supports the assessment,
  and what remains unknown.
- Added the crawlable `/how-it-works` route, structured data, responsive
  five-step workflow, trust boundary, navigation, sitemap entry, and contextual
  links from the map, demand, About, and Methodology routes.

## Phase 1B brand system and public experience - 2026-07-26

- Introduced the North Signal identity as responsive SVG marks, a simplified
  favicon, branded social cards, and accessible header and footer lockups.
- Standardized the public palette around North Ink, Field, Paper, Signal
  Yellow, Evidence Green, Quiet Grey, Warning Gold, and Alert Red while keeping
  temporary aliases for legacy semantic variables.
- Rebuilt the homepage hierarchy around the approved headline, maritime visual,
  two clear actions, Ask True North, suggested searches, four decision steps,
  the public trust boundary, live coverage metrics, and the existing complete
  map and results experience.
- Standardized primary navigation around Map, Organizations, Public Needs,
  Defence Briefs, How It Works, and About. Regions remain available within
  discovery and the footer. `/demand` and every canonical record URL remain
  unchanged.
- Consolidated the first-encounter evidence legend and applied the same brand,
  spacing, and evidence hierarchy to public discovery, dossier, editorial,
  contact, contribution, authentication, account, loading, error, and empty
  states without changing data, analytics, authentication, research, review,
  publication, map, export, or Working List behaviour.

## Pre-launch security and reliability remediation - 2026-07-26

- Reproduced the production dependency audit in the clean release worktree and
  repaired the complete known production graph: Next.js 15.5.22, Sharp 0.35.3,
  patched transitive PostCSS, WebSocket, and Babel versions, and development-only
  placement for the `shadcn` CLI. Added `pnpm security:validate` to the release
  gate so high or critical dependency findings fail closed.
- Traced the transient capability-route 500 to an unbounded public citation
  read. Dossiers now select field citations through the exact loaded entity IDs
  in bounded indexed batches and then load only referenced approved evidence
  snippets and sources. Full national discovery remains available and the
  database, RLS, evidence, and publication schemas are unchanged.
- Production verification exposed a remaining timeout inside the citation RLS
  policy even for scoped IDs. Final citation hydration now uses the server-only
  database client only after public queries establish the allowed record IDs,
  applies explicit public-approved evidence and source filters, and executes
  bounded batches sequentially to avoid redundant policy pressure.
- Removed private demand-match reviewer rationale from the public
  `AtlasDemandMatch` contract, Supabase projection, deterministic search corpus,
  Ask True North catalogue, and public API serialization. The private admin and
  candidate workflow retains its rationale and human-review requirement.
- Added `Security And Reliability Remediation Log.md` as the durable register
  for resolved blockers, remaining defence-in-depth work, accepted risks,
  operational cleanup, recurring checks, and production verification.
- Replaced the automatic full-screen analytics preferences modal with a
  compact, non-blocking bottom notice. The first encounter now offers only
  `Accept analytics`, a quiet `No thanks` alternative, and the privacy link;
  granular preferences remain available from the footer and Privacy page.

## Directional N identity review candidate - 2026-07-29

- Reconstructed the July 29 master reference as deterministic SVG artwork
  rather than cropping raster marks from the presentation sheet.
- Prepared standalone dark, light and one-colour symbols; 16, 24 and 32 pixel
  marks; horizontal and stacked lockups; an inverse horizontal lockup; social
  avatar; app tile; favicon; and Apple touch icon.
- Updated the local header, footer, dialogs and generated social-card identity
  while preserving the approved palette, typography, messaging, navigation,
  analytics, authentication, data, research, review and publication workflows.
- Kept the candidate isolated from production pending Andrew's local visual
  review and full regression approval.
