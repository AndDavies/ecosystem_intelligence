# Canadian Ecosystem Intelligence Public Atlas

This directory is the runnable Next.js public atlas and private editorial workspace.

It contains the Next.js source, public assets, automated tests, operational scripts, and Supabase migrations and seed data. Research inputs and review artifacts live in `../research/`.

From the project root:

```bash
pnpm dev
pnpm test
pnpm lint
pnpm build
```

Commands can also be run directly from this directory.

## Runtime modes

- `ATLAS_DATA_SOURCE=supabase` is the hosted production mode and requires the clean schema, public URL, and publishable key. Missing configuration is an error rather than a silent fallback.
- `ATLAS_DATA_SOURCE=validated_seed` uses the same six reviewed records without a database and remains available for isolated local development.
- `LEGACY_DATA_SOURCE=supabase` is reserved for the prior internal workspace while it remains readable.

The public map uses `NEXT_PUBLIC_MAPTILER_KEY` when provided. Set
`NEXT_PUBLIC_MAPTILER_MAP_ID` to a MapTiler map ID; it defaults to the quiet
`dataviz-light` basemap. The browser key must be restricted to the production
and preview origins in MapTiler.

Copy `.env.example` to `.env.local` and keep all service credentials server-side.

## Public routes

- `/` national atlas
- `/organizations` and `/organizations/[slug]`
- `/capabilities/[slug]`
- `/regions/[slug]`
- `/demand` and `/demand/[slug]`
- `/account` for authenticated identity, workflow status, and private-data controls
- `/collections` for authenticated private Working Lists
- `/submit` for reviewed public contributions
- `/connect/[slug]` for authenticated private connection requests
- `/about`, `/methodology`, `/contact`, `/privacy`, and `/terms`

## Editorial routes

- `/admin`
- `/admin/intake`
- `/admin/review`
- `/admin/coverage`
- `/admin/insights`

The public sign-in surface supports Google OAuth and passwordless email links. Administrator authorization additionally requires Andrew's exact immutable Supabase user ID, exact email, and controlled `app_metadata.role`; user-editable metadata cannot grant access. No admin link appears in public navigation.

## Database

- Clean migration: `supabase/migrations/20260715170638_public_atlas_foundation.sql`
- Security hardening: `supabase/migrations/20260715203357_public_atlas_security_hardening.sql`
- Sole-admin restriction: `supabase/migrations/20260717170141_restrict_atlas_admin_owner.sql`
- Clean validated seed: `supabase/seed.sql`
- Prior internal schema and CSVs: `supabase/legacy/`

The hosted project currently contains the reviewed public corpus. A public release requires at least 30 verified records and explicit promotion approval.
The SQL seed remains the reproducible migration fixture and local fallback.

The migration uses explicit Data API grants, RLS on every exposed table, owner-only collections/submissions, staff-only editorial policies, and separate public/private storage buckets.
