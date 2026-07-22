# Email and domain infrastructure

## Purpose

True North Map separates human correspondence, product updates, and account-security mail so each function has a clear owner, consent model, sender identity, and rollback path.

## Service boundaries

| Function | Service | Intended sender | Source of truth |
|---|---|---|---|
| Human correspondence | Zoho Mail | `andrew@truenorthmap.ca` and approved aliases | Monitored Zoho mailbox |
| Updates and newsletters | MailerLite | `True North Map <updates@truenorthmap.ca>` | Production consent ledger, mirrored to MailerLite |
| Authentication and security | Supabase Auth through Resend SMTP | `True North Map <access@auth.truenorthmap.ca>` | Supabase Auth |

Never send authentication mail through MailerLite. Never use the subscriber list as an authentication or customer database. Never use Resend for campaigns.

## Current production state

- `auth.truenorthmap.ca` is authenticated in Resend through Vercel DNS.
- Supabase custom SMTP uses a sending-only Resend credential restricted to the authentication subdomain.
- Supabase authentication email volume remains limited to 30 messages per hour.
- The six authentication templates are stored in `content/email/auth/` and applied in Supabase.
- Password, email, sign-in-method, and MFA security notifications are enabled. Phone-change notification remains off because phone authentication is not offered.
- Passwordless email initiation is protected by a managed Cloudflare Turnstile widget for `truenorthmap.ca` and `localhost`. The public site key is a Vercel and local application variable. The secret is stored only in Supabase Auth.
- MailerLite uses the `True North Map Updates` group. The production consent ledger has been reconciled to that group, and the lifecycle webhook accepts signed single or batched events.
- Zoho and MailerLite sender-domain authentication remain blocked until the monitored True North Map mailbox is established. Campaign sending remains blocked until the lawful footer address is confirmed.

## Provider ownership and administration

- Domain and deployment owner: Vercel project for `truenorthmap.ca`.
- Authentication data and transactional-delivery owner: Supabase project `facoactpdckkhciamflk`.
- Human-mail owner: the True North Map Zoho organization, once the domain migration is approved and completed.
- Marketing-delivery owner: the True North Map MailerLite workspace.
- Operational administrator and reply contact: Andrew Davies.
- Public support, privacy, security, and update addresses must not be advertised until their Zoho routes receive and send successfully.

## Secret ownership

- Resend SMTP password: Supabase Auth only.
- Turnstile secret: Supabase Auth only.
- Turnstile site key: `NEXT_PUBLIC_TURNSTILE_SITE_KEY` in Vercel and local development.
- MailerLite token, group ID, and webhook secret: server-only Vercel variables.
- No provider secret belongs in GitHub, public Vercel variables, browser code, or governance documents.

## DNS policy

- Vercel is authoritative for `truenorthmap.ca` DNS.
- Keep one root SPF record and one root DMARC record.
- Use service-specific DKIM selectors and the Resend authentication subdomain to isolate sending functions.
- Publish root DMARC at `p=none` only after Zoho and MailerLite authentication pass. Review aggregate reports before increasing enforcement.

## Authentication operations

1. Keep Google and passwordless email as the public sign-in methods.
2. Keep the email form disabled until Turnstile returns a token.
3. Pass the token to Supabase with the passwordless request. Do not validate it in a second application-owned system.
4. Keep links single-use and return only to allowed True North Map paths.
5. Do not add tracking pixels or marketing content to authentication messages.
6. Test SMTP changes with a controlled magic-link request before enabling dependent notifications.

## Rollback

- Disable Supabase custom SMTP to return temporarily to the built-in sender.
- Restore the saved Supabase template versions if a rendering issue appears.
- Disable Supabase CAPTCHA before removing the public site key from the application.
- Revoke the Resend credential without affecting Zoho or MailerLite.
- Revoke the MailerLite token without changing the production consent ledger.
- Remove DNS records only after the dependent service has been disabled.
- Preserve the legacy Zoho domain and mailbox until the replacement mailbox passes inbound and outbound tests.

## Remaining launch gates

1. Obtain approval before removing the obsolete Zoho domain that currently consumes the free plan's only domain slot.
2. Establish and test the monitored Zoho mailbox and approved aliases.
3. Authenticate the MailerLite sender domain and verify `updates@truenorthmap.ca`.
4. Confirm the lawful physical mailing address before sending any campaign.
5. Publish root DMARC monitoring only after all legitimate senders authenticate successfully.
