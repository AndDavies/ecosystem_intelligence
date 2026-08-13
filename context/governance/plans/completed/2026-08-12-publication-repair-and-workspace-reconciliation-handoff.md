# Publication Repair and Workspace Reconciliation Handoff

Status: completed reconciliation; incident repair retained, Kîsik reviewed/published separately, preserved work merged into the August 13 production release
Owner: Andrew Davies
Prepared: 2026-08-12
Workspace: `/Users/andrewdavies/Documents/Codex/projects/Ecosystem Intelligence`

## Purpose

Use this file in the development chat before implementing its existing plan. Several research, publication, validation, visibility, North Signal, source-registry and governance items were completed or partially completed during the August 12 incident response. Re-read the development plan against the facts below so completed work is not rebuilt and preserved local work is not accidentally discarded.

## Executive state

- Commit `26a980e44d5d934f66cf9af98b945e0268ba4ac2` remains the preserved
  incident-repair baseline in production history. Current production and
  `origin/main` include that repair plus the reconciled August 13 reliability,
  dossier, UX, research and North Signal release.
- The main checkout is clean and synchronized with `origin/main` at the
  production release checkpoint.
- The publication incident for `tnm-manual-20260812172434` is fixed.
- Five valid candidates from that run were published: DroneBoy, HENSOLDT Canada, ISARA, KorrAI and Marimetrics Technologies.
- The invalid Kîsik GeoSpatial candidate was returned to research and rejected while preserving its audit trail.
- Corrected Kîsik run `tnm-manual-20260812203851` subsequently completed fresh
  human Admin Review and the separate Publish decision.
- The local ignored `tnm-autonomous-research` skill was hardened, advanced to
  the deployed 1.7.3 contract and validated. It remains intentionally outside
  Git.
- Broader August work from local branch `codex/workspace-reconciliation-20260812` at `99104f5` was reviewed commit-by-commit and merged with the newer reliability/research contracts.
- The temporary release worktree and preservation branches are release-only
  scaffolding; their commits were proven ancestors of verified production
  `main` before cleanup.

## Reconciliation completion

The incident repair at `26a980e` remains in history. Its preserved research lineage, visibility implementation, North Signal brand/source work and governance were integrated with the August 13 reliability, dossier, UX and growth release. No whole-branch overwrite was used. The live research queue was empty at release preflight; the merge did not accept or publish a candidate and did not alter provider or campaign state.

## Root cause and production repair already completed

Production run UUID `4345fdd7-d591-4d22-be8a-62464c7a3609` failed atomically three times because Kîsik's refresh produced an invalid final organization state: `current_activity` was non-null while `current_activity_as_of` was null. The database correctly rejected the entire six-record transaction.

Deployed commit `26a980e` now:

1. simulates all refresh operations over the exact `beforeRecord`;
2. rejects final activity/date XOR-null states before publication;
3. maps the database invariant to a specific operator error;
4. names approved rows that no longer satisfy the current contract;
5. provides an audited action to return only an invalid row to research;
6. adds focused regression coverage; and
7. uses the service-role reader for credentialed full-corpus coverage validation when available, retaining a public read-only fallback.

Primary deployed files:

- `app/src/lib/research/pipeline-schema.ts`
- `app/src/lib/research/publication-errors.ts`
- `app/src/app/admin/publish/page.tsx`
- `app/scripts/autonomous-research.ts`
- `app/tests/admin-publication-workflow.test.ts`
- `app/tests/organization-dossier-research-contract.test.ts`
- `app/tests/research-publication-errors.test.ts`
- `context/governance/Development Log.md`
- `context/governance/Research Agent Schema And Source Contract.md`

Do not recreate this fix in the development plan. Extend it only if the plan asks for additional publication invariants or richer recovery UX.

## Corrected Kîsik closure

