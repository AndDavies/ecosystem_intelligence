# Business Intelligence Usability Audit - 2026-04-28

## Executive Verdict

Ecosystem Intelligence is pointed at the right niche: a capability-centric business intelligence and engagement-management workspace for defence and strategic-tech BD users. The repo, PRD, Market Map, and implemented app all converge on the same high-value job:

> Given a mission or use case, help a BD or engagement lead decide who to engage first, why them, why now, what evidence supports the read, what gaps remain, and what next step should be taken.

The main product risk is no longer whether the intelligence model is conceptually strong. It is whether a first-time operator can understand the entry paths quickly enough to trust and use it without a guided demo. The app currently works best when the user already knows the intended flow: Dashboard -> Use Case -> Briefing -> top targets -> shortlist. It becomes less clear when the user starts from a domain, a company, a capability, or a vague question like "who should I engage for northern logistics?"

The most important improvement is therefore not more features. It is a clarity pass that makes the app feel like a simple engagement decision workspace:

1. Rename and explain the core entry paths in user language.
2. Make each Use Case answer "what decision does this support?" before showing dense intelligence.
3. Make Domains visibly secondary to mission/use-case discovery.
4. Compress the briefing into a faster target decision surface.
5. Preserve decisions from every route, not only the Use Case briefing.

## Scope Reviewed

Local repo and governance files reviewed:

- `AGENTS.md`
- `context/governance/PRD.md`
- `context/governance/BD Validation Project Map.md`
- `context/governance/Handoff - 2026-04-22.md`
- `context/governance/Internal Wiki Plan.md`
- `context/governance/UX Refactor Plan - High Trust Intelligence Workspace.md`
- `context/governance/Competitive UX Research - Ecosystem, Engagement Intelligence, and CRM Apps.md`
- `context/governance/BD Client UX Benchmark Review - Traditional Intelligence Platforms.md`
- `context/governance/Research/Market Map for Capability-Centric Business Intelligence in Defence and Strategic Tech.md`
- Current app routes, components, repository layer, scoring, use-case config, help content, and seed data.

Validation run:

- `pnpm test` - passed, 13 files / 39 tests.
- `pnpm lint` - passed.
- `pnpm seed:validate` - passed.
- `pnpm ingest:validate` - passed.
- `pnpm build` - passed.
- Browser walkthrough on mock-data mode: `/app`, `/use-cases`, `/use-cases/arctic-domain-awareness/briefing`, `/domains`, `/companies`.

Browser QA caveat:

- Normal Supabase-backed browser access redirects to `/sign-in`, so anonymous workflow QA was blocked without credentials.
- Mock mode is useful for route inspection but is not representative of the current seed data. The current seed has 8 use cases, 21 companies, and 26 capabilities, while the mock browser walkthrough exposed only 2 use cases and 3 companies. This is a demo risk if mock mode is ever used in validation.

## Market Map Contrast

The Market Map conclusion still holds. The competitive gap is not "another database." It is decision support for engagement managers who need to move from mission problem to defensible shortlist.

The current app aligns well with the Market Map in these areas:

| Market Map requirement | Current app status | Audit read |
| --- | --- | --- |
| Start from mission/use case | Implemented through `/use-cases`, dashboard actions, and use-case detail pages | Directionally correct, but the label "Use Cases" is still too product-internal for some first-time users. |
| Make capability first-class | Implemented through capability records, mappings, evidence, signals, and ranking | Strong foundation. Capability pages are among the clearest record surfaces. |
| Ranked shortlist, not exhaustive list | Implemented through top engagement targets and briefing target cards | Strongest niche-aligned feature. Needs compression and clearer score logic. |
| Explain why now / why not others | Implemented in briefing target cards | Excellent strategic differentiator, but text can feel templated unless use-case-specific copy expands. |
| Separate fact, inference, and AI assistance | Implemented through citations, derived-read labels, review provenance, and evidence posture | Trust model is visible, but sometimes interrupts readability. Needs a compact trust scorecard. |
| Highlight white space and gaps | Implemented in coverage gaps and held-gap list | Good and distinctive. Needs consistent placement near decision moments. |
| Preserve institutional memory | Implemented in shortlists | Solid start, but shortlist capture is too concentrated in the briefing route. |
| Fit engagement manager cadence | Partially implemented | Briefing + shortlist are right. Dashboard, domains, and companies still feel more like browsing than an engagement manager's weekly operating surface. |

Bottom line: the app is closer to the Market Map niche than to a generic CRM or market database. The risk is that unclear information architecture makes users experience it as "a database with reports" before they experience it as "the shortest path to a defensible engagement decision."

