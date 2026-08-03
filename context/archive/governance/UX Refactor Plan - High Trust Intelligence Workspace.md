# UX Refactor Plan: High Trust Intelligence Workspace

Date: 2026-04-23

## Purpose

Turn the current `Ecosystem Intelligence` MVP into a high-trust intelligence workspace by refactoring the UX around four product behaviors:

1. flexible discovery
2. professional record pages
3. evidence-backed decision support
4. selective engagement orchestration

This plan is grounded in:

- the current product requirements in [PRD.md](</Users/andrewdavies/Documents/Codex/projects/Ecosystem Intelligence/context/governance/PRD.md:1>)
- the current app state described in [Handoff - 2026-04-22.md](</Users/andrewdavies/Documents/Codex/projects/Ecosystem Intelligence/context/governance/Handoff - 2026-04-22.md:1>)
- the competitive UX review in [Competitive UX Research - Ecosystem, Engagement Intelligence, and CRM Apps.md](</Users/andrewdavies/Documents/Codex/projects/Ecosystem Intelligence/context/governance/Competitive UX Research - Ecosystem, Engagement Intelligence, and CRM Apps.md:1>)

## Target Position

The product should not become "a CRM with better research."

It should become:

> a high-trust internal intelligence workspace that helps BD teams discover the right capabilities, understand why they matter, see the evidence behind the recommendation, and coordinate selective next-step engagement without losing governance.

That means:

- discovery remains a first-class workflow
- capability remains the primary decision object
- evidence remains visible at the point of use
- orchestration stays lightweight and selective
- the UX supports action, but does not collapse into generic pipeline CRM behavior

## What The App Already Does Well

The current app already has a strong foundation.

### Current strengths

- multi-entry discovery through Use Cases, Domains, and Companies
- capability-first drilldown
- top engagement targets on Use Case pages
- visible freshness and provenance
- review queue for higher-impact changes
- inline editing on records
- AI-assisted recommendation and enrichment patterns routed through review
- strong internal-MVP tone and visual consistency

### Current weakness pattern

The product has the right building blocks, but they still feel like adjacent features rather than one coherent operating model.

In practice, the UX still feels like:

- a discovery hub
- plus several good record pages
- plus a separate review queue
- plus lightweight search

It does not yet feel like one integrated intelligence workspace.

## Core UX Diagnosis

## 1. Flexible Discovery

Current state:

- strong starting point
- good top-level entry choices
- useful Use Case flow
- search exists, but is still basic

Current gap:

- discovery is split across routes instead of feeling like one flexible exploration system
- filters are strongest inside Use Case detail, weaker elsewhere
- search is entity-aware, but not yet a faceted intelligence workflow
- there is no saved-view, working-list, or segment layer
- there is limited support for comparison, shortlisting, or "continue where I left off"

Result:

- the user can browse, but not yet work fluidly across the ecosystem

## 2. Professional Record Pages

Current state:

- capability and company pages are already good internal-MVP pages
- they include freshness, context, evidence, and inline editing

Current gap:

- page structure is still card-stacked rather than truly opinionated
- not every record answers the same critical questions in the same visual order
- trust, action, recency, and review context are present, but not yet unified
- supporting evidence is still more panel-like than workflow-defining

Result:

- record pages are useful, but they do not yet feel like elite decision surfaces

## 3. Evidence-Backed Decision Support

Current state:

- this is already the product's biggest differentiator
- provenance, freshness, derived-read labeling, and review routing are real

Current gap:

- trust signals are visible, but not yet synthesized into a clear decision-support layer
- evidence exists, but the "so what should I do?" layer is still relatively thin
- confidence, evidence coverage, freshness risk, and missing-data risk are not yet brought together into one decision surface

Result:

- the product is trustworthy in structure, but not yet maximally legible in its decision logic

## 4. Selective Engagement Orchestration

Current state:

- top targets and suggested action types exist
- company pages provide context
- refresh and review workflows exist

Current gap:

- there is no lightweight orchestration layer for targeted follow-through
- the product does not yet support working lists, internal owners, next step, due date, watch state, or engagement status
- there is no deliberate distinction between "interesting" and "active target"
- review and engagement remain too separate

Result:

- the product can recommend action, but not yet help a team carry selected opportunities forward

## Design Principles For The Refactor

These should guide every UX decision.

### 1. Start from the user question, not the object model

The user is usually trying to answer:

- what matters in this space?
- what should we look at first?
- why does this matter now?
- who should we engage, validate, or monitor?

