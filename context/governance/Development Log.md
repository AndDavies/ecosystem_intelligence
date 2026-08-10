# Development Log

Status: chronological implementation record
Owner: Andrew Davies
Last reviewed: 2026-08-10

## August 10 dossier corpus, research-depth, and exact-eight Signals release candidate

Locked the approved editorial organization dossier as the canonical template for
the full 415-organization corpus without introducing a bulk activation. The
owner-reviewed eight-profile pilot is published; the remaining 407 organizations
stay on the bounded legacy profile until each record completes durable research,
private Admin Review, human acceptance, and the separate Publish checkpoint. An
active rollout plan selects a seven-kind representative first wave and then
uses bounded five-to-seven-target batches with one pending review batch at a
time.

Forward-tested the ignored `$tnm-autonomous-research` skill and the raw pilot
artifacts against the skill-creator rubric. The exploratory pipeline 1.8 draft
was deliberately removed after the owner clarified that an eight-item minimum
belongs only to Daily Signals; it introduced unneeded dossier-count machinery
and had unresolved portable-schema and false-positive test cases. Corpus work
advances only to patch release `1.7.1`; the published pilot remains immutable
on `1.7.0`. The retained refinements are exact named-target
preparation, fail-closed live queue checks, target-specific search plans,
selective signal linkage, zero-candidate typed dispositions, and a genuinely
read-only `research:smoke --check-only`. Admin Review shows source identity
beside each mapped excerpt, keeps generated research prose in a collapsed
read-only brief, leaves the human decision rationale blank, and requires a
substantive new rationale before acceptance.

The final 1.7 integrity pass closes the specific review-queue failure modes
without introducing a dossier quota. A ready candidate or
`no_material_change` disposition now requires low or zero marginal search
yield; high or medium yield remains `research_required`. A first dossier
activation must be an explicit reviewed `editorial_profile_version` operation.
Ordinary refresh-batch candidates still require a qualified signal, while a
dossier may link none. Qualified refresh signals require a structured
`eventDate`, `effectiveDate`, or `procurement.closingAt`. Any proposed
`current_activity_as_of` must match a linked signal date or mapped supported
claim date rather than observation or review time. Admin Review labels source
records with no published date as `Undated` instead of leaving the state
ambiguous.

The owner clarified that the minimum of eight belongs to Daily Signals, not
organization research. Dossier readiness therefore has no fixed article or
source quota. Each target is searched through at least three complementary
lanes, all twelve coverage dimensions are dispositioned, consequential claims
use durable independent corroboration where the plan requires it, and the
ledger explains why further plausible searching would not change the reviewer
decision. Sources are selected only when they support a public leaf, specific
warning, or documented coverage conclusion; syndication and unused padding fail.

The separate `daily_signals_packet_v2` contract requires exactly eight distinct
developments and a different primary durable source page for every new item. An
honestly computed source-family count, all existing editorial, evidence, image,
social-draft, duplicate-event and 30-day gates, and `no_publish` below eight
remain mandatory. Historical six- or seven-item v1 packets stay parseable only
for an existing run-ID idempotent check, social-draft repair, or approved hero
repair. The 06:30 automation was paused in this local pass because its v1 prompt
conflicted with the newly installed v2 skill and publisher. After compatible
application deployment and writer verification, update its prompt to v2 and
reactivate it in the same release closure.

Added the deterministic no-padding outcome as a separate
`daily_signals_no_publish_v1` input. Its idempotent apply writes only one private
`signal_runs.status = no_publish` audit row with the inspected/qualified counts,
blocking gates, rationale and payload hash; it creates no edition, item, source,
image, link or social row. Historical v1 and hero-repair dry-runs now require a
read-only existing-edition lookup and exact slug/date match before they report
success. Hero replacement also proves its source page is already attached to
the stored edition before any repair write.

Closed the four open Dependabot findings with patch-only workspace overrides:
PostCSS 8.5.23 and Hono 4.12.34. The lockfile changes only those two resolved
versions, the hardening contract asserts both pins, the development shadcn CLI
still loads, and the complete low-threshold pnpm audit now reports no known
vulnerabilities. The Hono patch also clears the separate CORS ReDoS advisory
reported by the local audit but not listed as a fifth GitHub repository alert.

Traced the broken YMX geography artwork to the deployed MapTiler key rather
than organization data or the selected-map link. All eight activated dossiers
used the same Static API image path and reproduced the Next Image 502 after an
upstream invalid-key 403; the ordinary `/map?selected=` link remained correct.
The dossier now lazy-loads the shared renderer on an explicit OpenStreetMap
base, while the interactive atlas preflights the MapTiler style and falls back
to OpenStreetMap on provider rejection or network failure. The text-only branch
for missing or unverified coordinates is unchanged. Focused provider tests and
browser checks cover YMX, a second activated dossier, the legacy route, and a
deliberately invalid MapTiler key without exposing provider credentials.

The first production browser pass confirmed healthy OpenStreetMap rendering,
selection links and responsive layout, then found two lifecycle-specific ARIA
defects: the unloaded placeholder carried a label without a role, and the
loaded fixed map used an image role around focusable attribution controls. The
placeholder is now a labelled image and every rendered map is a labelled
region, preserving attribution access without nesting interactive content in an
image semantic. Focused contract tests cover both states; production
re-verification follows this corrective deployment.

Pinned Node 24 release-candidate validation passed 58 test files / 352 tests,
lint, TypeScript, research validation over 429 artifacts with zero errors,
governance validation, the 5,000-marker scale gate and the 35-page production
build. The read-only pilot smoke checked seven canonical artifacts with zero
errors and 17 expected historical amber/shared warnings while leaving every
canonical, review and staging-file hash unchanged. Daily Signals v2 and typed
no-publish dry-runs passed without an apply. After the patch-only PostCSS and
Hono repair, the complete low-threshold dependency audit reports no known
vulnerabilities. GitHub Release Validation and CodeQL passed for the deployed
release, and Dependabot marked the original four findings plus the separately
ingested Hono CORS advisory fixed. The corrective ARIA deployment remains the
only pending production verification in this entry.

No new research candidate was staged, accepted, published, or activated; no
Signals edition, social post, campaign, migration, or provider-content write
occurred. The patched application was committed, pushed and deployed; the only
other external control-plane mutation was the fail-safe pause of the Daily
Signals automation recorded above.

## August 10 record-specific research and Admin Review repair

