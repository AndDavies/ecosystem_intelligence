# True North Map - Canadian Defence and Dual-Use Ecosystem Map

Status: canonical product requirements
Owner: Andrew Davies
Last reviewed: 2026-09-05

Canonical orientation: see [True North Map Project Overview](./True%20North%20Map%20Project%20Overview.md) for the current system boundary, terminology map, integration roles, and release contract.

## September 5 discovery and comprehension implementation

The approved implementation leads with a searchable Canadian defence and dual-use directory for people finding partners. Homepage search, directory and map reuse deterministic matching. The practical hero sits above a compact current product specimen and the weekly newsletter. The slogan “Canada is building more than most people can see.” remains in the product-proof and founder story. The longer guided example now lives on How It Works. Navigation is Directory, Map, Mission areas, Defence needs, Defence Signals and About, with Free weekly briefing as the acquisition action.

Public Working Lists are now **Shortlists**; `/collections`, saved records, IDs, privacy and sign-in behaviour remain unchanged. Technologies and services is the mixed collection label. Source-backed facts, assessments, sources, dates and evidence limits retain their distinct meanings. Mobile bare map visits default to results, explicit view/selection/bounds preserve intent, and List is a real switch on desktop. Search all Canada clears only bounds.

North Signal means the weekly email; Defence Signals means public news and analysis. Reporting links are labelled honestly and carry no invented five-minute or three-item preview claim. Every public organization and technology profile gets contextual signup, with automatic popup suppression on those routes. The current private weekly candidate requires Andrew’s editorial approval; `/north-signal/sample` remains unavailable until a sanitized approved artifact is added. No migration, canonical publication, subscriber change, provider write, campaign or outreach is part of this presentation release.

The full brand vocabulary, content rules and research rationale are in the Brand System. Existing dated layout descriptions below are historical where they conflict with this implementation. See the discovery implementation plan for release evidence and remaining editorial/provider checkpoints.


## Product summary

True North Map is the public brand for this free, English-language Canadian defence capability-discovery service at `https://truenorthmap.ca`. It helps people find Canadian defence and dual-use organizations and technologies, understand where they may fit, and decide who is worth speaking with next. Profiles then expose the facts, assessment, sources, and limits behind that possible fit, and useful records can be preserved in a private Shortlist.

The primary journey is:

> Real question, Mission area, place, technology area, or released Defence need -> organizations and technologies that may help -> why they matter -> facts, assessment, sources, and limits -> Shortlist, export, correction, or introduction

The product combines public mapping, decision-useful organization profiles, public Canadian and allied demand signals, and a review-first research pipeline. Agents and deterministic comparisons can stage research suggestions but cannot publish them.

## Founder catalyst and North Star

True North Map is grounded in Andrew Davies's experience as a veteran and former Combat Systems Engineering Officer, his work in the civilian sector, and his decision to focus that experience on Canadian defence and sovereign capability. Defence-sector project delivery and engagement with operators, engineers, subject-matter experts, founders, and program teams revealed both extraordinary national talent and a persistent coordination problem: Canada lacked a shared, practical view of who was building, what their technology could do, where it might fit, and who should be in the next conversation.

The product's guiding North Star is:

> Map what Canada can build. Connect the people ready to build it. Help the whole ecosystem move together.

This story should guide product and marketing decisions. True North Map exists to make contribution easier, not merely to catalogue records. Discovery should lead toward clearer decisions, useful collaboration, and stronger Canadian capacity while preserving public-source trust, stated evidence limits, and independent review.

## Canadian Public Beta

The active release is an independent, English-only Canadian Public Beta created and stewarded by Andrew Davies under the True North Map brand at `truenorthmap.ca`.

- Public browsing, evidence, profiles, and exports remain free.
- Google OAuth and passwordless email sign-in are used only for private Shortlists, contributions, connection requests, and account management.
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

### Outcome before proof

