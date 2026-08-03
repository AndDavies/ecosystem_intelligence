# BD Client UX Benchmark Review: Traditional Intelligence Platforms

Date: 2026-04-25

## Purpose

This memo reviews the current `Ecosystem Intelligence` UX against more familiar intelligence and data-platform references before sharing the app with BD clients.

The user concern is directionally right: the product has a strong intelligence model, but it does not yet feel familiar enough to users trained on tools such as PitchBook, Govini Ark, Janes, AlphaSense, Crunchbase, Dealroom, or similar dashboard/profile/search platforms.

The goal is not to copy these products. The goal is to make the app feel professionally legible to BD users while preserving the capability-first, evidence-backed, mission-oriented workflow.

## Research Scope And Caveat

This review uses public product pages, help pages, documentation, and visible product screenshots/alt text. It is not a hands-on logged-in usability test of each commercial platform.

The strongest available public signals are:

- product positioning
- navigation and information architecture
- workflow names
- screenshot alt text and public feature descriptions
- help documentation for saved searches, alerts, dashboards, and lists
- public descriptions of data model, trust, workflow, and reporting patterns

## Reference Products Reviewed

### PitchBook

Useful reference because it is the most familiar private-market BD/intelligence mental model.

Public UX signals:

- PitchBook organizes around use cases, data objects, platform capabilities, and segments.
- The Desktop product emphasizes search, filtering, benchmarking, profiles, saved searches, alerts, research, market maps, and analyst workspaces.
- PitchBook’s business-development positioning emphasizes prospect sourcing, relationship mapping, market intelligence, timely alerts, contacts, and CRM integration.
- Its CRM integration reinforces a familiar pattern: enrich existing account/contact workflows rather than forcing users into a strange new operating model.

What to borrow:

- conventional object navigation: Companies, Deals/Signals, People, Investors/Partners, Lists, Alerts
- dense list/table views with filter chips and configurable columns
- saved searches and custom alerts as first-class workflow primitives
- profile pages that feel like durable records, not narrative cards
- market maps and analyst workspaces as familiar names for landscape/briefing views

What not to copy:

- investment-market vocabulary that does not fit defence capability discovery
- a pure company-first model that would weaken the app's use-case and capability advantage
- CRM integration as a near-term requirement

Sources:

