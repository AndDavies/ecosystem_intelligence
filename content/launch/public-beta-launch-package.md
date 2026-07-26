# True North Map broader public beta launch package

Status: release candidate. The three pre-launch security and reliability blockers are repaired and regression-tested; launch follows production deployment verification and final queue cleanup.

Canonical URL: `https://truenorthmap.ca/`

Campaign: `broader_public_beta_2026_07`

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

Use durable rounded proof points in external copy:

- More than 250 reviewed Canadian organizations.
- More than 240 reviewed technologies and offerings.
- More than 380 cited public sources.
- 30 released public needs represented in the current corpus.
- Eight Canadian Defence Briefs built from reviewed public evidence.

Read current production totals before interviews or media responses. Never hard-code live counts into operating contracts.

## Founder story

Andrew Davies is a veteran and Combat Systems Engineering Officer whose experience spans military service and the civilian sector. Work with defence projects, operators, engineers, founders and innovation teams revealed a capable Canadian ecosystem that remained difficult to see as a whole.

True North Map is Andrew's contribution to that problem. It brings organizations, technologies, released public needs and their supporting evidence into one navigable public record. The goal is not to replace procurement, due diligence or human relationships. It is to make the right Canadian capability easier to find and the next conversation better informed.

North Star:

> Map what Canada can build. Connect the people ready to build it. Help the whole ecosystem move together.

## Release gates

### Product and reliability

- [x] Clean production build and `pnpm release:validate` pass.
- [ ] No unexplained recurring 5xx cluster on the current deployment.
- [x] National map contains every matching published marker.
- [x] Rich profile cards remain paginated and load progressively.
- [x] Ask True North passes success, timeout, provider failure, quota and deterministic fallback checks.
- [x] Health endpoint reports the public database and core record families available.
- [ ] LCP, INP and CLS meet the documented targets or have a documented non-blocking field-data limitation.

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
- [ ] Pending review, publication, match, contribution, connection, contact and feedback queues are triaged.

### Participation and measurement

- [x] Newsletter subscription, MailerLite synchronization and unsubscribe pass end to end.
- [x] Centered update prompt respects meaningful engagement and 30-day dismissal.
- [x] Analytics choices load only the selected providers and exclude private routes.
- [x] UTM source and campaign attribution reaches privacy-light event reporting.
- [x] First-week scorecard is visible in administrator insights.
- [x] LinkedIn, X, native and copy-link sharing work on each major public record type.

### Launch materials

- [x] Current Phase 1B desktop and mobile screenshots captured.
- [x] Current 30-second walkthrough rendered and reviewed.
- [ ] Partner overview PDF visually reviewed.
- [ ] Partner and media deck visually reviewed.
- [ ] LinkedIn avatar, banner and organization-page copy ready.
- [ ] Founder, direct, organization, partner, media and community copy ready.
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

`https://truenorthmap.ca/?utm_source={source}&utm_medium={medium}&utm_campaign=broader_public_beta_2026_07`

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

Approved screenshots are stored under `content/launch/screenshots/phase-2/`.

Older files under `content/launch/screenshots/`, `content/launch/demo-frames/` and `content/launch/true-north-map-public-beta-demo.mp4` are legacy assets and must not be distributed.

## Pre-launch repair record

The July 26 security and reliability review identified and repaired three release blockers in the current release candidate:

- The production dependency audit now reports no known vulnerability after patching Next.js, Sharp and affected transitive packages and removing CLI tooling from the runtime graph.
- Organization and technology dossiers now load only the public citation graph belonging to their scoped records instead of scanning the complete citation corpus.
- Internal demand-match reviewer rationale no longer appears in the public atlas contract, APIs, search corpus or Ask True North catalogue.

Detailed repair evidence, remaining hardening items, accepted risks and recurring checks are maintained in `context/governance/Security And Reliability Remediation Log.md`.