Traced the generic eight-organization dossier review packet to two independent
defects. The private pilot builder reused name-substitution templates for fit,
signal, lead, operation, claim, recovery and rationale text, while the tracked
pipeline validated length and shape without requiring those private reviewer
fields to be anchored to the record. The Admin Review page then compounded the
problem by presenting duplicated rationale and counting a scalar date as zero
reviewed fields.

Advanced new research runs to `tnm-research-pipeline/1.7.0`. A complete same-run
gate now joins the collection plan, prospects, signals, leads, claim ledger,
candidate batch and run by exact target key. It requires record-specific
capability, event, field, source, warning and decision anchors; exact structured
candidate or disposition coverage; factual claim predicates; resolvable recovery
attempts; bounded source-count language; and visible changed or unchanged
Mission/Public Need reasoning. It also binds every source-backed leaf to one
eligible atomic claim, every claim and candidate to one real coverage subject,
and every refresh lead and signal to the same canonical target, baseline and
typed outcome. Trusted import re-reads the completed canonical artifacts,
reruns those gates and deep-compares every private staging payload with the
validated candidate batch before calling the existing guarded RPC. Historical
1.5 and 1.6 lineage remains immutable under its recorded version.

Regenerated `tnm-dossier-pilot-20260809` deterministically at frozen timestamp
`2026-08-10T08:14:18.000Z`. The candidate batch hash is
`3522fe27e956b0e1294b4cd53013b8dd8993685a687c180f3c273ca3ebcd4509`;
it contains eight exact targets, 39 durable sources and 65 atomic ledger claims.
Two consecutive builds produced identical hashes and complete file-only smoke
created the private review and staging artifacts. The initial intake was followed
by four guarded same-ID corrective restages as the review text and trusted-import
contract were adversarially audited: five staging events in total. The final
frozen export was generated at `2026-08-10T09:47:10.618Z`, has SHA-256
`ed6c7d99a4b5938052d3e9831ee7ef854df12cc3ad7941727bd001ecb473b973`,
and its pending-only import returned eight staged and zero skipped at
`2026-08-10T09:47:26.262798Z`. Post-stage reconciliation found
the same eight database row IDs, exact proposed-record/evidence/rationale parity,
all eight baselines still equal to production, all rows still pending, zero
review decisions and zero editorial-profile activations. No canonical
organization, child record or public route changed.

The Admin Review operation renderer is now a shared tested component. It renders
each scalar or date change once, expands contact objects and reviewed-question
arrays into readable labelled values, makes clear-to-null explicit, and keeps
capability Mission Area changes visible. Review shows one generated candidate
rationale and one separate editable `Reviewer decision rationale`; it no longer
repeats the generated text or reports a date change as `0 fields reviewed`. A
development-only, noindex preview covers scalar, date, object, array, null and
relationship changes and remains unavailable in production.

The installed ignored research skills were aligned to the 1.7 executable gate
and remain outside Git. This work used the existing private staging authority
only. It applied no migration and performed no acceptance, publication,
campaign, profile activation or canonical-parent write.

Release-grade validation used the pinned Node 24 runtime. The final gate passed
57 test files and 333 tests, ESLint, TypeScript through the production build,
repository/governance hygiene, the complete dependency audit with no high
finding, the 5,000-marker scale contract and 35-page Next.js build. Research
validation checked 429 artifacts with zero errors; the focused seven-artifact
file-only smoke reported zero errors and 17 expected amber/shared warnings.
Admin preview checks at 390, 768, 1024 and 1440 pixels found no overflow,
coerced object text, duplicate changes or accessibility blocker. The first
production atlas prewarm encountered one terminated upstream read; health and
summary stayed available, direct reads recovered, PostgreSQL showed no matching
timeout and the immediate 869-page paced rerun completed with zero findings or
recovered warnings.

Commit `7fbcc9f` deployed as Vercel production deployment
`dpl_FF778tjCMGeMbcsDa7GaVZFGErSA` with `truenorthmap.ca` attached and no alias
error. GitHub Release Validation and CodeQL completed successfully with zero
annotations. The deployed contract advertises the exact commit and
`tnm-review-publication-v3`; health and the 415-organization, 379-capability,
1,219-source catalogue reconciled. Authenticated Admin Review showed eight
refresh candidates, 56 readable proposed-change groups and one decision
rationale per candidate at 1440 and 390 pixels with no overflow, stale copy,
object coercion or console error. The final paced production crawl checked 870
pages with zero findings or recovered warnings; Vercel and PostgreSQL recorded
no post-readiness 5xx, runtime error, warning, fatal event or statement timeout.
The Supabase API-log connector was unavailable during the final bounded sample.
Production still held eight pending candidates with eight matching baselines
and zero review decisions, publications or profile activations. No migration,
acceptance, publication, campaign or canonical-parent write was part of the
application release.

## August 9 version-gated organization dossier release

Implemented the owner-approved shared organization dossier as a version-gated
editorial report rather than a fleet-wide visual switch. Versioned profiles use
a Paper-on-Field identity hero, approved-logo/monogram/neutral mark, compact
Working List and introduction actions, a restrained rendered-section contents
index, operating context and facts, supported current activity, actionable
Mission Area and Public Need relationships, bounded capability rows, public
record, conversation questions, geography, compact sources, organization-specific
next steps and related intelligence. Sparse records omit missing
chapters and unversioned organizations retain the legacy route.

Added the normalized dossier data and publication foundation: cited current
activity and as-of date, operating and Canadian-footprint fields, reviewed
questions, organization-specific program participation detail, approved media
placement, relationships, bounded profile-engagement analytics, a
`security_invoker` dossier view, audited canonical editors, PDF/social metadata,
an owner-only live narrative-coverage view derived from organizations and the
existing candidate queue, and version-specific Review and Publish support. The initial one-to-one program
corpus copies its existing summary and corresponding citation into the
participation record without deleting the canonical program claim. No
organization receives `organization_editorial_profile_v1` automatically.

The tracked research contract advances to `tnm-research-pipeline/1.6.0` and the
application Review/Publish boundary to `tnm-review-publication-v3`. It validates
`organization_bundle_v3` and `organization_refresh_bundle_v2` with type-specific profile allowlists,
per-leaf evidence, stable child updates, exact stale-baseline checks and no
automated delete path. The importer still requires the deployed research
contract before staging; Review acceptance remains private and Publish remains
a separate human action. A deterministic, production-disabled dossier preview
is retained as shared local regression infrastructure and returns not-found
outside development.

