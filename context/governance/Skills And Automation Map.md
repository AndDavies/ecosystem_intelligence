# True North Map System Registry and Skills Map

Status: canonical system registry
Owner: Andrew Davies
Last reviewed: 2026-08-09

## Purpose

This is the single registry for True North Map workflows, internal skills, schedules, executable contracts, providers, write authority, and human gates. It records the installed operating surface without making private skills or credentials repository content.

Production Supabase remains the only canonical queue and corpus. Local artifacts, issue packets, visibility reports, staging exports, and automation completion messages are never proof of live or published state.

The installed project-local research stages are the canonical skills of record and supersede cached or globally installed variants. Every validated `qualified` lead proceeds automatically to candidate building, evidence mapping, deterministic stewardship, and private Admin Review in the same active run; it does not pause for source-lead approval. Human authority begins with candidate review and remains separate from Publish.

The tracked executable interoperability surface now recognizes `organization_bundle_v3` and `organization_refresh_bundle_v2`. Local skills must continue to fail closed until the deployed research contract advertises those versions; deployment support does not grant staging, acceptance, publication, or template-activation authority.

## System registry

<!-- registry:start -->
| ID | Type | Operator-facing | Location | Trigger | Inputs | Outputs | Writes or authority | Validator | Human gate | Status | Owner | Last reviewed |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| WF-01 | Workflow | Yes | `.agents/skills/tnm-autonomous-research/` | Andrew-invoked manual run | Production coverage, taxonomy, Source Book, durable sources | Typed run lineage, dossier-readiness dispositions, and pending Admin Review candidates | May call the guarded staging RPC only; never accepts or publishes | `pnpm research:validate` and deployed research contract | Andrew reviews, edits, accepts, and separately publishes | Active manual | Andrew Davies | 2026-08-09 |
| WF-02 | Workflow | Yes | `.agents/skills/tnm-daily-signals/` | Daily automation or Andrew invocation | Durable source portfolio and isolated Signals contract | Six-to-eight-item edition or valid no-publish report, cited hero, private LinkedIn and X examples | May write only isolated `signal_*` tables and `brief-images/signals/`; never posts externally | `pnpm signals:publish` dry run, apply, idempotency, route and Admin verification | Deterministic editorial gates; Andrew may edit or archive | Active automated | Andrew Davies | 2026-08-08 |
| WF-03 | Workflow | Yes | `.agents/skills/tnm-north-signal/` | Andrew-invoked weekly or manual preparation | Published changes, approved Inoreader portfolio, selected discovery mail, durable sources | Ignored private weekly issue packet | Local private files only; no MailerLite campaign creation or sending | Skill and issue-packet validation | Andrew edits and sends in MailerLite | Active manual | Andrew Davies | 2026-08-08 |
| WF-04 | Workflow | Yes | `.agents/skills/tnm-visibility/` | Andrew invocation; scheduled trigger currently paused | Configured read-only providers and public sitemap | Ignored evidence, report, and allowlisted owner summary | Local files and sanitized dashboard acknowledgement only; no publication or outreach | `pnpm visibility:validate`, preflight, strict refresh | Andrew chooses any resulting product or editorial work | Active manual | Andrew Davies | 2026-08-09 |
| ST-01 | Internal skill | No | `.agents/skills/tnm-signal-refresh/` | Explicit coordinator delegation | Watchlists, watermarks, bounded source families | Dispositioned atomic signal batch and typed leads | Local lineage only | Research smoke and schema validation | Review-first chain | Active explicit-only | Andrew Davies | 2026-08-09 |
| ST-02 | Internal skill | No | `.agents/skills/tnm-source-discovery/` | Explicit coordinator delegation | Collection plan, aliases, Source Book, Mission Areas, Public Needs | Qualified, deferred, and rejected leads plus claim lineage | Local lineage only | Research validation | Qualified leads continue to candidate building | Active explicit-only | Andrew Davies | 2026-08-09 |
| ST-03 | Internal skill | No | `.agents/skills/tnm-candidate-builder/` | Explicit coordinator delegation | Qualified leads and live duplicate and taxonomy checks | Green or amber typed candidate bundles | Local lineage only | Candidate schema and focused tests | Stewardship and Admin Review | Active explicit-only | Andrew Davies | 2026-08-09 |
| ST-04 | Internal skill | No | `.agents/skills/tnm-evidence-mapper/` | Explicit coordinator delegation | Candidate, claim ledger, durable sources | Field lineage, conflicts, assessments, unknowns, verification path | Local lineage only | Claim-to-field and evidence validation | Stewardship and Admin Review | Active explicit-only | Andrew Davies | 2026-08-09 |
| ST-05 | Internal skill | No | `.agents/skills/tnm-candidate-logo/` | Explicit coordinator delegation for organization candidates | Candidate and official website | Private logo provenance packet | No public upload or media publication | Logo packet validation | Andrew reviews uncertain marks | Active explicit-only | Andrew Davies | 2026-08-09 |
| ST-06 | Internal skill | No | `.agents/skills/tnm-review-steward/` | Explicit coordinator delegation | Complete candidate batch and run lineage | Validated pending Admin Review intake | Guarded staging RPC only | Deployed contract, duplicate, taxonomy, evidence, and review-card checks | Andrew accepts and separately publishes | Active explicit-only | Andrew Davies | 2026-08-09 |
| AUTO-01 | Schedule | Yes | `~/.codex/automations/true-north-map-daily-signals/automation.toml` | Daily 06:30 America/Halifax | WF-02 | Published isolated edition or no-publish report | Same narrow WF-02 authority | Daily Signals complete gate | No external social or campaign action | Active | Andrew Davies | 2026-08-08 |
| AUTO-02 | Schedule | Yes | `~/.codex/automations/true-north-map-weekday-signal-refresh/automation.toml` | Weekdays 08:00 America/Halifax when resumed | WF-01 plus ST-01 through ST-06 | Pending Admin Review candidates or validated zero-candidate run | Guarded research staging only | Research readiness, validation, smoke, queue reconciliation | Andrew review and Publish | Paused | Andrew Davies | 2026-08-08 |
| AUTO-03 | Schedule | Yes | `~/.codex/automations/true-north-map-weekly-visibility-refresh/automation.toml` | Monday 08:00 America/Halifax when resumed | WF-04 | Private provider report and acknowledged owner summary | Same private WF-04 authority | Strict configured-provider and dashboard acknowledgement | Andrew prioritizes changes | Paused | Andrew Davies | 2026-08-09 |
| CT-01 | Executable contract | No | `app/src/lib/research/pipeline-schema.ts` | Research preparation and validation | Typed artifacts | Canonical candidate and run validation | Defines shape only | Research tests and `pnpm research:validate` | Deployed Review and Publish compatibility | Active canonical | Andrew Davies | 2026-08-09 |
| CT-02 | Executable contract | No | `app/src/lib/signals/contract.ts` | Daily Signals packet construction and publication | Edition packet | Deterministic editorial and publication checks | Defines isolated Signals boundary | Signals tests and publisher dry run | Contract gate before apply | Active canonical | Andrew Davies | 2026-08-08 |
| CT-03 | Operating contract | No | `context/governance/Admin Workflow And Data Contract.md` | Admin Review and publication work | Candidate or editorial record | Audited private decision and explicit publication | Defines staff actions and public mutation boundary | Admin, RLS, publication, and route tests | Andrew is publication authority | Active canonical | Andrew Davies | 2026-08-09 |
| CT-04 | Operating contract | No | `context/governance/Cross-System Change And Regression Contract.md` | Every material change | Change impact | Required validation and completion evidence | No runtime write | Repository and release checks | Release owner decides go or no-go | Active canonical | Andrew Davies | 2026-08-08 |
| CT-05 | Operating contract | No | `context/governance/Production Release Runbook.md` | Production release or rollback | Validated commits and live dependency state | One production deployment and verification record | GitHub and Vercel release operations only | `pnpm release:validate` and production smoke | Andrew authorizes release-sensitive external actions | Active canonical | Andrew Davies | 2026-08-09 |
| CT-06 | Control-plane contract | No | `AGENTS.md` and `context/governance/INDEX.md` | Every Codex task | Repository and live state | Correct contract routing and completion report | No product authority | `pnpm governance:validate` | Andrew controls scope and approvals | Active canonical | Andrew Davies | 2026-08-08 |
| EX-01 | External system | Yes | Supabase project `facoactpdckkhciamflk` | Application, auth, storage, review, publication | Approved runtime requests and explicit staff actions | Canonical records, audit state, consent, storage | Sole runtime and publication database; direct writes are restricted | RLS, migration, release, health, and live-state checks | Andrew controls review and publication | Active production | Andrew Davies | 2026-08-08 |
| EX-02 | External system | Yes | GitHub `AndDavies/ecosystem_intelligence` | Explicit commit and push | Reviewed tracked files | Versioned source and CI evidence | Source control only; no private operator artifacts | Release Validation, CodeQL, secret scanning | Andrew-approved task scope | Active production | Andrew Davies | 2026-08-08 |
| EX-03 | External system | Yes | Vercel production project | Push to `main` | GitHub production commit and server-only environment | Public application, DNS, analytics, deployment logs | Application deployment only | Build, runtime logs, health and route smoke | `main` is production; previews require explicit approval | Active production | Andrew Davies | 2026-08-08 |
| EX-04 | External system | Yes | MailerLite True North Map workspace | Consent sync, webhook, or Andrew campaign action | Supabase consent and Andrew-reviewed campaign | Subscriber group, lifecycle state, North Signal delivery | Delivery surface, not consent authority or auth mail | Sync, webhook, unsubscribe, sender checks | Andrew sends campaigns | Active production | Andrew Davies | 2026-08-08 |
| EX-05 | External system | No | Resend through Supabase SMTP | Authentication email event | Supabase Auth template and transactional address | Branded authentication and security email | Transactional auth mail only | Supabase auth and delivery checks | Provider credential remains server-only | Active production | Andrew Davies | 2026-08-08 |
| EX-06 | External system | Yes | Zoho Mail | Human correspondence | Monitored True North Map mailboxes and aliases | Inbound and outbound human email | Human mail only | Delivery and domain-auth checks | Andrew controls mailbox actions | Active production | Andrew Davies | 2026-08-08 |
| EX-07 | External system | No | Cloudflare Turnstile | Protected public form or authentication initiation | Public site key and server secret | Bot-risk verification token | Verification only | Challenge, expiry, failure, and server validation tests | Secrets remain provider or Vercel-side | Active production | Andrew Davies | 2026-08-08 |
| EX-08 | External system | No | MapTiler and MapLibre | Public map or fixed landing specimen | Published compact coordinates and style key | Public spatial presentation | No canonical-data authority | Map loading, state, accessibility, and responsive checks | Production key remains scoped | Active production | Andrew Davies | 2026-08-08 |
| EX-09 | External system | No | OpenAI Responses API | Ask True North request | Published bounded catalogue and structured prompt | Ranked known records and bounded explanation | No browsing, publication, or second corpus | Provider success, timeout, failure, rate limit, and deterministic fallback | Published corpus remains authoritative | Active production | Andrew Davies | 2026-08-08 |
| EX-10 | External system | No | Google OAuth, Search Console, GA4, BigQuery, and Gmail discovery | Auth, consented analytics, visibility, or explicitly selected discovery | Purpose-bounded Google data | Auth state, aggregate private evidence, or discovery leads | Boundaries vary by workflow; Gmail discovery is read-only | Auth matrix, analytics consent, visibility provider checks | Private and public paths remain separated | Active mixed | Andrew Davies | 2026-08-08 |
| EX-11 | External system | No | DataForSEO, CrUX, PageSpeed, Bing, Ahrefs, and imported visibility sources | WF-04 configured-provider refresh | Read-only provider evidence | Ignored local visibility evidence | No billing change, indexing, outreach, or publication | Strict provider and route coverage rules | Andrew chooses downstream action | Active or explicit unknown by configuration | Andrew Davies | 2026-08-08 |
<!-- registry:end -->

