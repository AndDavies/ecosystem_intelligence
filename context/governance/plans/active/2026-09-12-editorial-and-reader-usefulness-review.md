# Editorial and reader-usefulness review

Status: September 27 release authorized; three-company private enrichment pilot follows verified compatibility; full corpus refresh not authorized
Owner: Andrew Davies
Last reviewed: 2026-09-12

## Purpose

Determine the editorial approach that best helps TNM readers discover capability, understand operational and commercial significance, inspect evidence, contribute useful information, subscribe and return to use the site.

## September 27 authorized release and pilot

Andrew authorized committing and releasing the implemented research/schema/editorial work, then confirmed the exact published pilot targets: `skyx`, `kraken-robotics` and `twenty20-insight`, including their capabilities. Earlier local-only restrictions and alternative pilot suggestions below are dated history, superseded for this release only. Human acceptance and separate Publish remain required; no full-corpus refresh is authorized.

Release order: validate the integrated candidate on Node 24; commit the explicit application/schema and affected instruction paths; apply the additive snapshot migration; push once; verify the exact deployment, pipeline 1.9 and snapshot publication capability before activating new output. The never-applied September 12 snapshot migration was assigned the current ordered version `20260927124955_company_snapshot_observations.sql`; the linked production dry run identified only that pending migration. Retain additive data on application rollback and stop new-standard intake until compatibility returns.

Local release review adds real database round trips for new and refresh snapshots: Review acceptance has no canonical effect, Publish preserves values/qualifiers and every leaf citation, and wrong-entity, unmapped-source and stale-baseline changes roll back. Historical candidates remain supported. The saved-dossier retention test now uses a public-only committed fixture rather than depending on a private local candidate packet. Exact deployment and pilot receipts belong to the private release/run artifacts; the checks above are local evidence until the release finishes.

Local release checks: repository/governance, security (five existing moderate advisories; no high/critical), typecheck, 938 tests, lint (one existing unrelated unused-argument warning), 5,000-marker scale and production build passed. The integrated run exposed one obsolete default-version assertion; its five-test file passed after correction, reusing the other 937 passing results. Inspected the actual saved rich dossier at 390/768/1024/1440px, keyboard-opened reporting/source disclosures, and confirmed source access, visible qualifiers, no broken image/overflow at the desktop breakpoint, COVE's conditional-access panel and Cellula's clean missing-finance/logo fallback. Reused prior PDF rendering evidence because its presentation inputs are unchanged; the current export tests passed in the integrated suite. No test subscription, introduction or content publication was sent.

## Scope

- Review current public examples and the rules, helpers and templates that produce them.
- Compare defence intelligence, technical supplier profiles, investment research and Canadian technology publications using actual accessible examples.
- Assess reader tasks for BD/ecosystem teams, engineers, defence/program users and investors; distinguish existing audience evidence from hypotheses.
- Examine information hierarchy, depth, terminology, financial context, images/diagrams, sources, contribution prompts and subscription paths.
- Identify private-review conventions that should not control public writing. Distinguish private reviewer notes, public executive summaries, full organization/capability profiles, Defence Signals articles and North Signal email.
- Prepare a small set of before/after specimens using the same evidence, including research, schema, rendering and measurement implications.
- Recommend what to retain, change or remove, including executable editorial gates.

## Original queue note (historical; superseded by the local candidate below)

Use the existing September 12 governance audit/reconciliation and simplified PRD as orientation. Inspect the current installed skills and executable helpers when assessing a specific convention. Begin only when this queued task is requested; no live research or specimens were produced by the governance pass.

Current `app/src/lib/research/pipeline-schema.ts` enforces reviewer rationale labels/order and 90–160 words, coverage and other field bounds. The smallest follow-up is to assess each gate, then separately authorize corresponding schema/helper/test and skill edits together. Signals image policy and private/public narrative conventions require the same coordinated assessment. Do not bypass enforcement or change public output in the meantime. A completed comparison or experiment does not adopt its recommendations.

## September 12 implementation review — local candidate

The September 12 request authorizes this candidate, superseding the queued-only instruction above. No release or reader-validation claim is made. The supplied Markdown was reviewed; its referenced HTML was not present at the supplied location, so the existing app is the preview foundation.

### Decisions and evidence

