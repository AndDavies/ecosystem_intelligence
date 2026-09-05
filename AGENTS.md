# AGENTS

Status: canonical project operating contract
Owner: Andrew Davies
Last reviewed: 2026-09-05

This file is the concise operating map for Codex work in Ecosystem Intelligence. Begin here, then follow the linked contract for the system being changed.

## Mission and current product

True North Map at `https://truenorthmap.ca` is a Canadian defence capability-discovery and engagement service. It helps people find Canadian defence and dual-use organizations and technologies, understand where they may fit, and decide who is worth speaking with next. It is in production soft beta.

The decision path is:

```text
real question -> organizations and technologies that may help
  -> why they matter -> facts, assessments, sources, and limits
  -> private Working List -> next conversation
```

Production Supabase project `facoactpdckkhciamflk` and the deployed application define the current product. Never restore an older route, design, count, workflow, or trust statement from a screenshot, deck, report, archived plan, or memory.

## Start every material task

1. Read the [Project Overview](context/governance/True%20North%20Map%20Project%20Overview.md), [Project Status](context/governance/Project%20Status.md), and [Cross-System Contract](context/governance/Cross-System%20Change%20And%20Regression%20Contract.md).
2. Run `git status --short --branch` and `git worktree list`. Separate deployed state, tracked state, uncommitted work, and ignored private artifacts.
3. Read live production when current records, queues, taxonomy, subscribers, migrations, schedules, or publication state affect the task.
4. Name the systems touched before editing and preserve unrelated user work.
5. Run scoped checks during development and the contract-required regression level before commit, migration, publication, or release.

## Sources of truth

| Subject | Authority |
| --- | --- |
| Current product and terminology | [Project Overview](context/governance/True%20North%20Map%20Project%20Overview.md) and production |
| Current operating posture | [Project Status](context/governance/Project%20Status.md), refreshed against live systems |
| Product requirements | [PRD](context/governance/PRD.md) |
| Governance navigation | [Governance Index](context/governance/INDEX.md) |
| Systems, skills, schedules, and providers | [System Registry](context/governance/Skills%20And%20Automation%20Map.md) |
| Research data contract | `app/src/lib/research/pipeline-schema.ts`, then the [Research Contract](context/governance/Research%20Agent%20Schema%20And%20Source%20Contract.md) |
| Review and publication | [Admin Workflow](context/governance/Admin%20Workflow%20And%20Data%20Contract.md) |
| Regression and release | [Cross-System Contract](context/governance/Cross-System%20Change%20And%20Regression%20Contract.md) and [Release Runbook](context/governance/Production%20Release%20Runbook.md) |
| Security and reliability backlog | [Remediation Log](context/governance/Security%20And%20Reliability%20Remediation%20Log.md) |
| Brand and public language | [Brand System](content/brand/True%20North%20Map%20Brand%20System.md) |
| Marketing and outreach | [Marketing and Outreach Operations](context/governance/Marketing%20And%20Outreach%20Operations.md) |

## Data, evidence, and publication authority

- Supabase is the sole runtime, taxonomy, duplicate-check, review, storage, and publication source. Read current counts live.
- Keep source-backed facts, True North Map assessments, evidence strength, freshness, and what remains unknown visibly distinct.
- Public sources anchor evidence; discovery feeds, newsletters, social posts, video, transcripts, and search results are leads until resolved to durable sources.
- Research may create validated local lineage and stage candidates only through `public.stage_research_candidates_for_review` after deployed-contract verification.
- Canonical organization repairs require a private exact service-role snapshot, a separately typed candidate, individual Admin Review and a later individual Publish action. They never use batch acceptance/publication, hard deletion, reparenting or transfer.
- Research never accepts, publishes, deletes canonical records, or writes directly to organizations, capabilities, Public Needs, matches, sources, citations, or public media.
- Human Admin Review and the separate Publish checkpoint remain mandatory. A candidate file, staging row, accepted review, or successful test is not publication.
- Daily Signals alone may publish v3 editions to isolated `signal_*` tables and `brief-images/signals/` under its attribution, immutable evidence, event-identity and atomic publication contract. Editorial judgment determines substance and length; source images are optional and private social packaging is separately retryable. Identifiable original public reporting or statements support only their attributed claims. Signals cannot change the core atlas or post externally.
- Defence Signals is the public source-linked editorial stream. North Signal is the single consent-backed email newsletter: weekly delivery is the default and a new-Defence-Signal alert is an optional, independently consented delivery preference. A valid `no_publish` Signals run creates no edition and sends no alert. Keep internal `Daily Signals` workflow and scheduler names where they identify executable contracts; do not turn them into a public cadence promise.
- Visibility and North Signal are private decision-support workflows. They do not publish content, send campaigns, alter providers, or gain research authority.