## Research promotion boundary

```text
Durable evidence and private lineage
  -> guarded pending Admin Review intake
  -> human edit and acceptance
  -> separate Publish action
  -> canonical Supabase mutation
  -> audit and route revalidation
```

`research_runs` is audit metadata. Candidate files, smoke tests, staging rows, accepted candidates, logo packets, issue packets, and automation completion messages are not public records.

## Worktree and deployment policy

- The main checkout is the integration, credentialed-operator, and final-validation workspace.
- Read-only agents may share it. Explicitly concurrent writers use a temporary local `codex/*` worktree.
- Temporary worktree branches are not pushed and do not create Vercel previews without explicit approval. Integrate and remove them promptly.
- Do not add `.worktreeinclude`; private local skills and credentials must not be copied into secondary worktrees.

## Contract links

- [Governance Index](./INDEX.md)
- [Research Pipeline](./Autonomous%20Ecosystem%20Research%20Pipeline.md)
- [Research Schema and Source Contract](./Research%20Agent%20Schema%20And%20Source%20Contract.md)
- [Admin Workflow and Data Contract](./Admin%20Workflow%20And%20Data%20Contract.md)
- [Cross-System Change and Regression Contract](./Cross-System%20Change%20And%20Regression%20Contract.md)
- [Production Release Runbook](./Production%20Release%20Runbook.md)
- [Email and Domain Infrastructure](./Email%20And%20Domain%20Infrastructure.md)
- [North Signal Email Operations](./Email%20Updates%20Operations.md)

## Validation routing

- Research changes: local skill validation, focused pipeline tests, `pnpm data:readiness`, `pnpm research:validate`, deployed-contract compatibility, and review-card inspection.
- Visibility changes: `pnpm visibility:validate`; add application checks only when tracked interoperability or UI changes.
- North Signal changes: skill, source-registry, packet, and link validation; Andrew still controls MailerLite delivery.
- Daily Signals changes: packet, migration and RLS fixture, dry-run, idempotent apply, image and social examples, route metadata, Admin editing, and unchanged core-corpus verification.
- Production releases: Node 24, `pnpm release:validate`, GitHub and Vercel confirmation, `/api/health`, affected-route smoke, deployment logs, and live-state verification.
