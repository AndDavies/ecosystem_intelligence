# tnm-refresh-2026-08-06

Refresh-batch enrichment of ten named published organizations. Exact production baselines were captured at 2026-08-06T08:24:08.672Z. Every candidate proposes only a private, reviewable defence-posture update and stops before acceptance or publication.

## Exact smoke command

`pnpm research:smoke -- --run research/ingestion/runs/tnm-refresh-2026-08-06.json --collection-plan research/ingestion/collection-plans-v1/tnm-refresh-2026-08-06.json --claims research/ingestion/claim-ledgers-v1/tnm-refresh-2026-08-06.json --prospects research/ingestion/prospect-inventories-v1/tnm-refresh-2026-08-06.json --signals research/ingestion/signal-batches-v1/tnm-refresh-2026-08-06.json --leads research/ingestion/source-leads-v2/tnm-refresh-2026-08-06.json --candidates research/ingestion/candidate-batches-v2/tnm-refresh-2026-08-06.json`
