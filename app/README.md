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

- `ATLAS_DATA_SOURCE=validated_seed` uses the six reviewed fallback records and is the safe local default.
- `ATLAS_DATA_SOURCE=supabase` requires the clean hosted schema, public URL, and publishable key. Missing configuration is an error rather than a silent fallback.
- `LEGACY_DATA_SOURCE=supabase` is reserved for the prior internal workspace while it remains readable.

Copy `.env.example` to `.env.local` and keep all service credentials server-side.

## Public routes

- `/` national atlas
- `/organizations` and `/organizations/[slug]`
- `/capabilities/[slug]`
- `/regions/[slug]`
- `/demand` and `/demand/[slug]`
- `/collections` for authenticated private lists
- `/submit` for reviewed public contributions

## Editorial routes

- `/admin`
- `/admin/intake`
- `/admin/review`
- `/admin/coverage`

Editor authorization is read from controlled Supabase `app_metadata.role`, never user-editable metadata.

## Database

- Clean migration: `supabase/migrations/20260715170638_public_atlas_foundation.sql`
- Clean validated seed: `supabase/seed.sql`
- Prior internal schema and CSVs: `supabase/legacy/`

The migration uses explicit Data API grants, RLS on every exposed table, owner-only collections/submissions, staff-only editorial policies, and separate public/private storage buckets.
