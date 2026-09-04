# Production release runbook

Status: canonical production release runbook
Owner: Andrew Davies
Last reviewed: 2026-09-04

Current branch policy: `main` is the production branch. Do not create a standing feature or preview branch unless Andrew explicitly requests a production-like preview that cannot be reviewed locally. Any temporary preview branch must be merged or removed promptly so it does not create duplicate Vercel builds or an alternate project state.

The main checkout is also the credentialed-operator and final-validation workspace. Read-only agents may share it. If Andrew explicitly authorizes concurrent writers, use a temporary local `codex/*` worktree, do not push it or create a Vercel preview, and integrate and remove it promptly. Research, Daily Signals, North Signal, visibility, and final release checks stay in the main checkout; no `.worktreeinclude` copies private local state into secondary worktrees.

## Release authority

Andrew Davies is the release owner. A successful build or migration does not authorize public content publication, outreach or campaign sending by itself.

## Before deployment

1. Confirm `main` is aligned with `origin/main` and stage only the intended application, migration, launch-asset and governance changes. Keep local research, visibility, raw lineage, provider data and large draft collateral out of the release commit.
   Tracked `research/ingestion/` lineage remains in Git for auditability but is
   excluded from Vercel uploads through the root `.vercelignore`; it is not a
   build or runtime input.
2. Run `pnpm release:validate` with production configuration. Its current contract includes the 5,000-marker scale gate; run `pnpm scale:validate` directly when diagnosing scale failures.
3. Confirm `pnpm security:validate` reports no high or critical production dependency finding and review lower-severity output.
4. Run the browser matrix at 390, 768, 1024 and 1440 pixels.
5. Verify the access matrix for anonymous, member, non-admin and administrator roles.
6. Inspect representative public organization API and page responses for internal review, research-schema and ingestion-lineage fields. Use local route tests and the browser matrix to validate the candidate before push; do not run a production crawler and call it candidate evidence. For a dossier projection or citation-hydration release, verify locally that the view no longer aggregates citations, that the application hydrates only the admitted public graph, and that the post-deployment cold-dossier gate is wired with a short-lived, nonce-bound exact-deployment signature but not misreported as local evidence. Invalid API probes return 403; invalid page probes use the ordinary cached public path and never become public 500 responses.
7. Review current Vercel errors and Supabase security and performance advisors.
8. Confirm pending publication and participation queues have been triaged.
9. Confirm the latest production deployment remains available for rollback.
10. Before any database command, verify the selected project reference is exactly `facoactpdckkhciamflk`. A stale local Supabase link is a hard stop; prefer an explicitly project-pinned control-plane call when the CLI database login role is unavailable.
11. For the canonical-repair v4/1.8.0 release, preserve the two-stage order: apply the additive migration while the old v3 application remains compatible; recheck ordinary new/refresh Review and Publish; deploy the compatible application; wait for the exact commit to be READY; then require the live contract endpoint to advertise v4, pipeline 1.8.0 and `organization_canonical_repair_bundle_v1`. Do not prepare or stage a repair run between those stages.

## Launch validation policy

The launch tools have separate jobs:

| Command | When it runs | Scope | Blocking meaning |
| --- | --- | --- | --- |
| `pnpm launch:validate` | After the pushed commit is `READY` on the production alias; optionally against a local/preview origin during diagnosis | Small bounded set: exact deployment identity, health/count consistency, sitemap, RSS/latest-Signals proof, five critical routes and explicit affected paths. Dynamic-family representatives are opt-in through `PUBLIC_LAUNCH_INCLUDE_REPRESENTATIVES=1` only for shared renderer, metadata, navigation or family-contract changes. | Any final route, RSC/loading/metadata, feed, proof, count or deployment mismatch blocks release closure. A recovered retry is advisory once; recheck the route and logs. Repeated recovery or a live error cluster blocks closure. |
| `pnpm launch:audit` | Only through a manual, explicit `$tnm-site-assurance` invocation for major sitemap/internal-link architecture change, manual periodic assurance, explicit broad audit, or systemic diagnosis | Serialized normalized same-origin navigation crawl with referrers/redirects, plus supporting pagination, duplicate-title/orphan/performance inventory and a capped probe of deliberately marked durable outbound sources. Production refuses to start without `PUBLIC_LAUNCH_FULL_AUDIT_ACK` and an approved `PUBLIC_LAUNCH_AUDIT_REASON`. It is never scheduled or triggered by a code, governance, content, or release change. | Internal operational/HTTP failures and confirmed broken marked sources are blockers. Redirects, bot restrictions and transport uncertainty remain separate report classes. SEO/link/performance inventory remains a reported remediation list rather than making an unrelated application change disappear. Lock-held or circuit-breaker exit means inconclusive, not failed product code. |

