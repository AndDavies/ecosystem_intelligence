# True North Map product requirements

Status: maintained product acceptance requirements
Owner: Andrew Davies
Last reviewed: 2026-09-12

The [Overview](True%20North%20Map%20Project%20Overview.md) owns the product description and vocabulary. This document owns reader outcomes, not research procedure, provider configuration or release receipts. Audience priorities below are product assumptions pending the queued editorial review, not measured demand.

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
## Exports

Public exports:

- filtered CSV with stable IDs
- individual organization PDF profile
- individual capability PDF profile
- regional PDF report

Authenticated export:

- saved-collection PDF lookbook

Unknown fields must be omitted cleanly. PDFs must keep citations clickable and label analyst assessments.
## Explicitly deferred

- monetization or paid tiers
- French content, UI, routes, locale switching, and localization scaffolding
- CRM synchronization or relationship-history ingestion
- tender feeds as a primary workflow
- direct self-service publication
- outbound sequencing or sales-pipeline management
- continuous autonomous publication
- classified, restricted, or inferred government demand

## Discovery and profile requirements

- Public browsing, evidence and exports are free. Sign-in protects private Shortlists and account/contribution workflows; it must not gate public discovery.
- Directory and map lookup remain deterministic. Ask True North selects up to 16 published organizations lexically and uses the existing OpenAI answering model with quota reservation, current public admission and citation ownership checks. Batched evidence hydration, complete qualifiers and deduplicated prompt passages remain. Request-scoped references map exactly to admitted IDs; invalid or cross-entity output is rejected rather than silently dropping a recommended organization. Negative conclusions are scoped to supplied evidence. Jev, semantic directory suggestions and the owner comparison campaign were retired by Andrew on September 19; no further comparison runs are queued. See [Ask production baseline](../../app/docs/ask-jev.md).
- Map and list preserve equivalent records, filters, bounds, selection, pagination and shareable URLs. Marker coverage must not be truncated by detail-card pagination. Mobile initial results and explicit map state respect visitor intent. Provider failures preserve a useful fallback.
- Organization and technology profiles distinguish offering, operational context, supported facts, assessment, evidence and consequential unknowns. Unsupported values remain missing; reported TRLs remain attributed reports, not independent certification.
- Mission areas describe reviewed operational relevance. Defence needs require released public sources; assessed matches do not imply eligibility, endorsement, procurement or classified demand.
- Contribution, correction and introduction requests enter private review; they never directly publish or expose personal contacts.
- Collection/detail navigation, descriptive links, one H1, metadata and breadcrumbs reflect the reader's route. Private/account/admin routes remain private or noindex as applicable. Loading, empty and failure states preserve geometry and a clear recovery action.
- Defence Signals is public source-linked news and analysis. North Signal is the single consent-backed email newsletter; weekly delivery and optional new-Signal alerts remain distinct consents. Existing Briefs remain an evergreen archive, not the primary acquisition product.

## Conditional authorities

Access and consent: [Access matrix](Access%20And%20Privacy%20Matrix.md) and [Email operations](Email%20Updates%20Operations.md). Review, safe writes and publication: [Admin contract](Admin%20Workflow%20And%20Data%20Contract.md). Visual identity and grouping: [Brand System](../../content/brand/True%20North%20Map%20Brand%20System.md). Validation: [Cross-System Contract](Cross-System%20Change%20And%20Regression%20Contract.md). These references apply when that responsibility changes; they are not a startup stack.

## Reader-usefulness candidate

Private reviewer notes support acceptance decisions; public executive summaries orient readers; full organization/capability profiles support deeper inspection; Defence Signals explains developments; North Signal email supports return visits. One format's conventions must not automatically govern another.

The [local editorial candidate and review](plans/active/2026-09-12-editorial-and-reader-usefulness-review.md) implements the September 12 request. Readers should find a concrete explanation, material qualifications and an appropriate next action without repeated boilerplate. A role-aware snapshot preserves reporting entity, period, unit/currency, basis and source; missing financial values disappear. Explanatory media remains optional and requires approved reuse. These are local candidate requirements, not claims of reader validation or deployed support. Publication activation remains separately authorized.

Future drafts follow the Brand System's TNM editorial voice: technically informed, practical, readable and willing to explain a supported judgment. Readers should understand mechanisms and consequences, including attributed company specifications, without repetitive qualification or private-review labels. No fabricated personal experience, institutional authority or unsupported performance claims. The September 27 local comparison uses saved evidence, not a corpus refresh or proof of reader preference.
