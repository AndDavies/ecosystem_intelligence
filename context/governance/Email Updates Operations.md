# North Signal Email Operations

Status: canonical North Signal consent and delivery runbook; provider reconciled and production application release authorized
Owner: Andrew Davies
Last reviewed: 2026-08-27

## Product and authority

There is one email newsletter: **North Signal**. Its default delivery is the
human-reviewed weekly briefing. **Defence Signals** is the public source-linked
editorial stream at `/signals`; **Also email me when a new Defence Signal is
published** is an optional North Signal delivery preference, not a second or
daily newsletter. A valid `no_publish` Signals run creates no edition and no
alert.

Current production Supabase is the global consent ledger. The versioned
stream-specific preference contract releases in the dependency order recorded
below.
MailerLite is the delivery provider. Ordinary provider membership, an
administrator/API group addition, a campaign event or an email open never creates
consent. The release contract's only provider-originated consent exception is a
signed group webhook corroborated by an exact-group, recent Preference Center
activity record under the fail-closed rule below. Andrew retains every weekly
test/send, provider purchase, group/configuration and alert-activation decision.

## Consent and preference model

```text
Affirmative North Signal form
        |
        +--> weekly consent (required and default)
        |
        +--> Defence Signal alerts (separate, unchecked, optional)
        |
        v
pilot_update_signups: global identity and lifecycle ledger
        |
        +--> newsletter_subscription_preferences: current stream state
        +--> newsletter_subscription_preference_history: append-only consent/withdrawal
        +--> MailerLite master + weekly/alert delivery groups
```

- The primary submission explicitly subscribes to weekly North Signal. The
  alert checkbox is absent unless the public feature flag and all server-side
  provider prerequisites agree; partial configuration fails closed.
- Weekly and alert consent have independent version, text, timestamp and
  withdrawal history. Existing active subscribers are backfilled weekly only;
  no backfill may grant alert consent.
- Later preference management may support weekly only, alerts only or both.
  Clearing both records a global unsubscribe and must suppress the provider
  master subscriber. A provider group removal withdraws only that stream until
  no active stream remains.
- Ordinary, administrator-created and API-created provider group additions may
  reconcile an already consented stream but may not create consent. The only
  exception requires a valid signed `group_added` webhook
  for the exact delivery-group ID and an explicit event timestamp no more than
  five minutes from server receipt, plus a MailerLite activity-log record named
  `preference_center` or `marketing_preferences_change` for that same group,
  carrying an explicit timestamp within five minutes of the webhook event. A
  missing, malformed, stale or mismatched activity record fails closed. The
  resulting local history is labelled `mailerlite_preference_center`; ordinary
  membership never receives that source.
- Consent and `newsletter_success` are one database transaction with an
  idempotent operation key. Behaviour events never contain or join to email.
- Provider failure never discards valid local consent. Current preference rows
  report `pending`, `synced`, `failed` or `not_configured` separately.
- The base migration is deployment-compatible with the old application. The
  exact ordered release sequence is recorded under **Database release
  sequence**. A second idempotent post-deploy migration reconciles any active
  subscriber created in that bounded window, proves zero missing weekly
  preferences and still grants no alerts.

## Capture and measurement contract

- Header and footer actions say **Subscribe to the free newsletter** and open a
  focus-managed form. `/north-signal` is the acquisition page; `/signals` and
  edition pages provide the public proof and contextual signup.
- Inline and contextual forms suppress a competing automatic prompt on the same
  route. Automatic prompts retain the 30-day dismissal and subscriber
  suppression; `/map`, account, authentication and private workflows are not
  interrupted.
- `newsletter_impression` means at least 50 percent of the offer was visible for
  one continuous second, once per placement/session. `newsletter_open` requires
  deliberate reveal and applies only to a modal, drawer or banner. Inline forms
  have no invented open stage.
- `newsletter_form_start`, `newsletter_submit` and `newsletter_success` mean
  started, submitted and local consent recorded. Provider sync and delivery are
  separate outcomes.
