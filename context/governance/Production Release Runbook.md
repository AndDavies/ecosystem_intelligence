# Production release runbook

Status: canonical production release runbook
Owner: Andrew Davies
Last reviewed: 2026-08-12

Current branch policy: `main` is the production branch. Do not create a standing feature or preview branch unless Andrew explicitly requests a production-like preview that cannot be reviewed locally. Any temporary preview branch must be merged or removed promptly so it does not create duplicate Vercel builds or an alternate project state.

The main checkout is also the credentialed-operator and final-validation workspace. Read-only agents may share it. If Andrew explicitly authorizes concurrent writers, use a temporary local `codex/*` worktree, do not push it or create a Vercel preview, and integrate and remove it promptly. Research, Daily Signals, North Signal, visibility, and final release checks stay in the main checkout; no `.worktreeinclude` copies private local state into secondary worktrees.

## Release authority

Andrew Davies is the release owner. A successful build or migration does not authorize public content publication, outreach or campaign sending by itself.

## Before deployment

1. Confirm `main` is aligned with `origin/main` and stage only the intended application, migration, launch-asset and governance changes. Keep local research, visibility, raw lineage, provider data and large draft collateral out of the release commit.
2. Run `pnpm release:validate` with production configuration. Its current contract includes the 5,000-marker scale gate; run `pnpm scale:validate` directly when diagnosing scale failures.
3. Confirm `pnpm security:validate` reports no high or critical production dependency finding and review lower-severity output.
4. Run the browser matrix at 390, 768, 1024 and 1440 pixels.
5. Verify the access matrix for anonymous, member, non-admin and administrator roles.
6. Inspect one public organization API response for internal review fields. Use local route tests and the browser matrix to validate the candidate before push; do not run a production crawler and call it candidate evidence. For a version-gated dossier release, verify locally that null-version legacy profiles do not query the rich `organization_dossiers` projection.
7. Review current Vercel errors and Supabase security and performance advisors.
8. Confirm pending publication and participation queues have been triaged.
9. Confirm the latest production deployment remains available for rollback.
10. Before any database command, verify the selected project reference is exactly `facoactpdckkhciamflk`. A stale local Supabase link is a hard stop; prefer an explicitly project-pinned control-plane call when the CLI database login role is unavailable.

## Launch validation policy

The launch tools have separate jobs:

| Command | When it runs | Scope | Blocking meaning |
| --- | --- | --- | --- |
| `pnpm launch:validate` | After the pushed commit is `READY` on the production alias; optionally against a local/preview origin during diagnosis | Roughly 15–20 requests: exact deployment identity, health/count consistency, sitemap, RSS/latest-Signals proof, critical routes, one record per dynamic family and explicit affected paths | Any final route, metadata, feed, proof, count or deployment mismatch blocks release closure. A recovered retry is advisory once; recheck the route and logs. Repeated recovery or a live error cluster blocks closure. |
| `pnpm launch:audit` | Major sitemap/internal-link architecture change, scheduled assurance, explicit broad-launch audit, or diagnosis after the bounded gate identifies a systemic problem | Serialized full sitemap plus supporting pagination, duplicate-title/orphan/performance inventory | Operational/HTTP failures are blockers. SEO/link/performance inventory remains a reported remediation list rather than making an unrelated application change disappear. Lock-held or circuit-breaker exit means inconclusive, not failed product code. |

The full audit owns a target-origin lock shared across chats/worktrees, heartbeats and verifies lock ownership, writes a temporary JSON report from the start, identifies its requests, and reports progress every 25 pages or 30 seconds. It uses one request stream with at least 750 ms plus bounded jitter between pages, checks health before starting and every 25 pages, and stops on repeated final failures, repeated recovered pressure or degraded health. An interrupt writes an `inconclusive` report before releasing the lock. Never run more than one production full audit, add it to push CI, reduce its pacing floor, or increase its concurrency to make it finish sooner.

## Deployment

