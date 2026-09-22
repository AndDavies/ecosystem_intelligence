# Organization and capability loading performance

Status: server improvements implemented and locally verified; production release authorized September 22; browser improvements remain queued
Owner: Andrew Davies
Evidence reviewed: 2026-09-22; local `main` at `9b2ee59`, including affected uncommitted changes
Outcome: show useful dossier content sooner and reduce the work required per visit, preserving the approved presentation and public evidence/access contracts.

## Decision and scope

Proceed, when approved, with the six recommendations in the supplied September 22 source audit. Implement server loading/data improvements first; tune speculative navigation and browser work afterward. This is a code-grounded prioritization, not a measured ranking of milliseconds saved. No current production benchmark, Core Web Vitals measurement or legacy-profile count was obtained for this review.

Andrew subsequently authorized server implementation, commit, production push and bounded verification. The original planning task produced only this plan. Preserve existing uncommitted governance, editorial/snapshot, schema and research work; do not bundle it into a performance release. The current organization renderer and Supabase reader contain local snapshot changes, so implementation and release must identify their exact dependent hunks rather than staging whole dirty files indiscriminately. Do not require or apply the pending snapshot migration for these optimizations.

Keep the visual design, public record content, exact source associations, capability-specific saves, safe return paths, canonical metadata, successor redirects, authenticated exports, consent and spam controls. No new provider, cache service, database extension, model change, production crawl or research run is needed. Ask/Lexical remains outside scope.

## Verified findings and important qualifications

| Finding | Current owning code | Conclusion |
| --- | --- | --- |
| Capability core waits for three related-content reads before rendering | `app/src/app/capabilities/[slug]/page.tsx`, `CapabilityDossier` | Confirmed critical-path opportunity. Organization related intelligence already streams. |
| Selected capability uses a partially scoped general snapshot reader | `loadAtlasCapabilityBySlugFromSupabase()` and `loadAtlasSnapshotFromSupabase()` in `app/src/lib/atlas/supabase-repository.ts` | Identity/organization/capability scope is narrow, but supporting taxonomy, demand and program reads remain broad. Demand rows enlarge the citation target set. |
| Organization related cards hydrate archives; capability helpers hydrate full matching articles | `app/src/lib/atlas/dossier-related.ts`, `briefs.ts`, `signals.ts` | Replace with explicitly linked summaries, not new ranking logic. Streaming alone does not reduce this work. |
| No slug-specific loading/error components | Both `[slug]/page.tsx` directories; `app/src/app/organizations/loading.tsx` | There is an inherited organization-directory fallback. Improve its dossier transition rather than claiming no fallback exists. |
| Full public-header prefetch versus disabled contextual prefetch | `public-atlas-header.tsx`, `internal-link.tsx` | Align speculative work with deliberate navigation; unrestricted prefetch can increase Vercel/Supabase work. |
| Separate account-status readers | `public-atlas-header.tsx`, `download-link.tsx` | Share client presentation state; leave server authorization authoritative. |
| Inline signup mounts verification before viewport engagement | `north-signal-signup.tsx`, `security/turnstile-field.tsx` | Its observer measures impressions, not verification deferral. `interaction-only` appearance does not defer challenge execution. |

Preserve the existing request-level React cache and publication-invalidated dossier caches with a 24-hour recovery expiry. Correct the stale five-minute route comments as part of the touched route change. Do not increase cache lifetimes, restore a whole-snapshot fallback, repeat the existing lazy organization-map work, or remove `force-dynamic` without addressing request-specific return paths and release probes.

The capability getter also serves `app/src/app/api/export/route.ts`, `app/src/app/sign-in/page.tsx` and `app/src/app/api/landing/route.ts`. A focused reader must preserve their required values and evidence; a page-only success is insufficient.

## Implementation sequence

### 0. Establish a small reproducible baseline

Use the repository runtime (Node 24) and a production-mode local build, with saved public fixtures/mocked data access rather than local pages silently connected to production. Development-mode caching and prefetch behaviour do not represent production. Capture the exact revision/patch, fixture set, cache state, viewport and browser settings.

Cover one activated rich organization, one sparse or non-company organization, one legacy organization, sparse XRC RHINO and richer KATFISH capability fixtures. Include missing/unpublished records and an organization successor. Use the existing dossier fixtures and tests where possible; record any fixture gaps instead of fetching a new corpus.