Public discovery and acquisition first explain the decision a visitor can make:
find who may help, understand why they may matter, and choose the next useful
conversation. Facts, True North Map assessments, cited sources, limitations,
and human review then establish why the visitor should trust that path. The
product never uses `evidence-led` as its category or primary sales claim, but it
retains precise evidence language wherever a claim or decision needs it.

### Public by default, private where necessary

Anonymous users can browse, search, view profiles, and export published intelligence. Authentication is reserved for private collections, profile claims, corrections, and editorial operations.

### Evidence before volume

The map must not pad thin regions with synthetic organizations. Every public organization needs a canonical public source, and every commercial organization needs at least one reviewed technology or offering.

### Facts and analysis remain separate

Source-backed facts, True North Map assessments, and evidence limits must be visibly distinct. Claim-adjacent limits name what is **Not established in the reviewed public record**; `unknowns` and Coverage gap remain internal field/state names. Every public Demand Signal begins with a released public source and an inspectable supporting passage. Technology-to-demand connections are human-reviewed assessments, not procurement eligibility, endorsement, customer interest, or classified demand.

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

The homepage may offer a question-led CMMC readiness continuation to the
existing canonical Defence Signals edition. This editorial link does not create
a taxonomy object, relationship, filter, or map state.

### Marketing and outreach remain manual and exact-route

Marketing uses published routes as the product demonstration. Andrew's founder
voice begins with one concrete capability or coordination question and links to
the exact organization, technology, Mission area, Defence need, Signals edition,
or North Signal sample that supports the post. The default pilot cadence is at
most two manually approved posts per week. Search and visibility data may guide
topic selection but never establish customer interest.

The stable founder-pilot attribution is
`utm_campaign=tnm_founder_pilot_v1`, with approved source, medium, and content
values defined in `Marketing And Outreach Operations.md`. Admin Insights reuses
the existing bounded event ledger to report attributed result selection,
dossier/source opens, saves, feedback, contributions, connections, and North
Signal conversion. QA, staff, test, internal, automation-test, and `/dev/`
traffic remain in the governed raw ledger but are excluded from scorecards.
No behaviour event contains email, message text, or social identity.

Every external post, direct message, partner note, campaign, or outreach action
requires Andrew's explicit final approval. The product, research, visibility,
Signals, and North Signal workflows do not gain external-send authority.

### Guided search is deterministic before Ask True North

The landing page may offer a fixed public example with visitor-adjustable **Search focus** controls. The only serializable values are an allowlisted set of stable focus IDs; the normal `/map` URL is refreshable and shareable, and the example parameter is removed only after the ordinary published-atlas state has loaded. This deterministic handoff never calls `/api/discover`, OpenAI, or the Ask True North quota path. It preserves a safe local return URL through profile, evidence, sign-in, and Shortlist actions without exposing private collection or account state.

### Human publication boundary

Automated research can create leads and candidate changes. Only an explicit human-reviewed promotion can change canonical published records.

The isolated Defence Signals editorial surface is the narrow exception. An Andrew-invoked manual Daily Signals run may publish a validated `daily_signals_packet_v3` only to dedicated `signal_*` tables and cited source-image storage under `brief-images/signals/`. Significance determines a nonempty edition's count and depth; research should deliver substantial understanding without article, paragraph or source-family quotas. Attributed announcements, original public reporting, direct records and corroboration retain their actual support level. Different developments may share a source page; repeated coverage of one event remains one signal. Immutable item-source snapshots preserve publication-time evidence. A completed editorial decision with no useful edition records `no_publish`; incomplete work records `blocked`, and operational errors record `failed`, all without creating public content or an alert. The finalization transaction commits edition and run together, after which packaging or verification failures cannot delete publication. Source images are optional, with an intentional text-led presentation; current-edition private LinkedIn/X examples remain useful retryable packaging and never post externally. V1/v2 packets remain available only for verified historical repair. Signals cannot change the canonical atlas, research queues, subscriber consent, MailerLite or social platforms. Andrew invokes the skill manually from his chat; there is no Daily Signals automation or schedule.