- Every new event has a unique `event_id`, bounded client `occurred_at`, server
  `received_at`, queryless paths, broad server-derived entry channel and traffic
  class, validated UTM fields and event-specific metadata. Raw query strings,
  referrers, PII and free-form values are rejected.
- `/admin/insights` reports distinct ordered non-QA sessions over 7, 14 and 28
  days: inline `shown -> started -> submitted -> consent`; modal/banner `shown
  -> opened -> started -> submitted -> consent`; dedicated page `landing ->
  started -> submitted -> consent`. Event counts remain diagnostics. Event
  pages are read to exhaustion rather than capped at 5,000.
- Search Console search visibility, analytics-consented GA4 traffic,
  first-party funnel events, the authoritative consent ledger and aggregate
  MailerLite delivery metrics retain separate denominators. The visibility
  refresh aligns GSC and GA to the latest finalized GSC date in
  `America/Halifax`, production hostname only. `accounts.google.com` is an
  authentication/service referral, never organic search. GA keeps a queryless
  `page_location` and receives approved UTMs as explicit campaign fields.
- The application sends one explicit SPA `page_view` per eligible public route
  with `send_page_view: false`. The live Enhanced Measurement browser-history
  setting was not authenticated or changed in this local pass. If the provider
  setting still emits page views for browser-history changes, the exact pending
  provider delta is to disable that history-change page-view option only, retain
  the other approved aggregate measurements, and verify one route view per
  navigation before comparing GA with Search Console.

Detailed events expire after 30 days. Sanitized aggregate summaries may enter
the owner-only Command Centre through the existing visibility acknowledgement;
subscriber identity never does.

## Database release sequence

The versioned base migration introduces service-role-only RLS/grants for:

- `newsletter_subscription_preferences` and append-only preference history;
- `newsletter_delivery_runs`, unique by stream and issue or edition;
- append-only `newsletter_campaign_metric_snapshots` for sent, delivered,
  estimated unique opens, unique clicks, bounces and unsubscribes;
- idempotent provider-event receipts containing no email identity.

The dated pre-release baseline was 6 global records: 4 active and 2
unsubscribed. The base backfill therefore expects 4 weekly preferences, 0 alert
preferences and no changes to the 2 unsubscribed records. The latest published
edition becomes a `skipped` alert baseline only, so no archive can become a
backlog. Live acceptance must reconcile these expectations after the ordered
release rather than relying on the dated preview.

The production release order is dependency-bound:

1. Apply
   `20260827100251_north_signal_delivery_preferences_and_measurement.sql` while
   the old application remains compatible.
2. Deploy the compatible application and wait for the exact production
   deployment to reach READY.
3. Only then apply the idempotent
   `20260827100553_north_signal_post_deploy_preference_reconciliation.sql`.
4. Reconcile live state: every active global subscriber has one weekly
   preference, no subscriber gains alert consent by backfill, the two existing
   withdrawals remain withdrawn, the current edition remains the skipped alert
   baseline, and the service-role-only RLS/grant assertions pass.

This sequence does not grant research, publication, outreach or weekly audience
send authority.

## Server and provider configuration

Server-only configuration:

- `MAILERLITE_API_TOKEN`
- `MAILERLITE_MASTER_GROUP_ID` (with `MAILERLITE_GROUP_ID` as the temporary
  backward-compatible master alias)
- `MAILERLITE_WEEKLY_GROUP_ID`
- `MAILERLITE_SIGNAL_ALERTS_GROUP_ID`
- `MAILERLITE_WEBHOOK_SECRET`
- `MAILERLITE_PREFERENCE_CENTER_ENABLED=true` only while the published secure
  Preference Center and signed group lifecycle webhook remain operational
- `MAILERLITE_PREFERENCE_ACTIVITY_VERIFIED=true` only while the exact recent
  provider-activity corroboration contract remains operational

