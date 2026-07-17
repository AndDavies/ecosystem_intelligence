# Canadian Ecosystem Intelligence Public Atlas

Status: active product requirements  
Last updated: 2026-07-17

## Product summary

Ecosystem Intelligence is a free, English-language public atlas for mapping Canada's defence and dual-use ecosystem. It helps ecosystem operators move from a region or mission problem to relevant organizations, review the public evidence behind each profile, understand current coverage gaps, and preserve useful records in a private Working List.

The primary journey is:

> Region -> ecosystem cluster -> capability -> organization dossier -> demand alignment -> Working List or export

The product combines public mapping, PitchBook-style dossiers, public NATO and Canadian demand overlays, and a review-first research pipeline. Agents can stage research but cannot publish it.

## Canadian Public Beta

The active release is an independent, English-only Canadian Public Beta created and stewarded by Andrew Davies.

- Public browsing, evidence, profiles, and exports remain free.
- Google OAuth and passwordless email sign-in are used only for private Working Lists, contributions, connection requests, and account management.
- Public feedback, consent-backed updates, and contact remain available without authentication.
- The publication floor is 30 verified organizations, the operating target is 36, and no jurisdiction is padded.
- The initial Vercel URL is indexable; private workflows remain blocked from search.
- The product is not an official government, military, procurement, or industry-association directory.
- Introduction requests are privately reviewed and manually brokered; no personal contact details or automatic introductions are exposed.

## Primary users

Primary users:

- accelerators, incubators, and cluster operators
- defence and dual-use program teams
- government innovation and industrial-base offices
- test centres and ecosystem conveners

Secondary users:

- commercial organizations and defence suppliers
- investors and funders
- researchers and industry associations

## Jobs to be done

1. Understand who operates in a Canadian region or capability landscape.
2. Find source-backed organizations and capabilities without learning a specialist query language.
3. Inspect why a capability may fit a mission or public demand statement and challenge that interpretation.
4. See where coverage is thin, stale, weak, or not yet reviewed.
5. Export a dossier, regional report, filtered dataset, or saved lookbook.
6. Claim, correct, or suggest a public profile without enabling direct self-publication.
7. Give editors a governed path from a URL, PDF, agent lead, or manual entry to a reviewed canonical record.

## Product principles

### Public by default, private where necessary

Anonymous users can browse, search, view profiles, and export published intelligence. Authentication is reserved for private collections, profile claims, corrections, and editorial operations.

### Evidence before volume

The atlas must not pad thin regions with synthetic organizations. Every public organization needs a canonical public source, and every commercial organization needs at least one reviewed capability.

### Facts and analysis remain separate

Verified information, analyst assessments, and public-demand relevance must be visibly distinct. A public-demand assessment is not procurement eligibility, endorsement, or classified demand.

### Unknown means unknown

Unsupported values remain null and are omitted in the UI. The product must never fabricate employee counts, contacts, financing, TRL, maturity, or placeholder values such as `YTD`.

### Map and table are equivalent

Every map result has an accessible list/table equivalent. The map is the
default atlas surface. On desktop and tablet, a bounded evidence table remains
visible directly below the map so spatial orientation and comparable records
can be used together. On mobile, the same information uses a map/list toggle.
The table contains only organizations inside the visible map bounds, including
organizations represented by a visible cluster. Filters, visible-result counts,
exports, selection state, and URL state remain synchronized.

Selecting a marker or table row opens one compact organization preview with a
verified capability, source count, evidence strength or assessment confidence,
last-verified status, and explicit actions to open the full profile, save it, or
inspect sources. Marker selection never
publishes, infers, or invents additional facts.

### Human publication boundary

Automated research can create leads and candidate changes. Only an explicit human-reviewed promotion can change canonical published records.

## Public information architecture

| Route | Purpose |
| --- | --- |
| `/` | National atlas with natural-language discovery, structured filters, synchronized map, and evidence table |
| `/regions/[slug]` | Regional counts, published organizations, reviewed clusters, and explicit gaps |
| `/organizations` | Published organization directory |
| `/organizations/[slug]` | Organization dossier with capabilities, mission reads, demand matches, and evidence |
| `/capabilities/[slug]` | Capability dossier with features, applications, maturity, alignment, and evidence |
| `/demand` | Public demand statement index |
| `/demand/[slug]` | Requirement detail, desired end state, matches, gaps, caveats, and authoritative source |
| `/account` | Authenticated identity, Working Lists, connection and contribution status, sign-out, and private-data controls |
| `/collections` | Authenticated private Working Lists |
| `/collections/[id]` | Saved organization and capability shortlist with lookbook export |
| `/submit` | Authenticated profile claim, correction, or organization suggestion |
| `/connect/[slug]` | Authenticated, private request for a human-vetted introduction |
| `/about` | Independent founder story, purpose, and trust boundary |
| `/methodology` | Evidence, confidence, freshness, assessment, and review method |
| `/contact` | Rate-limited private contact for general, privacy, media, and partnership messages |
| `/privacy` | Accounts, contributions, connections, consent, analytics, and retention notice |
| `/terms` | Public-beta use, contribution, connection, and disclaimer terms |
| `/admin/*` | Private source intake, review, public-beta insights, participation, and coverage operations |

