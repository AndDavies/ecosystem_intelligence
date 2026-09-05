# Search Analytics, Bing, and IndexNow Implementation Handoff

Status: completed and deployed; GA4 report appearance and Bing IndexNow validation remain observational follow-ups
Owner: Andrew Davies
Prepared: 2026-09-05
Workspace: `/Users/andrewdavies/Documents/Codex/projects/Ecosystem Intelligence`
Release commit: `c63d3d88e3ca6ecbf9b43df1656e0f187a6a7c0c`
Production deployment: `dpl_81UphyrVHB6D9YFe1a8YCBEsresp`

## Purpose

Use this handoff to resume True North Map search visibility and visitor-measurement work without recreating provider properties, weakening consent boundaries, or restarting a broad public-route crawl. It records the September 4 implementation and release. The current application, live providers, production deployment, and canonical governance contracts remain authoritative if any dated value below has changed.

## Executive state

- Google Search Console, its BigQuery export, the existing GA4 property, and the existing Bing Webmaster property were retained. No duplicate provider property was created.
- GA4 production collection was repaired and verified at the browser-request boundary after analytics consent.
- Bing Webmaster read access and sitemap health were verified, its reported MDA Space page issues were fixed, and an explicit one-public-URL IndexNow workflow was deployed.
- Vercel Web Analytics, Speed Insights, PageSpeed, first-party telemetry, and the private visibility workflow remain complementary measurement layers.
- The full-route crawl that interfered with another process was terminated. It was not restarted during implementation or release validation.
- `main` and `origin/main` both point to `c63d3d8`. The temporary implementation worktree and branch were removed after production and CI verification.

## Measurement model

The provider roles are deliberately complementary:

| Layer | What it establishes | Important limit |
| --- | --- | --- |
| Google Search Console | Google organic impressions, clicks, queries, pages, CTR, and search position | It does not describe the complete on-site journey |
| Bing Webmaster Tools | Bing search discovery, crawl/indexing state, sitemap state, and link observations | It does not provide general visitor behaviour |
| GA4 | Consented acquisition and behaviour after arrival on eligible production public routes | It is not joined to accounts or provider identities; denied and pre-consent activity is not recovered |
| First-party telemetry | Bounded product and workflow events under the project retention contract | It is deliberately queryless/non-identifying and not a session-replay system |
| Vercel Analytics and Speed Insights | Hosting-side aggregate traffic and performance signals | The project is on a metered Vercel plan; this is not treated as a universally free provider |
| PageSpeed | Lab performance diagnostics | A lab result is not a complete record of real-user experience |

Search Console and GA4 overlap at the search-click/session boundary, but their totals should not be forced to match and they do not form a person-level stitched journey.

## What was found

### Google

- GA4 property `546094525`, web stream `15281181552`, and measurement ID `G-D712W9CJLC` already existed and were linked to Search Console.
- Search Console collection and the Search Console BigQuery export were healthy.
- GA4 production traffic stopped after August 3 because the local gtag shim queued an array. Google's supported queue contract requires the function's `Arguments` object.
- Creating another GA4 property would have fragmented history and was therefore avoided.

### Bing

- `truenorthmap.ca` was already owned and verified in Bing Webmaster Tools.
- Its sitemap was successful and contained approximately 1,300 URLs with no sitemap errors or warnings at the time of review.
- The missing integration was authenticated local read access, not a new Bing property.
- The actionable Bing page warning on `/organizations/mda-space` was caused by a second streamed loading-state H1 and an overlong metadata title.
- The reported homepage image-alt observation could not be reproduced in the local or live rendered page. Bing's backlink-quality observation is a distribution/earned-authority issue, not a safe code toggle.

## Implemented changes

### GA4 collection and reporting contract

- Restored `dataLayer.push(arguments)` in `app/src/components/atlas/public-beta-insights.tsx`.
- Preserved consent-first loading, production-host checks, eligible-public-route checks, queryless page locations, private-route exclusion, denied advertising storage, and disabled Google Signals.
- Retained explicit manual `page_view` collection and the bounded events `tnm_content_view`, `tnm_organic_entry`, `tnm_landing_entry`, `tnm_external_source_open`, and `tnm_working_list_intent`.
- Added `tnm_landing_entry` to the private visibility collector's allowlist.
- Changed GA4 user/event data retention from two months to 14 months.
- Registered event-scoped custom dimensions for `content_type`, `search_engine`, and `entry_path`.
- Marked `tnm_working_list_intent` as a once-per-session key event.
- Left data redaction active and did not enable advertising signals, private-route measurement, or Microsoft Clarity.