## Public information architecture

| Route | Purpose |
| --- | --- |
| `/` | Guided public landing page that introduces Canadian defence capability discovery, shows one real published specimen in a fixed non-interactive provider-resilient map view, and hands off to the canonical map workspace |
| `/map` | Compact map-first national atlas with deterministic published-record lookup, structured filters, a separately labelled Ask True North interpretation panel, shareable bounds and selection, a synchronized 380-pixel desktop rail, mobile result sheet, and accessible evidence table |
| `/regions/[slug]` | Regional counts, published organizations, reviewed clusters, and explicit gaps |
| `/organizations` | Published organization directory |
| `/organizations/[slug]` | Version-gated editorial organization dossier with identity and actions, operating context, current relevance, reviewed contribution paths, capabilities, public record, questions, geography, sources, and next steps |
| `/capabilities/[slug]` | Technology profile with features, uses, maturity, where the technology may help, and evidence |
| `/demand` | Released public needs and reviewed Canadian technology connections |
| `/demand/[slug]` | Public need, desired outcome, exact source passage, reviewed assessments, gaps, and caveats |
| `/signals` | Publication-driven archive of source-linked Canadian Defence Signals editions, visible RSS access and contextual North Signal signup |
| `/signals/[slug]` | Descriptive immutable edition URL with public facts, automated reads, unknowns, next steps, sources, and links into published atlas records |
| `/north-signal` | Acquisition page for the single free North Signal email newsletter; weekly briefing is the default delivery and new-Defence-Signal alerts require separate consent plus complete server-side provider configuration; `/signals` is the public proof and sample library |
| `/how-it-works` | Five-step public journey from a question through relevant capability, public evidence, comparison, a private Shortlist, and the next conversation |
| `/account` | Authenticated identity, Shortlists, connection and contribution status, sign-out, and private-data controls |
| `/collections` | Authenticated private Shortlists |
| `/collections/[id]` | Saved organization and capability shortlist with lookbook export |
| `/submit` | Authenticated profile claim, correction, or organization suggestion |
| `/connect/[slug]` | Authenticated, private request for a human-vetted introduction |
| `/about` | Independent founder story, purpose, and trust boundary |
| `/methodology` | Evidence, confidence, freshness, assessment, and review method |
| `/contact` | Rate-limited private contact for general, privacy, media, and partnership messages |
| `/privacy` | Accounts, contributions, connections, consent, analytics, and retention notice |
| `/terms` | Public-beta use, contribution, connection, and disclaimer terms |
| `/admin/*` | Private source intake, review, publication, public-beta insights, organization and demand-signal editing, demand matching, and coverage operations |

### Organization dossier experience

The shared editorial dossier must:

- lead with the actual organization type, approved logo or compact fallback, name, primary location, concise description, and Shortlist and introduction actions on Paper over the Field canvas;
- use a restrained non-sticky **On this page** index on desktop and a native disclosure on mobile, generated only from chapters that render and focused below the persistent header;
- move from `What the organization does` and `At a glance` into supported current activity, reviewed Mission area and Defence need relationships, capabilities, programs and relationships, conversation questions, geography, sources, and organization-specific next steps;
- keep relationship rationale, evidence strength and scoped review dates together, while making the complete relationship item lead to the relevant Mission area or Defence need;
- show capabilities as open, rule-separated editorial rows with no more than three visible decision-useful features and a disclosure or technology-profile link for longer detail;
- omit unsupported optional fields and whole chapters without placeholders or empty geometry;
- keep the contents index, facts, sources, related intelligence, PDF, metadata, sharing, analytics and action hierarchy useful for both sparse and enriched records;
- preserve one H1, visible keyboard focus, 44-pixel targets, anchor offset, reflow and no essential horizontal overflow at 390, 768, 1024 and 1440 pixels.

