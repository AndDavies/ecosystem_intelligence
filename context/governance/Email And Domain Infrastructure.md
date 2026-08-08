# Email and domain infrastructure

Status: active email and domain reference
Owner: Andrew Davies
Last reviewed: 2026-08-08

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
- MailerLite uses the dedicated `Ecosystem Intelligence` group for True North Map and North Signal delivery. The production consent ledger is reconciled to that group, and the lifecycle webhook accepts signed single or batched events. Legacy groups are not part of the application workflow.
- Zoho Mail is live for `andrew@truenorthmap.ca`; `hello@`, `privacy@`, `updates@`, `security@`, and `dmarc@` route to the same monitored mailbox.
- The obsolete Zoho domain and mailbox were deleted after the replacement domain was verified. The Zoho organization is named `True North Map`, and Andrew Davies is the sole administrator.
- Zoho MX, SPF, and DKIM are active. A controlled message to Gmail passed SPF, DKIM, and DMARC; a controlled message to the work address was accepted for delivery.
- MailerLite has an authenticated `truenorthmap.ca` sending domain, a verified `updates@truenorthmap.ca` sender, and `andrew@truenorthmap.ca` as the reply-to address. The obsolete ROOTED sending domain was removed.
- The MailerLite workspace is on the Comfort plan, uses `America/Halifax` as its operating timezone, and applies the True North Map brand system: Inter, North Ink `#242827`, Field `#F7F7F3`, Signal Yellow `#F5E900`, restrained evidence greys, the Directional N social mark, and no MailerLite provider branding.
- The North Signal welcome automation is active and uses the verified personal sender `Andrew Davies <andrew@truenorthmap.ca>`. It starts only when a new subscriber joins the dedicated `Ecosystem Intelligence` group; the three existing members and every legacy subscriber were deliberately excluded from activation backfill. Weekly newsletter campaigns remain assigned to `True North Map <updates@truenorthmap.ca>` unless Andrew changes that operating decision.
- A controlled MailerLite preview and a full live-trigger welcome were delivered only to `m.andrew.davies@gmail.com` on July 31, 2026. The received production message passed SPF, DKIM, and DMARC, preserved both public links, displayed the intended True North Map copy and palette, contained a functional MailerLite unsubscribe link, and contained no legacy ROOTED branding. The temporary group membership used for the live trigger was removed after validation, returning the delivery group to the three consent-backed production subscribers.
- The MailerLite company profile uses the lawful campaign-footer address confirmed by Andrew. Campaign sending is operationally available but remains a deliberate administrator action.
- Root DMARC is active in monitoring mode at `p=none`, with aggregate reports delivered to `dmarc@truenorthmap.ca`.

## Provider ownership and administration

- Domain and deployment owner: Vercel project for `truenorthmap.ca`.
- Authentication data and transactional-delivery owner: Supabase project `facoactpdckkhciamflk`.
- Human-mail owner: the True North Map Zoho organization.
- Marketing-delivery owner: the True North Map MailerLite workspace.
- Operational administrator and reply contact: Andrew Davies.
- Public support, privacy, security, and update addresses are approved for public use after successful inbound alias and outbound authentication tests.

## Secret ownership

- Resend SMTP password: Supabase Auth only.
- Supabase Auth Turnstile secret: stored only in Supabase Auth.
- Public-form Turnstile secret: `TURNSTILE_SECRET_KEY`, server-only in Vercel and local development.
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
- The legacy Zoho domain and mailbox were intentionally deleted after the replacement mailbox passed inbound and outbound tests. There is no legacy-mail rollback path.

## Operational follow-up

1. Review DMARC aggregate reports for two to four weeks before considering an enforcing policy.
2. Send every new MailerLite campaign to a small test group before scheduling the full `Ecosystem Intelligence` group.
3. Verify the unsubscribe link, sender, reply-to address, and campaign footer in Gmail and a non-Gmail client before each new template is reused.
4. Keep weekly campaign sending manual. The only automated marketing message is the single welcome email for a newly consented North Signal subscriber.
5. Keep the welcome workflow active for future group entrants only. Do not enable historical backfill without a separate, explicit audience decision.
