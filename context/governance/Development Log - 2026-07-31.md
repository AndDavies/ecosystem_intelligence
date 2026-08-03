# Development Log - 2026-07-31

## August 3 Canadian Defence Signals editorial experience

Rebuilt the reusable `/signals/[slug]` presentation as a wide executive briefing without changing the autonomous content contract, source data, publication workflow, newsletter workflow, or core atlas. Each edition now uses a split editorial masthead, generated Bottom Line and table of contents, accessible anchored navigation, consistent article-entry cards, original-source actions, direct LinkedIn and X sharing, contextual continuation, related editions, North Signal signup, and a quiet full-width editorial note at the end. Existing and future source images render through the same normalized edition and item-image fields when available.

Reconciled the Signals archive and article route with the shared public style contract. Added Editorial Blue `#E8F1F4` and its interaction shade `#DCEBED`; assigned bounded tonal roles to environment, activity, and technology tags; removed decorative yellow and grey card outlines; retained a quiet one-pixel edge only for taxonomy pills and pill-shaped links; standardized 18-pixel editorial rounding; and replaced moving hover treatments with stationary shadow, tone, and link-colour responses. The active brand system now makes this the reference for later route-by-route visual alignment rather than silently changing every public route in one release.

## August 3 Canadian Defence Signals image gate

Made cited editorial imagery a required part of every repeatable Daily Signals run. The project-local skill now extracts publisher-declared images from the cited article set, reports all admissible candidates for visual comparison, rejects generic publisher share backgrounds, logos, unrelated stock and undersized assets, and records the selected image URL, cited source page, factual alt text and publisher attribution. The executable packet schema rejects image-less editions, while the publisher always normalizes the source asset to a 1600 x 900 WebP under `brief-images/signals/` before the edition can publish.

Added a narrow, idempotent `--replace-hero` repair path for published editions that predate the image gate. Five July 29 to August 2 backfill editions passed the schema, editorial and image checks and were amended with sourced bucket images; the August 3 edition's existing cited Kraken image was also migrated from an application-local path into the same normalized bucket contract. All six slugs, text, items, original sources, atlas links, publication status and publication dates were unchanged. The active 07:00 Atlantic automation now enforces and verifies the same source, relevance, normalization and no-image-no-publish contract. The core atlas, research queues, review authority, MailerLite and social platforms were not modified.

## August 3 Canadian Defence Signals foundation

Implemented an isolated daily Signals publishing system without changing the canonical research or atlas publication authority. It includes descriptive immutable `/signals/[slug]` URLs, a public archive, source-fact versus automated-read separation, unknowns, next steps, evidence strength, original source links, existing-record navigation, Article and ItemList metadata, sitemap discovery, an administrator correction/archive route, private run health and social drafts, and an idempotent publisher.

The ignored `tnm-daily-signals` skill requires five to eight distinct developments from at least three source families, resolves discovery feeds to durable sources, rejects unsupported repeats, accepts no-publish days, and enforces an executive field-guide narrative before dry-run or publication. Weekly North Signal remains human-reviewed and manually sent. The complete Node 24 release gate passed with 256 tests, lint, dependency audit, 5,000-marker scale validation, and the production build. The schema and follow-up foreign-key indexes are reconciled to the live migration ledger, the first approved edition is published, and the application is deployed. No schedule, social post, MailerLite send, or core-corpus write occurred.

Status: soft-beta project reconciliation and current-state audit

## Scope

This review reconciled the live True North Map product, tracked repository, active local operator systems, brand and launch assets, production database posture, security register, SEO/AEO validation, and next product priorities. It changed governance and memory only. It did not change application code, production data, Supabase configuration, provider configuration, review decisions, publication state, or campaigns.

## August 2 map-first workspace release

The approved focused recomposition keeps `/` as the guided service entrance and
`/map` as the canonical atlas workspace while making the product itself visible
sooner. The real published Kraken Robotics and KATFISH specimen now precedes
the landing worked example and uses a lazy fixed MapTiler view with Kraken
selected and every interaction disabled. The earlier large `/map` introduction is
removed. Search, starting points, filters, sharing, export and evidence guidance
now form one compact control field immediately followed by the live map.

