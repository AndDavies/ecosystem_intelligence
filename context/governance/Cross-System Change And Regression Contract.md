# Cross-System Change And Regression Contract

Status: canonical operating contract

Effective: 2026-07-26

Last reviewed: 2026-08-05

Owner: Andrew Davies

## Purpose

True North Map is one product made from several connected systems. A change that looks local can affect public discovery, evidence, publication, privacy, analytics, search visibility, launch collateral, or the research pipeline. This contract keeps those relationships visible and makes regression testing proportionate, explicit, and repeatable.

## Start every material task here

1. Read `True North Map Project Overview.md` and `Project Status.md`.
2. Run `git status --short --branch` in the active worktree.
3. Identify whether the relevant state is deployed, tracked but not deployed, active and uncommitted, or private and ignored.
4. Read production for live corpus, taxonomy, queue, subscriber, and publication state when those facts affect the task.
5. Name the systems touched before editing.

## Repository and deployment strategy

- `main` is the production branch and the normal implementation path.
- Do not leave feature work isolated across multiple long-lived branches or worktrees.
- Use a preview branch only when Andrew explicitly requests a production-like visual checkpoint that cannot be reviewed locally. Remove or merge it promptly after the decision.
- Before staging, separate deployable application and governance work from local research, visibility, raw lineage, provider exports, and large collateral artifacts. Never use `git add .` as a substitute for that review.
- A project-context sync is part of completion when a material change alters the public journey, production architecture, evidence or publication boundary, brand, launch posture, skills, scheduled operations, or open security posture. Update the overview, status, affected specialist contract, and changelog in the same change. Memory is updated only when Andrew explicitly requests it.

## Impact map

| Change area | Also inspect | Required documentation | Minimum verification |
| --- | --- | --- | --- |
| Public layout, navigation, or copy | Accessibility, responsive layout, analytics event continuity, SEO metadata | Overview, status, brand packet when language or identity changes | Unit tests, lint, affected routes at 390/768/1024/1440, keyboard and overflow checks; create screenshots only when explicitly requested |
| Organization, capability, region, mission, map, or search | Compact national projection, deterministic Data API paging, pagination, filters, URL state, API shape, Ask True North eligibility, exports | Overview and relevant data/admin contract | Tests, lint, 5,000-marker scale gate where map loading changes, public summary/atlas count comparison, API and route smoke; verify first-viewport map geometry, the 380-pixel desktop rail, mobile sheet states, Map/List control, and accessible table when `/map` changes |
| Supabase schema, RLS, storage, or server action | Anonymous/member/admin matrix, migrations, review and publish, caching and revalidation, private-data exposure | Admin/Data Contract, Status, migration notes | Migration/RLS tests, release validation, security advisors, production smoke |
| Research schema or skill | All downstream skills, executable pipeline schema, deployed research contract, Admin Review and Publish support | AGENTS, pipeline docs, skill references, status | Data readiness, research validation, smoke/staging compatibility, review-card inspection |
| Publication or Admin Review | Candidate display, evidence, duplicate handling, stable IDs, route revalidation, audit events | Admin/Data Contract and status | Unit/integration tests, accepted-to-publish flow, affected public routes |
| Demand Signal or demand match | Released-source gate, issuer hierarchy, evidence snippets, capability relationship, public caveats | Overview terminology, Admin/Data Contract, methodology | Source-gate tests, suggestion exclusion, relationship preservation, public rendering |
| Ask True North or OpenAI | Published-corpus selection, deterministic fallback, evidence links, telemetry, rate limits, privacy | Overview/status and API notes | Success, slow provider, provider failure, rate limit, fallback, no invented records |
| Authentication or account | Google and email paths, safe returns, sign-out, account switching/deletion, exact admin gate, email delivery | Access/privacy matrix and runbook | Anonymous/member/non-admin/admin matrix, fresh login, stale token, email delivery |
| Analytics, newsletter, feedback, or contact | Consent, private-route exclusion, masking, retention, MailerLite sync, webhooks | Privacy, status, runbook | Consent states, focused-flow suppression, sync/webhook, scheduled retention |
| SEO, AEO, structured data, or sharing | Canonicals, sitemap freshness, robots, internal links, social image crops, visible-source claims | Visibility skill/report contract and brand system | Visibility validation, low-rate launch crawl, structured-data and share preview checks |
| Loading, empty, error, permission, or not-found state | Route geometry, recovery links, private-data boundaries, robots, keyboard focus, and screen-reader announcements | Overview, route contract, and development log when shared language changes | Scoped state tests, one-H1 and overflow checks, affected routes at 390/768/1024/1440, clean build, and low-rate crawl |
| Brand asset or explicitly requested collateral | Approved copy, typography, contrast, favicon, social cards, production freshness | Brand System and the requested deliverable's source note | Asset dimensions, responsive rendering, PDF/video inspection, metadata previews; keep generated output local unless source control is explicitly approved |
| Defence Brief or editorial content | Public sources, Derived Reads, related records, hero image, Article schema, private wiki boundary | Brief/editorial contract and status | Source/link checks, Article metadata, mobile reading layout, admin edit/publish |
| Canadian Defence Signals | Durable sources, fact/read separation, unknowns, duplicate fingerprint, immutable descriptive slug, mandatory private LinkedIn and X examples, no core-corpus write | Overview, status, Daily Signals skill and route contract | Packet validation, migration/RLS chain, dry-run and idempotent apply, current-edition social-example verification in Admin, metadata, sitemap, admin correction/archive, 390/768/1024/1440 reading layout |

