# True North Map - Canadian Defence and Dual-Use Ecosystem Map

Status: active product requirements
Last updated: 2026-07-25

Canonical orientation: see [True North Map Project Overview](./True%20North%20Map%20Project%20Overview.md) for the current system boundary, terminology map, integration roles, and release contract.

## Product summary

True North Map is the public brand for this free, English-language ecosystem intelligence and mapping service at `https://truenorthmap.ca`. It maps Canada's defence and dual-use ecosystem and helps users move from a region or mission problem to relevant organizations, review the public evidence behind each profile, understand current coverage gaps, and preserve useful records in a private Working List.

The primary journey is:

> Place or released public need -> relevant organizations -> technology or offering -> where this technology may help -> Working List or export

The product combines public mapping, decision-useful organization profiles, public Canadian and allied demand signals, and a review-first research pipeline. Agents and deterministic comparisons can stage research suggestions but cannot publish them.

## Founder catalyst and North Star

True North Map is grounded in Andrew Davies's experience as a veteran and Combat Systems Engineering Officer, his work in the civilian sector, and his decision to focus that experience on Canadian defence and sovereign capability. Defence-sector project delivery and engagement with operators, engineers, subject-matter experts, founders, and program teams revealed both extraordinary national talent and a persistent coordination problem: Canada lacked a shared, practical view of who was building, what their technology could do, where it might fit, and who should be in the next conversation.

The product's guiding North Star is:

> Map what Canada can build. Connect the people ready to build it. Help the whole ecosystem move together.

This story should guide product and marketing decisions. True North Map exists to make contribution easier, not merely to catalogue records. Discovery should lead toward clearer decisions, useful collaboration, and stronger Canadian capacity while preserving public-source trust, transparent gaps, and independent review.

## Canadian Public Beta

The active release is an independent, English-only Canadian Public Beta created and stewarded by Andrew Davies under the True North Map brand at `truenorthmap.ca`.

- Public browsing, evidence, profiles, and exports remain free.
- Google OAuth and passwordless email sign-in are used only for private Working Lists, contributions, connection requests, and account management.
- Public feedback, consent-backed updates, and contact remain available without authentication.
- Read current corpus counts from the canonical production database. Expansion remains evidence-backed and review-first; no jurisdiction is padded to imply coverage.
- `https://truenorthmap.ca` is the canonical indexable production URL; the former Vercel URL redirects to it and private workflows remain blocked from search.
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

1. Understand who operates in a Canadian region or technology landscape.
2. Describe a need in plain language and find source-backed organizations and technologies without learning a specialist query language.
3. Inspect why a technology may fit a mission or public demand statement and challenge that interpretation.
4. See where coverage is thin, stale, weak, or not yet reviewed.
5. Export a dossier, regional report, filtered dataset, or saved lookbook.
6. Claim, correct, or suggest a public profile without enabling direct self-publication.
7. Give editors a governed path from a URL, PDF, agent lead, or manual entry to a reviewed canonical record.

## Product principles

### Public by default, private where necessary

Anonymous users can browse, search, view profiles, and export published intelligence. Authentication is reserved for private collections, profile claims, corrections, and editorial operations.

### Evidence before volume

The map must not pad thin regions with synthetic organizations. Every public organization needs a canonical public source, and every commercial organization needs at least one reviewed technology or offering.

### Facts and analysis remain separate

Source-backed facts, True North Map assessments, and coverage gaps must be visibly distinct. Every public Demand Signal begins with a released public source and an inspectable supporting passage. Technology-to-demand connections are human-reviewed assessments, not procurement eligibility, endorsement, customer interest, or classified demand.

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

Map coverage is never limited by result-card pagination. Every matching
published organization with usable coordinates is delivered through a compact
marker record and is available to clustering when the map opens. Detailed
organization cards remain paginated and load full profiles only when needed so
the atlas can grow to thousands of records without silently omitting later
pages from the national view.

Selecting a marker or table row opens one compact organization preview with a
verified capability, source count, public-evidence strength or our assessment,
last-verified status, and explicit actions to open the full profile, save it, or
inspect sources. Marker selection never
publishes, infers, or invents additional facts.