The final publication-safety pass rebuilt the public field-citation policy so
approved citations on published canonical programs are available to anonymous
and member dossier readers while private evidence and unpublished parents stay
hidden. Refresh v2 now validates complete child `before` snapshots, locks the
organization before the child, compares the locked live child before any
update, and resets evidence routing for each leaf. Direct owner child
corrections use the same lock order and advance the organization timestamp.
The isolated database contract exercises anonymous/member/admin visibility,
stale-child rejection, parent-baseline advancement, and Mission-first then
capability-second evidence ordering. All new stale and canonical-conflict paths
use non-retryable review-state SQLSTATEs, preserving the earlier reliability
repair instead of reintroducing database transaction retries.

The final design lock removed viewport-distributed spacing from the desktop
contents index. Links use a compact left-aligned 16-pixel rhythm at 1024 pixels
and 24 pixels on wider desktop frames, remain one line, and retain the mobile
disclosure, active anchor, focus and target-offset behavior. The release follows
the Node 24 regression, explicit-path staging, ordered migration, GitHub/Vercel,
public-route, advisor and live-state gates in the production runbook. Canonical
content enrichment and the first profile activation remain the next separate
review-and-publication workflow.

Release preflight also reconciled the registry and mechanical operator check to
the already-paused weekly visibility automation. The visibility skill remains
available for manual invocation; no schedule, provider, or campaign setting was
changed in this release.

Production Supabase now records the ordered dossier migrations as
`20260809222847 organization_dossier_v3` and `20260809222938
research_organization_v3_publication`. Post-migration reconciliation found 415
dossier rows, 177 cited normalized current-activity values, 122 one-to-one
participation summaries, 2,754 citations, zero uncited normalized summaries,
zero active candidates, and zero activated editorial profiles. Anonymous reads
returned all 415 dossiers plus the expected 127 canonical program and 127
participation citations. The view remains `security_invoker`, public-role access
is denied, versioned publishers remain authenticated and invoker-mode, and no
candidate, review decision, profile activation, or enrichment publication was
created by the migration.

## August 9 organization dossier read-path hotfix

The first low-rate production crawl after application commit `aa6dc34` found
that null-version legacy organization routes still entered the correlated
`organization_dossiers` projection before the application checked the
editorial profile version. Public pages remained available through the bounded
retry and legacy cache path, but Supabase recorded REST 500 responses and
statement-timeout cancellations. Release closure and dossier enrichment were
stopped; no organization was activated and no candidate was staged or
published.

The scoped repair moves the exact version decision into the shared organization
loader. It reads only the published organization identity and
`editorial_profile_version` first, uses the rich dossier view only for exact
`organization_editorial_profile_v1` records, restores the bounded legacy table
loader for every unversioned record, and advances the record-cache key so the
new dispatch takes effect immediately. The schema, normalized data, route
order, template, evidence, Review and Publish authority remain unchanged. The
repair is deployed as commit `8a29b13` / Vercel deployment
`dpl_4Phqy6Y3Li3EHMeRAHnyzvnUX19B`. Node 24 release validation passed 305
tests, lint, type/build, dependency and 5,000-marker gates; all 11 previously
affected profiles returned the expected public page; and the paced production
crawl completed 869 pages with zero findings, recovered warnings or duplicate
titles. Vercel recorded no hotfix-deployment 5xx or runtime error, PostgreSQL
recorded no post-hotfix statement timeout, and the catalogue remained 415
organizations, 379 capabilities and 1,219 sources with zero activated profiles
and zero pending or approved candidates. The Supabase API-log connector was
temporarily unavailable during closure, so Postgres and deployment logs are the
recorded error evidence; no application, database, content, candidate or
provider write was used to compensate for that tooling exception.

## August 8 Codex control-plane simplification

Reconciled two completed, already-published research run families as immutable
tracked lineage after research validation and credential-boundary checks.
Established one governance index and one complete system registry, reduced the
root agent contract to a concise source-of-truth map, made internal research
stages explicit-only while preserving four operator-facing workflows, and
added mechanical governance and local operator-policy validation. The main
checkout remains the integration and credentialed-operator workspace;
temporary worktrees are local-only tools for explicitly concurrent writers.
No public route, Supabase object, production record, provider configuration,
schedule, editorial authority, consent, or authentication behaviour changed.

The complete release gate then stopped before push on newly disclosed
high-severity advisories in transitive `js-yaml` 4.3.0 and `nanoid` 3.3.16.
The workspace now pins patched versions 4.3.1 and 3.3.17 through the existing
override contract. This is a dependency-only security repair with no public
application, provider, database, editorial, research, or schedule change.

## August 6 autonomous-research quality and lineage closeout

Reduced the local research coordinator to its required operating sequence and
moved detail into focused references. New pipeline `1.5.0` runs now fail smoke
validation when claim lineage targets generic or compound fields, lifecycle
timestamps do not show elapsed work, refresh runs omit their signal batch, or a
candidate lacks the concise five-part decision rationale and record-specific
warnings needed by Admin Review. Shared trust caveats remain once at packet
level. Repository validation is summary-first; `--verbose true` retains full
historical diagnostics. These checks change no candidate schema, Supabase
authority, taxonomy, or publication boundary.

Reconciled the 120 previously untracked files belonging to twelve complete
August 5-6 run families. `pnpm research:validate` reported 402 artifacts, zero
errors, and historical/advisory warnings only. Read-only production checks
confirmed every corresponding `research_runs` row completed, all 86 associated
candidate rows published, and zero candidates pending globally. The complete
ten-artifact family for each run was retained as immutable research lineage.
No research run, review decision, canonical-record write, or publication was
performed during reconciliation.

## August 5 research smoke preflight repair

Repaired a false-negative in the review-intake smoke path. The deployed
Review and Publish compatibility check had inherited `NEXT_PUBLIC_SITE_URL`,
which correctly points to localhost during development; when that dev server
was not running, a fully valid research run stopped before intake. The check
now targets the canonical production research contract independently of local
browser configuration, while explicit test overrides and the existing
fail-closed response to an unavailable or incompatible deployed contract remain
unchanged. No candidate, canonical record, review decision, publication,
migration, provider, or research artifact was changed by this repair.

## August 5 production-first project reconciliation

Reconciled the tracked repository, production Supabase state, local operator
systems, and active governance around the production soft-beta application.
Two complete research runs are retained as validated immutable lineage because
their candidates already passed human review and publication; they are not
pending database changes. Reusable visibility tooling is retained while raw
provider data and credentials remain ignored. The former autonomous broad
research schedule was deleted and broad research is now manual; the separate
refresh schedule remains paused.

