# North Signal unification, delivery preferences and conversion measurement

Status: provider reconciled; production release and verification in progress
Owner: Andrew Davies
Implementation owner: MAIN DEV
Opened: 2026-08-26

## Objective

Make North Signal the single consent-backed email newsletter while keeping
Defence Signals as the public source-linked editorial stream. Weekly North
Signal delivery remains the default; optional new-Defence-Signal alerts are a
separately consented delivery preference and is available only while the public
flag, server configuration and verified provider operating state all agree.

## Authority and release boundary

Andrew approved the MailerLite configuration, controlled preference proof,
two-stage production migration, Git commit/push and production deployment on
2026-08-27. That authority does not extend to a full newsletter audience send,
publication, social post or outreach. Production acceptance still requires the
exact pushed SHA, READY deployment, ordered post-deploy reconciliation, bounded
launch validation and live health/provider checks.

Unrelated tracked Command Centre governance work and every untracked research
lineage artifact are user-owned and remain outside this plan.

## Workstreams

1. Reconcile public naming, navigation, metadata, structured data, social cards,
   RSS language, legal copy and email source templates to the one-newsletter
   hierarchy.
2. Add compact, context-aware signup placements to Defence Signals and selected
   high-intent records without stacking automatic prompts.
3. Add private service-role newsletter preference, delivery-run and aggregate
   campaign-metric tables, with an idempotent active-subscriber weekly-only
   backfill and independently versioned consent/withdrawal history.
4. Extend the existing MailerLite integration for master, weekly and optional
   alert groups while keeping provider mutations guarded by explicit authority;
   distinguish group preference webhooks from global unsubscribe.
   Ordinary, administrator-created and API-created group membership cannot
   create consent. The sole provider-originated exception requires a signed
   group webhook with an explicit event time no more than five minutes from
   server receipt, corroborated by an exact-group Preference Center activity
   within five minutes of that event; missing, delayed or mismatched activity
   fails closed.
5. Harden first-party funnel measurement with event idempotency, bounded client
   and server timestamps, queryless paths, validated attribution, server-derived
   traffic classification, event-specific metadata and distinct-session funnel
   reporting.
6. Remove the 5,000-event Admin Insights truncation; add 7/14/28-day newsletter,
   delivery and product-continuation summaries with unavailable/stale states.
7. Reconcile Signals discovery, reciprocal record links, topic anchors, archive
   pagination, sitemap freshness and server-rendered homepage links.
8. Update canonical governance and run migration/RLS checks, governance
   validation, focused tests, full tests, lint, visibility validation where
   affected, Node 24 release validation and responsive/keyboard local QA.

## Live baseline captured before editing

Read-only production reconciliation on 2026-08-26 found:

- 6 global subscriber records: 4 active and 2 unsubscribed;
- 0 current provider-sync failures and 6 MailerLite-linked identities;
- 7,182 first-party events in the latest 30-day window, including 1,280
  newsletter/subscription events across 5,694 non-null sessions;
- 21 published Defence Signals editions, latest published 2026-08-26;
- production migration history aligned through
  `20260813083552 sanitize_public_organization_profile_data`.

These counts are a dated implementation baseline, not a durable product claim.

## Production closure gate

Provider reconciliation and production release are explicitly authorized. Close
only after the exact staged candidate passes Node 24 release validation, the base
migration is applied, one exact commit is pushed and reaches Vercel READY, the
post-deploy migration and live RLS/backfill assertions pass, bounded affected-route
launch validation and health/log/browser checks pass, and the production evidence
is handed back to Marketing. A full audience send, publication, social post or
outreach remains outside this release.

## Pre-release implementation evidence — 2026-08-26

- Unified public naming, route copy, metadata, structured data, social cards,
  homepage links, Signals contextual signup, RSS access, reciprocal record
  links, topic anchors, archive pagination and sitemap freshness are implemented
  locally.
- Signup records weekly consent and optional alert consent atomically with
  `newsletter_success`; the alert choice requires agreement between the public
  alert-availability flag and all server provider prerequisites. Inline surfaces suppress
  competing automatic prompts.
- The base and post-deploy reconciliation migrations are prepared and exercised
  through the complete isolated migration chain. The approved production order
  is fixed:
  `20260826212834_north_signal_delivery_preferences_and_measurement.sql` ->
  compatible application deployed and exact production deployment READY ->
  `20260826212910_north_signal_post_deploy_preference_reconciliation.sql` ->
  live assertions for service-role-only access, one weekly preference per active
  global subscriber, zero alert consent from backfill, preserved withdrawals and
  the skipped current-edition baseline.
- Provider events use a transaction-level receipt before mutation and reject
  stale state changes. Ordinary/admin/API group additions cannot manufacture
  consent. Only a signed group-add webhook with an explicit event time within
  five minutes of server receipt, whose exact group and event time are also
  corroborated within five minutes by a `preference_center` or
  `marketing_preferences_change` activity, may establish stream consent; all
  missing, malformed, delayed, stale or mismatched activity fails closed.
- Admin Insights pages the complete event window, reports distinct non-QA
  7/14/28-day funnels, preference/sync/delivery availability and separate
  measurement-system denominators. The 5,200-event regression passes.
- Source-controlled welcome, weekly and Defence Signal alert contracts use the
  one-newsletter hierarchy and bounded email UTMs. RSS alert content includes a
  source-linked summary, concrete topics and a published evidence limit.
- The pre-release production baseline remains 6 global records: 4 active and 2
  unsubscribed. Expected backfill remains 4 weekly, 0 alerts and no change to
  withdrawals. MailerLite is verified on Comfort at USD $129.60 annually with
  zero incremental feature cost. The master/weekly/alert groups, Preference
  Center, welcome workflow, weekly template, lifecycle webhook and new-posts-only
  `08:00 America/Halifax` RSS campaign are reconciled. One controlled campaign
  was sent only to Andrew; temporary delivery-group memberships were removed.
- The application disables automatic initial GA page views and emits one
  queryless manual public-route view with approved campaign fields. Live GA
  Enhanced Measurement browser-history configuration remains unverified and
  unchanged; if enabled, the pending provider delta is to disable only that
  duplicate history-change page-view option and verify one view per navigation.

Final clean local validation is complete on Node 24.19.0: 100 focused
assertions, 76 test files and 527 tests, full lint, governance validation,
visibility validation, the production build, `git diff --check` and
`pnpm release:validate` all pass. The release gate also passed repository
hygiene, security validation and the 5,000-marker scale contract. Responsive and
keyboard review passed at 390, 768, 1,024 and 1,440 pixels for the homepage,
Signals archive and latest edition, North Signal, a contextual organization
dossier and desktop/mobile capture UI. The local review packet, non-personal
Admin Insights fixture and weekly/alert email renders are under
`/tmp/tnm-north-signal-unification-2026-08-26/`. Headless Turnstile produced only
opaque Cloudflare-origin challenge messages; no signup was submitted.

This plan remains active until the exact commit is deployed and READY, both
migrations are reconciled in dependency order, bounded production validation
passes and Marketing receives the production handback. GA Enhanced Measurement
remains a separately governed provider setting; no plan purchase or full audience
send is part of this release.
