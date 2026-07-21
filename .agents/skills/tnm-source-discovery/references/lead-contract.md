# Typed lead contract

Use `schemaVersion: source_lead_batch_v2` and validate against `research/ingestion/schema/source-leads-v2.schema.json`.

Lead types:

- `organization_lead`: include proposed kind, controlled categories, website, aliases, location, optional capability name, and role-specific evidence.
- `demand_signal_lead`: include issuers, demand source kind, commitment level, and atomic candidate requirements.
- `program_lead`: include operator, program type, dates, and public participation evidence.
- `relationship_lead`: include both endpoints, relationship type, and public summary.

Every lead includes canonical source metadata, discovery path, accessed time, separate source and alignment confidence, evidence locator, duplicate fingerprint, taxonomy slugs, follow-up questions, disposition, and rejection reason when rejected.

Discovery-batch runs also create `research_prospect_inventory_v1`. Enumerate 40-75 unique prospects across at least six source lanes before selecting up to 25 for lead qualification. Preserve unused plausible prospects as `queued` rather than discarding the trail.

Use `qualified` when identity, Canadian presence, a concrete role or offering, taxonomy fit, and at least one durable evidence anchor support human review. Record `inclusionScore`, `completenessScore`, `reviewWarnings`, `discoveryLane`, and evidence-recovery attempts. A `recovery_exhausted` deferral needs at least three distinct source lanes. Missing optional enrichment travels forward as an amber warning; it does not become a rejection rationale.

Use only mission and domain slugs returned from the production database by `pnpm research:coverage`.
