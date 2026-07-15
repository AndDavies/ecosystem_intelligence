# Goverly Competitive Research - 2026-05-21

## Decision Question

What does Goverly imply for `Ecosystem Intelligence`?

Specifically:

- How hard would it be to recreate the visible concept without copying or bypassing Goverly's private platform?
- Which parts should be adapted into the current business-intelligence and engagement-management platform?
- Is the Goverly-style venture a better product-market-fit wedge than the current Ecosystem Intelligence concept?

## Bottom Line

Goverly is a strong product-market-fit signal, but not a reason to copy their ITB product directly.

The best takeaway is the workflow pattern:

> public scan -> readiness file -> evidence gaps -> claim / verify -> buyer-side routing workspace -> transaction or engagement support

For `Ecosystem Intelligence`, the useful adaptation is:

> company or capability scan -> mission/use-case fit -> evidence-backed readiness/gap read -> saved Working List -> briefing-ready next step

Goverly's current wedge is sharper than the generic version of Ecosystem Intelligence because it ties a supplier pain to a visible policy mechanism: Canadian ITB obligations and prime contractor supplier-discovery pressure. The current Ecosystem Intelligence wedge remains viable only if it stays narrow around decision closure: who to engage first, why now, what evidence supports the read, what gaps remain, and what next step should be taken.

Do not compete head-on with Goverly's exact Canada ITB supplier-readiness lane unless there is a specific unfair advantage in ITB policy expertise, prime relationships, or a tightly regional/mission-specific niche.

## Research Scope And Limits

Live checks completed:

- Chrome walkthrough of `https://www.goverly.ai/`
- Chrome click-through on the public "Start free scan" path
- Chrome review of Goverly's LinkedIn company page
- Chrome review of CEO Lucas Russell's LinkedIn profile
- Public web/source checks against Canada Defence Industrial Strategy, ISED ITB data, VIATEC, and comparable market tools
- Public demo video frame review from Goverly's 90-second product demo

Important limitation:

- The free scan is currently behind a closed-preview access gate at `https://app.goverly.ai/gate?next=%2F`.
- No password-gated or private-platform inspection was performed.
- Goverly's terms prohibit reverse engineering, decompiling, disassembling, unauthorized scraping, and unauthorized data collection from the platform. This review therefore treats "reverse engineering" as ethical functional recreation from public patterns, not copying protected implementation or bypassing access controls.

## What Goverly Is Now

Goverly's current public positioning is no longer the broad "AI government contracting" positioning shown in older search snippets. The current site is tightly Canada-defence and ITB-specific:

> Canada's ITB Readiness System.

The live product thesis is:

- Canadian STEM SMBs may be relevant to defence work but cannot explain themselves in prime/ITB language.
- Primes have ITB obligations and supplier-discovery pressure.
- Goverly scans a company, translates it into defence language, scores readiness, identifies missing proof, and creates an owner-verified readiness file.
- Prime teams get a private search workspace to filter suppliers by geography, Defence Industrial Strategy priorities, Sovereign Capabilities, legacy KICs, readiness, proof status, and opportunity context.

The visible product primitives are:

1. Public company scan
2. Readiness file
3. Prime 360 search and positioning
4. ITB market and policy intelligence
5. Transaction support path

The public SMB pricing ladder is:

- Free scan / claim: $0
- Readiness: $199/month
- Positioning: $499/month
- High-touch support through the Phase Alpha / ArcTech path

The investor page also describes enterprise and transaction-attached revenue, including Prime 360 access and scoped services. Treat the larger operational metrics and traction claims as founder claims unless verified by customer references or data-room evidence.

## Free Scan Findings

The public call-to-action currently sends users to `https://app.goverly.ai/`, which redirects to a private preview gate.

Observed gate:

- Title: `Private preview · Goverly / Goverly`
- Message: Goverly is currently in closed preview.
- Form: access password
- Contact: `hello@goverly.ai`

The gated app appears to be:

- Next.js on Vercel
- Clerk authentication
- noindex/nofollow
- production security headers

The marketing site appears to be:

- Vercel-hosted static front-end
- public HTML includes Lovable author metadata
- public demo video available at `/product-screens/goverly-90-second-demo.mp4`

This means the visible interface shell is easy to reproduce. The defensible data and trust layer is the hard part.

## Product Demo Findings

The public 90-second demo shows a sanitized flow:

1. User starts with a company domain.
2. Goverly generates a post-scan executive brief.
3. The brief shows defence relevance and ITB readiness scores.
4. The brief identifies contract-demand upside and top readiness blockers.
5. The blockers are concrete proof gaps, such as controlled-goods/security posture and visible federal delivery history.
6. The scan maps the supplier to Sovereign Capability fit.
7. Claiming turns the public read into an owner-verified file.
8. Paid tiers keep the file updated and unlock prime positioning.
9. Prime 360 gives prime teams searchable ranked readiness files with filters by priority and capability.

The demo is strong because the first useful output is not a generic AI summary. It is a decision artifact:

