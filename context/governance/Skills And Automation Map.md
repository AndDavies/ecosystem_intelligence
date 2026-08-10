# True North Map System Registry and Skills Map

Status: canonical system registry
Owner: Andrew Davies
Last reviewed: 2026-08-10

## Purpose

This is the single registry for True North Map workflows, internal skills, schedules, executable contracts, providers, write authority, and human gates. It records the installed operating surface without making private skills or credentials repository content.

Production Supabase remains the only canonical queue and corpus. Local artifacts, issue packets, visibility reports, staging exports, and automation completion messages are never proof of live or published state.

The installed project-local research stages are the canonical skills of record and supersede cached or globally installed variants. Every validated `qualified` lead proceeds automatically to candidate building, evidence mapping, deterministic stewardship, and private Admin Review in the same active run; it does not pause for source-lead approval. Human authority begins with candidate review and remains separate from Publish.

The deployed executable interoperability surface recognizes `organization_bundle_v3` and `organization_refresh_bundle_v2` under `tnm-research-pipeline/1.7.1`, including structured signal/activity dates, explicit first activation and low/zero-yield readiness. The installed private research chain is aligned to its complete-run, exact-target, atomic-lineage, qualitative saturation and no-padding gates. Local skills still fail closed unless the deployed research contract advertises the compatible pipeline and supports the candidate kind and schema; deployment does not grant staging, acceptance, publication, or template-activation authority.

## System registry

