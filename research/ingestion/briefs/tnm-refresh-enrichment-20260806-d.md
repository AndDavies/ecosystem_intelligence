# tnm-refresh-enrichment-20260806-d

Refresh-batch enrichment of ten named published organizations. Exact production baselines were captured at 2026-08-06T10:53:23.850Z. Every candidate proposes only a private, reviewable defence-posture update and stops before acceptance or publication.

## Exact smoke command

`pnpm research:smoke -- --run research/ingestion/runs/tnm-refresh-enrichment-20260806-d.json --collection-plan research/ingestion/collection-plans-v1/tnm-refresh-enrichment-20260806-d.json --claims research/ingestion/claim-ledgers-v1/tnm-refresh-enrichment-20260806-d.json --prospects research/ingestion/prospect-inventories-v1/tnm-refresh-enrichment-20260806-d.json --signals research/ingestion/signal-batches-v1/tnm-refresh-enrichment-20260806-d.json --leads research/ingestion/source-leads-v2/tnm-refresh-enrichment-20260806-d.json --candidates research/ingestion/candidate-batches-v2/tnm-refresh-enrichment-20260806-d.json`
