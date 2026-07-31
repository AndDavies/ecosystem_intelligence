# True North Map broader public beta launch package

Status: live soft beta. The public product and repaired security blockers are deployed; broader promotion follows live queue triage, field-performance review, and replacement of stale launch collateral.

Canonical URL: `https://truenorthmap.ca/`

Next campaign: `broader_public_beta_2026_08`

## Release position

True North Map is an independent, evidence-led discovery platform that helps people find Canadian defence and dual-use capability, understand where it may fit, and move into better-informed conversations.

Primary message:

> Canada is building more than most people can see.

Brand promise:

> Make Canadian capability visible.

Journey:

> Follow the evidence. Find the fit. Start the right conversation.

Trust boundary:

> Reviewed public evidence · Transparent gaps · Human review

Use live rounded proof points only after reading production immediately before publication. Never hard-code corpus, queue, subscriber, or coverage totals into operating contracts, reusable channel copy, or collateral.

## Founder story

Andrew Davies is a veteran and Combat Systems Engineering Officer whose experience spans military service and the civilian sector. Work with defence projects, operators, engineers, founders and innovation teams revealed a capable Canadian ecosystem that remained difficult to see as a whole.

True North Map is Andrew's contribution to that problem. It brings organizations, technologies, released public needs and their supporting evidence into one navigable public record. The goal is not to replace procurement, due diligence or human relationships. It is to make the right Canadian capability easier to find and the next conversation better informed.

North Star:

> Map what Canada can build. Connect the people ready to build it. Help the whole ecosystem move together.

## Release gates

### Product and reliability

- [x] Clean production build and `pnpm release:validate` pass.
- [x] No primary-route error was observed in the July 31 production smoke and health review; inspect Vercel runtime logs again immediately before the campaign.
- [x] National map contains every matching published marker.
- [x] Rich profile cards remain paginated and load progressively.
- [x] Ask True North passes success, timeout, provider failure, quota and deterministic fallback checks.
- [x] Health endpoint reports the public database and core record families available.
- [ ] Field LCP, INP and CLS meet the documented targets or have a documented non-blocking field-data limitation.

### Security and privacy

- [x] Anonymous, member, non-admin and administrator access matrix passes.
- [x] Stale refresh tokens resolve to signed out without a production error.
- [x] CAPTCHA and rate limiting protect public write and authentication workflows.
- [x] Scheduled 30-day event and 90-day search retention is active in production.
- [x] Security headers and provider-specific CSP pass production browser checks.
- [x] No private evidence, raw research, secrets or administrator records appear in public responses.
- [x] Rollback tag, prior production deployment and database recovery posture are recorded.

### Discovery and trust

- [x] Sitemap uses real update timestamps and contains canonical public routes only.
- [x] Robots, canonicals, metadata, social cards and structured data pass validation.
- [x] No broken primary internal link or orphaned featured page.
- [x] Every published Demand Signal passes the released-source gate.
- [x] Featured organizations, technologies, Public Needs and Defence Briefs have working evidence links and images.
- [ ] Pending review, publication, match, contribution, connection, contact and feedback queues are triaged against current production state.

### Participation and measurement

- [x] Newsletter subscription, MailerLite synchronization and unsubscribe pass end to end.
- [x] Centered update prompt respects meaningful engagement and 30-day dismissal.
- [x] Analytics choices load only the selected providers and exclude private routes.
- [x] UTM source and campaign attribution reaches privacy-light event reporting.
- [x] First-week scorecard is visible in administrator insights.
- [x] LinkedIn, X, native and copy-link sharing work on each major public record type.

### Launch materials

- [x] Current Directional N desktop and mobile screenshots captured under `content/launch/broader-public-beta-2026-08/screenshots/`.
- [x] Current 30-second walkthrough rendered and reviewed.
- [x] Partner overview PDF rebuilt and visually reviewed against the current product.
- [x] Partner and media deck rebuilt and visually reviewed against the current product.
- [x] Directional N LinkedIn avatar, banner and organization-page copy ready.
- [x] Founder, direct, organization, partner, media and community copy ready.
- [ ] Every community's current promotion rules rechecked on posting day.

## Three-wave release

### Wave 1: Founder and trusted network

1. Publish Andrew's founder-led LinkedIn announcement.
2. Publish the True North Map organization-page announcement.
3. Send five personal notes to trusted defence and ecosystem users.
4. Send 10 to 15 profile-verification notes to included organizations.
5. Send one concise MailerLite update to consented subscribers after inbox tests.

Primary action: **Try one real search and tell me where it falls short.**

### Wave 2: Canadian ecosystem