### Human publication boundary

Automated research can create leads and candidate changes. Only an explicit human-reviewed promotion can change canonical published records.

## Public information architecture

| Route | Purpose |
| --- | --- |
| `/` | National ecosystem map with natural-language discovery, structured filters, synchronized map, and evidence table |
| `/regions/[slug]` | Regional counts, published organizations, reviewed clusters, and explicit gaps |
| `/organizations` | Published organization directory |
| `/organizations/[slug]` | Organization profile with technology or offerings, public contact paths, where the technology may help, and evidence |
| `/capabilities/[slug]` | Technology profile with features, uses, maturity, where the technology may help, and evidence |
| `/demand` | Released public needs and reviewed Canadian technology connections |
| `/demand/[slug]` | Public need, desired outcome, exact source passage, reviewed assessments, gaps, and caveats |
| `/how-it-works` | Five-step public journey from map discovery through evidence, released needs, reviewed assessments, and conversation |
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
| `/admin/*` | Private source intake, review, publication, public-beta insights, organization and demand-signal editing, demand matching, and coverage operations |

## Discovery experience

The selected visual direction is a bright public ecosystem map with a
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
- rank up to five known organizations as strong, plausible, or adjacent fits
- show source support separately from derived fit and link every reason to an approved public citation
- expose an exact match, closest-supported result, or coverage gap without manufacturing certainty

It must never invent an organization or fact. Ask True North uses the OpenAI Responses API with strict structured output, no web tools, no saved model response, a server-validated known-ID boundary, and the canonical published Supabase snapshot. A deterministic relevance pass selects a bounded set of current published records for each question before model ranking; it is not a second index, and newly published records remain immediately eligible. Anonymous visitors receive three questions per rolling 24 hours and signed-in users receive 20. Follow-up context is temporary browser state only. Quota, timeout, refusal, missing-key, dependency, authentication, API-quota, rate-limit, model-access, network, and invalid-output failures are recorded as sanitized operational classes and fall back to deterministic discovery rather than failing the map. Ambiguous questions return suggested filters.

## Canonical data model

### Ecosystem records

- `organizations` — one canonical row per company, accelerator, incubator,
  research/test centre, investor/funder, ecosystem organization, or government
  innovation office; includes common profile fields and a small validated
  `profile_data` object for type-specific details
- `organization_dossiers` — read-only RLS-preserving view that assembles one
  standard profile payload for detail pages, PDFs, exports, and the editor;
  official public contact URLs, email, phone, and LinkedIn may be kept inside
  the small `profile_data.publicContact` object rather than a second entity table
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

Approved organization logos use `media_assets` and the existing `atlas-public-media` bucket rather than a separate branding store. Public dossiers select only the newest public, approved, published `logo` row. Official high-confidence marks may be imported directly with immutable checksummed storage paths; uncertain marks remain unpublished for human review. Administrators may replace or remove a mark from the canonical organization editor, with provenance and audit history preserved.

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

- `pilot_update_signups` — historical physical table name for the affirmative public-beta update consent ledger
- `pilot_feedback` — historical physical table name for unauthenticated public-beta feedback staged privately for review
- `pilot_searches` — historical physical table name for private raw search terms, interpreted filters, assistant outcome, latency, and token measures retained for 90 days
- `pilot_events` — historical physical table name for bounded, privacy-light public-beta workflow events retained for 30 days
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
2. trusted research agents qualify durable public-source leads and stage enriched private new-record or refresh candidates
3. an authenticated organization submits a claim or correction
4. an editor manually drafts or amends a record

Every path creates reviewable candidates with field evidence, duplicate checks, confidence, and source visibility.

The private editorial workspace separates two maintenance modes:

- staged research moves from field review to an approved checkpoint, then all
  currently approved records are published through one explicit, atomic button
  action
- existing published organizations can be edited through a unified canonical
  dossier form covering organization identity, primary location, business
  profile, capability detail, technical domains, and cluster assignment

Published-record edits preserve stable slugs, require an editorial rationale,
retain the existing evidence boundary, record before/after values in the audit
log, and invalidate the public map cache immediately. Official public contact
paths have their own narrow, audited editor and are omitted unless a public
source supports them. New or replacement
evidence continues through the review-first candidate workflow.

