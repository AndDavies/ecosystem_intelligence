# Development Log - 2026-04-29

## Business Intelligence Usability Roadmap Completion

This log records the phase-by-phase completion pass for the usability roadmap derived from `Business Intelligence Usability Audit - 2026-04-28.md`.

### Phase 1 - First-Use Clarity

- Status: Completed and browser-verified.
- App verification:
  - `/app` shows the Start Here selector, mission/domain/company/follow-up entry paths, and the concept chain from Mission Area / Use Case through Working List.
  - `/use-cases` is framed as `Mission Areas / Use Cases` and renders config-backed `Use this when` copy for the mission areas present in the authenticated data environment.
  - `/use-cases/arctic-domain-awareness` shows `Use this when`, `Decision this supports`, `Best output`, `Not for`, and `Open Briefing`.
  - `/domains` explains Use Case, Domain, Cluster, Capability, and Company before the browse table.
  - `/help` repeats the same Start Here, Mission Areas, Technical Domains, and Working Lists vocabulary.
- Implementation note:
  - `src/lib/use-case-config.ts` contains custom orientation copy for all 8 seeded active use cases.
  - The authenticated browser database currently displays 6 mission areas on `/use-cases`; the seed/config layer includes 8 active use-case definitions, so this appears to be a data-environment freshness issue rather than a UI coverage gap.

### Phase 2 - Faster Target Decision Surface

- Status: Completed and browser-verified after a final UI tightening pass.
- App verification:
  - `/use-cases/arctic-domain-awareness/briefing` opens with the mission brief, then moves directly into `Top engagement targets` and the compact target comparison table.
  - Ranking language is visible at point of use through `Ranked because` and `Rank signal is a relative fit signal, not a probability`.
  - Target cards now show only `Why this target now`, `Suggested next step`, rank drivers, and the working-list action by default.
  - Evidence posture, why-not-others, strength, and limitation are preserved behind native `Evidence, tradeoffs, and why-not-others` disclosure panels.
  - A disclosure panel was opened in-browser and confirmed to reveal evidence posture, limitation, and why-not-others.

### Phase 3 - Domain And Browse Clarity

- Status: Completed and browser-verified.
- App verification:
  - `/domains` is a compact `Technical Domains` table with the taxonomy explainer and linked mission-area context.
  - `/domains/maritime-systems` links back to related mission areas through `Open as mission question`.
  - `/domains/maritime-systems` now labels the cluster section as `Capability clusters`.
  - `/companies` keeps the dense browse surface and explains `Rank signal` as a relative fit signal.

### Phase 4 - Working List Handoff Layer

- Status: Completed and browser-verified.
- App verification:
  - `/shortlists` is visibly framed as `Working Lists`, with snapshot metrics for saved targets, active follow-up, and owner coverage.
  - Working-list cards include a `Handoff read`, owner/next-step/due-date coverage, and create/delete controls.
  - An empty list detail page clearly shows `No targets saved yet`.
  - A populated list detail page exposes status, owner, due date, next step, rationale, and save controls for saved targets.
- Scope note:
  - This remains a lightweight engagement-memory layer, not a CRM pipeline, contact-management workflow, or outbound sequencing tool.

### Phase 5 - Validation Enablement

- Status: Completed and browser-verified.
- App verification:
  - `/help` includes Start Here, Core Concepts, Working Lists, and BD Validation Workflow entry points.
  - `/help/bd-validation-workflow` includes the `Timed Arctic validation task`, Arctic Domain Awareness path, top-target comparison, working-list handoff, and validation language.
- Documentation updated:
  - Added `BD Validation Script - Arctic Task - 2026-04-29.md` as the timed validation script.
  - Updated project governance docs to reflect the First-Use Clarity and BD validation readiness path.

## Final Validation Plan

Run after the final code pass:

```bash
pnpm test
pnpm lint
pnpm seed:validate
pnpm ingest:validate
pnpm build
```

Then restart the development server if `pnpm build` invalidates the live `.next` artifacts used by `pnpm dev`, and smoke-check:

- `/app`
- `/use-cases`
- `/use-cases/arctic-domain-awareness`
- `/use-cases/arctic-domain-awareness/briefing`
- `/domains`
- `/companies`
- `/shortlists`
- `/help`

## Research Operationalization Runway

### Objective

Prepare the app and database for staged real-world research batches without running broad automated ingestion yet.

### Implemented

- Added migration `004_research_operationalization.sql`.
- Added operational metadata columns for `companies`, `capabilities`, and `capability_use_cases`:
  - `data_stage`
  - `source_confidence`
  - `research_rationale`
  - `source_batch_id`
- Added database tables for tracking research batches and batch records:
  - `research_batches`
  - `research_batch_records`
- Updated seed CSVs so scaffold records are explicitly marked `scaffold` and promoted pilot records are marked `validated`.
- Updated candidate promotion so future promoted records preserve source confidence, research rationale, and batch provenance.
- Added `pnpm leads:validate` for pre-ingestion source-lead batches.
- Added `pnpm data:readiness` for Mission Area readiness and scaffold-debt reporting.
- Added a generated readiness report at `research/ingestion/reports/data-readiness-2026-04-29.md`.
- Updated ingestion docs, research-agent source contract, and in-app help with the staged source-lead -> candidate -> review -> promote workflow.

### Current Readiness Finding

- Active Mission Areas: 8
- Validated companies: 6 of 21
- Validated capabilities: 6 of 26
- Validated mappings: 8 of 80
- Scaffold companies to replace: 15
- Scaffold capabilities to replace: 20
- Scaffold mappings to replace: 72

Recommended first staged research batch: `Underwater ISR`, because it already has three validated top-target mappings from the Arctic pilot and is closest to becoming briefing-ready.

### Live Database Note

The migration file has been added locally, but this workspace does not expose a direct Postgres database URL. Apply `supabase/migrations/004_research_operationalization.sql` to Supabase before running `pnpm seed:import`; otherwise the new seed columns will not exist in the live database.