1. Commit the approved release directly to `main` after local review and required validation.
2. Apply any reviewed migration to project `facoactpdckkhciamflk` in version order through an explicitly project-pinned path, then compare the resulting live ledger with the repository filenames and verify the schema and data effects. Skip this step when the release has no database change.
3. When a scheduler or private function changes, verify the job and its rollback dependency explicitly. Do not rely on Andrew to remember an internal database dependency.
4. Push `main` once and confirm the single Vercel production deployment.
5. After Vercel reports the exact commit `READY`, run `pnpm launch:validate`. Add changed canonical routes through `PUBLIC_LAUNCH_PATHS` when they are not already in the default/representative set. The validator derives the expected production SHA from local `HEAD` unless `PUBLIC_LAUNCH_EXPECTED_DEPLOYMENT` is explicitly supplied, so an old deployment cannot pass as the release candidate.
6. Check `/api/health`, `/api/atlas/summary`, `/api/atlas?page=1&pageSize=18`, `/`, the affected routes, `/sign-in` when authentication changed and one profile of each affected public record type. Use the longer route list below only when the release touches navigation or multiple public families: `/organizations`, `/regions`, `/missions`, one `/missions/[slug]`, `/demand`, `/signals`, one `/signals/[slug]`, `/signals/feed.xml`, `/north-signal`, `/briefs` and `/how-it-works`.
7. Verify production security headers, sitemap, robots, social card and analytics consent, then inspect current Vercel and Supabase logs or advisors relevant to the change.

## Provider status

- Microsoft Clarity is intentionally deferred. Google Analytics, first-party workflow events and Vercel performance monitoring are the active measurement stack. Clarity is not a release dependency.
- Cloudflare Turnstile protects passwordless authentication and the public contact, feedback and update forms. The browser uses `NEXT_PUBLIC_TURNSTILE_SITE_KEY`; custom server endpoints verify each token with the server-only `TURNSTILE_SECRET_KEY`. Validation, honeypots and rate limits remain layered controls.

## Rollback

- Application: promote the most recent verified healthy Vercel deployment or revert the scoped release commit.
- Forward-compatible organization-dossier migration set: these migrations add nullable normalized fields and indexes, perform bounded current-activity and one-to-one program-participation citation backfills, replace the pilot-event constraint, rebuild anonymous/authenticated field-citation policies and the `security_invoker` dossier view, add version-specific reviewed editors and publishers, and replace the typed-candidate validation objects plus the shared backward-compatible publication dispatcher. Before application deployment, verify the legacy organization route, historical v1/v2 publishers through that dispatcher, anonymous/member/admin policy matrix, rebuilt view, function grants, and exact pre/post backfill counts. If the application release then fails, promote the last verified application deployment. Preserve the applied schema and repair forward; do not improvise a destructive column, view, function, citation, or backfill rollback during an incident.
- Database: the Phase 2 migration adds a private retention-cleanup function and a daily scheduler entry that calls it. This is necessary to honour the published 30-day detailed-event and 90-day raw-search retention limits. No action is needed during normal operation. During rollback, the acting agent uses the versioned rollback script, verifies the live `cron.job` state, removes the scheduler entry first, then removes the function, and reruns database and release regression checks. This is an agent-owned operation, not a release-owner memory task.
- Authentication: retain the existing Supabase, Google OAuth and Resend configuration unless a separately approved provider change is part of the release.
- Newsletter: revoke or pause MailerLite delivery without changing the production consent ledger.
- North Signal acquisition migration: before application promotion, apply the reviewed event-name constraint expansion to the exact production project and verify old event names plus `newsletter_landing_view`, `newsletter_sample_open` and `newsletter_success`. An application rollback may leave those additive accepted values in place; do not remove historical events or the consent ledger.

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

