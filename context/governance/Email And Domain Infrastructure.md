# Email and domain infrastructure

Status: active email and domain reference
Owner: Andrew Davies
Last reviewed: 2026-08-27

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
- `Ecosystem Intelligence` remains the North Signal master lifecycle group.
  **North Signal Weekly** and **Defence Signal Alerts** are the delivery groups;
  the four active master members were backfilled weekly only and no subscriber
  received alert consent by backfill. Supabase remains the consent authority.
- Zoho Mail is live for `andrew@truenorthmap.ca`; `hello@`, `privacy@`, `updates@`, `security@`, and `dmarc@` route to the same monitored mailbox.
- The obsolete Zoho domain and mailbox were deleted after the replacement domain was verified. The Zoho organization is named `True North Map`, and Andrew Davies is the sole administrator.
- Zoho MX, SPF, and DKIM are active. A controlled message to Gmail passed SPF, DKIM, and DMARC; a controlled message to the work address was accepted for delivery.
- MailerLite has an authenticated `truenorthmap.ca` sending domain, a verified `updates@truenorthmap.ca` sender, and `andrew@truenorthmap.ca` as the reply-to address. The obsolete ROOTED sending domain was removed.
- The August 27 authenticated provider verification confirmed the Comfort plan,
  `America/Halifax` timezone, USD $129.60 annual billing through 2027-07-30 and
  zero incremental cost for RSS campaigns or Preference Center. No plan purchase
  or tier change occurred. The approved email
  presentation uses the provider-safe compact Directional N plus separate
  product label, or the equivalent horizontal True North Map lockup when
  appropriate, with Inter, North Ink `#242827`, Field `#F7F7F3`, Paper,
  restrained Editorial Blue structure, Evidence Green only for verified-source
  meaning, one Signal Yellow `#F5E900` primary CTA, and no provider branding or
  permanent generic military image.
- On August 27 the live `North Signal welcome` workflow was reconciled while
  paused, then reactivated for new master-group entrants only with six completed
  and zero in progress. The live reusable `North Signal Weekly` template was
  reconciled to the tracked Signals/Mission links, bounded UTMs, privacy,
  preferences and unsubscribe controls. Weekly campaigns remain assigned in
  source to `True North Map <updates@truenorthmap.ca>` with Andrew as reply-to
  and manual test/send authority.
- The active `Defence Signal Alerts — RSS` campaign checks the public feed daily
  at `08:00 America/Halifax`, the provider's supported whole-hour cadence, and
  sends new posts only to the alert group. The current edition is the baseline;
  corrections retain their GUID and do not resend. A controlled preference test
  was sent only to Andrew, and its temporary weekly/alert memberships were removed
  without a global unsubscribe. The alert group returned to zero members.
- A controlled MailerLite preview and full live-trigger welcome were delivered only to Andrew's Gmail on July 31, 2026. That dated message passed SPF, DKIM, and DMARC, preserved both public links, contained a functional unsubscribe link and contained no legacy ROOTED branding. Its temporary group membership was removed after validation. It does not prove the current provider presentation, activation state or subscriber total.
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
- MailerLite token, master/weekly/alert group IDs, Preference Center gate and
  webhook secret: server-only Vercel variables. Only the bounded alert UI
  alert-availability flag is public; the server must confirm all prerequisites before
  advertising availability.
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
2. Send every new MailerLite campaign to controlled Gmail and non-Gmail test recipients before selecting the North Signal Weekly group.
3. Verify images-disabled and mobile rendering, every destination, the unsubscribe and privacy links, sender, reply-to address, campaign footer and domain authentication before each new template is reused.
4. Keep weekly campaign sending manual. The welcome automation and the active
   new-posts-only Defence Signal RSS alert are the only automated North Signal
   deliveries. The alert remains limited to separately consented alert-group
   members; `no_publish`, draft, missing-feed and failed-route states send
   nothing.
5. Keep the welcome workflow scoped to future master-group entrants only. Do not
   enable historical welcome-email backfill without a separate, explicit
   audience decision.