The UI should be organized around those questions before it is organized around raw entities.

### 2. Every important screen should support orientation, judgment, and next action

Every major surface should help the user:

- orient quickly
- judge trust and relevance
- decide what to do next

### 3. Trust must be visible, not implied

The system should always make it obvious:

- how current this is
- what is source-backed
- what is derived
- what was edited by a human
- what is pending review

### 4. Collaboration should live on the record, not outside it

If a team is deciding whether to engage a capability or company, that context should live with the record and mapping.

### 5. Orchestration should remain selective

This product should support targeted follow-through on high-value records.

It should not turn into:

- a generic sales pipeline
- an outbound sequencing tool
- a full contact management platform
- a universal CRM

## Target UX Model

The refactor should move the product toward a four-layer model.

### Layer 1: Discovery Workspace

Helps users move across Use Cases, Domains, Companies, and Capabilities without losing context.

### Layer 2: Record Intelligence Pages

Capability, Company, Domain, and Use Case pages become standardized intelligence surfaces.

### Layer 3: Trust And Review Layer

Freshness, provenance, evidence coverage, review status, and change history become visible across the product, not only on selected panels.

### Layer 4: Engagement Layer

Users can selectively pin, triage, assign, and advance a small set of targets without needing a full CRM motion.

## Refactor Pillars

## Pillar 1: Flexible Discovery

### Goal

Make discovery feel like one coherent system rather than a set of separate browse screens.

### Planned changes

#### A. Turn `/app` into a true discovery workspace

The home page should evolve from a landing hub into a working surface.

It should include:

- a stronger top-level search and filter bar
- "start from" entry cards for Use Case, Domain, Company, and Capability
- recent views / recent records
- saved views or working lists
- items needing attention:
  - stale priority records
  - pending review items
  - watched targets with new signals

This should feel closer to a workspace than a static dashboard.

#### B. Create a shared discovery grammar across browse screens

Use Cases, Domains, Companies, and search should share a more consistent set of behaviors:

- common filter chips
- common sort patterns
- shared card anatomy
- shared trust badges
- common "save to working list" action
- common "compare" action

#### C. Add faceted discovery beyond text search

Current search is useful, but still basic.

Move toward a unified discovery model with filters such as:

- entity type
- domain
- Use Case
- pathway
- relevance band
- defence fit
- freshness state
- review state
- engagement state

This does not have to replace the current search box immediately, but it should become the next-level discovery experience.

#### D. Add saved views / segments / working lists

Borrow from Attio and Common Room here, but keep it lighter.

Users should be able to save:

- filtered views
- target shortlists
- watchlists
- "needs validation" collections
- "candidate engagement targets" collections

This is the bridge between discovery and orchestration.

#### E. Preserve navigation context and comparison

The product already does some context-preserving navigation well.

Extend this into:

- compare selected capabilities side-by-side
- compare companies within the same Use Case
- keep "opened from" context visible
- allow jump-back into the active filtered view

### Outcome

Discovery becomes fluid, resumable, and decision-oriented rather than page-by-page browsing.

## Pillar 2: Professional Record Pages

### Goal

Make every key record page feel like a high-quality intelligence surface with consistent structure and hierarchy.

### Planned changes

#### A. Standardize record-page architecture

Capability and Company pages should adopt a shared page shell:

1. record header
2. intelligence snapshot
3. why it matters / decision context
4. evidence and trust
5. signals and history
6. related records
7. engagement actions
8. edit / review / notes

Not every entity will have the same exact sections, but the mental model should be consistent.

#### B. Create a "snapshot strip" at the top of each record

Each record should open with a scannable summary of the most decision-relevant fields.

For capabilities:

- pathway
- relevance
- defence fit
- freshness
- evidence count
- review status
- engagement state

For companies:

- headquarters
- geography
- domain coverage
- number of tracked capabilities
- recent signal count
- freshness
- engagement state

#### C. Make the primary question visible on the page

Each page should answer one primary question fast.

Capability page:

- should we pay attention to this capability, and why?

Company page:

- is this organization strategically worth attention, and in what way?

Use Case page:

- what matters most in this problem space right now?

Domain page:

- what is the current landscape in this technical area?

#### D. Reorganize pages around summary first, detail second

The first screenful should answer:

- what this is
- why it matters
- how current it is
- what evidence supports it
- what to do next

The rest of the page can go deeper into:

- signals
- citations
- mappings
- company context
- history
- edit controls