This is the canonical shared organization template across companies, accelerators, incubators, investors or funders, research or test centres, ecosystem organizations, and government innovation offices. The public route does not maintain a second visual family for unversioned records: sparse and enriched organizations use the same evidence-bounded component and omit unsupported sections. `editorial_profile_version = organization_editorial_profile_v1` remains the explicit record-level statement that dossier enrichment was reviewed; a schema migration, application deployment, candidate stage, or Review acceptance must not set it by itself. Each activation still requires its separately reviewed Publish action.

Capability profiles belong to the same decision family. They lead from what the
capability enables to sourced evidence of maturity, reviewed Mission area and
Defence need contribution, organization-level public programs or contracts with
the existing caveats, the source ledger, explicit **Evidence limits**, and one
bounded next-conversation handoff. This shared presentation never creates a new
relationship or strengthens evidence.

## Discovery experience

The selected visual direction is a bright public ecosystem map with a
map-first discovery surface and a synchronized accessible evidence table.

The first view must:

- make the deterministic published-record lookup and current filters obvious
- show published counts rather than market-size claims
- keep the map useful for orientation without making it the only navigation surface
- place the live map in the first `/map` viewport, with no marketing or explanatory section before it at 1024 pixels
- reserve at least half of a 1440 by 900 desktop viewport for active map canvas
- keep a fixed 380-pixel, internally scrolling synchronized results rail beside the desktop map
- keep a bounded accessible table below the desktop workspace, containing only entities represented inside the map viewport
- synchronize marker selection, table-row selection, and a compact lookbook preview
- let a user expand a table row to see the current rationale, evidence links, confidence, and map precision
- progressively disclose demand and evidence detail after a relevant filter or selection
- work on mobile through an explicit map/list toggle and collapsed, preview, and expanded synchronized result-sheet states, with the list as the complete accessible result set for the current viewport
- preserve bounds, filters, selection, view mode, sharing, profile return paths, browser history, sign-in returns, and Shortlist handoffs in ordinary `/map` URL state

Deterministic record lookup must:

- match only the current published discovery projection and never call OpenAI, `/api/discover`, or the Ask quota path
- support normalized exact, acronym, prefix, token-prefix, substring, and tightly bounded typo matching with deterministic stable ties
- group no more than four organizations, three capabilities, and three combined Technology Area, Mission area, or Defence need suggestions
- link organization and capability suggestions to their canonical dossiers, while taxonomy suggestions and submitted queries update ordinary shareable map filters and synchronized results
- show approved organization identity where available, use the existing neutral fallback otherwise, and expose neither private evidence fields nor a numeric relevance score
- remain fully operable by keyboard with combobox semantics, clear loading, empty, and error states, 44-pixel targets, and no mobile overflow
- record only bounded result-selection or filter actions with no raw query, personal data, referrer, or inherited Ask search identifier

Ask True North remains a distinct natural-language interpretation path and may only:

- choose known region, domain, mission, demand, type, stage, and program values
- query published records
- summarize evidence returned by those records
- expose every applied filter as a removable chip
- rank up to five known organizations as strong, plausible, or adjacent fits
- show source support separately from derived fit and link every reason to an approved public citation
- expose an exact match, closest-supported result, or coverage gap without manufacturing certainty

