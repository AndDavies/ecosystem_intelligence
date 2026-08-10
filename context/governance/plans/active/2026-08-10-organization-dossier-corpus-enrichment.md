# Organization Dossier Corpus Enrichment Plan

Status: active rollout record; first representative run pending Admin Review
Owner: Andrew Davies
Started: 2026-08-10

## Outcome

Apply the approved editorial dossier template to the full published organization corpus through evidence-backed, individually reviewed enrichment. The template is the canonical organization-profile destination; activation remains a per-record publication decision, never a bulk version update.

Production at rollout start contained 415 published organizations: eight owner-reviewed pilot dossiers used `organization_editorial_profile_v1`, while 407 remained on the bounded legacy profile and the private candidate queue was empty. Andrew subsequently reviewed and separately published all seven candidates in the first representative wave. Production now has 15 activated dossiers and 400 published null-version organizations remaining; live counts and queue state must still be re-read before every new wave.

## Locked operating decisions

- Use `organization_refresh_bundle_v2` and pipeline `tnm-research-pipeline/1.7.1` for new dossier-enrichment work after the current operator/Admin refinement is committed, deployed and verified.
- Research stops at private Admin Review. Human acceptance and the separate Publish checkpoint remain mandatory for every organization.
- Do not set `editorial_profile_version` globally. A record activates only when its complete candidate is reviewed and explicitly published.
- Prefer five to seven targets per comprehensive run; never exceed ten. Keep one bounded pending review batch at a time so reviewer attention and baseline freshness remain controlled.
- Use no numeric article or source quota for organization research. Readiness requires decision-useful saturation, at least three auditable complementary searched lanes, all twelve coverage dimensions dispositioned, durable independent corroboration where the collection plan requires it, and explicit consequential unknowns.
- Every selected source must support a public leaf, a specific warning, or a documented coverage conclusion. Syndicated copies, unused source padding, search results, feed entries, and social discovery do not increase readiness.
- A material signal requires durable evidence for an exact event date, a concrete decision delta, affected fields, and a bounded reviewer action. Context and record maintenance remain useful research but do not masquerade as signals.
- Unsupported optional content stays absent. A target may end `research_required` or `no_material_change` when the typed disposition and search record justify it.

## First representative run

The first new pipeline-1.7 run covers one published, unactivated organization from each entity kind represented outside the original company-heavy pilot:

1. `accelerator-centre` — accelerator
2. `canadian-strategic-missions-corporation` — company
3. `aerospace-industries-association-of-canada` — ecosystem organization
4. `ideas` — government innovation office
5. `dmz` — incubator
6. `one9` — investor or funder
7. `david-florida-laboratory` — research and test centre

All seven had zero pending or approved candidates when selected. Exact IDs and `updated_at` baselines must be re-read immediately before candidate finalization and again before staging.

## Corpus sequence

1. Deploy and verify the tracked pipeline-1.7 operator/Admin refinement and Daily Signals compatibility change. Do not begin the run from an uncommitted or unverified runner.
2. Prepare and complete the seven-target representative run locally, validate it with `research:validate` and read-only `research:smoke --check-only`, then import through the trusted staging command only.
3. For each wave, review the records in Admin Review across organization kinds. Inspect source identity beside every evidence leaf and review or edit the pre-populated evidence-bounded decision rationale before submitting a decision.
4. Accept and Publish only the records Andrew approves. Verify each activated public route, PDF, responsive layout, source links, production logs and directory/map cache health before continuing.
5. Process the remaining corpus in bounded five-to-seven-target runs, grouping comparable organization kinds where that improves source recovery while retaining one candidate or typed disposition per exact target.
6. Reconcile the live coverage count after every published batch so every remaining organization is selected exactly once and no stale local plan becomes queue authority.

## Required validation

- Pinned Node 24: focused research/Admin tests, `pnpm research:validate`, `pnpm test`, and `pnpm lint`.
- Before release: `pnpm release:validate`, GitHub Release Validation, CodeQL, Vercel build/runtime confirmation, health and catalogue reconciliation.
- Before staging: deployed `/api/system/research-contract` advertises compatible `organization_refresh_bundle_v2` intake; live target baselines and active candidate overlaps are clean.
- Before each Publish batch: authenticated Admin Review evidence inspection and one explicit human rationale per decision.
- After each Publish batch: public route/PDF/source verification, 390/768/1024/1440 layout and keyboard checks for representative rich/sparse/non-company records, and clean Vercel/PostgreSQL log windows.

## Current next safe action

Reconcile the published outcome of `tnm-dossier-corpus-wave1-20260810`, then prepare the next non-overlapping corpus batch from the remaining unactivated organizations. In Admin Review, inspect every proposed field, mapped source and amber warning and review or edit the pre-populated evidence-bounded rationale before submitting any decision. Publish only the records Andrew explicitly selects, then verify their public route, PDF, responsive layout, source links and production logs before preparing another corpus batch. The separate Daily Signals scheduler remains paused and is not a dependency for this dossier review.
