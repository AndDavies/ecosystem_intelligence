# Research application interface

Status: maintained application and private-skill boundary
Owner: Andrew Davies
Last reviewed: 2026-09-12

## Authority and routing

The executable accepted data shapes are in `app/src/lib/research/pipeline-schema.ts` and the versioned migrations under `app/supabase/migrations/`. Portable schemas under `research/ingestion/schema/` must match their generator; prose is not another schema. The deployed `/api/system/research-contract` advertises supported intake/Review/Publish compatibility. Inspect it only during an authorized run or release that depends on it; local instruction maintenance does not query production.

Research procedure is owned by the ignored `.agents/skills/tnm-autonomous-research/SKILL.md`, with its mode-specific references. Common evidence rules have one home in that skill's `references/shared-research-policy.md`; stages add only their particular responsibilities. `.agents/skills/tnm-research-workflow-registry.json` owns mode routing and artifact roots; `scripts/render_tnm_research_workflow.py` generates its reference. These local resources are not deployed with the application.

## Interoperability safeguards

Research → candidate assembly → guarded database Admin Review is the genuine-run delivery path. Qualified work continues to private intake without another approval checkpoint. Local evidence and resumable state support that path, not an alternative endpoint. Human acceptance and separate Publish are required under the [Admin contract](Admin%20Workflow%20And%20Data%20Contract.md). Research has no direct canonical-table or public-media write authority.

The tracked finalizer/importer validates the complete same-run lineage, exact candidate parity, supported deployed versions and current duplicate/target state. Immutable snapshots retain timestamp precision and complete child baselines; refresh operations must simulate the reviewed final record. Publication repeats stale-baseline protection. Uncertain intake uses receipts and exact reconciliation, never blind retry. Historical artifacts retain their recorded schema; never downgrade new work to evade a gate.

Canonical repair uses exact private snapshots and allowlisted soft corrections, individual Review and individual Publish. It cannot hard-delete, reparent, transfer or change stable slugs; protected dependencies and successor/redirect safety remain enforced. Source captures, ledgers, candidates and recovery material remain intact.

No-change, research-required, blocked and interrupted outcomes must be truthful. A valid zero-candidate disposition is not failed intake. Missing optional fields and a valid logo `not_found` are non-blocking; identity, inclusion, evidence, privacy and safe-write failures remain consequential boundaries.

## Evidence and editorial compatibility

Public claims require inspected durable public support or an approved submission with permission. Internal correspondence and permissioned uploads stay private absent a recorded publication basis. Attribute company claims, including reported TRLs, and distinguish them from verified results and TNM inference. Financial stages, dates, currencies, counterparties and unknowns must not be conflated. See the shared research policy for claim-specific thresholds and investigation rules, and the Access matrix for disclosure/retention.

Current lane/envelope, coverage, rationale and field-length gates are executable constraints, not permanent editorial ideals. The implemented local editorial standard separates private reviewer notes from public summaries/profiles, Signals articles and email. Legacy prose checks remain for historical/unmarked output; new marked output uses substantive review without sentence or lexical scoring. Do not bypass current enforcement. Organization-logo fallback is separate from Signals image conventions.

For an instruction edit, use local reference and affected skill validation. For executable compatibility, Review, Publish or schema changes, use the affected safeguards in the [Cross-System Contract](Cross-System%20Change%20And%20Regression%20Contract.md); release sequencing is owned by the Release Runbook.

## Reader-usefulness release contract

Pipeline 1.9 supports `editorialStandard: reader_usefulness_v1` on organization v3 and refresh v2; observations use `organization.snapshotObservations` / `snapshot_observations`. Zod owns validation; `app/scripts/generate-snapshot-schema.ts` updates the affected portable definitions. `app/src/lib/atlas/company-snapshot.ts` owns the observation shape. Before genuine intake, the deployment gate requires the live contract to advertise 1.9 or later; snapshot writes additionally require `candidateSnapshotPublication: company_snapshot_observations_v1`. The additive migration is `20260927124955_company_snapshot_observations.sql`, applied before the compatible application. The active editorial review records the release and pilot scope. Modern atomic lineage permits distinct supported assertions from one source in a narrative leaf, preserving one-to-one claim mapping and rejecting duplicate assertions. Historical envelopes remain valid; do not strip the marker or downgrade new work to stage. A local version constant is not proof of deployment.

## Optional dossier presentation copy

The shared Option A renderer serves all ordinary organization/capability routes, including records without short copy. Full narrative and TNM assessment remain distinct. `app/src/lib/atlas/dossier-presentation-copy.ts` owns the four optional fields: organization `presentationCopy.displayLead` / `roleDescriptor`, capability `presentationCopy.displayLead` / `catalogueTeaser`. Storage is nullable `organizations.display_lead`, `organizations.role_descriptor`, `capabilities.display_lead`, `capabilities.catalogue_teaser`. Missing copy removes the slot and leaves an obvious full-overview/technical-summary path; it never triggers a generated or truncated substitute.

New v3 bundles use those nested shapes; v2 refreshes use organization `set_field` with the snake-case column, or capability `add_child.value.presentationCopy` / `update_child.after.presentationCopy`. Omission preserves the published value; explicit `null` is a reviewed clear. Capability copy changes require the complete current `before.presentationCopy` baseline, including nulls. The immutable snapshot helper supplies it. Source-backed evidence maps each proposed public leaf, with the usual claim/configuration/date qualifications. Drafts remain private; normal human acceptance and separate guarded Publish persist copy and citations atomically. Current published copy and narrative are shown together during Review. Existing administrator maintenance uses the same entity-bound public evidence, stale baseline, audit and cache invalidation boundaries.

Length guidance (35–65 words for a lead, 25–55 for a teaser, 3–10 for a role) is advisory, not rejection or truncation. These are reviewed editorial fields, never automatically extracted from long prose. Research may propose them when useful after checking the full narrative, but they are not a completeness quota or a prerequisite for old records/candidates. No backfill is required for the shared layout.

`pipeline-schema.ts` remains the candidate authority; `app/scripts/generate-presentation-copy-schema.ts` regenerates its affected portable definitions. Pipeline 1.9 and historical envelopes remain intact. Copy-bearing candidates additionally require the deployed `candidatePresentationCopyPublication: dossier_presentation_copy_v1` capability. The application advertises it only after the additive migration's database probe succeeds. A local schema/skill edit does not activate intake. The [Release Runbook](Production%20Release%20Runbook.md#option-a-and-optional-presentation-copy) owns migration order, activation and rollback.

## Candidate logos

Find an official logo for each new organization and each dossier refresh missing a published logo. The candidate carries its logo and provenance through private intake, Review and Publish. Acceptance includes the logo; Publish associates it in the same database transaction as the dossier. Existing logos remain in place, and a missing logo does not block research. Prepared images use the existing private intake bucket until Publish. The deployed research contract advertises `candidateLogoPublication: candidate_logo_v1` when this path is available.