The full audit owns a target-origin lock shared across chats/worktrees, heartbeats and verifies lock ownership, writes a temporary JSON report from the start, identifies its requests, and reports progress every 25 pages or 30 seconds. It uses one request stream with at least 750 ms plus bounded jitter between pages, checks health before starting and every 25 pages, and stops on repeated final failures, repeated recovered pressure or degraded health. It normalizes each same-origin target, strips fragments and acquisition-only query fields, sorts retained query parameters and visits the result once while preserving referrers and redirects. Navigation-only `returnTo` values are removed. Map deep links retain every selected-only record and each distinct functional filter, while a selected-record-plus-filter cross-product normalizes to the filter route. `/api/` and download actions are excluded from navigation traversal and remain covered by bounded endpoint/feature tests. Working List add and sign-in-return actions keep the first real generated request per action type and aggregate every referrer; canonical record, connection and ordinary content targets remain exact. This verifies each page/action class without creating thousands of equivalent requests or exporting private operator state. Internal targets and deliberately marked durable outbound sources retain separate safety ceilings. The internal ceiling bounds additional linked-target requests after sitemap and supporting-page results are reused; the report still inventories every discovered target and its referrers. A ceiling stop persists both the discovered and planned-request counts and remains inconclusive, so diagnose normalization before considering a limit change. The outbound phase rejects private/reserved hosts, excludes ordinary external/provider/social/campaign links, retries one 5xx cautiously, and blocks only a confirmed broken result. An interrupt writes an `inconclusive` report before releasing the lock. Never run more than one production full audit, add it to push CI, reduce its pacing floor, or increase its concurrency to make it finish sooner.

The private visibility refresh is not another launch crawler. It may inventory the complete sitemap manifest, but its technical lane fetches only the five governed core routes sequentially, reports `bounded_core_v1`, and stops after repeated upstream pressure. `--refresh-technical` is retired. Do not run visibility refresh and `launch:audit` concurrently; an ordinary release uses only the bounded post-ready `launch:validate` gate above.

## Deployment

1. Commit the approved release directly to `main` after local review and required validation.
2. Apply any reviewed migration to project `facoactpdckkhciamflk` in version order through an explicitly project-pinned path, then compare the resulting live ledger with the repository filenames and verify the schema and data effects. Skip this step when the release has no database change.
   Apply a source-controlled migration with the linked CLI so its filename
   version remains the production-ledger version. Do not send an already
   versioned repository migration through a control-plane `apply_migration`
   operation that assigns a new execution-time identity. If an exceptional
   staged release must use that operation, reconcile the generated version,
   name and statement hash back into Git before the release commit; never leave
   two timestamps representing the same SQL.
