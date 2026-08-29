# Admin Workflow And Data Contract

This document is the current operating contract for the private True North Map administration routes.

Status: canonical administration and publication contract
Owner: Andrew Davies
Last reviewed: 2026-08-29

## Access

- Every `/admin/*` page is private, `noindex`, absent from public navigation, and fail-closed to Andrew Davies's immutable user ID, exact email, and controlled `app_metadata.role = admin`.
- Admin server actions repeat the role check. Service credentials remain server-only.

## Current Live State

Read organization, technology, public-demand, and reviewed-match counts from the canonical production database. Do not freeze live counts in this operating contract. Every published demand match requires an approved review state, a specific reviewer rationale, and citations inherited from both the technology and the demand requirement.

The deployed application contract is `tnm-review-publication-v3` and the
production pipeline is `tnm-research-pipeline/1.7.3`. It supports complete
Review and Publish for `organization_bundle_v3` and
`organization_refresh_bundle_v2`, but research must still verify the exact
deployed `/api/system/research-contract` before staging either shape. The
executive-summary column, Review presentation and guarded new/refresh Publish
functions are live together.

## Routes

| Route | Purpose | Public write behaviour |
| --- | --- | --- |
| `/admin` | Live operations overview | Read-only |
| `/admin/intake` | Stage a URL or private document | Private research run and candidate only |
| `/admin/review` | Inspect, edit, merge, accept, reject, or defer new-record and refresh candidates; publish a demand match | Research-candidate acceptance stays private; demand-match Publish is immediate |
| `/admin/submissions` | Review signed-in profile claims, corrections, and organization suggestions with bounded filters, pagination, source context, rationale, decision history and audit lineage | Approval marks a submission for separate candidate preparation only; it never writes a canonical record or bypasses Admin Review and Publish |
| `/admin/publish` | Publish approved organization, demand-signal, organization-refresh, and demand-refresh candidates | Transactional public publication |
| `/admin/organizations` | Find canonical public records | Read-only list |
| `/admin/organizations/[id]/edit` | Maintain an already activated published dossier, approved child records, public contacts, and approved official logo; first dossier activation is not available here | Immediate transactional public update after cited-field and rationale checks |
| `/admin/demand-signals` | Add or maintain official public demand sources and requirements | Immediate transactional public update |
| `/admin/demand-matches` | Stage plausible technology-to-demand suggestions | Private candidates only |
| `/admin/signals` | List Signals editions, current social-example completeness, and recent automated run health | Read-only index |
| `/admin/signals/[id]/edit` | Correct one edition and its article entries, inspect sources and hero provenance, and copy the edition's LinkedIn/X examples | Immediate audited editorial update and public route revalidation; social examples remain read-only |
| `/admin/insights` | Inspect discovery behavior, distinct-session North Signal funnels over 7/14/28 days, weekly/alert preference and sync state, and aggregate delivery/campaign state; operational submissions remain in their dedicated queue | Aggregate read-only reporting plus the existing bounded contact, connection and feedback workflows; no provider send or identity-behavior join |
| `/admin/coverage` | Inspect live gaps plus the derived `published_v1`, `pending_review`, and `research_required` organization-dossier dispositions | Read-only; it creates no second queue |

The Signals editor does not create a second publishing system. Daily automation remains responsible for source selection, the validated edition packet, image gate, and first publication. The owner editor may correct published copy or archive an edition through the existing server actions. Source lineage, atlas continuations, hero provenance, and social examples remain inspectable; copying a social example never posts externally or mutates its database status.

Admin responsiveness is part of the private operating contract. Shared owner
authentication is memoized once per request; private navigation does not
speculatively prefetch every administration or public route; and an admin
loading boundary gives immediate literal feedback while a destination resolves.
Overview and demand-match totals use count-only reads. Organizations are
server-paginated in 50-row pages with bounded database search. Coverage renders
50 dossier dispositions at a time and receives only four compact count arrays
from the staff-gated `get_admin_coverage_breakdown()` aggregate rather than
assembling the national discovery graph. Defence Briefs mounts one editor only
when a specific draft or new article is selected. Organization search retains names, locations, capability text,
technical tags and technical-domain matching. Defence Brief related-record
options use the public read boundary, and a database trigger rejects any stale
or hand-edited link to a non-public organization, capability or unverified
Public Need. Admin Insights continues to read the complete retained event window
without a 5,000-row cap, but it freezes a deterministic upper record boundary
and reads stable 1,000-row pages in bounded four-query waves rather than one
serial waterfall. Full-corpus rich atlas assembly is not an acceptable way to
calculate admin counts or build selector options.

