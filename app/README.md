# True North Map

True North Map is the public brand for the Canadian defence and dual-use ecosystem intelligence and mapping platform in this repository. Its canonical production domain is `https://truenorthmap.ca`.

This directory is the runnable Next.js public atlas and private editorial workspace.

It contains the Next.js source, public assets, automated tests, current research operations, and hosted-database migrations. Research inputs and review artifacts live in `../research/`.

`src/app/` is the framework-defined Next.js App Router. It owns routes, layouts, metadata, and API handlers; it is not the retired `/app` product route.

From the project root:

```bash
pnpm dev
pnpm test
pnpm lint
pnpm build
```

Commands can also be run directly from this directory.

## Runtime data

Supabase project `facoactpdckkhciamflk` is the sole runtime source for published organizations, technologies, taxonomy, public demand, evidence, and private workflows. Missing database configuration is a hard error; the application never falls back to bundled organizations or an alternate schema.

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

The public sign-in surface supports Google OAuth and passwordless email links. Administrator authorization additionally requires Andrew's exact immutable identity ID, exact email, and controlled `app_metadata.role`; user-editable metadata cannot grant access. No admin link appears in public navigation.

## Database

- Clean migration: `supabase/migrations/20260715203250_public_atlas_foundation.sql`
- Security hardening: `supabase/migrations/20260715203449_public_atlas_security_hardening.sql`
- Sole-admin restriction: `supabase/migrations/20260717170141_restrict_atlas_admin_owner.sql`
- Data API structural-privilege hardening: `supabase/migrations/20260718124550_restrict_public_api_table_privileges.sql`
- Test-only application fixtures: `tests/fixtures/`

The hosted production project contains the reviewed public corpus and is the sole runtime, research-readiness, taxonomy, and publication source. There is no local publication seed or application fallback.

The migration uses explicit Data API grants, RLS on every exposed table, owner-only collections/submissions, staff-only editorial policies, and separate public/private storage buckets.