3. When a scheduler or private function changes, verify the job and its rollback dependency explicitly. Do not rely on Andrew to remember an internal database dependency.
4. Push `main` once and confirm the single Vercel production deployment.
5. After Vercel reports the exact commit `READY`, run `pnpm launch:validate`. Add only changed canonical routes through `PUBLIC_LAUNCH_PATHS`. Use `PUBLIC_LAUNCH_INCLUDE_REPRESENTATIVES=1` only for a shared dynamic renderer, metadata layer, navigation shell, or record-family contract change. The validator derives the expected production SHA from local `HEAD` unless `PUBLIC_LAUNCH_EXPECTED_DEPLOYMENT` is explicitly supplied, so an old deployment cannot pass as the release candidate.
6. Check `/api/health`, `/api/atlas/summary`, `/api/atlas?page=1&pageSize=18`, `/`, the affected routes, `/sign-in` when authentication changed and one profile of each affected public record type. Use the longer route list below only when the release touches navigation or multiple public families: `/organizations`, `/regions`, `/missions`, one `/missions/[slug]`, `/demand`, `/signals`, one `/signals/[slug]`, `/signals/feed.xml`, `/north-signal`, `/briefs` and `/how-it-works`.
7. Verify production security headers, sitemap, robots, social card and analytics consent, then inspect current Vercel and Supabase logs or advisors relevant to the change.
8. After the exact deployment is `READY` and an affected public route is verified, Andrew may authorize one IndexNow notification. Run `pnpm indexnow:submit -- --path /changed-public-path` first, then repeat that exact path with `--apply`. The command must verify that the public key file returns HTTP 200 with the exact configured token before posting. Record HTTP 200 as submitted and HTTP 202 as accepted pending key validation; neither is proof of crawling or indexing. Never provide a sitemap, submit historical routes in bulk, schedule the command, retry automatically, or submit private, administrative, authentication, collection or API paths. Every additional URL is a separate authorization and invocation.

For a canonical-repair release, also verify individual-only repair controls in Admin Review and Publish, ordinary batch exclusion, a fresh snapshot against current production, and zero candidate/canonical change before Andrew's first human action. Only after those checks may the named repair run be prepared and reconciled into the private queue.

### August 13 completed two-stage migration set

The following repository migrations were applied to production in the reviewed
two-stage sequence and the live ledger was reconciled to these exact versions:

1. `20260813081430_add_executive_relevance_summary.sql`
2. `20260813081500_add_newsletter_cta_click_event.sql`
3. `20260813081542_remove_dossier_view_citation_aggregate.sql`
4. `20260813083552_sanitize_public_organization_profile_data.sql`

The safe dependency was not inferred from filenames or satisfied by applying
all four in one command. Checkpoint one applied migrations 1 and 2, then the
compatible application was deployed and its 1.7.3 contract verified.
Checkpoint two applied migrations 3 and 4. The cleanup intersected zero pending
or approved refresh candidates, preserved `updated_at`, removed the four
forbidden public lineage keys and installed the future-write guard. The old
view-dependent application is unsafe after migration 3 and is not a rollback
target unless a forward repair restores the aggregate. The default cold-dossier p95 ceilings are strictly below 500 ms
for the anonymous view and 2,500 ms for the public organization API; any
approved override remains explicit release evidence rather than silently
relaxing the gate. The gate signs its bounded exact-deployment probes with
`DOSSIER_RELEASE_PROBE_SECRET`; application and operator may derive the same
compatibility secret from their own valid Supabase service credentials when the
dedicated value is absent, so rotated key formats do not create false 403s.

Record the cleanup/queue intersection immediately before the second database
checkpoint; retain both the count and IDs in private release evidence:

```sql
select candidate.id as candidate_id, candidate.status, organization.id as organization_id,
       organization.slug, organization.updated_at
from public.candidate_changes candidate
join public.organizations organization on organization.id = candidate.target_entity_id
where candidate.candidate_kind = 'organization_refresh_bundle'
  and candidate.status in ('pending', 'approved')
  and organization.profile_data ?| array[
    'reviewed_candidate_id', 'reviewed_by', 'research_schema_version', 'ingestion_batch_id'
  ]::text[]
order by candidate.created_at, candidate.id;
```

## Provider status

- Microsoft Clarity is intentionally deferred. Google Analytics, first-party workflow events and Vercel performance monitoring are the active measurement stack. Clarity is not a release dependency.
- Cloudflare Turnstile protects passwordless authentication and the public contact, feedback and update forms. The browser uses `NEXT_PUBLIC_TURNSTILE_SITE_KEY`; custom server endpoints verify each token with the server-only `TURNSTILE_SECRET_KEY`. Validation, honeypots and rate limits remain layered controls.

## Rollback