## Competitive Findings

### Govini Ark

Govini Ark publicly positions around defence acquisition workflows, integrated commercial/government data, guided workflows, and application hubs across supply chain, S&T, production, sustainment, logistics, and modernization. It does well at making the product feel purpose-built for defence acquisition and workflow-heavy rather than just searchable data.

Implication for Ecosystem Intelligence:

- Keep the defence-specific workflow posture.
- Avoid trying to match Govini's platform breadth.
- Win earlier in the BD workflow: "which organizations should we engage first for this mission problem?"

Source: https://www.govini.com/products/ark

### Janes

Janes emphasizes verified, structured defence intelligence that leaders can brief, defend, share, and integrate into workflows. Its public product language is strong on trust, validated data, and decision-ready intelligence.

Implication:

- The current evidence/provenance model is a real strength.
- The app should simplify trust into a "brief-ready" posture, not scatter trust language across too many panels.
- Janes starts from assets, units, installations, events, and datasets; Ecosystem Intelligence should keep starting from mission/use-case engagement decisions.

Source: https://www.janes.com/defence-intelligence

### AlphaSense

AlphaSense shows the importance of saved searches, alerts, dashboards, and recurring monitoring. Users can turn searches into alerts, choose formats such as summarized documents or executive briefs, and return to saved searches.

Implication:

- Longer term, "saved searches / watch areas / alerts" may matter.
- Do not build that before the use-case-to-shortlist workflow is simple.
- When added, alerts should be tied to a mission area or shortlist, not generic keyword monitoring.

Source: https://help.alpha-sense.com/hc/en-us/articles/41815267178899-Save-Searches-and-Create-Email-Alerts-in-AlphaSense

### PitchBook

PitchBook is excellent at company, deal, investor, people, CRM, and business-development workflows. It integrates into CRMs and keeps account data fresh for outreach.

Implication:

- Ecosystem Intelligence should not compete as a private-market data source.
- It should borrow the pattern of CRM-adjacent activation: lists, owners, next steps, updates.
- It should differentiate by tying engagement to defence capability fit, mission relevance, evidence, and "why this target now."

Source: https://pitchbook.com/products/crm-integration

### Attio

Attio makes lists and views intuitive: records can belong to lists with workflow-specific fields, and users can switch between table and kanban views. This is a good pattern for engagement management because the same company or capability can appear in different workflows without changing the base record.

Implication:

- Shortlists should behave more like lightweight working lists.
- Each shortlist item should preserve workflow-specific rationale, owner, status, next step, and due date.
- A future board/table toggle for shortlists would be more valuable than a broad CRM build.

Source: https://attio.com/help/reference/attio-101/attios-data-model/understanding-lists

### Crossbeam

Crossbeam turns partner/account overlap into a matrix, then lets users click into pre-generated lists, refine columns, filter, sort, save, export, and set notifications.

Implication:

- Good pattern: summarize the landscape first, then let users drill into an actionable list.
- Ecosystem Intelligence should do the same for mission areas: show the top 3-5 target decision strip, then drill to evidence and records.
- The app should make "what overlaps / what matters / what to do next" visually obvious.

Source: https://help.crossbeam.com/en/articles/5303061-account-mapping-matrix

### Dealroom

Dealroom is strong at ecosystem dashboards, company discovery, and public-sector/startup ecosystem mapping. It demonstrates that governments and ecosystem builders value searchable, current ecosystem maps.

Implication:

- Ecosystem mapping is useful, but not the core wedge.
- The app should not become a general ecosystem atlas.
- It should use ecosystem breadth only to support a specific engagement decision.

Source: https://dealroom.co/products/ecosystem-platform

### Common Room

Common Room is a strong GTM-adjacent reference for signal unification, organization profiles, team notes, segments, workflows, alerts, and taking action from account intelligence.

Implication:

- The "engagement manager" layer should connect intelligence to action.
- Team notes and saved rationale are as important as raw profile completeness.
- Account/capability records should answer "what changed, who owns this, and what do we do next?"

Sources:

- https://www.commonroom.io/docs/get-started/core-concepts/
- https://www.commonroom.io/docs/using-common-room/organizations-page/organization-profiles/

### Official Defence Repositories

DIANA, SAM.gov, and Tradewinds are authoritative but fragmented. DIANA is challenge/cohort/test-centre based; SAM.gov is opportunity/search/follow/save based; Tradewinds is an awardable-solutions marketplace for AI/data/digital pathways.

Implication:

- These should remain source layers and validation inputs, not UI models to copy.
- The product should orchestrate them into human-readable engagement recommendations.
- Official-source badges and source-type filters would help trust.

Sources:

- https://www.nato.int/en/about-us/organization/nato-structure/defence-innovation-accelerator-for-the-north-atlantic-diana
- https://sam.gov/content/opportunities
- https://www.dau.edu/index.php/tools/tradewinds-solutions-artificial-intelligence-and-machine-learning

## Best-Practice Findings

### Information scent

NN/g's information-scent guidance is directly relevant: users choose navigation paths based on the cues from labels, surrounding context, and prior knowledge. "Use Cases," "Domains," and "Clusters" are internally coherent, but they do not yet give every BD user enough scent.

Required change:

- Add plain-language labels and subtitles wherever the user chooses an entry path.
- Use "Mission Areas / Use Cases" and "Technical Domains" rather than only "Use Cases" and "Domains."
- Add one-line destination previews: "Start here when you have a mission question," "Start here when you know the technology area," "Start here when you know the organization."

Source: https://www.nngroup.com/articles/information-scent/

### Minimalism and task focus

NN/g's heuristic on minimalist design applies strongly to briefing and detail pages: every extra unit of information competes with the thing the user most needs. The app is information-rich, which is good for trust, but the key action is sometimes buried under supporting explanation.

Required change:

- Put the target decision first.
- Move background explanation below the target decision or into expandable sections.
- Replace repeated long prose blocks with a compact decision strip and "open evidence" affordances.

Source: https://www.nngroup.com/articles/ten-usability-heuristics/

### Help at point of need

NN/g's help guidance favors searchable, task-focused, concise help, with contextual "pull" help over broad pushed tutorials. The help center exists, but the specific confusion in this audit should be solved in-context before users need to visit `/help`.

Required change:

- Add a short "Which path should I use?" panel on the dashboard.
- Add inline definitions on Use Cases, Domains, Clusters, Capabilities, Derived reads, and Evidence posture.
- Make the help page a backup, not the primary explanation mechanism.

Source: https://www.nngroup.com/articles/help-and-documentation/

### Enterprise data tables

Material Design's data-table guidance supports the app's table-first direction for companies and use cases. But tables need sorting, clear column definitions, hover/tooltip definitions for ambiguous headers, and default sort states that match the user's task.

Required change:

- Explain and sort by score/ranking.
- Add tooltips or compact definitions for Score, Coverage, Freshness, Type, and Domains.
- Keep table density for scan tasks, but pair rows with plain-language decision descriptions.

Source: https://m1.material.io/components/data-tables.html

## Usability Scorecard

Scores are judgment-based from repo review and browser walkthrough, not a formal user test.

| Surface | Score | What works | What blocks simplicity |
| --- | ---: | --- | --- |
| `/app` dashboard | 7.0 | Real workspace, left nav, global search, next best actions | Still too demo/Arctic/review centric; lacks a "choose your path" decision aid. |
| `/use-cases` | 6.5 | Table-first scan, summaries, gaps | "Use Cases" and "Domains" require mental translation; row does not say "use this when..." |
| `/use-cases/[slug]` | 7.0 | Strong decision content, filters, top targets, gaps | Dense and long; target decision is not always first; some sections duplicate briefing/card logic. |
| `/use-cases/[slug]/briefing` | 7.5 | Best match to niche; why-now/why-not/evidence/shortlist is distinctive | Still too long for a first-time operator; create-shortlist form appears before targets; "Demo guide" is facilitator language. |
| `/domains` | 5.5 | Has technical landscape entry | Least clear path; cards look like taxonomy inventory; domain/use-case/cluster relationship is under-explained. |
| `/companies` | 7.0 | Familiar table, filters, score, freshness | Score basis unclear; no sort; company-first path does not easily become a shortlist decision. |
| Capability records | 7.5 | Strongest capability-first surface; evidence and next move present | No obvious "add this to a shortlist" when user arrives outside briefing flow. |
| Shortlists | 7.0 | Correct engagement-manager primitive: status, owner, next step, due date, rationale | Naming and entry points need to feel more like working lists; capture should be available from more routes. |
| Help | 7.0 | Plain-language topics exist | Needs a Start Here / core-object diagram and more embedded definitions. |

Overall usability read: 6.8/10. The app is credible and strategically differentiated, but not yet simple enough for unguided BD validation.

## Highest-Severity Findings

### P0 - Entry-path language is still too product-internal

The app's navigation uses Dashboard, Search, Lists, Use Cases, Domains, Companies, Help. That is structurally sound, but the two most confusing terms are the two most important discovery surfaces: Use Cases and Domains.