Daily Signals now enforces current-edition LinkedIn and X examples as part of
its validated publication packet and repairs missing rows idempotently without
posting externally. The owner workspace now has a conventional edition index
at `/admin/signals` and edition editor at `/admin/signals/[id]/edit`, including
copy correction, sources, hero provenance, atlas links, and view-and-copy-only
social examples. No core-corpus or publication authority changed.

Removed obsolete tracked launch packets, lookbooks, dated audits, and beta-plan
exports. Runtime brand and video assets remain in `app/public/`, canonical brand
sources remain in `content/brand/`, and a repository hygiene gate prevents
generated collateral from silently returning. Screenshots, reports, decks, and
campaign packets are now created only on explicit request and locally by
default. The pnpm override and ESLint plugin declarations were moved into the
workspace-native configuration so clean installs and release validation remain
reproducible.

## August 5 global-refinement Phase 6 system states, SEO, and reconciliation

Aligned shared loading, empty, error, and not-found language with the approved
public copy library. Loading shells preserve route geometry, shared empty states
use a borderless tonal surface, the global error gives retry and Map recovery,
and the 404 provides Map and homepage actions while remaining `noindex`.
Supporting public routes now use Home breadcrumbs and current page-specific
Open Graph and Twitter metadata where it was missing. Canonicals, sitemap
membership, public/private indexing, authentication, analytics, Supabase,
research, review, publication, and provider contracts are unchanged.

The active governance set was reviewed in place. No duplicate operating
contract remained that warranted deletion; historical material remains under
the non-operating archive. Scoped tests and lint passed, and signed-out browser
checks at 390, 768, 1024, and 1440 pixels confirmed one H1, Home breadcrumbs,
usable recovery actions, and no horizontal overflow.

## August 5 Daily Signals and Morning Brief contract alignment

Aligned the ignored Daily Signals skill, executable packet contract, and local
automation to 06:30 America/Halifax. Daily Signals now requires six to eight
distinct source-supported items; six is the floor, and seven or eight are
preferred when they independently clear the gates. The scheduled automation
uses a normalized daily 06:30 RRULE and preserves the existing isolated
publication boundary.

Formalized Morning Brief `related_links` as a compact list of canonical,
source-resolved articles that clear the executive relevance gate but do not
earn a full anchor or Radar entry. The existing validator, PDF renderer,
Markdown archive, and 04:00 scheduled prompt now carry that distinction.

## August 5 global-refinement Phase 5 landing, trust, and supporting journeys

Aligned the guided entrance and supporting public journeys around what a
visitor can do next. About now leads with **The capability was here. The shared
picture was not.** and uses the canonical founder wording. How It Works moves
from a question through relevant capability, public evidence, comparison and a
private Working List into a practical conversation. Methodology remains the
detailed evidence and governance reference and now ends with one direct path to
inspect a published profile. Contribution copy uses the approved **Know
something missing? Improve the public record.** promise.

The landing structure and hero remain unchanged. Its five-minute public cache,
client-hydrated authentication, deterministic guided example, North Signal
consent and MailerLite delivery, private-route access, public APIs, Supabase,
analytics, research, review, and publication contracts are unchanged. Scoped
copy and journey tests passed with the complete application suite. Signed-out
browser checks covered the landing, About, How It Works, Methodology, Contact,
sign-in, and private-route sign-in boundaries at 390, 768, 1024, and 1440
pixels with one H1 and no horizontal overflow.

## August 5 global-refinement Phase 4 editorial collections and articles

Aligned Canadian Defence Signals and Defence Briefs as complementary editorial
paths without changing their content or operating contracts. Signals now uses
one concise, decision-useful archive summary, labels its latest publication as
an edition, and offers a restrained path to deeper Defence Brief context.
Defence Briefs now uses the same wide editorial hierarchy, rounded borderless
tonal surfaces, source-linked language, and existing Mission Area and record
continuations.

The change is presentation-only. Published article bodies, sourced imagery,
generated anchors, metadata contracts, Signals automation, editorial skills,
Supabase, MailerLite, analytics, research, review, and publication authority
remain unchanged. Scoped editorial tests joined the complete application suite;
responsive signed-out checks covered both collections and representative
articles at 390, 768, 1024, and 1440 pixels with one H1 and no horizontal
overflow.

## August 4 global-refinement Phase 3 profiles and decision handoffs

Recomposed organization, capability, Mission Area, regional, and individual
Public Need pages around the decision a visitor can carry forward. Organization
and capability dossiers now use **What supports this profile** and **What
remains unknown** at the point of use instead of placing a complete evidence
legend before the record. Public Need pages lead with the released problem and
desired outcome, retain the procurement and endorsement boundary after the
record, and label their source panel **What supports this public need**.

Every affected detail route now ends in a contextual continuation to the live
map, related released needs, a correction path, or private Working Lists. The
Working List promise is standardized as saving organizations, capabilities and
evidence for the conversation ahead. Legacy Mission Area and regional links
that still sent filters to the landing route now target the canonical `/map`
workspace. Existing map-return parameters, authentication returns, evidence
links, sharing, exports, introductions, contributions, relationships, and
publication authority remain unchanged.

Scoped contract tests and the complete 267-test suite passed, as did lint and
the read-only 304-artifact research validation with zero errors. Signed-out
browser checks covered representative organization, capability, Mission Area,
regional, Public Need, and private-list sign-in boundaries at 390, 768, 1024,
and 1440 pixels with one H1 and no horizontal overflow.

## August 4 global-refinement Phase 2 functional discovery collections

Refined Map, Organizations, Regions, Mission Areas, and Public Needs as one
consistent set of task-led discovery collections. Each route now states the
question it helps answer, puts live records before methodology, uses precise
count labels, makes summary cards keyboard-safe whole-card destinations, and
ends with one practical continuation into the map, organizations, released
needs, regions, or Working Lists. Public Needs now keeps its procurement and
endorsement boundary in a compact after-content disclosure instead of placing
two explanatory blocks before the records.

The change is presentation-only. Complete national marker coverage, map/list
synchronization, filters, pagination, URL and return state, Ask True North,
exports, authentication hydration, public APIs, Supabase, research, review,
and publication authority are unchanged. Responsive browser checks at 390,
768, 1024, and 1440 pixels covered all five collection routes with one H1 and
no horizontal overflow.

## August 4 global-refinement Phase 1 language and trust foundation

