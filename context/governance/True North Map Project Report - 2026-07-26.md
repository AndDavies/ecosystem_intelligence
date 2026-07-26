# True North Map: Current Project Report

Date: 2026-07-26

Status: production Public Beta and broader-release hardening

Owner: Andrew Davies

Public product: https://truenorthmap.ca

Canonical runtime: Supabase project `facoactpdckkhciamflk`

## Executive view

True North Map is now a production, evidence-led discovery platform for Canada's defence and dual-use ecosystem. It connects a national map, organization and technology dossiers, released Public Needs, reviewed technology-to-need assessments, Canadian Defence Briefs, Ask True North, private Working Lists, reviewed public contribution, and a private administration system.

The product has moved beyond its original beta checklist. Phase 1B established the North Signal brand and coherent public experience. Phase 2 hardened payloads, public reads, caching, stale sessions, health checks, security headers, retention, campaign attribution, first-week reporting, crawl validation, launch collateral, and rollback procedures.

The operating model remains intentionally conservative: production Supabase is the only public source of truth; research and AI stage reviewable work; people approve interpretation; publication is a separate human action.

## Mission and strategic wedge

**Brand promise:** Make Canadian capability visible.

**Positioning:** True North Map is an independent, evidence-led discovery platform that helps people find Canadian defence and dual-use capability, understand where it may fit, and move into better-informed conversations.

The core decision journey is:

```text
Mission area, use case, technology, place, or released public need
  -> relevant Canadian organizations
  -> technology, evidence, and confidence
  -> reviewed assessment of where it may help
  -> gaps and tradeoffs
  -> Working List, export, correction, or introduction request
```

Primary users are business development and engagement teams, product and strategy users, and the reviewers who maintain a defensible public dataset. True North Map is not a broad CRM, procurement portal, official government directory, classified-demand source, or autonomous publishing system.

## Public product

| Surface | Outcome for the user | Trust boundary |
| --- | --- | --- |
| Map | See who is building what across Canada and narrow the view by place, organization, technology, stage, program, or public need | Published records only; all matching markers remain available nationally |
| Organizations and regions | Move from a Canadian landscape to a useful dossier | Coverage and location precision stay visible |
| Technology profiles | Understand what an organization provides and what supports it | Facts and assessments remain distinct |
| Public Needs | Follow released public needs and inspect the source passage | Every public signal passes a released-source gate |
| Demand connections | See where Canadian technology may help | Human-reviewed public-source assessment, not procurement status |
| Ask True North | Ask a natural-language question over the current corpus | Known records only, bounded OpenAI use, deterministic fallback |
| Defence Briefs | Read source-linked analysis that connects needs, technologies, and organizations | Editorial synthesis is labelled and reviewed |
| Working Lists | Save a private shortlist for a better conversation | Authenticated and owner-private |
| Contributions and connections | Claim, correct, suggest, or request a human introduction | Nothing changes or sends automatically |
| Admin | Review, edit, publish, maintain, and audit | Owner-only and unlinked publicly |

## North Signal brand packet

The identity uses an angular N, a white evidence path, and a yellow signal point. It expresses direction through scattered public evidence.

Approved messages:

- Brand promise: **Make Canadian capability visible.**
- Homepage headline: **Canada is building more than most people can see.**
- Category: **Evidence-led ecosystem discovery**
- Journey: **Follow the evidence. Find the fit. Start the right conversation.**
- Trust: **Reviewed public evidence · Transparent gaps · Human review**

| Token | Hex | Role |
| --- | --- | --- |
| North Ink | `#242827` | Structure, headings, navigation |
| Field | `#F7F7F3` | Warm page canvas |
| Paper | `#FFFFFF` | Focused reading and forms |
| Signal Yellow | `#F5E900` | Primary actions, active states, evidence path |
| Signal Wash | `#FFFBD2` | Low-intensity signal background |
| Evidence Green | `#126147` | Verified public evidence |
| Quiet Grey | `#666965` | Supporting copy and metadata |
| Warning Gold | `#735100` | Review and caution |
| Alert Red | `#9F3027` | Error and destructive action |

Barlow serves headings, metrics, and navigation. Inter serves body copy, forms, evidence, and tables. Yellow is a signal, not a canvas. Rounded geometry remains part of the product, while oversized floating cards are avoided.

Canonical production artwork lives in `app/public/brand/`. Current launch collateral lives in `content/launch/phase-2/`. The brand system and asset index are maintained in `content/brand/True North Map Brand System.md`.