| Observation | Decision for this candidate |
| --- | --- |
| [Kraken's existing TNM profile](https://truenorthmap.ca/organizations/kraken-robotics) already separates technical context, reviewed connections and questions. | Retain this navigation and depth. Add structured observations; do not replace a dossier with a fact card. The saved September 6 packet's **beforeRecord** supplies the writing-only comparison; it is explicitly not the latest public copy. |
| [Kraken's Q2 release](https://www.krakenrobotics.com/news-releases/kraken-robotics-reports-q2-2026-financial-results/) excludes the subsequent Covelya acquisition. | Show period, reporting entity/scope and qualification together. Enhanced financial specimen is newly checked evidence, separate from writing-only changes. |
| [Cellula's Envoy page](https://cellula.com/envoy-auv/) distinguishes battery/fuel-cell tables and also contains differing overview figures. | Attribute specifications, preserve variants and ask for configuration-specific confirmation. Do not combine convenient maxima or describe specifications as trials. |
| [COVE's Stella Maris service](https://covesolutions.com/programs-services/stella-maris-testing-solution/) describes test infrastructure and access. | Organization snapshot and service/access context, without compulsory company-finance slots. |
| [Contrary's Anduril memo](https://research.contrary.com/company/anduril) combines orientation and long analysis; [UST's Cellula profile](https://www.unmannedsystemstechnology.com/company/cellula-robotics/) organizes technical offerings. | Support both scanning and deeper investigation; no evidence that copying either layout improves TNM conversion. |
| [Shephard's accessible Edgewing preview](https://www.shephardmedia.com/news/air-warfare/gcap-industry-partners-officially-launch-joint-company-edgewing/) identifies development, date and image attribution; [BetaKit Cold Front](https://betakit.com/cold-front/) uses a situated Canadian industry narrative. | Lead analytical stories with what changed and why it matters. Do not infer quality of inaccessible material or claim reader outcomes from these examples. |
| [TNM drone edition](https://truenorthmap.ca/signals/canada-drone-competition-domestic-value-and-delivery) and [North Signal landing](https://truenorthmap.ca/north-signal) serve different reading tasks. | Keep the source-rich article and shorter email entry point distinct; preserve existing consent and subscription paths. |

[OpenAI's skills guidance](https://developers.openai.com/codex/skills/) and [Astra prompt guidance](https://developers.openai.com/blog/rethinking-skills-and-prompts-for-gpt-6-astra) support task-specific procedure and progressive disclosure. The coordinator remains singular; no added agent hierarchy or model/configuration override.

Audience assumptions remain hypotheses: BD/ecosystem teams need routes to counterparties; engineers need configurations/interfaces; programme users need maturity and delivery distinctions; investors need scope, financing stage and industrial context. No participants or conversion effects were invented.

### Rule and implementation trace

| Surface | Owning implementation and treatment |
| --- | --- |
| Private rationale | `pipeline-schema.ts::researchCandidateQualityIssues` retains legacy five-label order and 90–160 words, but marked output removes them. Exactly five sentences was a skill instruction, not a sentence-count parser. `researchRecordSpecificityIssues` and `candidate-builder.ts` remove marked-output lexical rationale/operation tests; target, baseline, evidence, temporal and independence checks remain. Canonical repair remains on its separately scoped contract. |
| Public executive synthesis | `organizationBundleV3Schema` / `organizationRefreshBundleV2Schema`: retain nullable 80–1200-character preview and derived evidence; not a full-profile length target. |
| Full profile/capability | Existing 4000-character description and bounded section/payload fields remain; connected narrative is distributed across substantive existing fields, not cut to five sentences. Optional questions remain at most four, with evidence-backed context and no generic missing-field prompts. |
| Signals | `app/src/lib/signals/contract.ts` and `tests/signals-v3-contract.test.ts` already support substantive prose. Existing attribution, event identity and publication controls retained; no image quota added. |
| Email | `.agents/skills/tnm-north-signal/scripts/validate_issue.py`: 700–1100 words becomes an editorial advisory, not readiness failure. Section/source/consent constraints retained. |
| Snapshot | `app/src/lib/atlas/company-snapshot.ts` owns structured shape and formatting. `pipeline-schema.ts` accepts optional organization v3 / refresh v2 observations with exact source binding and ordinary public-leaf evidence. `candidate-builder.ts` carries the marker. No page-request prose parsing. |
| Review / public / export | `app/src/components/atlas/snapshot-review.tsx`, `app/src/app/admin/review/page.tsx`, `refresh-operation-review.tsx`; `company-snapshot.tsx`, `executive-organization-dossier.tsx`; `app/src/lib/export/atlas-pdf.tsx`. Compact map/search/CSV projections do not acquire heavy dossier data. Existing detailed funding-event and financing prose is retained. |
| Compatibility | `deployment-contract.ts::researchCandidateContractIssues` rejects marked output below 1.9 even when required-version input defaults to 1.8. Default pipeline remains 1.8. Dossier loader falls back when the additive column is absent. |
| Media | Existing asset approval, permission, licence and visibility models retained. Optional `editorial_context` records subject/date/context/caption/reuse evidence. Unknown reuse stays private. Malformed new context fails closed. Source, alt text and attribution remain in their existing fields. |
| Logo | Existing global `company-logo-downloader` helper adds public-address/redirect checks, safe inline SVG recovery and SVG sanitization; existing TNM observed-official-page routing remains. Actual Kraken official SVG inspected locally. No logo generation or upload. |
| Sources of instructions | Coordinator quality contract owns the conditional editorial procedure; shared research policy owns evidence; candidate-builder/evidence-mapper/steward route to it. PRD owns reader requirements. Portable additive definition regenerated with `app/scripts/generate-snapshot-schema.ts`; it does not replace Zod refinements. |

### Preview and evidence separation

`http://localhost:3002/dev/editorial-preview` provides saved-evidence wording, newly checked Kraken/Cellula/COVE specimens, analytical-story/email comparison, private Review presentation and explicitly synthetic failure cases. `/dev/dossier-preview` retains the larger synthetic layout fixture. Both routes are development-only/noindex. Preview actions are illustrative existing controls; do not use them to submit, subscribe or modify records.

Source packet: `research/ingestion/candidate-batches-v2/tnm-manual-20260906074301.json`. Local logo provenance and generated PDF: `research/ingestion/local/editorial-preview/`. No new research batch or intake was created.

### September 12 release sequence — superseded by the September 27 split below

1. Obtain separate release authorization. Recheck target migration state and exact deployed contract as part of that release; this task did neither.
2. Keep genuine output on 1.8. Validate the additive `app/supabase/migrations/20260912160000_company_snapshot_observations.sql` against the exact release database baseline; it patches the guarded publishers in place and fails on unexpected function shape. Apply only with separate authorization. Preserve prior columns, candidates, evidence and rollback-compatible app support.
3. Deploy the compatible Review/renderer/publish application. Confirm historical candidate operations, anonymous projection, new-leaf citations and exact stale-baseline rejection. Keep observation production disabled until this succeeds.
4. Advance `currentResearchPipelineVersion` in `pipeline-schema.ts` to 1.9.0 in the separately approved activation release; verify `/api/system/research-contract` reports it, and activate the conditional skill instructions. Do not strip `editorialStandard`, downgrade envelopes or bypass finalizer checks. Rollback stops new-standard intake and preserves additive data, repairing forward.
5. Run the separately authorized small pilot through ordinary research → assembly → guarded database Admin Review. Human acceptance and Publish remain separate; local files are never a substitute for valid completed intake.

Pilot: four bounded subjects (listed company, private SME, centre/programme and one analytical story), with one focused update each. Andrew checks entity/configuration/date attribution and whether the evidence supports the next action. Record factual corrections, lost qualifications, duplicated passages, source-open success and review editing effort. If actual readers participate, ask them to identify the offering, one consequential limit and a useful next step; record failures and time without treating this small sample as conversion proof. Use existing consent-backed aggregate measures for later source opens, saves, contribution and subscription paths; no new analytics service or model self-score.

Remaining questions: reader preference for snapshot density and financial usefulness is unvalidated; parent relationships and ambiguous variant claims require substantive review, not schema inference. No licensed explanatory photograph was newly acquired. The initial pass lacked the disposable HTML reference; the subsequently supplied file was inspected in the presentation correction below. These are pilot/design limits, not permission to weaken evidence or activation gates.


### Local validation receipts

- Full local suite: 859 tests passed; one pre-existing simplification mismatch expected retired AGENTS wording. Updated that assertion to the owning runbook's scheduler-order protection; its 15-test file then passed.
- Added seven snapshot/media cases; focused record-specificity (25), organization public contract (8), export scope (2), organization research contract (10) and full migration-chain/guarded publication (56) tests passed after affected changes. New and refresh snapshot values and leaf citations round-trip locally; existing stale-baseline and historical publication tests remain green.
- Typecheck and lint passed. Eleven-skill validator and governance validator passed; Skill Creator quick validation passed for six affected skills. North Signal's six validator tests passed. Logo SVG script/external-resource/private-address failure cases passed.
- Browser inspection: desktop and 390px viewport, mobile no-overflow observation, keyboard disclosure and source traversal, official logo rendering, sparse non-company state without revenue. Existing private Review component inspected inside the disposable preview; no authenticated production Review visit.
- Generated two-page PDF retained value, scope, date qualification and source URL; private rationale absent. Portable snapshot schema regenerated; no map/search payload expansion. No production migration, intake, publication, campaign, deployment, commit or push.

These receipts establish a local candidate, not hosted migration success, legal image reuse, reader acceptance or a validated real-company research batch.


### Focused presentation and specimen correction — September 12

The supplied HTML is accessible at `/Users/andrewdavies/.codex/attachments/70de478f-b163-46d4-9b55-f0d1dd00a637/pasted-text.txt`. Inspected its actual desktop/mobile layout, with its optional remote photograph left unloaded. This corrects the initial preview; it does not reopen governance or change the release boundary.

**Cause and retained evidence.** `editorial-specimens.ts::specimen` cloned the synthetic organization and explicitly cleared capabilities, profile data and other dossier fields. The enhanced entry replaced operating context with financial commentary. Separately, `executive-organization-dossier.tsx::DossierExecutiveSummary` did not render the saved `portfolioSummary`, and the shared dossier omitted `disclosedFinancingSummary`. The production record was not queried or presumed incomplete.

`app/src/lib/atlas/editorial-kraken-saved.ts` is an explicit public-field projection of the existing September 6 packet (`tnm-manual-20260906074301.json`), applying its organization operations to its baseline. It retains all four capabilities and their saved features/applications, operating and Canadian context, current activity, executive synthesis, financial narrative, official contact paths and two reviewed questions. Nine sources bind to those operations; the packet's additional unused SeaPower source remains in the original evidence packet. Resolved location coordinates, mission matches and relationship records are not present in that packet and are not fabricated. Saved review dates remain historical. No raw candidate, private rationale or provider payload is imported into the page.

The enhanced specimen clones that projection and adds the already-supported quarterly revenue observation and reporting-scope clarification. The writing-only comparison remains separate and unchanged in evidence scope. Sparse Cellula and COVE are explicitly limited specimens; synthetic inherited categories/confidence are cleared. COVE demonstrates the existing conditional-access observation shape with the already inspected Stella Maris service/enquiry source. No finance is invented for either sparse example.

**Shared presentation corrections.** `company-snapshot.tsx` renders a compact, role-aware panel with no repeated organization type or empty slots, visible value/period/scope/qualification and keyboard-accessible provenance. A single observation uses one fact cell; unknown facts do not become placeholders. `executive-organization-dossier.tsx::EditorialHeader` places introduction and snapshot in an 8/4 desktop grid; mobile preserves introduction → snapshot → primary actions. `desktop-design.css` reduces the identity mark's footprint and removes its redundant divider. The shared dossier now renders portfolio/integration prose and commercial/industrial narrative in their appropriate sections. Sources collapse; the lower contact area retains official paths without repeating the primary actions; empty related-content modules are omitted after related-data resolution. Existing subscription, feedback, shortlist, introduction and navigation paths remain.

`atlas-pdf.tsx` retains the same observations, exact values, human-readable observation dates, scope and qualifications. It now includes the previously omitted portfolio and financing narratives and uses continuous full-width narrative flow; long source lists may continue between pages. Private Review's underlying values and mechanical compatibility rules are unchanged.

**Visual evidence and local checks.** Reviewed actual app profiles (rich Kraken, sparse Cellula, non-company COVE) at 1440×1000 and 390×844, normal zoom; inspected the supplied reference at matching widths. Mobile content stays within the viewport. Keyboard Enter opens snapshot provenance and the nine-source library; original source destinations remain accessible. Inspected all four corrected PDF pages and extracted text to confirm revenue, acquisition exclusion, financing and technical qualifications. A regression now compares every saved organization operation and all baseline capability summaries/features/applications with the assembled public specimen, preventing the omission that caused this correction.

Affected local tests: 18 passed across company-snapshot, organization-dossier-public-contract and atlas-export-scope. Typecheck and lint passed; `git diff --check` passed. Updated only obsolete presentation assertions for the inline actions and conditional related module. Reused earlier passing evidence for unchanged pipeline, guarded write, historical candidate and media-approval logic; no full suite, production crawl, live research or provider verification was repeated for this presentation correction.

Preview: `http://localhost:3002/dev/editorial-preview?specimen=enhanced`. Screenshots and the inspected four-page `kraken-corrected.pdf` are under ignored `research/ingestion/local/editorial-preview/`: `enhanced-desktop.png`, `enhanced-desktop-dossier.png`, `enhanced-mobile.png`, `enhanced-mobile-introduction.png`, `private-desktop.png`, `private-mobile.png`, `centre-desktop.png`, `centre-mobile.png` and `reference-desktop.png`.

**Reference differences and limits.** TNM keeps its existing shell, fonts, consent paths and full dossier. The reference's additional listing/annual-revenue tiles are not automatically adopted as reviewed observations. The rich snapshot contains only the supported selected quarterly observation; COVE uses conditional access and Cellula has no empty finance panel. No explanatory photograph has established reuse approval, so these remain clean no-image profiles with the official local Kraken logo or initials. This is a saved-data presentation specimen, not fresh production verification or reader validation. Primary app action links retain their normal destinations; the separately generated PDF above is the corrected local specimen export. Production remains on 1.8; no migration, live intake, publication, configuration, deployment, commit or push occurred.

### September 18 presentation follow-through — local only

The supplied HTML remains accessible at the attachment path above. Compared its actual rendering with the app at 1440×1000 and 390×844, at normal zoom, without loading its optional external photograph. This pass preserves the September 12 changes and unrelated research/governance work; it does not repeat their implementation or claim fresh production verification.

**Assembly trace.** Confirmed `editorial-specimens.ts` now clones `editorial-kraken-saved.ts` for the enhanced profile, rather than using the sparse `specimen()` constructor. The saved September 6 packet, its organization operations, four capability records, portfolio, operating context, Canadian footprint, commercial narrative and reviewed questions remain intact. The saved location row is only a join to a location ID: it contains no resolved place or coordinates. No map/location facts were fabricated to fill the snapshot. The writing-only specimen contains neither the added revenue observation nor its reporting clarification. Sparse company/centre and synthetic examples retain their separate labels. The existing retention regression passed; no new evidence or specimen data was needed for this presentation pass.

**Shared refinements.** `app/src/components/atlas/company-snapshot.tsx` now uses aligned, naturally fitting fact groups, omits empty groups, keeps value/period/reporting scope/material qualification visible, and provides a direct source link beside keyboard-accessible reporting detail. Long provenance and the exact recorded number are supporting detail. Location-only observations fall back to the existing location name when city/province are absent. `app/src/lib/atlas/company-snapshot.ts::formatSnapshotValue` owns readable currency and range formatting, while its default retains exact-format Review presentation; `formatSnapshotDate` supplies the readable date. The public snapshot and `app/src/lib/export/atlas-pdf.tsx` use these shared formatters without changing observations or qualifiers.

`app/src/components/atlas/executive-organization-dossier.tsx::EditorialHeader` keeps the narrower snapshot beside the introduction and fits the primary actions beneath the introduction in that column on desktop. Mobile retains introduction → snapshot → actions. The sources section is reduced to its heading and a collapsed nine-source library; its supporting explanation remains inside the disclosure. Contact links align in one row. Existing substantive prose, conditional related-content behaviour, consent/subscription, contribution, shortlist and navigation paths are preserved.

**Checks actually performed.** The 18 focused tests across company-snapshot, organization-dossier-public-contract and atlas-export-scope passed. Added range/date assertions to the existing formatter case and reran that case successfully. Final typecheck, scoped ESLint and `git diff --check` passed. Inspected rich, sparse-company and non-company profiles at desktop/mobile widths, plus the rich profile at 768 and 1024px; all measured page widths fit their viewport at zoom 1. Enter toggles reporting detail and the source library; Shift+Tab reaches the original source link with its new-tab behaviour. All nine source rows remain in the disclosure. No empty related section or explanatory-image placeholder is rendered. Inspected all four pages of the regenerated PDF and extracted its text to confirm the figure, period, acquisition exclusion, financing and technical qualifications. Unchanged pipeline/historical candidate/privacy/media guards were not subjected to repeated full-suite or live tests. The focused suite's database check uses its isolated local test database, not a production migration.

The preview server was started with Supabase connection settings empty. Optional external browser scripts were subsequently blocked during visual checks; analytics/CAPTCHA integration is not verified by these local checks. An early capture raced hydration and caused a screenshot-tool caret-style mismatch; final captures waited for hydration and did not reproduce it. No authentication, subscription or contribution was submitted.

**Review artifacts.** Working preview: `http://127.0.0.1:3002/dev/editorial-preview?specimen=enhanced`. Fresh images in ignored `output/playwright/`: `editorial-rich-desktop.png`, `editorial-rich-mobile.png`, `editorial-rich-mobile-snapshot.png`, `editorial-rich-desktop-context.png`, `editorial-rich-sources.png`, `editorial-private-desktop.png`, `editorial-private-mobile.png`, `editorial-centre-desktop.png`, `editorial-centre-mobile.png`, and matching `editorial-reference-desktop.png` / `editorial-reference-mobile.png`. Export: `output/pdf/editorial-kraken.pdf` with inspected page images and extracted text beside it.

TNM retains its existing shell and full dossier rather than the reference's abbreviated composition. Only the supported selected quarter appears as a financial fact; no extra numbers were added to fill space. Unapproved explanatory media remains omitted; official-logo recovery and initials fallback are unchanged. The existing local compatibility gate is untouched; production state was not queried. No migration, live intake, publication, deployment, commit or push was performed.

## September 27 research and writing improvements

Andrew authorized implementation of the skill-review recommendations and a saved-evidence assessment before any corpus refresh. This updates the existing implementation; it does not discard dossiers, restart the snapshot design or create a second editorial project. No live research, production queries, intake, acceptance, publication, migration, commit, push or deployment occurred.

### What is implemented locally

- `content/brand/True North Map Brand System.md#tnm-editorial-voice` owns the practical, technically informed TNM voice. Profiles, capability writing, Signals and North Signal inherit it without inheriting private Review formats or invented personal military experience.
- The installed research shared policy explicitly admits attributed specifications, conditions, trial results and reported TRLs; original inspectable technical presentations/interviews can support bounded statements. Independent proof is reserved for assertions that actually need it. Quality owns one substantive writing review; stage skills reference it instead of maintaining separate rationale recipes. Existing mode-specific recovery and truthful coverage controls remain; retained adequate evidence is re-inspected and reused rather than triggering fresh searches of unaffected dimensions.
- `candidate-builder.ts` and `pipeline-schema.ts` allow distinct atomic assertions from one source in a marked narrative leaf, preserving separate excerpts and one-to-one claim lineage. Duplicates, discovery-only support, wrong subjects and stale baselines still fail. Legacy IDs and strict unmarked compatibility remain. The builder no longer appends and silently truncates a redundant field-path suffix in analyst notes.
- The marked prose path excludes legacy label, word-count and lexical-anchor scoring, including mixed modern/historical batches. Generated run/reviewer guidance follows the owning versioned contract. Public prose never inherits the private five-label format. Existing payload/preview bounds remain.
- `deployment-contract.ts` separately gates snapshot writes on `candidateSnapshotPublication: company_snapshot_observations_v1`. A later prose-only 1.9 release does not silently authorize snapshot writes; clearing observations is a write too. The currently advertised local pipeline remains 1.8, with the snapshot capability unadvertised.
- PyYAML 6.0.3 is installed in `~/.codex/venvs/skill-validation`; all seven affected Skill Creator validations pass. The project command-path validator now correctly distinguishes `python3 -m` module invocation from a script pathname.

### Saved research versus unreleased software

The two referenced saved runs are not orphaned drafts: `tnm-manual-20260927100648` (SkyX, one proposed update) has an `intake_verified` receipt at 2026-09-27T10:21:32.870Z; `tnm-manual-20260927110251` (21 updates including CCC) at 2026-09-27T11:28:48.830Z. These receipts prove intake reconciliation at those times, not current acceptance or publication. Preserve their immutable artifacts; do not reimport or bulk rewrite them. Current Admin Review/Publish state was not queried. The older snapshot UI/migration code remains preserved local implementation, separately release-gated.

### Writing assessment

`research/ingestion/local/editorial-preview/2026-09-27-writing-comparison.md` contains before/after SkyX, CCC and Kraken passages, exact saved packet hashes, source links, retained qualifications and a natural private Review-note example. No new evidence is mixed into the comparisons. Mechanism and practical consequence lead; the current entity, availability, contracting and product-stage limits remain. The original passages already contain useful detail, so the observed change is primarily flow, placement and explanation, not additional research. Andrew's preference and actual reader usefulness remain unmeasured. No fabricated usability results or self-score.

### Current release sequence

1. Andrew reviews the saved-evidence writing specimens. Keep existing completed research artifacts and the current supported intake path intact; do not run a corpus refresh.
2. With separate release authorization, release the narrowly scoped prose/evidence fixes and compatible 1.9 support after the required release checks. Verify the exact deployed contract and historical/modern Review paths. Do not bundle unrelated dirty work automatically. Ordinary prose/atomic-evidence support uses existing database shapes and does not need a migration.
3. Activate marked research instructions only after the deployed 1.9 contract is verified. Leave `candidateSnapshotPublication` absent unless the independently reviewed snapshot migration and publication support have also been applied and verified. Announce that capability only in that compatible release; unsupported observation proposals remain blocked.
4. With separate research authorization, run a small ordinary guarded Admin Review pilot spanning a technical supplier, non-company actor and listed company. Measure actual corrections, lost qualifications, redundant passages and Andrew's editing effort. Human acceptance and Publish stay separate. Assess that pilot before deciding on any broader refresh.

### Local validation

Validation results are recorded in the Development Log for this task. These are local code/instruction checks and saved-evidence editorial comparisons, not fresh verification of production behaviour or source claims.

## September 27 persona and formula-check refinement

Andrew supplied separate research and Canadian Defence Signals personas and requested another comparison while preserving the implementation. The existing Brand System voice section now owns both: the curious practitioner/technical generalist for research and a looser editor-observer for Signals. They are voice layers over evidence rules, with no invented personal experience, inside knowledge or automatic criticism. Other surfaces adapt that voice without inheriting private Review's format.

The existing combined writing review now ends with a formula check across sections or stories. The Signals editorial contract owns the edition-level procedure: remove repeated scaffolding and empty importance statements, preserve actual reasoning and qualifications, and do not replace a template with another pattern quota. Useful nullable takeaways remain; an article does not need a manufactured next step. The edition opening can carry shared interpretation. No renderer, schema, source association, publication/image rule or intake authority changed.

Comparison: `research/ingestion/local/editorial-preview/2026-09-27-persona-comparison.md`. It compares the previous improved SkyX, CCC and Kraken passages against the new persona treatment, and the saved September 23 opening plus Greenland, repair-logistics and Cohere stories against revised prose. Original packets and the earlier comparison remain intact. Hashes and source links are included; selected retained primary captures were re-inspected locally. No fresh reporting, live-state claim, intake or publication. Reader preference remains for Andrew to assess.

Limit inspection found that Signals v3 already removes story/source/free-prose quotas and bypasses historical word/paragraph/hedge gates (`app/src/lib/signals/contract.ts`, `editorial-voice.ts`). The renderer already conditionally hides null takeaway fields (`app/src/app/signals/[slug]/signal-editorial-content.tsx`). Its 1 MiB packet cap and bounded metadata/excerpts are delivery constraints. Research retains executable field bounds, including description 4,000 characters, operating context 2,000 and executive synthesis 1,200 (`pipeline-schema.ts`), as well as the gated legacy/modern distinction. These are not editorial quality thresholds. The instructions require retaining complete material and reporting a specific blocker rather than dropping facts to fit. No pressure on a field demonstrated here justifies a speculative schema expansion. North Signal's independent issue structure remains; its word range is advisory.

Checks: three affected Skill Creator validators, installed-project skill/reference validation (11 skills, zero errors/warnings), governance validation, 12 affected local links/anchors, saved-packet hashes and manual proposition/formula review passed. Application source hashes remained unchanged during this pass; prior code-test evidence was reused rather than rerunning the full suite. Release and pilot sequence above remains unchanged. No corpus refresh, production query, external publication, commit or deployment.
