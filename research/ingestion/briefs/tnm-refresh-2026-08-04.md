# Research Run Brief - tnm-refresh-2026-08-04

- Trigger: weekday
- Mode: refresh_batch
- Named target: Marconi Technologies
- Live target: a65636c7-19d2-4f42-83a7-e692780d38de
- Exact baseline updated_at: 2026-07-24T10:01:42.056602+00:00
- Selected gap: published-record-refresh:marconi-technologies
- Target candidates: 1
- Source items inspected: 12 of 50
- Source families searched: 4

## Material changes

1. Add Marconi's named NEXUS UxS DISH consortium participation as a bounded relationship.
2. Add the official ARA Robotics strategic development partnership as a bounded relationship.
3. Do not duplicate products, the Polish ORION contract, Enamor partnership, Swedish Archer evaluation, locations, or public contacts already present in production.

## Required smoke command

```bash
pnpm research:smoke -- --run research/ingestion/runs/tnm-refresh-2026-08-04.json --collection-plan research/ingestion/collection-plans-v1/tnm-refresh-2026-08-04.json --claims research/ingestion/claim-ledgers-v1/tnm-refresh-2026-08-04.json --prospects research/ingestion/prospect-inventories-v1/tnm-refresh-2026-08-04.json --signals research/ingestion/signal-batches-v1/tnm-refresh-2026-08-04.json --leads research/ingestion/source-leads-v2/tnm-refresh-2026-08-04.json --candidates research/ingestion/candidate-batches-v2/tnm-refresh-2026-08-04.json
```

Stop after the refresh candidate is verified pending in private Admin Review. Never approve, publish, apply a migration, or write canonical ecosystem tables.