Record cold and warm direct loads and one contextual client navigation for each route family. Use a small fixed repeat count (three local runs per timing scenario), reporting individual values and medians, not a statistically meaningful p95 from a tiny sample. Capture time to the actual visible title/summary/actions, LCP/CLS, completion of related content, request/row/byte counts and query durations, RSC transfer, account-status calls and third-party work. Distinguish first-byte time, readable-core time and complete response-body time. Existing `app/scripts/validate-cold-dossiers.ts` measures full response consumption and activated organizations; it is not currently an offline visual speed benchmark. Do not invoke its live gate as a development baseline.

### 1. Remove related content from the capability critical path

- Keep published core lookup, missing-record handling and safe return resolution in the route. Render the existing dossier as soon as those succeed.
- Extract its related-record assembly/rendering into a small server component behind `Suspense`, in the current lower-page location. Preserve immediately available parent, taxonomy and reviewed-connection links; isolate only the asynchronous related editorial/similarity work. Avoid duplicate related sections or headings when it resolves.
- Replace full `SignalEdition[]`/`DefenceBrief[]` presentation dependencies with a narrow related-summary contract or a server-rendered slot. Preserve the existing local preview's ability to inject fixture content without database reads.
- Represent supporting reads as success-with-items, success-empty or unavailable. Keep successful subsections when another fails. Catch supporting failures inside the optional section, log concise server diagnostics, and show a quiet unavailable state without implying no relationships exist. Do not cache a transient failure as a successful empty result. Keep existing retry limits; do not add retry loops.
- Add lightweight dossier-specific loading and recoverable error presentation, reusing the shared shell and approved geometry. No fabricated names, evidence badges or counts. Prevent duplicate chrome, abrupt layout changes and raw provider errors.
- Test where the loading boundary commits the response. Preserve existing missing/unpublished and successor semantics, canonical metadata and safe query handling. If an early route fallback would break a required redirect/status contract, retain the identity decision before that boundary and use navigation feedback plus section streaming instead; do not trade correct route handling for a faster skeleton.

Acceptance: with related reads artificially delayed by two seconds, the real dossier and actions are usable before those reads finish; failure affects only supporting content. A core database outage remains distinguishable from a genuinely missing record. No change to approved section order or sources.

### 2. Bound capability reads to displayed relationships and evidence

- Implement a dedicated detail reader in `supabase-repository.ts` behind the existing cached `getAtlasCapabilityBySlug()` interface. First resolve the published capability and parent; then load its published location/logo identity, domain links and approved Mission area/Defence need matches.
- Follow those relation IDs to required taxonomy, needs and sources. Hydrate the capability and connection citation graph only for the relevant targets. Reuse public source/evidence approval checks, bounded ID batching, complete paging and mapping helpers. Parallelize independent branches, not dependent lookups. Do not copy private lineage into the public projection.
- Retain substantive features, applications, maturity/availability qualifications, dates and every applicable evidence association. Preserve all actual consumer requirements rather than returning a fabricated partial `AtlasOrganization` by type assertion. If necessary, introduce an explicit parent-identity type and update the small set of consumers together.
- Preserve publication-driven invalidation for capability, parent identity/logo, taxonomy, connection and source changes, including archive/removal. Version affected cache keys when the representation changes. Keep database errors out of successful negative cache entries.
- Supply up to two published sibling capability summaries through a separate narrow query in the related component. Currently `organization.capabilities` contains only the selected capability, so filtering it for siblings yields none. Do not fetch every sibling's dossier/evidence to recover these links.
- Evaluate the legacy organization branch independently using the baseline fixture. Apply the same scoped relation/evidence approach where useful, while retaining its complete organization content. Do not alter editorial version flags or force legacy records into the new view. A live count is only needed if a later authorized decision depends on its operational prevalence.

Acceptance: multiplying unrelated needs, citations, programs and taxonomy in a local fixture does not enlarge this capability's returned evidence or trigger unfiltered supporting-table downloads. The output's relevant facts/associations match the baseline; private/unapproved records remain excluded. PDF, sign-in context and homepage specimen retain their required content.

### 3. Fetch related summaries rather than full articles

