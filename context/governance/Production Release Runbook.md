# Production release runbook

Status: canonical production release runbook  
Owner: Andrew Davies  
Last reviewed: 2026-08-08

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
6. Inspect one public organization API response for internal review fields and run the low-rate canonical crawl, including any recovered retry warnings. Verify that `/api/atlas/summary` organization count, `/api/atlas` total, and the complete marker collection agree while rich results remain at or below the requested page size.
7. Review current Vercel errors and Supabase security and performance advisors.
8. Confirm pending publication and participation queues have been triaged.
9. Confirm the latest production deployment remains available for rollback.

## Deployment

1. Commit the approved release directly to `main` after local review and required validation.
2. Apply any reviewed migration to project `facoactpdckkhciamflk` in version order, then verify its live state. Skip this step when the release has no database change.
3. When a scheduler or private function changes, verify the job and its rollback dependency explicitly. Do not rely on Andrew to remember an internal database dependency.
4. Push `main` once and confirm the single Vercel production deployment.
5. Check `/api/health`, `/api/atlas/summary`, `/api/atlas?page=1&pageSize=18`, `/`, `/organizations`, `/regions`, `/missions`, one `/missions/[slug]`, `/demand`, `/briefs`, `/how-it-works`, `/sign-in` and one profile of each public record type.
6. Verify production security headers, sitemap, robots, social card and analytics consent, then inspect current Vercel and Supabase logs or advisors relevant to the change.

## Provider status

- Microsoft Clarity is intentionally deferred. Google Analytics, first-party workflow events and Vercel performance monitoring are the active measurement stack. Clarity is not a release dependency.
- Cloudflare Turnstile protects passwordless authentication and the public contact, feedback and update forms. The browser uses `NEXT_PUBLIC_TURNSTILE_SITE_KEY`; custom server endpoints verify each token with the server-only `TURNSTILE_SECRET_KEY`. Validation, honeypots and rate limits remain layered controls.

## Rollback

- Application: promote the most recent verified healthy Vercel deployment or revert the scoped release commit.
- Database: the Phase 2 migration adds a private retention-cleanup function and a daily scheduler entry that calls it. This is necessary to honour the published 30-day detailed-event and 90-day raw-search retention limits. No action is needed during normal operation. During rollback, the acting agent uses the versioned rollback script, verifies the live `cron.job` state, removes the scheduler entry first, then removes the function, and reruns database and release regression checks. This is an agent-owned operation, not a release-owner memory task.
- Authentication: retain the existing Supabase, Google OAuth and Resend configuration unless a separately approved provider change is part of the release.
- Newsletter: revoke or pause MailerLite delivery without changing the production consent ledger.

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

- There is no standing tracked launch packet. Create screenshots, decks, reports, campaign copy, and other collateral only when explicitly requested; generate them locally by default and verify every visual, count, proof point, and outbound link against production immediately before use.
- Discovery reads now use deterministic paging, same-snapshot collection counts, linear-time fallback grouping, and a 5,000-marker regression gate. These changes are implemented in the local release candidate; production closure requires deployment plus the health, catalogue-consistency, cache-header, crawl-warning, and field-performance checks above.
- `REL-2026-003` and `REL-2026-004` remain open until their production verification triggers pass. Do not mark either deployed based on local tests alone.
