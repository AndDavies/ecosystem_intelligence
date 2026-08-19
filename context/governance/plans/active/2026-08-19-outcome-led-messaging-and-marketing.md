# Outcome-led messaging and marketing implementation

Status: production release authorized; exact deployment verification and Marketing handback pending
Owner: Andrew Davies
Implementation owner: MAIN DEV
Opened: 2026-08-19

## Current outcome

Reconcile True North Map around one outcome-led message system, update the complete public-copy and metadata surface, add a private campaign-attribution view to Admin Insights, and present a validated local visual preview for Andrew's approval.

This plan remains active until the separately authorized production release is verified and the final deployed contract is handed back to the Marketing task. Local completion does not authorize a commit, push, deployment, provider change, publication, campaign, social post, or outreach.

## Sources of truth

- Root `AGENTS.md`
- `context/governance/True North Map Project Overview.md`
- `context/governance/Project Status.md`
- `context/governance/Cross-System Change And Regression Contract.md`
- `content/brand/True North Map Brand System.md`
- `context/governance/PRD.md`
- Marketing task `01a0164b-e95c-7713-9ba5-c29990fe9b95`
- Approved 2026-08-18 marketing, distribution and community strategy report
- Production application and Supabase project `facoactpdckkhciamflk`

## Fixed message system

- Promise: **Make Canadian capability visible.**
- Headline: **Canada is building more than most people can see.**
- Category: **Canadian defence capability discovery.**
- Positioning: **True North Map helps people find Canadian defence and dual-use organizations and technologies, understand where they may fit, and decide who is worth speaking with next.**
- Journey: **See who can help. Understand why they matter. Start the right conversation.**
- Founder thesis: **The capability was here. The shared picture was not.**
- Campaign offer: **Bring one real question. See what Canada can do.**
- Trust: **Public sources cited. Facts and assessments kept separate. Human review.**

`Evidence-led` remains valid in methodology, research, review, evidence-strength, legal and governance contexts. It is no longer the public product category or primary sales claim.

## Workstreams

1. Canonical messaging and governance
   - Add a pure runtime brand-copy contract.
   - Reconcile AGENTS, Overview, PRD, Status and Brand System.
   - Add the canonical Marketing and Outreach Operations contract and index it.
2. Public-copy and journey sweep
   - Lead with user outcome, possible fit and next action.
   - Preserve facts, assessment labels, sources, limitations and non-endorsement boundaries.
   - Remove the unused duplicate homepage hero.
3. Metadata and social cards
   - Reconcile global, collection and dynamic metadata.
   - Remove permanent Public Beta and retired-category branding from social cards.
4. Private campaign measurement
   - Reuse current bounded attribution and raw event ledger.
   - Add campaign, source/medium, content, destination and meaningful-action views to Admin Insights.
   - Preserve QA/staff/test/internal exclusions and privacy boundaries.
5. Local validation and preview
   - Run governance, focused, full test, lint and Node 24 release checks.
   - Complete responsive, keyboard, CTA, UTM and social-card checks.
   - Produce the explicitly requested local screenshots, copy matrix, allowlist and Admin Insights test-data preview.

## Completed work

- [x] Read the approved Marketing task, report, supplied analysis and memory references.
- [x] Reconciled current Git/worktree state and preserved the existing untracked research run.
- [x] Read current governance and live production health, corpus summary and deployed research contract.
- [x] Implement canonical contracts and public surfaces.
- [x] Implement private campaign reporting.
- [x] Complete automated validation.
- [x] Complete local responsive and social-card previews.
- [x] Obtain Andrew's explicit production go-live approval.
- [ ] Release, verify production and hand back to Marketing.

## Validation record

- Node runtime: `v24.14.0`.
- Governance: `validate-governance-control-plane.mjs` passed with 18 active documents, 31 registry rows and zero warnings.
- Focused copy, metadata, acquisition, dossier and scorecard checks: 34 tests passed.
- Full tests: 69 files and 457 tests passed.
- TypeScript: `tsc --noEmit` passed.
- Lint: passed.
- `pnpm release:validate`: passed repository hygiene, governance, dependency audit, full tests, lint, 5,000-record scale validation and production-mode Next build.
- Browser: homepage, About, How It Works, Organizations, Copperstone Technologies, HELIX, Signals and North Signal checked at 390, 768, 1,024 and 1,440 pixels. Each settled route had one visible H1, no horizontal overflow and its primary next action in the first viewport.
- Social: root, organization and capability cards rendered at 1,200 by 630 pixels. The organization-card preview found and closed a long-copy layout defect before handoff.
- Measurement: non-personal local founder-pilot events exercise campaign/cohort, source/medium, content, destination and meaningful-outcome rows while the QA fixture remains excluded and no event is written.
- Preview artifacts: `/tmp/tnm-outcome-preview-20260819/` contains the requested route images, social cards, copy matrix and Admin Insights fixture view.
- Production `launch:validate` was not run before deployment. `launch:audit` was not run.

## Next safe action

Commit the approved explicit-path release directly to `main`, push once, verify
the exact GitHub and Vercel commit, run the bounded affected-route production
gate, and hand the deployed result back to Marketing. Do not change a provider,
publish, send, post or begin outreach as part of this application release.