<!-- registry:start -->
| ID | Type | Operator-facing | Location | Trigger | Inputs | Outputs | Writes or authority | Validator | Human gate | Status | Owner | Last reviewed |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| WF-01 | Workflow | Yes | `.agents/skills/tnm-autonomous-research/` | Andrew-invoked manual run | Production coverage, taxonomy, Source Book, durable sources | 1.7 comprehensive target lineage, exact dossier-readiness dispositions, and pending Admin Review candidates | May call the guarded staging RPC only after deployed compatibility; never accepts or publishes | Complete same-run specificity, coverage, qualitative saturation and staging gates; `pnpm research:validate` | Andrew reviews, accepts, and separately publishes; validated refresh edits require corrected artifacts and restaging | Active manual on deployed 1.7.1; next bounded corpus wave follows the reliability release | Andrew Davies | 2026-08-10 |
| WF-02 | Workflow | Yes | `.agents/skills/tnm-daily-signals/` | Daily automation or Andrew invocation | Durable source portfolio and isolated Signals contract | New v2 exact-eight edition or typed no-publish audit row, cited hero, private LinkedIn and X examples; credential-verified historical v1 repair remains supported | May write only isolated `signal_*` tables and `brief-images/signals/`; never posts externally | `pnpm signals:publish` edition/no-publish dry run, apply, idempotency, route and Admin verification | Deterministic editorial gates; Andrew may edit or archive | Paused for v2 release sequencing; manual invocation remains owner-controlled | Andrew Davies | 2026-08-10 |
| WF-03 | Workflow | Yes | `.agents/skills/tnm-north-signal/` | Andrew-invoked weekly or manual preparation | Published changes, approved Inoreader portfolio, selected discovery mail, durable sources | Ignored private weekly issue packet | Local private files only; no MailerLite campaign creation or sending | Skill and issue-packet validation | Andrew edits and sends in MailerLite | Active manual | Andrew Davies | 2026-08-08 |
| WF-04 | Workflow | Yes | `.agents/skills/tnm-visibility/` | Andrew invocation; scheduled trigger currently paused | Configured read-only providers and public sitemap | Ignored evidence, report, and allowlisted owner summary | Local files and sanitized dashboard acknowledgement only; no publication or outreach | `pnpm visibility:validate`, preflight, strict refresh | Andrew chooses any resulting product or editorial work | Active manual | Andrew Davies | 2026-08-09 |
| ST-01 | Internal skill | No | `.agents/skills/tnm-signal-refresh/` | Explicit coordinator delegation | Watchlists, watermarks, bounded source families | Qualified durable dated changes plus non-signal maintenance/context dispositions | Local lineage only | Research smoke and 1.7 record-specific validation | Review-first chain | Active explicit-only | Andrew Davies | 2026-08-10 |
| ST-02 | Internal skill | No | `.agents/skills/tnm-source-discovery/` | Explicit coordinator delegation | Collection plan, aliases, Source Book, Mission Areas, Public Needs | Qualified, deferred, and rejected leads with capability-, decision-, and source-anchored fit summaries | Local lineage only | Research validation | Qualified leads continue to candidate building | Active explicit-only | Andrew Davies | 2026-08-10 |
| ST-03 | Internal skill | No | `.agents/skills/tnm-candidate-builder/` | Explicit coordinator delegation | Qualified leads and live duplicate and taxonomy checks | Green or amber typed candidates with record-specific explanations and rationales | Local lineage only | Candidate schema and 1.7 focused tests | Stewardship and Admin Review | Active explicit-only | Andrew Davies | 2026-08-10 |
| ST-04 | Internal skill | No | `.agents/skills/tnm-evidence-mapper/` | Explicit coordinator delegation | Candidate, claim ledger, durable sources | Atomic factual predicates, assertion-matched notes, conflicts, unknowns, verification paths and complete coverage | Local lineage only | Claim-to-field and 1.7 specificity validation | Stewardship and Admin Review | Active explicit-only | Andrew Davies | 2026-08-10 |
| ST-05 | Internal skill | No | `.agents/skills/tnm-candidate-logo/` | Explicit coordinator delegation for organization candidates | Candidate and official website | Private logo provenance packet | No public upload or media publication | Logo packet and complete-run validation | Andrew reviews uncertain marks | Active explicit-only | Andrew Davies | 2026-08-10 |
| ST-06 | Internal skill | No | `.agents/skills/tnm-review-steward/` | Explicit coordinator delegation | Complete candidate batch and same-run lineage | 1.7-gated pending Admin Review intake with readable operations and source identity | Guarded staging RPC only | Deployed contract, exact-target, payload-parity, evidence, qualitative saturation and review-card checks | Andrew accepts and separately publishes | Active explicit-only | Andrew Davies | 2026-08-10 |
| AUTO-01 | Schedule | Yes | `~/.codex/automations/true-north-map-daily-signals/automation.toml` | Daily 06:30 America/Halifax when resumed | WF-02 | Published isolated edition or no-publish report | Same narrow WF-02 authority | Daily Signals complete gate | No external social or campaign action | Paused for v2 release sequencing | Andrew Davies | 2026-08-10 |
| AUTO-02 | Schedule | Yes | `~/.codex/automations/true-north-map-weekday-signal-refresh/automation.toml` | Weekdays 08:00 America/Halifax when resumed | WF-01 plus ST-01 through ST-06 | Pending Admin Review candidates or validated zero-candidate run | Guarded research staging only | Research readiness, validation, smoke, queue reconciliation | Andrew review and Publish | Paused | Andrew Davies | 2026-08-08 |
| AUTO-03 | Schedule | Yes | `~/.codex/automations/true-north-map-weekly-visibility-refresh/automation.toml` | Monday 08:00 America/Halifax when resumed | WF-04 | Private provider report and acknowledged owner summary | Same private WF-04 authority | Strict configured-provider and dashboard acknowledgement | Andrew prioritizes changes | Paused | Andrew Davies | 2026-08-09 |
| CT-01 | Executable contract | No | `app/src/lib/research/pipeline-schema.ts` | Research preparation, validation, smoke, and trusted import | Complete same-run typed artifacts | Canonical shape plus 1.7 record-specific cross-artifact validation | Defines candidate shape and fail-closed intake eligibility | Research tests and `pnpm research:validate` | Deployed Review and Publish compatibility | Active canonical | Andrew Davies | 2026-08-10 |
| CT-02 | Executable contract | No | `app/src/lib/signals/contract.ts` | Daily Signals packet construction and publication | Edition packet | Deterministic editorial and publication checks | Defines isolated Signals boundary | Signals tests and publisher dry run | Contract gate before apply | Active canonical | Andrew Davies | 2026-08-08 |
| CT-03 | Operating contract | No | `context/governance/Admin Workflow And Data Contract.md` | Admin Review and publication work | Candidate or editorial record | Readable audited private decision and explicit publication | Defines staff actions and public mutation boundary | Admin, RLS, publication, and route tests | Andrew is publication authority | Active canonical | Andrew Davies | 2026-08-10 |
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
| EX-08 | External system | No | MapLibre, MapTiler, and OpenStreetMap | Public atlas, dossier geography, or fixed landing specimen | Published compact coordinates; MapTiler style only after a successful preflight; OpenStreetMap fallback | Public spatial presentation | No canonical-data authority | Provider fallback, map loading, state, accessibility, and responsive checks | Public MapTiler key remains scoped; provider failure must not break the journey | Active production | Andrew Davies | 2026-08-10 |
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
