# Admin Workflow And Data Contract

This document is the current operating contract for the private True North Map administration routes.

Status: canonical administration and publication contract
Owner: Andrew Davies
Last reviewed: 2026-08-09

## Access

- Every `/admin/*` page is private, `noindex`, absent from public navigation, and fail-closed to Andrew Davies's immutable user ID, exact email, and controlled `app_metadata.role = admin`.
- Admin server actions repeat the role check. Service credentials remain server-only.

## Current Live State

Read organization, technology, public-demand, and reviewed-match counts from the canonical production database. Do not freeze live counts in this operating contract. Every published demand match requires an approved review state, a specific reviewer rationale, and citations inherited from both the technology and the demand requirement.

The application contract in this release is `tnm-review-publication-v3`. It adds complete Review and Publish support for `organization_bundle_v3` and `organization_refresh_bundle_v2`, but research must still verify that exact contract from the deployed `/api/system/research-contract` before staging either shape.

## Routes

| Route | Purpose | Public write behaviour |
| --- | --- | --- |
| `/admin` | Live operations overview | Read-only |
| `/admin/intake` | Stage a URL or private document | Private research run and candidate only |
| `/admin/review` | Inspect, edit, merge, accept, reject, or defer new-record and refresh candidates; publish a demand match | Research-candidate acceptance stays private; demand-match Publish is immediate |
| `/admin/publish` | Publish approved organization, demand-signal, organization-refresh, and demand-refresh candidates | Transactional public publication |
| `/admin/organizations` | Find canonical public records | Read-only list |
| `/admin/organizations/[id]/edit` | Maintain one published organization dossier, its editorial activation, approved child records, public contacts, and approved official logo | Immediate transactional public update after cited-field and rationale checks |
| `/admin/demand-signals` | Add or maintain official public demand sources and requirements | Immediate transactional public update |
| `/admin/demand-matches` | Stage plausible technology-to-demand suggestions | Private candidates only |
| `/admin/signals` | List Signals editions, current social-example completeness, and recent automated run health | Read-only index |
| `/admin/signals/[id]/edit` | Correct one edition and its article entries, inspect sources and hero provenance, and copy the edition's LinkedIn/X examples | Immediate audited editorial update and public route revalidation; social examples remain read-only |
| `/admin/insights` | Progress bounded beta workflows and inspect discovery behaviour | Private workflow updates only |
| `/admin/coverage` | Inspect live gaps plus the derived `published_v1`, `pending_review`, and `research_required` organization-dossier dispositions | Read-only; it creates no second queue |

The Signals editor does not create a second publishing system. Daily automation remains responsible for source selection, the validated edition packet, image gate, and first publication. The owner editor may correct published copy or archive an edition through the existing server actions. Source lineage, atlas continuations, hero provenance, and social examples remain inspectable; copying a social example never posts externally or mutates its database status.

## Relationship Safety

- Published organization maintenance preserves organization, capability, and location identifiers. Existing mission and demand matches continue to point to the same capability.
- Editorial organization maintenance may update normalized operating context, Canadian footprint, current activity and date, reviewed questions, the version gate, capability operating detail, program participation, funding, and relationships. New or changed public values require attached public citations where the field contract requires them; reviewed questions remain assessment content and require an editorial rationale rather than being presented as source facts.
- `editorial_profile_version` may be set only to `organization_editorial_profile_v1` or null. Turning it on changes the shared presentation for that organization but does not create evidence, relationships, or publication authority. Turning it off restores the legacy profile without deleting normalized content.
- Demand-signal maintenance updates existing `sources`, `demand_sources`, `demand_source_issuers`, and `demand_requirements` rows transactionally. The selected issuing authority remains explicit. Existing requirement IDs and slugs remain stable, so `capability_demand_matches` and `field_citations` do not detach.
- Adding a demand requirement creates a new stable row. It does not generate or publish matches automatically.
- Material writes record the administrator, rationale, and timestamp in `audit_events` or `review_decisions`.
- Replacing an organization logo normalizes the administrator-supplied official image into the existing public-media bucket, publishes one provenance-backed `media_assets` row, archives the prior active logo, and revalidates the affected dossier. Removing a logo archives its row, removes its storage object, records the action, and restores the neutral public fallback without changing the organization or any related technology record.

## Demand-match suggestions

The private matching workspace compares reviewed technology records with published public needs. It requires shared mission concepts, applies demand-specific safeguards for narrow requirements, and excludes existing or previously reviewed pairs. The result remains a derived suggestion rather than source-backed proof of fit.

