# BD Validation Project Map

Date: 2026-04-25

## Purpose

This project map defines the next product phase before sharing `Ecosystem Intelligence` with BD users inside the organization.

The goal is to prove that the app performs the correct job:

> Given a mission or use case, help a BD or engagement lead identify who to engage first, why they matter now, what evidence supports the recommendation, what tradeoffs or gaps remain, and what next step should be taken.

This is the validation bridge between the current internal MVP and wider BD team feedback.

## Current Assessment

The app is close to the right job, but not finished enough for broad BD validation.

It already supports:

- Use Case-led discovery
- capability-first records
- ranked top targets
- mission realism fields
- evidence and citation panels
- freshness indicators
- review routing
- staged research ingestion
- promoted real-data pilot records

It still needs stronger support for:

- decision closure
- shortlist comparison
- "why this target over others" reasoning
- lightweight engagement follow-through
- leadership-ready briefing output
- institutional memory around target rationale

## Implementation Update: 2026-04-25

Phase 1 now has an implemented foundation in the app:

- `/use-cases/[slug]/briefing` provides a leadership-ready Use Case briefing view.
- Comparative target cards show why-now, why-not-others, strength, limitation, evidence posture, freshness, and suggested next step.
- Use Case briefing and detail pages support adding targets to shared shortlists.
- `/shortlists` supports creating and deleting shared shortlists.
- `/shortlists/[id]` supports revisiting saved targets, editing status, owner, next step, due date, and rationale, and removing items.
- Coverage gaps are surfaced as derived analysis so the app can name weak evidence, concentration, stale records, and thin maturity depth without overstating certainty.
- The in-app help center now includes a BD Validation Workflow topic for briefing, shortlist, and demo usage.

The remaining work before broader BD exposure is not another major feature build. The priority is guided validation: use the Arctic Domain Awareness path in realistic conversations, observe whether users trust and reuse the recommendation workflow, then decide what downstream workflow deserves the next build.

## Validation-Ready Product Goal

Before sending the app to a broader BD group, the product should support one crisp demo workflow:

1. Start from a mission or Use Case.
2. See the 3-5 most relevant engagement targets.
3. Understand why each target matters now.
4. Compare strengths, limitations, and tradeoffs.
5. See the evidence and confidence behind each recommendation.
6. Identify the major ecosystem gaps or weak coverage areas.
7. Save or activate a small shortlist for follow-up.
8. Produce a briefing-ready view that can be used in a leadership or BD discussion.

If that workflow is not compelling, broader features will not rescue the product.

## Phase 1: BD Validation Readiness

Status: `Implemented foundation; ready for guided validation`

### Objective

Make the prototype strong enough to test with BD users in realistic conversations.

### Build Items

1. Use Case briefing view

- Create a leadership-ready summary for each Use Case.
- Include top 3-5 targets, why now, evidence, tradeoffs, gaps, and next steps.
- Make the view useful for a meeting, not just internal navigation.

2. Comparative target cards

- For each top target, show:
  - why this target
  - why not the others
  - key strength
  - key limitation
  - evidence support
  - confidence / validation posture
  - suggested next step

3. Shortlist / working-list foundation

- Allow a user to save selected capabilities or companies into a named shortlist.
- Add lightweight status values:
  - Watch
  - Validate
  - Engage
  - Hold
- Add optional owner, next step, due date, and rationale.

4. Gap and coverage summary

- Make ecosystem gaps first-class on Use Case pages.
- Highlight:
  - missing capability areas
  - weak Scale-stage depth
  - geography concentration
  - weak evidence coverage
  - stale or thin records

5. Interview-ready demo path

- Prepare one polished Arctic Domain Awareness demo path.
- The demo should answer:
  - who matters
  - why them
  - why now
  - what is uncertain
  - what evidence supports the read
  - what should happen next

### Acceptance Criteria

- A BD user can move from Use Case to shortlist in under five minutes.
- Top targets can be explained without opening every record.
- Each recommendation shows evidence, uncertainty, and tradeoff context.
- A reviewer can distinguish source-backed fact, derived read, and human/AI suggestion.
- A user can preserve a shortlist and next-step rationale for later follow-up.
- The app supports a live interview or demo without requiring verbal patchwork from the product owner.

## Phase 2: Internal Concierge Validation

Status: `After Phase 1`

### Objective

Test whether the curated decision layer is valuable before expanding the product.

### Validation Method

Use the app in 5-10 guided sessions or concierge briefings with trusted BD-adjacent users.

Recommended task:

> "Find the top targets for this mission/use case and explain which organizations you would engage first, why, and what evidence would make you comfortable defending the recommendation."

### Success Signals

- Users say shortlist prioritization is a real pain, not just an interesting convenience.
- Users can understand the recommendation logic without needing a long explanation.
- Users trust the evidence/provenance enough to use it in a meeting.
- Users point to specific targets, gaps, or tradeoffs they would not have found as quickly otherwise.
- Users ask to reuse the app for another Use Case or briefing cycle.

### Failure Signals

- Users treat the app as another database rather than a decision aid.
- Users focus mainly on missing search breadth instead of recommendation quality.
- Users do not trust the ranking or evidence.
- Users still need to export everything and rebuild the answer manually.
- Users cannot identify a next action from the shortlist.

## Phase 3: BD Team Validation

Status: `Only after Phase 1 and Phase 2 show value`

### Objective

Share the app with selected BD users inside the organization for broader validation.

### Entry Criteria

- Phase 1 build items are complete.
- Tests, lint, build, seed validation, and ingestion validation pass.
- At least one polished Use Case demo path is ready.
- Concierge users confirm the app sharpens who they would engage first.
- Known evidence and realism caveats are visible inside the product.