A public-submission transition is an atomic private transaction. It locks the
expected active status, requires 20–2,000 characters of reviewer rationale,
inserts a submission-linked `review_decisions` row, changes only the submission
status, and writes a `submission_reviewed` audit event with
`publication_changed = false`. A concurrent or stale status fails closed. The
available actions are **Start review**, **Return to pending**, **Approve for
candidate preparation**, and **Reject**. Approval does not itself construct a
research candidate; the submission must still be resolved into a schema-valid,
source-backed candidate through the governed research path before ordinary
Admin Review and the separate Publish checkpoint. Approved submissions remain
available under the approved-status filter with an explicit source-intake
handoff; they are not silently treated as completed publication work.
The same migration repairs the pre-existing polymorphic member-quota trigger so
submission and connection-request inserts read only the identifiers present on
their own row type. Daily and same-organization limits remain unchanged and
fail closed.

The North Signal reporting contract keeps five measurement systems distinct: Search
Console visibility, analytics-consented GA4 traffic, the short-lived
non-identifying first-party funnel, the authoritative global/stream consent
ledger, and aggregate MailerLite delivery. Admin Insights pages the complete
30-day event window, excludes server-classified QA/staff/test sessions from
scorecards without deleting raw events, labels opens estimated/directional and
shows unavailable or stale provider tables rather than false zeroes. Subscriber
email and provider identity remain confined to `/admin/subscribers` and are
never joined to behavior events or Command Centre summaries.

## Relationship Safety

- Published organization maintenance preserves organization, capability, and location identifiers. Existing mission and demand matches continue to point to the same capability.
- Editorial organization maintenance may update normalized operating context, Canadian footprint, current activity and date, reviewed questions, the version gate, capability operating detail, program participation, funding, and relationships. New or changed public values require attached public citations where the field contract requires them; reviewed questions remain assessment content and require an editorial rationale rather than being presented as source facts.
- The 1.7.3 contract adds one optional
  `executive_relevance_summary` between 80 and 1,200 characters. It is a proposed
  True North Map assessment synthesized from already supported public fields and
  reviewed Mission Area, Public Need, program or capability relationships; it is
  never a source fact, ranking, endorsement, customer-interest claim or
  procurement conclusion. A non-null value requires at least one mapped public
  field citation. Unsupported synthesis stays null and is omitted publicly.
- Public organization serialization allowlists role-specific `profile_data` and
  approved public contact fields. Review, reviewer, research-schema and ingestion
  lineage belongs only in private candidate, run, decision and audit records.
  The completed cleanup removed these keys from public organization JSON,
  preserved canonical baselines and installed a trigger/constraint guard.
  Removed public JSON keys are not a rollback store.
- `editorial_profile_version` may be only `organization_editorial_profile_v1` or null. First activation is offered only through a validated research candidate, human Review, and the separate Publish checkpoint. The direct editor can maintain or turn off an already activated profile but cannot turn on a null-version record. This is an application and operator boundary; the owner-only database RPC still has the underlying technical capability and must not be described as a database invariant. Turning the version off restores the legacy profile without deleting normalized content.
- Review evidence shows the mapped source title, publisher, published date or explicit `Undated` state, source kind, locator and outbound source link beside the exact excerpt. Missing source metadata is a blocking error rather than an implicit blank.
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

Under pipeline 1.7.3, each new or refresh dossier must
explicitly propose `executive_relevance_summary` or `null` after coverage
validation. A refresh preview applies the reviewed operation set to the byte-exact
baseline and must show the same final summary the publication function would
write. Admin Review labels the field **Proposed decision snapshot · True North
Map assessment**, displays its mapped evidence, and warns that Accept advances
the candidate only to the separate Publish checkpoint. The database column,
reviewed new/refresh publishers and deployed contract are live; their continued
compatibility is checked before every staging run.

Trusted staging upserts `research_runs` and `candidate_changes` only. Accepting a refresh adds a `review_decisions` row, sets the candidate to `approved`, records an audit event with `publication_changed: false`, removes it from the pending Review list, and makes it eligible in the Publish selection. It still does not change the target.

