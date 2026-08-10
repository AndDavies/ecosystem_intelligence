# Production release runbook

Status: canonical production release runbook
Owner: Andrew Davies
Last reviewed: 2026-08-10

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
6. Inspect one public organization API response for internal review fields and run the low-rate canonical crawl, including any recovered retry warnings. Verify that `/api/atlas/summary` organization count, `/api/atlas` total, and the complete marker collection agree while rich results remain at or below the requested page size. For a version-gated dossier release, verify that null-version legacy profiles do not query the rich `organization_dossiers` projection and that the crawl creates no new dossier-view REST 500 or PostgreSQL statement-timeout entry.
7. Review current Vercel errors and Supabase security and performance advisors.
8. Confirm pending publication and participation queues have been triaged.
9. Confirm the latest production deployment remains available for rollback.
10. Before any database command, verify the selected project reference is exactly `facoactpdckkhciamflk`. A stale local Supabase link is a hard stop; prefer an explicitly project-pinned control-plane call when the CLI database login role is unavailable.

## Deployment

1. Commit the approved release directly to `main` after local review and required validation.
2. Apply any reviewed migration to project `facoactpdckkhciamflk` in version order through an explicitly project-pinned path, then compare the resulting live ledger with the repository filenames and verify the schema and data effects. Skip this step when the release has no database change.
3. When a scheduler or private function changes, verify the job and its rollback dependency explicitly. Do not rely on Andrew to remember an internal database dependency.
4. Push `main` once and confirm the single Vercel production deployment.
5. Check `/api/health`, `/api/atlas/summary`, `/api/atlas?page=1&pageSize=18`, `/`, `/organizations`, `/regions`, `/missions`, one `/missions/[slug]`, `/demand`, `/briefs`, `/how-it-works`, `/sign-in` and one profile of each public record type.
6. Verify production security headers, sitemap, robots, social card and analytics consent, then inspect current Vercel and Supabase logs or advisors relevant to the change.

## Provider status

- Microsoft Clarity is intentionally deferred. Google Analytics, first-party workflow events and Vercel performance monitoring are the active measurement stack. Clarity is not a release dependency.
- Cloudflare Turnstile protects passwordless authentication and the public contact, feedback and update forms. The browser uses `NEXT_PUBLIC_TURNSTILE_SITE_KEY`; custom server endpoints verify each token with the server-only `TURNSTILE_SECRET_KEY`. Validation, honeypots and rate limits remain layered controls.

## Rollback

- Application: promote the most recent verified healthy Vercel deployment or revert the scoped release commit.
- Forward-compatible organization-dossier migration set: these migrations add nullable normalized fields and indexes, perform bounded current-activity and one-to-one program-participation citation backfills, replace the pilot-event constraint, rebuild anonymous/authenticated field-citation policies and the `security_invoker` dossier view, add version-specific reviewed editors and publishers, and replace the typed-candidate validation objects plus the shared backward-compatible publication dispatcher. Before application deployment, verify the legacy organization route, historical v1/v2 publishers through that dispatcher, anonymous/member/admin policy matrix, rebuilt view, function grants, and exact pre/post backfill counts. If the application release then fails, promote the last verified application deployment. Preserve the applied schema and repair forward; do not improvise a destructive column, view, function, citation, or backfill rollback during an incident.
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
- The August 10 research-review integrity release is active at commit `7fbcc9f` / deployment `dpl_FF778tjCMGeMbcsDa7GaVZFGErSA`. It advances new research runs to pipeline 1.7, enforces complete record-specific lineage and exact trusted-import parity, and repairs Admin Review presentation without a database migration or public-content transition. The Node 24 release gate, GitHub Release Validation, CodeQL, authenticated Admin Review, health/count reconciliation, 870-page zero-warning crawl and Vercel/PostgreSQL log window passed. The eight pilot candidates remain pending with exact baselines and zero decisions, publications or profile activations. For an application rollback, use the previously verified `f3544b2` deployment `dpl_EecxBts2AEa7aKk5pJ7azTUXKEuH`; preserve the private pending rows and do not alter their review state during rollback.
- Discovery reads now use deterministic paging, same-snapshot collection counts, linear-time fallback grouping, and a 5,000-marker regression gate in production. Health, catalogue consistency and the paced launch crawl have passed; `REL-2026-004` is closed. `REL-2026-003` remains open pending the anonymous and signed-in cache-header matrix.
- The August 9 organization-dossier foundation is active as the version-gated application at commit `8a29b13`. Both ordered migrations are recorded, the deployed contract advertises `tnm-review-publication-v3`, and the health, policy, route, count, advisor, GitHub, Vercel, Postgres-log and 869-page crawl gates passed. It delivers the shared editorial template, normalized dossier fields, Admin Review/Publish support, research interoperability, and a version-first loader without activating a public organization automatically. The first live editorial dossier remains a separate reviewed enrichment and Publish checkpoint with a representative cold-cache route/PDF and responsive/accessibility gate.
- Production Supabase records the dossier foundation as `20260809222847 organization_dossier_v3` followed by `20260809222938 research_organization_v3_publication`. Their verified post-state is 415 dossier rows, 177 normalized current-activity values, 122 normalized one-to-one participation summaries, 2,754 citations, zero active candidates, and zero activated profiles. Application promotion and the deployed v3 contract check remain separate from those database facts.
- The initial application promotion `aa6dc34` exposed rich-view timeouts on unactivated legacy profiles. Hotfix `8a29b13` / deployment `dpl_4Phqy6Y3Li3EHMeRAHnyzvnUX19B` now resolves the profile version before choosing the rich or legacy loader. All 11 affected routes and the 869-page crawl passed with zero recovered warning; the hotfix deployment has no 5xx/runtime error and PostgreSQL has no new statement timeout. If this read-path repair regresses, the prior verified application deployment `783b7f5` / `dpl_EPn1AWT5cpG45aof4YBobbkaLLpc` remains the rollback target while the forward-compatible dossier schema is preserved for repair-forward.
