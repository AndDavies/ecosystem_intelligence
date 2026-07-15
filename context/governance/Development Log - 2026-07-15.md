# Development Log - 2026-07-15

## Public atlas foundation

The repository was stabilized around four high-level areas:

- `app/` for runnable product source
- `research/` for evidence and reviewed ingestion work
- `context/` for governance and agent operating guidance
- `content/` for outward-facing collateral

## Product shift

The product front door changed from an internal command-centre workspace to a free Canadian defence and dual-use public atlas. The selected visual direction is Option 3, refined into a map-first atlas with an optional, viewport-bounded accessible table and progressive disclosure.

## Implemented

- Added a clean public-atlas TypeScript model and repository boundary.
- Added a six-organization validated fallback dataset and excluded all scaffold records from the public path.
- Added a clean Supabase migration covering organizations, capabilities, locations, demand, programs, evidence, ingestion governance, media, and private collections.
- Added explicit Data API grants, RLS on every exposed table, controlled `app_metadata` staff authorization, private/public storage buckets, foreign-key and query indexes, and automatic `updated_at` triggers.
- Added a PGlite migration test that applies the schema and seed, verifies counts, checks public evidence, confirms RLS, and proves anonymous editorial access is denied.
- Added the national atlas with synchronized natural-language filters, map, table, URL, count, and CSV export.
- Added public organization, capability, region, and NATO demand pages.
- Added organization, capability, regional, and collection PDF exports.
- Added magic-link authentication, owner-only collections, and staged profile claims/corrections.
- Added private source/PDF intake, candidate review, and coverage dashboards.
- Simplified the dossier schema so identity and one-to-one profile fields live
  in one `organizations` row, with an explicit `entity_kind` and a small
  `profile_data` object for type-specific details.
- Added an RLS-preserving `organization_dossiers` view that presents normalized
  locations, capabilities, programs, funding, relationships, media, alignments,
  and citations as one predictable read payload for pages and exports.
- Made the map the default discovery surface and changed the accessible table
  into a replacement view containing only organizations inside the last visible
  map bounds; bounded CSV exports use the same extent.
- Switched MapLibre and the Leaflet fallback to the quiet MapTiler
  `dataviz-light` map ID when a protected browser key is configured.
- Added an editorially labelled placeholder-logo state without storing fake
  media records.
- Added a reviewed 12-organization Underwater ISR source-lead batch. These leads
  remain outside the public dataset until human approval and candidate review.

## Trust decisions

- City-centroid coordinates are labelled as such.
- Existing mission mappings are labelled reviewed derived reads.
- The five NATO problem families are public with zero capability matches until new mappings pass review.
- Empty regions and demand pages use explicit coverage states.
- Confidential emails and local research PDFs remain private inputs unless publicly corroborated and approved.

## Hosted database status

The new free-plan Supabase project exists and is connected locally and in
Vercel. The foundation and security-hardening migrations were approved,
applied, and verified with all public tables protected by RLS and no
security-advisor findings. The six verified organizations, their reviewed
capabilities, public sources, field citations, and NATO demand requirements
were imported. Production and Preview use `ATLAS_DATA_SOURCE=supabase`.
