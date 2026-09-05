# Defence Signals: intelligence workflow and product improvement plan

Status: implementation complete; approved production release in verification on 2026-09-05
Owner: Andrew Davies
Opened: 2026-09-05
Scope: the Daily Signals skill, its research workflow, and the Defence Signals output product
Next action: finish exact-deployment verification, install the revised skill with its schedule paused, then conduct the separately requested current-source run

## 1. Intended outcome

Defence Signals should turn a broad, messy flow of current information into substantial, timely intelligence about Canadian defence and dual-use capability. It should help a reader understand what changed, what the change means, which opportunities or risks deserve attention, and what evidence or relationship to pursue next.

The value comes from finding overlooked developments, investigating consequential questions, and making useful connections. It also comes from accurate reporting of a significant development before its eventual outcome is known. Publication should give the reader additional understanding that would take meaningful effort to assemble from the original sources.

Andrew imposed eight items because earlier autonomous output was sparse and lacked substance. That history is a product requirement: relaxing the count must improve judgment while preserving ambition, breadth and depth. Eight should remain a comparison point during evaluation, rather than becoming a minimum, maximum or hidden generation target in the revised workflow.

The proposed success condition is a better intelligence product for the effort invested. A longer edition, more sources, more searches, a higher model setting or a passing schema is not sufficient evidence of success.

The internal workflow remains named Daily Signals. Publicly, Defence Signals remains a publication-driven editorial stream without a guaranteed daily-publication promise. North Signal remains the separate consent-backed newsletter that can draw on published editions.

## 2. Planning boundary and sources of truth

Andrew approved implementation of this direction on September 5. The installed skill and deployed contract continue to govern actual runs until compatible v3 support is verified and the new skill is installed. Today's edition remains a separate later run. This document retains the planning rationale below; the implementation status and final completion evidence take precedence over its original proposed sequencing.

This plan covers source intake, investigation, selection, writing, review, packaging, publishing support and reader presentation. It does not expand the Research skill, change canonical organizations or technologies, create research candidates, change newsletter consent, send campaigns, post socially or activate an automation. Signals may retain a useful research lead privately; an organization investigation remains a later authorized Research run.

Authoritative references:

- [Project Overview](../../True%20North%20Map%20Project%20Overview.md)
- [Project Status](../../Project%20Status.md)
- [Cross-System Contract](../../Cross-System%20Change%20And%20Regression%20Contract.md)
- [System Registry](../../Skills%20And%20Automation%20Map.md)
- [Brand System](../../../../content/brand/True%20North%20Map%20Brand%20System.md)
- Installed private skill: `.agents/skills/tnm-daily-signals/SKILL.md` and its editorial, source, image and publication references
- Executable packet: `app/src/lib/signals/contract.ts`; publisher: `app/scripts/publish-daily-signals.ts`
- Production Supabase project `facoactpdckkhciamflk` and the deployed application
- [OpenAI Astra model guidance](https://developers.openai.com/api/docs/guides/latest-model)

Keep private skill bodies, mailbox identifiers, excerpts, raw provider responses and trial artifacts out of Git. This tracked plan contains product decisions and implementation references only. The other existing governance and research changes in the main checkout are unrelated user work.

## 3. Evidence informing the proposal

The September 5 review inspected the installed skill and references, executable constraints, source registers, scheduler configuration, and five stored editions: August 24, 27 and 31, and September 2 and 4. These are observations of stored outputs, not renewed verification of every underlying news article.

The sample contains useful names, amounts, dates, procurement stages and Canadian connections. Preserve those strengths. It also shows:

- All five editions use eight items. Thirty-four of forty next steps contain the word `track`; many repeat a precaution already expressed in the narrative or uncertainty block.
- Thirty-two of forty items cite one source. This is not an inadequacy rule: an attributed announcement can stand on one source. It identifies places where selective context research may produce more value than another restatement of what the announcement does not establish.
- Several editions converge on a promise-to-proof or readiness-gate thesis. Repeated emphasis can narrow the editorial view even where an individual interpretation is defensible.
- Some items ask readers to inspect a technical annex or exemption conditions. The workflow should first determine whether it can recover and explain those decision-changing details itself.
- Held items include industrial capacity, company qualification and financial distress. Their disposition sometimes depends on an occupied topic slot, a familiar program mechanism or missing downstream outcomes. Those are reasons to compare significance, not automatic reasons to exclude the development.
- Recent runs have used Defence, Cybersecurity, AI and Business newsletter labels. The skill names only “selected Gmail discovery labels,” leaving the intended coverage insufficiently explicit.
- The current feed register contains 38 rows, 37 marked active and one quarantined; its health/yield metadata is incomplete. Several governance descriptions still refer to 28 feeds. This is a register observation, not a live Inoreader subscription audit.
- The image helper refetches source pages and returns at most one technically admissible asset per page even with `--all`.

Live read-only confirmation on September 5 found the September 4 edition, “Payloads, production lines and pressure tests,” as the latest published edition, with eight items. There were 28 published run records and one no-publish record. The Daily Signals automation was paused, selected `gpt-5.6-sol` at `max`, and retained an older v1 prompt. These facts are a dated planning baseline and must be refreshed before implementation or activation.

The prior review's eleven-skill validator, forty-seven focused tests and nine research operation evaluations passed. They establish compliance with current contracts; they do not establish recall, editorial depth or reader usefulness.

## 4. The proposed reader experience

The edition should support both a quick orientation and a more substantial read. Give readers the main conclusion early, then enough detail to understand and assess it.

Use the following editorial forms when the material warrants them. They are available forms, not compulsory sections:

| Form | Reader value | Appropriate treatment |
| --- | --- | --- |
| Editorial opening | Understand the most important changes and where attention belongs | A concise orientation to the edition's priorities, tensions or genuine shared pattern |
| Developed lead | Understand a consequential development beyond its announcement | Explain the event, relevant history or baseline, commercial/operational consequence, supporting evidence and decisive uncertainty |
| Supporting development | Learn something useful without unnecessary repetition | Shorter treatment with clear attribution, a specific implication and relevant source links |
| Connection or comparison | Understand why separate developments change one another's meaning | Show the relationship and its evidence; distinguish a TNM assessment from a claimed partnership or procurement fact |
| Emerging development | Notice a significant announcement, risk or market shift early | Describe its actual status and why it deserves attention without inventing its eventual outcome |
| Follow-through | Understand what changed since an earlier edition | State the previous watchpoint, new evidence and revised implication; link the earlier edition |

Space should follow intelligence value. A major contract, changed requirement or industrial shift may warrant considerably more explanation than a simple announcement. Do not force all items through an identical word or paragraph allowance.

A single thesis is useful when it emerges from the findings. On other days, an edition can explain several important developments or competing trends. Significant exceptions should survive selection even if they complicate the opening argument.

Keep sources near their claims and make TNM interpretation recognizable. Reduce repetition between the narrative and the current four evidence/action boxes. Readers should encounter each major limitation in the place where it affects understanding, with deeper evidence details available where useful. Avoid adding a visible wall of confidence badges or internal workflow terminology.

Give the reader concrete conclusions and appropriately specific next steps. “Read the source” and “track future progress” should not be the default added value. When an actionable public detail can be recovered during research, include it. When the next event genuinely lies in the future, identify the actor, milestone or condition that would change the assessment.

## 5. How to preserve substance without an article quota

Replace count-based completion with evidence of adequate discovery and a substantive editorial comparison. Keep the checks compact and tied to real decisions so they do not become another lengthy compliance ritual.

Before selection closes, the editor should be able to explain:

1. Which intended source and subject lanes were inspected, and which were unavailable or incomplete.
2. Which developments are most consequential, including important risks and exceptions to the apparent theme.
3. What further investigation added to the leading stories, or why a straightforward attributed announcement deserves concise inclusion.
4. Why the strongest omitted candidates add less value than the selected treatments.
5. Whether another plausible search or document would materially change the edition, rather than simply increase its length.

The remedy for a thin draft is to revisit coverage, follow the strongest unresolved leads, inspect available annexes or filings, recover a useful comparison, and reconsider selection. Adding generic explanatory paragraphs is not an adequate remedy.

A shorter edition is acceptable when it contains substantial intelligence after adequate discovery. A busy period can justify more than eight developments. Neither count is itself a success or failure. Do not impose new mandatory story, source or word totals as substitutes for editorial judgment.

Maintain explicit distinctions between:

- an editorial conclusion that there is no useful publishable edition;
- a genuinely useful edition with a different size or shape;
- incomplete work caused by source access, missing credentials, interruption or exhausted resources.

An incomplete run must preserve progress and report its actual limitation. It must not claim that no signal exists. If an edition is valuable despite a nonmaterial source gap, report the coverage limitation privately rather than automatically vetoing publication.

## 6. Broad capture followed by selective investigation

### Source coverage

Define Daily Signals' portfolio as a view over the existing source registers, with explicit authorized mailbox labels and source routes. Do not maintain another manually duplicated master list.

Cover the information environments that can change Canadian defence and dual-use decisions:

- Canadian public needs, procurement, budgets, programs and regulation;
- company capabilities, products, partnerships, contracts and delivery;
- industrial capacity, financing, ownership, distress and supply chains;
- enabling commercial technology, infrastructure, research and testing;
- operational lessons, constraints, exercises and changes in demand;
- allied developments with an explained Canadian benchmark, market or dependency implication.

These are coverage prompts, not mandatory output slots. An important civil or commercial development may be relevant without a claimed defence customer. Explain the connection as an assessment and avoid inventing an official relationship.

Read the configured newsletters and feeds independently of the open-web investigation. A quiet mailbox must not shrink the wider search. A busy AI feed must not crowd out industrial, procurement, commercial or operational developments. Refresh active current sources and rotate due reference sources based on cadence, prior yield and strategic value. Protect low-frequency authoritative sources from being dropped solely for low volume.

For each source stream, record the query/window, cursor or continuation, latest successful observation and current access result. Resolve label IDs and source identities from the live account when intake is implemented. Feed failures retain a manual official-page route where available. Never silently equate “unread,” “first page” or a folder's first few entries with complete coverage.

### Capture and triage

Capture inexpensive item metadata broadly before deciding what merits a full read. Split multi-topic newsletters and digests into separate leads. Normalize URLs, distinguish syndication, and retain the original discovery route.

Review candidates by consequence, novelty, Canadian connection, source support, unresolved question and potential reader value. Use model judgment with a concise rationale; avoid an opaque numerical score that automatically decides publication. An unusual high-value lead can justify deeper work even if it appears in a lower-priority source.

Remove the current single 60-item ceiling that mixes newsletter inspection, source resolution and deeper research. Track those activities separately. Use the existing 45-minute allowance as an initial comparison budget in evaluation, not as a newly endorsed permanent limit. The eventual operating budget should be selected from measured quality, time and cost; an interruption should create resumable work.

### Investigation

For each leading candidate, identify the question most likely to change the reader's understanding. Follow an available technical annex, filing, award notice, buyer statement, program rule, prior announcement or relevant comparison when it can answer that question.

Investigate adaptively. A simple official notice may need little corroboration; a disputed performance claim or implied market shift may need considerably more. Search outward from the named actors and inward from the affected problem. Look for contradictory evidence, changed lifecycle stages and consequences that the initial article overlooks.

Retain financial and market context that makes the development useful: disclosed amounts and currency, financing instrument, contract status, ownership, capacity, buyer access and constraints. Distinguish an announced investment, financing availability, binding order, procurement ceiling and realized revenue. Broader organization enrichment remains outside this skill's write authority.

### Synthesis and review

Select after the broad scan and targeted investigations, then determine the edition's argument and shape. Review a promising excluded story against a weaker included story before locking the selection. Do not eliminate a new supplier's meaningful qualification solely because the program appeared previously; determine whether the actor, capability, access or market state actually changed.

Check significant factual statements against their sources, then review the inference. A separate critic can challenge weak implications, repetition and omissions using existing collaboration tools. Use delegation for concrete independent research bundles when useful; the editor owns synthesis and the final packet. Avoid an agent per trivial article or repeated whole-edition reviews without a specific unresolved concern.

## 7. Claim-specific evidence policy

Evidence should establish the statement actually being made. Source channel alone should not determine admission.

| Claim or input | Proposed handling |
| --- | --- |
| Unresolved newsletter/email lead | Retain privately with its authorized discovery locator and next recovery route |
| Original company announcement | Attribute the announcement to the company; do not convert it into demonstrated performance or adoption |
| Original specialist reporting or public interview | Use the attributable original report for the claims it establishes, with its limits made clear |
| Public first-person social/video statement | May establish that the identified party made the statement; retain stable locator/date and pursue a durable public anchor for consequential factual conclusions |
| Official award, filing, notice or published test | Describe the exact event and scope; keep its lifecycle and limitations accurate |
| Independent corroboration | Record the independent reporting or underlying record, rather than counting copied releases as additional confirmation |
| TNM interpretation | State the supported premises, meaningful implication and decisive uncertainty |

Search snippets, untraceable assertions and private correspondence do not become public evidence. A public newsletter article can be original reporting; the private email wrapper is not automatically a publishable source. Use concise excerpts and locators rather than copying complete copyrighted works.

Separate “the source does not state this,” “we have not investigated this,” “we investigated but could not establish it,” and “the event has not happened yet.” This prevents an unfinished investigation from appearing as an inherent limit of public knowledge.

Keep a small set of integrity requirements: correct identity and attribution, faithful amounts/dates/status, traceable support, visible inference, honest independence, privacy, genuine event deduplication and safe publication. Uncertainty should usually narrow a claim or create a specific limitation. An item should be rejected when its useful central claim cannot be responsibly stated, rather than because its entire future is unknown.

## 8. Persistent private working record

Introduce one typed, ignored Signals working ledger with resumable per-run snapshots and a cross-run index. It is an operator artifact, not another public runtime database or a replacement for Supabase's publication record.

Initial capture should accept a sparse record: a stable lead ID, source/channel locator, available title or identity, observed timestamp and capture state. A public URL is optional. Generate routine retrieval, cursor and timestamp bookkeeping through tooling; broad capture should not require the editor to write a miniature assessment for every entry.

Enrich the record only as triage or investigation warrants it: actor/event identity; event/publication dates; claim and source status; relevance rationale; important question; next check or recovery route; and linked edition/item IDs when published. Missing fields must not prevent an unresolved lead from being retained. Unresolved private captures must not require an invented canonical public URL merely to be saved.

Use concise states such as captured, investigating, ready, held, published and dismissed, with an actual reason. A held item should remain searchable and be revisited when its source changes, a named milestone arrives or a related development alters its significance. “No room today” is not a permanent rejection.

Reuse already fetched pages and extracted evidence within the run; retain timestamps and hashes so changing pages are detected. Bound cached material and retention by its operational purpose. Preserve necessary evidence locators, short excerpts and publication lineage; avoid an indefinite warehouse of raw mailbox bodies.

Collection cursors and committed-publication markers must be separate. A failed publish must not consume a lead or advance its state to published. Reconcile the published state against Supabase before finalizing the local ledger after an interrupted run.

Reuse the captured public HTML for image discovery. Use bounded independent fetches, host-aware pacing, explicit retry outcomes and browser recovery for pages that genuinely require rendering. A blocked source becomes a specific access result, not evidence that the development is false or unimportant.

## 9. Packaging should support the intelligence

Research and select the stories before searching for the hero or drafting social copy. The presence of an attractive photograph should not determine which important developments survive.

Retain a relevant, provenance-backed source image when available. Improve the helper to compare multiple page candidates and reuse fetched HTML. Review the actual image and crop, with accurate alt text and attribution.

Recommended product decision: support an intentional text-led edition when no suitable image is available. Existing public image-less rendering provides a starting point, but it must be designed and verified across article, archive, metadata and RSS. A future brand-owned typographic share card can provide orientation without implying that it depicts the event. This plan does not commission or generate that asset, nor introduce generated event photography.

Prepare private LinkedIn and X examples after the article's meaning and selection are settled. Preserve them as useful operator outputs. Recommended contract change: their absence should become a retryable packaging task rather than invalidating sound editorial intelligence. Report article publication and private packaging completion separately. No external post is authorized or performed by Signals.

Keep public sources, publication-time evidence and historical corrections stable. Distinct developments may use the same substantial source page, but they must have distinct supported event/claim identities. The current global source upsert can overwrite a URL's evidence excerpt/locator/hash; versioned per-item or per-claim evidence snapshots are a prerequisite for expanding shared-page use safely.

## 10. Simplify the instructions and use Astra deliberately

Make `SKILL.md` a concise operating guide: product purpose, source coverage, adaptive investigation, editorial selection, completion and authority. Keep executable mechanics and specialized examples in references that are loaded when needed. Remove duplicated rules and synchronize the skill, agent metadata and automation prompt through one maintained contract.

The prompt should explicitly direct the model to continue useful discovery and investigation, make routine editorial decisions, preserve interrupted work, and finish the assigned product. Questions should be reserved for missing information that materially changes the assignment. This follows [Astra's guidance on instruction sensitivity and follow-through](https://developers.openai.com/api/docs/guides/latest-model#prompting-best-practices).

Use deterministic tooling for collection mechanics, identifiers, hashes, schemas, privacy, exact publication state and idempotency. Use editorial judgment for significance, useful depth, selection, synthesis and prose. Style advice should help revision without turning a word list into a publication veto.

Compare Astra with the current model at the existing effective reasoning setting first. Change model, prompt and effort independently where possible so improvements can be attributed. Then assess whether routine extraction can use less effort and harder synthesis merits more. Astra does not support custom `temperature` or `top_p`; editorial freedom must be expressed through the assignment and workflow. [Migration guidance](https://developers.openai.com/api/docs/guides/latest-model#gpt-6-astra-update-api-and-model-parameters)

The present workflow runs through Codex. API-only features such as asynchronous tool definitions are a possible future runner optimization, not something a skill edit alone enables. Avoid building a new agent platform until a measured bottleneck warrants it. Use existing tools and bounded parallel work first.

## 11. Proposed changes to the current rules

| Current rule | Proposed decision |
| --- | --- |
| Exactly eight items | Editorially determined count; compare substance against the eight-item baseline during pilot |
| One thesis for every item | A shared thesis when earned; otherwise priorities, tensions or related clusters with significant exceptions |
| One distinct primary URL per item | Distinct underlying developments/claims with immutable evidence snapshots |
| Fixed 60 inspected items | Separate broad metadata triage, full reads and follow-up investigation; budget and resume each honestly |
| Minimum source-family count as an edition gate | Inspect a broad portfolio and assess independence/coverage; avoid manipulating family labels to pass a count |
| All newsletters/social/video always discovery-only | Claim-specific use of identifiable original public reporting or statements; private/untraceable material remains private |
| Universal paragraph, word and verb checks | Advisory writing feedback; retain technical size bounds and substantive claim checks |
| Identical full treatment for every story | Unequal depth based on reader value; simplify repeated evidence boxes |
| Missing hero invalidates an edition | Reviewed source image where available; an intentional text-led option |
| Missing private social copy blocks publication | Retryable private packaging with visible completion status |
| Every failure becomes a no-publish interpretation | Distinguish editorial insufficiency, incomplete collection and operational/publication failure |
| Held leads live in free-form run reports | Typed resumable private lead ledger with revisits and publication reconciliation |

Retain controlled tags for navigation, immutable slugs and publication dates, accurate dates/amounts/status, published-record link validation, duplicate-event handling, source attribution, privacy, correction/archive, idempotent publishing and the isolated Signals write boundary. These are part of delivering a reliable product.

## 12. Implementation work packages and dependencies

Implementation should proceed only after the plan is agreed. The work packages below are an explicit proposed sequence, not a record of completed work.

| Package | Deliverable | Completion evidence |
| --- | --- | --- |
| A. Product and baseline | Agreed product brief, representative current editions, proposed editorial examples and evaluation rubric | The examples demonstrate depth, breadth, early signals and unequal treatment without a count quota |
| B. Capture and investigation | Portfolio routing, typed private ledger, resumption, cached retrieval, source-health and targeted follow-up workflow | Captures persist across interruption; source coverage is reported accurately; strong held leads are recoverable; private trials gain useful information |
| C. Editorial and model trials | Revised draft skill/reference text, adaptive selection, evidence policy and model comparisons | Paired review favours the new output for substance and usefulness without increased factual correction burden |
| D. Product contract and presentation | Proposed v3 packet, versioned evidence, variable counts/depth, explicit edition summary fields, text-led presentation and separate packaging status | Packet, SQL, writer, loader, preview, admin, public reading and RSS agree; historical editions remain intact |
| E. Integration and release | Governed migration/release, compatible consumers, updated operational instructions | Required tests, local browser QA, exact deployment and bounded live verification pass |
| F. Controlled live trial and operating decision | New-format editions under an explicitly authorized run, monitored quality and cost, scheduler decision | Reader review and run evidence establish the improvement; automation is aligned and resumed only when separately authorized |

Package C can begin with private editorial drafts before the public schema changes. The current v2 publisher must not be used to publish a variable-count draft by disguising it as v2, downgrading it to historical v1, padding it to eight, or bypassing validation.

### Exact change surfaces

- **Skill:** `.agents/skills/tnm-daily-signals/SKILL.md`, its four references, `agents/openai.yaml`, and `scripts/extract-hero-image.mjs`; private working helpers remain within the governed operator boundary.
- **Source routing:** existing Source Book/CSV/OPML and playbook. Reconcile the Signals view without changing subscriptions or the North Signal issue contract implicitly.
- **Packet and review:** `app/src/lib/signals/contract.ts`, `editorial-voice.ts`, `local-preview.ts`, publisher script and fixtures. Introduce a proposed `daily_signals_packet_v3` and corresponding explicit run-outcome contract; preserve version-specific historical shapes.
- **Database:** a new versioned migration for the required additions/constraint changes. The original `20260803140603_add_daily_signals.sql` constrains positions to 1–8 and repeats text bounds; do not edit that historical migration. Keep one edition per Atlantic date, position uniqueness, publication visibility and RLS. Inspect actual live migration/function state before choosing the new migration.
- **Evidence:** retain canonical source identity, but snapshot each edition item's relied-on evidence so a later URL upsert cannot silently change historical support.
- **Loader/preview:** `app/src/lib/atlas/signals.ts` and preview/image paths must map new fields consistently and reject private lineage from public projections.
- **Reader presentation:** `app/src/app/signals/[slug]/page.tsx`, article navigation, archive browser and metadata. The current page derives deck, bottom line and boundary from summary paragraph positions; replace that assumption with explicit edition fields and a historical fallback. Keep the first version's item order flat unless explicit clusters demonstrably help reading.
- **Admin:** `app/src/lib/actions/signals-admin.ts` and Signals edit/index pages must share the versioned limits, support revised content and distinguish publication from private packaging completion.
- **RSS and downstream consumers:** `app/src/app/signals/feed.xml/route.ts`, `app/src/lib/email/defence-signal-alerts.ts`, latest-proof surfaces, homepage/dossier continuations, sitemap, North Signal and Command Centre feed consumption. Use an intentional compact edition summary rather than inheriting the first item's unknowns. Preserve stable GUID/date and published-only inclusion.
- **Governance at implementation:** Overview, Status, System Registry, Cross-System Contract, affected brand/editorial/admin/email/release contracts and Development Log must describe the final design together. This proposed plan does not rewrite those operating contracts now.

Split preparation, validation and apply into testable functions if needed to establish failure behavior. Prefer the supported publisher path to an agent recreating a long write sequence through ad hoc SQL. Any credential fallback must preserve the same transaction/reconciliation semantics and authority.

### Safe deployment and cutover

Design the additive schema and read compatibility first, inspect live dependencies, then apply approved migrations in the correct order. Release compatible application/preview/admin/writer support before any new-format runs. Preserve v1/v2 historical repair with exact existing-run identity; retire their new-edition eligibility deliberately at cutover. Do not retroactively rewrite historical editions to fit the new editorial style.

Only after the compatible deployment is verified should the installed operational skill and scheduler prompt target the new writer. Keep the schedule paused until explicit activation. An authorized publication may produce the existing consent-backed RSS alert; local drafts, shadow trials, no-publish and operational failures must not do so.

Rollback should pause new-format runs and retain the compatible reader for already-published content. It must not silently downgrade packets, rewrite historical sources, delete published editions or emit new RSS identities. Final rollback details depend on the actual migration and release design.

## 13. Evaluation that tests the product

Use paired historical replays and subsequent unpublished current-source trials. Include busy, quiet, company-announcement-heavy, financial/industrial, multi-theme and access-constrained cases. The existing five-edition sample provides a starting point, not complete ground truth.

For editorial comparisons, hold the dated source set and time cutoff constant. Preserve original evidence snapshots where available. If an old page has changed or an old source cannot be recovered, record that limitation rather than allowing later knowledge into the historical result. Current ledgers do not always enumerate every inspected item, so reconstruction coverage must be explicit.

For discovery comparisons, inspect a broader source window and have a separate reviewer identify consequential candidates and misses. Comparing only already-selected article sources cannot establish improved discovery. Use short-lived private evaluation records and avoid public or provider writes.

| Dimension | What the review should establish |
| --- | --- |
| Discovery | Important developments are recovered across the intended portfolio; consequential misses and their causes are examined |
| Breadth | Adjacent commercial, financial, operational and allied material is considered where it changes a Canadian decision |
| Substance | Leading treatments answer important questions, add context or make a supported connection beyond repeating an announcement |
| Selection | Included and omitted items are justified by value, including early risks and exceptions, rather than topic slots or a preferred thesis |
| Accuracy | Assertions are supported at their stated strength; attributed announcements, corroboration and inference remain distinguishable |
| Readability | The edition is substantial but economical, with useful depth variation and less repeated caution or generic tracking advice |
| Continuity | Held leads and earlier watchpoints are revisited when meaningful new evidence appears |
| Efficiency | Total collection-to-completion time, retrievals, available token/cost data and human correction effort improve relative to useful output |

Use blinded pairwise preference with short reasons and concrete examples wherever practical. Andrew's assessment of usefulness is the primary product decision. Treat serious factual/privacy errors separately from editorial preferences. Do not convert the rubric into a weighted auto-publication score or another lexical gate.

Recommended promotion decision: adopt the revised workflow when representative comparisons show greater useful recovery and stronger reader value with no increase in material corrections, at an acceptable observed cost and time. Do not claim a percentage improvement or impose a cost saving target before the baseline is measured. Fewer stories, more words or more sources alone cannot justify promotion.

Record full collection time separately from publisher execution time. A six-second database publish is not the time spent researching an edition. Report unavailable usage/cost data as unavailable, not zero.

## 14. Validation required for later implementation

Planning-only work checks the plan for consistency and links. Application and publication changes require the project contract, including Node 24, scoped development tests, `pnpm skills:validate` when skills change, `pnpm test`, `pnpm lint`, and `pnpm release:validate` before an approved release. Shared source/research interfaces require their applicable validation without broadening this task into Research redesign.

Focused cases must cover:

- justified editions below and above eight; ordering, structured summaries and unequal story depths;
- useful prose that triggers an old lexical heuristic, and generic filler that satisfies old word counts;
- one event repeated across many sources, a meaningful change to a familiar event, and distinct supported developments on one source page;
- historical evidence remaining unchanged after later updates to the same source URL;
- correct company attribution, original reporting, independent corroboration and bounded inference;
- collection pagination, empty and blocked streams, cursor replay, cache freshness, interruption, held-lead revisit and publication reconciliation;
- editorial insufficiency versus operationally incomplete or failed work, with no public/media/social/alert writes for nonpublishing outcomes;
- v1/v2 identity-safe historical repair, new-format publication and repeat-run idempotency;
- failure injection around storage, items, sources, private packaging and final publication, without duplicates or overwritten copied/discarded social rows;
- archive and admin correction, text-led/image editions, public links, metadata and publication visibility;
- stable RSS GUID/publication time, no backlog, no duplicate or correction alert, deliberate short summaries and absence of private captures.

Complete responsive and keyboard QA at 390/768/1024/1440 before push. After the exact ready deployment, run bounded core-plus-affected `pnpm launch:validate`, affected-route smoke, `/api/health` and live Signals/unchanged-corpus checks. Ordinary release work does not authorize a full production crawl, provider reconfiguration or campaign send.

## 15. Implementation and release evidence

The approved implementation is complete across the private skill/helper, v3 contract, publication transaction/recovery, reader, Admin, preview, archive, metadata and RSS. Today's current-source edition remains a separate later run.

- Signals work was isolated from the main checkout's unrelated Visibility work, then rebased onto its verified `8a338a2` release. Four pre-existing governance edits remain unstaged and preserved. No feature branch was pushed or preview deployment created.
- Node 24 main-checkout `release:validate` passed: 708 tests, lint, the 5,000-marker scale check, production build, repository/governance hygiene and the required high-severity dependency gate. The dependency audit retains two moderate and one low advisory. Eleven installed skills validate; the staged v3 skill separately passes validation and 17 helper tests.
- The broader `research:validate` checked 819 artifacts and reproduced 12 pre-existing six-lane errors in two August 12 discovery runs. Nine focused Research operation evaluations pass. No historical Research artifact or canonical Research contract was changed.
- Text-led nine-item reading, historical image reading and the archive passed 390/768/1024/1440 overflow and single-H1 checks. Evidence details respond to Enter and Space. The historical image loads successfully. Behavioral tests cover Admin correction/archive, explicit development preview isolation, RSS identity, nullable fields and published-only visibility.
- Production migration `20260905121239_signals_v3_editorial_and_publication` is applied after the independent Visibility migration. Both new RPCs are invoker functions granted only to service_role. There are still 598 organizations, 561 capabilities, 28 editions, 199 items, 234 sources and 29 runs. No historical evidence was reconstructed and no v3 edition was created.
- Private August 31/September 4 comparisons and the independent Astra/max retrospective demonstrate variable depth, improved interpretation and recovery priorities for omitted leads. They do not claim fresh discovery recall, complete measured research time, cost savings or model superiority. Andrew's later reading assessment remains decisive.

The release execution completes the post-migration build, exact main-only deployment, bounded affected-route and health checks, then installs the revised skill and sets the existing paused automation to Astra/max. The current `/api/system/signals-contract` deployment SHA and final implementation report identify the exact verified deployment. Private evidence and final readbacks are under ignored `research/signals/local/implementation-2026-09-05/`. No edition, campaign, external social post or canonical Research write is included.
