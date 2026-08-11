# North Signal Email Operations

Status: active North Signal delivery runbook
Owner: Andrew Davies
Last reviewed: 2026-08-10

## Purpose

True North Map captures affirmative consent for **North Signal**, the weekly decision brief built from published Canadian Defence Signals, reviewed organizations, Mission Areas and released Public Needs. `/north-signal` is the acquisition hub and `/signals` is the sample library. The production database remains the consent ledger. MailerLite is the delivery provider, not the source of truth for consent or product analytics.

## Operating model

```text
Public North Signal form
        |
        v
Private consent ledger in production
        |
        +--> private admin subscriber list and CSV export
        |
        +--> MailerLite group for compliant delivery
                   |
                   +--> unsubscribe, bounce, and spam events
                              |
                              v
                   signed webhook reconciliation
```

- The signup route saves consent before attempting provider synchronization.
- A provider outage never discards a valid signup. The admin page marks the record as needing delivery sync.
- MailerLite unsubscribe events update the local consent status immediately.
- Bounce, spam, deletion, and other delivery states remain separate from the local consent status.
- Account deletion with the unsubscribe option records the withdrawal locally and attempts to suppress the MailerLite subscriber.
- No public Data API role can read subscriber records.
- Header and footer actions open a focus-managed North Signal form immediately.
- Contextual forms appear after useful content on the homepage, Signals archive and editions, Mission Areas, released Public Needs, organization profiles, and the preserved Brief archive.
- Automatic desktop capture is limited to high-intent actions such as opening evidence, viewing an Ask True North result, opening a second organization profile, or reading 60 percent of a Signals edition. Mobile uses a compact dismissible banner that opens a purpose-built bottom sheet.
- There is no unconditional timer or exit-intent interception. Automatic prompts respect a 30-day dismissal and never appear on authentication, account, contribution, connection, feedback, or administrator routes.
- Submission is the affirmative consent action. The form records the exact adjacent disclosure, its version, placement, trigger, landing path, and consent time without a separate checkbox.
- Managed Turnstile uses `interaction-only` presentation. Server-side token verification remains mandatory even when no challenge is visible.
- The signup and feedback forms are explicitly masked from optional experience-recording tools.

## Required server configuration

- `MAILERLITE_API_TOKEN`: private MailerLite API token.
- `MAILERLITE_GROUP_ID`: the group reserved for True North Map updates.
- `MAILERLITE_WEBHOOK_SECRET`: secret returned when creating the signed webhook.

The webhook destination is `https://truenorthmap.ca/api/email/mailerlite/webhook`. The current webhook subscribes to unsubscribe, bounce, spam-report, and deletion events and may deliver a single event or a signed batch. Never expose these values as `NEXT_PUBLIC_*` variables.

The current delivery group is `Ecosystem Intelligence`. It is reserved for True North Map and North Signal despite retaining the project-category name. Provider subscriber IDs are operational references only. Reconciliation may replace them when a workspace or token changes without altering consent timestamps, sources, or withdrawal history.

## Admin workflow

Use `/admin/subscribers` to see the current consent-backed list, distinguish local consent from provider delivery status, identify sync failures, and export a CSV. Subscriber details do not appear in the broader public-beta insights view.

Use `/admin/insights` to inspect landing views, sample clicks, form starts, submit attempts, successful consent writes, errors and dismissals. Reporting groups the bounded funnel by route, placement, device, UTM source/medium and campaign while showing the active consent-backed subscriber total separately from event counts. Historical placement and `subscription` values remain reportable. It never joins an email address, Ask True North query, or named account to behavioural events.

## Sending updates

Build and send campaigns in MailerLite. Do not add an in-application campaign composer or sending engine. Before the first send:

1. Verify `updates@truenorthmap.ca` and authenticate the True North Map sender domain with SPF and DKIM.
2. Confirm the monitored reply address and the lawful physical mailing address used in the footer.
3. Send a test to multiple mail providers and verify the unsubscribe link.
4. Select only the dedicated True North Map group.
5. Send North Signal weekly using one thing to know, up to three Signals behind it, what this changes, new capability/Mission Area/Public Need connections, what remains unresolved, what to watch next, `/signals`, and one contextual product path.

If a paid newsletter or premium intelligence product is introduced later, keep commercial entitlement and billing outside the consent ledger. The mailing provider may segment delivery, but the production database must continue to record consent and withdrawals.

Campaign sending is available through MailerLite. The monitored mailbox, verified sender, authenticated domain, lawful footer address, API token, `Ecosystem Intelligence` delivery group, lifecycle webhook, and current subscriber reconciliation are complete. Weekly issue sending remains a manual administrator action: test the campaign in Gmail and a non-Gmail client, verify its unsubscribe link and footer, then select only the dedicated group.

The welcome automation sends one immediate message from `Andrew Davies <andrew@truenorthmap.ca>` only when a new subscriber enters the dedicated group. Its source-controlled copy lives in `content/email/north-signal/welcome.md`, points to recent Signals plus Mission Areas, and was reconciled to the live provider and production-tested on August 10. The test proved the event chain, consent write, provider synchronization, authenticated delivery, links, lawful footer and unsubscribe controls; exact cleanup restored the three real consent-backed subscribers and removed the disposable test contacts. The reusable source-controlled weekly structure lives in `content/email/north-signal/weekly-template.md` and remains authoritative, but its live provider template must be reconciled and tested before the first manual issue because MailerLite's editor returned a repeatable 503 during closure. The automation does not create consent, import another list, retrigger existing group members when reactivated, or send to legacy groups.

The existing MailerLite architecture remains appropriate for broader sharing. Do not build a second in-application campaign system. Reassess the MailerLite tier only when the active subscriber count, weekly send volume, automated sequences, or audience segmentation exceed the current plan.

## Weekly issue preparation

Use the project-local `.agents/skills/tnm-north-signal/` workflow to prepare a private issue packet. It combines three bounded inputs without merging their authority:

1. Published Signals from the issue window provide the initial pattern and stable sample links; their original durable sources remain mandatory.
2. Published production changes add organizations, technologies, Public Needs and reviewed matches only when they change the reader's understanding.
3. The validated 28-feed register, selected Gmail labels and web research provide discovery leads only; every selected external lead resolves to an original durable source.

The skill validates source provenance, relevance, recency, duplication, Canadian consequence, six required section IDs, one-to-three published Signal references, original source IDs, `/signals`, at least one `/signals/[slug]` link, one exploration link, and a complete feed-health reconciliation. North Signal copy may not contain `/briefs` links. It stops before MailerLite creation or sending. Andrew remains the editor and sender of record.