It must never invent an organization or fact. Ask True North uses the OpenAI Responses API with `gpt-5.6-luna` as the default model, strict structured output, low reasoning effort, no web tools, no saved model response, a server-validated known-ID boundary, and the canonical published Supabase snapshot. The model remains server-configurable through `OPENAI_MODEL`, but every replacement must preserve structured output and the same published-record guardrails. A deterministic relevance pass selects a bounded set of current published records for each question before model ranking; it is not a second index, and newly published records remain immediately eligible. Anonymous visitors receive three questions per rolling 24 hours and signed-in users receive 20. Follow-up context is temporary browser state only. Quota, timeout, refusal, missing-key, dependency, authentication, API-quota, rate-limit, model-access, network, and invalid-output failures are recorded as sanitized operational classes and fall back to deterministic discovery rather than failing the map. Ambiguous questions return suggested filters.

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
- normalized editorial organization fields include the version gate, cited current activity and its as-of date, operating context, Canadian footprint, and up to four reviewed first-conversation questions; type-specific public profile fields remain in the validated allowlist
- pipeline 1.7.3 includes nullable
  `executive_relevance_summary`, an 80-to-1,200-character human-reviewed True
  North Map assessment synthesized only from supported public fields and
  reviewed relationships; non-null content requires a field citation and null
  remains the safe state when evidence is insufficient
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
- `program_participations` — organization-specific public summary, lifecycle, announced/started/ended dates, and bounded external identifiers; the initial one-to-one program corpus is normalized without removing the original program summary or citations
- `funding_events`
- `organization_relationships`
- `media_assets`

### Automated editorial Signals

- `signal_editions` — descriptive immutable canonical editions and correction timestamps
- `signal_items` — ordered developments with significance-led narrative depth; v3 keeps source facts distinct and permits absent assessment, unknowns or next steps when they add no value; historical v1/v2 editions remain repairable
- `signal_sources` and `signal_item_sources` — canonical public source identities and immutable v3 item-specific evidence snapshots; legacy joins retain their historical fallback
- `signal_record_links` — optional links to already-published organizations, technologies, Defence needs, and Mission areas
- `signal_runs` and `signal_social_drafts` — owner-only operational status and unsent copy protected by RLS and denied to anonymous users

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
- `pilot_searches` — historical physical table name for private raw Ask True North questions, interpreted filters, assistant outcome, latency, and token measures retained for 90 days; deterministic record lookups are not written here
- `pilot_events` — historical physical table name for bounded, privacy-light public-beta workflow events retained for 30 days
- `newsletter_subscription_preferences` — private normalized weekly or signal-alert preference state, consent version/text/timestamps, withdrawal and provider-sync state; unique per subscriber and stream
- `newsletter_subscription_preference_history` — append-only private stream-consent and withdrawal history
- `newsletter_delivery_runs` — private aggregate delivery state keyed to one stream and issue or edition, with duplicate prevention
- `newsletter_campaign_metric_snapshots` — append-only aggregate sent, delivered, estimated unique open, click, bounce and unsubscribe observations by provider campaign
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
- Authenticated members can manage only their own private Shortlists, submissions, and connection requests.
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
  dossier form covering organization identity, primary location, editorial
  profile and activation version, public contact, capability detail, program
  participation, funding, relationships, technical domains, and cluster
  assignment

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

Production advertises `tnm-research-pipeline/1.7.3`. It carries the optional executive relevance summary through exact
candidate preview, labelled Admin Review, human acceptance and the separate
new/refresh Publish functions. Staging rechecks that the deployed database,
research contract, Review and Publish surfaces advertise compatibility.
Acceptance remains private and does not change the public dossier.

The product also requires a separately typed canonical-repair path when public evidence proves that an existing organization identity, alias, lifecycle state or capability is wrong and ordinary additive refresh cannot represent the correction. The v4/1.8.0 contract binds one exact organization to an immutable service-role-only snapshot and permits only `set_organization_identity`, `set_profile_field`, `add_alias`, `archive_alias`, `archive_capability`, and `archive_organization`. It never hard-deletes, reparents, transfers or changes a stable slug. A positively proven superseded organization may create one immutable old-slug redirect to one already published successor.

Canonical repair must fail closed on collision, protected dependency, snapshot drift, unsupported lifecycle evidence or ambiguous successor. It does not use the ordinary run-level Accept All or multi-record Publish controls. One repair candidate receives one human Review decision and, only after acceptance, one separate atomic Publish action. Acceptance itself writes no canonical record. Intake remains unavailable unless the additive migration, application and advertised contract are verified together.

