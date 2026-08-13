# Reliability, Dossier, UX, and Growth Implementation

Status: completed and deployed 2026-08-13; ordered migrations applied; production acceptance recorded in the canonical runbook and Development Log
Owner: Andrew Davies
Started: 2026-08-13

## Objective

Implement the approved reliability, public-site assurance, dossier, public-UX, executive-relevance, and North Signal measurement plan against current `main` and production, while preserving the August 12 publication repair and the separate workspace-reconciliation branch.

## Reconciled baseline

- The August 12 publication repair at `26a980e` is the implementation base and must not be recreated.
- The preserved `codex/workspace-reconciliation-20260812` commits were reviewed and merged into the coordinated production release rather than merged wholesale without inspection.
- Kîsik was separately reviewed and published through the human Admin Review and Publish checkpoints before this release; no research publication authority changed.
- Current production data, deployed contracts, and live route behaviour override counts or assumptions in the attached plan.
- North Signal's deployed five-minute offer remains canonical; the older proposed capture wording is superseded.

## Completion record

- Applied `20260813081430` and `20260813081500`, deployed the compatible 1.7.3 application, then applied `20260813081542` and `20260813083552`.
- Reconciled the repository and live Supabase migration ledgers, preserved organization refresh baselines, found zero queued cleanup overlap and removed every forbidden public lineage key.
- Merged the preserved August 12 research, visibility, North Signal and governance commits after conflict-by-conflict reconciliation with the newer contracts.
- Released the bounded citation hydrator, unified dossier/capability presentation, launch assurance, public-shell/accessibility work, executive relevance path, North Signal CTA measurement and role-balanced coverage report.
- Kept research staging, human Review, separate Publish, MailerLite provider changes, campaign sends and outreach as distinct authorities.

## Work packages

### 1. Dossier citation split and cold release gate

- Remove the nested citation aggregate from `organization_dossiers` while
  retaining its empty compatibility member.
- Admit only the requested published organization and reviewed child graph,
  then hydrate approved field citations, evidence and sources through bounded
  server queries.
- Add `pnpm dossier:cold-validate` as a short-lived, nonce-bound
  exact-deployment gate over at least ten activated dossiers: high-citation,
  sparse, recently updated and coverage-fill.
  Check anonymous view/API/route access, RSC and loading completion, metadata,
  non-zero citation trails, forbidden-lineage absence, view p95 below 500 ms and
  public organization API p95 below 2,500 ms by default.

### 2. Public organization lineage boundary

- Allowlist role-specific public `profile_data` plus approved public contact
  fields at serialization.
- Keep `reviewed_candidate_id`, `reviewed_by`, `research_schema_version` and
  `ingestion_batch_id` in private workflow lineage only.
- Apply the cleanup migration only after the allowlisted application is ready.
  The public JSON deletion is irreversible; canonical history remains in
  candidate, run, decision and audit tables.

### 3. Bounded and full-site launch assurance

- Treat RSC error digests, unresolved streamed or route loading shells and
  dynamic-metadata failures as bounded-gate blockers even with HTTP 200.
- In the explicitly triggered full audit, normalize and visit each discovered
  same-origin navigation target once, retain referrers and redirects, strip
  fragments/acquisition attribution and preserve independent safety ceilings.
- Probe only deliberately marked durable outbound sources. Block confirmed
  broken sources; report redirects, bot restrictions and transport uncertainty
  separately. Preserve serialization, 750 ms minimum pacing plus jitter, lock,
  progress report, health circuits and the prohibition on push-CI use.

### 4. Shared public shell and one dossier family

- Reconcile shared header/mobile focus behaviour, grouped footer, persistent
  North Signal action and route-wide trust wording without changing routes or
  data authority.
- Keep Signals as the daily public proof library and North Signal as the weekly
  briefing. Use **Evidence limits** publicly and claim-adjacent **Not established
  in the reviewed public record:**; internal `unknowns` and Coverage gap remain.
- Route all public organizations through one sparse-to-enriched dossier
  component. Align capability detail to what it enables, sourced maturity,
  reviewed connections, public programs/contracts with caveats, source ledger,
  evidence limits and one next-conversation handoff.

### 5. Executive relevance and pipeline 1.7.3

- Add nullable `executive_relevance_summary` at 80 to 1,200 characters.
- Treat it as a human-reviewed True North Map assessment synthesized only from
  supported fields and reviewed connections; require `derived` field evidence
  tied to the public sources establishing its premises plus a mapped citation
  when non-null, and use null when evidence is insufficient.
- Require an explicit supported summary or null in pipeline 1.7.3, exact refresh
  preview parity, labelled Admin Review evidence and both reviewed new/refresh
  Publish paths. Accept remains private; Publish remains a separate selected-set
  checkpoint.
