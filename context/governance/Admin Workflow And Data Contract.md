# Admin Workflow And Data Contract

This document is the current operating contract for the private True North Map administration routes. The detailed route-by-route manual is [True North Map Admin Manual](../../output/pdf/True_North_Map_Admin_Manual.pdf).

Last verified: 2026-07-24

## Access

- Every `/admin/*` page is private, `noindex`, absent from public navigation, and fail-closed to Andrew Davies's immutable user ID, exact email, and controlled `app_metadata.role = admin`.
- Admin server actions repeat the role check. Service credentials remain server-only.

## Current Live State

Read organization, technology, public-demand, and reviewed-match counts from the canonical production database. Do not freeze live counts in this operating contract. Every published demand match requires an approved review state, a specific reviewer rationale, and citations inherited from both the technology and the demand requirement.

## Routes

| Route | Purpose | Public write behaviour |
| --- | --- | --- |
| `/admin` | Live operations overview | Read-only |
| `/admin/intake` | Stage a URL or private document | Private research run and candidate only |
| `/admin/review` | Inspect, edit, merge, accept, reject, or defer new-record and refresh candidates; publish a demand match | Research-candidate acceptance stays private; demand-match Publish is immediate |
| `/admin/publish` | Publish approved organization, demand-signal, organization-refresh, and demand-refresh candidates | Transactional public publication |
| `/admin/organizations` | Find canonical public records | Read-only list |
| `/admin/organizations/[id]/edit` | Maintain one published organization dossier | Immediate transactional public update |
| `/admin/demand-signals` | Add or maintain official public demand sources and requirements | Immediate transactional public update |
| `/admin/demand-matches` | Stage plausible technology-to-demand suggestions | Private candidates only |
| `/admin/insights` | Progress bounded beta workflows and inspect discovery behaviour | Private workflow updates only |
| `/admin/coverage` | Inspect live gaps by region, technology, mission, and public demand | Read-only |

## Relationship Safety

- Published organization maintenance preserves organization, capability, and location identifiers. Existing mission and demand matches continue to point to the same capability.
- Demand-signal maintenance updates existing `sources`, `demand_sources`, `demand_source_issuers`, and `demand_requirements` rows transactionally. The selected issuing authority remains explicit. Existing requirement IDs and slugs remain stable, so `capability_demand_matches` and `field_citations` do not detach.
- Adding a demand requirement creates a new stable row. It does not generate or publish matches automatically.
- Material writes record the administrator, rationale, and timestamp in `audit_events` or `review_decisions`.

## Demand-match suggestions

The private matching workspace compares reviewed technology records with published public needs. It requires shared mission concepts, applies demand-specific safeguards for narrow requirements, and excludes existing or previously reviewed pairs. The result remains a derived suggestion rather than source-backed proof of fit.

Every staged suggestion carries a plain-language, editable publication rationale. Existing pending candidates created before this field was introduced receive the same deterministic rationale when rendered in Admin Review. The administrator must still review the technology profile, demand statement, underlying citations, and caveats before using the individual Publish control. Publishing adds only the reviewed relationship; it does not alter either source record or imply eligibility, endorsement, customer interest, or classified demand.

## Research refresh candidates

An enrichment run does not edit a published dossier directly. It creates a typed refresh candidate in the existing `candidate_changes` review workflow:

1. `target_entity_id` identifies the published organization or demand source.
2. `before_record` captures the canonical rows reviewed by the agent.
3. `targetMatch.baselineUpdatedAt` records the target's live `updated_at` value.
4. `operations` describes only the proposed `set_field`, `add_child`, or `update_child` changes.
5. Each operation references durable field evidence and includes a reviewer explanation.

Trusted staging upserts `research_runs` and `candidate_changes` only. Accepting a refresh adds a `review_decisions` row, sets the candidate to `approved`, records an audit event with `publication_changed: false`, removes it from the pending Review list, and makes it eligible in the Publish selection. It still does not change the target.

The Review action accepts only candidate kinds with complete typed Review and Publish support. Unknown or partial candidate types fail closed and may only be deferred or rejected. After acceptance, the Review screen links directly to the Publication checkpoint, and the Admin overview keeps an approved-record notice visible until publication.

Before trusted staging, the research importer compares every candidate kind and schema with the deployed `/api/system/research-contract` response. This prevents a database migration or research run from placing a candidate into a queue that the deployed application cannot interpret or publish.

The separate Publish action locks the candidate and target, compares the current target timestamp with the recorded baseline, and fails atomically if the target changed after research. An eligible publication applies only the reviewed operations, preserves existing IDs and slugs, upserts sources, appends evidence snippets and field citations, records the before/operation audit payload, and revalidates affected public routes.

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