The private demand-matching workspace compares reviewed technology profiles
with published demand statements using deterministic mission-concept overlap.
It stages only `needs_review` suggestions, excludes existing pairs, and never
publishes automatically. The reviewer opens both public records, decides whether
the connection is useful and defensible, and may publish one derived match with
an explicit rationale. Publication copies the existing technology and demand
citations, labels the connection as a reviewed assessment, and records the full
audit trail.

The research operating sequence is:

1. begin a manual broad-discovery or refresh run when Andrew requests it
2. keep automated broad research retired and the multi-source refresh schedule paused
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
- Anonymous organization responses never expose reviewer IDs, reviewed
  candidate IDs, research schema versions or ingestion batch IDs; those remain
  private workflow lineage.
- A first-time user can move from place or need to an organization profile and export in under five minutes.
- Map, table, filters, count, selection, export, and URL state remain synchronized.
- Natural-language search returns only existing published IDs and evidence.
- Every demand match is labelled, cited, reviewable, and caveated.
- No synthetic name, example domain, placeholder contact, or unsupported metric appears publicly.
- Duplicate submissions, missing coordinates, unavailable images, stale sources, failed agents, and empty regions have safe states.
- Public discovery meets WCAG AA keyboard, contrast, and non-map navigation requirements.
- The editorial organization dossier omits unsupported chapters, keeps its navigator synchronized to rendered targets, and preserves keyboard order, visible focus, 44-pixel targets and overflow-free layouts at the governed responsive widths.
- Target performance is p75 LCP under 2.5 seconds on broadband, filter feedback under 300 ms after data load, and responsive clusters for at least 1,000 points.
- Public Beta requires zero scaffold records, complete RLS tests, passing automated and browser checks, a successful privacy review, and no unsupported featured claim. Corpus expansion proceeds continuously through the evidence and human-publication workflow rather than a fixed release count.
- Dossier-view or public-citation changes require the exact-deployment cold gate
  across at least ten activated high-citation, sparse, recently updated and
  coverage-fill profiles; HTTP 200 is insufficient when the RSC stream,
  metadata, citation trail or forbidden-lineage scan fails.
- The bounded launch gate treats RSC/loading/metadata failures as blockers. A
  full launch audit is reserved for major internal-link architecture changes,
  manually requested periodic assurance or an explicit broad audit; it visits normalized
  same-origin targets once and probes only deliberately marked durable public
  sources within independent safety ceilings.

## Delivery status

Current implementation status updated on 2026-07-31. Exact live corpus and
workflow counts are read from production rather than frozen here:

- clean schema, explicit grants, RLS, storage policy, validated seed, migration
  tests, and server-only credentials
- the verified release floor is met, scaffold records remain excluded, and
  continued expansion is evidence-backed and human-published
- authoritative public-demand sources and reviewed technology-to-demand matches
  retain specific rationales and evidence inherited from both sides
- deployed True North Map identity using the directional N, North Ink, Field,
  Paper, Signal Yellow, Evidence Green, Editorial Blue, Barlow display type,
  Inter body type, restrained rounded geometry, borderless tonal surfaces,
  quiet bordered pills for taxonomy and links, stationary hover states, and
  evidence-first public states
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
- owner-only Shortlists, contributions, connection requests, and status views
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
- seven project-local research skills of record, including candidate-logo
  disposition, multi-source signal refresh, live entity
  matching, typed before/after refresh operations, official-site identity-media
  provenance, direct private review intake, stale-baseline rejection, append-only
  evidence, and explicit human publication
- a separate private visibility-intelligence integration for SEO, GEO, AEO,
  technical health, search demand, and earned-link analysis; provider credentials,
  raw exports, queries, referrals, and reports remain ignored local artifacts and
  never gain publication, provider-write, indexing, outreach, or corpus authority
- Vercel Web Analytics plus bounded semantic workflow events, private 90-day
  searches, and private 30-day detailed events; paid Speed Insights is deferred
  and Lighthouse is the release performance check
- indexable public routes, public-only sitemap, canonical metadata, Open Graph,
  JSON-LD, and private-route blocking