- Production advanced to 1.7.3 only after the migration, application, deployed
  contract, Review and both Publish paths were compatible. The deployed-contract
  check remains mandatory before staging.

### 6. North Signal measurement and email source contracts

- Add bounded `newsletter_cta_click`; retain 30-day raw events and keep emails in
  the affirmative-consent ledger only.
- Exclude `/dev/`, QA attribution/traffic, and explicit QA, staff, test or
  internal cohorts from the private marketing scorecard without deleting or
  rewriting the event ledger.
- Reconcile welcome and weekly source files into one restrained branded email
  family: horizontal lockup, Field/Paper/North Ink, one Signal Yellow CTA, no
  permanent generic image, one to three Signals in weekly v2, lawful footer and
  Andrew-controlled provider/test/send authority.

### 7. Governance, validation and release

- Reconcile the overview, status, PRD, brand, research, admin, registry,
  regression, release, remediation, email and development contracts.
- Run governance validation, diff checks, focused and full Node 24 application,
  research, migration, accessibility and build gates as applicable.
- Responsive/browser checks cover the shared shell, organization/capability
  family, Signals and North Signal at 390, 768, 1024 and 1440 pixels.
- Only after an authorized exact deployment run bounded launch validation,
  `dossier:cold-validate`, affected-route smoke, live ledger/schema/queue checks,
  current logs/advisors and any explicitly triggered full audit.

## Completed migration order

The repository order is:

1. `20260813081430_add_executive_relevance_summary.sql`
2. `20260813081500_add_newsletter_cta_click_event.sql`
3. `20260813081542_remove_dossier_view_citation_aggregate.sql`
4. `20260813083552_sanitize_public_organization_profile_data.sql`

The exact versions were compared with the live Supabase ledger and the clean
migration chain was proven. The first two additive migrations were applied in
the initial checkpoint, then the compatible application was promoted and
verified before the
compatible application; no 1.7.3 intake may begin yet. Apply the citation split
and timestamp-preserving public-lineage cleanup only in the second checkpoint
after that exact application is ready. Record affected pending/approved refresh
IDs immediately before cleanup. Do not use the old view-dependent application
as a rollback target after the citation split without a forward view repair.
The allowlisted projection must be ready for the public JSON cleanup, and the
event constraint must exist before the promoted application emits CTA clicks.
Repair forward after promotion. Never attempt to reconstruct removed public
JSON lineage from the organization row.

## Preserved approval boundaries

- SQL migrations were applied only after the compatible application and two-stage sequence were authorized; future migrations retain the same boundary.
- Research may stage private candidates only; it cannot accept or publish them.
- MailerLite edits, campaign tests, sends, imports, and automation changes are outside this implementation unless separately authorized.
- Outreach, social posts, partner messages, and paid acquisition remain outside scope.
- The completed release commit, push and production deployment are recorded in the canonical release evidence rather than inferred from the plan alone.
- Updating tracked email source does not edit, preview, activate or test a live
  MailerLite automation/template and does not authorize recipients or a send.

## Completion evidence

### Local candidate evidence recorded 2026-08-13

- pnpm-managed Node 24.14.0 `pnpm release:validate`: passed repository/governance
  hygiene, dependency audit, 68 test files / 425 tests, lint, 5,000-marker scale
  validation and the optimized 38-page build.
- `pnpm research:validate`: 436 artifacts, zero errors and 3,339 explicitly
  historical/advisory warnings. Governance validation passed with zero warnings.
- The ignored installed research skill passed its dedicated validator and
  focused contract tests. Current `main` has no `skills:validate` package
  command, so that unavailable command is recorded rather than inferred green.
- Read-only public coverage output:
  `research/ingestion/local/coverage/2026-08-13-organization-dossier-coverage.json`.
  It covers 546 published organizations and selects a role-balanced 50-record
  wave without engagement, PII, review intake or canonical writes.
- In-app browser acceptance passed at 390, 768, 1,024 and 1,440 pixels across
  North Signal, Signals, Public Needs, Mission Areas, Organizations, How It
  Works and an activated dossier. It confirmed the compact Signals fold,
  470-pixel desktop capture, bottom-anchored artwork-free mobile sheet,
  landing-page focus handoff, Escape focus restoration, shared-header geometry,
  zero tested horizontal overflow or broken imagery and a clean browser log.
- The four migrations, exact-deployment cold gate, bounded launch validation,
  complete full audit, live API/privacy reconciliation and production logs remain
  separately approval- and deployment-dependent.

The completion record must include the exact changed files, migration order and rollback boundaries, Node 24 commands and results, responsive and keyboard checks, launch-assurance result, live-state reconciliation, and every deferred approval-dependent action.

Until those checks and approval-dependent actions occur, this plan remains
active and all new database, pipeline 1.7.3, provider and public behaviour is a
candidate rather than production truth.

