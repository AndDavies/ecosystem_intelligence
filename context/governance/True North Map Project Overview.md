# True North Map Project Overview

Status: production and review-first data operation
Owner: Andrew Davies
Last reviewed: 2026-09-06
Public brand: [True North Map](https://truenorthmap.ca)
Canonical runtime: Supabase project `facoactpdckkhciamflk`

## Codex instruction baseline

The [Codex Workflow Contract](Codex%20Workflow%20Contract.md) applies to project work and all eleven installed private skills. Instructions are tuned for GPT-6 Astra while preserving Andrew's model and effort selection. API models, provider settings, schedules and each workflow's write authority remain separate.

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
  -> Shortlist, export, correction, or introduction request
```

## Current product surface

| Surface | What a visitor can do | Authority boundary |
| --- | --- | --- |
| Guided landing (`/`) | Choose a need, released Defence need, or Mission area; see how evidence becomes a defensible shortlist; and continue into the right workflow | Cacheable public shell and published records only; account state hydrates client-side |
| Map (`/map`) | Search published organizations, capabilities, Technology Areas, Mission areas, and Defence needs directly; use the four guided lenses; or deliberately open Ask True North for need interpretation before comparing the synchronized map, result rail, mobile sheet, and accessible list | Deterministic lookup and lenses use published records and ordinary URL/filter state without AI or an Ask quota; Ask True North remains a separately labelled AI path over known published records |
| Organizations and Regions | Browse Canadian organizations by geography and type | Published records only; coverage gaps stay visible |
| Mission areas / Use Cases (`/missions`) | Start with an operational problem, inspect reviewed technology relationships, and continue into organizations, technologies, Briefs, or a Shortlist | Mission relationships are reviewed assessments; they are not released Defence needs or procurement direction |
| Organization and technology dossiers | Read an editorial organization profile, inspect capabilities and reviewed Mission area or Defence need relationships, save the organization, and prepare the next conversation | Facts, reviewed assessments, sources, and optional editorial fields remain distinct and unsupported content is omitted |
| Defence needs (`/demand`) | Browse released public needs, then open each individual Demand Signal to inspect its source passage, desired outcome, potentially relevant technology, and limits | A public source and human verification are required |
| Ask True North | Deliberately open the secondary interpretation panel, describe a need in plain language, and receive possible fits with the reason each surfaced | AI explores known published records; it does not create facts or procurement decisions, and direct record lookup never enters this path |
| Guided example | Adjust a search focus and open a defensible example path | Five visitor-adjustable, allowlisted concepts carried into a deterministic, ordinary `/map` URL. The handoff reads only published records and never calls Ask True North or consumes its quota. |
| Defence Brief archive | Read existing reviewed, source-linked Canadian defence explainers | Evergreen URLs remain canonical and indexed, but Briefs are no longer a primary navigation or acquisition product |
| Defence Signals | Read substantial source-linked Canadian defence developments, context and TNM interpretation; use the public archive and RSS whenever an edition is published | New editions use `daily_signals_packet_v3`: significance determines item count and depth; facts, interpretation and consequential uncertainty stay distinguishable. Publication freezes item evidence and commits the edition/run atomically. Text-led editions are supported; private LinkedIn/X packaging is separately retryable. Historical v1/v2 editions retain identity-safe repair. Andrew invokes the skill manually from his chat; there is no scheduled run. |
| North Signal (`/north-signal`) | Subscribe to the single free email newsletter; its default delivery is the weekly decision brief, with a separately consented new-Defence-Signal alert preference | Supabase records global consent and records stream-specific consent only through the dependency-ordered migrations and compatible application. Andrew reviews, tests and sends every weekly issue. MailerLite's new-posts-only RSS campaign delivers alerts only to separately consented alert-group members after a validated edition is published. |
| Shortlists and exports | Save targets privately and produce useful briefs or reports | Sign-in is required for private lists; public exports use published data |
| Contribution and connection | Claim, correct, suggest, contact, or request a human-brokered introduction | Nothing public changes automatically |
| Admin workspace | Review research candidates and public submissions in separate persistent queues, publish approved records, maintain dossiers and demand signals, inspect bounded reporting, and open one Signals or Brief editor at a time | Private, owner-only, audited; a submission approval marks it for separate candidate preparation and never changes a public record |

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

The complete research design uses seven stages: claim-led coordinator, signal refresh when applicable, source discovery, candidate construction, evidence mapping, official-logo disposition for organization candidates, and deterministic stewardship. Every new run prepares an intelligence-requirement collection plan, searches both outward from entities and inward from Mission areas and published Defence needs, records atomic leaf-field claims and conflicts, decomposes independently reviewable capabilities, completes dossier coverage, and produces a compact five-part decision chain covering coverage value, evidence, conservative Mission/Defence need relevance, uncertainty, and one bounded reviewer action before the ordinary Admin Review intake. Pipeline 1.7 makes that reviewer usefulness a complete same-run, record-specific gate: exact target outcomes, changed-field and evidence anchors, recovery lineage, and the full private staging envelope must agree before the tracked importer can call the guarded intake RPC. A free-text disposition, downgraded staging version, direct connector call, or altered run/candidate envelope is not an approved staging path. `organization_bundle_v3` and `organization_refresh_bundle_v2` carry the normalized editorial profile, participation, relationship, funding and capability fields with per-leaf evidence; they do not bypass Review or Publish. New refresh runs also retain their dispositioned signal batch and real lifecycle duration. Defence need hypotheses remain private Derived Reads until a reviewed published capability enters the existing demand-matching workflow. The canonical skill implementations remain intentionally local and ignored. A clean public checkout must still contain the compatible executable schema, commands, migrations, tests, and deployed Admin Review and Publish support before a skill can stage its output. The intake preflight checks that canonical deployed contract independently of local browser configuration. This distinction prevents local capability from being mistaken for deployed authority.

Refresh intake remains a security-invoker path. The trusted `service_role`
worker may execute the public staging RPC and the private immutable baseline
parser invoked by its validation trigger. No public or signed-in browser role
may execute either intake path, and this narrow dependency grants no review,
approval, publication, or canonical-record authority.

Organization-refresh intake also verifies every touched published child against
the complete immutable live snapshot before a proposal can enter Admin Review.
Capability baselines include their published Technology Area links and approved
published Mission matches; program participations, organization relationships
and funding events use their complete normalized public child shape. A proposed
participation that references an existing program slug must reuse the current
canonical program definition rather than redefining a shared record. Publication
repeats these checks to catch a legitimate canonical change after staging. A
failed check returns the candidate to research for a fresh packet and human
review; it never repairs or publishes an approved payload in place.

Demand Signals have an additional public-source gate. A published signal needs an HTTPS canonical released source, issuing authority, source locator, relevant excerpt, at least one public problem statement, a reviewer confirmation, and linked public evidence. Public demand pages and demand-match suggestions exclude a signal that no longer satisfies that gate; it is retained privately for completion rather than deleted.

### Governed canonical organization repair

The September 4 production-wide identity/lifecycle audit reviewed 21 published organizations. Seventeen have defensible, evidence-backed repair treatments; Coastal Defence Systems, Industrial Recon, SkyX and AerialX remain `research_required` because the available evidence does not prove a safe canonical operation. Exact candidate and publication state must be read from the live Admin Review queue and canonical database.

The v4/1.8.0 contract adds `organization_canonical_repair_bundle_v1` for exact identity, profile, alias, invalid-capability and lifecycle corrections that ordinary non-destructive dossier enrichment cannot represent. It requires a private exact snapshot and allows only six operations: set organization identity, set one profile field, add or archive an alias, archive a capability, or archive an organization. It cannot hard-delete, reparent, transfer or change a stable slug. A proven superseded organization may receive one immutable old-slug redirect to an already published successor.

The approved operator path uses service-role access only for guarded snapshot and staging functions and grants research no Review or Publish authority. Legacy broad service-role technical grants on canonical public tables remain a separate least-privilege remediation item; this release does not claim to remove them. Canonical repairs are individually reviewed and separately published, never batch accepted or published.

## Terms and language map

This table is the shared translation layer. Database and editorial terms remain precise where useful; public surfaces use the language in the middle column.

| Operational or data term | Public label | Meaning and use |
| --- | --- | --- |
| Ecosystem Intelligence | True North Map | The project category remains Ecosystem Intelligence; True North Map is the public product and brand. |
| Atlas | Map / Explore the ecosystem | The national, map-first discovery experience. “Atlas” remains acceptable in technical or historical context, but the public navigation label is “Map.” |
| Demand collection | Defence needs | The public collection at `/demand`. It groups released needs without changing their canonical URLs or the precise name of an individual record. |
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
| `saved_collections` | Shortlists | A user's private shortlist of organizations and technologies for follow-up. |
| Collection lookbook | Shortlist brief | A private export of a saved Shortlist. |
| Connection request | Request an introduction | A private request for Andrew to consider facilitating a conversation. It never sends an automatic introduction. |
| Profile claim, correction, new-organization submission | Claim, correct, or suggest a profile | Public participation paths that create review work only. |
| Ask True North | Ask True North | Constrained AI-assisted discovery over the current published corpus. It exposes uncertainty and falls back to deterministic results when needed. |
| Assistant fit level | Strong fit, plausible fit, adjacent fit | A ranking aid for known records. It is neither a source claim nor a procurement recommendation. |
| Defence Brief | Canadian Defence Brief | A reviewed, source-linked public explainer or time-bounded analysis. |
| Source-linked editorial stream | Defence Signals | A manually produced, publication-driven edition at a descriptive immutable `/signals/[slug]` URL. V3 supports a nonempty ordered edition with significance-led length, explicit opening/takeaway/limitation, source facts and optional assessment/unknowns/next steps. Item-specific evidence is immutable. Text-led editions and retryable private LinkedIn/X packaging are supported. Nonpublishing outcomes create no edition or alert; historical v1/v2 rendering and exact repair remain available. |
| `Derived Read` in a Brief | True North Map assessment / Derived Read | A labelled interpretation in editorial content. It must remain distinct from the underlying factual record. |
| Global Source Book | Global Source Book | A maintained private inventory of durable source starting points used to find research leads. |
| Private Defence Wiki | Private knowledge base | Andrew's private raw-packet and evergreen-synthesis workspace. Public briefs may be derived from reviewed material, but raw packets and private notes never become runtime content. |
| `media_assets` and `atlas-public-media` | Approved organization logo or public media | Provenance-backed approved media. Organization logos are only displayed when approved and published. |
| Canadian defence capability discovery | Product category | The concise public category describing the product without implying procurement authority or a generic AI platform. |
| Directional N symbol | True North Map identity | The compact angular N and separated Signal Yellow north corner used in the logo, favicon, social assets, and navigation. |
| Legacy “North Signal mark” asset name | Directional N symbol | Some repository filenames retain `north-signal-mark` for compatibility. Public and governance language calls the symbol the Directional N so it is not confused with the newsletter. |
| Email newsletter | North Signal | The single free email product. Its default weekly briefing synthesizes one important pattern from one to three published Defence Signals, then connects it to reviewed Canadian capability, released Defence needs and Mission areas. A subscriber may later choose weekly only, optional new-Defence-Signal alerts only, or both; clearing both is global unsubscribe. Each preference has independent consent and withdrawal history. |
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
| OpenAI Responses API | Ask True North structured ranking and summary using the explicitly configured server model | No web browsing, second corpus, automatic publication, or uncited fact creation. There is no code model fallback; absent configuration leaves inference unavailable. The model remains server-configurable without changing the published corpus boundary. |
| Zoho Mail | Monitored human correspondence | `andrew@truenorthmap.ca` and operational aliases. |
| MailerLite | North Signal delivery | Current production Supabase remains the global consent ledger. After the approved migrations and application are released, it also becomes the stream-specific ledger; MailerLite mirrors only separately approved lifecycle and delivery groups and is not an auth channel or consent authority. |
| Resend through Supabase SMTP | Branded sign-in and security email | Transactional authentication only. |
| Private visibility workflow | Configured-provider SEO, GEO, AEO, bounded technical-health, search-demand and earned-link intelligence | Every configured provider response and the complete sitemap manifest are collected locally; technical fetching is restricted to five sequential core routes, optional-unconfigured APIs remain visible unknowns without failing refreshes, raw providers and reports remain ignored locally, and recommendations have no publication or outreach authority. |

## Navigation and security model

- Primary public navigation is Map, Organizations, Missions, Defence needs, Defence Signals, How It Works, and About, with **Subscribe to the free newsletter** as the standing North Signal action. The landing page is a guided entry point; `/map` remains the canonical atlas and Ask True North workspace.
- Public browsing, profiles, sources, Defence Briefs, and eligible exports are open.
- Google OAuth and passwordless email are available for private actions such as Shortlists, claims, corrections, connection requests, and account management.
- The admin workspace is not linked publicly, is `noindex`, and fails closed to the designated administrator identity, exact email, and controlled application metadata.
- Public sign-in never grants staff access. Users can remove their own private profile data after recent reauthentication; the administrator account cannot self-delete.
- Raw uploads, internal correspondence, private evidence, draft candidates, research output, and private wiki material remain inaccessible to public routes.

## Release and validation contract

Run the release check from the repository root:

```bash
pnpm release:validate
```

It covers repository hygiene, dependency security, explicit TypeScript checking, application tests, lint, scale validation and the production build. Run the applicable Research and operator validators separately. Browser QA must cover the core public routes, protected review routes, map/list accessibility, public sources, Demand Signals, Ask True North fallback, exports, contribution, connection, and account journeys.

For any material data change, verify the affected public profile, capability, demand page, index, sitemap, and source links after human publication. A green candidate file, accepted review item, or successful research run is never evidence of public publication by itself.

For all other changes, use the impact and validation matrix in `Cross-System Change And Regression Contract.md`. It requires task-start context review, affected-system mapping, scoped checks during implementation, release-level regression before production, post-deployment smoke tests, and an explicit record of checks that were not run.

## Current review findings

1. The architecture is coherent: runtime code, governance, research lineage, private knowledge synthesis, and public content have distinct homes and publication boundaries.
2. The public language layer now centralizes the most sensitive distinctions: fact, assessment, coverage gap, evidence strength, and technology-to-demand relevance. New UI work should extend this presentation layer rather than reintroduce raw database language.
3. The Demand Signal source gate is enforced in the editor, publication function, public loaders, matching logic, and RLS. This is deliberate defence in depth.
4. Production, the tracked application, validated research lineage, and current governance are reconciled through explicit scoped commits. Private skills, credentials, raw provider material, and ignored local outputs remain outside Git; agents must still inspect the exact worktree and must never use `git add .`.
5. Static documentation is a guide, not a counter. Read production for live corpus counts, queue state, subscriber state, and coverage before public statements or release decisions.
6. The strategic Mission area / Use Case entry point has dedicated public browsing and detail routes. The next release work is operational: monitor performance and count consistency, triage live queues, keep Daily Signals and North Signal useful, and address the active security and reliability register before broader promotion.

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

## Historical release context

Prior dated deployment narratives are preserved in the [overview history through September 5](../archive/governance/True%20North%20Map%20Project%20Overview%20-%20through%202026-09-05.md). They are optional investigation context, not startup instructions or live release proof.