- [PitchBook Desktop](https://pitchbook.com/products/desktop)
- [PitchBook Business Development](https://pitchbook.com/use-cases/business-development)
- [PitchBook CRM Integration](https://pitchbook.com/products/crm-integration)
- [PitchBook Platform Products](https://pitchbook.com/products)

### Govini Ark

Useful reference because it is defence/acquisition-native and workflow-forward.

Public UX signals:

- Ark frames the product as purpose-built defence acquisition software.
- It organizes by applications: Supply Chain, Science & Technology, Production, Sustainment, Logistics, and Modernization.
- Each application has guided workflows, named operational jobs, application hubs, risk indicators, and measurable outcomes.
- Public screenshots point toward maps, flow charts, line charts, risk tables, network analysis, and report generators.
- Ark strongly emphasizes security posture, including FedRAMP High and IL5 language.

What to borrow:

- application hubs for major mission/BD workflows
- named workflows instead of generic feature labels
- risk indicators and outcome cards
- guided paths for "what do I do next?"
- public security/trust posture that BD and government-adjacent users expect

What not to copy:

- heavy acquisition-program framing unless the app explicitly moves into procurement
- a government-only workflow language that may be too narrow for internal BD users
- complex operational workflow automation before the current decision-support wedge is validated

Sources:

- [Govini Ark](https://www.govini.com/products/ark)
- [Ark Supply Chain](https://www.govini.com/products/ark/supply-chain)
- [Ark Science & Technology](https://www.govini.com/products/ark/science-and-technology)
- [Ark Logistics](https://www.govini.com/products/ark/logistics)

### Janes Defence Intelligence

Useful reference because it represents a trusted defence intelligence product, not a startup/VC database.

Public UX signals:

- Janes emphasizes trusted, verified, mission-critical defence insight, analysis, and context.
- Navigation is organized around intelligence categories, user segments, and mission support.
- Mission-support language includes inform decision-making, situational understanding, operational planning, data integration, and market understanding.
- Janes is explicit about verified open-source defence intelligence, analyst effort, and integration into high- and low-side environments.

What to borrow:

- clearer "mission support" navigation language
- stronger visible separation between foundational intelligence, current intelligence, strategic intelligence, and market understanding
- trust language around verified OSINT, analyst review, and data currency
- a more serious defence-intelligence tone on pages shown to external users

What not to copy:

- broad all-source/OSINT platform ambition
- generic defence encyclopedia UX that stops at "what exists" instead of "who to engage next"

Sources:

- [Janes Defence Intelligence](https://www.janes.com/defence-intelligence)

### AlphaSense

Useful reference because it is a research-workflow platform with strong search, monitoring, and AI synthesis patterns.

Public UX signals:

- AlphaSense positions around trusted market and financial intelligence, AI search, Deep Research, expert transcripts, monitoring, dashboards, and collaboration.
- Search is the central entry point, with filters, saved searches, alerts, and direct links back into the platform.
- Help documentation makes saved searches, email alerts, dashboards, alert frequency, executive brief templates, and table/card delivery explicit.
- Deep Research emphasizes full research logs, source-backed outputs, and complex reports generated from trusted content.

What to borrow:

- prominent global search as a primary workspace control, not a secondary page section
- saved searches, alerts, and dashboards as obvious reusable objects
- research logs / "how this answer was formed" for AI or derived reads
- briefings as generated but source-linked outputs
- monitoring and alerting language for watchlist-style BD workflows

What not to copy:

- generic market-intelligence search as the whole product
- AI-generated reports without the app's stronger capability/use-case structure

Sources:

- [AlphaSense Market Intelligence Platform](https://www.alpha-sense.com/)
- [AlphaSense Deep Research](https://www.alpha-sense.com/resources/research-articles/deep-research-market-intelligence/)
- [AlphaSense saved searches and alerts](https://help.alpha-sense.com/en/articles/4613941-saving-searches-and-building-alerts)
- [AlphaSense Expert Insights](https://www.alpha-sense.com/platform/expert-insights/expert-transcripts/)

### Crunchbase And Dealroom

Useful references because they teach the standard startup/company discovery pattern.

Public UX signals:

- Crunchbase makes searches, lists, alerts, AI search builder, saved search/list privacy, and adjustable columns explicit.
- Dealroom emphasizes startup/growth-company discovery, rich company descriptions, funding data, locations, growth signals, similar companies, teams, ecosystem dashboards, and government/economic-development use.
- Dealroom also publicly describes AI-powered data collection, manual verification, taxonomy, and ecosystem partner data.

What to borrow:

- familiar table/list/search workflows
- "saved list" and "saved search" language
- adjustable columns and visible filter state
- ecosystem dashboard pattern for domain/use-case landscapes
- similar companies / related capabilities as record-page primitives

What not to copy:

- broad startup database feel
- investor-first language
- raw list density without the mission decision layer

Sources:

- [Crunchbase Searches, Lists, Alerts](https://support.crunchbase.com/hc/en-us/sections/115002795687-Searches-Lists-Alerts)
- [Dealroom overview](https://knowledge.dealroom.co/knowledge/what-is-dealroom.co)
- [Dealroom data](https://dealroom.co/our-data/)

### Palantir AIP / Foundry

Useful reference for decision-centric data modeling and trust/governance, not for lightweight BD usability.

Public UX signals:

- Palantir describes its ontology as representing decisions, not simply data.
- Its model breaks decisions into data, logic, and actions.
- It emphasizes human + AI workflows, proposals for operators to review, analytics that write back into governed models, permissions, audit logging, and security.

What to borrow:

- decision-centric model: facts, logic, actions
- proposal/review pattern for AI-assisted changes
- visible governance around action, permission, audit, and data lineage
- "object views" as a framing for record pages

What not to copy:

- platform complexity
- builder/developer mental model
- operational AI automation before the current BD workflow is validated

Sources:

- [Palantir Platform Overview](https://www.palantir.com/docs/foundry/platform-overview/overview)

## Current App UX Assessment

### What is strong

- The app's conceptual model is differentiated: Use Cases, Domains, Companies, Capabilities, evidence, freshness, review, and shortlists all support a real BD decision workflow.
- The briefing route is a strong wedge because it does what PitchBook-style databases usually do not: it moves from landscape to recommendation and tradeoff.
- The product already has visible trust language: freshness, citations, derived reads, review routing, and policy alignment.
- The app avoids premature CRM sprawl, which is strategically correct.

### What feels unfamiliar or less conducive for BD clients

1. The app shell feels bespoke rather than platform-like.

The large rounded top header, serif display type, parchment background, and pill navigation create a polished internal-workspace feel, but they do not resemble the denser left-nav/top-search rhythm of PitchBook, Crunchbase, Govini, AlphaSense, or Janes-style products.

2. The home page reads more like a narrative launch page than a working dashboard.

Traditional BD users expect a dashboard to show saved views, recent activity, alerts, watchlists, changed records, top opportunities, and quick filters. The current `/app` page explains the product well, but it is less obviously a daily working surface.

3. Search is too low in the hierarchy.

PitchBook and AlphaSense teach users that search is the primary control. In the current app, search exists but is not visually dominant enough to anchor unfamiliar users.

4. Browse pages need more conventional list density.

The company/use-case/domain browse routes are visually warm and readable, but BD users coming from PitchBook-like tools expect tables, columns, sorting, saved filters, and quick comparison. Cards alone can feel slower and less data-platform-like.

5. Page labels are product-specific.

"Use Case", "Domain", "Briefing", "Capability", and "Derived read" are accurate, but some BD users may map faster to "Markets", "Mission Areas", "Targets", "Signals", "Lists", "Evidence", and "Watchlist".

6. Briefing pages are useful but not yet dashboard-conventional.

The briefing route is strategically excellent, but the visual form is still card-heavy. A BD client may expect a tighter "one-page brief" layout with top targets, evidence posture, gaps, and next steps in a more compact executive summary.

7. Trust is visible, but not yet standardized as a compact scorecard.

The app has the underlying trust signals. It needs a more repeatable trust strip: Evidence, Freshness, Source Count, Derived/Verified, Review State.

8. External-client mode is missing.

The current app exposes admin/review/help/internal language and a visible signed-in user panel. Before showing BD clients, the product likely needs a cleaner "client demo mode" or "validation mode" that hides internal scaffolding and emphasizes the workflow.

## Design Direction

The best direction is not "make it look exactly like PitchBook." The better direction is:

> Keep the mission/capability intelligence model, but wrap it in a more conventional intelligence-platform interface: left navigation, persistent global search, saved views, table/list density, compact record headers, and dashboard-like status surfaces.

That would make the app feel more familiar without sacrificing the differentiated workflow.

## Recommended UX Refactor

### 1. Replace the current app shell with a more conventional intelligence-platform shell

Priority: Very high

Recommended changes:

- Move primary navigation into a persistent left sidebar on desktop.
- Use a compact top bar with global search, saved views, and user/actions.
- Keep the current mobile stacked header only for narrow screens.
- Reduce decorative header height by 60-70% on desktop.
- Add active route states and section grouping:
  - Workspace
  - Markets / Use Cases
  - Companies
  - Capabilities
  - Domains
  - Lists
  - Signals
  - Review / Admin

Why this matters:

This is the single biggest familiarity unlock. BD users know how to orient inside left-nav data products.

### 2. Turn `/app` into a real dashboard/workspace

Priority: Very high

Recommended sections:

- global search bar at the top
- "Continue where you left off"
- saved shortlists / working lists
- saved searches or views
- new/stale/changed signals
- top mission areas
- attention queue:
  - stale high-priority records
  - uncited high-priority targets
  - newly added companies
  - pending reviews

Rename option:

- `/app` can remain the route, but the UI should call it "Workspace" or "Dashboard".

Why this matters:

PitchBook, AlphaSense, and Ark all make the first screen feel like a control surface. The current home page feels like a product explanation.

### 3. Add table/list views for Companies, Capabilities, and Use Case targets

Priority: Very high

Recommended changes:

- Companies page:
  - default to a compact table on desktop
  - columns: Company, HQ, Domains, Use Cases, Capabilities, Strongest Score, Latest Signal, Evidence, Shortlist Status
  - card view can remain as an alternate view
- Use Case detail:
  - convert top targets into a table + selected target drawer option
  - keep cards for briefing mode
- Capabilities:
  - add a first-class browse route or table within use-case/domain/company context

Why this matters:

BD users often want scan speed first, detail second. Cards are good for explanation; tables are better for screening.

### 4. Make global search a dominant product primitive

Priority: High

Recommended changes:

- Persistent top search across all desktop pages.
- Search should support entity filters: all, companies, capabilities, use cases, domains, sources.
- Add empty-state shortcuts:
  - Browse companies
  - Browse use cases
  - Open saved lists
  - View recent signals
- Add saved search support later if validation supports it.

Why this matters:

PitchBook and AlphaSense are search-native. If search feels secondary, the app feels unfamiliar even if the underlying data is strong.

### 5. Standardize record pages into professional profile anatomy

Priority: High

Recommended anatomy:

1. Compact profile header:
   - name
   - type
   - location/domain/use-case links
   - confidence/evidence/freshness strip
   - primary action
2. Intelligence summary:
   - what it is
   - why it matters
   - why now
3. Relationship/mapping section:
   - linked capabilities
   - linked companies
   - linked use cases
4. Signals:
   - latest activity
   - source-backed changes
5. Evidence:
   - citations and snippets
6. Actions:
   - add to shortlist
   - request refresh
   - edit/review

Why this matters:

PitchBook-like users expect profile pages to have predictable information hierarchy. The app should not require users to relearn page structure on every entity type.

### 6. Introduce "Market Map" or "Landscape" views

Priority: Medium-high

Recommended route concepts:

- `/use-cases/[slug]/landscape`
- `/domains/[slug]/landscape`

Recommended contents:

- target table
- cluster distribution
- maturity/pathway distribution
- geography distribution
- evidence/freshness distribution
- top gaps
- saved view / export

Why this matters:

"Market map" is familiar to PitchBook/CB Insights/Dealroom users and maps well to the current use-case/domain model.

### 7. Add compact trust scorecards

Priority: Medium-high

Recommended trust strip:

- Evidence: Strong / Moderate / Thin
- Freshness: Fresh / Aging / Stale
- Source Count
- Review State
- Derived vs Verified

Apply it to:

- target cards
- company rows
- capability rows
- briefing export
- search results

Why this matters:

The app's trust model is a differentiator, but it should feel like a consistent UI primitive rather than scattered badges.

### 8. Add a client/demo mode before BD exposure

Priority: Medium-high

Recommended changes:

- Hide or downplay Admin, Review, and internal user details.
- Add a "Demo path" rail:
  - Open mission area
  - Review landscape
  - Compare targets
  - Save shortlist
  - Export brief
- Use external-friendly labels:
  - "Evidence-backed analysis"
  - "Public-source alignment"
  - "Suggested validation step"
  - "Known gaps"

Why this matters:

External users should see a polished decision workflow, not internal scaffolding.

## Proposed Information Architecture

### Desktop Shell

Left sidebar:

- Dashboard
- Search
- Markets
- Companies
- Capabilities
- Domains
- Shortlists
- Signals
- Help

Admin-only:

- Review
- Taxonomy
- Enrichment

Top bar:

- global search
- saved views
- recent
- export/share/demo controls

Main area:

- dense data surface
- right-side detail drawer where useful
- record pages when deeper context is needed

### Route Naming Options

Current route | User-facing label option
--- | ---
`/app` | Dashboard or Workspace
`/use-cases` | Markets / Mission Areas
`/domains` | Domains
`/companies` | Companies
`/shortlists` | Lists or Shortlists
`/use-cases/[slug]/briefing` | Briefing
future `/use-cases/[slug]/landscape` | Market Map / Landscape

Recommendation:

- Keep the route names for now.
- Adjust user-facing labels gradually.
- Use "Mission Areas" or "Markets" only if BD users find "Use Cases" confusing.

## Visual Design Recommendations

### Current visual read

The current style is warm, polished, and distinctive. It feels like a high-trust internal workspace, but less like a familiar market-intelligence dashboard.

Potential issue:

- The parchment background, large rounded cards, serif headings, and pill nav make the product feel custom and editorial.
- BD clients may expect denser, sharper, more enterprise-data-platform surfaces.

### Recommended visual shift

Move from:

- warm editorial workspace
- large card stacks
- rounded pill navigation
- explanatory hero sections

Toward:

- compact intelligence platform
- neutral dashboard shell
- left nav and top search
- data-dense tables
- consistent profile headers
- compact status badges
- optional cards for briefing/executive mode

### Suggested palette adjustment

Keep:

- defence green as primary
- muted tan as subtle background
- blue links

Reduce:

- heavy cream/paper surfaces
- oversized rounded panels
- decorative gradients on operational pages

Add:

- neutral slate/white data surfaces
- stronger table borders and row hover
- compact badge system
- a more restrained executive-dashboard feel

## Recommended Implementation Phases

### Phase A: BD Familiarity Pass

Goal:

Make the app feel familiar to PitchBook/AlphaSense-style users without changing functionality.

Scope:

- desktop left sidebar shell
- compact top search
- dashboard-style `/app`
- denser browse-page headers
- reduce decorative chrome
- preserve current routes and data model

Acceptance criteria:

- A new BD user can identify search, companies, mission areas, and lists within 10 seconds.
- The app feels like a professional intelligence/data product rather than a bespoke internal portal.
- Admin/review controls are less visually dominant for non-admin/demo contexts.

### Phase B: Data-Platform Browse Pass

Goal:

Make companies, capabilities, and targets easier to scan like a familiar market-intelligence database.

Scope:

- companies table view
- target table view on Use Case detail
- configurable visible columns, even if columns are hard-coded initially
- stronger filters and active filter chips
- saved view placeholder or lightweight implementation

Acceptance criteria:

- A BD user can scan 20-50 records faster than with card-only pages.
- Filters, sort, and current result count are obvious.
- Users can move from row to profile or briefing without losing context.

### Phase C: Record/Profile Standardization

Goal:

Make every major entity page feel like a professional profile.

Scope:

- compact profile headers
- trust strip
- standardized tabs/sections
- right-side action rail
- evidence and latest-signal sections in consistent positions

Acceptance criteria:

- Company, capability, domain, and use-case pages follow the same orientation pattern.
- Trust/freshness/evidence status is visible above the fold.
- Add-to-shortlist and briefing actions are consistently located.

### Phase D: Landscape And Briefing Refinement

Goal:

Make the differentiated mission-intelligence layer feel like a familiar market-map and briefing workflow.

Scope:

- landscape/market-map route
- print-friendly executive briefing view
- cleaner briefing export
- top target comparison table
- gap/risk panel

Acceptance criteria:

- A BD user can present a Use Case landscape without explaining the product model first.
- The briefing reads like a concise intelligence output, not a stack of cards.

### Phase E: Validation Feedback And Monitoring

Goal:

Support the BD validation process without adding CRM sprawl.

Scope:

- validation feedback capture
- saved search / watchlist / alert placeholder
- new-signal watchlist surface
- shortlist history

Acceptance criteria:

- Each BD validation session leaves structured feedback.
- The app can show what changed since a target was shortlisted.
- Follow-up remains lightweight and intelligence-led.

## Highest-Value First Build

Recommended first build before client exposure:

### BD Familiarity Pass

Implement:

1. desktop left-sidebar shell
2. persistent top global search
3. compact dashboard-style `/app`
4. client/demo mode visual simplification
5. denser Companies page with table-first browse

Why this should go first:

- It addresses the user's concern directly.
- It reduces unfamiliarity without changing the product's core logic.
- It makes the product easier to show before the data set is fully expanded.
- It creates the foundation for later PitchBook-like saved views, alerts, and market maps.

## Strategic Recommendation

The app should not become PitchBook for defence.

PitchBook is a broad private-market data product. `Ecosystem Intelligence` is strongest when it becomes:

> a mission-oriented intelligence workspace that feels familiar like a market-intelligence platform, but closes a different decision: who should we engage for this capability problem, why now, what evidence supports it, and what remains uncertain?

The UI should borrow conventional dashboard/database grammar so BD users feel at home. The product should keep its differentiated mission/capability/evidence model so it does not become another searchable company list.
