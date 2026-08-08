# tnm-refresh-launch-light-profiles-20260806-a

Manual refresh batch for ten exact production organizations with one generic launch-era capability and no prior refresh candidate. Exact production baselines were preserved byte-for-byte. The run stops at private pending Admin Review.

## Exact file-only smoke command

`pnpm research:smoke -- --file-only true --run research/ingestion/runs/tnm-refresh-launch-light-profiles-20260806-a.json --collection-plan research/ingestion/collection-plans-v1/tnm-refresh-launch-light-profiles-20260806-a.json --claims research/ingestion/claim-ledgers-v1/tnm-refresh-launch-light-profiles-20260806-a.json --prospects research/ingestion/prospect-inventories-v1/tnm-refresh-launch-light-profiles-20260806-a.json --signals research/ingestion/signal-batches-v1/tnm-refresh-launch-light-profiles-20260806-a.json --leads research/ingestion/source-leads-v2/tnm-refresh-launch-light-profiles-20260806-a.json --candidates research/ingestion/candidate-batches-v2/tnm-refresh-launch-light-profiles-20260806-a.json`