Every staged suggestion carries a plain-language, editable publication rationale. Existing pending candidates created before this field was introduced receive the same deterministic rationale when rendered in Admin Review. The administrator must still review the technology profile, demand statement, underlying citations, and caveats before using the individual Publish control. Publishing adds only the reviewed relationship; it does not alter either source record or imply eligibility, endorsement, customer interest, or classified demand.

## Research refresh candidates

An enrichment run does not edit a published dossier directly. It creates a typed refresh candidate in the existing `candidate_changes` review workflow:

1. `target_entity_id` identifies the published organization or demand source.
2. `before_record` captures the canonical rows reviewed by the agent.
3. `targetMatch.baselineUpdatedAt` records the target's live `updated_at` value and must exactly equal the raw timestamp string preserved inside `before_record`, including all PostgreSQL fractional-second digits and timezone text.
4. `operations` describes only the proposed `set_field`, `set_profile_field`, `add_child`, or `update_child` changes allowed by the candidate schema.
5. Each operation references durable field evidence and includes a reviewer explanation.

The current normalized organization paths are `organization_bundle_v3` for a new organization and `organization_refresh_bundle_v2` for an existing one. New bundles can carry the editorial profile, capabilities, program participations, funding events, relationships, public contact and approved-logo disposition. Refresh v2 can set an allowlisted organization field, set a kind-specific profile field, add a supported child, or update a stable capability or participation child. It has no delete operation. Every source-backed leaf must map to field evidence before Review, and the separate Publish transaction writes citations to the canonical normalized entity.

Trusted staging upserts `research_runs` and `candidate_changes` only. Accepting a refresh adds a `review_decisions` row, sets the candidate to `approved`, records an audit event with `publication_changed: false`, removes it from the pending Review list, and makes it eligible in the Publish selection. It still does not change the target.

The Review action accepts only candidate kinds with complete typed Review and Publish support. Unknown or partial candidate types fail closed and may only be deferred or rejected. After acceptance, the Review screen links directly to the Publication checkpoint, and the Admin overview keeps an approved-record notice visible until publication.

Before trusted staging, the research importer compares every candidate kind and schema with the deployed `/api/system/research-contract` response. This prevents a database migration or research run from placing a candidate into a queue that the deployed application cannot interpret or publish.

The separate Publish action locks the candidate and organization, uses the immutable `before_record` timestamp as the authoritative parent baseline, and fails atomically if the target changed after research. For every `update_child`, it then locks the owned child, reconstructs the complete normalized public snapshot, and compares it with the schema-valid reviewed `before` payload before applying any change. Candidate creation, smoke validation, trusted staging, and a database trigger all reject timestamp precision loss before review. Direct owner child corrections acquire the same parent-first lock and advance the parent review timestamp, so an already-staged refresh becomes stale instead of overwriting the correction. A genuinely stale parent or child produces a candidate-specific administrator message and requires a fresh candidate plus human review. An eligible publication applies only the reviewed operations, preserves existing IDs and slugs, upserts sources, appends evidence snippets and field citations using leaf-local targets, records the before/operation audit payload, and revalidates affected public routes.

The Admin Review UI renders each refresh as a plain-language publication summary followed by structured field changes. New technologies, programs, relationships, and demand statements are labelled as additions; in-place updates show current and proposed values, including added and removed list items. Evidence excerpts and warnings remain readable, while the complete typed payload is available only in a collapsed technical disclosure. Displaying or accepting a refresh never changes the canonical record.

The executable refresh contract also rejects incomplete child records, organization operations inside demand refreshes, demand operations inside organization refreshes, and child or field operations whose declared parent does not match the canonical target. Administrator edits recheck live Technical Domain and Mission Area values before they can be saved.

## Publication Rules

1. Verify the canonical public source.
2. Keep facts separate from derived interpretation.
3. Translate features into a concrete user outcome without strengthening the underlying claim.
4. Resolve duplicates before acceptance.
5. State uncertainty and public-source caveats.
6. Use the explicit publication control appropriate to the record type.
7. Open the public page after publication and verify evidence and relationships.

The production Supabase project remains the sole source of truth. Local fixtures, remembered taxonomy, candidate files, and research-agent output cannot substitute for live database validation or human publication.

Candidate publication also validates organization aliases after the database's normalization rule is applied. Case and punctuation variants are rejected during candidate parsing, while the publication function defensively keeps one deterministic alias per normalized value so an older approved candidate cannot abort an otherwise valid atomic batch.

Demand issuer hierarchy is canonical taxonomy. A demand-signal candidate may add an issuing body, but any `parentIssuerSlug` must resolve to an already published parent issuer before it can enter the Publication checkpoint. The checkpoint displays missing parents and disables publication before the transaction begins; the database retains the same rejection as a final safety guard. The National Research Council Canada is established beneath the Government of Canada so NRC IRAP signals can retain their accurate parent relationship.