Established one shared public-language and orientation foundation before the
route-specific refinement phases. The public presentation dictionary now keeps
the internal **Coverage gap** concept separate from the reader-facing **What
remains unknown** heading, while Source-backed fact, Our assessment, Evidence
strength, and Last reviewed remain canonical across public surfaces.

Repeated five-part evidence legends on collection and dossier routes now
collapse into one keyboard- and touch-accessible **How these records are
assessed** disclosure. Complete trust explanations remain available through
How It Works and Methodology, while the footer returns to the restrained
independence line instead of repeating a promotional trust claim. Shared public
breadcrumbs replace generic Back to map links, Inter remains the public
interface face, and common card, control, and loading geometry now uses the
same 18-pixel and 12-pixel tokens. The change does not alter route state, public
APIs, cached data, authentication hydration, analytics events, Supabase,
research, review, or publication authority.

Local validation used Node 24. Four added copy-contract tests joined the full
261-test suite, lint passed, the optimized production build completed, and the
read-only research validator reported zero errors across 304 artifacts. Browser
checks at 390, 768, 1024, and 1440 pixels confirmed correct breadcrumbs,
keyboard disclosure operation, Inter typography, footer language, and no
horizontal overflow. A local production crawl checked 842 canonical pages with
zero findings or recovered failures.

## August 4 global-refinement Phase 0 worktree reconciliation

Reconciled the pre-existing operational, visibility, research-lineage, logo,
Source Book, and lookbook work before beginning the approval-gated public UX
programme. No public route, Supabase schema or data, API, authentication flow,
research authority, review decision, publication state, provider setting,
campaign, or analytics event changed.

- Retained as explicit commit packages: current Daily Signals and MailerLite
  governance; reusable private visibility tooling and sanitized fixtures;
  portable candidate-logo preparation tooling; validated public-source research
  lineage and its run-support scripts; versioned Source Book and North Signal
  source registries; and the editable project lookbook source.
- Kept ignored and local: project-local skill implementations, provider
  credentials and responses, visibility reports and dashboard material,
  automation configuration, raw logo images, and 26 private candidate-logo
  provenance summaries. The logo tooling now writes those summaries only under
  `research/ingestion/local/` and resolves its downloader from an explicit
  environment override or the current user's local Codex skill directory rather
  than a hardcoded workstation path.
- Deferred from this reconciliation: reuse or distribution of the July 28
  lookbook. Its source remains a clearly labelled dated snapshot and must be
  refreshed from production before becoming current launch collateral. Nothing
  was rejected or deleted.
- Read-only production reconciliation matched every named current research run
  to a completed live run and terminal candidate state. The current untracked
  batches contained no pending or approved candidate left outside the ordinary
  Admin Review and Publish workflows; one July 29 refresh candidate was already
  rejected and the remaining reconciled candidates were published. No staging,
  approval, publication, or database write was performed.

Validation used Node 24.14.0. The private visibility contract and the complete
304-artifact research corpus validated with zero errors; warnings were retained
as explicit historical or reviewer cautions. Forty-seven test files and 257
tests passed, lint passed, and the optimized Next.js 15.5.22 production build
completed. The live launch validator checked 842 canonical pages with zero
findings, zero recovered failures and no duplicate titles; 220 orphan candidates
remain an intentional Phase 6 internal-linking input. The 5,000-marker scale gate
kept every marker, bounded rich cards to 18, and remained inside projection,
clustering, and serialized-payload budgets. The active local Daily Signals
automation remains scheduled for 06:30 America/Halifax with its existing source,
image, credential, idempotency, and isolated publication gates. MailerLite was
not mutated; its tracked future-entry welcome contract and four integration
tests remain green.

## August 4 Organizations and Mission Areas surface reconciliation

Aligned the public Organizations collection, organization dossiers, and Mission
Areas collection with the approved Signals-era tonal surface contract. The
Organizations route now moves directly from a compact task-led introduction and
live summary into the full paginated directory, displays an approved official
logo or neutral placeholder on each visible card, separates taxonomy pills,
and removes the redundant evidence-strength badge and Recently Reviewed block.
Logo hydration is bounded to the visible directory page and does not expand the
national marker/search projection, exports, or dossier reads.

Organization dossiers now use the shared rounded borderless editorial panels
and contextual tonal sections while preserving every published capability,
source, assessment, gap, match, contact path, Working List action, correction
path, metadata field, and structured-data relationship. The repeated full-width
reading legend was removed because the same distinctions remain visible where
they apply.

The Missions collection now uses the same compact collection-header rhythm,
brings the operational-outcome choices forward, and states once that Mission
Areas are discovery lenses rather than released requirements. The repeated
reading legend and separate warning band were removed. Mission detail routes,
taxonomy, reviewed relationships, public-data contracts, research, review, and
publication authority were not changed.

The exact staged release candidate passed `pnpm release:validate` under Node 24:
the high-severity dependency gate, 45 test files and 243 tests, lint, the complete
5,000-marker scale and clustering budget, and a clean production build. Signed-
out browser review at 390, 768, 1024, and 1440 pixels covered the Organizations
collection, Kraken Robotics dossier, and Missions collection with no horizontal
overflow; approved logos, neutral fallbacks, tag wrapping, and the compact
collection hierarchy rendered as intended.

## August 3 Canadian Defence Signals editorial experience

Rebuilt the reusable `/signals/[slug]` presentation as a wide executive briefing without changing the autonomous content contract, source data, publication workflow, newsletter workflow, or core atlas. Each edition now uses a split editorial masthead, generated Bottom Line and table of contents, accessible anchored navigation, consistent article-entry cards, original-source actions, direct LinkedIn and X sharing, contextual continuation, related editions, North Signal signup, and a quiet full-width editorial note at the end. Existing and future source images render through the same normalized edition and item-image fields when available.

Reconciled the Signals archive and article route with the shared public style contract. Added Editorial Blue `#E8F1F4` and its interaction shade `#DCEBED`; assigned bounded tonal roles to environment, activity, and technology tags; removed decorative yellow and grey card outlines; retained a quiet one-pixel edge only for taxonomy pills and pill-shaped links; standardized 18-pixel editorial rounding; and replaced moving hover treatments with stationary shadow, tone, and link-colour responses. The active brand system now makes this the reference for later route-by-route visual alignment rather than silently changing every public route in one release.

## August 3 Canadian Defence Signals image gate

Made cited editorial imagery a required part of every repeatable Daily Signals run. The project-local skill now extracts publisher-declared images from the cited article set, reports all admissible candidates for visual comparison, rejects generic publisher share backgrounds, logos, unrelated stock and undersized assets, and records the selected image URL, cited source page, factual alt text and publisher attribution. The executable packet schema rejects image-less editions, while the publisher always normalizes the source asset to a 1600 x 900 WebP under `brief-images/signals/` before the edition can publish.