Admin Review is a persistent queue, not a 20-record inbox. The page may render 20 candidate cards at a time, but its headline and candidate-type totals are calculated from every pending row. Every candidate remains grouped by its `research_run_id`, with the stable run token, staged count and candidate mix visible so multiple completed runs can wait independently. Filters and pagination preserve the selected research run. An eligible completed research run of up to 50 supported candidates may be accepted with one explicit, run-scoped action after the reviewer confirms the run-level research brief. That transaction writes one `review_decisions` row per candidate using its pre-populated evidence-bounded rationale, moves all remaining pending candidates in the run to `approved`, records one batch audit event and changes no public record. An unsupported schema, unresolved duplicate, incomplete rationale, non-completed run or concurrent status change stops the entire batch. Individual review remains available.

A corrected research packet may replace an existing candidate only through the guarded staging function while the same client candidate ID is still `pending`, has no review decision, and retains the exact canonical baseline. Non-pending candidates are never overwritten. The operator must require the complete expected staged count with zero skips and then verify stable row IDs, exact proposed-record and evidence parity, zero review decisions, and unchanged canonical targets. Any skipped or changed row stops the correction rather than triggering a blind retry.

The Review action accepts only candidate kinds with complete typed Review and Publish support. Unknown or partial candidate types fail closed and may only be deferred or rejected. After acceptance, the Review screen links directly to the Publication checkpoint, and the Admin overview keeps an approved-record notice visible until publication.

Before trusted staging, the research importer compares every candidate kind and schema with the deployed `/api/system/research-contract` response. This prevents a database migration or research run from placing a candidate into a queue that the deployed application cannot interpret or publish.

The separate Publish action locks the candidate and organization, uses the immutable `before_record` timestamp as the authoritative parent baseline, and fails atomically if the target changed after research. Its approved queue is also grouped by research run rather than silently showing only the first 50 approvals. The checkpoint lets the reviewer choose one run and select any subset of its displayed approved records; only that selected set enters the all-or-nothing transaction, so one deferred or suspect approval does not force publication or block unrelated ready records. For every `update_child`, the transaction locks the owned child, reconstructs the complete normalized public snapshot, and compares it with the schema-valid reviewed `before` payload before applying any change. Candidate creation, smoke validation, trusted staging, and a database trigger all reject timestamp precision loss before review. Direct owner child corrections acquire the same parent-first lock and advance the parent review timestamp, so an already-staged refresh becomes stale instead of overwriting the correction. A genuinely stale parent or child produces a candidate-specific administrator message and requires a fresh candidate plus human review. An eligible publication applies only the reviewed operations, preserves existing IDs and slugs, upserts sources, appends evidence snippets and field citations using leaf-local targets, records the before/operation audit payload, and revalidates affected public routes.

For the optional executive summary, both new-record and refresh publication
paths must write exactly the accepted preview, require a mapped public citation
when non-null, preserve null when evidence is insufficient, and append the same
audit/evidence trail as other reviewed organization fields. Neither staging nor
Accept writes it to the public organization. These functions are deployed; the
human Review and separate Publish checkpoints remain mandatory.

The Admin Review UI renders each refresh as one collapsed, read-only generated research brief followed by structured field changes and one editable `Reviewer decision rationale`. The field is pre-populated with the candidate's evidence-bounded, record-specific rationale to reduce repetitive reviewer entry; it remains a suggestion that the authenticated reviewer must inspect and may edit before submitting. A reviewer who defers or rejects should rewrite the suggestion to match that decision. The prefill never claims that human review or acceptance has already occurred, and the explicit Accept action plus separate Publish checkpoint remain mandatory. New technologies, programs, relationships, and demand statements are labelled as additions. Scalar and date changes render once; objects and arrays are expanded into readable labelled values; clear-to-null changes explicitly show the current value and `Not set`; and Mission Area relationship changes remain visible rather than being hidden as administrative fields. Every mapped evidence excerpt displays its source title, publisher, date or undated state, source kind, locator, and canonical link at the point of review. Warnings remain readable, while the complete typed payload is available only in a collapsed technical disclosure. Displaying or accepting a refresh never changes the canonical record.

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