- Add a summary reader in `dossier-related.ts` backed by narrow helpers in `signals.ts` and `briefs.ts`. Accept the organization plus owned capability targets as bounded batches, not one call per capability.
- Resolve explicit valid record links, published items/editions/pages and canonical destinations. Select only displayed IDs, titles, slugs, dates, any displayed summary and matched-item label. Do not hydrate article sections, sources or unrelated items.
- Preserve existing admissibility, publication/time rules, ordering and editorial meaning; add stable ID tie-breaks where needed. Deduplicate editions before taking the final three of each type. Do not apply a display limit before validating relationships or silently turn a batch/page limit into a coverage cutoff.
- Preserve Signals local-preview injection and Briefs compatibility. Keep the cached compact similar-organization index and its ranking unchanged. Similar work remains a discovery path, not a partnership or editorial endorsement.
- Use the existing Signals/Briefs publication tags and appropriate atlas relationship invalidation. Cache only public data and successful results. Remove the broad archive calls only from these related-card paths, leaving archive readers for actual archive consumers.

Acceptance: the same eligible cards and matched-item labels appear, with no full article/source hydration. Adding unrelated editorial records does not increase returned data for the fixed profile. Test duplicate links, multiple ID batches, archived/private targets, empty results and one failed supporting branch.

### 4. Reduce duplicate account reads and make prefetch intentional

- Introduce a small shared client account-status store/hook consumed by the header and download links: one in-flight request, short freshness window, explicit checking/signed-in/signed-out/unavailable states and deduplicated focus/navigation refresh. A network error is not proof of sign-out.
- Keep the action geometry stable while checking; do not momentarily send a known signed-in visitor to sign-in. Refresh on relevant authentication transitions and cross-tab return. Scope this state to the browser session, never the shared server dossier cache. Server export authorization, quotas, no-store response and safe `next` remain unchanged.
- Remove forced full prefetch from expensive public-header destinations and private/account actions. Do not blanket-enable prefetch on `InternalLink`.
- Add opt-in pointer-intent and keyboard-focus prefetch for contextual organization/capability links and the parent identity link. Initially deduplicate by full safe destination, cap speculative detail destinations at two per mounted dossier and skip when data-saving is requested. Preserve `returnTo`; do not prefetch exports, account writes, private workspaces or external URLs. Keep ordinary touch navigation immediate.
- Test this only in the production-mode local build. Compare an idle page, intentional hover/focus and an actual next-page visit. Retain the cap only if useful-navigation latency improves without increased background read volume versus the baseline; otherwise keep the narrowed header policy and disable optional contextual prefetch.

Acceptance: a header plus multiple downloads shares one initial account request; sign-in/out/failure transitions remain truthful and server controls still reject anonymous downloads. Idle pages do not fully prefetch every menu route. Prefetch never renders a PDF or consumes an export quota.

### 5. Defer offscreen subscription verification

Keep the newsletter copy, input and consent flow available. Gate the inline profile widget's mounting/execution on approaching the viewport, with immediate focus/interaction activation and a fallback when intersection observation is unavailable. Preserve accessible status, submission blocking until a valid token, expiration/error/reset handling, server verification and token single-use rules.

Keep this opt-in to the contextual inline placement; do not change sign-in, contact or feedback verification defaults. Keep existing newsletter impression/consent semantics independent of the new preparation trigger. Account for another visible widget already loading the shared script; measure actual script/widget work rather than claiming all third-party requests disappear. Use local test keys or mocks, never real subscriptions during QA.

Acceptance: no profile-inline challenge runs while it remains far offscreen; keyboard, fast-scroll and immediate-submit paths obtain valid verification without losing input or bypassing server checks. Missing/expired/failed tokens still fail safely, and the form does not jump when verification appears.

## Checks and release boundary

Extend existing meaningful tests rather than adding checks that merely match implementation prose: `capability-dossier.test.ts`, `organization-dossier-public-contract.test.ts`, `public-data-access.test.ts`, `public-cache-invalidation.test.ts`, `internal-link-graph.test.ts`, `atlas-export-scope.test.ts`, `export-protection.test.ts`, relevant auth/North Signal tests and `dossier-release-gate.test.ts`. Add narrowly scoped query-scope/streaming tests only where existing coverage cannot exercise the failure. Publication invalidation must include cached not-found results when records become published and stale related cards when content is archived.

Inspect rendered desktop/mobile and intermediate widths (390, 768, 1024, 1440), keyboard use, zoom/reflow, source disclosures/anchors, safe map returns, download handoff and retained dossier content. Use controlled related-read delay/failure, core failure, sparse and rich fixtures. Check one unaffected organization page after shared-component changes. Record meaningful local interaction timing separately from field INP; laboratory results are not real-user Core Web Vitals proof.