- Application: promote the most recent verified healthy Vercel deployment or revert the scoped release commit.
- IndexNow: a notification cannot be retracted. Correct or remove the public URL through the governed application/publication workflow, verify the resulting state, and separately notify that exact corrected or deleted URL if Andrew authorizes it.
- Forward-compatible organization-dossier migration set: these migrations add nullable normalized fields and indexes, perform bounded current-activity and one-to-one program-participation citation backfills, replace the pilot-event constraint, rebuild anonymous/authenticated field-citation policies and the `security_invoker` dossier view, add version-specific reviewed editors and publishers, and replace the typed-candidate validation objects plus the shared backward-compatible publication dispatcher. Before application deployment, verify the legacy organization route, historical v1/v2 publishers through that dispatcher, anonymous/member/admin policy matrix, rebuilt view, function grants, and exact pre/post backfill counts. If the application release then fails, promote the last verified application deployment. Preserve the applied schema and repair forward; do not improvise a destructive column, view, function, citation, or backfill rollback during an incident.
- Database: the Phase 2 migration adds a private retention-cleanup function and a daily scheduler entry that calls it. This is necessary to honour the published 30-day detailed-event and 90-day raw-search retention limits. No action is needed during normal operation. During rollback, the acting agent uses the versioned rollback script, verifies the live `cron.job` state, removes the scheduler entry first, then removes the function, and reruns database and release regression checks. This is an agent-owned operation, not a release-owner memory task.
- Authentication: retain the existing Supabase, Google OAuth and Resend configuration unless a separately approved provider change is part of the release.
- Newsletter: revoke or pause MailerLite delivery without changing the production consent ledger.
- North Signal acquisition migration: before application promotion, apply the reviewed event-name constraint expansion to the exact production project and verify old event names plus `newsletter_landing_view`, `newsletter_cta_click`, `newsletter_sample_open` and `newsletter_success`. An application rollback may leave those additive accepted values in place; do not remove historical events or the consent ledger. QA/staff scorecard filtering never deletes or rewrites the raw bounded event ledger.
- Public organization lineage cleanup: do not attempt to restore deleted public JSON keys during rollback. Promote the last compatible application if needed, keep canonical lineage in private workflow/audit tables, and repair the allowlist or guard forward.
- Dossier citation split and executive-summary publication functions: preserve the applied forward-compatible schema and repair forward. Do not promote an application that expects the old nested citation aggregate after the view changes, and do not stage pipeline 1.7.3 candidates until the deployed contract, Review UI and both Publish paths are compatible.
- Canonical organization repair: preserve the additive migration, private candidates, audit rows and immutable successor redirects and repair forward. An application rollback is allowed only with canonical-repair intake stopped and no unsupported repair action available. Never delete archival lineage, rewrite a published redirect, or attempt to reconstruct a soft-archived graph outside a new governed repair.

## Incident priorities

1. Private-data or authorization exposure.
2. Broken authentication or account deletion.
3. Broken national discovery, profiles or evidence links.
4. Failed contributions, connections, feedback or subscriptions.
5. Ask True North or analytics degradation.
6. Cosmetic and low-risk content defects.

For a critical issue, stop promotion, preserve logs, roll back the application if necessary and do not retry destructive database operations.

All active findings, accepted risks, repair evidence, and follow-up triggers are recorded in `Security And Reliability Remediation Log.md`.

## Current production release

The August 13 reliability/dossier/UX/growth contract and its four ordered
migrations are production state. The exact application commit remains
machine-verified through `/api/system/research-contract`, GitHub checks and the
Vercel deployment rather than copied into this durable runbook. No 1.7.3
research candidate was automatically reviewed or published and no provider
campaign, contact import, outreach message or send was part of the release.

