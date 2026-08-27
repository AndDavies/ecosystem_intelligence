# True North Map Project Overview

Status: production soft beta and review-first data operation
Owner: Andrew Davies
Last reviewed: 2026-08-27
Public brand: [True North Map](https://truenorthmap.ca)
Canonical runtime: Supabase project `facoactpdckkhciamflk`

## What this project is

True North Map is a Canadian defence capability-discovery platform. It helps people find Canadian defence and dual-use organizations and technologies, understand where they may fit, and decide who is worth speaking with next.

The project is not a procurement portal, an official government directory, a CRM, or a source of classified information. Its public promise is simpler:

> Make Canadian capability visible.

The primary decision path is:

```text
Place, technology, or public need
  -> relevant organizations
  -> technology and evidence
  -> reviewed assessment of where it may help
  -> Working List, export, correction, or introduction request
```

## Current product surface

| Surface | What a visitor can do | Authority boundary |
| --- | --- | --- |
| Guided landing (`/`) | Choose a need, released Public Need, or Mission Area; see how evidence becomes a defensible shortlist; and continue into the right workflow | Cacheable public shell and published records only; account state hydrates client-side |
| Map (`/map`) | Begin with Ask True North or one of four guided lenses—Mission Area, Public Need, Technology Area, or Organization type—then compare synchronized map, result-rail, mobile-sheet, and accessible-list records with visible organization identity | Published records only; lens selections reuse ordinary filter and URL state, and the quota-free guided example does not consume an Ask True North question |
| Organizations and Regions | Browse Canadian organizations by geography and type | Published records only; coverage gaps stay visible |
| Mission Areas / Use Cases (`/missions`) | Start with an operational problem, inspect reviewed technology relationships, and continue into organizations, technologies, Briefs, or a Working List | Mission relationships are reviewed assessments; they are not released Public Needs or procurement direction |
| Organization and technology dossiers | Read an editorial organization profile, inspect capabilities and reviewed Mission Area or Public Need relationships, save the organization, and prepare the next conversation | Facts, reviewed assessments, sources, and optional editorial fields remain distinct and unsupported content is omitted |
| Public Needs (`/demand`) | Browse released public needs, then open each individual Demand Signal to inspect its source passage, desired outcome, potentially relevant technology, and limits | A public source and human verification are required |
| Ask True North | Describe a need in plain language and receive possible fits, with the reason each surfaced, from the live published corpus | AI explores known records; it does not create facts or procurement decisions |
| Guided example | Adjust a search focus and open a defensible example path | Five visitor-adjustable, allowlisted concepts carried into a deterministic, ordinary `/map` URL. The handoff reads only published records and never calls Ask True North or consumes its quota. |
| Defence Brief archive | Read existing reviewed, source-linked Canadian defence explainers | Evergreen URLs remain canonical and indexed, but Briefs are no longer a primary navigation or acquisition product |
| Defence Signals | Read source-linked Canadian defence developments and what they may change; use the public archive and RSS feed whenever a validated edition is published | The internal Daily Signals workflow currently accepts six to eight v1 items, but its scheduler is paused during v2 release sequencing. The tracked v2 release requires exactly eight distinct developments and distinct primary durable source pages, or a typed private `no_publish` run with no edition and therefore no alert; automated interpretation remains separate from the public record, the cited-image and private LinkedIn/X-example gates remain mandatory, and historical v1 editions remain repairable only after existing-run verification. |
| North Signal (`/north-signal`) | Subscribe to the single free email newsletter; its default delivery is the weekly decision brief, with a separately consented new-Defence-Signal alert preference | Supabase records global consent and records stream-specific consent only through the dependency-ordered migrations and compatible application. Andrew reviews, tests and sends every weekly issue. MailerLite's new-posts-only RSS campaign delivers alerts only to separately consented alert-group members after a validated edition is published. |
| Working Lists and exports | Save targets privately and produce useful briefs or reports | Sign-in is required for private lists; public exports use published data |
| Contribution and connection | Claim, correct, suggest, contact, or request a human-brokered introduction | Nothing public changes automatically |
| Admin workspace | Review candidates, publish approved records, maintain dossiers and demand signals, and open any Signals edition in a conventional page editor with source provenance and view-and-copy social examples | Private, owner-only, audited |

## Soft-beta deployment posture

- Every matching published organization remains available to the national map and search through a compact projection. The discovery loader walks deterministic 1,000-row Data API pages instead of relying on one response, so corpus growth does not silently truncate the map. Each bounded page is stored as its own five-minute entry under the separate discovery-cache tag rather than placing the complete corpus in one item that can exceed Vercel's cache limit. Ordinary publication leaves that national snapshot stable; the owner-only maintenance endpoint can invalidate it explicitly. The same evidence-light snapshot powers collection counts, Organizations, Regions, regional routes, and Mission discovery behind streamed page shells; rich evidence remains on bounded dossiers and exports. Public Needs uses a separate source-gated collection index rather than loading the national organization and evidence graph. Rich map cards load in pages of 18 and directory cards remain paginated.
- The guided landing uses a published Kraken Robotics and KATFISH specimen before the worked example. Its map is a lazy fixed provider-resilient view with Kraken selected and all interactions disabled, keeping it distinct from the atlas workspace. The need-entry actions resolve to the anchored Ask True North field, while landing Signals use their own bounded editorial-entry attribution rather than the North Signal acquisition path. Rich dossier geography uses the same reusable map renderer with a fixed OpenStreetMap base rather than a separately generated external image. `/map` reserves its first workspace for the fully interactive national map and uses MapTiler only after a successful style preflight, otherwise falling back to OpenStreetMap: a 380-pixel internally scrolling results rail on desktop, an accessible evidence table below, and an explicit Map/List control plus collapsed, preview, and expanded result-sheet states on mobile. A compact start row keeps the quota-free guided example and exposes four labelled browse lenses—Mission Area, Public Need, Technology Area, and Organization type—with live distinct-organization counts plus quiet suggested questions. Every lens reuses the ordinary atlas loader, so markers, rail records, previews, table rows, applied chips, filters, bounds, export, sharing, return paths and Working List handoffs remain synchronized through one URL state. Current-page result rows use one bounded cached approved-logo lookup, then a deterministic two-letter monogram when no public logo exists; selected rows use Signal Wash and a Signal Yellow rule without changing rank or evidence meaning.
- Public reads retry one transient upstream failure after a short randomized delay. Warm application instances may serve the last safe public snapshot while an upstream dependency recovers; cold instances continue to fail closed. National discovery pages and rich organization dossiers use separate cache tags: ordinary publication invalidates only affected dossier slugs and leaves the compact national projection to its bounded five-minute refresh, preventing a reviewed batch from synchronously rewarming the entire corpus.
- Public dossiers load citations through the selected organizations, technologies, reviewed matches, funding events, and public needs before fetching only their referenced approved evidence and sources. Internal demand-match reviewer rationale never enters the public atlas model, APIs, deterministic search text, or Ask True North catalogue.
- The allowlisted relationship-presentation release candidate changes only how existing reviewed connections are sequenced and explained on `arctic-domain-awareness`, `persistent-uncrewed-underwater-surveillance` and `major-event-and-critical-infrastructure-cyber-defence`, with one Mission Area and two Public Need controls retaining their existing presentation. Its deterministic view-layer helper exposes no score or ranking, leaves canonical relationships and global map order unchanged, and adds no schema, migration, provider, research, review or publication authority. Production acceptance remains conditional on the exact pushed SHA, a Vercel READY production deployment, bounded validation of all six cohort routes and a healthy `/api/health` response.
- The shared Paper-on-Field organization dossier is the approved canonical template for every organization kind. It uses a compact rendered-section index, contextual Mission Area and Public Need relationships, bounded capability rows, source ledger, Working List and introduction actions, and approved-logo/monogram/neutral identity fallback. The eight reviewed pilot organizations and seven reviewed first-wave organizations now use it in production. Rollout remains record-specific: `editorial_profile_version = organization_editorial_profile_v1` activates one reviewed record, while null keeps its legacy profile. The deployed contract advertises v3/v2 support, but research staging, human acceptance, separate Publish and post-publish verification remain mandatory for each organization.
- `/api/health` performs a direct canonical-database availability check for core public record families and reports only healthy or degraded state. The launch validator separately compares health, exact public summary, atlas total, complete marker count, and bounded rich-page size without exposing internal details through the health response.
- Expected expired or reused refresh tokens are cleared and treated as signed out.
- The content security policy explicitly permits only the application and required Supabase, MapTiler, OpenStreetMap, Google, Turnstile, Vercel Analytics and consented Clarity endpoints.
- A daily production job purges expired raw searches after 90 days and detailed workflow events after 30 days.
- `pnpm launch:validate` is the bounded post-deployment release gate. It verifies the exact deployed commit, catalogue health/count consistency, sitemap integrity, RSS and latest-Signals proof, five critical public routes, and only explicitly affected canonical paths. Representative dynamic families are opt-in when a shared renderer, metadata layer, navigation shell, or record-family contract changes. `pnpm launch:audit` is the separate serialized full-sitemap SEO/link/performance inventory; it is owned by the explicit-only local `$tnm-site-assurance` workflow, requires a production acknowledgement and approved reason before any production request, and never runs merely because code was pushed. Visibility refreshes reuse a complete technical crawl for up to 14 days while the sitemap digest and exact URL set remain unchanged.
- `pnpm scale:validate` exercises a 5,000-organization compact projection and the linear-time grid fallback, confirming complete marker preservation while rich cards remain bounded.
- No standing launch kit, screenshot archive, lookbook, or dated audit capture is part of the active project context. Create collateral only on explicit request and validate it against production when created. Runtime brand assets remain under `app/public/brand/`, the live walkthrough remains under `app/public/video/`, and the canonical brand source files remain under `content/brand/`.
- Homepage sharing uses a dedicated, versioned 1,200-by-630-pixel social card
  built for both full-size previews and LinkedIn's compact thumbnail treatment.
  The image carries the Directional N, True North Map identity, capability-
  discovery category and the short promise **Make Canadian capability visible.**
  The longer homepage headline and positioning remain in Open Graph and X page
  metadata. Shared dossier cards and the Signals archive image retain their
  separate record/editorial contracts.
- Shared public navigation uses Inter. Barlow remains a deliberate display face for the logo, hero, editorial headings, and selected brand moments rather than a sitewide interface font.
- Public collection and editorial routes use one `PublicPageShell` header contract:
  breadcrumb, category label, decision-oriented Barlow heading, one concise
  explanation, at most one rectangular primary action plus an optional
  directional link, and a fine closing rule. A strong current record or issue
  may become one featured object below that header; routes do not replace the
  shell with a second full-funnel hero or add decorative filler when no such
  object exists.
- The application runtime is pinned to Node 24. GitHub Actions runs the complete release gate on every change to `main`, CodeQL scans JavaScript and TypeScript, the release gate audits the complete dependency graph, and Dependabot vulnerability alerts, GitHub secret scanning, and push protection remain enabled. Automated dependency-update branches are disabled to preserve the main-only release workflow.
- Middleware now runs only where it has an actual routing or authentication responsibility: the legacy root atlas bridge and private account, collection, contribution, connection, and administrator surfaces. Public catalogue and dossier reads do not pay an unnecessary middleware invocation.
- Repository migration filenames match the applied production Supabase ledger exactly. This reconciliation changed no database object and did not reapply a migration.
- The approved directional-N identity is deployed and indexed in `content/brand/True North Map Brand System.md`; production artwork lives under `app/public/brand/`. North Signal names the editorial briefing, not the logo symbol.
- The shared public language layer uses Source-backed fact, Our assessment,
  Evidence strength, Last reviewed, and Evidence limits. A claim-adjacent limit
  should state **Not established in the reviewed public record:** and name the
  bounded missing point. `unknowns` and Coverage gap remain internal field/state
  names. Collections introduce those definitions
  through one compact accessible disclosure; editorial dossiers keep sources,
  assessment strength and review dates beside the claims they qualify instead
  of repeating evidence-status chrome. Public pages use shared breadcrumbs, and
  the complete trust explanation remains centralized on How It Works and
  Methodology.
- The current public surface contract uses borderless tonal cards, 18-pixel
  editorial corners, smaller 12-to-16-pixel supporting corners, and full pills
  only for compact labels and actions. Editorial Blue `#E8F1F4` organizes
  summaries, sources and navigation without implying evidence strength;
  keyword pills and pill links alone retain a quiet one-pixel neutral edge.
  Hover states refine tone, shadow or link colour without moving cards or
  arrows. This contract now governs Signals and the active route-by-route
  visual reconciliation.
- Organizations, Mission Areas, Public Needs, Signals and North Signal now use
  the same compact task-led collection hierarchy. The organization directory
  moves from a compact published-scope metric strip directly into its filters
  and paginated records, loads approved logos only for the visible page, and
  retains a neutral placeholder when no approved mark exists. Organization
  dossiers use a wide editorial report sequence: identity and actions, operating
  context, current relevance when supported, reviewed contribution paths,
  capabilities, public record, conversation questions, geography, sources and
  next steps. Their non-sticky contents index includes only rendered chapters;
  approved logos lead the compact identity slot, with a monogram and then the
  shared neutral mark as fallbacks. Mission Areas and Public Needs expose one
  clear map action in the header. The Missions collection removes repeated
  explanatory bands and carries its discovery-versus-requirement boundary in
  the header.
  The editorial template does not alter compact discovery or the national map
  payload, and it activates only through reviewed publication.
- Functional discovery collections share one decision-led sequence: concise
  task heading, live scoped counts where useful, the first published records,
  a compact evidence or scope disclosure, and one practical continuation.
  Organizations, Regions, Mission Areas, and Public Needs use whole-card
  keyboard-safe detail links while `/map` retains the existing compact
  map-first workspace, complete national marker projection, synchronized list,
  and accessible table.
- Detail routes share one decision-handoff sequence: understand the published
  record, inspect what supports it, see what remains unknown, follow reviewed
  Mission Area or Public Need relationships, and carry selected organizations,
  capabilities and evidence into a private Working List. Dossier links preserve
  safe map-return context, while region, mission, and Public Need continuations
  use ordinary shareable `/map` filter state.
- Defence Signals is the canonical public proof library for North Signal acquisition.
  Its compact latest-edition feature preserves the cited image and one scarce
  Signal Yellow reading action while allowing the archive to enter the first
  desktop viewport. North Signal uses the same shell, then one live `THIS WEEK`
  proof band and an early Paper signup surface. Its interrupt dialog is a
  compact artwork-free capture instrument rather than a duplicate landing page;
  on `/north-signal`, the standing signup action focuses the page form instead
  of opening another funnel. Its archive and edition pages retain the original
  durable sources behind each automated read and provide the sample path used by
  the weekly brief. Existing
  Defence Briefs remain an indexed evergreen archive and may appear only as
  contextual record support; they are removed from primary navigation,
  homepage promotion, signup promotion and new outreach.
- The supporting public journey now uses the same outcome-led language as the
  landing and profiles. How It Works explains the path from a question to
  capability, evidence, a private Working List, and a next conversation through
  one open five-step sequence whose first step is the clear starting action;
  About
  uses the canonical founder story and wording; Methodology retains the full
  evidence and review explanation; and contributions promise private human
  review before any public change. Authentication, consent, and public-shell
  caching are unchanged.
- Shared public system states now use the same plain-language contract as the
  product: literal fixed-geometry loading shells, scoped empty states, a
  retry-or-Map error path, and a noindex 404 with Map and homepage recovery.
  Supporting trust pages use Home breadcrumbs and current social cards, while
  collection and dossier routes retain their canonical Map or record parent.
- The cross-system change and regression contract in `context/governance/Cross-System Change And Regression Contract.md` now governs material product, data, research, visibility, brand, analytics, and release work.
- The active security and resilience backlog, accepted risks, and repair evidence are maintained in `context/governance/Security And Reliability Remediation Log.md`.
- The Codex control plane now has one concise root operating map, one governance index, and one system registry. Private operator skills remain local and ignored; internal research stages are explicit-only, while autonomous research, Daily Signals, North Signal, and visibility remain the four operator-facing workflows.

## August 13 reliability, dossier, UX and growth release

Production now contains the coordinated reliability, dossier, public-UX,
research-contract and North Signal measurement release. The ordered migrations
have been applied, the compatible application advertises pipeline 1.7.3, and
the public profile-data guard and bounded citation reader are active. No
research candidate was automatically accepted or published, and no MailerLite
campaign, contact import, outreach message or send was part of the release.

- The dossier projection keeps its compatibility `citations` member empty and
  removes the nested citation aggregate. The application first admits the
  published organization and reviewed child graph, then hydrates only approved
  field citations, evidence and sources referenced by those IDs. A new
  exact-deployment cold-dossier gate uses a short-lived, nonce-bound signed
  request and selects at least ten activated dossiers across high-citation,
  sparse, recently updated and coverage-fill cases and
  verifies the anonymous view, public API, route stream, metadata, public
  citation trail, forbidden-lineage absence and bounded latency. Local tests do
  not substitute for that post-deployment gate.
- Public organization serialization uses an explicit allowlist for role-specific
  `profile_data` plus approved public contact fields. Internal keys
  `reviewed_candidate_id`, `reviewed_by`, `research_schema_version` and
  `ingestion_batch_id` remain private workflow lineage. The cleanup migration
  removed those keys from existing public JSON, guards future writes
  and cannot reconstruct removed values on rollback; canonical lineage remains
  in `candidate_changes`, `review_decisions`, `research_runs` and
  `audit_events`.
- Launch validation additionally treats RSC error digests, unresolved streamed
  loading shells and dynamic-metadata failures as operational blockers. The
  separate full audit normalizes and visits each discovered same-origin
  navigation target once, retains referrers and redirects, and probes only
  external links explicitly marked as durable public sources. Confirmed broken
  sources block; bot restrictions and transport uncertainty are reported
  separately. The audit remains serialized, paced, locked, health-aware and
  bounded, and is still reserved for its explicit broad-assurance triggers.
- The shared public shell has one public navigation and footer contract, mobile
  active-route and focus behaviour, grouped Explore / Intelligence / Trust &
  About footer paths, a **Defence Signals** editorial link, and a persistent
  **Subscribe to the free newsletter** North Signal action. Defence Signals is
  publication-driven public proof; North Signal is one email newsletter with a
  weekly default and optional separately consented edition alerts. The
  public trust signature is **Public sources cited · Facts and assessments kept
  separate · Human review**. Product status may remain soft beta, but `Public Beta` is not
  permanent identity or social-card branding.
- Every published organization route now targets the same evidence-bounded
  dossier component rather than maintaining a separate legacy visual family.
  Capability detail follows the same decision sequence: what it enables,
  evidence of maturity, reviewed Mission Area and Public Need contribution,
  public programs and contracts with caveats, a source ledger, explicit
  evidence limits and a next-conversation handoff. Unsupported content remains
  omitted and the compact national discovery projection is unchanged.
- The deployed pipeline version is `tnm-research-pipeline/1.7.3`. It adds an optional 80-to-1,200-character
  `executive_relevance_summary`: a human-reviewed True North Map assessment
  synthesized only from already supported public fields and reviewed
  relationships. A non-null summary requires mapped public evidence; Admin
  Review labels it as a proposed decision snapshot, acceptance remains private,
  and the separate selected-set Publish checkpoint remains mandatory.
- North Signal gains one bounded `newsletter_cta_click` stage between landing or
  content exposure and the existing form events. Raw events keep the governed
  30-day retention; the private marketing scorecard excludes explicit QA,
  staff, test and internal cohorts, `/dev/` paths, and QA-marked attribution
  without deleting or rewriting the underlying ledger. Email addresses remain
  in the affirmative-consent ledger only.

- The August 26-27 North Signal unification release is authorized and uses the
  ordinary exact-SHA production acceptance contract.
  It adds private service-role preference and withdrawal history, delivery-run
  and aggregate campaign-metric records; atomically records consent and the
  `newsletter_success` event; reports distinct non-QA session funnels over
  7/14/28 days without a 5,000-row read cap; and separates Search Console, GA4,
  first-party behaviour, authoritative consent and MailerLite delivery
  denominators. Its two versioned migrations and active-subscriber weekly-only
  backfill support the optional-alert UI, provider groups, Preference Center,
  RSS campaign and email-delivery reconciliation. The provider side is
  reconciled on the existing Comfort plan at no
  incremental cost; production application acceptance still requires the exact
  ordered migrations, READY deployment and live reconciliation. Existing active
  subscribers receive no alert consent by backfill.

The completed migration order was fail-closed:
`20260813081430_add_executive_relevance_summary.sql`,
`20260813081500_add_newsletter_cta_click_event.sql`,
`20260813081542_remove_dossier_view_citation_aggregate.sql`, then
`20260813083552_sanitize_public_organization_profile_data.sql`. The first two
additive contracts were applied before the compatible application; the citation
split and timestamp-preserving public-JSON cleanup followed in a second
checkpoint. The cleanup intersected no pending or approved refresh candidates,
preserved canonical baselines and removed every forbidden public lineage key.
The live ledger matches the repository. The prior view-dependent application is
not a valid rollback target after the citation split; repair forward instead.
Deployment does not grant research acceptance, publication or campaign authority.

## System architecture and source of truth

| Layer | Current responsibility | Must not do |
| --- | --- | --- |
| `app/` | Next.js application, public and private routes, server actions, tests, deployment migrations, runtime integrations | Hold an alternate corpus or publish unreviewed research |
| Supabase production | Sole canonical runtime for records, taxonomy, evidence, review state, auth, storage, and publication | Accept unreviewed agent output as public data |
| `research/ingestion/` | Immutable typed lineage for collection plans, claim ledgers, signals, leads, candidates, reviews, staging exports, and runs | Act as a runtime data source or automatic promotion channel |
| `research/signals/local/` | Ignored daily Signals packets, source ledgers, and run reports | Enter Git, replace durable sources, or become a second core corpus |
| `.agents/skills/` | Ignored local operator skills for research and visibility | Enter the public repository, replace the live schema, or gain publication authority |
| `context/governance/` | Product decisions, operating contracts, release and workflow documentation | Store candidate records or code-generated output |
| `content/` | Canonical brand sources, active email copy, and durable editorial inputs | Accumulate unsolicited screenshots, dated launch packets, or become a source of public record truth |
| Private Defence Wiki | Private source packets and evergreen synthesis in Andrew's Obsidian vault | Feed raw private material directly to public routes |

Production Supabase, not local seed data, CSV files, research artifacts, remembered counts, or a prior deployment, is the source of truth. Exact corpus and queue totals must always be read live.

## Evidence, review, and publication flow

```text
Durable public source
  -> source lead and deterministic qualification
  -> enriched organization, demand, or refresh candidate
  -> field evidence, citations, duplicate and taxonomy validation
  -> private Admin Review
  -> human edit and explicit approval
  -> separate Publish checkpoint
  -> canonical Supabase record and route revalidation
```

Research agents may find leads, assemble candidate changes, suggest a technology-to-demand connection, and explain the evidence. They may not publish a public organization, capability, Demand Signal, demand match, source, citation, or media asset.

The complete research design uses seven stages: claim-led coordinator, signal refresh when applicable, source discovery, candidate construction, evidence mapping, official-logo disposition for organization candidates, and deterministic stewardship. Every new run prepares an intelligence-requirement collection plan, searches both outward from entities and inward from Mission Areas and published Public Needs, records atomic leaf-field claims and conflicts, decomposes independently reviewable capabilities, completes dossier coverage, and produces a compact five-part decision chain covering coverage value, evidence, conservative Mission/Public Need relevance, uncertainty, and one bounded reviewer action before the ordinary Admin Review intake. Pipeline 1.7 makes that reviewer usefulness a complete same-run, record-specific gate: exact target outcomes, changed-field and evidence anchors, recovery lineage, and the full private staging envelope must agree before the tracked importer can call the guarded intake RPC. A free-text disposition, downgraded staging version, direct connector call, or altered run/candidate envelope is not an approved staging path. `organization_bundle_v3` and `organization_refresh_bundle_v2` carry the normalized editorial profile, participation, relationship, funding and capability fields with per-leaf evidence; they do not bypass Review or Publish. New refresh runs also retain their dispositioned signal batch and real lifecycle duration. Public Need hypotheses remain private Derived Reads until a reviewed published capability enters the existing demand-matching workflow. The canonical skill implementations remain intentionally local and ignored. A clean public checkout must still contain the compatible executable schema, commands, migrations, tests, and deployed Admin Review and Publish support before a skill can stage its output. The intake preflight checks that canonical deployed contract independently of local browser configuration. This distinction prevents local capability from being mistaken for deployed authority.

Refresh intake remains a security-invoker path. The trusted `service_role`
worker may execute the public staging RPC and the private immutable baseline
parser invoked by its validation trigger. No public or signed-in browser role
may execute either intake path, and this narrow dependency grants no review,
approval, publication, or canonical-record authority.

Demand Signals have an additional public-source gate. A published signal needs an HTTPS canonical released source, issuing authority, source locator, relevant excerpt, at least one public problem statement, a reviewer confirmation, and linked public evidence. Public demand pages and demand-match suggestions exclude a signal that no longer satisfies that gate; it is retained privately for completion rather than deleted.

## Terms and language map

This table is the shared translation layer. Database and editorial terms remain precise where useful; public surfaces use the language in the middle column.

| Operational or data term | Public label | Meaning and use |
| --- | --- | --- |
| Ecosystem Intelligence | True North Map | The project category remains Ecosystem Intelligence; True North Map is the public product and brand. |
| Atlas | Map / Explore the ecosystem | The national, map-first discovery experience. “Atlas” remains acceptable in technical or historical context, but the public navigation label is “Map.” |
| Demand collection | Public Needs | The public collection at `/demand`. It groups released needs without changing their canonical URLs or the precise name of an individual record. |
| Individual released need | Demand Signal | One source-gated public record issued through a released government, armed-force, program, or allied source. |
| `organization` | Organization, or Company where applicable | One canonical entity record. It can be a company, program, funder, research centre, accelerator, incubator, ecosystem organization, or government innovation office. |
| `entity_kind` | Company, Accelerator, Incubator, Research and test centre, Investor or funder, Ecosystem organization, Government innovation office | The public organization categories used in filters and directories. |
| `capability` | Technology, offering, program, facilities and expertise, or investment focus | A reviewed thing an organization provides. The wording varies by organization type so the page says what a visitor is actually looking at. |
| Capability dossier | Technology profile | The dedicated page for a named technology or offering. |
| `technical_domain` | Technology area | A landscape category such as sensing, autonomy, maritime systems, or advanced materials. |
| `mission_area` | Mission area or use case | The operational problem or decision context that a technology can support. |
| `ecosystem_cluster` | Related group | A reviewed subgroup of capabilities. The UI explains whether the grouping is geographic, technical, program-based, or editorial. |
| `location` and geographic confidence | Location accuracy | Exact, city-level, region-level, or not verified. It states the precision of map placement without implying an exact facility address. |
| `demand_source` | Demand Signal | A released public source that states a public need. It is never an inferred need, a classified requirement, or a guarantee of procurement. |
| `demand_requirement` | What needs to change / What success looks like | A specific public problem statement and intended outcome drawn from a Demand Signal. |
| `demand_issuer` | Issuing authority | The government, program, armed force, or allied body that released the public source. |
| `source_evidence_snippet_id`, locator, and excerpt | Where this public need comes from | The supporting passage and location in the released source that makes a Demand Signal inspectable. |
| `capability_demand_match` | Where this technology may help | A reviewed relationship between a technology and a released public need. It does not imply eligibility, endorsement, customer interest, procurement, or classified demand. |
| `public_source_alignment` | Connected by a public source | A connection that is directly supported by a released source. |
| `derived` match | Our assessment / Reviewed connection | A human-reviewed interpretation based on current public evidence, clearly separate from a direct source fact. |
| `source` | Public source | The durable canonical page, document, or official record behind a claim. |
| `evidence_snippet` | Relevant source passage | The excerpt and locator that show where a public source supports a claim. |
| `field_citation` | What supports this profile / assessment | The connection from a specific public field or assessment to its source passage. |
| Source-backed fact | Source-backed fact | What an organization, issuer, or released source actually says. It is not the product's interpretation. |
| `source_confidence` | Evidence strength | Strong, moderate, or limited. This describes the support available in public sources, not the quality of an organization. |
| `freshness` | Last reviewed / source freshness | Whether a record is current, due for review, or stale. |
| Coverage gap / `unknowns` | Evidence limits | The internal semantic state for missing, thin, stale, conflicting or unverified information. Public copy states the exact boundary, preferably **Not established in the reviewed public record:**, and never treats the absence as negative evidence about an organization. |
| `candidate_change` | Under review | A private proposed new record or refresh. It is not published data. |
| Source lead | Research lead | A private discovery item that still needs qualification and evidence. |
| `research_run` | Research run | Private audit metadata for an ingestion activity. It is not an approval step or public record. |
| OSINT collection plan | Research plan | Private run instructions covering intelligence questions, aliases, source lanes, language posture, evidence thresholds, and stop conditions. |
| Claim ledger and dossier coverage | Research evidence lineage | Private atomic claims, conflicts, supersession, field targets, and coverage states. It is not a public feed or another review queue. |
| `review_decision` | Review decision | Private editor acceptance, deferral, rejection, or publish decision with an audit trail. |
| Publish checkpoint / promotion | Publish | The explicit human action that changes canonical public data after review. |
| `saved_collections` | Working Lists | A user's private shortlist of organizations and technologies for follow-up. |
| Collection lookbook | Working List brief | A private export of a saved Working List. |
| Connection request | Request an introduction | A private request for Andrew to consider facilitating a conversation. It never sends an automatic introduction. |
| Profile claim, correction, new-organization submission | Claim, correct, or suggest a profile | Public participation paths that create review work only. |
| Ask True North | Ask True North | Constrained AI-assisted discovery over the current published corpus. It exposes uncertainty and falls back to deterministic results when needed. |
| Assistant fit level | Strong fit, plausible fit, adjacent fit | A ranking aid for known records. It is neither a source claim nor a procurement recommendation. |
| Defence Brief | Canadian Defence Brief | A reviewed, source-linked public explainer or time-bounded analysis. |
| Source-linked editorial stream | Defence Signals | A publication-driven edition at a descriptive, immutable `/signals/[slug]` URL. The internal Daily Signals scheduler is paused during v2 release sequencing. Production v1 accepts six to eight distinct items. The tracked v2 release requires exactly eight distinct developments with distinct primary durable source pages or a typed private `no_publish` run that creates no edition or email alert. Each item labels the public fact, automated read, evidence limits, and next step; the internal packet may retain an `unknowns` field. The cited-article image and private current-edition LinkedIn/X-example gates remain mandatory, and historical v1 editions remain repairable only after existing-run verification. |
| `Derived Read` in a Brief | True North Map assessment / Derived Read | A labelled interpretation in editorial content. It must remain distinct from the underlying factual record. |
| Global Source Book | Global Source Book | A maintained private inventory of durable source starting points used to find research leads. |
| Private Defence Wiki | Private knowledge base | Andrew's private raw-packet and evergreen-synthesis workspace. Public briefs may be derived from reviewed material, but raw packets and private notes never become runtime content. |
| `media_assets` and `atlas-public-media` | Approved organization logo or public media | Provenance-backed approved media. Organization logos are only displayed when approved and published. |
| Canadian defence capability discovery | Product category | The concise public category describing the product without implying procurement authority or a generic AI platform. |
| Directional N symbol | True North Map identity | The compact angular N and separated Signal Yellow north corner used in the logo, favicon, social assets, and navigation. |
| Legacy “North Signal mark” asset name | Directional N symbol | Some repository filenames retain `north-signal-mark` for compatibility. Public and governance language calls the symbol the Directional N so it is not confused with the newsletter. |
| Email newsletter | North Signal | The single free email product. Its default weekly briefing synthesizes one important pattern from one to three published Defence Signals, then connects it to reviewed Canadian capability, released Public Needs and Mission Areas. A subscriber may later choose weekly only, optional new-Defence-Signal alerts only, or both; clearing both is global unsubscribe. Each preference has independent consent and withdrawal history. |
| Public Beta | Soft-beta release state | The product is live and publicly usable while coverage, content cadence, and workflows continue to be tested and improved. It is a status label, not part of the permanent logo or a disclaimer for weak evidence. |
| Compact discovery projection | Map and directory results | The evidence-light public read used to keep national discovery complete and responsive. Rich evidence loads only after a visitor opens a record. |
| Source verification gate | Released-source verification | The demand-specific rule that prevents an unsourced summary from becoming a public Demand Signal. |
| RLS and explicit Data API grants | Private security controls | Internal database controls. They protect drafts, user data, and staff actions; they are not public marketing language. |

## Public trust boundary

Every public surface should make this distinction legible:

1. **Source-backed fact**: what a released source or an organization's official material says.
2. **True North Map assessment**: a reviewed interpretation of possible relevance.
3. **Evidence limits**: the specific boundary of what the reviewed public record does not establish. Use **Not established in the reviewed public record:** when a claim-adjacent construction is needed. The underlying internal state may remain `unknowns` or Coverage gap.

The standard caveat for Demand Signals and technology connections is: a reviewed public-source assessment is not procurement eligibility, endorsement, customer interest, or classified demand.

The public message system is:

- Brand promise: **Make Canadian capability visible.**
- Homepage headline: **Canada is building more than most people can see.**
- Category: **Canadian defence capability discovery**
- Positioning: **True North Map helps people find Canadian defence and dual-use organizations and technologies, understand where they may fit, and decide who is worth speaking with next.**
- Journey: **See who can help. Understand why they matter. Start the right conversation.**
- Founder thesis: **The capability was here. The shared picture was not.**
- Trust: **Public sources cited · Facts and assessments kept separate · Human review**

Outcome language leads public discovery and acquisition. Evidence language
remains precise and prominent where users inspect facts, assessments, source
quality, uncertainty, research, review, legal boundaries, or methodology. The
campaign offer **Bring one real question. See what Canada can do.** is reserved
for Andrew-approved outreach and is not permanent product-page copy.

## Operational integrations

| Service | Role | Boundary |
| --- | --- | --- |
| Vercel | Application hosting, deployment, analytics, DNS | Server secrets stay out of the client and repository. |
| Supabase | Canonical data, RLS, Auth, Storage, audit, review workflow | Production source of truth. New exposed tables require explicit grants and RLS. |
| MapLibre / MapTiler / OpenStreetMap | Map presentation with provider preflight and fallback | Coordinates remain standard and portable; no provider is a canonical-data authority. |
| OpenAI Responses API | Ask True North structured ranking and summary using `gpt-5.6-luna` by default | No web browsing, second corpus, automatic publication, or uncited fact creation. The model remains server-configurable without changing the published corpus boundary. |
| Zoho Mail | Monitored human correspondence | `andrew@truenorthmap.ca` and operational aliases. |
| MailerLite | North Signal delivery | Current production Supabase remains the global consent ledger. After the approved migrations and application are released, it also becomes the stream-specific ledger; MailerLite mirrors only separately approved lifecycle and delivery groups and is not an auth channel or consent authority. |
| Resend through Supabase SMTP | Branded sign-in and security email | Transactional authentication only. |
| Private visibility workflow | Configured-provider SEO, GEO, AEO, technical-health, search-demand and earned-link intelligence | Every configured provider response and public sitemap route is collected locally; optional-unconfigured APIs remain visible unknowns without failing refreshes, raw providers and reports remain ignored locally, and recommendations have no publication or outreach authority. |

## Navigation and security model

- Primary public navigation is Map, Organizations, Missions, Public Needs, Defence Signals, How It Works, and About, with **Subscribe to the free newsletter** as the standing North Signal action. The landing page is a guided entry point; `/map` remains the canonical atlas and Ask True North workspace.
- Public browsing, profiles, sources, Defence Briefs, and eligible exports are open.
- Google OAuth and passwordless email are available for private actions such as Working Lists, claims, corrections, connection requests, and account management.
- The admin workspace is not linked publicly, is `noindex`, and fails closed to the designated administrator identity, exact email, and controlled application metadata.
- Public sign-in never grants staff access. Users can remove their own private profile data after recent reauthentication; the administrator account cannot self-delete.
- Raw uploads, internal correspondence, private evidence, draft candidates, research output, and private wiki material remain inaccessible to public routes.

## Release and validation contract

Run the release check from the repository root:

```bash
pnpm release:validate
```

It covers tests, lint, typed research validation, production coverage checks, and the production build. Browser QA must cover the core public routes, protected review routes, map/list accessibility, public sources, Demand Signals, Ask True North fallback, exports, contribution, connection, and account journeys.

For any material data change, verify the affected public profile, capability, demand page, index, sitemap, and source links after human publication. A green candidate file, accepted review item, or successful research run is never evidence of public publication by itself.

For all other changes, use the impact and validation matrix in `Cross-System Change And Regression Contract.md`. It requires task-start context review, affected-system mapping, scoped checks during implementation, release-level regression before production, post-deployment smoke tests, and an explicit record of checks that were not run.

## Current review findings

1. The architecture is coherent: runtime code, governance, research lineage, private knowledge synthesis, and public content have distinct homes and publication boundaries.
2. The public language layer now centralizes the most sensitive distinctions: fact, assessment, coverage gap, evidence strength, and technology-to-demand relevance. New UI work should extend this presentation layer rather than reintroduce raw database language.
3. The Demand Signal source gate is enforced in the editor, publication function, public loaders, matching logic, and RLS. This is deliberate defence in depth.
4. Production, the tracked application, validated research lineage, and current governance are reconciled through explicit scoped commits. Private skills, credentials, raw provider material, and ignored local outputs remain outside Git; agents must still inspect the exact worktree and must never use `git add .`.
5. Static documentation is a guide, not a counter. Read production for live corpus counts, queue state, subscriber state, and coverage before public statements or release decisions.
6. The strategic Mission Area / Use Case entry point has dedicated public browsing and detail routes. The next release work is operational: monitor performance and count consistency, triage live queues, keep Daily Signals and North Signal useful, and address the active security and reliability register before broader promotion.

## Deliberately out of scope

- Paid tiers, subscriptions, and monetization.
- French localization in the current release.
- CRM synchronization, sales sequencing, personal relationship history, or automated introductions.
- Self-service public publication.
- Continuous autonomous publication.
- Classified, restricted, or inferred government demand.

## Documents of record

| Document | Use it for |
| --- | --- |
| `AGENTS.md` | Concise task-start operating map and immutable safety boundaries |
| `context/governance/INDEX.md` | Single entrance to active contracts, runbooks, deferred plans, and history |
| `context/governance/PRD.md` | Current product requirements and user journeys |
| `context/governance/Project Status.md` | Current operating posture and live-workflow notes; confirm time-sensitive details in production |
| `context/governance/Admin Workflow And Data Contract.md` | Review, publication, demand, and editorial safety rules |
| `context/governance/Autonomous Ecosystem Research Pipeline.md` | Research orchestration and handoffs |
| `context/governance/Skills And Automation Map.md` | Complete system registry for workflows, stages, schedules, contracts, providers, authority, and owners |
| `context/governance/Cross-System Change And Regression Contract.md` | Required cross-system impact review and regression levels |
| `context/governance/Development Log.md` | Chronological implementation and operating history |
| `content/brand/True North Map Brand System.md` | Current deployed identity assets, copy, colours, typography, imagery rules, and brand checks |
| `app/src/lib/research/pipeline-schema.ts` | Executable research contract when code and prose differ |
| `app/src/lib/atlas/presentation.ts` | Canonical public labels for recurring evidence and assessment language |
| `app/supabase/migrations/` | Versioned production schema and policy history |
