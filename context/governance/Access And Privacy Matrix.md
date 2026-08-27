# Access and privacy matrix

Status: canonical access and privacy contract
Owner: Andrew Davies
Last reviewed: 2026-08-27

## Access matrix

| Surface or data | Anonymous | Signed-in member | Non-admin member | Andrew administrator | Service runtime |
| --- | --- | --- | --- | --- | --- |
| Published organizations, technologies, locations, evidence and approved media | Read published rows only | Same public read | Same public read | Maintain through protected Admin workflows | Server reads published projection |
| Working Lists | No access | Own lists and items only | Own lists and items only | Own lists unless using an audited administrative operation | Server enforces owner ID |
| Profile claims, corrections and suggestions | Authentication required | Create and read own submissions | Create and read own submissions | Review and progress all submissions | Server validates identity and rate limit |
| Connection requests | Authentication required | Create and read own requests | Create and read own requests | Review and update request status | Server validates identity and rate limit |
| Contact and feedback | Create through validated public endpoint | Same | Same | Review privately | Service role writes after schema, honeypot and rate-limit checks |
| North Signal consent and delivery preferences | Current production creates global consent through the public endpoint; after the approved migrations and compatible application are released, the same endpoint creates weekly consent and an optional separately checked alert preference; no direct reads | Same; a future authenticated preference surface must preserve fresh consent | Same | View the current global ledger; after release, also view stream history, provider state and aggregate delivery | Current production service role records the global ledger. After release, service role alone records/reconciles current preference, append-only history, provider receipts, delivery runs and campaign metrics |
| Search and workflow telemetry | Bounded event write through endpoint | Same, without joining behaviour to identity | Same | Read aggregate and private operational views | Queryless, non-identifying events expire after 30 days; raw searches expire after 90 days |
| Research, review and publication queues | No access | No access | No access | Private review and explicit publication only | Research may stage validated private candidates through the approved RPC |
| Defence Brief editing and media library | No access | No access | No access | Protected editor only | Authenticated RPC repeats the exact staff and user-ID check |
| Administrator routes and data | No access | No access | No access | Exact administrator identity and controlled app metadata required | No public client access |

## Retention and collection boundary

- Raw search text is retained for at most 90 days.
- Detailed workflow events are retained for at most 30 days.
- Dossier engagement uses the same bounded event table and retention. It records only an allowlisted action plus stable organization or destination identifiers and bounded presentation context; it never sends profile prose, reviewed questions, contact details, free-form introduction text, or research payloads.
- A daily production database job removes expired records; aggregate, non-identifying counts may remain.
- Google Analytics is configured and loads only after the relevant visitor choice. Microsoft Clarity is intentionally deferred and is not part of the active release stack.
- Private account, authentication, administration, submission, connection and Working List workflows are excluded from optional behavioural analytics.
- Form values, free-form search content and sensitive inputs are not sent to analytics providers.
- Current production Supabase remains the global North Signal consent ledger and
  MailerLite remains the delivery provider. After the approved migrations and
  compatible application are released, Supabase also becomes the stream-specific
  ledger: weekly, signal-alert and global withdrawal are distinct. Existing
  active subscribers may be backfilled weekly only; alert consent always
  requires a fresh unchecked-choice action.
- Search Console, GA4, the short-lived first-party funnel, the consent ledger and
  aggregate MailerLite delivery metrics remain separate measurement systems.
  Behaviour is never joined to email, provider subscriber identity or account.

## Verified safety posture

- RLS remains enabled on every exposed table. Public tables expose published rows only; private write-only intake tables intentionally have no direct client read policy.
- `public.upsert_defence_brief` is a `SECURITY DEFINER` function callable by authenticated users, but it fails closed unless both `private.is_atlas_staff()` is true and `auth.uid()` exactly matches the supplied reviewer ID. The application repeats administrator authorization before invoking it.
- Leaked-password protection is an available Supabase hardening option. Public authentication currently uses Google OAuth and passwordless email, not user-created passwords.
- Expected expired or reused refresh tokens are cleared and treated as a normal signed-out session rather than a production failure.
- Cloudflare Turnstile protects passwordless authentication initiation and the public contact, feedback and update forms. Custom endpoints verify the browser token server-side, then apply the existing schema validation, honeypot and rate-limit controls before any write.

## Advisor references

- [RLS enabled with no policy](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)
- [Authenticated security-definer function](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable)
- [Password security and leaked-password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)
