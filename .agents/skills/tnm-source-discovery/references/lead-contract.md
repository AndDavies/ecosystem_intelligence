# Typed lead contract

Use `schemaVersion: source_lead_batch_v2` and validate against `research/ingestion/schema/source-leads-v2.schema.json`.

Lead types:

- `organization_lead`: include proposed kind, controlled categories, website, aliases, location, optional capability name, and role-specific evidence.
- `demand_signal_lead`: include issuers, demand source kind, commitment level, and atomic candidate requirements.
- `program_lead`: include operator, program type, dates, and public participation evidence.
- `relationship_lead`: include both endpoints, relationship type, and public summary.

Every lead includes canonical source metadata, discovery path, accessed time, separate source and alignment confidence, evidence locator, duplicate fingerprint, taxonomy slugs, follow-up questions, disposition, and rejection reason when rejected.

Use only mission and domain slugs reported by `pnpm research:coverage` or present in the validated atlas taxonomy.