### Suggested Rollout

- Start with 3-5 BD users, not the entire team.
- Give them one realistic mission prompt.
- Observe how they move from question to shortlist.
- Ask them to compare the app against their current workflow.
- Capture what they trust, what they doubt, and what they still do manually.

### Core Questions To Validate

- Does this save time compared with current research behavior?
- Does it improve confidence in the shortlist?
- Does provenance make the recommendation more meeting-ready?
- Does the capability-first model match how BD thinks about partner discovery?
- Does the app preserve useful institutional memory?
- Which next-step workflow matters most: outreach prep, leadership briefing, challenge design, supplier discovery, or monitoring?

## Do Not Build Yet

Avoid expanding into these until BD validation confirms the wedge:

- full CRM pipelines
- broad contact management
- outbound sequencing
- generic market-intelligence chat
- large-scale automated ingestion
- deep relationship mapping
- procurement-opportunity tracking as a primary workflow
- investor-style company database features

These may become useful later, but they should not distract from proving use-case-to-engagement decision support.

## Project Map

Current state:

- Functioning internal MVP with real product structure.
- Promoted Arctic pilot data and ingestion guardrails.
- Strong evidence/review foundations.
- Stronger mission realism than the original scaffold.

Next:

- Run guided BD-adjacent validation using the implemented briefing and shortlist workflow.

Then:

- Run guided concierge validation.

Then:

- Share with selected internal BD users.

Only after:

- Broaden workflow depth based on observed BD behavior.

## Recommended Next Implementation Order

### 2026-04-29 Update: First-Use Clarity Before BD Validation

The next implementation slice is now the Business Intelligence Usability Roadmap's First-Use Clarity pass before broader BD validation.

This slice keeps the existing wedge intact:

- Mission Area / Use Case -> top targets -> why now -> evidence and confidence -> gaps and tradeoffs -> saved Working List.

The priority is to make the product understandable without a guided demo:

- Add a Start Here selector for mission problem, technology area, known organization, and briefing/follow-up.
- Use visible labels `Mission Areas`, `Technical Domains`, and `Working Lists` while preserving existing routes and backend identifiers.
- Explain Use Case vs Domain vs Cluster vs Capability vs Company at the point of use.
- Add custom orientation copy for all active mission areas.
- Put target comparison first in the briefing flow and explain rank signal as relative prioritization, not probability.

Broader BD validation should wait until this clarity slice passes browser QA and the Arctic briefing-to-working-list workflow can be completed without verbal patchwork.

### 2026-04-29 Update: Research Operationalization Before Broad Batches

The next development slice prepares staged research batches without running broad automated ingestion yet.

Implemented runway:

- Add operational metadata to validated records so the app can distinguish scaffold data from public-source research.
- Preserve candidate `confidence`, `research_rationale`, and `batchId` during promotion.
- Add source-lead validation before candidate-batch creation.
- Add Mission Area readiness reporting to show validated company depth, capability depth, top-target depth, and scaffold debt.
- Keep source leads, candidate batches, review packets, and promotion logs as the research agent handoff chain.

Current readiness snapshot:

- 8 active Mission Areas.
- 6 validated companies out of 21.
- 6 validated capabilities out of 26.
- 8 validated mappings out of 80.
- 15 scaffold companies, 20 scaffold capabilities, and 72 scaffold mappings remain to replace.

Recommended next staged research order:

1. Underwater ISR.
2. Arctic Domain Awareness refresh and broadening.
3. Autonomous Patrol.
4. Edge Data Processing.
5. Cyber Mission Assurance For Remote Operations.
6. Distributed Sensor Networks.
7. Expeditionary Communications Resilience.
8. Northern Logistics And Sustainment Readiness.

Operational rule: run source-lead batches first, then convert approved leads into candidate batches. Do not let the research agent write directly to Supabase or seed CSVs.

### 2026-04-29 Update: Remaining Roadmap Phases Implemented

The remaining usability roadmap phases now have an implementation baseline:

- Domain browse has been reframed as a compact Technical Domains scan rather than equal-weight discovery cards.
- Domain detail links users back into related Mission Areas with `Open as mission question`.
- Working Lists now include handoff reads, owner coverage, next-step coverage, due-date coverage, and status summaries.
- Rank signal is explained as relative prioritization and uses reusable rank-driver copy.
- A timed Arctic validation script has been added at `context/governance/BD Validation Script - Arctic Task - 2026-04-29.md`.

The next gate is not more UI polish. It is running the timed Arctic validation task with trusted users and observing whether they can complete it without narration.

Completed foundation:

1. Add Use Case briefing view.
2. Add comparative target cards.
3. Add gap and coverage summary.
4. Add shortlist / working-list foundation.
5. Add demo/interview support notes for the Arctic pilot.

Next implementation and validation order:

1. Run browser QA against the briefing-to-shortlist workflow.
2. Conduct 5-10 guided validation sessions with trusted BD-adjacent users.
3. Capture whether users trust the ranking, evidence posture, and shortlist rationale.
4. Decide the next workflow from observed behavior: outreach prep, challenge design, leadership briefing export, supplier discovery, or monitoring.
5. Expand real-world data only after the first validation path proves the recommendation workflow is valuable.

## Verification Before BD Sharing

Before sharing with any BD users, run:

```bash
pnpm release:validate
```

All should pass.

## Decision Rule

Do not advance to broader BD team validation because the app is visually polished.

Advance only when the app proves that it can help a user form a faster, more defensible engagement recommendation than their current workflow.