Added a narrow, idempotent `--replace-hero` repair path for published editions that predate the image gate. Five July 29 to August 2 backfill editions passed the schema, editorial and image checks and were amended with sourced bucket images; the August 3 edition's existing cited Kraken image was also migrated from an application-local path into the same normalized bucket contract. All six slugs, text, items, original sources, atlas links, publication status and publication dates were unchanged. The active 06:30 Atlantic automation now enforces and verifies the same source, relevance, normalization and no-image-no-publish contract. The core atlas, research queues, review authority, MailerLite and social platforms were not modified.

## August 3 Canadian Defence Signals foundation

Implemented an isolated daily Signals publishing system without changing the canonical research or atlas publication authority. It includes descriptive immutable `/signals/[slug]` URLs, a public archive, source-fact versus automated-read separation, unknowns, next steps, evidence strength, original source links, existing-record navigation, Article and ItemList metadata, sitemap discovery, an administrator correction/archive route, private run health and social drafts, and an idempotent publisher.

The ignored `tnm-daily-signals` skill requires six to eight distinct developments from at least three source families, resolves discovery feeds to durable sources, rejects unsupported repeats, accepts no-publish days, and enforces an executive field-guide narrative before dry-run or publication. Weekly North Signal remains human-reviewed and manually sent. The complete Node 24 release gate passed with 256 tests, lint, dependency audit, 5,000-marker scale validation, and the production build. The schema and follow-up foreign-key indexes are reconciled to the live migration ledger, the first approved edition is published, and the application is deployed. No schedule, social post, MailerLite send, or core-corpus write occurred.

Status: soft-beta project reconciliation and current-state audit

## Scope

This review reconciled the live True North Map product, tracked repository, active local operator systems, brand and launch assets, production database posture, security register, SEO/AEO validation, and next product priorities. It changed governance and memory only. It did not change application code, production data, Supabase configuration, provider configuration, review decisions, publication state, or campaigns.

## August 2 map-first workspace release

The approved focused recomposition keeps `/` as the guided service entrance and
`/map` as the canonical atlas workspace while making the product itself visible
sooner. The real published Kraken Robotics and KATFISH specimen now precedes
the landing worked example and uses a lazy fixed MapTiler view with Kraken
selected and every interaction disabled. The earlier large `/map` introduction is
removed. Search, starting points, filters, sharing, export and evidence guidance
now form one compact control field immediately followed by the live map.

Desktop uses a fixed 380-pixel internally scrolling results rail beside the
map and retains the accessible evidence table below. Mobile adds an explicit
Map/List control and collapsed, preview and expanded synchronized result-sheet
states. Bounds deep links frame the requested geography, selected records are
injected into the synchronized rail and table even when they fall outside the
initial rich-result page, and ordinary URL state survives refresh, sharing,
profile navigation, browser Back, sign-in and Working List handoffs. The
deterministic guided example still canonicalizes to an ordinary `/map` URL only
after successful loading and never calls `/api/discover` or consumes quota.

Release evidence:

- Signed-out browser review passed at 390, 768, 1024 and 1440 pixels with no
  horizontal overflow. The active map began at 631, 507, 433 and 418 pixels
  respectively. Canvas heights were 464, 563, 534 and 624 pixels.
- At 1440 by 900, 482 pixels of active map canvas remained visible in the first
  viewport. The 380-pixel rail scrolled internally while the map, rail, selected
  preview and accessible table remained synchronized.
- Loading, bounds, `start=need`, deterministic example, selected organization,
  mobile sheet states, Map/List, refresh, sharing, profile return, browser Back,
  sign-in return and Working List return paths passed local browser checks.
- `pnpm test` passed 46 files and 250 tests. `pnpm lint`,
  `pnpm launch:validate`, `pnpm scale:validate` and
  `pnpm release:validate` passed. The release gate reported no known production
  dependency vulnerabilities and completed the optimized production build.
- No Supabase migration, data publication, research skill, scheduled task,
  provider configuration, analytics event, authentication contract or
  campaign changed.

## August 2 guided-entry release

The approved guided landing replaces the former atlas-first root without changing the canonical data, review, publication, consent, authentication, or analytics authority. `/` now leads visitors from a need, released Public Need, or Mission Area through a quota-free deterministic example and a real published specimen; `/map` owns the national atlas, Ask True North, filters, shareable state, and Working List handoffs. The worked example ends in an evidence-backed shortlist and Working List rather than a generic instruction to continue exploring.

The final design pass preserves the bounded 480-pixel maritime hero, highlighted opening phrase, Paper caption cutout, three distinct starting-job cards, selected-concept pills, prominent guided-search action, compact map introduction, and secondary LinkedIn/X footer pills. The three exact live coverage measures now occupy a restrained responsive Paper overlay inside the hero image; the separate page-width band and low-value freshness sentence are removed. The brand contract records these choices rather than the earlier filter-only pill rule.

Ask True North now defaults to `gpt-5.6-luna`. A controlled live structured-output call passed with the existing Responses API contract, low reasoning effort, known-record boundary, deterministic preselection and deterministic fallback unchanged. No new index, web tool, saved model response, database migration, or publication path was introduced.

### August 2 shared-brand and research-intake repair

- The shared public header now owns the approved Inter navigation typography.
  Landing, map, and public detail routes no longer depend on route-wrapper
  inheritance, so the navigation face, size, and weight remain stable between
  pages. Barlow remains reserved for the logo, hero, editorial headings, and
  selected brand display moments.
- `content/brand/True North Map Brand System.md` remains the single canonical
  brand document. The obsolete April COVE brand audit was removed; approved
  source artwork and historical evidence assets were retained.
- Refresh staging was failing closed because the trusted `service_role` intake
  called the private immutable baseline parser through a trigger without the
  parser's execute privilege. Migration
  `20260802154618_grant_refresh_staging_helper_to_service_role.sql` grants only
  that function to `service_role`; `anon` and `authenticated` remain denied,
  and review, approval, publication, and canonical-record authority are
  unchanged.
- The validated North Vector Dynamics refresh was then staged through
  `public.stage_research_candidates_for_review`. Production verification found
  one pending refresh card with eight proposed operations. No candidate was
  accepted or published.

