# Cross-System Change And Regression Contract

Status: canonical operating contract
Owner: Andrew Davies
Last reviewed: 2026-09-06
Effective: 2026-07-26


## Purpose

Shared execution, workspace safety and affected-dependency maintenance are owned by the [Codex Workflow Contract](Codex%20Workflow%20Contract.md). This reference owns validation selection, not another startup sequence.

True North Map is one product made from several connected systems. A change that looks local can affect public discovery, evidence, publication, privacy, analytics, search visibility, launch collateral, or the research pipeline. This contract keeps those relationships visible and makes regression testing proportionate, explicit, and repeatable.


## Impact map

| Change area | Also inspect | Minimum verification |
| --- | --- | --- |
| Public layout, navigation, or copy | Accessibility, responsive layout, analytics event continuity, SEO metadata | Unit tests, lint, affected routes at 390/768/1024/1440, keyboard and overflow checks; create screenshots only when explicitly requested |
| Organization, capability, region, mission, map, or search | Compact national projection, deterministic Data API paging, pagination, filters, URL state, API shape, Ask True North eligibility, exports, public profile allowlists, bounded citation hydration and dossier-family parity | Tests, lint, 5,000-marker scale gate where map loading changes, public summary/atlas count comparison, API and route smoke; for dossier-view/citation changes add the exact-deployment cold-dossier gate across high-citation, sparse, recently updated and coverage-fill records; verify first-viewport map geometry, the 380-pixel desktop rail, mobile sheet states, Map/List control, and accessible table when `/map` changes |
| Supabase schema, RLS, storage, or server action | Anonymous/member/admin matrix, migrations, review and publish, caching and revalidation, private-data exposure, public JSON allowlists, irreversible cleanup and application/schema order | Migration/RLS tests, release validation, exact repository/live-ledger comparison, application-before-cleanup proof, public-response forbidden-key scan, security advisors, production smoke |
| Research executable schema, staging, Review or Publish changes | Downstream executable contracts and candidate compatibility | Focused local pipeline tests and scoped artifact validation; deployed compatibility and Review checks only during an authorized intake or release. Instruction-only edits follow the testing policy below. |
| Canonical organization repair | Exact organization, aliases, capabilities and child graph; saved items; active connection requests/submissions; incoming relationships/redirects; Signals/public Briefs links; successor and redirect graph; route/cache effects | Strict candidate/snapshot tests; duplicate ID/URL and identity/domain collision tests; all six operations; every protected dependency; stale target/alias/capability/dependency/successor; cascade isolation; immutable one-hop redirect; forced rollback; individual Review then separate Publish; no batch controls |
| Publication or Admin Review | Candidate display, evidence, duplicate handling, stable IDs, route revalidation, audit events | Unit/integration tests, accepted-to-publish flow, affected public routes |
| Demand Signal or demand match | Released-source gate, issuer hierarchy, evidence snippets, capability relationship, public caveats | Source-gate tests, suggestion exclusion, relationship preservation, public rendering |
| Ask True North or OpenAI | Published-corpus selection, deterministic fallback, evidence links, telemetry, rate limits, privacy | Success, slow provider, provider failure, rate limit, fallback, no invented records |
| Authentication or account | Google and email paths, safe returns, sign-out, account switching/deletion, exact admin gate, email delivery | Anonymous/member/non-admin/admin matrix, fresh login, stale token, email delivery |
| Analytics, newsletter, feedback, or contact | Global and stream-specific consent, private-route exclusion, masking, retention, event idempotency, raw-ledger preservation, distinct-session scorecard filtering, MailerLite lifecycle/group separation, webhook replay/staleness, delivery aggregates | Weekly-only, weekly+alerts, alerts-only and global-withdrawal states; active-subscriber weekly-only and post-deploy backfills; focused-flow suppression; 50%-for-one-second impressions; modal-only opens; query/PII rejection; >5,000-row aggregation; QA/staff/test exclusion without raw-event deletion; group/global webhook retry and stale-event tests; RLS/grants and scheduled retention |
| SEO, AEO, structured data, or sharing | Canonicals, sitemap freshness, robots, normalized internal links and referrers, explicitly marked durable outbound sources, social image crops, visible-source claims | Visibility validation, bounded post-deploy launch gate, structured-data and share preview checks; add the paced full launch audit only after a manual explicit request for major sitemap/internal-link architecture changes, periodic assurance or a broad audit; confirmed broken marked sources block while bot-restricted and transport-unknown results are reported separately |
| Internal-link graph, continuation module, or filtered-map route | Organization-first destination priority, reviewed relationship wording, native anchors, contextual degree, click depth, compact map payload, analytics privacy and reciprocal route coverage | `pnpm links:inventory`, graph and route tests, lint, responsive and keyboard checks at 390/768/1024/1440; `pnpm scale:validate` when map projection/filtering changes; the database inventory measures eligible reviewed edges while only an explicitly authorized `pnpm launch:audit` proves rendered-site coverage |
| Loading, empty, error, permission, or not-found state | Route geometry, recovery links, private-data boundaries, robots, keyboard focus, and screen-reader announcements | Scoped state tests, one-H1 and overflow checks, affected routes at 390/768/1024/1440, clean build, and bounded post-deploy route validation |
| Brand asset or explicitly requested collateral | Approved copy, typography, contrast, favicon, social cards, production freshness | Asset dimensions, responsive rendering, PDF/video inspection, metadata previews; keep generated output local unless source control is explicitly approved |
| Defence Brief or editorial content | Public sources, Derived Reads, related records, hero image, Article schema, private draft and source-material boundary | Source/link checks, Article metadata, mobile reading layout, admin edit/publish |
| Canadian Defence Signals | V3 significance-led length, claim-specific evidence, immutable source snapshots, atomic edition/run finalization, distinct editorial/blocked/failed outcomes, optional source image, retryable private social packaging, stable RSS identity and no core-corpus write | Variable counts/depth; shared-page distinct events; immutable historical evidence; nullable fields; v1/v2 identity-safe repair; 1 MiB packet protection; helper pagination/cache/resumption; precommit rollback and postcommit survival; no public effects for nonpublishing outcomes; RLS; source links; Admin correction/archive; RSS no-backlog/no-duplicate/correction; responsive and keyboard reading |
| North Signal acquisition, preference, delivery or issue contract | One newsletter; weekly default and separately consented alert preference; Supabase global/stream consent authority; MailerLite sync isolation; bounded UTM attribution; separate GSC/GA/funnel/consent/delivery denominators; `/north-signal` metadata; `/signals` proof links; RSS summaries; preserved Brief archive; current feed-register health; original-source lineage; private review/send authority | Atomic consent/success and retry tests; no-alert backfill plus post-deploy reconciliation; provider receipt, stale-event, group/global withdrawal and failure-state tests; shown/open/form/submit/success ordering and historical-placement reporting; >5,000 event paging; production-host/queryless-GA/accounts.google classification; QA/staff exclusion; landing/popup at 390/768/1024/1440 plus keyboard/focus/zoom checks; RSS stable GUID, current baseline, no backlog, no duplicate and no-publish tests; v2 issue accepts the complete fixture and rejects missing Signal links, unknown/discovery-only sources, duplicate sections and Brief links; provider presentation and links are tested manually without implying provider-change or send authority |