### Bing API and IndexNow

- Generated the Bing Webmaster API key and stored it only in ignored local visibility configuration. The key is not recorded in this handoff or Git.
- Verified authenticated Bing query, crawl, and link-count reads and a passing visibility preflight.
- Added `INDEXNOW_KEY` to the documented environment contract and production Vercel configuration without committing its value.
- Added a guarded public key-file route, exact middleware mapping, canonical-path validation, public/private route exclusions, ownership verification, ten-second timeouts, and a single-URL submission client.
- Added `pnpm indexnow:submit -- --path /changed-public-path` as dry-run and the separately authorized `--apply` mode.
- Submitted only `/organizations/mda-space`. IndexNow returned HTTP 202: accepted pending key validation, not proof of crawling or indexing. The request was not retried.
- Recorded WF-06 as a separate manual, explicit-only workflow. It is not part of the read-only visibility workflow and cannot batch, crawl, schedule, retry automatically, publish, or expand a path into a sitemap.

### Bing-reported page repair

- Replaced the organization loading fallback's extra H1 with a non-heading `role="status"` loading header.
- Added a bounded metadata-title helper with a 70-character complete-title ceiling and meaningful descriptor fallbacks.
- The resulting production MDA Space title is `MDA Space — Earth Observation SAR Constellation | True North Map` at 64 characters, with one rendered H1.
- Preserved the fuller capability name for social/detail presentation rather than truncating the underlying record.

## Principal implementation files

- `app/src/components/atlas/public-beta-insights.tsx`
- `app/scripts/tnm-visibility.ts`
- `app/src/lib/seo/metadata-title.ts`
- `app/src/lib/seo/indexnow.ts`
- `app/src/lib/seo/indexnow-submission.ts`
- `app/src/app/api/indexnow-key/route.ts`
- `app/scripts/submit-indexnow.ts`
- `app/src/middleware.ts`
- `app/src/app/organizations/[slug]/page.tsx`
- `app/src/app/organizations/loading.tsx`
- `app/tests/analytics-consent.test.ts`
- `app/tests/indexnow.test.ts`
- `app/tests/seo-metadata.test.ts`

The same release updated the Access and Privacy Matrix, Development Log, Marketing and Outreach Operations, Production Release Runbook, Project Status, and Skills and Automation Map.

## Dated provider baseline

These values are evidence from the implementation review, not evergreen counters:

- Google Search Console, August 5 through September 1: 140 clicks, 15,095 impressions, 0.927% CTR, and average position 15.151.
- Search Console detail: 1,265 page rows, 1,006 query rows, and 109 countries.
- Search Console BigQuery export: 4,691 rows across 28 days, including the same aggregate clicks and impressions.
- Bing, June 3 through September 2: 10 clicks and 992 impressions.
- PageSpeed mobile: score 89, LCP 3,601 ms, CLS 0; INP and CrUX field data were unavailable rather than zero.
- DataForSEO: nine bounded Canada/English tasks costing USD 0.036 during the reviewed run. This provider is paid and is not part of the free core stack.

## Validation and production evidence

- Node 24 `pnpm release:validate` passed: 84 test files and 635 tests, plus lint, research validation, scale validation, dependency/security threshold, and production build.
- `pnpm visibility:validate` passed.
- `pnpm visibility:preflight` passed with every configured provider available and no optional-unconfigured provider.
- A fresh browser test recorded zero Google tag or collection requests before consent, then the expected measurement ID and one queryless `page_view` collection request after consent. A private account path redirected to sign-in with zero GA requests.
- Production `/` returned one H1 and no rendered images missing alt text.
- Production `/organizations/mda-space` returned one H1, the new 64-character title, and no rendered images missing alt text.
- The public IndexNow key route returned HTTP 200 with the exact configured token and non-indexing/no-store response headers before the single provider post.
- Bounded production launch validation covered the five governed core routes plus `/organizations/mda-space`; six pages were checked with zero findings. No representative-family expansion or full-sitemap crawl ran.
- Vercel deployment `dpl_81UphyrVHB6D9YFe1a8YCBEsresp` became `READY`, was aliased to `truenorthmap.ca`, and matched commit `c63d3d8`.
- Exact-deployment runtime logs contained only HTTP 200 and 304 responses. The only grouped runtime error observed belonged to an older deployment and was unrelated to this release.
- GitHub Release Validation run `33900773894` and CodeQL run `33900773844` completed successfully.

