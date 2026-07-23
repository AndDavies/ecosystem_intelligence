# Signal Contract

The executable contract is `app/src/lib/research/pipeline-schema.ts`.

Write `research_signal_batch_v1` to `research/ingestion/signal-batches-v1/`. Each atomic signal needs a stable ID and SHA-256 fingerprint, source channel/family, discovery origin, extracted entities/event details, redirects and canonical URLs, signal type, canonical-evidence status, live matches, intended outcomes, recovery attempts, warnings, disposition, and a rationale when unresolved or deferred.

Qualified changes to existing records become `record_refresh_lead`, then one `organization_refresh_bundle_v1` or `demand_refresh_bundle_v1` per target per run. `targetMatch.baselineUpdatedAt` must equal the live target row's `updated_at` at staging. `beforeRecord` must contain the baseline for every touched row. Every explicit operation must cite candidate `fieldEvidence` IDs.

An intended target match is not a duplicate. `duplicateCheck.status` must still be `clear`, because it represents accidental conflicts with other entities.

Discovery-feed content cannot be field evidence. Resolve it to durable evidence and retain the discovery channel as provenance. No candidate is public until a human accepts it and explicitly publishes at the existing checkpoint.