The original production candidate `f4a70914-d105-49f7-9f72-614cb9f8cc02` is rejected. The corrected private candidate is `fb98b13f-2435-4b23-b640-ef8e0f8bad4d` in production research run `8ccd610c-0e8c-4798-8a29-301089a2a648`.

The corrected refresh:

- clears both undated activity fields;
- preserves TSB investigation `A25A0042` as a warning rather than a fabricated organization activity signal;
- updates operating context, Canadian footprint and public contact;
- adds a reviewed question;
- activated `organization_editorial_profile_v1` only after Andrew completed the
  fresh Admin Review and separate Publish decision.

The original invalid candidate remains rejected and the corrected candidate's
review/publication lineage is preserved. The repair did not grant development
or research any automatic approval or publication authority.

## Local skill repair already completed

Ignored private skill files under `.agents/skills/tnm-autonomous-research/` now require:

- full final-state refresh simulation before canonical writes and before finalizer apply;
- paired activity/date validation;
- construction from current imported schemas and enums;
- complete in-memory candidate and batch validation before canonical artifact writes;
- a fresh candidate and fresh human review when a previously approved payload is invalidated; and
- no reuse of target-specific historical builders as generic constructors.

`pnpm skills:validate` passed with 10 skills, zero errors and zero warnings. Because `.agents/skills/` is ignored by project policy, these changes exist in the local operator surface, not on `main` or the reconciliation branch.

## Historical branch and worktree map

| Location / branch | Commit | State | Meaning |
| --- | --- | --- | --- |
| Main checkout / `main` | current production release | clean, equals `origin/main` | incident repair plus reconciled August 13 release |
| `/private/tmp/tnm-publish-repair.K4Jyob` / `codex/corpus-publish-repair` | `26a980e` | clean and redundant after ancestry verification | temporary incident-release worktree, removed during final cleanup |
| `codex/workspace-reconciliation-20260812` | `99104f5` | commit preserved in `main` history | five scoped reconciliation commits reviewed and integrated |

The main checkout is not dirty. The apparent earlier “very dirty” state meant Git saw uncommitted modifications and untracked files; it did not mean database corruption, site compromise or damaged Git metadata.

The dirty state arose from several same-checkout workflows accumulating at once:

- 295 canonical research lineage/review/staging artifacts, about 123 MB;
- research-platform and finalizer work;
- visibility tooling;
- North Signal/email/source-registry work; and
- governance updates.

All of that state was preserved before cleaning the main checkout.

## Broader reconciliation branch

`codex/workspace-reconciliation-20260812` is rebased on deployed `26a980e` and contains five commits:

1. `378e8b5` — `Harden autonomous research finalization`
2. `256d559` — `Archive August research run lineage`
3. `1815f2c` — `Enrich private visibility evidence`
4. `d6220f0` — `Reconcile North Signal brand and sources`
5. `99104f5` — `Reconcile August operating contracts`

Diff from `origin/main`: 338 files, about 907,015 insertions and 236 deletions. Most insertions are immutable JSON/Markdown research artifacts; 300 changed paths are under `research/`, 23 under `app/`, 11 under `context/`, three under `content/`, plus the root package manifest.

This branch was a preservation and reconciliation branch, not an independent
release candidate. Its commits were inspected independently and integrated
scope by scope; the branch itself was never pushed or used to create a preview
deployment.

## Work that may already satisfy parts of the development plan

Inspect the plan for overlap with these preserved changes:

### Research pipeline and operator control plane

- tracked deterministic finalizer with plan, check-only, file-only and apply modes;
- research operation evaluation fixtures and validator;
- local skill validator;
- source-family normalization with stable hashes;
- bounded map helpers and identity matching;
- same-checkout single-writer locking;
- workflow registry;
- candidate-logo bounded retry/failure controls;
- guarded research reconciliation command;
- stricter candidate/evidence/lineage tests.

### Research corpus lineage

- 295 August run artifacts preserved across briefs, run manifests, collection plans, prospect inventories, source leads, signal batches, ledgers, candidate batches, reviews and staging exports;
- includes the failed corpus run, its validated lineage and the corrected Kîsik run.

