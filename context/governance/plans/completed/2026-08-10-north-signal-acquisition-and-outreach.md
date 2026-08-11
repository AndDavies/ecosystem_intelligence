# North Signal acquisition and outreach release

Status: application and automatic welcome complete; weekly send remains manual
Owner: Andrew Davies
Started: 2026-08-10

## Objective

Make `/north-signal` the consent-backed acquisition surface and `/signals` the public proof library, while keeping existing Defence Brief URLs available as an evergreen archive. Align product telemetry, the signup experience, the private weekly editorial workflow, source-feed governance, tracked email copy and outreach assets without sending a campaign, applying a database migration or deploying production.

## Locked boundaries

- Supabase remains the private consent ledger and MailerLite remains the delivery provider.
- North Signal issue creation remains private, read-only and human-reviewed.
- No MailerLite campaign send, social post, partner message, direct outreach, subscriber import or paid campaign is authorized by this implementation. The approved application release, bounded migration and production welcome-workflow validation are recorded below.
- Existing Defence Brief URLs remain canonical, indexed and available; they leave primary acquisition and navigation only.
- Existing uncommitted autonomous-research changes and private wave-two artifacts are unrelated user work and must remain intact.

## Implementation sequence

1. Reconcile live subscriber, Signal-edition, event, feed and migration state.
2. Repair Signals eligibility, source validation and the bounded consent funnel.
3. Add the North Signal page, RSS feed, approved jet derivative and redesigned signup surfaces.
4. Replace primary Defence Brief promotion with Signals while preserving the archive.
5. Introduce and test `north_signal_issue_v2`, feed-health reporting and Signals-led weekly editorial copy.
6. Update tracked MailerLite source copy, outreach templates, brand and governance.
7. Create but do not apply the versioned event-name migration.
8. Run Node 24 application, launch, accessibility, browser and release checks.

## Completion evidence required

- Complete event chain from landing view through one post-consent success event.
- Correct route, placement, device, UTM source/medium and campaign reporting with active subscribers kept separate.
- `/north-signal`, `/signals`, one Signal edition, `/signals/feed.xml` and the preserved Brief archive pass responsive and keyboard QA.
- The issue validator accepts one complete Signals-led v2 example and rejects missing Signal links, unknown sources, discovery-only evidence, duplicate sections and Brief links.
- The 28-feed register validates and produces a private feed-health summary contract.
- Migration is applied and the application is released; the automatic welcome is corrected and production-tested, and all campaign and outreach activity remains unsent.

## Completion evidence

- Pinned Node 24 `pnpm release:validate` passed repository hygiene, governance,
  dependency audit, 59 test files / 363 tests, lint, the 5,000-marker scale
  check and the optimized production build.
- `pnpm launch:validate`, TypeScript, the private v2 issue-validator tests and
  the 28-feed registry validator passed. The read-only feed-health probe found
  27 available feeds, one stale NRC feed and no failed or unresolved feeds.
- Responsive browser QA at 390, 768, 1024 and 1440 px covered
  `/north-signal`, the desktop dialog, mobile sheet, `/signals`, one Signal
  edition and `/signals/feed.xml`; focus containment/restoration, imagery,
  source links and overflow checks passed.
- The migration and application were subsequently released at commit
  `459cc32`. Production route, consent, telemetry, MailerLite subscriber-sync,
  Gmail authentication and runtime checks passed. The authenticated MailerLite
  welcome was then updated to the tracked Signals-led source and tested through
  a fresh public signup: the bounded event chain, Supabase consent, provider
  synchronization, authenticated Gmail delivery, both destination links,
  lawful footer and unsubscribe headers all passed. Exact test cleanup restored
  three active consent-backed subscribers and removed both disposable provider
  contacts without touching legacy groups. The reusable weekly provider
  template remains a pre-send checkpoint because its editor returned a
  repeatable 503. No campaign, social post, partner message, direct outreach or
  paid promotion occurred.

## Explicit checkpoints still requiring approval

1. Reconcile the reusable MailerLite weekly template to the tracked v2 source
   and test it in Gmail plus a non-Gmail client before the first manual send.
2. Begin owned, founder-led or partner outreach only after the released page
   establishes a clean measurement baseline.
