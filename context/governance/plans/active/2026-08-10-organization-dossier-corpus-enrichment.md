# Organization Dossier Production Corpus Refresh

Status: active production rollout; pipeline 1.7.2 deployment required before the next segment
Owner: Andrew Davies
Started: 2026-08-10

## Outcome

Apply the approved editorial dossier template to every eligible published organization through comprehensive evidence-backed research, individual Admin Review, and explicit Publish. The template is the canonical organization-profile destination; activation remains a per-record publication decision and is never a bulk version update.

At the latest verified live read, production contained 415 published organizations: 15 had activated `organization_editorial_profile_v1`, 400 remained null-version, and seven non-overlapping organization-refresh candidates from the most recent run were pending in Admin Review. Re-read all counts, exact baselines, and target overlaps before every segment and before staging.

## Locked production decisions

- Use `organization_refresh_bundle_v2` and `tnm-research-pipeline/1.7.2`; the tracked prepare and import commands automatically verify an equal or newer compatible production contract.
- Use `corpus-refresh` for an unscoped database, organization-corpus, or full-breadth refresh request. Do not substitute a hand-selected seven-record dossier run.
- The runner automatically selects up to 50 eligible published null-version organizations outside active Review, balanced across organization roles. Continue successive non-overlapping segments until the current eligible corpus is exhausted.
- The 50-record segment is an artifact, Admin, and publication-transaction reliability envelope. It is not a relevance, source, evidence, or discovery-yield limit.
- Unrelated pending or approved candidates do not block preparation of the next segment. Exact target overlap, unavailable queue reads, stale baselines, unresolved duplicates, or a running local organization-dossier job remain hard stops.
- Research stops at private Admin Review. Human acceptance and the separate Publish checkpoint remain mandatory for every organization.
- Do not set `editorial_profile_version` globally. A record activates only when its complete candidate is reviewed and explicitly published.
- Use no numeric article or source quota. Readiness requires decision-useful saturation, at least three auditable complementary searched lanes, all twelve coverage dimensions dispositioned, durable independent corroboration where the role-specific plan requires it, and explicit consequential unknowns.
- Every selected source supports a public leaf, a specific warning, or a documented coverage conclusion. Syndicated copies, unused source padding, search results, feed entries, and social discovery do not increase readiness.
- Unsupported optional content stays absent. Every assigned target ends with one ready candidate, `research_required`, or `no_material_change`; sparse evidence never causes silent omission.

## Campaign sequence

1. Validate and deploy the tracked pipeline 1.7.2 application, portable schemas, Admin Publish subset selection, tests, skill contract, and governance. Confirm the automatic production-compatibility preflight passes.
2. Reconcile the seven currently pending candidates in Admin Review without rewriting their already staged lineage. Andrew may accept, reject, defer, or leave any candidate pending.
3. Prepare `corpus-refresh` against the live corpus. The runner excludes activated and active-review targets and chooses the next eligible production segment automatically.
4. Complete role-specific research for every selected target. Inspect all durable context that improves a business-development decision; qualify only genuine dated decision-changing signals; normalize source independence by underlying owner/origin/event family; link material conflicts explicitly.
5. Run `research:validate` and `research:smoke --check-only`, generate Review/staging only through tracked commands, re-read target overlaps and byte-exact baselines, and import through the trusted path.
6. Continue subsequent eligible segments when a full-corpus run was requested. Do not wait for unrelated pending Review candidates and do not stop after one convenient segment.
7. In Admin Review, inspect every proposed field, mapped source, conflict and pre-populated rationale. Accept only records Andrew approves.
8. At Publish, select the approved subset to promote. Verify each activated route, PDF, sources, responsive layout, directory/map reliability and production logs.
9. Reconcile the live remaining null-version and active-review sets after each Publish batch until every published organization has a reviewed outcome.

## Required validation

- Pinned Node 24: focused research/Admin tests, `pnpm research:validate`, `pnpm test`, and `pnpm lint`.
- Before release: `pnpm release:validate`, GitHub Release Validation, CodeQL, Vercel build/runtime confirmation, health and catalogue reconciliation.
- Before staging: automatic equal-or-newer deployed compatibility, byte-exact target baselines, complete expected staged count, and zero target overlap.
- Before Publish: authenticated Review evidence inspection and one explicit human rationale per decision.
- After Publish: public route/PDF/source verification, governed responsive and keyboard checks, and clean Vercel/PostgreSQL log windows.

## Current next safe action

Complete local 1.7.2 regression validation, then commit, deploy and verify it under Andrew's release authority. The tracked prepare command will stop automatically before creating a corpus segment if production is older or unavailable; no operator version comparison is required. After deployment, reconcile the live Review queue and start the automatically selected production corpus campaign.