Risk:

- Users who think in "mission problem," "market," "technology area," "partner target," or "program need" may not know where to begin.
- Domains may be mistaken for use cases, clusters, sectors, or data categories.

Recommendation:

- Use visible labels like:
  - "Mission Areas / Use Cases"
  - "Technical Domains"
  - "Companies and Partners"
  - "Working Lists"
- Add a dashboard "Start here" block:
  - "I have a mission problem" -> Mission Areas / Use Cases
  - "I know a technology area" -> Technical Domains
  - "I know an organization" -> Companies
  - "I need to brief or follow up" -> Working Lists / Briefings

### P0 - Use Cases need stronger plain-language jobs

The seed now has 8 use cases, which meets the intended use-case scale. However, the custom UX copy only covers Arctic Domain Awareness and Distributed Sensor Networks. The other use cases fall back to generic page copy.

Risk:

- The use-case system will feel strong in the Arctic demo and flat elsewhere.
- Users may not understand the distinction between use cases, domains, and capability clusters.

Recommendation:

For every active use case, add:

- "Use this when..."
- "Decision this supports..."
- "Main domains involved..."
- "Best output..."
- "Not for..."
- "Example engagement question..."

This is a content/modeling fix before it is a UI fix.

### P0 - Domains are the least clear surface

Domains currently present as cards with badges and counts. The page says to use domains when the question starts with a capability area, but it does not teach the relationship:

- Use Case = mission problem / engagement decision.
- Domain = technical landscape.
- Cluster = subgroup within a use case/domain.
- Capability = product/system/solution.
- Company = organization behind one or more capabilities.

Risk:

- Users may browse domains as if they were the main object, weakening the mission-led wedge.
- Domain pages can make the product feel like an encyclopedia rather than an engagement manager.

Recommendation:

- Rename to "Technical Domains."
- Add a compact taxonomy explainer at the top.
- Convert domain detail into a landscape table: capability cluster, top companies, maturity, use cases, gaps, action.
- Add "Open as mission question" links for related use cases.

### P0 - The briefing is strategically right but too long for the primary action

The briefing route is the strongest niche-aligned surface. It shows target rank, why this now, why not others, strength, limitation, suggested next step, evidence posture, freshness, and shortlist action.

Risk:

- The user encounters mission brief, demo guide, create shortlist, and briefing summary before the top targets.
- This creates more reading than necessary before the decision.

Recommendation:

- Move "Top engagement targets" directly under the mission brief.
- Move "Create working shortlist" below targets or make it a small sticky action.
- Rename "Demo guide" to "How to use this briefing" or hide it in validation/demo mode.
- Add a compact target comparison strip:
  - Rank
  - Company / capability
  - Engage / Validate / Watch
  - Why now
  - Evidence
  - Main risk
  - Next step

### P0 - Score and ranking need transparent explanation at point of use

The repository scoring model uses relevance, pathway, defence relevance, geography, signal recency, evidence, actionability, and reviewer delta. The companies table displays scores, but users do not see why the number exists.

Risk:

- Ranking becomes a black box even though the product is trying to be evidence-backed.
- Users may distrust or over-trust a percentage score.

Recommendation:

- Add "Ranked because..." summaries on target cards and company/capability rows.
- Add a tooltip or score explainer beside Score.
- Avoid presenting score as a precise percentage unless the scoring model is calibrated as one.
- Prefer "High / Medium / Watch" plus visible drivers for BD users.

## Priority Roadmap

### Phase 1 - Simplicity and first-use clarity

1. Update navigation labels and page headings:
   - Use Cases -> Mission Areas / Use Cases.
   - Domains -> Technical Domains.
   - Lists -> Working Lists.
2. Add the dashboard "Start here" selector.
3. Add an embedded concept map:
   - Mission Area -> Capability -> Company -> Evidence -> Working List.
4. Add inline definitions for Use Case, Domain, Cluster, Capability, Derived read, Evidence posture.
5. Add custom use-case copy for all 8 active use cases.

Acceptance criteria:

- A new user can say where to go for a mission question, a technology question, a company question, and a follow-up question in under 2 minutes.
- A new user can explain the difference between Use Case and Domain after one screen.

### Phase 2 - Faster target decision surface

1. Move target comparison higher in the briefing.
2. Build compact target decision strip.
3. Make score/rank drivers visible.
4. Convert long target cards into progressive disclosure: summary first, evidence/details second.
5. Add Add-to-shortlist from capability and company records.

Acceptance criteria:

- A BD user can identify top 3 targets and the first next step in under 3 minutes.
- A BD user can save a target from Use Case, Company, or Capability context.