## Validation levels

All application and release commands run on the repository-pinned Node 24 runtime. Local results produced by an unsupported Node version are not release evidence. GitHub Actions reruns the complete release gate on `main`; CodeQL and Dependabot vulnerability alerts supplement rather than replace the required functional, browser, data-boundary, and production checks below. Automated dependency-update branches remain disabled under the approved main-only release workflow.

Clean CI builds must not require privileged production database credentials. The release workflow receives only the Supabase URL and publishable browser key through GitHub repository variables. Service-role, provider, research, visibility, MailerLite, OpenAI and Turnstile secrets remain outside GitHub. Public record routes that cannot safely enumerate static parameters use on-demand rendering with the same bounded revalidation contract.

### Testing scope and production request cost

Use the shared testing and metered-request rules in the Codex Workflow Contract.

Documentation and Codex instruction-only changes require governance/link checks and the affected local skill validators. This includes research-skill prose, routing and governance-validator expectation corrections that do not change executable research behaviour. Do not run archive-wide research validation, production data readiness, staging or live Review checks for these edits. For a genuine authorized research run, use its complete same-run finalizer validation and guarded intake/reconciliation; valid completed candidates proceed to database Admin Review without another approval checkpoint. No-change, research-required, blocked and interrupted outcomes remain truthful, and human acceptance and Publish remain separate. They do not require the integrated application suite, a build, live provider calls or production route requests. Application changes retain the required local test/lint gate; a production release retains Level C. A passing composite command satisfies its constituent checks: do not rerun security, typecheck, tests, lint or scale separately after `release:validate` succeeds unless a relevant input changed or diagnosis requires it.