The first production smoke exposed `DYNAMIC_SERVER_USAGE` on dossier routes because the new safe `returnTo` query state was being read inside their earlier on-demand static rendering contract. Organization and capability dossiers now render dynamically while their bounded record loaders retain the existing five-minute server cache. This preserves safe map context without loading the national snapshot or allowing a query-dependent page to enter the static cache.

### August 2 release-hardening reconciliation

- National discovery is assembled from deterministic 1,000-row relation pages, with each bounded page stored under the shared `atlas-public` five-minute cache tag. This preserves the complete map without storing the uncapped corpus in one provider-limited item.
- Public reads keep one retry and now add a short randomized delay. Middleware is restricted to the legacy root bridge and routes that actually require authentication refresh or protection.
- The application and CI runtime is pinned to Node 24. GitHub Actions runs the complete release gate on `main`; CodeQL, complete dependency auditing, Dependabot vulnerability alerts, secret scanning, and push protection provide supply-chain checks without automated update branches.
- Local migration and rollback filenames now match the applied production Supabase versions exactly. No SQL was executed and no database object changed.
- Superseded launch exports, generated reports, and the private newsletter export were removed from the current tracked tree. Historical governance is isolated under `context/archive/governance/`; generated collateral is no longer an active operating contract.
- A production-only Vercel Firewall observation rule for unusually frequent `/organizations` GET traffic is staged with a log-only action. It is not active until the owner explicitly reviews and publishes it.

## August 1 pre-release UX candidate

This historical candidate refined the approved landing and `/map` handoff without changing the public-data, publication, authentication, consent, or analytics authority. The landing uses visitor-facing **Search focus** controls for a fixed deterministic example; it carries only allowlisted focus IDs into a normal refreshable `/map` state, never calls Ask True North, and does not consume its quota. The map presents the selected focus as removable controls and preserves safe local context through profile, evidence, Working List, and sign-in actions. Public evidence language is normalized to Source-backed fact, Our assessment, Coverage gap, Evidence strength, and Last reviewed. The August 2 map-first workspace release above supersedes its local-candidate status.

### August 1 local verification update

- Independent read-only QA identified and the candidate corrected two release blockers before final verification: unsafe backslash/control-character return paths across profile, Working List, sign-in, and contribution flows; and missing URL serialization when the map viewport changed. Return paths now use one same-origin guard, while viewport changes replace rather than append history and retain current bounds in shareable map context.
- `pnpm release:validate` passed: production dependency audit, 46 test files / 246 tests, lint, 5,000-marker scale validation, and optimized production build all completed successfully.
- Browser checks on `/` and the guided `/map` state at 390, 768, 1024, and 1440 pixels found no horizontal overflow. The controls report their `aria-pressed` state, meet the 44px target, disable the CTA at zero selections, strip the temporary `example` parameter after the map is ready, retain map focus/bounds in return links, and let visitors remove a focus chip. Normal `/map` retains the ordinary, non-guided orientation.
- The production-base `pnpm launch:validate` did not complete: the current production crawl aborted on a timed-out request. This checkout’s new `/map` route is also not yet deployed (the production route returned 404 in the direct check), so a clean post-deployment launch crawl remains required. No deployment or production state changed in this verification.

## Verified production baseline

- `main` and `origin/main` were aligned at the July 31 regional-imagery deployment when the audit began.
- Supabase project `facoactpdckkhciamflk` reported `ACTIVE_HEALTHY` in `us-west-2`.
- `/api/health`, the homepage, Organizations, Regions, Public Needs, Defence Briefs, How It Works, and the Kraken Robotics profile returned successfully.
- Current public route time to first byte in the direct smoke was roughly 0.12 to 0.42 seconds. Full transfer for the checked pages remained below roughly 0.54 seconds in that sample. This is a dated audit sample, not field Core Web Vitals.
- `pnpm security:validate` reports on the complete production and development dependency graph.
- `pnpm launch:validate` checked 645 canonical public pages with zero findings, zero orphan candidates, and zero duplicate titles.
- Browser checks at 390, 768, 1024, and 1440 pixels found no horizontal overflow on the sampled core routes. No console warning or error appeared in the audited public flow.
- The live response still uses private no-store homepage HTML, exposes `X-Powered-By`, and retains dormant Clarity hosts in the CSP. Those items remain in the security and reliability register.

## Live operational state

A read-only production snapshot found active work in the research-candidate, contribution, connection, contact, feedback, and subscriber surfaces. At audit time there were 50 pending candidate changes, three pending submissions, one new connection request, one new contact message, one pending feedback item, and three subscribed update records. These totals are included only as dated audit evidence. Every agent must re-read production before acting because the queues may change independently of this file.

The canonical published Mission Area / Use Case layer is ready to support a public browsing slice. At audit time the four published mission areas all had substantial reviewed capability coverage. Exact totals remain a live database fact and are not repeated in operating contracts.

## Repository state

The deployable public application was aligned with production. The primary worktree also contained intentional, uncommitted work across:

- claim-led research contracts and OSINT normalization;
- private visibility tooling and fixtures;
- Source Book and North Signal source-registry material;
- candidate-logo preparation;
- immutable research run, lead, candidate, review, staging, claim-ledger, collection-plan and signal lineage;
- a large local lookbook/collateral workspace.

This is not evidence of production drift. It is a release-control risk if staged indiscriminately. Application/governance releases, validated research lineage, and private ignored operator artifacts must remain separately reviewed.

## Public experience audit

Accepted audit screenshots are stored in `output/audits/soft-beta-2026-07-31/`.

### 1. Homepage: healthy

The current split hero communicates the product quickly, shows live breadth without blocking first paint, keeps Ask True North immediately adjacent, and uses the brand system consistently. The first desktop viewport establishes value, evidence posture, and the primary action. On mobile, the hero is legible and actions remain visible, but the image pushes Ask True North below the first viewport. This is acceptable because the primary action anchors directly to discovery; it should be monitored rather than redesigned again.

### 2. Organizations: healthy with mobile density friction

The route clearly explains the task and its streamed coverage cards provide useful context. On mobile, the coverage cards consume the initial viewport before the visitor sees a real organization. The next refinement should compress those metrics into a horizontal summary or move the first useful result above part of the snapshot without hiding coverage caveats.

### 3. Regions: healthy with excess introductory height

The approved regional imagery makes the route more memorable and the national-to-regional pattern is easy to understand. The editorial introduction and whitespace are generous enough that the national card begins low in the desktop viewport. Reduce vertical spacing before changing art or adding more decorative content.

### 4. Public Needs: strong trust design