## Discovery experience

The selected visual direction is a bright public intelligence atlas with a
map-first discovery surface and a synchronized accessible evidence table.

The first view must:

- make the search field and current filters obvious
- show published counts rather than market-size claims
- keep the map useful for orientation without making it the only navigation surface
- keep a bounded table visible below the map on desktop and tablet, containing only entities represented inside the map viewport
- synchronize marker selection, table-row selection, and a compact lookbook preview
- let a user expand a table row to see the current rationale, evidence links, confidence, and map precision
- progressively disclose demand and evidence detail after a relevant filter or selection
- work on mobile through a map/list toggle, with the list as the complete accessible result set for the current viewport

Natural-language discovery may only:

- choose known region, domain, mission, demand, type, stage, and program values
- query published records
- summarize evidence returned by those records
- expose every applied filter as a removable chip

It must never invent an organization or fact. Ambiguous questions return suggested filters.

## Canonical data model

### Ecosystem records

- `organizations` — one canonical row per company, accelerator, incubator,
  research/test centre, investor/funder, ecosystem organization, or government
  innovation office; includes common profile fields and a small validated
  `profile_data` object for type-specific details
- `organization_dossiers` — read-only RLS-preserving view that assembles one
  standard dossier payload for detail pages, PDFs, exports, and the editor
- `locations`
- `organization_locations`
- `capabilities`
- `technical_domains`
- `capability_domains`
- `mission_areas`
- `capability_mission_matches`
- `ecosystem_clusters`
- `capability_clusters`

### Demand and ecosystem participation

- `demand_sources`
- `demand_requirements`
- `capability_demand_matches`
- `programs`
- `program_participations`
- `funding_events`
- `organization_relationships`
- `media_assets`

### Evidence

- `sources`
- `evidence_snippets`
- `field_citations`

### Ingestion governance

- `research_runs`
- `candidate_changes`
- `submissions`
- `review_decisions`
- `audit_events`

### Private user state

- `saved_collections`
- `saved_collection_items`

### Private public-beta learning and participation

- `pilot_update_signups` — affirmative update consent ledger
- `pilot_feedback` — unauthenticated product feedback staged privately for review
- `pilot_searches` — private raw search terms and interpreted filters retained for 90 days
- `pilot_events` — bounded, privacy-light workflow events retained for 30 days
- `connection_requests` — authenticated private introduction requests and review status
- `contact_messages` — private, rate-limited contact inbox

## Source and privacy policy

Every source is classified as `public`, `permissioned`, or `internal`.

- Public claims require a canonical public source or an approved first-party submission.
- Confidential emails may inform product requirements but cannot become public citations.
- Permissioned or internal material cannot support a public claim without publication permission or public corroboration.
- Named contacts appear only when officially published or explicitly submitted and approved.
- Raw uploads, internal correspondence, extraction output, and drafts remain in private storage.
- Only approved media with recorded source, permission, attribution, and licence may be served publicly.

## Hosted database security contract

- Every exposed table has RLS enabled.
- Anonymous users receive explicit `select` grants and can read only published rows allowed by policy.
- Authenticated members can manage only their own private Working Lists, submissions, and connection requests.
- The sole public-beta administrator is fail-closed against Andrew's immutable identity ID, exact email, and controlled `app_metadata.role = admin` across pages, server actions, APIs, and row-level policies.
- User-editable metadata cannot grant administrator access, and no public navigation exposes an admin link.
- Member account deletion revokes active sessions, requires a recent sign-in and exact-email confirmation, and removes owned private data through existing foreign-key rules. The administrator account cannot self-delete.
- Service credentials remain server-side.
- New tables receive no implicit Data API privileges; grants are explicit in migrations.

## Ingestion and review workflow

Supported entry paths:

1. editor stages a URL or private PDF
2. approved research agents stage durable public-source leads
3. an authenticated organization submits a claim or correction
4. an editor manually drafts or amends a record

Every path creates reviewable candidates with field evidence, duplicate checks, confidence, and source visibility.

