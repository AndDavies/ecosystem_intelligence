# True North Map Project Overview

Status: active public product and review-first data operation
Last reviewed: 2026-07-26
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
| Map (`/`) | Explore Canada, filter the visible map, search in plain language, compare the current viewport, and open dossiers | Published records only |
| Organizations and Regions | Browse Canadian organizations by geography and type | Published records only; coverage gaps stay visible |
| Organization and technology dossiers | See what an organization offers, public sources, reviewed technology, and possible relevance | Facts and assessments are labelled separately |
| Public Needs (`/demand`) | Browse released public needs, then open each individual Demand Signal to inspect its source passage, desired outcome, potentially relevant technology, and limits | A public source and human verification are required |
| Ask True North | Ask a plain-language question and receive bounded results from the live published corpus | AI explores known records; it does not create facts or procurement decisions |
| Defence Briefs | Read reviewed, source-linked Canadian defence explainers | Editorial synthesis is distinct from raw private wiki material |
| Working Lists and exports | Save targets privately and produce useful briefs or reports | Sign-in is required for private lists; public exports use published data |
| Contribution and connection | Claim, correct, suggest, contact, or request a human-brokered introduction | Nothing public changes automatically |
| Admin workspace | Review candidates, publish approved records, maintain dossiers, demand signals, evidence, logos, coverage, and feedback | Private, owner-only, audited |

## System architecture and source of truth

| Layer | Current responsibility | Must not do |
| --- | --- | --- |
| `app/` | Next.js application, public and private routes, server actions, tests, deployment migrations, runtime integrations | Hold an alternate corpus or publish unreviewed research |
| Supabase production | Sole canonical runtime for records, taxonomy, evidence, review state, auth, storage, and publication | Accept unreviewed agent output as public data |
| `research/ingestion/` | Immutable typed lineage for leads, candidates, reviews, staging exports, and runs | Act as a runtime data source or automatic promotion channel |
| `.agents/skills/` | Executable repository-local research contracts | Replace the live schema or publication authority |
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
| `source_confidence` | How strong is the public evidence? | Strong, moderate, or limited. This describes the support available in public sources, not the quality of an organization. |
| `freshness` | Last reviewed / source freshness | Whether a record is current, due for review, or stale. |
| Coverage gap | Coverage gap / What remains unknown | A visible limit: missing, thin, stale, or unverified information. It is not negative evidence about an organization. |
| `candidate_change` | Under review | A private proposed new record or refresh. It is not published data. |
| Source lead | Research lead | A private discovery item that still needs qualification and evidence. |
| `research_run` | Research run | Private audit metadata for an ingestion activity. It is not an approval step or public record. |
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
| North Signal | True North Map identity | The angular N, evidence path, and yellow signal point used in the brand mark, favicon, social assets, and navigation. |
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
| OpenAI Responses API | Ask True North structured ranking and summary | No web browsing, second corpus, automatic publication, or uncited fact creation. |
| Zoho Mail | Monitored human correspondence | `andrew@truenorthmap.ca` and operational aliases. |
| MailerLite | Consent-backed updates and newsletters | Supabase remains the consent ledger; campaigns are not an auth channel. |
| Resend through Supabase SMTP | Branded sign-in and security email | Transactional authentication only. |

## Navigation and security model

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

## Current review findings

1. The architecture is coherent: runtime code, governance, research lineage, private knowledge synthesis, and public content have distinct homes and publication boundaries.
2. The public language layer now centralizes the most sensitive distinctions: fact, assessment, coverage gap, evidence strength, and technology-to-demand relevance. New UI work should extend this presentation layer rather than reintroduce raw database language.
3. The Demand Signal source gate is enforced in the editor, publication function, public loaders, matching logic, and RLS. This is deliberate defence in depth.
4. The repository currently contains both application/governance changes and active research-pipeline work. They must be staged as separate commits. The research artifacts are intentional lineage, not incidental build output.
5. Static documentation is a guide, not a counter. Read production for live corpus counts, queue state, subscriber state, and coverage before public statements or release decisions.

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
| `app/src/lib/research/pipeline-schema.ts` | Executable research contract when code and prose differ |
| `app/src/lib/atlas/presentation.ts` | Canonical public labels for recurring evidence and assessment language |
| `app/supabase/migrations/` | Versioned production schema and policy history |
