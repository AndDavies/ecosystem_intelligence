# True North Map authentication email templates

These files are the source-controlled copies of the branded Supabase Authentication templates. They contain no credentials, remote images, tracking pixels, or marketing content.

| Supabase template | Subject | Source file |
|---|---|---|
| Confirm signup | Confirm your True North Map email | `confirm-signup.html` |
| Magic link | Sign in to True North Map | `magic-link.html` |
| Invite user | You have been invited to True North Map | `invite.html` |
| Change email address | Confirm your new email address | `change-email.html` |
| Reset password | Reset your True North Map password | `reset-password.html` |
| Reauthentication | Your True North Map verification code | `reauthentication.html` |

Deployment rules:

- Paste the complete HTML file into the matching Supabase Authentication template.
- Keep the sender as `True North Map <access@auth.truenorthmap.ca>` once custom SMTP is verified.
- Test every changed template before changing the production delivery provider.
- Keep authentication mail separate from MailerLite updates and newsletters.
- Roll back to the dashboard export recorded before the July 22, 2026 email-infrastructure change if delivery fails.

Security notifications should use the same visual treatment and the support address `hello@truenorthmap.ca`. They must describe the account change, direct the recipient to secure their account if it was unexpected, and contain no marketing copy.