The weekly research loop is:

1. calculate coverage by region x organization type x capability x demand requirement
2. select the highest-value gap
3. search durable public sources
4. draft records and citations
5. validate schema, URLs, duplicates, media rights, and evidence completeness
6. stage candidates in the review queue
7. require explicit human promotion
8. recalculate coverage and freshness

Failure, rate-limit, weak-source, and duplicate states produce review notes rather than partial publication.

## Exports

Public exports:

- filtered CSV with stable IDs
- individual organization PDF profile
- individual capability PDF profile
- regional PDF report

Authenticated export:

- saved-collection PDF lookbook

Unknown fields must be omitted cleanly. PDFs must keep citations clickable and label analyst assessments.

## Initial dataset contract

The clean public seed began with six previously validated organizations and their reviewed evidence:

- Kraken Robotics
- MDA Space
- Cellula Robotics
- Kongsberg Geospatial
- GeoSpectrum Technologies
- Open Ocean Robotics

The first reviewed Underwater ISR expansion added 12 source-backed organizations and capabilities through the canonical review workflow, bringing the live atlas to 18 published organizations and 18 published capabilities. The fifteen scaffold organizations and all placeholder rows remain excluded. A national expansion must add at least 12 more verified records before public release, with an operating target of 36 and representation across at least eight provinces or territories and four technical domains. The first five NATO problem families are published as demand statements, with zero matches until evidence-backed mappings pass review.

## Acceptance criteria

- Anonymous browsing never exposes drafts, raw documents, private evidence, submissions, or collections.
- A first-time user can move from region to dossier and export in under five minutes.
- Map, table, filters, count, selection, export, and URL state remain synchronized.
- Natural-language search returns only existing published IDs and evidence.
- Every demand match is labelled, cited, reviewable, and caveated.
- No synthetic name, example domain, placeholder contact, or unsupported metric appears publicly.
- Duplicate submissions, missing coordinates, unavailable images, stale sources, failed agents, and empty regions have safe states.
- Public discovery meets WCAG AA keyboard, contrast, and non-map navigation requirements.
- Target performance is p75 LCP under 2.5 seconds on broadband, filter feedback under 300 ms after data load, and responsive clusters for at least 1,000 points.
- Public Beta requires at least 30 verified records, zero scaffold records, complete RLS tests, passing automated/browser tests, and privacy review. The longer-term corpus target remains 150-250 verified records.

## Delivery status

Implemented locally as of 2026-07-15:

- clean schema, explicit grants, RLS, storage policy, validated seed, and migration tests
- Option 3 national atlas and evidence table
- public organizations, capabilities, regions, and NATO demand routes
- constrained discovery and public API routes
- PDF and CSV exports
- Google OAuth with PKCE and passwordless email links for public sign-in
- auth-aware public navigation and an owner-only account workspace with status history, sign-out feedback, and account deletion
- owner-only collections and lookbook export
- reviewed public submissions
- private source/PDF intake, candidate review, and coverage screens

Implemented for the Canadian Public Beta as of 2026-07-17:

- private consented update signup, general feedback, and bounded event capture
- RLS-enabled pilot tables with no anonymous or authenticated Data API privileges
- delayed update prompt, persistent feedback access, public privacy and terms notices
- independent Ecosystem Intelligence identity using restrained navy, ocean teal, and cyan cues
- mobile map/list protection against collapsed hidden-map bounds
- Vercel aggregate page analytics and sampled Speed Insights with query strings redacted
- indexable canonical public pages, sitemap, structured data, and explicit coverage framing
- private connection requests, contact inbox, contribution review, subscribers, searches, funnel insights, and workflow status administration
- numbered map clusters that expand on selection in both the primary map and its browser fallback
- a structured organization review queue with per-field editing, duplicate resolution, approval, and a separate all-or-nothing publication checkpoint
- 12 verified national-expansion dossiers staged privately; public publication remains pending Andrew's explicit review and confirmation

Still required before the Monday public release:

- reach and explicitly approve the 30-record verified publication floor
- complete fresh-account Google OAuth, passwordless email-link, account-deletion, and administrator-access checks
- register the Vercel URL with Google Search Console and Bing Webmaster Tools
- full accessibility, privacy, and public-launch review

## Explicitly deferred

- monetization or paid tiers
- French content, UI, routes, locale switching, and localization scaffolding
- CRM synchronization or relationship-history ingestion
- tender feeds as a primary workflow
- direct self-service publication
- outbound sequencing or sales-pipeline management
- continuous autonomous publication
- classified, restricted, or inferred government demand