## Private operator boundary

- The canonical project skills are installed under ignored `.agents/skills/`. Skill bodies, credentials, provider responses, raw queries, reports, and local configuration never enter Git.
- Raw visibility, Signals, and North Signal working data remain under their ignored `research/*/local/` directories.
- Secrets stay in approved local or provider stores. Never print, copy, commit, or expose service-role, MailerLite, OpenAI, Turnstile, email, Google, MapTiler, or visibility credentials.
- Create screenshots, mockups, decks, reports, launch packets, and other collateral only when Andrew explicitly requests that deliverable. Keep generated output local unless source control is separately approved.

## Git, concurrency, and handoffs

- `main` is the production and integration branch. Do not create a standing preview branch or duplicate Vercel build.
- Never use `git add .`. Stage explicit paths after separating application, governance, research lineage, and ignored private work.
- One writer owns the main checkout at a time. Read-only agents may share it.
- Explicitly concurrent writers use a temporary local Codex worktree on a `codex/*` branch. Do not push that branch or create a preview deployment unless Andrew explicitly authorizes it; integrate and remove it promptly.
- Credentialed research, Signals, visibility, and final release validation run from the main local checkout. Do not add `.worktreeinclude`, a custom agent, or project `.codex/config.toml` without a concrete approved need.
- Use a short completion block in the final response. Create a tracked active-plan file only for genuinely multi-session work, then move it to completed history. Do not generate routine handoff files.

## Validation router

| Change | Required minimum |
| --- | --- |
| Application or shared library | `pnpm test`, `pnpm lint` |
| Research skill, schema, staging, Review, or Publish | `pnpm research:validate` plus focused pipeline checks |
| Visibility tooling or contract | `pnpm visibility:validate` locally |
| Public routes, metadata, sitemap, structured data, sharing | Local route tests plus responsive and keyboard QA before push; bounded `pnpm launch:validate` against the exact ready deployment after push, with only affected canonical paths added |
| Map loading, clustering, or national projection | `pnpm scale:validate` plus live count reconciliation |
| Production release | Node 24, then `pnpm release:validate`, one push to `main`, exact GitHub/Vercel confirmation, bounded core-plus-affected `pnpm launch:validate`, affected-route smoke, `/api/health`, and live-state verification. Full production `pnpm launch:audit` is owned by the explicit-only `$tnm-site-assurance` workflow, requires its production acknowledgement and approved reason, and never runs for an ordinary push. |

Use the [Cross-System Contract](context/governance/Cross-System%20Change%20And%20Regression%20Contract.md) for the complete impact matrix. A successful build alone is never a complete regression result. For database migrations or rollbacks, inspect live migration and scheduled-job state and execute versioned operations in dependency order; the release owner is not expected to remember internal scheduler dependencies.

## Completion contract

When a material change affects the public journey, architecture, evidence or publication boundary, brand, skills, schedules, security posture, or release process, update the affected governance contract and [Development Log](context/governance/Development%20Log.md) in the same change.

Every completion report states:

- what changed across files, routes, schemas, skills, providers, and assets;
- what cross-system effects were considered;
- commands and workflows run, plus checks not run;
- production verification state and known exceptions;
- whether any migration, publication, campaign, outreach, or provider write still requires approval.

Memory may aid recall but never overrides the repository, installed local skill, live service, or deployed contract. Update memory only when Andrew explicitly asks.