#### E. Add a persistent right-rail or side panel on larger screens

This is the professional-record-page move that would likely create the biggest UX lift.

Use the side rail for:

- trust summary
- next best action
- engagement status
- recent review activity
- links to related records
- saved-to-list state

This makes records feel more operational and less like long reports.

### Outcome

Pages become consistent, premium, and easier to use in real BD workflows.

## Pillar 3: Evidence-Backed Decision Support

### Goal

Make the product's trust model unmistakable and useful at the moment of decision.

### Planned changes

#### A. Introduce a decision-support card on key pages

Each Capability and Use Case page should include a structured summary that combines:

- recommendation or action stance
- confidence / strength indicator
- freshness state
- evidence coverage
- last meaningful update
- unresolved review issues if any

The product already has most of this data. The refactor is mainly about synthesis and placement.

#### B. Tie claims directly to evidence

Rather than only having evidence in a dedicated panel, key claims should have inline or adjacent evidence links such as:

- "Why it matters" linked to supporting citations
- "Suggested action" linked to the evidence or rationale behind it
- "Market context" linked to source-backed snippets where possible

This reduces the gap between assertion and proof.

#### C. Add explicit confidence and evidence coverage states

Introduce a lightweight trust vocabulary such as:

- High confidence
- Moderate confidence
- Needs validation
- Stale
- Weak evidence coverage

This should be computed from existing freshness, provenance, and citation presence rather than invented manually for every record.

#### D. Surface decision risk, not just recommendation

Good intelligence UX does not only say what to do.

It also says:

- what is uncertain
- what might be outdated
- what is inferred
- what still needs validation

This is especially important for top targets and derived reads.

#### E. Bring review history closer to the record

The review queue is good, but record pages should show:

- last reviewed date
- pending review count
- recently accepted changes
- whether the current read depends on derived content

This helps the record itself carry its trust posture.

### Outcome

The app becomes legibly trustworthy, not just structurally trustworthy.

## Pillar 4: Selective Engagement Orchestration

### Goal

Support follow-through on important targets without turning the product into generic CRM.

### Planned changes

#### A. Introduce lightweight target states

At the capability or mapping level, support a small set of internal states such as:

- Watch
- Validate
- Engage
- Hold
- Archive

This is enough to coordinate real follow-through without building a full pipeline.

#### B. Add working-list workflows

Users should be able to collect records into lists such as:

- Arctic priority targets
- Needs evidence review
- Q2 engagement candidates
- Monitor for new signals

Each list should allow a few lightweight fields:

- owner
- priority
- next step
- due date
- last note

This is the minimum viable orchestration layer.

#### C. Add internal notes and rationale attached to records or mappings

The product currently supports editing and review, but not yet enough team-context accumulation.

Add note types such as:

- analyst note
- engagement rationale
- validation question
- leadership prep note

These should be visible on the record and optionally in the list context.

#### D. Promote "selective activation" over blanket orchestration

Only a subset of records should move into orchestration.

That means:

- default browse state stays analytical
- activation happens only when a user saves to a working list or marks a target state
- the system does not force an engagement field onto every record in the corpus

#### E. Keep people/contact workflows secondary

Do not shift the center of gravity away from capability intelligence.

If contact or relationship features are added later, they should support:

- who to talk to
- who knows them
- what intro path exists

They should not replace the capability/mapping decision model.

### Outcome

The product can support meaningful next steps while still remaining an intelligence workspace first.

## Route-By-Route Refactor Plan

## `/app`

### Current role

- balanced discovery hub

### Future role

- primary discovery workspace

### Key moves

- stronger unified search + filters
- recent views / recent records
- watched targets / attention items
- saved views and working lists
- better "continue analysis" behavior

## `/use-cases`

### Current role

- browse list

### Future role

- mission-lens directory with stronger comparison and shortlist support

### Key moves

- richer filters and sorts
- featured / stale / active target indicators
- save to list
- compare Use Cases or open in split context later

## `/use-cases/[slug]`

### Current role

- strongest decision screen in the product

### Future role

- flagship intelligence workspace for a problem space

### Key moves

- keep decision guide and top targets
- add stronger evidence overview and confidence framing
- persist and save filtered views
- add shortlist / compare / working-list actions
- surface active engagement candidates separately from browse results

## `/capabilities/[id]`

### Current role

- good record page with mappings, signals, and evidence

### Future role

- canonical intelligence record page

### Key moves

- stronger snapshot strip
- next-best-action card
- review and trust summary in side rail
- linked evidence at point of claim
- engagement state and working-list actions
- internal notes / rationale