## Remaining observations, not failed implementation

1. GA4 Realtime still displayed zero immediately after the synthetic production request, although the browser network trace proved the correctly formed collection request left the site. Confirm appearance in GA4 reporting after provider processing; do not generate repeated test traffic or create another property.
2. Bing's HTTP 202 receipt means IndexNow accepted the notification pending key validation. Confirm URL/indexing state later in Bing Webmaster Tools; do not automatically resubmit it.
3. Backlink quality requires earned distribution and relevant external references. Do not buy links or represent it as a code defect.
4. Revisit the homepage alt warning only if a current rendered page or new Bing crawl reproduces a specific missing-alt element.
5. Microsoft Clarity remains intentionally disabled because session replay expands the privacy, consent, and CSP surface. Ahrefs Webmaster Tools was not activated because it depends on a crawler, and a broad crawl was explicitly out of scope.
6. A GA4 BigQuery link was not added. It has no historical backfill and can create billable storage/query use; the existing Search Console BigQuery export remains healthy.

## Safe next actions

1. Read the existing GA4 property's finalized standard reports for dates after September 4 and confirm new sessions/events appear. Preserve the existing property, stream, consent contract, and custom definitions.
2. Inspect Bing Webmaster Tools for the MDA Space recrawl/index state and IndexNow key validation. Treat provider state as pending until Bing reports it.
3. For an ordinary requested visibility run, use `pnpm visibility:validate`, `pnpm visibility:preflight`, and the governed strict refresh. That refresh inventories the sitemap manifest but fetches only `/`, `/organizations`, `/map`, `/signals`, and `/north-signal` sequentially.
4. Run `pnpm indexnow:submit -- --path /exact-public-path` first for any future changed or deleted URL. Every `--apply` invocation and every additional URL require Andrew's explicit authorization.
5. Never use `pnpm launch:audit` for routine visibility, release validation, or this follow-up. Full traversal belongs only to the explicit, approved `$tnm-site-assurance` workflow with its production acknowledgement and reason.

## Preserved boundaries

- Search providers and analytics do not publish content, modify Supabase, accept research, alter canonical records, send campaigns, or perform outreach.
- GA4 receives no account join, email, free-form search, private-route, administration, submission, connection, or Working List data.
- Denied or pre-consent visitor activity is intentionally unavailable and cannot be recovered.
- Bing and visibility credentials and raw provider responses remain ignored under `research/visibility/local/`; only sanitized allowlisted aggregates may reach the owner-only Command Centre.
- The IndexNow token is a public protocol verification value, not an authentication credential. It must never be repurposed as authorization.
- This release performed no Supabase migration, research staging, Admin Review, canonical publication, MailerLite campaign, outreach, or social post.

## Workspace state at handoff creation

- `HEAD` and `origin/main` are synchronized at `c63d3d8`.
- Four pre-existing modified governance files remain in the main checkout: Development Log, Marketing and Outreach Operations, Project Status, and Skills and Automation Map. They belong to separate Command Centre work and were not staged or overwritten by this handoff.
- Pre-existing untracked research lineage/artifacts remain. Do not use `git add .`, delete them, or infer that they belong to this handoff.
- This handoff is intentionally a new local file. Do not commit or push it unless Andrew separately authorizes that repository action.

## Canonical continuation sources

- `AGENTS.md`
- `context/governance/True North Map Project Overview.md`
- `context/governance/Project Status.md`
- `context/governance/Skills And Automation Map.md`
- `context/governance/Marketing And Outreach Operations.md`
- `context/governance/Access And Privacy Matrix.md`
- `context/governance/Cross-System Change And Regression Contract.md`
- `context/governance/Production Release Runbook.md`
- `context/governance/Development Log.md`