Desktop uses a fixed 380-pixel internally scrolling results rail beside the
map and retains the accessible evidence table below. Mobile adds an explicit
Map/List control and collapsed, preview and expanded synchronized result-sheet
states. Bounds deep links frame the requested geography, selected records are
injected into the synchronized rail and table even when they fall outside the
initial rich-result page, and ordinary URL state survives refresh, sharing,
profile navigation, browser Back, sign-in and Working List handoffs. The
deterministic guided example still canonicalizes to an ordinary `/map` URL only
after successful loading and never calls `/api/discover` or consumes quota.

Release evidence:

- Signed-out browser review passed at 390, 768, 1024 and 1440 pixels with no
  horizontal overflow. The active map began at 631, 507, 433 and 418 pixels
  respectively. Canvas heights were 464, 563, 534 and 624 pixels.
- At 1440 by 900, 482 pixels of active map canvas remained visible in the first
  viewport. The 380-pixel rail scrolled internally while the map, rail, selected
  preview and accessible table remained synchronized.
- Loading, bounds, `start=need`, deterministic example, selected organization,
  mobile sheet states, Map/List, refresh, sharing, profile return, browser Back,
  sign-in return and Working List return paths passed local browser checks.
- `pnpm test` passed 46 files and 250 tests. `pnpm lint`,
  `pnpm launch:validate`, `pnpm scale:validate` and
  `pnpm release:validate` passed. The release gate reported no known production
  dependency vulnerabilities and completed the optimized production build.
- No Supabase migration, data publication, research skill, scheduled task,
  provider configuration, analytics event, authentication contract or
  campaign changed.

## August 2 guided-entry release

The approved guided landing replaces the former atlas-first root without changing the canonical data, review, publication, consent, authentication, or analytics authority. `/` now leads visitors from a need, released Public Need, or Mission Area through a quota-free deterministic example and a real published specimen; `/map` owns the national atlas, Ask True North, filters, shareable state, and Working List handoffs. The worked example ends in an evidence-backed shortlist and Working List rather than a generic instruction to continue exploring.

The final design pass preserves the bounded 480-pixel maritime hero, highlighted opening phrase, Paper caption cutout, three distinct starting-job cards, selected-concept pills, prominent guided-search action, compact map introduction, and secondary LinkedIn/X footer pills. The three exact live coverage measures now occupy a restrained responsive Paper overlay inside the hero image; the separate page-width band and low-value freshness sentence are removed. The brand contract records these choices rather than the earlier filter-only pill rule.

Ask True North now defaults to `gpt-5.6-luna`. A controlled live structured-output call passed with the existing Responses API contract, low reasoning effort, known-record boundary, deterministic preselection and deterministic fallback unchanged. No new index, web tool, saved model response, database migration, or publication path was introduced.

### August 2 shared-brand and research-intake repair

- The shared public header now owns the approved Inter navigation typography.
  Landing, map, and public detail routes no longer depend on route-wrapper
  inheritance, so the navigation face, size, and weight remain stable between
  pages. Barlow remains reserved for the logo, hero, editorial headings, and
  selected brand display moments.
- `content/brand/True North Map Brand System.md` remains the single canonical
  brand document. The obsolete April COVE brand audit was removed; approved
  source artwork and historical evidence assets were retained.
- Refresh staging was failing closed because the trusted `service_role` intake
  called the private immutable baseline parser through a trigger without the
  parser's execute privilege. Migration
  `20260802154618_grant_refresh_staging_helper_to_service_role.sql` grants only
  that function to `service_role`; `anon` and `authenticated` remain denied,
  and review, approval, publication, and canonical-record authority are
  unchanged.
- The validated North Vector Dynamics refresh was then staged through
  `public.stage_research_candidates_for_review`. Production verification found
  one pending refresh card with eight proposed operations. No candidate was
  accepted or published.

The first production smoke exposed `DYNAMIC_SERVER_USAGE` on dossier routes because the new safe `returnTo` query state was being read inside their earlier on-demand static rendering contract. Organization and capability dossiers now render dynamically while their bounded record loaders retain the existing five-minute server cache. This preserves safe map context without loading the national snapshot or allowing a query-dependent page to enter the static cache.

### August 2 release-hardening reconciliation