## `/companies/[id]`

### Current role

- portfolio and market context page

### Future role

- organization intelligence page supporting capability evaluation and engagement context

### Key moves

- stronger company snapshot
- strategic worth / engagement stance summary
- better portfolio prioritization
- clearer distinction between company context and capability evidence
- notes, owner, target-state support when activated

## `/review`

### Current role

- separate review queue

### Future role

- central governance workspace plus context surface inside records

### Key moves

- keep queue
- add easier jump-back to source context
- show review status from record pages
- eventually allow list-based triage for related review items

## Recommended Delivery Sequence

This should be phased so the UX grows coherently.

## Phase 1: Shared UX Foundation

Goal:

- establish the information architecture and visual grammar for a workspace product

Deliver:

- shared record shell pattern
- shared discovery card anatomy
- common trust badge language
- common action vocabulary:
  - save
  - compare
  - watch
  - validate
  - engage

Why first:

- this is the structural base for everything else

## Phase 2: Discovery Refactor

Goal:

- make the product feel fluid to explore

Deliver:

- stronger `/app` workspace
- faceted discovery
- saved views / working lists
- compare flow
- route-consistent search and filter behavior

Why second:

- flexible discovery is the front door to the entire product promise

## Phase 3: Record Page Refactor

Goal:

- turn Capability and Company pages into professional intelligence records

Deliver:

- snapshot strip
- right-rail trust and action panel
- unified record structure
- inline evidence links on major claims
- recent review and change summary

Why third:

- once discovery improves, record pages become the critical conversion point from exploration to judgment

## Phase 4: Decision-Support Layer

Goal:

- make trust and recommendation quality more legible

Deliver:

- decision-support cards
- confidence / evidence coverage states
- risk / uncertainty framing
- record-level trust synthesis

Why fourth:

- this is where the app becomes unmistakably high-trust

## Phase 5: Selective Orchestration Layer

Goal:

- support action on a small number of records without CRM sprawl

Deliver:

- working lists
- target states
- owner / next step / due date
- analyst notes and rationale
- watched target updates

Why fifth:

- orchestration is most valuable after discovery and record trust are already strong

## Suggested Implementation Chunks

To keep this practical, the engineering work should likely break into these chunks:

1. shared UI primitives for trust, status, snapshot, and action controls
2. discovery-state model:
   - filters
   - saved views
   - working lists
3. record-page view-model updates for snapshot and trust summaries
4. evidence-linking patterns inside decision text
5. lightweight orchestration schema and UI
6. notes / rationale / collaboration support

## Guardrails

These are important.

### Do not become a generic CRM

Avoid:

- opportunity stages
- universal deal boards
- activity logging as the main product behavior
- contact-first navigation
- broad outbound workflow automation

### Do not hide evidence behind AI summaries

Avoid:

- unsupported recommendations
- opaque scoring
- long derived summaries without nearby proof

### Do not make every record operational

Avoid:

- forcing engagement status onto the full dataset
- cluttering browse views with fields that matter only to active targets

### Do not split trust into a separate governance corner

Trust should stay visible where users make decisions, not only inside `/review`.

## Success Criteria

The refactor is succeeding if the product makes it faster and safer to answer:

- what matters in this ecosystem right now?
- which capabilities deserve attention first?
- why do we believe that?
- what is uncertain or stale?
- what should our team do next with the few targets that actually matter?

More concrete UX signals:

- users can move from question to shortlist with fewer route jumps
- users can see recommendation, trust, and evidence without hunting
- record pages have a consistent professional anatomy
- teams can maintain shortlists and next steps inside the product
- review and trust context are visible during normal usage, not only in governance workflows

## Recommended First Build

This section has been updated after the capability-centric market research and current codebase assessment.

The next near-term UX package should be:

### "BD Validation Readiness Pass"

That package should include:

- a Use Case briefing view for leadership-ready discussion
- comparative target cards for top 3-5 engagement candidates
- clear "why this / why not others" reasoning
- evidence, confidence, and uncertainty displayed next to each recommendation
- first-class gap and coverage summaries
- shortlist / working-list foundation with Watch, Validate, Engage, and Hold states
- one polished Arctic Domain Awareness demo path for guided BD conversations

Why:

- the product is now close enough to the correct job that the highest-value work is proving decision support with BD users, not adding broad platform scope.

The original UX foundation package remains useful, but it is no longer the whole near-term priority.

