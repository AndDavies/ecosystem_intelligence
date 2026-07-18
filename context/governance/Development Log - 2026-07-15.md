# Development Log - 2026-07-15

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