Automated enrichment follows the same boundary. The refresh agent matches a
signal to a live record, captures its target ID and `updated_at` baseline, and
stages explicit additive field or child-record operations with durable
field-level evidence. Staging and human acceptance remain private. Only the
separate Publish checkpoint may lock the target, reject a stale baseline, apply
the reviewed operations, append sources and citations, and revalidate public
routes. A refresh candidate shown as JSON is a private change envelope, not a
canonical dossier update.

The private demand-matching workspace compares reviewed technology profiles
with published demand statements using deterministic mission-concept overlap.
It stages only `needs_review` suggestions, excludes existing pairs, and never
publishes automatically. The reviewer opens both public records, decides whether
the connection is useful and defensible, and may publish one derived match with
an explicit rationale. Publication copies the existing technology and demand
citations, labels the connection as a reviewed assessment, and records the full
audit trail.

The autonomous research cadence is:

1. run broad discovery at 06:00 America/Halifax each Monday
2. run multi-source record and demand refresh at 08:00 each weekday
3. calculate coverage and freshness from live production records
4. search official, government, Source Book, and discovery-feed source families
5. qualify durable evidence and build typed new-record or refresh candidates
6. validate schema, URLs, target baselines, duplicates, and evidence completeness
7. stage candidates in the existing review queue
8. require explicit human promotion
9. recalculate coverage and freshness

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

The first reviewed Underwater ISR expansion added 12 source-backed organizations and technologies through the canonical review workflow, bringing the map to 18 records. A second 12-organization national expansion was field reviewed, approved with substantive rationale, and promoted atomically on July 17, 2026, bringing the live map to 30 organizations and 30 technologies. Five further typed research candidates and one Canadian public-demand source were subsequently reviewed and published. That July 19 snapshot contained 35 organizations, 31 technologies or offerings, six public demand requirements, and seven reviewed technology-to-demand matches with dual-source citations. The fifteen scaffold organizations and all placeholder rows remain excluded. Current totals come from production; future expansion remains source-backed and review-first rather than numerically frozen or padded.

## Acceptance criteria

- Anonymous browsing never exposes drafts, raw documents, private evidence, submissions, or collections.
- A first-time user can move from place or need to an organization profile and export in under five minutes.
- Map, table, filters, count, selection, export, and URL state remain synchronized.
- Natural-language search returns only existing published IDs and evidence.
- Every demand match is labelled, cited, reviewable, and caveated.
- No synthetic name, example domain, placeholder contact, or unsupported metric appears publicly.
- Duplicate submissions, missing coordinates, unavailable images, stale sources, failed agents, and empty regions have safe states.
- Public discovery meets WCAG AA keyboard, contrast, and non-map navigation requirements.
- Target performance is p75 LCP under 2.5 seconds on broadband, filter feedback under 300 ms after data load, and responsive clusters for at least 1,000 points.
- Public Beta requires at least 30 reviewed records, zero scaffold records, complete RLS tests, passing automated/browser tests, and privacy review. Corpus expansion proceeds separately through the evidence and human-publication workflow.

## Delivery status

Current implementation status updated on 2026-07-23. Exact live corpus and
workflow counts are read from production rather than frozen here:

- clean schema, explicit grants, RLS, storage policy, validated seed, migration
  tests, and server-only credentials
- the verified release floor is met, scaffold records remain excluded, and
  continued expansion is evidence-backed and human-published
- authoritative public-demand sources and reviewed technology-to-demand matches
  retain specific rationales and evidence inherited from both sides
- independent Field Atlas visual system using a warm neutral canvas, spruce
  primary actions, coral selection, violet analyst-assessment states, and
  rounded public surfaces
- national ecosystem map with constrained discovery, organization-type filters, synchronized
  URL state, numbered map clusters, viewport-bounded evidence table, compact
  organization preview, and visible-result export
- public organization, technology, region, demand, About, Methodology, Contact,
  Privacy, and Terms routes
- individual, regional, filtered CSV, and private collection lookbook exports
- Google OAuth with PKCE and passwordless email links for personal or work-email
  sign-in
