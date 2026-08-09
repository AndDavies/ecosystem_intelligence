# Organization Dossier Template Plan

Status: completed implementation record
Owner: Andrew Davies
Completed: 2026-08-09

## Outcome

The shared organization dossier is implemented as an editorial, business-readable report that supports both sparse and enriched organizations. It preserves the established public journey and activates only for records explicitly published with `organization_editorial_profile_v1`; all other organizations continue to use the legacy profile.

## Locked product decisions

- Paper on Field, dark editorial typography, approved organization identity, and no mandatory hero photograph.
- Working List first, introduction second, quiet website/share/PDF utilities.
- Organization context and a maximum six-fact snapshot before supported current activity.
- Reviewed Mission Area and Public Need relationships with capability, rationale, evidence strength, scoped review date, and a complete-row destination.
- Open capability rows, compact public record and source ledger, practical conversation questions, contextual geography, organization-specific next steps, related intelligence, and then North Signal.
- A non-sticky **On this page** index derived only from rendered chapters: compact left-aligned links on desktop and one native disclosure on mobile.
- Unsupported optional content is absent rather than replaced by placeholders or empty geometry.

## Data and publication contract

- Normalized editorial, participation, relationship, funding and approved-media fields are additive.
- `organization_dossiers` remains a bounded `security_invoker` view.
- Existing one-to-one program summaries and their citations are normalized to participation claims without deleting their original program records.
- `organization_bundle_v3` and `organization_refresh_bundle_v2` require exact public-leaf evidence and the deployed Review/Publish contract.
- `/admin/coverage` derives `published_v1`, `pending_review`, and `research_required` from live organizations and the existing candidate queue; it creates no second enrichment queue.
- Research can stage only; Admin Review acceptance does not publish; the separate Publish transaction controls canonical change and profile activation.
- The migration activates no dossier automatically. Pilot enrichment and activation are separate owner-reviewed content work.

## Validation and rollout

The template was reviewed locally at 390, 768, 1024 and 1440 pixels with keyboard, focus, anchor, overflow, conditional-content and sparse-layout checks. Release uses the pinned Node 24 regression contract, explicit-path staging, exact migration-ledger comparison, ordered production migrations, one `main` push, GitHub/Vercel confirmation, public API and route smoke, and live Supabase advisor and state verification.

## Next safe action

After the foundation is deployed and verified, select the first production pilot through live coverage review. Enrich it with durable sources, stage the typed candidate privately, complete human Admin Review, publish explicitly, and then validate the versioned dossier and PDF before expanding to the richer pilot matrix.