### "Discovery And Record Trust Pass"

That package would include:

- a stronger `/app` discovery workspace
- saved views / working lists foundation
- capability-page snapshot + trust side rail
- company-page snapshot + trust side rail
- inline evidence links for key decision fields

Why:

- it creates the clearest shift toward a high-trust intelligence workspace without prematurely overbuilding orchestration

## BD Validation Gate

Do not move to broad internal BD sharing until the app can support this workflow:

1. start from a mission or Use Case
2. identify the strongest 3-5 targets
3. explain why each target matters now
4. compare strengths, limitations, and tradeoffs
5. show evidence and confidence
6. identify gaps or weak coverage
7. preserve a shortlist and next step

The detailed project map for this validation phase is:

- `context/governance/BD Validation Project Map.md`

## 2026-04-25 Addendum: BD Client Familiarity Pass

The next UX concern before BD-client exposure is not only whether the app can support the validation workflow. It is whether the app feels familiar enough to users who expect PitchBook, AlphaSense, Govini Ark, Janes, Crunchbase, Dealroom, or similar intelligence/data-platform interfaces.

The newer benchmark memo is:

- [BD Client UX Benchmark Review - Traditional Intelligence Platforms.md](</Users/andrewdavies/Documents/Codex/projects/Ecosystem Intelligence/context/governance/BD Client UX Benchmark Review - Traditional Intelligence Platforms.md:1>)

Updated interpretation:

- keep the high-trust intelligence workspace direction
- preserve the capability-first, evidence-backed workflow
- make the outer shell more conventional and data-platform-like before external BD validation

Highest-value UX package:

### "BD Familiarity Pass"

That package should include:

- desktop left-sidebar navigation
- persistent top global search
- compact dashboard-style `/app`
- table-first browse patterns for companies and targets
- clearer saved-list / shortlist language
- reduced decorative chrome on operational pages
- client/demo mode that hides internal admin scaffolding

Why:

- BD clients trained on PitchBook-style products need familiar search, lists, profiles, filters, and dashboards before they can appreciate the app's more differentiated mission/capability intelligence layer.
- This pass should change UX grammar, not product scope.
- The app should feel more like a professional intelligence platform and less like a bespoke internal portal.

### 2026-04-25 Implementation Status

The disciplined UX refactor is being implemented as a no-workflow-change pass.

Completed in this slice:

- Reframed the app shell around a desktop left-sidebar pattern with grouped Workspace, Intelligence, Support, and Internal navigation.
- Added persistent desktop global search while keeping the existing `/api/search` behavior and result model.
- Reworked `/app` into a compact BD dashboard with mission-control actions, saved lists, demo path, metrics, and attention queue.
- Added a table-first desktop scan view to `/companies` while retaining the existing client-side filters and mobile card view.
- Added a table-first desktop target scan to Use Case detail pages while retaining the existing target cards, derived reads, and shortlist controls.
- Reduced decorative chrome through global visual tokens so operational pages feel closer to familiar intelligence/data platforms.
- Updated in-app help so the documented workflow matches the Dashboard, table scan, briefing, and shortlist path.

Still deferred:

- Demo/client mode that hides internal admin scaffolding.
- A true faceted global discovery page beyond the current entity-aware search.
- Record-page standardization beyond the Dashboard, Companies browse, and Use Case target scan surfaces.

### 2026-04-25 Final Style Pass: COVE Alignment

The final visual pass aligns the product with the COVE site brand audit without changing application logic or workflows.

Implemented:

- Removed the centered max-width app frame so authenticated pages use the full available viewport width.
- Replaced the large mobile intro card with a compact dark mobile app bar and horizontally scrollable navigation.
- Loaded Montserrat for display typography and Open Sans for interface/body typography.
- Shifted the palette toward COVE's charcoal, black, ocean blue, cyan, white, and light-grey system.
- Squared off the shared card, badge, input, and button primitives to move away from soft SaaS chrome.
- Preserved light data panels inside the darker institutional shell so tables, filters, and dense records remain easy to scan.
- Adjusted plain-link styling so intentional white/dark navigation colors are not overridden by global link defaults.

## Final Take

The product already has the right underlying logic.

The next UX phase should not be a broad redesign. It should be a disciplined refactor that:

- unifies discovery
- sharpens record hierarchy
- makes trust more legible
- adds lightweight activation for a small number of meaningful targets

If done well, the app will feel less like an internal tool with several strong pages and more like a professional intelligence workspace designed for real BD judgment and action.