- The North Signal acquisition and production corpus release was originally deployed at commit `459cc32` / deployment `dpl_CnnpQEC7VN1Le4QMCDPm4VuAGrKx`. It added `/north-signal`, Signals-led contextual signup, the public Signals RSS feed, bounded acquisition telemetry and Admin Insights reporting, `north_signal_issue_v2`, the then-28-feed contract, managed Node 24.14.0 project execution and pipeline 1.7.2 corpus segmentation. Its pinned release, launch, CI, health, responsive and authenticated signup/delivery checks passed. On August 13 the live welcome and reusable weekly provider template were reconciled to the current branded source: the welcome is active for future `Ecosystem Intelligence` entrants only, the weekly template is previewed and unsent, and the obsolete dated template is removed. Per-issue Gmail/non-Gmail tests and Andrew's explicit manual send authorization remain required. The first `corpus_refresh` segment staged 50 private, non-overlapping candidates with no canonical or public writes, leaving 57 pending organization refreshes and zero approved candidates at that dated reconciliation.
- There is no standing tracked launch packet. Create screenshots, decks, reports, campaign copy, and other collateral only when explicitly requested; generate them locally by default and verify every visual, count, proof point, and outbound link against production immediately before use.
- The organization-directory and map reliability repair is deployed at commit `ebda002` / deployment `dpl_6dknE6Bs8YNBKg6iRLUdRGAhU6kx`. It separates national discovery from exact dossier invalidation, disables speculative dossier prefetch, restores the editable evidence-bounded Reviewer rationale prefill, and aligns the comprehensive corpus research skill without changing review or publication authority. The Node 24 355-test release gate, 870-page crawl, Release Validation, CodeQL, responsive Organizations/Map/YMX/DMZ smoke, exact 415/15/400 data reconciliation, and the post-ready Vercel/PostgreSQL timeout/error window passed. The prior verified application commit `2714bf1` remains the immediate rollback target; rollback does not undo the already published dossier data.
- The August 10 dossier, dependency and Signals application change set is verified at commit `cdf34c1` / deployment `dpl_FWFRvqFeoT9dm2SuX71Pny6hbZgY`, following the dependency/map release at `13efab0`. It advances new research runs to pipeline 1.7.1, enforces complete record-specific lineage and exact trusted-import parity, repairs Admin Review presentation, patches PostCSS to 8.5.23 and Hono to 4.12.34, adds exact-eight Signals v2 plus typed no-publish handling, and replaces the failing dossier Static API image with a provider-resilient map. The Node 24 release gate, GitHub Release Validation, CodeQL, low-threshold dependency audit, health/count reconciliation, responsive YMX/Metaspectral/legacy route smoke, pre/post-load axe scans and Vercel runtime/5xx log window passed. Andrew separately reviewed and published the eight pilot dossiers and all seven records in the subsequent first corpus wave; production now has 15 activated dossiers, an empty completed wave queue, and 400 null-version organizations remaining. The 06:30 Signals automation remains paused until its prompt advances to v2 and the isolated no-publish apply path is deliberately verified; dossier review is independent of that scheduler closure.
- Discovery reads now use deterministic paging, same-snapshot collection counts, linear-time fallback grouping, and a 5,000-marker regression gate in production. Health, catalogue consistency and the paced launch crawl have passed; `REL-2026-004` is closed. `REL-2026-003` remains open pending the anonymous and signed-in cache-header matrix.
- The August 9 organization-dossier foundation remains the version-gated application basis. Both ordered migrations are recorded, the deployed contract advertises `tnm-review-publication-v3`, and the health, policy, route, count, advisor, GitHub, Vercel, Postgres-log and crawl gates passed. The eight owner-reviewed pilot records plus seven first-wave records now prove the shared template across 15 production dossiers; the remaining 400 published organizations stay on the bounded legacy path until individually enriched, reviewed and published. Never replace that controlled rollout with a global version update.
- Production Supabase records the dossier foundation as `20260809222847 organization_dossier_v3` followed by `20260809222938 research_organization_v3_publication`. Their verified post-state is 415 dossier rows, 177 normalized current-activity values, 122 normalized one-to-one participation summaries, 2,754 citations, zero active candidates, and zero activated profiles. Application promotion and the deployed v3 contract check remain separate from those database facts.
- The initial application promotion `aa6dc34` exposed rich-view timeouts on unactivated legacy profiles. Hotfix `8a29b13` / deployment `dpl_4Phqy6Y3Li3EHMeRAHnyzvnUX19B` now resolves the profile version before choosing the rich or legacy loader. All 11 affected routes and the 869-page crawl passed with zero recovered warning; the hotfix deployment has no 5xx/runtime error and PostgreSQL has no new statement timeout. If this read-path repair regresses, the prior verified application deployment `783b7f5` / `dpl_EPn1AWT5cpG45aof4YBobbkaLLpc` remains the rollback target while the forward-compatible dossier schema is preserved for repair-forward.
