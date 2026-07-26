# Phase 2 access and privacy matrix

Last reviewed: 2026-07-26

## Access matrix

| Surface or data | Anonymous | Signed-in member | Non-admin member | Andrew administrator | Service runtime |
| --- | --- | --- | --- | --- | --- |
| Published organizations, technologies, locations, evidence and approved media | Read published rows only | Same public read | Same public read | Maintain through protected Admin workflows | Server reads published projection |
| Working Lists | No access | Own lists and items only | Own lists and items only | Own lists unless using an audited administrative operation | Server enforces owner ID |
| Profile claims, corrections and suggestions | Authentication required | Create and read own submissions | Create and read own submissions | Review and progress all submissions | Server validates identity and rate limit |
| Connection requests | Authentication required | Create and read own requests | Create and read own requests | Review and update request status | Server validates identity and rate limit |
| Contact and feedback | Create through validated public endpoint | Same | Same | Review privately | Service role writes after schema, honeypot and rate-limit checks |
| Subscriber consent | Create or update through public consent endpoint | Same | Same | View consent ledger and provider state | Service role synchronizes MailerLite lifecycle |
| Search and workflow telemetry | Bounded event write through endpoint | Same, without joining behaviour to identity | Same | Read aggregate and private operational views | Raw text expires after 90 days; detailed events after 30 days |
| Research, review and publication queues | No access | No access | No access | Private review and explicit publication only | Research may stage validated private candidates through the approved RPC |
| Defence Brief editing and media library | No access | No access | No access | Protected editor only | Authenticated RPC repeats the exact staff and user-ID check |
| Administrator routes and data | No access | No access | No access | Exact administrator identity and controlled app metadata required | No public client access |

## Retention and collection boundary

- Raw search text is retained for at most 90 days.
- Detailed workflow events are retained for at most 30 days.
- A daily production database job removes expired records; aggregate, non-identifying counts may remain.
- Google Analytics is configured and loads only after the relevant visitor choice. Microsoft Clarity is intentionally deferred and is not part of the active release stack.
- Private account, authentication, administration, submission, connection and Working List workflows are excluded from optional behavioural analytics.
- Form values, free-form search content and sensitive inputs are not sent to analytics providers.
- Supabase remains the consent ledger; MailerLite remains the update-delivery provider.

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