Run focused checks while editing, then the integrated application checks required by the current [Cross-System Contract](../../Cross-System%20Change%20And%20Regression%20Contract.md). Before a separately authorized release, run `pnpm release:validate` once for the final candidate and reuse its constituent results. No extra full suites after unchanged success. Use the [Release Runbook](../../Production%20Release%20Runbook.md) for the actual deployment sequence.

After separate release authorization and exact-deployment readiness, perform only the required bounded launch checks. Changes to dossier projection/citation hydration retain the existing cold-dossier gate (including its ten-record sample and view/API budgets); extend its capability coverage without weakening current checks. Compare cold and warm production measurements at matched data/revision/cache states, not repeated cache-bypass crawls. No paid performance service or always-on new telemetry is proposed.

Keep the implementation independently revertible by server/data, client navigation/auth and inline verification changes. A failure of evidence parity, privacy, canonical access or export authorization blocks release regardless of speed. Expected speed/cost gains remain hypotheses until the recorded comparisons demonstrate them.

## Sources and next action

- Supplied September 22 dossier performance audit, checked against the paths above; it was itself a source review, not a production benchmark.
- [Codex Workflow Contract](../../Codex%20Workflow%20Contract.md): scope, preservation, proportionate checks and metered-request boundaries.
- [Next.js 15 loading and streaming](https://nextjs.org/docs/15/app/api-reference/file-conventions/loading): section streaming, inherited loading boundaries and response-status limitations after streaming starts.
- [Next.js 15 Link](https://nextjs.org/docs/15/app/api-reference/components/link): production-only prefetch; `true` fetches full dynamic routes while `false` disables viewport/hover prefetch.
- [Cloudflare Turnstile execution configuration](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/widget-configurations/): challenge execution is separate from widget appearance.

Completed: reviewed attachment, checked current routes/loaders/consumers/shared client components and relevant tests, inspected existing dirty work, and verified framework/provider behaviour in official documentation. No benchmark or tests were run, no production queries were made, and application behaviour is unchanged.

Remaining uncertainties: measured cold-read contribution of each query stage; current live legacy-profile prevalence; actual streamed status/metadata behaviour under the chosen loading boundary; whether intention-based prefetch or verification deferral gives a measurable net benefit. Resolve the first and third locally during implementation; do not query production merely to complete this plan.

Next action: complete the authorized exact-commit production verification. Browser prefetch, shared account state, inline verification deferral and dossier-specific loading/error presentation remain a separate pass; no change to those controls is included in this release.

## September 22 server implementation record

Implemented capability section streaming, scoped supporting-record/evidence reads (also narrowing legacy organization lookups), batched editorial summaries, published sibling links, and independent supporting-content failure states. Kept the existing route-level loading/error boundaries in this server release; their redesign belongs to the remaining presentation pass. Missing-capability handling retains the existing streamed not-found behaviour observed on both production and the local candidate (HTTP 200 with not-found content).

Controlled local expanded fixture: deployed reader 53 queries / 8,818 returned rows; revised reader 16 queries / 14 rows. Adding 1,100 unrelated records does not change the revised result or its read counts. This is a synthetic workload comparison, not a measurement of production database charges.

Production baseline, second sequential request per path: Kraken organization full HTML 465 ms; KATFISH core HTML 196 ms / complete HTML 243 ms; XRC RHINO core/complete HTML 197 ms. The first XRC sample took 885 ms in total, demonstrating cache/network variability. These are two samples per path, not field Web Vitals or p95 evidence.

Local exact-release validation: 912 tests passed and one existing test skipped across the integrated run plus the affected assertion correction; typecheck, lint (one existing warning), scale and production build passed on Node 24. Dependency audit had five moderate findings and no high/critical finding. Reused unchanged passing gate components. Browser inspection covered sparse/rich capabilities and Kraken at 390/768/1024/1440, keyboard source disclosure, capability-specific save handoff, safe return state and missing capability. No overflow, broken images or page errors. KATFISH retained 31 evidence anchors and XRC RHINO 15. The actual HTML stream places core content before the related fallback and completed related content.

Changes were staged independently of existing editorial/snapshot/governance/research work, and the staged release tree was validated in a clean local directory. No schema migration, database write, publication, model/provider change or private research release is included. The final exact deployment identity and bounded before/after production results are reported in the task completion.
