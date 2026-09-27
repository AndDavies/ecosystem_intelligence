# True North Map Project Overview

Status: product orientation and terminology
Owner: Andrew Davies
Last reviewed: 2026-09-12

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
| `media_assets` and `atlas-public-media` | Approved organization logo or public media | Provenance-backed approved media. Organization logos are only displayed when approved and published. |
| Canadian defence capability discovery | Product category | The concise public category describing the product without implying procurement authority or a generic AI platform. |
| Directional N symbol | True North Map identity | The compact angular N and separated Signal Yellow north corner used in the logo, favicon, social assets, and navigation. |
| Legacy “North Signal mark” asset name | Directional N symbol | Some repository filenames retain `north-signal-mark` for compatibility. Public and governance language calls the symbol the Directional N so it is not confused with the newsletter. |
| Email newsletter | North Signal | The single free email product. Its default weekly briefing synthesizes one important pattern from one to three published Defence Signals, then connects it to reviewed Canadian capability, released Defence needs and Mission areas. A subscriber may later choose weekly only, optional new-Defence-Signal alerts only, or both; clearing both is global unsubscribe. Each preference has independent consent and withdrawal history. |
| Public Beta | Soft-beta release state | The product is live and publicly usable while coverage, content cadence, and workflows continue to be tested and improved. It is a status label, not part of the permanent logo or a disclaimer for weak evidence. |
| Compact discovery projection | Map and directory results | The evidence-light public read used to keep national discovery complete and responsive. Rich evidence loads only after a visitor opens a record. |
| Source verification gate | Released-source verification | The demand-specific rule that prevents an unsourced summary from becoming a public Demand Signal. |
| RLS and explicit Data API grants | Private security controls | Internal database controls. They protect drafts, user data, and staff actions; they are not public marketing language. |
## Deliberately out of scope

- Paid tiers, subscriptions, and monetization.
- French localization in the current release.
- CRM synchronization, sales sequencing, personal relationship history, or automated introductions.
- Self-service public publication.
- Continuous autonomous publication.
- Classified, restricted, or inferred government demand.

## Architecture and responsibilities

`app/` is the deployed Next.js application. Production Supabase owns records, taxonomy, auth, storage, review and publication. `research/ingestion/` is versioned supporting lineage, never a runtime dataset. Private operator skills and working evidence stay local and ignored. See the root [README](../../README.md) for file placement.

The [PRD](PRD.md) owns reader outcomes and product acceptance requirements. The [Admin contract](Admin%20Workflow%20And%20Data%20Contract.md) owns Review and Publish; the [Research interface](Research%20Agent%20Schema%20And%20Source%20Contract.md) routes research compatibility. The [workflow directory](Skills%20And%20Automation%20Map.md) locates specialist operations. Deployment receipts belong in the Development Log, not this product description.