## Architecture and source of truth

| Layer | Responsibility | Boundary |
| --- | --- | --- |
| Next.js application | Public/private routes, APIs, tests, server actions, integrations, migrations | No alternate corpus |
| Production Supabase | Records, taxonomy, evidence, review state, auth, storage, audit, publication | Sole canonical runtime |
| Research lineage | Typed leads, prospects, candidates, signals, reviews, staging exports, runs | Immutable review lineage, not runtime |
| Project-local skills | Executable agent operating contracts | Must match current code and deployed review capability |
| Governance | Product decisions, boundaries, regression, runbooks | No candidate records or secrets |
| Content | Brand, launch, campaign, and media collateral | Not a factual source of public record |
| Private Defence Wiki | Raw packets and evergreen synthesis | Never feeds private material directly to public routes |
| Private visibility workspace | Read-only provider evidence and reports | Ignored local artifacts; sanitized aggregate only |

Exact corpus and queue counts are deliberately not copied into this report. They must be read from production when a decision or public claim depends on them.

## Evidence and publication model

Every public surface should make three states legible:

1. **Source-backed fact:** what a released or official source says.
2. **True North Map assessment:** a reviewed interpretation of possible relevance.
3. **Coverage gap:** what remains missing, thin, stale, or unverified.

The public research flow is:

```text
Durable public evidence
  -> qualification
  -> typed candidate
  -> field evidence and citations
  -> private Admin Review
  -> human edit and acceptance
  -> separate Publish action
  -> canonical database mutation
  -> audit and public-route revalidation
```

Demand Signals add a released-source gate: HTTPS canonical source, issuer, source locator, relevant excerpt, problem statement, desired outcome, reviewer confirmation, and linked evidence. Technology-to-demand connections always retain the caveat that they do not imply procurement eligibility, endorsement, customer interest, or classified demand.

## Research pipeline skill system

The research system uses seven complementary stages:

| Stage | Skill | Result |
| --- | --- | --- |
| 1 | `tnm-autonomous-research` | Live coverage selection, bounded run, and coordinated handoffs |
| 2 | `tnm-signal-refresh` | Atomic changes from a balanced multi-source watchlist when refreshing records |
| 3 | `tnm-source-discovery` | Broad prospects and durable qualified leads |
| 4 | `tnm-candidate-builder` | Supported organization, demand, or refresh bundle |
| 5 | `tnm-evidence-mapper` | Field citations, source confidence, and labelled derived relevance |
| 6 | `tnm-candidate-logo` | Private official-logo provenance disposition for organization candidates |
| 7 | `tnm-review-steward` | Schema, taxonomy, duplicate, evidence, compatibility, and private intake checks |

The executable pipeline schema wins when prose differs. Candidate staging must never lead the deployed Admin Review and Publish interfaces. A validated candidate in Admin Review is the terminal state for an agent run; a human remains responsible for acceptance and publication.

At this report date, six stages are present in the production-aligned clean checkout. Candidate-logo integration and its supporting contract are active work in the primary workspace and must merge with its tests and commands before a clean checkout can claim all seven stages operational.

## Private SEO, GEO, and AEO intelligence

The new `tnm-visibility` skill is deliberately separate from research ingestion. It measures whether useful public material can be found, understood, cited, and trusted.

It supports:

- owned Google Search Console and GA4 evidence;
- public-route and PageSpeed diagnostics;
- Bing and Ahrefs imports;
- explicitly authorized and capped DataForSEO validation;
- SEO, GEO, and AEO opportunity analysis;
- internal-link and content briefs;
- evidence-led earned-link prospects;
- an allowlisted aggregate owner-only dashboard projection.

Credentials, raw queries, provider payloads, referrals, snapshots, and reports remain under ignored `research/visibility/local/`. The workflow never publishes, submits indexing requests, changes provider settings, sends outreach, buys links, or writes to the public corpus. A visibility recommendation becomes an ordinary product or editorial task and must pass normal evidence, privacy, and regression checks.

At this report date, the visibility skill and CLI are active integration work in the primary workspace. Local successful reports are useful evidence but do not by themselves prove that the clean repository or production deployment contains the integration.

## Phase 1B and Phase 2 changes

Phase 1B delivered a coherent North Signal identity, public message system, light evidence-led visual language, consistent navigation, refreshed homepage journey, current social assets, and the Public Needs collection language while retaining `/demand` as canonical.

