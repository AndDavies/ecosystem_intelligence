# Email Updates Operations

## Purpose

True North Map captures affirmative consent for occasional product and ecosystem updates. The production database remains the consent ledger. MailerLite is the delivery provider, not the source of truth for consent or product analytics.

## Operating model

```text
Public update form
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

## Required server configuration

- `MAILERLITE_API_TOKEN`: private MailerLite API token.
- `MAILERLITE_GROUP_ID`: the group reserved for True North Map updates.
- `MAILERLITE_WEBHOOK_SECRET`: secret returned when creating the signed webhook.

The webhook destination is `https://truenorthmap.ca/api/email/mailerlite/webhook`. The current webhook subscribes to unsubscribe, bounce, spam-report, and deletion events and may deliver a single event or a signed batch. Never expose these values as `NEXT_PUBLIC_*` variables.

The current delivery group is `True North Map Updates`. Provider subscriber IDs are operational references only. Reconciliation may replace them when a workspace or token changes without altering consent timestamps, sources, or withdrawal history.

## Admin workflow

Use `/admin/subscribers` to see the current consent-backed list, distinguish local consent from provider delivery status, identify sync failures, and export a CSV. Subscriber details no longer appear in the broader public-beta insights view.

## Sending updates

Build and send campaigns in MailerLite. Do not add an in-application campaign composer or sending engine. Before the first send:

1. Verify `updates@truenorthmap.ca` and authenticate the True North Map sender domain with SPF and DKIM.
2. Confirm the monitored reply address and the lawful physical mailing address used in the footer.
3. Send a test to multiple mail providers and verify the unsubscribe link.
4. Select only the dedicated True North Map group.
5. Use occasional, high-signal updates: new coverage, useful market observations, and material product improvements.

If a paid newsletter or premium intelligence product is introduced later, keep commercial entitlement and billing outside the consent ledger. The mailing provider may segment delivery, but the production database must continue to record consent and withdrawals.

Campaign sending is available through MailerLite. The monitored mailbox, verified sender, authenticated domain, lawful footer address, API token, delivery group, lifecycle webhook, and current subscriber reconciliation are complete. Sending remains a manual administrator action: test the campaign in Gmail and a non-Gmail client, verify its unsubscribe link and footer, then select only the `True North Map Updates` group.
