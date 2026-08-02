# True North Map Project Overview

Status: production soft beta and review-first data operation
Last reviewed: 2026-08-02
Public brand: [True North Map](https://truenorthmap.ca)
Canonical runtime: Supabase project `facoactpdckkhciamflk`

## What this project is

True North Map is an independent, evidence-led discovery platform that helps people find Canadian defence and dual-use capability, understand where it may fit, and move into better-informed conversations.

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
| Map (`/map`) | Explore Canada, filter the visible map, search in plain language, compare the current viewport, and open dossiers | Published records only |
| Organizations and Regions | Browse Canadian organizations by geography and type | Published records only; coverage gaps stay visible |
| Mission Areas / Use Cases (`/missions`) | Start with an operational problem, inspect reviewed technology relationships, and continue into organizations, technologies, Briefs, or a Working List | Mission relationships are reviewed assessments; they are not released Public Needs or procurement direction |
| Organization and technology dossiers | See what an organization offers, public sources, reviewed technology, and possible relevance | Facts and assessments are labelled separately |
| Public Needs (`/demand`) | Browse released public needs, then open each individual Demand Signal to inspect its source passage, desired outcome, potentially relevant technology, and limits | A public source and human verification are required |
| Ask True North | Ask a plain-language question and receive bounded results from the live published corpus | AI explores known records; it does not create facts or procurement decisions |
| Guided example focus | Search focus | Five visitor-adjustable, allowlisted concepts carried into a deterministic, ordinary `/map` URL. The handoff reads only published records and never calls Ask True North or consumes its quota. |
| Defence Briefs | Read reviewed, source-linked Canadian defence explainers | Editorial synthesis is distinct from raw private wiki material |
| North Signal | Subscribe to a concise weekly briefing about newly mapped capability, released public needs, reviewed connections, and defence developments worth following | Supabase records consent; MailerLite delivers; Andrew reviews and sends every issue |
| Working Lists and exports | Save targets privately and produce useful briefs or reports | Sign-in is required for private lists; public exports use published data |
| Contribution and connection | Claim, correct, suggest, contact, or request a human-brokered introduction | Nothing public changes automatically |
| Admin workspace | Review candidates, publish approved records, maintain dossiers, demand signals, evidence, logos, coverage, and feedback | Private, owner-only, audited |

## Soft-beta deployment posture

- Every matching published organization remains available to the national map and search through a compact projection. The discovery loader walks deterministic 1,000-row Data API pages instead of relying on one response, so corpus growth does not silently truncate the map. The same evidence-light snapshot powers collection counts, Organizations, Regions, regional routes, and Mission discovery behind streamed page shells; rich evidence remains on bounded dossiers and exports. Public Needs uses a separate source-gated collection index rather than loading the national organization and evidence graph. Rich map cards load in pages of 18 and directory cards remain paginated.
- Public reads retry one transient upstream failure. Warm application instances may serve the last safe public snapshot while an upstream dependency recovers; cold instances continue to fail closed.
- Public dossiers load citations through the selected organizations, technologies, reviewed matches, funding events, and public needs before fetching only their referenced approved evidence and sources. Internal demand-match reviewer rationale never enters the public atlas model, APIs, deterministic search text, or Ask True North catalogue.
- `/api/health` performs a direct canonical-database availability check for core public record families and reports only healthy or degraded state. The launch validator separately compares health, exact public summary, atlas total, complete marker count, and bounded rich-page size without exposing internal details through the health response.
- Expected expired or reused refresh tokens are cleared and treated as signed out.
- The content security policy explicitly permits only the application and required Supabase, MapTiler, OpenStreetMap, Google, Turnstile, Vercel Analytics and consented Clarity endpoints.
- A daily production job purges expired raw searches after 90 days and detailed workflow events after 30 days.
- `pnpm launch:validate` performs a deliberately low-rate crawl of every canonical public sitemap URL, checking status, metadata, canonical URLs, social metadata, structured data, image accessibility attributes, direct operational probes, and visible recovered-retry warnings without creating a load test.
- `pnpm scale:validate` exercises a 5,000-organization compact projection and the linear-time grid fallback, confirming complete marker preservation while rich cards remain bounded.
- The current launch kit lives under `content/launch/broader-public-beta-2026-08/`; older Phase 2 screenshots and demo material are historical assets.
- The approved directional-N identity is deployed and indexed in `content/brand/True North Map Brand System.md`; production artwork lives under `app/public/brand/`. North Signal names the editorial briefing, not the logo symbol.
- The cross-system change and regression contract in `context/governance/Cross-System Change And Regression Contract.md` now governs material product, data, research, visibility, brand, analytics, and release work.
- The active security and resilience backlog, accepted risks, and repair evidence are maintained in `context/governance/Security And Reliability Remediation Log.md`.

## System architecture and source of truth

| Layer | Current responsibility | Must not do |
| --- | --- | --- |
| `app/` | Next.js application, public and private routes, server actions, tests, deployment migrations, runtime integrations | Hold an alternate corpus or publish unreviewed research |
| Supabase production | Sole canonical runtime for records, taxonomy, evidence, review state, auth, storage, and publication | Accept unreviewed agent output as public data |
| `research/ingestion/` | Immutable typed lineage for collection plans, claim ledgers, signals, leads, candidates, reviews, staging exports, and runs | Act as a runtime data source or automatic promotion channel |
| `.agents/skills/` | Ignored local operator skills for research and visibility | Enter the public repository, replace the live schema, or gain publication authority |
| `context/governance/` | Product decisions, operating contracts, release and workflow documentation | Store candidate records or code-generated output |
| `content/` | Launch, campaign, and non-runtime collateral | Become a source of public record truth |
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

The complete research design uses seven stages: claim-led coordinator, signal refresh when applicable, source discovery, candidate construction, evidence mapping, official-logo disposition for organization candidates, and deterministic stewardship. Every new run prepares an intelligence-requirement collection plan, records atomic claims and conflicts, and completes dossier coverage before the ordinary Admin Review intake. The canonical skill implementations remain intentionally local and ignored. A clean public checkout must still contain the compatible executable schema, commands, migrations, tests, and deployed Admin Review and Publish support before a skill can stage its output. This distinction prevents local capability from being mistaken for deployed authority.

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
| Coverage gap | Coverage gap / What remains unknown | A visible limit: missing, thin, stale, or unverified information. It is not negative evidence about an organization. |
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
| `Derived Read` in a Brief | True North Map assessment / Derived Read | A labelled interpretation in editorial content. It must remain distinct from the underlying factual record. |
| Global Source Book | Global Source Book | A maintained private inventory of durable source starting points used to find research leads. |
| Private Defence Wiki | Private knowledge base | Andrew's private raw-packet and evergreen-synthesis workspace. Public briefs may be derived from reviewed material, but raw packets and private notes never become runtime content. |
| `media_assets` and `atlas-public-media` | Approved organization logo or public media | Provenance-backed approved media. Organization logos are only displayed when approved and published. |
| Evidence-led ecosystem discovery | Product category | The concise public category describing the product without implying procurement authority or a generic AI platform. |
| Directional N symbol | True North Map identity | The compact angular N and separated Signal Yellow north corner used in the logo, favicon, social assets, and navigation. |
| Legacy “North Signal mark” asset name | Directional N symbol | Some repository filenames retain `north-signal-mark` for compatibility. Public and governance language calls the symbol the Directional N so it is not confused with the newsletter. |
| Update newsletter | North Signal | A concise weekly briefing on newly mapped Canadian capabilities, released public needs, evidence-linked fits, and defence developments worth following. It is consent-backed and delivered through MailerLite. |
| Public Beta | Soft-beta release state | The product is live and publicly usable while coverage, content cadence, and workflows continue to be tested and improved. It is a status label, not part of the permanent logo or a disclaimer for weak evidence. |
| Compact discovery projection | Map and directory results | The evidence-light public read used to keep national discovery complete and responsive. Rich evidence loads only after a visitor opens a record. |
| Source verification gate | Released-source verification | The demand-specific rule that prevents an unsourced summary from becoming a public Demand Signal. |
| RLS and explicit Data API grants | Private security controls | Internal database controls. They protect drafts, user data, and staff actions; they are not public marketing language. |

## Public trust boundary

Every public surface should make this distinction legible:

1. **Source-backed fact**: what a released source or an organization's official material says.
2. **True North Map assessment**: a reviewed interpretation of possible relevance.
3. **Coverage gap**: what is missing, unverified, thin, or no longer current.

The standard caveat for Demand Signals and technology connections is: a reviewed public-source assessment is not procurement eligibility, endorsement, customer interest, or classified demand.

The public message system is:

- Brand promise: **Make Canadian capability visible.**
- Homepage headline: **Canada is building more than most people can see.**
- Category: **Evidence-led ecosystem discovery**
- Journey: **Follow the evidence. Find the fit. Start the right conversation.**
- Trust: **Reviewed public evidence · Transparent gaps · Human review**

## Operational integrations

| Service | Role | Boundary |
| --- | --- | --- |
| Vercel | Application hosting, deployment, analytics, DNS | Server secrets stay out of the client and repository. |
| Supabase | Canonical data, RLS, Auth, Storage, audit, review workflow | Production source of truth. New exposed tables require explicit grants and RLS. |
| MapTiler / MapLibre | Map presentation | Coordinates remain standard and portable. |
| OpenAI Responses API | Ask True North structured ranking and summary using `gpt-5.6-luna` by default | No web browsing, second corpus, automatic publication, or uncited fact creation. The model remains server-configurable without changing the published corpus boundary. |
| Zoho Mail | Monitored human correspondence | `andrew@truenorthmap.ca` and operational aliases. |
| MailerLite | Consent-backed updates and newsletters | Supabase remains the consent ledger; campaigns are not an auth channel. |
| Resend through Supabase SMTP | Branded sign-in and security email | Transactional authentication only. |
| Private visibility workflow | Read-only SEO, GEO, AEO, technical-health, search-demand and earned-link intelligence | Raw providers and reports remain ignored locally; recommendations have no publication or outreach authority. |

## Navigation and security model

- Primary public navigation is Map, Organizations, Missions, Public Needs, Defence Briefs, How It Works, and About. The landing page is a guided entry point; `/map` remains the canonical atlas and Ask True North workspace.
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
4. The tracked production application and `origin/main` are aligned. The primary worktree also contains intentional uncommitted research, visibility, source-book, and lookbook work. Those artifacts are separate from the deployed public application and must never be swept into a release with `git add .`.
5. Static documentation is a guide, not a counter. Read production for live corpus counts, queue state, subscriber state, and coverage before public statements or release decisions.
6. The strategic Mission Area / Use Case entry point now has dedicated public browsing and detail routes. The next release question is operational rather than cosmetic: verify the current candidate in production, monitor field performance and count consistency, triage live queues, and establish a repeatable Brief and North Signal cadence before broad promotion.

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
| `AGENTS.md` | Operating contract, non-goals, evidence rules, canonical skills, and change log |
| `context/governance/PRD.md` | Current product requirements and user journeys |
| `context/governance/Project Status.md` | Current operating posture and live-workflow notes; confirm time-sensitive details in production |
| `context/governance/Admin Workflow And Data Contract.md` | Review, publication, demand, and editorial safety rules |
| `context/governance/Autonomous Ecosystem Research Pipeline.md` | Research orchestration and handoffs |
| `context/governance/Skills And Automation Map.md` | Research-skill chain, visibility boundary, operating modes, and scheduled operations |
| `context/governance/Cross-System Change And Regression Contract.md` | Required cross-system impact review and regression levels |
| `content/brand/True North Map Brand System.md` | Current deployed identity assets, copy, colours, typography, imagery rules, and brand checks |
| `app/src/lib/research/pipeline-schema.ts` | Executable research contract when code and prose differ |
| `app/src/lib/atlas/presentation.ts` | Canonical public labels for recurring evidence and assessment language |
| `app/supabase/migrations/` | Versioned production schema and policy history |