### Level A: scoped development check

Use the smallest relevant local checks for the changed behaviour; reuse passing results while inputs remain unchanged.

### Level B: integrated application check

For application or executable shared-contract work (not documentation-only edits):

```bash
pnpm typecheck
pnpm test
pnpm lint
```

Add the applicable domain validator:

```bash
pnpm research:validate
pnpm visibility:validate
pnpm launch:validate
pnpm scale:validate
```

`visibility:validate` is a separate local operator check and applies only when private visibility work changes. A visibility provider refresh checks robots and the complete sitemap manifest each time, then fetches exactly `/`, `/organizations`, `/map`, `/signals`, and `/north-signal` sequentially under `bounded_core_v1`, with delayed sampled-route retry and a repeated-pressure circuit breaker. It never traverses the sitemap, and the retired `--refresh-technical` option fails before collection. `launch:validate` is a bounded live-origin gate and is authoritative only after the exact candidate commit is deployed; it must not be used before push to claim that uncommitted code is live. Before push, use route tests, the required browser matrix and `release:validate`. After Vercel is ready, `launch:validate` checks the exact deployed commit, operational consistency, sitemap, five core routes and explicitly affected public paths. Dynamic-family representatives are opt-in only for shared renderer, metadata, navigation or family-contract changes. An RSC error digest, an unresolved streamed or route loading shell, or a dynamic-metadata failure is an operational blocker even when the HTTP status is 200. One recovered retry is advisory and requires a direct recheck plus log review; two recovered routes, strict-mode recovery or a live error cluster block closure. `launch:audit` is the serialized, paced, health-aware full-site inventory owned by explicit-only `$tnm-site-assurance`. Production refuses to start it without the exact acknowledgement and an approved major-information-architecture, manual-periodic-assurance, explicit-broad-audit, or systemic-diagnosis reason. It is not scheduled, included in CI, inferred from a change, or run as a load test. `scale:validate` uses a deterministic 5,000-marker fixture to verify complete projection, bounded rich results, serialized-size budget, and fallback-clustering responsiveness without touching production.

### Complete reads and private workflow boundaries

Rich and compact corpus reads, exports, related-record discovery, Admin search and duplicate checks must page every required relation and use bounded ID batches. A page-size or display-example limit must not silently become a corpus limit. Private CSV exports fail on partial consent reads and neutralize spreadsheet formulas in text fields. A public transient fallback expires from the last successful read and cannot be prolonged by repeated errors. Explorer response races must not replace newer filter/view intent.

Ask authorization reserves paid attempts atomically before provider work, uses a stable server-derived subject, and fails closed independently of optional telemetry. Direct authenticated database writes must enforce pending submission state, server-controlled quota timestamps and existing Working List text bounds. Source-image fetches share HTTPS/public-address validation, DNS pinning, bounded redirects, a deadline and decoded-byte limits; optional packaging failure retains the text-led Signals path. Exercise direct routes and database roles as well as the normal forms.

### Level C: production-release check

Before merge to production or wider promotion:

```bash
pnpm release:validate
```

`release:validate` begins with the production dependency gate. High or critical known vulnerabilities fail the release before tests and the clean build run. The active finding and remediation history is maintained in `Security And Reliability Remediation Log.md`.

Then complete the relevant browser matrix at 390, 768, 1024, and 1440 pixels, verify access roles, and confirm the production build. For map-affecting releases, test one activated dossier, a second activated dossier, a legacy profile, and a cold `/map` selection; require a visible rendered map or explicit text fallback, zero broken images, preserved selected-record state, and OpenStreetMap fallback when MapTiler preflight fails. After deployment, check `/api/health`, `/api/atlas/summary`, `/api/atlas?page=1&pageSize=18`, the homepage, affected public routes, sign-in when relevant, Vercel build/runtime logs, and live Supabase state. The summary organization count, atlas total, and complete marker collection must agree; rich records must remain bounded to the requested page size.

