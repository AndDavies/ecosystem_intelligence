# Governed canonical organization repair

Status: release authorized; production migration, deployment verification and private repair staging in progress
Owner: Andrew Davies
Implementation owner: MAIN DEV
Opened: 2026-09-04

## Objective

Introduce a narrow, auditable path for correcting published organization
identity and lifecycle records that the non-destructive dossier-refresh contract
cannot safely change. Use it to prepare the September 4 canonical-review cohort
and any additional production records found by the same bounded anomaly audit.

## Authority and boundaries

- Preserve Research -> Admin Review -> separate Publish authority.
- Never hard-delete a canonical organization or child record.
- Keep canonical repairs out of batch acceptance and publication for the first
  release; each repair requires an explicit individual decision.
- Do not reinterpret missing evidence as permission to archive, merge, rename,
  or reclassify a record.
- Production migration, Git release, candidate staging, Review and Publish each
  remain separate observable states. No canonical record changes merely because
  this contract or a private candidate packet exists.
- Preserve unrelated Command Centre governance edits and all untracked research
  lineage.

## Repair contract

Add `organization_canonical_repair_bundle_v1` as a dedicated candidate shape
with exact current-record baselines, durable source evidence, explicit reviewer
rationale, a private service-role-only `canonical_organization_repair_snapshot_v1`,
and only these bounded operations:

1. `set_organization_identity`;
2. `set_profile_field`;
3. `add_alias`;
4. `archive_alias`;
5. `archive_capability`;
6. `archive_organization`.

The contract does not permit reparenting, transfer or hard deletion. A proven
successor may create one immutable old-slug redirect to an already published
organization. Canonical repair does not invoke Signals research or emit a
Signals artifact.

The atomic publisher must lock and revalidate the source, successor and affected
children; reject stale baselines, identity/alias collisions, successor cycles and
unpublished successors; preserve source-slug continuity through a bounded
successor mapping; and write publication plus audit history. Working Lists and
incoming relationships must not be silently orphaned.

## Initial evidence cohort

The September 4 corpus-wide audit reviewed 21 published records requiring
identity, successor, lifecycle, entity-kind or Canadian-nexus attention. It
found 17 defensible repair treatments. Coastal Defence Systems, Industrial
Recon, SkyX and AerialX remain typed `research_required` holds because current
evidence does not prove a safe canonical operation. No candidate is staged and
no repair is canonical while the production service still advertises Review
contract v3 and pipeline 1.7.3.

The production-wide companion audit also checks normalized canonical-name and
alias collisions, lifecycle/successor language, duplicate domains, broken or
redirected websites, and prior research `research_required` dispositions.

## Completion gate

1. Local schema, Review, Publish, repository/redirect and migration changes pass
   focused tests, `pnpm research:validate`, `pnpm test`, `pnpm lint` and Node 24
   `pnpm release:validate`.
2. Andrew authorizes the exact Git release and production migration. Granted 2026-09-04.
3. The exact deployment is READY and bounded launch/health checks pass.
4. Only then may tracked repair packets be staged after the deployed research
   contract advertises the exact schema.
5. Andrew reviews each repair individually and separately chooses whether to
   publish it.
6. Live canonical, redirect, relationship, Working List and audit state are
   reconciled after each publication.

## Local verification result

- Scoped research validation for `tnm-manual-20260904101514` passed with zero
  errors. Repository-wide research validation continues to report 12 retained
  August 12 discovery artifacts that used three or four recovery lanes before
  the later six-lane discovery minimum; those historical packets were not
  rewritten.
- Skill validation passed for all 11 installed True North Map skills with zero
  errors or warnings.
- The full application suite passed: 82 files and 618 tests. Lint, scale
  validation, production build, repository hygiene and the Node 24
  `release:validate` gate also passed. Dependency overrides were advanced to
  patched `browserslist` and `fast-uri` releases after the security gate caught
  vulnerable transitive resolutions; no high-severity audit finding remains.
- A deliberate production prepare attempt was refused before file creation:
  production advertises Review v3 / pipeline 1.7.3 and does not accept the new
  repair candidate. The run-file count remained 146 before and after. This is
  the required fail-closed behavior, not a partial repair.