1. Approach Build Canada and relevant Canadian innovation communities.
2. Contact CADSI and regional defence and aerospace associations.
3. Contact IDEaS, DIANA, accelerators, research centres and test facilities.
4. Pitch BetaKit, The Logic, Canadian Defence Review, Vanguard and aligned sector media.

Primary action: **Share a free Canadian capability-discovery resource with the organizations that should be easier to find.**

### Wave 3: Builders and public communities

1. Publish the technical maker story to Show HN.
2. Post to Indie Hackers and `r/SideProject` using community-specific copy.
3. Use only designated self-promotion threads where a community requires them.
4. Keep Andrew available to answer technical, evidence and governance questions after posting.

Primary action: **Review the evidence architecture and try the product against a real discovery problem.**

## UTM convention

`https://truenorthmap.ca/?utm_source={source}&utm_medium={medium}&utm_campaign=broader_public_beta_2026_08`

Never place names, email addresses, organization names or other personal identifiers in UTM values.

| Channel | Source | Medium |
| --- | --- | --- |
| Andrew LinkedIn | `andrew_linkedin` | `social` |
| True North Map LinkedIn | `tnm_linkedin` | `social` |
| Direct message | `direct_outreach` | `direct` |
| Direct email | `direct_outreach` | `email` |
| Included organization | `organization_outreach` | `email` |
| Build Canada | `build_canada` | `community` |
| Industry association | `industry_association` | `partner` |
| BetaKit | `betakit` | `press` |
| Defence media | `defence_media` | `press` |
| Hacker News | `hacker_news` | `community` |
| Reddit SideProject | `reddit_sideproject` | `community` |
| Indie Hackers | `indie_hackers` | `community` |

## First-week scorecard

| Measure | Target | System of record |
| --- | ---: | --- |
| Qualified sessions | 300 | Vercel Analytics |
| Map, filter or Ask engagement | 50% | GA4 and private events |
| Organization or technology profile reach | 25% | GA4 and dossier events |
| Zero-result searches | Below 25% | Private search ledger |
| Update subscribers | 25 | Supabase consent ledger |
| Useful profile contributions | 5 | Submissions queue |
| Credible connection requests | 3 | Connection queue |
| Substantive feedback responses | 10 | Feedback queue |
| Stakeholder conversations or media follow-ups | 5 | Manual release log |
| Critical privacy or production failures | 0 | Vercel and Supabase operations |

Review the scorecard daily for the first week. Fix broken searches, repeated missing organizations, failed contribution paths and critical errors before expanding the feature set.

## Current release visuals

The current release package is `content/launch/broader-public-beta-2026-08/`. Its README, source notes, current desktop/mobile screenshots, Directional N social assets, 30-second walkthrough, partner overview PDF, partner/media deck, response guide, and channel copy are the distribution sources of record.

Files under `content/launch/screenshots/phase-2/`, `content/launch/phase-2/`, `content/launch/screenshots/`, `content/launch/demo-frames/`, and `content/launch/true-north-map-public-beta-demo.mp4` are historical assets and must not be distributed as current.

## July 31 soft-beta checkpoint

- `main` and `origin/main` are aligned with the deployed directional-N, North Signal, performance, and regional-imagery work.
- The production health endpoint and primary public routes returned 200 during the current review.
- The compact discovery architecture keeps the full published national corpus available to the map and search while paginating rich details.
- Organizations, Regions, regional directories, and Public Needs now stream an immediate branded shell before their compact public index resolves.
- The live review and participation queues contain active work and must be read and triaged directly in production before broader promotion.
- Mission Area / Use Case browsing and detail routes now complete the intended mission-to-target entry point without a second taxonomy or corpus.
- The current release candidate pages every discovery relation deterministically, derives visible counts from the same compact snapshot, uses linear fallback grouping, and includes a 5,000-marker scale gate.
- Before broader distribution, deploy once, verify health and catalogue consistency, review the production canonical crawl and runtime logs, and read every live queue directly. Production verification remains pending for `REL-2026-003` and `REL-2026-004`.

## Pre-launch repair record

The July 26 security and reliability review identified and repaired three release blockers in the current release candidate:

- The production dependency audit now reports no known vulnerability after patching Next.js, Sharp and affected transitive packages and removing CLI tooling from the runtime graph.
- Organization and technology dossiers now load only the public citation graph belonging to their scoped records instead of scanning the complete citation corpus.
- Internal demand-match reviewer rationale no longer appears in the public atlas contract, APIs, search corpus or Ask True North catalogue.

Detailed repair evidence, remaining hardening items, accepted risks and recurring checks are maintained in `context/governance/Security And Reliability Remediation Log.md`.