- National discovery is assembled from deterministic 1,000-row relation pages, with each bounded page stored under the shared `atlas-public` five-minute cache tag. This preserves the complete map without storing the uncapped corpus in one provider-limited item.
- Public reads keep one retry and now add a short randomized delay. Middleware is restricted to the legacy root bridge and routes that actually require authentication refresh or protection.
- The application and CI runtime is pinned to Node 24. GitHub Actions runs the complete release gate on `main`; CodeQL, complete dependency auditing, Dependabot vulnerability alerts, secret scanning, and push protection provide supply-chain checks without automated update branches.
- Local migration and rollback filenames now match the applied production Supabase versions exactly. No SQL was executed and no database object changed.
- Superseded launch exports, generated reports, and the private newsletter export were removed from the current tracked tree. Historical governance is isolated under `context/archive/governance/`; the current broader-beta kit remains the only active launch package.
- A production-only Vercel Firewall observation rule for unusually frequent `/organizations` GET traffic is staged with a log-only action. It is not active until the owner explicitly reviews and publishes it.

## August 1 pre-release UX candidate

This historical candidate refined the approved landing and `/map` handoff without changing the public-data, publication, authentication, consent, or analytics authority. The landing uses visitor-facing **Search focus** controls for a fixed deterministic example; it carries only allowlisted focus IDs into a normal refreshable `/map` state, never calls Ask True North, and does not consume its quota. The map presents the selected focus as removable controls and preserves safe local context through profile, evidence, Working List, and sign-in actions. Public evidence language is normalized to Source-backed fact, Our assessment, Coverage gap, Evidence strength, and Last reviewed. The August 2 map-first workspace release above supersedes its local-candidate status.

### August 1 local verification update

- Independent read-only QA identified and the candidate corrected two release blockers before final verification: unsafe backslash/control-character return paths across profile, Working List, sign-in, and contribution flows; and missing URL serialization when the map viewport changed. Return paths now use one same-origin guard, while viewport changes replace rather than append history and retain current bounds in shareable map context.
- `pnpm release:validate` passed: production dependency audit, 46 test files / 246 tests, lint, 5,000-marker scale validation, and optimized production build all completed successfully.
- Browser checks on `/` and the guided `/map` state at 390, 768, 1024, and 1440 pixels found no horizontal overflow. The controls report their `aria-pressed` state, meet the 44px target, disable the CTA at zero selections, strip the temporary `example` parameter after the map is ready, retain map focus/bounds in return links, and let visitors remove a focus chip. Normal `/map` retains the ordinary, non-guided orientation.
- The production-base `pnpm launch:validate` did not complete: the current production crawl aborted on a timed-out request. This checkout’s new `/map` route is also not yet deployed (the production route returned 404 in the direct check), so a clean post-deployment launch crawl remains required. No deployment or production state changed in this verification.

## Verified production baseline

- `main` and `origin/main` were aligned at the July 31 regional-imagery deployment when the audit began.
- Supabase project `facoactpdckkhciamflk` reported `ACTIVE_HEALTHY` in `us-west-2`.
- `/api/health`, the homepage, Organizations, Regions, Public Needs, Defence Briefs, How It Works, and the Kraken Robotics profile returned successfully.
- Current public route time to first byte in the direct smoke was roughly 0.12 to 0.42 seconds. Full transfer for the checked pages remained below roughly 0.54 seconds in that sample. This is a dated audit sample, not field Core Web Vitals.
- `pnpm security:validate` reports on the complete production and development dependency graph.
- `pnpm launch:validate` checked 645 canonical public pages with zero findings, zero orphan candidates, and zero duplicate titles.
- Browser checks at 390, 768, 1024, and 1440 pixels found no horizontal overflow on the sampled core routes. No console warning or error appeared in the audited public flow.
- The live response still uses private no-store homepage HTML, exposes `X-Powered-By`, and retains dormant Clarity hosts in the CSP. Those items remain in the security and reliability register.

## Live operational state

A read-only production snapshot found active work in the research-candidate, contribution, connection, contact, feedback, and subscriber surfaces. At audit time there were 50 pending candidate changes, three pending submissions, one new connection request, one new contact message, one pending feedback item, and three subscribed update records. These totals are included only as dated audit evidence. Every agent must re-read production before acting because the queues may change independently of this file.

The canonical published Mission Area / Use Case layer is ready to support a public browsing slice. At audit time the four published mission areas all had substantial reviewed capability coverage. Exact totals remain a live database fact and are not repeated in operating contracts.

