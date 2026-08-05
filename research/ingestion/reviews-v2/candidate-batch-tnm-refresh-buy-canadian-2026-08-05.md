# Buy Canadian policy and deep precision strike demand signals

- Batch: `candidate-batch-tnm-refresh-buy-canadian-2026-08-05`
- Run: `tnm-refresh-buy-canadian-2026-08-05`
- Status: **Candidate pending human review**
- Selected gap: newsletter-resolved-government-demand-signals
- Candidates: 2
- Deferred: 3

## Publication boundary

This packet is private review material. Acceptance and publication remain separate human actions. No candidate in this packet is public.

## Private staging result

- Research run UUID: `8faceeb8-728f-449c-a48d-ac80cc41dee3`
- `candidate-buy-canadian-procurement-policy`: `96925eb4-3e81-4085-a603-760809d3b282` — `pending`, unpublished
- `candidate-canadian-deep-precision-strike-capability`: `a3f94dc9-ae20-421c-875b-ed7123783a8f` — `pending`, unpublished
- Post-stage check: two private rows, zero canonical demand sources with either proposed slug, and no duplicate row after reapplying the same staging export.

## Reviewer checklist

- [ ] Resolve every possible duplicate before acceptance.
- [ ] Confirm organization type and controlled categories.
- [ ] Confirm each public claim against its field evidence and canonical source.
- [ ] Keep derived mission or demand alignment separate from source-backed facts.
- [ ] Edit, merge, defer, reject, or accept with substantive rationale.
- [ ] Use a separate explicit publication action after acceptance.

## Candidates

### candidate-buy-canadian-procurement-policy

- Kind: `demand_signal_bundle`
- Review tier: `amber`
- Confidence: `moderate`
- Inclusion score: 93
- Completeness score: 86
- Duplicate status: `clear`
- Reviewer warnings: The framework is non-retroactive and excludes or permits exceptions for specified sensitive operations, overseas missions, foreign-government purchases, and delivery outside Canada.; The Contracting with Canadian Suppliers and Content Policy and Canadian Materials Policy use different thresholds and application rules; reviewers should preserve those distinctions.; The newsletter's contract ownership, domestic-share, and CSE budget-exemption claims are not evidence for this candidate.; The record may overlap with the published defence-specific Build-Partner-Buy demand source and should be merged only if the government-wide operational policy distinction is not useful.
- Demand source: **Buy Canadian Procurement Policy Framework**
- Issuers: Public Services and Procurement Canada, Government of Canada
- Requirements: 3
- Sources: [Buy Canadian Procurement Policy Framework](https://canadabuys.canada.ca/en/buy-canadian-policy/buy-canadian-procurement-policy-framework); [Buy Canadian Policy overview](https://canadabuys.canada.ca/en/buy-canadian-policy); [Buy Canadian questions and answers for suppliers](https://canadabuys.canada.ca/en/buy-canadian-policy/questions-and-answers-suppliers); [Buy Canadian ministerial exceptions process guide](https://canadabuys.canada.ca/en/buy-canadian-policy/buy-canadian-buyers-toolkit/buy-canadian-ministerial-exceptions-process-guide)

**Generated reviewer rationale**

This candidate translates the official government-wide Buy Canadian framework into three bounded public demand requirements covering Canadian suppliers and content, designated Canadian materials, and small-business procurement access. Live published and pending checks found no exact Buy Canadian policy record, but the subject overlaps thematically with the existing defence-specific Build-Partner-Buy source, so the candidate is amber for human scope and merge review. It deliberately excludes the newsletter's ownership, award-share, and agency-exemption calculations because those claims were not reproduced from original records.

### candidate-canadian-deep-precision-strike-capability

- Kind: `demand_signal_bundle`
- Review tier: `green`
- Confidence: `high`
- Inclusion score: 98
- Completeness score: 90
- Duplicate status: `clear`
- Reviewer warnings: The August 2026 industry question-and-answer activity is closed and vetted; it is not an open solicitation or supplier-qualification result.; The public project page does not disclose budget, range, platform, payload, supplier, acquisition decision, or delivery schedule.; Reviewers should keep this project distinct from the broader Defence Drone Initiative only if the project-specific lifecycle and requirements add decision value.
- Demand source: **Canadian Deep Precision Strike Capability**
- Issuers: Department of National Defence, Canadian Armed Forces
- Requirements: 3
- Sources: [Canadian Deep Precision Strike Capability](https://www.canada.ca/en/services/defence/defence-equipment-purchases-upgrades/personal-equipment/canadian-deep-precision-strike-capability.html); [Defence Drone Initiative](https://www.canada.ca/en/department-national-defence/news/2026/07/defence-drone-initiative.html); [Security, Sovereignty and Prosperity: Canada's Defence Industrial Strategy](https://www.canada.ca/en/department-national-defence/corporate/reports-publications/industrial-strategy/security-sovereignty-prosperity.html)

**Generated reviewer rationale**

The July 30 official project page is a distinct, later, project-specific demand record: it defines long-range precision-strike purpose, contested-environment resilience, system integration, closed industry engagement, and next procurement steps. The published Defence Drone Initiative already lists deep precision strike as one of six broad capability areas, but its official backgrounder explicitly described that stage as market engagement without an acquisition decision. This candidate therefore preserves the narrower project lifecycle for human review and does not create any supplier, platform, budget, range, payload, or award claim.

## Deferred

- `prospect-buy-canadian-award-share-metrics`: Official contract disclosure does not reproduce the linked ownership classifications or aggregate methodology. Follow-up: Obtain a reproducible official-data extract and ownership-classification method before considering an observed-results field.
- `prospect-cse-sensitive-operations-exemption`: Official policy supports sensitive-operation exclusions and case-specific exceptions but not an agency-wide CSE budget exemption. Follow-up: Locate an original CSE, Treasury Board, PSPC, or ministerial exception record before reconsidering.
- `prospect-magellan-m72-production`: No original Government of Canada or official Magellan source was recovered for the specific M72 production claim. Follow-up: Monitor CanadaBuys, DND announcements, and Magellan's newsroom for a durable original record.