When the organization dossier view, public citation hydration or public profile
projection changes, also run `pnpm dossier:cold-validate` only after the exact
candidate deployment is ready. The gate must cover at least ten activated
dossiers spanning high-citation, sparse, recently updated and coverage-fill
records; verify the anonymous security-invoker view, public organization API,
route stream and metadata, a non-zero approved citation trail, no forbidden
lineage keys, and default p95 budgets below 500 ms for the anonymous view and
below 2,500 ms for the public organization API. A warm local route, successful
build or one hand-picked dossier cannot satisfy this gate.

For a Daily Signals release, verify `/signals`, an existing descriptive edition, v3 local preview, original source links, Article/ItemList metadata, sitemap, anonymous read/non-staff write denial, Admin correction/archive, and unchanged core-corpus counts. Exercise optional hero and private packaging states without generating a current edition. Prove v1/v2 cannot create new editions and exact historical repair remains available. New-format publication requires the compatible migration, snapshot and atomic finalizer; postcommit packaging failures cannot undo publication. Install the revised skill only after compatible deployment. Daily Signals is manually invoked from Andrew's chat; no scheduling contract or automation remains.

For a landing, dossier-geography, or map-workspace release, also verify that `/` loads only the
lazy fixed non-interactive specimen, an activated organization dossier renders a non-broken fixed map or its explicit text fallback, `/map` places the fully interactive
live map in the first viewport, bounds and selected-record deep links survive
refresh and sharing, the deterministic guided example does not call Ask True
North or consume quota, and profile, browser-Back, sign-in, and Working List
return paths preserve ordinary map state. Provider failure must fall back to
OpenStreetMap without a broken image, blank canvas, or lost selected record.


## Research and publication regression

Research completion means a validated private candidate is visible in Admin Review. It does not mean the record is accepted or public. Publication requires a separate human action and post-publication route verification.

Queue regressions must cover more than one display page and more than one research run. Verify exact pending and approved totals, stable run grouping and filters, page navigation that retains the run, individual decisions, and a 50-candidate run-scoped batch acceptance. Batch review must be all-or-nothing, write one decision per candidate, reuse only the stored record-specific reviewer rationale, reject unsupported or duplicate-blocked candidates, and leave every canonical/public row unchanged. The approved queue must keep runs distinct and publication must remain a separate explicit transaction.

When executable research schema, intake, Review or Publish behaviour changes, verify the affected chain end to end during its authorized validation/release. Instruction-only changes do not run this chain:

```text
Live coverage and taxonomy
  -> source discovery or signal refresh
  -> deterministic qualification
  -> candidate construction
  -> evidence and citations
  -> private logo disposition for organization candidates
  -> deterministic stewardship
  -> private Admin Review
  -> human acceptance
  -> explicit Publish
  -> canonical record and route revalidation
```

Never stage a candidate kind that the deployed `/api/system/research-contract`, Admin Review route, and Publish path cannot all support.

For `tnm-research-pipeline/1.7.3`, explicitly test a
null executive summary, a supported non-null 80-to-1,200-character summary, a
missing-citation rejection, exact refresh-operation preview parity, the labelled
Admin Review assessment, acceptance without a public write, and both new and
refresh Publish paths. The migration, deployed contract and complete chain must
remain version-aligned before intake.

For the 1.8.0 canonical-repair contract, additionally test exact snapshot parity, duplicate source IDs and normalized URLs, the six-operation allowlist, all protected dependencies, stale target/alias/capability/dependency/successor state, exact archival cascades with unrelated records unchanged, immutable redirects, a forced mid-publication rollback, ordinary batch exclusion, defer/reject lifecycle and individual Review followed by distinct individual Publish. None of these tests makes a repair stageable before production advertises v4/1.8.0 and the repair schema.


## Visibility and content regression

The visibility workflow produces private evidence for decisions, not public facts or publication authority. Raw provider data stays local. A full refresh paginates every configured live provider and runs the complete approved DataForSEO seed set; it checks robots and the complete sitemap manifest on every run, then inspects only the five governed core routes sequentially. Full-site traversal is exclusively the guarded `$tnm-site-assurance` `launch:audit` operation and is never an implicit visibility step. Technical-issue comparisons are omitted unless both snapshots use the same inspection scope and exact sampled URLs. The workflow does not inspect credits, cap tasks, reuse same-day provider panels, or change billing. Recommendations must map to an existing useful public surface or a reviewable content brief. Any resulting public change follows the normal product or editorial review path and then the public-route regression checks.