## Repository state

The deployable public application was aligned with production. The primary worktree also contained intentional, uncommitted work across:

- claim-led research contracts and OSINT normalization;
- private visibility tooling and fixtures;
- Source Book and North Signal source-registry material;
- candidate-logo preparation;
- immutable research run, lead, candidate, review, staging, claim-ledger, collection-plan and signal lineage;
- a large local lookbook/collateral workspace.

This is not evidence of production drift. It is a release-control risk if staged indiscriminately. Application/governance releases, validated research lineage, and private ignored operator artifacts must remain separately reviewed.

## Public experience audit

Accepted audit screenshots are stored in `output/audits/soft-beta-2026-07-31/`.

### 1. Homepage: healthy

The current split hero communicates the product quickly, shows live breadth without blocking first paint, keeps Ask True North immediately adjacent, and uses the brand system consistently. The first desktop viewport establishes value, evidence posture, and the primary action. On mobile, the hero is legible and actions remain visible, but the image pushes Ask True North below the first viewport. This is acceptable because the primary action anchors directly to discovery; it should be monitored rather than redesigned again.

### 2. Organizations: healthy with mobile density friction

The route clearly explains the task and its streamed coverage cards provide useful context. On mobile, the coverage cards consume the initial viewport before the visitor sees a real organization. The next refinement should compress those metrics into a horizontal summary or move the first useful result above part of the snapshot without hiding coverage caveats.

### 3. Regions: healthy with excess introductory height

The approved regional imagery makes the route more memorable and the national-to-regional pattern is easy to understand. The editorial introduction and whitespace are generous enough that the national card begins low in the desktop viewport. Reduce vertical spacing before changing art or adding more decorative content.

### 4. Public Needs: strong trust design

The page explains where a public need comes from and distinguishes fact from assessment before displaying records. The evidence legend and caveat are clear. The long headline and dense legend should be checked whenever mobile copy or icon treatment changes, but there was no sampled overflow.

### 5. Defence Briefs: visually strong, cadence-sensitive

This is the strongest content-led route and a useful acquisition surface. Its future value depends on freshness and internal linking, not another layout change. A repeatable editorial cadence should connect Briefs to Mission Areas, Public Needs, organizations, and North Signal.

### 6. How It Works: healthy

The five-step explanation and evidence boundary make the product understandable to a first-time visitor. It should become the contextual trust destination for the future Mission Area pages and outreach links.

### 7. Organization profile: decision-useful

The Kraken profile shows the intended evidence-led dossier depth, clear actions, approved logo, technology section, evidence states, and breadcrumbs. The action cluster is dense but usable on desktop. Continue to monitor mobile action ordering and only surface fields supported by public evidence.

## Brand and collateral reconciliation

- The Directional N is the approved and deployed True North Map identity.
- North Signal is the editorial briefing name, not the public name of the logo symbol. Legacy asset filenames may retain `north-signal-mark` for compatibility.
- North Ink, Field, Paper, Signal Yellow, Evidence Green, Barlow, Inter, restrained rounded geometry, and evidence-first states remain the approved system.
- Regional imagery is current and deployed.
- The Phase 2 screenshots, LinkedIn banner, walkthrough, partner overview, and deck predate the Directional N or later interface changes. They are historical references and require a dated replacement package before broad distribution.
- No additional global aesthetic redesign is recommended. Future imagery should help orientation or editorial understanding rather than decorate directories.

## Security and reliability review

The production dependency gate is clear and the prior citation-scope and public-rationale blockers are deployed. Current Supabase security advisors showed five informational deny-by-default RLS notices and two known warnings: the authenticated security-definer Defence Brief RPC and leaked-password protection. The latter remains an accepted trigger because the public product does not accept passwords.

Supabase performance advisors reported overlapping permissive RLS policies, unused indexes, and an absolute Auth connection strategy. These are not evidence of a current breach or outage. They are recorded in `Security And Reliability Remediation Log.md` with bounded verification triggers.

## Recommended implementation order