Phase 2 delivered:

- compact all-organization map/search projection with paginated rich cards;
- bounded retry and warm safe-snapshot behaviour for public reads;
- clean stale-session handling;
- non-sensitive `/api/health` checks;
- provider-specific content security policy;
- 90-day raw-search and 30-day detailed-event retention cleanup;
- consent-respecting campaign attribution and first-week reporting;
- tag-invalidated public record caching;
- low-rate crawl validation across canonical sitemap pages;
- current desktop/mobile screenshots, product walkthrough, LinkedIn banner, partner overview, partner/media deck, channel copy, response guide, access matrix, and rollback runbook.

The production-aligned Phase 2 validation previously recorded 175 passing tests, successful lint, successful release validation, a clean build, responsive browser checks, and a canonical crawl with no outstanding findings. These are dated results, not a substitute for rerunning regression after future code or data-contract changes.

## Privacy, security, and operations

- Anonymous users see published intelligence only.
- Members manage only their private lists, submissions, and account.
- Public sign-in supports Google OAuth and passwordless work email.
- Admin access is unlinked, noindex, owner-only, and fails closed.
- Zoho handles monitored human correspondence; MailerLite delivers consent-backed updates; Supabase is the consent ledger; Resend through Supabase sends branded security mail.
- Vercel hosts the application, DNS, analytics, and deployment history.
- Optional analytics load only after the relevant consent and remain excluded from private routes.
- Microsoft Clarity remains dormant unless the public project ID is configured and its consent boundary is revalidated.
- Secrets, raw research, private evidence, visibility providers, and user details do not enter public responses or tracked collateral.

## Whole-project regression contract

Every material task begins with the project overview, status, cross-system contract, git state, and live production state when relevant. The task then maps effects across public UX, database/API, research, Admin Review and Publish, evidence, privacy, analytics, SEO/AEO, brand, and launch assets.

Minimum commands by scope:

```text
Application or shared library: pnpm test + pnpm lint
Research contracts:          pnpm data:readiness + pnpm research:validate
Visibility integration:      pnpm visibility:validate
Public metadata/routes:      pnpm launch:validate
Production release:          pnpm release:validate
```

Public layout and interaction changes add browser checks at 390, 768, 1024, and 1440 pixels. Production release adds `/api/health`, affected routes, live data state, and Vercel build/runtime log checks. Every completion report must state what was and was not tested.

## Operational items and resolved release posture

| Item | Resolution | Impact and operating rule |
| --- | --- | --- |
| Candidate-logo skill | Separate research integration lane, not a public-release defect | Merge its skill, schema, tests and lineage artifacts as one research commit only when that active work is complete. The live application continues to use approved `media_assets` records safely in the meantime. |
| Visibility skill | Separate private-analysis lane, not a runtime dependency | Commit only tracked skill and validation contracts. Keep credentials, provider exports and query evidence ignored and local. A visibility-provider outage cannot affect the public site. |
| Microsoft Clarity | Intentionally deferred | Google Analytics, first-party funnel events and Vercel performance monitoring cover launch measurement. Deferral reduces privacy and consent complexity with no product impact. |
| Turnstile on custom forms | Implemented as layered protection | Contact, feedback and update forms now require a browser challenge and server-side token verification in addition to validation, honeypots and rate limits. Supabase Auth keeps its existing Turnstile configuration. |
| Public corpus and queues | Live operating state, not a defect | Read production before publishing counts, assigning research or starting promotion. This prevents stale documentation from becoming a false release gate. |
| Launch outreach and campaigns | Ready, owner-triggered | Assets and channel plans may be prepared in advance, but Andrew explicitly authorizes every campaign, post and outreach action. No automation sends autonomously. |

## Documents of record

- `AGENTS.md`
- `context/governance/True North Map Project Overview.md`
- `context/governance/Project Status.md`
- `context/governance/Cross-System Change And Regression Contract.md`
- `context/governance/Skills And Automation Map.md`
- `context/governance/Admin Workflow And Data Contract.md`
- `context/governance/Autonomous Ecosystem Research Pipeline.md`
- `context/governance/Research Agent Schema And Source Contract.md`
- `content/brand/True North Map Brand System.md`
- `content/launch/phase-2/README.md`
- `app/src/lib/research/pipeline-schema.ts`

The dated PDF generated from this report is a readable project snapshot. The operating documents above remain canonical as the project changes.