- what Goverly found
- why it matters
- what blocks a prime from using the company today
- what the next paid or verified step is

## LinkedIn Findings

Goverly LinkedIn company page:

- Industry: Technology, Information and Internet
- Location: Vancouver, BC
- Size: 2-10 employees
- Founded: 2023
- Public description still reads as broader government procurement automation
- Recent activity supports the Canada defence / ITB pivot

Notable public signals:

- UBC Sauder Scale Up defence and dual-use program participation
- Beaver's Den / Vancouver startup ecosystem visibility
- DEFSEC West delivery of custom ITB Match Reports with ArcTech Accelerate
- ITB Academy launch
- Public emphasis on Canada defence, ITB, Sovereign Capability, and primes with obligations

CEO Lucas Russell profile:

- Founder and CEO at Goverly.ai
- Public profile still mentions broader government contracts, grants, opportunity matching, and proposal generation
- Recent posts align with the new defence/dual-use and Canadian ITB positioning
- Public activity shows investor/startup ecosystem motion more than mature customer proof

VIATEC confirms Goverly Tech Inc. as a Victoria, BC member company in Government / Business Services / Software with Lucas Russell listed as founder.

## Market Tailwinds

The core external tailwind is real.

Canada's Defence Industrial Strategy launched on February 17, 2026. It introduces a build-partner-buy framework and confirms a shift from 17 Key Industrial Capabilities to 10 Sovereign Capabilities.

Government sources support the general demand environment:

- Canada Defence Industrial Strategy: $81.8B defence reinvestment, $6.6B for the DIS, and a goal to grow defence revenues for Canadian SMBs by more than $5.1B annually.
- Prime Minister release: $180B in defence procurement opportunities and $290B in defence-related capital investment opportunities over 10 years.
- ISED ITB report: 117 active ITB obligations in 2024, $83.8B total obligations, $23.4B not identified, and 438 SMB recipients from active obligations.

Goverly's "$21B+" unfilled obligation claim is directionally consistent with the official ISED "to be identified" figure, though the latest cited ISED figure is $23.4B as of the April 21, 2025 report.

## Competition And Substitutes

### Direct Or Near-Direct

| Product / actor | What it does | Relevance |
| --- | --- | --- |
| Goverly | Canada ITB supplier readiness and prime-routing layer | Direct product pattern overlap, especially scan/readiness/prime workspace |
| ArcTech Accelerate | ITB and defence industrial strategy consulting | Goverly's likely service and domain-expertise moat |
| DCAN | Defence Capability Access Network for buyers and suppliers | Strong adjacent competitor around capability marketplace and operational demand signals |
| SourceCan | Canada-first manufacturing marketplace | Shows verified Canadian supplier marketplace pattern, less defence-specific |

### Broader GovCon And Intelligence Comparators

| Product / category | Strength | Weakness vs the desired wedge |
| --- | --- | --- |
| GovWin / GovTribe / HigherGov / GovCon Data / SamSearch | Procurement aggregation, opportunity search, award history, bid support | Opportunity-centric, mostly U.S.-weighted, not Canada ITB readiness or mission-to-engagement decision closure |
| Govini / Janes | Defence intelligence and structured data | Strong trust posture, heavier enterprise scope |
| PitchBook / Dealroom / Crunchbase | Company discovery and private-market data | Company-first and investor-first, not mission/use-case decision support |
| Manual consultants and spreadsheets | Flexible and already adopted | Slow, inconsistent, hard to preserve, hard to defend |

## Level Of Effort

### 1. Recreate The Visible Shell

Estimated effort: 1-2 weeks.

This includes:

- landing pages
- pricing ladder
- gated app shell
- company URL input
- static demo readiness report
- basic account gating
- marketing copy and investor page shape

This is not the product moat.

### 2. Build A Functional Scan MVP

Estimated effort: 4-8 weeks from the existing Ecosystem Intelligence codebase.

This includes:

- company URL ingestion
- website crawling and summarization
- entity extraction
- capability classification
- mapping to existing Use Cases / Domains
- evidence snippets and field citations
- readiness/gap scorecards
- save to Working List
- briefing-ready output

Existing Ecosystem Intelligence foundations reduce effort because it already has:

- capability and company models
- Use Case and Domain framing
- evidence and citation concepts
- Working Lists / shortlists
- briefing pages
- review-first ingestion posture

### 3. Build A Prime Or Buyer Workspace

Estimated effort: 8-16 weeks for a credible internal/beta version.

This includes:

- buyer-side search
- filters by mission, domain, geography, readiness, evidence, and proof status
- ranked target lists
- comparison views
- saved lists
- audit trail
- export or briefing workflow

This overlaps strongly with current Ecosystem Intelligence work and is more achievable than Goverly's full ITB data ambition.

### 4. Build The Data Moat

Estimated effort: 3-6 months for a narrow credible niche; 6-12+ months for broad Canada-wide supplier intelligence.

This includes:

