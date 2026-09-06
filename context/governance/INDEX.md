# True North Map Governance Index

Status: canonical governance entrance
Owner: Andrew Davies
Last reviewed: 2026-09-06

Use this index after reading root `AGENTS.md`. Production and the canonical Supabase project remain authoritative for live product, queue, corpus, subscriber, migration, and publication state.

## Start here

| Document | Status | Use it for |
| --- | --- | --- |
| [Project Overview](./True%20North%20Map%20Project%20Overview.md) | Canonical | Product boundary, routes, terminology, architecture, and trust model |
| [Project Status](./Project%20Status.md) | Current snapshot | Operating posture and current priorities; verify time-sensitive facts live |
| [PRD](./PRD.md) | Canonical | Product requirements, users, journeys, and non-goals |
| [System Registry](./Skills%20And%20Automation%20Map.md) | Canonical | Skills, workflows, schedules, executable contracts, providers, authority, and owners |
| [Cross-System Contract](./Cross-System%20Change%20And%20Regression%20Contract.md) | Canonical | Change impact, validation level, and completion requirements |
| [Codex Workflow Contract](./Codex%20Workflow%20Contract.md) | Canonical | Astra instruction guidance, owner-selected model and effort, authorized follow-through and proportionate validation |

## Authoritative contracts

| Document | Status | Use it for |
| --- | --- | --- |
| [Admin Workflow and Data Contract](./Admin%20Workflow%20And%20Data%20Contract.md) | Canonical | Admin access, Review, Publish, editorial maintenance, and audit boundary |
| [Research Pipeline](./Autonomous%20Ecosystem%20Research%20Pipeline.md) | Canonical | Research orchestration, run modes, stages, and review-first lifecycle |
| [Research Schema and Source Contract](./Research%20Agent%20Schema%20And%20Source%20Contract.md) | Canonical | Candidate, evidence, source, and lineage requirements |
| [Access and Privacy Matrix](./Access%20And%20Privacy%20Matrix.md) | Canonical | Anonymous, member, administrator, service, consent, and retention boundaries |
| [Security and Reliability Log](./Security%20And%20Reliability%20Remediation%20Log.md) | Active register | Findings, dispositions, repair evidence, accepted risk, and release blockers |
| [Brand System](../../content/brand/True%20North%20Map%20Brand%20System.md) | Canonical | Identity, language, typography, colours, geometry, imagery, and public presentation |
| [Marketing and Outreach Operations](./Marketing%20And%20Outreach%20Operations.md) | Canonical | Founder voice, channel roles, manual cadence, factual-check outreach, attribution, measurement, and external-write authority |

## Operational runbooks and references

| Document | Status | Use it for |
| --- | --- | --- |
| [Production Release Runbook](./Production%20Release%20Runbook.md) | Canonical runbook | Commit, deployment, rollback, migration, and post-release verification |
| [Email and Domain Infrastructure](./Email%20And%20Domain%20Infrastructure.md) | Active reference | Zoho, MailerLite, Resend, DNS, sender, and authentication boundaries |
| [North Signal Email Operations](./Email%20Updates%20Operations.md) | Active runbook | One-newsletter consent, weekly/alert preferences, synchronization, funnel measurement, welcome, manual weekly and fail-closed alert operations |
| [Project Structure](./Project%20Structure.md) | Active reference | Repository ownership and file-placement rules |
| [Development Log](./Development%20Log.md) | Chronological record | Durable implementation and operating-history entries |
| [Plan Records](./plans/README.md) | Process reference | When a multi-session tracked plan is warranted and how to close it |

## Deferred plans

| Document | Status | Use it for |
| --- | --- | --- |
| [Internal Wiki Plan](./Internal%20Wiki%20Plan.md) | Deferred | Implemented private-wiki foundation and deferred expansion; not a current public-product dependency |

## Historical material

[Archived governance](../archive/governance/README.md) preserves superseded planning and decision lineage. It is never an active operating source and must not be used to restore older routes, copy, workflows, or launch assumptions.

## Maintenance rules

- Update the affected canonical contract and Development Log in the same material change.
- Give every active governance document a status, owner, and last-reviewed date.
- Read live systems for values that drift; do not preserve mutable counts in operating contracts.
- Create screenshots, reports, decks, mockups, and launch collateral only when explicitly requested and keep them local by default.
- Run `pnpm governance:validate` before release. Run `pnpm operator:hygiene` locally when installed skills or automation policy changes.