### Visibility

- richer private visibility evidence and dashboard contract;
- Search Console/GA4/DataForSEO/PageSpeed/CrUX boundary refinements;
- strict known-host AI referral handling;
- aggregate-only privacy boundary;
- 21 visibility contract tests and `pnpm visibility:validate` passing.

### North Signal, email and source discovery

- reconciled welcome and weekly source templates;
- brand-system updates;
- source book expanded and normalized;
- official Canada feeds added with probation/fallback handling;
- North Signal acquisition tests updated.

### Governance

- August research, visibility, North Signal, email, release, project-status and source-system decisions recorded across the canonical governance set.

## Validation evidence

The deployed publication-fix commit passed the full release path, including GitHub Release Validation, CodeQL, Vercel deployment, launch validation, affected public routes and live production checks.

The broader reconciliation branch was then validated after rebasing on the deployed fix:

- `pnpm test`: 62 files, 408 tests passed;
- `pnpm lint`: passed;
- `pnpm research:validate`: 637 artifacts, zero errors, 4,450 historical/advisory warnings;
- `pnpm research:eval`: nine of nine cases passed;
- `pnpm skills:validate`: zero errors/warnings;
- `pnpm visibility:validate`: passed; and
- focused North Signal and visibility tests: 26 passed.

The reconciliation branch has not undergone a separate production deployment or post-deploy route audit because it was not authorized for release.

## Production and Supabase closure

- Five valid records from the failed batch are published.
- The original Kîsik candidate is rejected; its canonical organization remains unchanged.
- The corrected Kîsik candidate completed human Review and separate Publish.
- Kraken Robotics is published with editorial profile v1, a paired `2026-07-02` activity date and four published capabilities; no Kraken-specific database, API or route regression was found.
- Supabase leaked-password protection was enabled through the authenticated provider dashboard; the prior security warning cleared.
- The incident repair itself required no database migration. The later
  reliability release applied its four separately reviewed migrations in the
  recorded two-stage order; that work did not rewrite the incident lineage.

## Reconciliation decisions completed

1. The implementation plan was compared line by line with `26a980e` and all
   five reconciliation commits.
2. Publication-pair validation, invalid-approved-row recovery and focused
   regression coverage remain complete and deployed.
3. The reconciliation commits were integrated individually; no whole-branch
   overwrite or preview deployment was used.
4. Immutable research lineage was retained as audit history; private local
   coverage and operator reports remain ignored.
5. The private installed skill was reviewed and validated against the deployed
   1.7.3 contract without changing the repository policy for `.agents/skills/`.
6. Kîsik completed fresh human Review and separate Publish.
7. Temporary worktree and branch cleanup followed ancestry and production
   verification.
8. The integrated change completed the full Node 24, GitHub, Vercel, migration,
   cold-dossier, bounded-launch and production-state release sequence.

## Final reconciliation commands

The completed reconciliation used the following read-only orientation before
explicit-path integration:

```bash
git status --short --branch
git worktree list
git log --oneline --decorate origin/main..codex/workspace-reconciliation-20260812
git diff --stat origin/main..codex/workspace-reconciliation-20260812
git show --stat 378e8b5
git show --stat 1815f2c
git show --stat d6220f0
```

It then reconciled:

- `AGENTS.md`
- `context/governance/True North Map Project Overview.md`
- `context/governance/Project Status.md`
- `context/governance/Cross-System Change And Regression Contract.md`
- this handoff file
- the completed reliability, dossier, UX and growth implementation plan

## Preserved operating boundaries

- Research still cannot approve or publish a candidate automatically.
- Future preserved branches require the same scope-by-scope review before
  integration.
- Future temporary worktrees are removed only after ancestry and production
  verification.
- This historical handoff does not authorize a campaign, research publication,
  provider write or database migration; the August 13 actions relied on later
  explicit authority and their own release gates.
