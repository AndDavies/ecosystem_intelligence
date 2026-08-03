# Development Phases Plan

Date: 2026-04-30

Project: `Ecosystem Intelligence`

## Purpose

This plan translates the current product state into the next development phases for the MVP.

It is based on:

- the PRD
- the current production codebase
- the current test/build status
- the current internal user workflow now visible in the app

## Current Product Stage

The product is currently in a strong internal MVP phase.

It already supports:

- Use Case-led discovery
- capability-first drilldown
- company context
- provenance and citations
- reviewable edits
- AI suggestion routing
- freshness indicators
- briefing views
- working lists / shortlists
- help center content
- ingestion and research support scripts

The next phases should focus less on basic scaffolding and more on:

- product polish
- operational reliability
- analyst throughput
- better decision support

## Phase 1: Product Hardening And Internal Adoption

### Goal

Make the current MVP easier to trust, easier to explain, and easier to use repeatedly by internal BD users.

### Why this phase comes next

The product now has enough surface area that adoption, comprehension, and workflow smoothness matter more than adding more raw pages.

### Scope

- improve the help center into a polished onboarding path
- add more explicit trust cues where users make decisions
- improve search and browse ergonomics
- refine briefing and shortlist workflows
- make stale-data handling easier to understand

### Recommended work items

1. Complete the internal help center rollout

- finish the full set of help pages
- add annotated screenshots
- add visual workflow diagrams
- link help content contextually from key pages

2. Improve search and navigation quality

- deepen global search ranking and result context
- consider combined search + filter workflows
- improve browse flows across Use Cases, Domains, Companies, and Working Lists

3. Tighten shortlist / working-list usefulness

- improve save-to-shortlist flow from briefing cards
- make shortlist status, owner, next step, and due date easier to scan
- improve shortlist-to-briefing loop

4. Expand trust and freshness visibility

- add more consistent freshness language across pages
- improve stale-record affordances
- make derived vs evidence-backed distinction even more obvious in high-stakes views

### Exit criteria

- a new internal user can navigate the app with minimal coaching
- the help center is genuinely usable as onboarding material
- shortlist workflow supports real BD follow-through
- users can identify freshness and trust boundaries quickly

## Phase 2: Research Operations And Data Pipeline Maturity

### Goal

Turn the current seeded / manually curated model into a more repeatable research operations workflow.

### Why this phase matters

The product value depends on data freshness and evidence quality. The current repo already shows movement toward ingestion operations, so this is the logical next system-level investment.

### Scope

- mature source lead and ingestion candidate workflows
- improve promotion/reconciliation flow into the validated dataset
- strengthen provenance completeness expectations
- support better operational reporting around research readiness

### Recommended work items

1. Operationalize ingestion candidate review

- standardize candidate batch review flows
- make promotion decisions traceable
- improve documentation around ingestion readiness criteria

2. Improve dataset reconciliation

- validate source-to-structured-record completeness
- detect gaps between evidence, signals, capabilities, and mappings
- improve tooling for comparing seed, staged research, and live records

3. Strengthen provenance quality thresholds

- define minimum citation expectations for high-value records
- flag records with weak or missing support
- make provenance completeness visible in admin or review surfaces

4. Build data-quality dashboards or summary views

- stale record counts
- missing citation counts
- pending ingestion items
- failed or skipped enrichment counts

### Exit criteria

- research inputs can move into the system with a repeatable workflow
- provenance gaps are visible rather than hidden
- admins can measure data quality and freshness with less manual effort

## Phase 3: Decision Support And Leadership Readouts

### Goal

Make the system better at turning structured intelligence into reusable decision support outputs.

### Why this phase matters

The PRD is not only about browsing. It is also about helping users form recommendations and brief leadership with defensible intelligence.

### Scope

- improve Use Case briefing quality
- strengthen target comparison logic and readability
- support better exportable artifacts
- improve decision framing around engagement choices

### Recommended work items

1. Deepen briefing pages

- improve mission framing
- improve comparison sections
- expose clearer confidence / uncertainty notes
- make leadership-readout sections tighter and more reusable

2. Expand export outputs

- improve briefing export structure
- support exports tailored to working lists or mission summaries
- consider export-friendly evidence summaries

3. Improve ranking explainability

- refine the rank explainer
- show clearer "why this target vs others" logic
- make pathway, signal, evidence, and freshness tradeoffs more legible

4. Strengthen cross-record synthesis

- compare clusters within a Use Case
- compare domains or mission areas
- identify gaps in supplier depth or scale-ready options more systematically

### Exit criteria

- users can produce stronger internal recommendation outputs with less manual rewriting
- leadership-readout views are credible and concise
- target prioritization is easier to defend in meetings

## Phase 4: Broader AI And Workflow Automation

### Goal

Scale AI-assisted support carefully without undermining trust or human review.

### Why this phase belongs later

The product now has the right trust foundations, but expanding automation too early would create noise faster than value.

### Scope

- broaden enrichment coverage
- strengthen run operations
- improve prompt/version observability
- make AI suggestions more auditable and easier to review

### Recommended work items

1. Support more enrichment handlers

- additional entity types
- more targeted prompts for different record classes
- clearer boundaries for what AI is allowed to suggest

2. Improve enrichment operations

- retry failed runs
- reprocess selected records
- inspect run history
- filter runs by status, source, or outcome

3. Improve AI review usability

- cluster similar suggestions
- display AI rationale more clearly
- show what evidence was used for each suggestion

4. Add feedback loops

- capture reviewer acceptance/rejection patterns
- use those patterns to improve prompts and routing rules

### Exit criteria

- AI support is broader but still reviewable
- enrichment failures are manageable operationally
- reviewer burden stays acceptable

## Recommended Order Of Execution

1. Phase 1
2. Phase 2
3. Phase 3
4. Phase 4

This order keeps the product aligned with the PRD by prioritizing:

- usable discovery
- trusted data
- better decision outputs
- then scaled automation

## Suggested Immediate Sprint Priorities

If only one or two sprints are available, the highest-value slice is:

1. finish the help/onboarding layer
2. improve shortlist workflow and search ergonomics
3. improve stale-data and provenance visibility
4. strengthen ingestion/reconciliation reporting

## Risks To Avoid

- adding more feature surface before tightening the current user workflow
- expanding AI faster than review capacity
- letting ingestion complexity outrun documentation and operational clarity
- over-optimizing leadership outputs before data-quality operations are strong enough

## Summary

The codebase is now at the point where the next development phases should optimize for:

- adoption
- trust
- workflow throughput
- decision quality
- disciplined operational scale

That is the right next chapter for the MVP.