The page explains where a public need comes from and distinguishes fact from assessment before displaying records. The evidence legend and caveat are clear. The long headline and dense legend should be checked whenever mobile copy or icon treatment changes, but there was no sampled overflow.

### 5. Defence Briefs: visually strong, cadence-sensitive

This is the strongest content-led route and a useful acquisition surface. Its future value depends on freshness and internal linking, not another layout change. A repeatable editorial cadence should connect Briefs to Mission Areas, Public Needs, organizations, and North Signal.

### 6. How It Works: healthy

The five-step explanation and evidence boundary make the product understandable to a first-time visitor. It should become the contextual trust destination for the future Mission Area pages and outreach links.

### 7. Organization profile: decision-useful

The Kraken profile shows the intended evidence-led dossier depth, clear actions, approved logo, technology section, evidence states, and breadcrumbs. The action cluster is dense but usable on desktop. Continue to monitor mobile action ordering and only surface fields supported by public evidence.

## Brand and collateral reconciliation

- The Directional N is the approved and deployed True North Map identity.
- North Signal is the editorial briefing name, not the public name of the logo symbol. Legacy asset filenames may retain `north-signal-mark` for compatibility.
- North Ink, Field, Paper, Signal Yellow, Evidence Green, Barlow, Inter, restrained rounded geometry, and evidence-first states remain the approved system.
- Regional imagery is current and deployed.
- The Phase 2 screenshots, LinkedIn banner, walkthrough, partner overview, and deck predate the Directional N or later interface changes. They are historical references and require a dated replacement package before broad distribution.
- No additional global aesthetic redesign is recommended. Future imagery should help orientation or editorial understanding rather than decorate directories.

## Security and reliability review

The production dependency gate is clear and the prior citation-scope and public-rationale blockers are deployed. Current Supabase security advisors showed five informational deny-by-default RLS notices and two known warnings: the authenticated security-definer Defence Brief RPC and leaked-password protection. The latter remains an accepted trigger because the public product does not accept passwords.

Supabase performance advisors reported overlapping permissive RLS policies, unused indexes, and an absolute Auth connection strategy. These are not evidence of a current breach or outage. They are recorded in `Security And Reliability Remediation Log.md` with bounded verification triggers.

## Recommended implementation order

1. **Pre-promotion security and operations pass.** Triage the live queues, remove dormant Clarity CSP hosts and `X-Powered-By`, narrow the Defence Brief RPC execution surface, add strict submission payload and per-account limits, and replace the stale-publication retry SQLSTATE.
2. **Mission Area / Use Case discovery.** Add `/missions` and `/missions/[slug]` using only published mission areas, reviewed capability relationships, current public evidence, visible gaps, and existing organization/technology routes. Do not create a second taxonomy or infer new missions. Link from How It Works, relevant technologies, Public Needs, Briefs, and the map.
3. **Mobile collection refinement.** Bring the first real organization higher on `/organizations`, reduce Regions introduction height, preserve streamed loading geometry, and rerun the four-width browser matrix.
4. **Content and internal-link cadence.** Publish a consistent Defence Brief and North Signal rhythm, create source-backed links into Mission Areas and Public Needs, and refresh older high-value pages when new evidence arrives.
5. **Historical launch package and distribution proposal.** This proposal produced dated collateral that was later retired from active project context. Any new campaign assets must be explicitly requested and rebuilt from current production.
6. **Scale follow-up.** Separate the anonymous cacheable public shell from auth-state requests, watch the growing homepage/directory transfer size, and consolidate overlapping public-read/staff RLS policies without weakening authorization.

## Implementation outcome

The six-step sequence was implemented in order in the current local release candidate:

1. **Security and operations:** tightened public payload validation and quotas, reduced fingerprinting and dormant-provider surface, and applied the reviewed RLS/security migration without changing public-data or publication authority.
2. **Mission discovery:** added `/missions` and `/missions/[slug]` over the existing published Mission Area taxonomy and reviewed relationships, with clear assessment caveats and cross-links into organizations, technologies, Briefs, and Working Lists.
3. **Mobile and Regions:** compressed the mobile Organizations summary, preserved streamed loading geometry, and corrected regional-card imagery to fill consistent 4:3 card frames without changing the approved art or regional record content.
4. **Content links:** connected Defence Briefs, organizations, technologies, Public Needs, and Mission Areas using existing reviewed relationships; no new public fact or relationship was inferred.
5. **Launch package:** produced a dated broader-beta asset set with screenshots, Directional N assets, channel copy, response guide, walkthrough, partner PDF, and partner/media deck. These generated assets were later retired from the active tracked tree.
6. **Scale and operations:** added deterministic paged reads for every discovery relation, same-snapshot public counts, linear-time grid grouping for the fallback map, a 5,000-marker scale gate, direct non-sensitive health checks, and launch probes that compare summary, atlas total, complete markers, and bounded rich results while surfacing recovered retries.

Steps 1 through 5 are functionally complete in the release candidate. Step 6 source work is complete locally but its production-specific cache, crawl-warning, catalogue-consistency, runtime-log, and field-performance checks remain release activities. `REL-2026-003` and `REL-2026-004` are therefore not closed in this log.

## Final local release-candidate verification

The complete six-step release candidate passed the integrated local release gate after the final regional-image and scale changes:

- `pnpm release:validate` passed with no known production dependency vulnerabilities.
- All 43 test files and 235 tests passed.
- Lint and the clean Next.js production build passed.
- The 5,000-organization scale fixture retained all 5,000 map markers, bounded rich cards to 18, serialized below the 1.5 MB budget, and completed both projection and fallback clustering below the 300 ms budget.
- The four-width browser matrix and sampled public, member, and administrator routes showed no horizontal overflow or broken images. Anonymous private routes retained the normal sign-in boundary.
- The local health, summary, and atlas probes agreed on catalogue availability and complete marker coverage.
- The production canonical crawl remained a healthy pre-deployment baseline, but production still returns the prior health response until this release candidate is approved and deployed. Production verification remains required before closing the open reliability items.

## Verification limits

- Screenshot inspection and responsive geometry checks do not prove WCAG conformance or screen-reader quality. Full keyboard, focus, contrast, semantic announcement, and assistive-technology checks remain part of release regression.
- The direct timing sample is not a Core Web Vitals field dataset and does not substitute for Vercel or Google field measurements.
- Authenticated member and administrator workflows were not modified or replayed in this documentation-only task.
- Vercel runtime logs were not changed or cleared; inspect them again immediately before broader promotion.