- The North Signal acquisition and production corpus release is deployed at commit `459cc32` / deployment `dpl_CnnpQEC7VN1Le4QMCDPm4VuAGrKx`. It adds `/north-signal`, Signals-led contextual signup, the public Signals RSS feed, bounded acquisition telemetry and Admin Insights reporting, `north_signal_issue_v2`, the 28-feed contract, managed Node 24.14.0 project execution and pipeline 1.7.2 corpus segmentation. The pinned release gate passed 59 test files / 363 tests, lint, zero-vulnerability dependency audit, 5,000-marker scale validation and a 37-page build; launch validation passed 870 pages, GitHub Release Validation and CodeQL passed, and production health, responsive signup/Signals/contextual-route smoke and runtime logs were clean. North Signal provider presentation is operationally separate from application deployment. The branded welcome is active only for future dedicated-group entrants and the branded weekly Signals campaign remains an unsent draft; source parity, provider-preview evidence and the complete current provider state live in `Email Updates Operations.md`. Gmail and non-Gmail inbox tests, per-issue links, dedicated-group selection and Andrew's explicit authorization remain required before any weekly send. A prior standalone `My templates` 503 does not invalidate the saved campaign draft and does not authorize bypassing those send gates. The first `corpus_refresh` segment staged 50 private, non-overlapping candidates with no canonical or public writes, leaving 57 pending organization refreshes and zero approved candidates at the latest reconciliation.
- There is no standing tracked launch packet. Create screenshots, decks, reports, campaign copy, and other collateral only when explicitly requested; generate them locally by default and verify every visual, count, proof point, and outbound link against production immediately before use.
- The organization-directory and map reliability repair is deployed at commit `ebda002` / deployment `dpl_6dknE6Bs8YNBKg6iRLUdRGAhU6kx`. It separates national discovery from exact dossier invalidation, disables speculative dossier prefetch, restores the editable evidence-bounded Reviewer rationale prefill, and aligns the comprehensive corpus research skill without changing review or publication authority. The Node 24 355-test release gate, 870-page crawl, Release Validation, CodeQL, responsive Organizations/Map/YMX/DMZ smoke, exact 415/15/400 data reconciliation, and the post-ready Vercel/PostgreSQL timeout/error window passed. The prior verified application commit `2714bf1` remains the immediate rollback target; rollback does not undo the already published dossier data.
- The August 10 dossier, dependency and Signals application change set is verified at commit `cdf34c1` / deployment `dpl_FWFRvqFeoT9dm2SuX71Pny6hbZgY`, following the dependency/map release at `13efab0`. It advances new research runs to pipeline 1.7.1, enforces complete record-specific lineage and exact trusted-import parity, repairs Admin Review presentation, patches PostCSS to 8.5.23 and Hono to 4.12.34, adds exact-eight Signals v2 plus typed no-publish handling, and replaces the failing dossier Static API image with a provider-resilient map. The Node 24 release gate, GitHub Release Validation, CodeQL, low-threshold dependency audit, health/count reconciliation, responsive YMX/Metaspectral/legacy route smoke, pre/post-load axe scans and Vercel runtime/5xx log window passed. Andrew separately reviewed and published the eight pilot dossiers and all seven records in the subsequent first corpus wave; production now has 15 activated dossiers, an empty completed wave queue, and 400 null-version organizations remaining. The 06:30 Signals automation remains paused until its prompt advances to v2 and the isolated no-publish apply path is deliberately verified; dossier review is independent of that scheduler closure.
- Discovery reads now use deterministic paging, same-snapshot collection counts, linear-time fallback grouping, and a 5,000-marker regression gate in production. Health, catalogue consistency and the paced launch crawl have passed; `REL-2026-004` is closed. `REL-2026-003` remains open pending the anonymous and signed-in cache-header matrix.
- The August 9 organization-dossier foundation remains the version-gated application basis. Both ordered migrations are recorded, the deployed contract advertises `tnm-review-publication-v3`, and the health, policy, route, count, advisor, GitHub, Vercel, Postgres-log and crawl gates passed. The eight owner-reviewed pilot records plus seven first-wave records now prove the shared template across 15 production dossiers; the remaining 400 published organizations stay on the bounded legacy path until individually enriched, reviewed and published. Never replace that controlled rollout with a global version update.
- Production Supabase records the dossier foundation as `20260809222847 organization_dossier_v3` followed by `20260809222938 research_organization_v3_publication`. Their verified post-state is 415 dossier rows, 177 normalized current-activity values, 122 normalized one-to-one participation summaries, 2,754 citations, zero active candidates, and zero activated profiles. Application promotion and the deployed v3 contract check remain separate from those database facts.
- The initial application promotion `aa6dc34` exposed rich-view timeouts on unactivated legacy profiles. Hotfix `8a29b13` / deployment `dpl_4Phqy6Y3Li3EHMeRAHnyzvnUX19B` now resolves the profile version before choosing the rich or legacy loader. All 11 affected routes and the 869-page crawl passed with zero recovered warning; the hotfix deployment has no 5xx/runtime error and PostgreSQL has no new statement timeout. If this read-path repair regresses, the prior verified application deployment `783b7f5` / `dpl_EPn1AWT5cpG45aof4YBobbkaLLpc` remains the rollback target while the forward-compatible dossier schema is preserved for repair-forward.