## Validation levels

All application and release commands run on the repository-pinned Node 24 runtime. Local results produced by an unsupported Node version are not release evidence. GitHub Actions reruns the complete release gate on `main`; CodeQL and Dependabot vulnerability alerts supplement rather than replace the required functional, browser, data-boundary, and production checks below. Automated dependency-update branches remain disabled under the approved main-only release workflow.

Clean CI builds must not require privileged production database credentials. The release workflow receives only the Supabase URL and publishable browser key through GitHub repository variables. Service-role, provider, research, visibility, MailerLite, OpenAI and Turnstile secrets remain outside GitHub. Public record routes that cannot safely enumerate static parameters use on-demand rendering with the same bounded revalidation contract.

### Level A: scoped development check

Run the smallest relevant tests after each coherent edit. Do not wait until the end to discover cross-system breakage.

### Level B: integrated application check

For application or shared-contract work:

```bash
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

`visibility:validate` is a separate local operator check and applies only when private visibility work changes. `launch:validate` is a low-rate production-like crawl, not a load test. `scale:validate` uses a deterministic 5,000-marker fixture to verify complete projection, bounded rich results, serialized-size budget, and fallback-clustering responsiveness without touching production.

### Level C: production-release check

Before merge to production or wider promotion:

```bash
pnpm release:validate
```

`release:validate` begins with the production dependency gate. High or critical known vulnerabilities fail the release before tests and the clean build run. The active finding and remediation history is maintained in `Security And Reliability Remediation Log.md`.

Then complete the relevant browser matrix at 390, 768, 1024, and 1440 pixels, verify access roles, and confirm the production build. After deployment, check `/api/health`, `/api/atlas/summary`, `/api/atlas?page=1&pageSize=18`, the homepage, affected public routes, sign-in when relevant, Vercel build/runtime logs, and live Supabase state. The summary organization count, atlas total, and complete marker collection must agree; rich records must remain bounded to the requested page size.

For a Daily Signals release, also verify `/signals`, the descriptive edition URL, every original source link, Article and ItemList JSON-LD, sitemap inclusion, anonymous read versus non-staff write denial, the edition index and `/admin/signals/[id]/edit` correction/archive flow, unchanged core-corpus counts, at least one view-and-copy LinkedIn example and one X example associated with the current edition, and an idempotent rerun that verifies or repairs those rows without duplicating matching copy. Never activate the schedule before the compatible migration and application are live.

For a landing or map-workspace release, also verify that `/` loads only the
lazy fixed non-interactive MapTiler specimen, `/map` places the fully interactive
live map in the first viewport, bounds and selected-record deep links survive
refresh and sharing, the deterministic guided example does not call Ask True
North or consume quota, and profile, browser-Back, sign-in, and Working List
return paths preserve ordinary map state.

## Research and publication regression

Research completion means a validated private candidate is visible in Admin Review. It does not mean the record is accepted or public. Publication requires a separate human action and post-publication route verification.

When a research contract changes, verify this chain end to end:

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

## Visibility and content regression

The visibility workflow produces private evidence for decisions, not public facts or publication authority. Raw provider data stays local. A full refresh paginates every configured live provider, audits every public sitemap URL, and runs the complete approved DataForSEO seed set; it does not inspect credits, cap tasks, reuse same-day panels, or change billing. Recommendations must map to an existing useful public surface or a reviewable content brief. Any resulting public change follows the normal product or editorial review path and then the public-route regression checks.

## Completion report

Every material handoff must state:

- files, routes, schemas, skills, providers, and assets changed;
- cross-system impacts considered;
- commands and browser workflows run;
- production state verified or not verified;
- known exceptions, deferred checks, and why they are safe;
- whether a migration, publication, campaign, outreach, or provider write still requires Andrew's approval.

A test that was not run must never be described as passing.

Migration review must compare repository filenames with the live Supabase migration ledger. A filename-only reconciliation to an already applied version must not execute or reapply SQL. Any actual production migration or rollback still follows the dependency-aware database contract in `AGENTS.md`.

Public discovery-cache changes must prove that every published organization remains in the compact map/search projection, that no individual cache item grows beyond its provider limit, and that `atlas-public` revalidation invalidates every page used to assemble the snapshot.
