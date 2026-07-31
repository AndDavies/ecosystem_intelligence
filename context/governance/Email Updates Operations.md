# North Signal Email Operations

## Purpose

True North Map captures affirmative consent for **North Signal**, a concise weekly briefing on new Canadian defence capabilities, released public needs, and developments worth following. The production database remains the consent ledger. MailerLite is the delivery provider, not the source of truth for consent or product analytics.

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
- Contextual forms appear after discovery on the homepage, after the evidence section of an organization profile, and after a Defence Brief.
- Automatic desktop capture is limited to high-intent actions such as opening evidence, viewing an Ask True North result, opening a second organization profile, or reading 60 percent of a Defence Brief. Mobile uses a compact dismissible banner that opens a purpose-built bottom sheet.
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

Use `/admin/insights` to inspect the privacy-bounded funnel from qualified impression to active subscriber. Reporting is grouped by placement and uses only bounded context such as placement, trigger, device class, content type, and landing path. It never joins an email address, Ask True North query, or named account to behavioural events.

## Sending updates

Build and send campaigns in MailerLite. Do not add an in-application campaign composer or sending engine. Before the first send:

1. Verify `updates@truenorthmap.ca` and authenticate the True North Map sender domain with SPF and DKIM.
2. Confirm the monitored reply address and the lawful physical mailing address used in the footer.
3. Send a test to multiple mail providers and verify the unsubscribe link.
4. Select only the dedicated True North Map group.
5. Send North Signal weekly and keep each issue concise: one lead signal, newly mapped organizations or technologies, released public needs and possible fits, selected Canadian defence developments, and one clear path back into the product.

If a paid newsletter or premium intelligence product is introduced later, keep commercial entitlement and billing outside the consent ledger. The mailing provider may segment delivery, but the production database must continue to record consent and withdrawals.

Campaign sending is available through MailerLite. The monitored mailbox, verified sender, authenticated domain, lawful footer address, API token, `Ecosystem Intelligence` delivery group, lifecycle webhook, and current subscriber reconciliation are complete. Weekly issue sending remains a manual administrator action: test the campaign in Gmail and a non-Gmail client, verify its unsubscribe link and footer, then select only the dedicated group.

The welcome automation sends one immediate message from `Andrew Davies <andrew@truenorthmap.ca>` only when a new subscriber enters the dedicated group. Its source-controlled copy lives in `content/email/north-signal/welcome.md`. The automation does not create consent, import another list, or send to legacy groups.

The existing MailerLite architecture remains appropriate for broader sharing. Do not build a second in-application campaign system. Reassess the MailerLite tier only when the active subscriber count, weekly send volume, automated sequences, or audience segmentation exceed the current plan.

## Weekly issue preparation

Use the project-local `.agents/skills/tnm-north-signal/` workflow to prepare a private issue packet. It combines three bounded inputs without merging their authority:

1. Published production changes provide newly mapped and recently updated organizations, technologies, Public Needs, and reviewed matches.
2. The approved Inoreader portfolio and selected Gmail labels provide discovery leads only.
3. Web research resolves each external lead to an original, durable source before it may be summarized.

The skill validates source provenance, relevance, recency, duplication, Canadian consequence, links, and issue structure. It stops before MailerLite creation or sending. Andrew remains the editor and sender of record.