1. **Pre-promotion security and operations pass.** Triage the live queues, remove dormant Clarity CSP hosts and `X-Powered-By`, narrow the Defence Brief RPC execution surface, add strict submission payload and per-account limits, and replace the stale-publication retry SQLSTATE.
2. **Mission Area / Use Case discovery.** Add `/missions` and `/missions/[slug]` using only published mission areas, reviewed capability relationships, current public evidence, visible gaps, and existing organization/technology routes. Do not create a second taxonomy or infer new missions. Link from How It Works, relevant technologies, Public Needs, Briefs, and the map.
3. **Mobile collection refinement.** Bring the first real organization higher on `/organizations`, reduce Regions introduction height, preserve streamed loading geometry, and rerun the four-width browser matrix.
4. **Content and internal-link cadence.** Publish a consistent Defence Brief and North Signal rhythm, create source-backed links into Mission Areas and Public Needs, and refresh older high-value pages when new evidence arrives.
5. **Current launch package and distribution.** Rebuild the LinkedIn banner, screenshots, walkthrough, partner overview, and media deck with the Directional N and current interface. Then run founder-led LinkedIn, included-organization verification, ecosystem partner, media, and builder-community waves with source-specific UTMs.
6. **Scale follow-up.** Separate the anonymous cacheable public shell from auth-state requests, watch the growing homepage/directory transfer size, and consolidate overlapping public-read/staff RLS policies without weakening authorization.

## Implementation outcome

The six-step sequence was implemented in order in the current local release candidate:

1. **Security and operations:** tightened public payload validation and quotas, reduced fingerprinting and dormant-provider surface, and applied the reviewed RLS/security migration without changing public-data or publication authority.
2. **Mission discovery:** added `/missions` and `/missions/[slug]` over the existing published Mission Area taxonomy and reviewed relationships, with clear assessment caveats and cross-links into organizations, technologies, Briefs, and Working Lists.
3. **Mobile and Regions:** compressed the mobile Organizations summary, preserved streamed loading geometry, and corrected regional-card imagery to fill consistent 4:3 card frames without changing the approved art or regional record content.
4. **Content links:** connected Defence Briefs, organizations, technologies, Public Needs, and Mission Areas using existing reviewed relationships; no new public fact or relationship was inferred.
5. **Launch package:** rebuilt the broader-beta package under `content/launch/broader-public-beta-2026-08/` with current screenshots, Directional N assets, channel copy, response guide, 30-second walkthrough, partner PDF, and partner/media deck. The earlier Phase 2 package remains historical.
6. **Scale and operations:** added deterministic paged reads for every discovery relation, same-snapshot public counts, linear-time grid grouping for the fallback map, a 5,000-marker scale gate, direct non-sensitive health checks, and launch probes that compare summary, atlas total, complete markers, and bounded rich results while surfacing recovered retries.

Steps 1 through 5 are functionally complete in the release candidate. Step 6 source work is complete locally but its production-specific cache, crawl-warning, catalogue-consistency, runtime-log, and field-performance checks remain release activities. `REL-2026-003` and `REL-2026-004` are therefore not closed in this log.

## Final local release-candidate verification

The complete six-step release candidate passed the integrated local release gate after the final regional-image and scale changes:

- `pnpm release:validate` passed with no known production dependency vulnerabilities.
- All 43 test files and 235 tests passed.
- Lint and the clean Next.js production build passed.
- The 5,000-organization scale fixture retained all 5,000 map markers, bounded rich cards to 18, serialized below the 1.5 MB budget, and completed both projection and fallback clustering below the 300 ms budget.
- The four-width browser matrix and sampled public, member, and administrator routes showed no horizontal overflow or broken images. Anonymous private routes retained the normal sign-in boundary.
- The local health, summary, and atlas probes agreed on catalogue availability and complete marker coverage.
- The production canonical crawl remained a healthy pre-deployment baseline, but production still returns the prior health response until this release candidate is approved and deployed. Production verification remains required before closing the open reliability items.

## Verification limits

- Screenshot inspection and responsive geometry checks do not prove WCAG conformance or screen-reader quality. Full keyboard, focus, contrast, semantic announcement, and assistive-technology checks remain part of release regression.
- The direct timing sample is not a Core Web Vitals field dataset and does not substitute for Vercel or Google field measurements.
- Authenticated member and administrator workflows were not modified or replayed in this documentation-only task.
- Vercel runtime logs were not changed or cleared; inspect them again immediately before broader promotion.