- deterministic Halifax/HRM/Dartmouth discovery and a null-cohort validation fix
  for ordinary non-campaign searches, plus organization-type language for
  company, investor, accelerator, incubator, research-centre, ecosystem, and
  government-office discovery
- evidence-light streamed collection routes for Organizations, Regions,
  regional directories, and Defence needs, preserving immediate branded context,
  complete national discovery, pagination, and bounded rich-evidence loading
- seven reviewed regional illustrations for Canada, Atlantic Canada, Quebec,
  Ontario, the Prairies, British Columbia, and the North
- North Signal as the single email newsletter, with weekly editorial preparation
  and sending kept human-reviewed and manual

Production release prepared on 2026-08-26 and provider-reconciled on
2026-08-27:

- unified public naming, contextual signup, a separately consented optional
  Defence Signal alert preference, a fail-closed no-backlog RSS alert
  contract, and distinct-session 7/14/28-day scorecards that exclude explicit
  QA/staff/test traffic without deleting the 30-day raw event ledger
- two versioned Supabase migrations for stream-specific consent, append-only
  withdrawal history, provider-event receipts, delivery runs, aggregate campaign
  metrics, an active-subscriber weekly-only backfill, and post-deploy
  reconciliation
- revised welcome, weekly and compact alert source templates in the restrained
  True North Map email family

The two migrations release only in the dependency order base migration -> exact
compatible application READY -> post-deploy reconciliation. Provider groups,
Preference Center, welcome and weekly surfaces, signed group webhooks and the
new-posts-only RSS campaign are reconciled on the existing Comfort plan without
a purchase. One controlled preference-verification campaign was sent only to
Andrew and its temporary delivery-group memberships were removed afterward. A
full production audience send remains outside application release authority.

Verified for the broader public-beta release:

- `truenorthmap.ca`, `www`, and the former Vercel URL resolve to the canonical
  production deployment; canonical metadata, social metadata, map-provider configuration, and
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
- broader-sharing copy, screenshots, decks, reports, Open Graph art, or a short
  demonstration video are created only on explicit request, locally by default,
  and checked against the current production interface before use
- Google Search Console and Bing Webmaster Tools are verified and have received
  the canonical sitemap
- deterministic map lookup provides direct published-record and taxonomy search
  without AI, raw-query retention, or an Ask quota; Ask True North remains live
  as a separately labelled constrained published-corpus interpretation layer with
  known-record and citation validation, visible uncertainty, quotas, and a
  deterministic fallback
- Canadian Defence Briefs is live as the reviewed, article-led public synthesis
  surface, with an editorial collection page, formatted article reading experience,
  image placements, source links, related records, labelled Derived Reads, SEO/AEO
  metadata, and administrator-only publication. Evergreen explainers and clearly
  labelled timely analysis share the same human-review boundary.
- `/north-signal` is the canonical external acquisition page for North Signal,
  and `/signals` is its public sample library. Existing Brief
  URLs remain live, canonical and indexed as an evergreen archive, but they do
  not appear in primary navigation, the homepage acquisition path, newsletter
  promotion, welcome copy, weekly issue templates or new outreach.
- A ready `north_signal_issue_v2` synthesizes one weekly thesis from one to
  three published Signal editions while preserving every original durable
  source, then adds only decision-useful reviewed organization, Mission area or
  released Defence need paths. Issue preparation remains private and read-only;
  Andrew reviews, tests and manually sends through MailerLite.
- The verified welcome and weekly provider surfaces remain under Andrew's manual
  review and send authority. The revised welcome, weekly issue and optional
  Defence Signal alert templates are reconciled in MailerLite. The alert RSS
  campaign is active with new posts only at `08:00 America/Halifax`; weekly issue
  creation, testing and each audience send remain separate owner checkpoints.
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
perform a fresh signed-out and non-admin signed-in production walkthrough, and
create any explicitly requested campaign collateral from current production.
New features and artificial
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