`NEXT_PUBLIC_DEFENCE_SIGNAL_ALERTS_ENABLED=true` is the production public flag.
The server additionally requires the token and all three group IDs before it
advertises alert capability, so the checkbox cannot expose a broken opt-in.
Never expose tokens, group IDs or webhook secrets as public variables.

The existing `Ecosystem Intelligence` group is the master lifecycle group;
**North Signal Weekly** and **Defence Signal Alerts** are the delivery groups.
Signup assigns master + weekly and optional alerts. Four active master members
were backfilled weekly only; the alert group returned to zero members after the
controlled Preference Center proof.

The signed webhook accepts single and batched lifecycle/group events. Global
unsubscribe withdraws all streams. Group removal withdraws one stream and, when
it clears the final stream, globally unsubscribes the provider subscriber.
Provider events use a transaction-level receipt before mutation, reject stale
events relative to newer consent and are retry-safe. Bounce, junk and
unconfirmed states affect provider sync status without inventing withdrawal.
For group addition, only a signed event whose explicit event time is within five
minutes of server receipt and whose exact group ID and event time are
corroborated by the Preference Center activity-log check may create the
corresponding local stream preference. Timestamp-less and delayed first-seen
events fail closed. All ordinary/admin/API membership events can reconcile
existing consent only.

## Defence Signal alert contract

MailerLite RSS is the active delivery mechanism:

1. Check `/signals/feed.xml` at `08:00 America/Halifax`, the provider's supported
   whole-hour cadence.
2. Establish the current published edition as the baseline before activation.
3. Send new posts only. The canonical edition URL is the stable GUID and the
   original publication timestamp is stable, so corrections do not resend.
4. A late edition waits for the next check. Draft, `no_publish`, missing-feed or
   failed-route states send nothing.
5. The RSS description carries the source-linked executive summary, two to
   three concrete topics and one published evidence limit. The email uses one
   **Read the Defence Signal** action and explains that alerts are an optional
   North Signal preference.
6. Record only aggregate delivery runs and metric snapshots. Estimated opens
   are directional; clicks and attributable deeper actions are stronger.

Use `utm_source=mailerlite`, `utm_medium=email`,
`utm_campaign=north_signal_weekly|defence_signal_alerts`, and
`utm_content=<issue_or_edition_slug>_<cta_slug>`.

The August 27 authenticated workspace check confirmed Comfort at USD $129.60
annually through 2027-07-30. RSS and Preference Center add USD $0; no purchase or
plan change occurred. The published Preference Center, active lifecycle webhook
and RSS schedule remain provider operating state to verify after relevant
changes.

## Welcome and weekly operations

`content/email/north-signal/welcome.md`, `weekly-template.md` and
`defence-signal-alert.md` are source contracts only. Editing them does not edit
MailerLite. All use the Directional N, `NORTH SIGNAL` or `DEFENCE SIGNAL`
product label, one 600-to-640-pixel Field/Paper column, Inter body/UI copy,
restrained Editorial Blue, Evidence Green only for verified-source meaning and
one rectangular Signal Yellow action. The welcome has no generic hero image;
weekly may use one approved issue-specific cited image.

Welcome is one immediate message for newly consented master-group entrants.
North Signal weekly remains prepared through `.agents/skills/tnm-north-signal/`,
then reviewed, edited, inbox-tested and manually sent by Andrew only to the
**North Signal Weekly** group. The skill retains original durable sources, one to three published
Defence Signal references, one product exploration path and no `/briefs`
acquisition links; it never creates or sends a provider campaign.

On August 27 the welcome workflow, weekly template, delivery groups, Preference
Center, lifecycle webhook and branded RSS alert were reconciled in MailerLite.
One controlled preference campaign was sent only to Andrew; the temporary
weekly/alert memberships were removed afterward. The RSS schedule is active,
new-posts-only and has zero alert recipients until affirmative alert consent is
recorded. Weekly issues still require Andrew's separate review, inbox tests and
manual send authorization.