### Phase 3 - Domain and browse polish

1. Redesign Domains as technical landscapes, not equal-weight mission paths.
2. Add sorting to company and target tables.
3. Add saved filters / saved views only after validation proves recurring use.
4. Add source-type filters for official sources, news, company pages, awards, patents, and analyst notes.

Acceptance criteria:

- Domain browsing helps users find related mission questions instead of becoming a parallel taxonomy.
- Company browse becomes a credible scan surface for BD users who start with known organizations.

### Phase 4 - Engagement manager layer

1. Upgrade shortlists into working lists:
   - statuses: Watch, Validate, Engage, Hold
   - owner
   - due date
   - next step
   - rationale
   - last signal
   - evidence confidence
2. Add list table and board views if user testing supports it.
3. Add alerts/watch areas tied to mission areas and working lists.
4. Add client/demo mode to hide internal admin/review chrome.

Acceptance criteria:

- A shortlist survives a handoff: another user can understand the rationale and next steps in under 15 minutes.
- Validation users do not see internal scaffolding unless they are supposed to.

## Data and Content Gaps

Current seed state:

- 8 use cases
- 5 domains
- 7 clusters
- 21 companies
- 26 capabilities
- 80 capability/use-case mappings
- 42 evidence snippets
- 141 field citations

The use-case count is at target, but company/capability density is still below the previously stated MVP ambition of 100-150 companies and 150-250 capabilities. The right next move is not just "add more data." It is:

1. Make the current 8 use cases clear and differentiated.
2. Expand data only inside the clearest wedge areas.
3. Keep promoted use cases from going live until each has enough target density to produce a defensible top 3-5.

Risk:

- If breadth expands before clarity, the app will become harder to use.
- If clarity improves before breadth, the app can validate the workflow even with narrower data.

## AGENTS.md Gap

`AGENTS.md` is still a scaffold. It says project status is "Scaffolding" and leaves the primary objective, outcomes, success criteria, users, constraints, outputs, and agent roster blank.

This is now inaccurate. The project has a clear mission, current product wedge, validation workflow, and local skill needs.

Recommendation:

- Update `AGENTS.md` from scaffold to operating contract.
- Define at least three local agent roles:
  - Market Intelligence Curator: source gathering, evidence extraction, freshness checks.
  - Capability Mapper: maps companies/capabilities to use cases/domains/clusters with rationale.
  - Engagement Briefing Analyst: produces top target briefs, gaps, why-now/why-not-others, and shortlist recommendations.

## Validation Plan

The next validation test should not be a feature demo. It should be a timed task:

> "You are asked to brief leadership on who to engage first for Arctic Domain Awareness. Use the app to identify the top 3 targets, explain why they matter now, name one major gap, and save the targets you would carry forward."

Measure:

- Time to find the right entry path.
- Time to identify top 3 targets.
- Whether user understands Use Case vs Domain.
- Confidence in ranking on a 1-10 scale.
- Confidence in evidence/provenance on a 1-10 scale.
- Whether the shortlist is reusable without verbal explanation.
- Where the user hesitates or asks "what does this mean?"

Success line:

- Entry path selected in under 2 minutes.
- Top 3 targets identified in under 5 minutes.
- User can explain why #1 is ahead of #2 or #3.
- User can name one gap or uncertainty.
- User says the output would be usable in a meeting with minor edits.

## Recommended Next Implementation Slice

The highest-leverage next build slice is:

1. Dashboard "Start here" selector.
2. Rename visible navigation/page labels to "Mission Areas / Use Cases," "Technical Domains," and "Working Lists."
3. Add use-case/domain/capability concept map to Help and dashboard.
4. Add custom use-case copy for all 8 active use cases.
5. Move briefing targets above shortlist creation and add a compact target comparison table.
6. Add score/ranking explanation.

This slice directly addresses the user's concern that the product is not fully clear with use cases and domains while protecting the core niche from scope creep.

## Final Read

The product should keep its niche:

> A simple, evidence-backed engagement intelligence workspace for defence and strategic-tech teams that starts from mission problems and closes with defensible target shortlists.

It should avoid becoming:

- a generic CRM
- a generic market map
- a broad company database
- a patent/research platform
- a procurement-opportunity search engine
- an AI research assistant without workflow closure

The right simplicity test is brutal and useful:

> Can a smart BD user open the app, pick the right path, understand the terms, identify who to engage first, defend why, and save the next step without you narrating the product?

Today: partially yes for the guided Arctic path, not yet across the broader product.

Target after the next pass: yes for all active use cases.