- federal open-data ingestion
- company/entity resolution
- capability taxonomy normalization
- public-source evidence refresh
- ITB/project/prime obligation mapping
- policy-rule versioning
- confidence scoring
- duplicate and provenance controls
- QA and analyst review

This is where Goverly's claimed advantage sits. It is not hard because of LLMs; it is hard because of source coverage, entity resolution, policy interpretation, trust, and workflow fit.

### 5. Build A Venture With External PMF

Estimated effort: 3-6 months for proof through concierge pilots; 12+ months for durable category position.

Technical build is only one track. The venture also needs:

- domain experts
- buyer interviews
- prime or program relationships
- proof that users pay for repeat updates
- security and data governance posture
- clear legal boundaries around claims and procurement advice

## Product-Market Fit Judgment

Goverly's wedge has stronger immediate PMF signals than the generic version of Ecosystem Intelligence:

- clearer buyer pain
- clear policy trigger
- obvious ROI story for suppliers
- pricing ladder that starts self-serve and escalates into services
- prime-side enterprise path
- consulting partner that can deliver while software matures

But it also has sharper execution risk:

- primes must trust the readiness file
- suppliers must believe the score will lead to real access
- data freshness and policy accuracy are non-negotiable
- the service layer can dominate the software margin
- competing directly requires credibility in ITB and defence procurement

For Ecosystem Intelligence, the better path is not to copy Goverly. It is to adopt the scan/readiness-file mechanic to make the current decision-support product more immediately useful.

## Recommended Adaptation For Ecosystem Intelligence

Build a small "Readiness File" slice that preserves the existing mission-to-engagement wedge.

Proposed workflow:

1. User enters a company URL or selects an existing company.
2. The app produces a public-source capability read.
3. The app maps likely fit to Mission Areas / Use Cases and Technical Domains.
4. The app shows evidence-backed strengths, missing proof, stale evidence, and confidence.
5. The app explains why the company should or should not be added to a Working List.
6. The user can save the company/capability to a Working List with rationale, owner, next step, and due date.
7. The briefing page can compare the target against current top targets.

This would turn the current product from "browse existing curated intelligence" into "create a decision artifact from a live public signal."

## Recommended Venture Direction

Do not pivot wholesale into "Goverly for ITB."

Instead, test a narrower adjacent offer:

> Mission-led defence supplier and capability readiness briefs for Canadian / allied strategic-tech ecosystems.

Possible first niches:

- Arctic and northern operations supplier readiness
- Atlantic Canada ocean and maritime defence capability readiness
- dual-use accelerator cohort readiness and prime-fit mapping
- Canadian STEM supplier fit for selected Sovereign Capabilities
- internal BD target-readiness scoring for a mission area

The sellable outcome should be:

> a defensible shortlist or readiness file that helps a BD, prime, accelerator, or program team decide who to engage next.

## Recommended Next Step

Run a 2-week prototype sprint:

1. Add a manual company/capability readiness-file template to the current app or governance workflow.
2. Produce 5 readiness files from public sources for real Canadian strategic-tech companies.
3. Map each file to current Mission Areas / Use Cases.
4. Score evidence strength and missing proof.
5. Put the strongest 3 into a Working List.
6. Test the output with 3-5 BD-adjacent users.

Success criteria:

- users can explain the target and evidence posture in under two minutes
- users say the readiness/gap read changes who they would engage first
- users ask to run the same scan on another company or mission area
- at least one external-friendly segment expresses willingness to pay for a repeated version

## Source Trail

- Goverly site: https://www.goverly.ai/
- Goverly for SMBs: https://www.goverly.ai/for-smbs
- Goverly for Primes: https://www.goverly.ai/for-primes
- Goverly platform: https://www.goverly.ai/platform
- Goverly investors: https://www.goverly.ai/investors
- Goverly private preview gate: https://app.goverly.ai/
- Goverly LinkedIn company page: https://www.linkedin.com/company/goverly-tech-inc/
- Lucas Russell LinkedIn profile: https://www.linkedin.com/in/lsrussell/
- VIATEC Goverly listing: https://members.viatec.ca/member-directory/Details/goverly-tech-inc-3998577
- Canada Defence Industrial Strategy: https://www.canada.ca/en/department-national-defence/corporate/reports-publications/industrial-strategy/security-sovereignty-prosperity.html
- Prime Minister DIS release: https://www.pm.gc.ca/en/news/news-releases/2026/02/17/prime-minister-carney-launches-canadas-first-defence-industrial
- ISED ITB contractor progress: https://ised-isde.canada.ca/site/industrial-technological-benefits/en/projects-and-obligations/report-contractor-progress
- ISED ITB annual report 2025: https://ised-isde.canada.ca/site/industrial-technological-benefits/en/annual-report
- DCAN: https://dcan.network/
- SourceCan: https://sourcecan.co/
- SamSearch GovWin alternatives: https://samsearch.co/blog/best-govwin-alternatives-government-contract-intelligence
- GovCon Data aggregator comparison: https://www.govcon-data.com/blog/top-government-contract-aggregators-2026