## Exact local change manifest

The assembled candidate changes the following intended paths. The separate
August 12 handoff remains user-owned and unmodified.

- Workspace/scripts: `package.json`, `app/package.json`,
  `app/scripts/audit-public-launch.ts`,
  `app/scripts/validate-public-launch.ts`,
  `app/scripts/validate-cold-dossiers.ts`, and
  `app/scripts/report-organization-coverage.ts`.
- Routes: `app/src/app/page.tsx`, `layout.tsx`, `opengraph-image.tsx`,
  `sitemap.ts`, `about/page.tsx`, `methodology/page.tsx`, `briefs/page.tsx`,
  `briefs/[slug]/page.tsx`, `signals/page.tsx`, `signals/[slug]/page.tsx`,
  `organizations/[slug]/page.tsx`, `capabilities/[slug]/page.tsx`,
  `demand/[slug]/page.tsx`, `regions/page.tsx`, `regions/[slug]/page.tsx`,
  `admin/insights/page.tsx`, `admin/review/page.tsx`, and
  `api/organizations/[slug]/route.ts`.
- Public components: `alignment-match-card.tsx`,
  `atlas-explorer-results.tsx`, `evidence-list.tsx`,
  `executive-organization-dossier.tsx`, `guided-landing-dynamic.tsx`,
  `north-signal-signup.tsx`, `public-atlas-footer.tsx`,
  `public-atlas-header.tsx`, `public-beta-experience.tsx`,
  `public-page-shell.tsx`, `public-share.tsx`, and
  `signal-archive-browser.tsx` under `app/src/components/atlas/`.
- Libraries/types: `app/src/lib/atlas/presentation.ts`,
  `app/src/lib/atlas/repository.ts`, `app/src/lib/atlas/supabase-repository.ts`,
  `app/src/lib/atlas/public-profile-data.ts`,
  `app/src/lib/launch/release-gate.ts`,
  `app/src/lib/launch/dossier-release-gate.ts`,
  `app/src/lib/product-insights/client.ts`,
  `app/src/lib/product-insights/validation.ts`,
  `app/src/lib/product-insights/marketing-scorecard.ts`,
  `app/src/lib/research/pipeline-schema.ts`,
  `app/src/lib/research/organization-coverage-report.ts`, and
  `app/src/types/atlas.ts`.
- Tests: `alignment-card.test.ts`, `atlas-migration.test.ts`,
  `daily-signals.test.ts`, `editorial-collection-refinement.test.ts`,
  `launch-release-gate.test.ts`, `mission-areas.test.ts`,
  `north-signal-acquisition.test.ts`, `north-signal-capture.test.ts`,
  `organization-dossier-public-contract.test.ts`,
  `product-insights-validation.test.ts`, `profile-decision-handoffs.test.ts`,
  `public-copy.test.ts`, `public-data-access.test.ts`,
  `public-language-foundation.test.ts`, `research-skill-contracts.test.ts`,
  `admin-executive-relevance-review.test.ts`, `dossier-release-gate.test.ts`,
  `marketing-scorecard.test.ts`, `organization-coverage-report.test.ts`,
  `public-profile-data.test.ts`, `research-executive-relevance.test.ts`,
  `shared-public-shell-accessibility.test.ts`, and
  `fixtures/organization-dossier-candidates.ts` under `app/tests/`.
- Prepared migrations: `app/supabase/migrations/20260813081430_add_executive_relevance_summary.sql`,
  `20260813081500_add_newsletter_cta_click_event.sql`,
  `20260813081542_remove_dossier_view_citation_aggregate.sql`, and
  `20260813083552_sanitize_public_organization_profile_data.sql`.
- Portable research schema: `research/ingestion/schema/research-candidate-batch-v2.schema.json`.
- Brand/email: `content/brand/True North Map Brand System.md`,
  `content/email/north-signal/welcome.md`, and
  `content/email/north-signal/weekly-template.md`.
- Governance: `Admin Workflow And Data Contract.md`,
  `Cross-System Change And Regression Contract.md`, `Development Log.md`,
  `Email And Domain Infrastructure.md`, `Email Updates Operations.md`,
  `PRD.md`, `Production Release Runbook.md`, `Project Status.md`,
  `Research Agent Schema And Source Contract.md`,
  `Security And Reliability Remediation Log.md`,
  `Skills And Automation Map.md`, `True North Map Project Overview.md`, and
  this active implementation plan under `context/governance/`.
- Ignored operator material: `.agents/skills/tnm-autonomous-research/SKILL.md`
  plus `references/shared-research-policy.md`, `run-contract.md`,
  `quality-contract.md`, and `decision-usefulness.md`; and the read-only report
  `research/ingestion/local/coverage/2026-08-13-organization-dossier-coverage.json`.
