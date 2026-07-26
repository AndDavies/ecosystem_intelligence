# Phase 2 broader-release runbook

## Release authority

Andrew Davies is the release owner. A successful build or migration does not authorize public content publication, outreach or campaign sending by itself.

## Before deployment

1. Confirm the protected Phase 2 branch contains only application, migration, launch-asset and governance changes.
2. Run `pnpm release:validate` with production configuration.
3. Run the browser matrix at 390, 768, 1024 and 1440 pixels.
4. Verify the access matrix for anonymous, member, non-admin and administrator roles.
5. Review current Vercel errors and Supabase security and performance advisors.
6. Confirm pending publication and participation queues have been triaged.
7. Confirm the latest production deployment remains available for rollback.

## Deployment

1. Push the protected branch and verify its Vercel preview.
2. Apply the reviewed retention migration to project `facoactpdckkhciamflk`.
3. Verify the scheduled job and execute the purge function once in a transaction-safe validation.
4. Merge the approved branch to `main` and confirm the Vercel production deployment.
5. Check `/api/health`, `/`, `/organizations`, `/demand`, `/briefs`, `/how-it-works`, `/sign-in` and one profile of each public record type.
6. Verify production security headers, sitemap, robots, social card and analytics consent.

## Provider status

- Microsoft Clarity is intentionally deferred. Google Analytics, first-party workflow events and Vercel performance monitoring are the active measurement stack. Clarity is not a release dependency.
- Cloudflare Turnstile protects passwordless authentication and the public contact, feedback and update forms. The browser uses `NEXT_PUBLIC_TURNSTILE_SITE_KEY`; custom server endpoints verify each token with the server-only `TURNSTILE_SECRET_KEY`. Validation, honeypots and rate limits remain layered controls.

## Rollback

- Application: promote the recorded pre-Phase 2 Vercel deployment or revert the Phase 2 merge commit.
- Database: the Phase 2 migration adds a private retention-cleanup function and a daily scheduler entry that calls it. This is necessary to honour the published 30-day detailed-event and 90-day raw-search retention limits. No action is needed during normal operation. During rollback, the acting agent uses the versioned rollback script, verifies the live `cron.job` state, removes the scheduler entry first, then removes the function, and reruns database and release regression checks. This is an agent-owned operation, not a release-owner memory task.
- Authentication: retain the existing Supabase, Google OAuth and Resend configuration. Phase 2 does not change providers or credentials.
- Newsletter: revoke or pause MailerLite delivery without changing the production consent ledger.

## Incident priorities

1. Private-data or authorization exposure.
2. Broken authentication or account deletion.
3. Broken national discovery, profiles or evidence links.
4. Failed contributions, connections, feedback or subscriptions.
5. Ask True North or analytics degradation.
6. Cosmetic and low-risk content defects.

For a critical issue, stop promotion, preserve logs, roll back the application if necessary and do not retry destructive database operations.