- session-aware public navigation, account workspace, visible pending states,
  sign-out, recent-reauthentication account deletion, and protection against
  administrator self-deletion
- owner-only Working Lists, contributions, connection requests, and status views
- owner-only administration with no public link and fail-closed identity, email,
  role, server-action, API, and RLS checks
- consented update signup, public feedback, contact, reviewed contribution, and
  manually brokered connection workflows
- private subscribers, searches, events, feedback, contact, contribution,
  connection, coverage, candidate-review, publication, organization editing,
  official public-contact editing, and review-first demand-matching administration
- structured candidate review, substantive rationale, duplicate resolution,
  one-button atomic publication, direct published-record editing, audit history,
  stable slugs, and cache invalidation
- six project-local research skills of record, including multi-source signal
  refresh, live entity matching, typed before/after refresh operations, direct
  private review intake, stale-baseline rejection, append-only evidence, and
  explicit human publication
- Vercel Web Analytics plus bounded semantic workflow events, private 90-day
  searches, and private 30-day detailed events; paid Speed Insights is deferred
  and Lighthouse is the release performance check
- indexable public routes, public-only sitemap, canonical metadata, Open Graph,
  JSON-LD, and private-route blocking
- deterministic Halifax/HRM/Dartmouth discovery and a null-cohort validation fix
  for ordinary non-campaign searches, plus organization-type language for
  company, investor, accelerator, incubator, research-centre, ecosystem, and
  government-office discovery

Verified for the broader public-beta release:

- `truenorthmap.ca`, `www`, and the former Vercel URL resolve to the canonical
  production deployment; canonical metadata, social metadata, MapTiler, and
  both authentication callbacks use the production domain
- fresh-account Google OAuth, passwordless email-link sign-in, safe returns,
  account deletion, sign-out, session-aware navigation, and owner-only
  administrator access pass in production
- RLS, explicit Data API grants, privacy boundaries, service-secret placement,
  corpus integrity, evidence labels, and the zero-scaffold condition pass
- desktop, mobile, keyboard, reduced-motion, map/list, search, export,
  contribution, connection, feedback, subscription, and administration journeys
  pass production smoke tests
- the full automated release suite passes from the restored repository state
- the broader-sharing copy, source-specific UTM convention, outreach sequence,
  release controls, screenshots, Open Graph art, and short demonstration video
  are maintained under `content/launch/`; visual assets require a final check
  against the current production interface before each campaign
- Google Search Console and Bing Webmaster Tools are verified and have received
  the canonical sitemap
- Ask True North is live as a constrained published-corpus discovery layer with
  known-record and citation validation, visible uncertainty, quotas, and a
  deterministic fallback
- Canadian Defence Briefs is live as the reviewed, article-led public synthesis
  surface, with an editorial collection page, formatted article reading experience,
  image placements, source links, related records, labelled Derived Reads, SEO/AEO
  metadata, and administrator-only publication. Evergreen explainers and clearly
  labelled timely analysis share the same human-review boundary.
- production remains the source of truth for live corpus and workflow counts;
  release claims use rounded values and exact values are checked immediately
  before publication
- the separated production email stack is operational across Zoho, MailerLite,
  Resend, Supabase Auth, and the consent ledger, with authenticated domains and
  signed subscriber lifecycle synchronization

The product is in broader-sharing posture. Remaining release work is operational:
close the July 19 release-test contribution and connection fixtures, keep update
subscriber synchronization confirmed, work pending and approved research candidates
through their appropriate review or Publish checkpoints,
perform a fresh signed-out and non-admin signed-in production walkthrough, check
launch visuals against the current UI, and execute the channel sequence in
`content/launch/public-beta-launch-package.md`. New features and artificial
corpus targets are not release gates.

## Explicitly deferred

- monetization or paid tiers
- French content, UI, routes, locale switching, and localization scaffolding
- CRM synchronization or relationship-history ingestion
- tender feeds as a primary workflow
- direct self-service publication
- outbound sequencing or sales-pipeline management
- continuous autonomous publication
- classified, restricted, or inferred government demand
