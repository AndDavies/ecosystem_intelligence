# Database Reconciliation - 2026-04-29

## Summary

The live Supabase database was reconciled to the canonical repo seed and mission-area model before staged research batches begin.

The key issue was schema/data drift: Supabase migration history showed `002_use_case_realism` as applied, but the live `use_cases` table did not contain the mission realism columns required by the app. The live database also had only 6 mission areas while the repo seed defines 8 active mission areas.

## Actions Completed

- Added and applied migration `005_mission_area_reconciliation.sql`.
- Re-applied the mission-area realism columns to `use_cases` using `add column if not exists`.
- Re-applied check constraints for `priority_tier` and `use_case_kind`.
- Imported canonical seed data with `pnpm seed:import`.
- Added `pnpm db:reconcile:validate` to verify the remote database against canonical repo seed IDs.
- Updated briefing repository logic so mission-specific insight copy is used when building target reads and briefing summaries.

## Remote State After Reconciliation

| Table | Remote Rows |
| --- | ---: |
| `use_cases` | 8 |
| `domains` | 5 |
| `clusters` | 7 |
| `companies` | 21 |
| `capabilities` | 26 |
| `capability_use_cases` | 80 |
| `sources` | 36 |
| `evidence_snippets` | 42 |
| `field_citations` | 141 |
| `use_case_observations` | 24 |
| `research_batches` | 0 |
| `research_batch_records` | 0 |

## Mission-Area Coverage

| Mission Area | Mappings | Validated Mappings | Observations | Policy Citation |
| --- | ---: | ---: | ---: | --- |
| Arctic Domain Awareness | 23 | 3 | 3 | yes |
| Distributed Sensor Networks | 9 | 0 | 3 | yes |
| Underwater ISR | 11 | 3 | 3 | yes |
| Autonomous Patrol | 9 | 1 | 3 | yes |
| Edge Data Processing | 9 | 1 | 3 | yes |
| Expeditionary Communications Resilience | 8 | 0 | 3 | yes |
| Cyber Mission Assurance For Remote Operations | 5 | 0 | 3 | yes |
| Northern Logistics And Sustainment Readiness | 6 | 0 | 3 | yes |

## Validation Commands

- `supabase db push --dry-run --yes`
- `supabase migration list`
- `pnpm seed:import`
- `pnpm db:reconcile:validate`
- `pnpm seed:validate`
- `pnpm ingest:validate`
- `pnpm leads:validate`
- `pnpm test`
- `pnpm lint`
- `pnpm build`

## Research Readiness Note

The database is now ready for staged research batches structurally. Arctic Domain Awareness remains the strongest validated demo lane, while the other mission areas now have matching mission realism metadata, policy citations, observations, and enough scaffold mappings to support targeted research expansion.

The next research stage should prioritize replacing scaffold company/capability/mapping records with public-source-backed candidate batches, especially for mission areas with zero validated mappings.
