# AGENTS

This file is the operating contract for agent work in the `Ecosystem Intelligence` project.

## Project Mission

`Ecosystem Intelligence` is the project and system category. Its public brand is `True North Map` at `https://truenorthmap.ca`: a simple, evidence-backed business intelligence, ecosystem-mapping, and engagement-management service for defence and strategic-tech teams. Supabase project `facoactpdckkhciamflk` is the sole canonical runtime, taxonomy, coverage, duplicate-check, and publication data source. The live public beta contains 35 reviewed organizations, 31 reviewed technologies, six public problem statements, and seven reviewed public demand matches. Expansion is governed by evidence quality and explicit human review rather than a fixed release number.

The strategic wedge is:

Mission Area / Use Case -> top targets -> why now -> evidence and confidence -> gaps and tradeoffs -> saved Working List.

## Primary Users

- BD and engagement users who need to know who to engage first and why.
- Product and strategy users validating mission-led capability landscapes.
- Reviewers and operators maintaining a defensible evidence-backed dataset.

## Non-Goals

- Do not turn the product into a broad CRM.
- Do not build outbound sequencing, contact management, or relationship mapping unless explicitly approved.
- Do not treat it as a generic market database or broad AI research assistant.
- Do not imply access to classified DND/CAF, NATO, or partner planning guidance.

## Shared Vocabulary

- Mission Area / Use Case: the mission decision or enabling problem.
- Technical Domain: the capability landscape when the technology area is the entry point.
- Cluster: a subgroup of related capabilities.
- Capability: a product, system, or solution that can be assessed.
- Company: the organization associated with capabilities.
- Evidence: citations, snippets, freshness, and source support.
- Derived Read: interpretation from current records, not a source-backed fact by itself.
- Working List: a saved shortlist of targets with status, owner, next step, due date, and rationale.

## Operating Principles

- Preserve the mission-to-engagement wedge before adding features.
- Prefer clarity, density, and decision usefulness over decorative redesign.
- Keep source-backed facts separate from derived analysis and suggested next steps.
- Make uncertainty, weak evidence, stale records, and coverage gaps visible.
- Update `context/governance/` when implementation changes the roadmap or user-facing workflow.
- Check git status before editing and never revert unrelated user work.

## Data And Evidence Rules

- Public sources are evidence anchors, not proof of classified demand.
- Use official sources where possible for policy alignment.
- Do not promote a policy theme into an active Mission Area until company and capability coverage can support it.
- AI or heuristic content must remain reviewable and labeled as derived when it is not a direct citation.
- Keep social media, YouTube channels, and YouTube transcripts as discovery inputs in v1 unless they resolve to durable canonical evidence.
- Do not expand ingestion schemas for social or YouTube sources until a dedicated source/resource graph is approved.

## Agent System Defaults

- Operating mode: batch research first.
- Write policy: review-first; agents do not autonomously write to core Supabase tables.
- First coverage lane: all active Mission Areas / Use Cases.
- Global Source Book expansion is uncapped and recursive; keep going until time, tool, or reviewer limits require a stop.
- Source-lead batch sizes are scoped only when preparing reviewable lead artifacts.
- Source posture: durable public sources first.
- Promotion posture: source leads -> human review -> candidate batch -> validation -> review packet -> explicit promotion.

## Agent Roles

- Product Builder: implements focused slices that preserve the current workflow.
- UX Reviewer: checks whether a first-time BD user can understand where to start and what to do next.
- Research Coordinator: owns source-lead scope, mission-area balance, batch planning, task routing, and readiness checks.
- Source Discovery Scout: finds source leads from company sites, press releases, government/program pages, publications, and broad web search.
- Company Profile Builder: converts approved source leads into company and capability profile drafts using existing taxonomy IDs only.
- Evidence And Mapping Analyst: maps capabilities to use cases/clusters and prepares evidence snippets, field citations, confidence notes, and `why_it_matters` rationale.
- Database And Review Steward: checks schema fit, duplicate risk, validation readiness, Supabase table shape, and promotion safety.
- Governance Reviewer: checks trust boundaries, review posture, and documentation drift.

## Project-Local Skills

- `.agents/skills/tnm-autonomous-research/`: live-database coverage, batch planning, limits, and handoffs.
- `.agents/skills/tnm-source-discovery/`: durable public-source discovery and typed leads.
- `.agents/skills/tnm-candidate-builder/`: approved-lead conversion into typed organization, demand, or relationship candidates.
- `.agents/skills/tnm-evidence-mapper/`: field evidence, citations, confidence, and derived rationale.
- `.agents/skills/tnm-review-steward/`: live taxonomy and duplicate checks, deterministic validation, private review intake, and publication guardrails.

## Research Batch Protocol

- Run `pnpm data:readiness` before assigning a new research batch.
- Keep reusable source starting points in `research/source-book/known-sources.csv`.
- Keep plain-language source search rules in `research/source-book/source-search-playbook.md`.
- Expand the Global Source Book before creating source leads when the source base is thin or regionally narrow.
- Do not cap Global Source Book expansion at a fixed number of rows; record useful durable sources and unresolved search trails.
- Produce source leads before candidate records unless approved source leads already exist.
- When creating source leads, choose an explicit reviewable batch size by Mission Area before work begins.
- Prefer one source-lead batch per Mission Area when review load or provenance clarity matters.
- A combined source-lead batch is acceptable only when leads are clearly grouped by Mission Area in `scope` and `leadSummary`.
- Every source lead must include organization, source URL, publisher, source type, summary, possible use cases/domains, confidence, follow-up questions, and `doNotIngestReason` when rejected or deferred.
- Candidate batches must follow `research/ingestion/schema/research-candidate-batch-v2.schema.json` and the executable contract in `app/src/lib/research/pipeline-schema.ts`.
- Promotion remains human-reviewed through validation and review tooling.

## Source Hierarchy

Use sources in this order:

1. Official company product, news, investor, documentation, or press-release pages.
2. Government, NATO, defence program, procurement, or policy sources.
3. Reputable industry publications with direct company or program references.
4. Social media, YouTube channels, and transcripts only as discovery paths to durable sources.
5. Secondary summaries only when they lead to primary or durable sources.

Reject or defer:

- non-canonical URLs
- non-HTTPS URLs
- browser citation tokens
- copied report markers
- social posts without durable corroborating links
- vague marketing pages that do not describe a concrete capability
- claims that cannot be tied to source-backed field citations

## Agent Handoffs

- Research Coordinator assigns Mission Area scope and target counts to Source Discovery Scout.
- Source Discovery Scout returns validated source-lead JSON and flags weak, rejected, or follow-up-only leads.
- Human review approves which source leads may become candidate records.
- Company Profile Builder converts approved leads into company and capability records.
- Evidence And Mapping Analyst adds mappings, evidence snippets, field citations, confidence notes, and rationale.
- Database And Review Steward checks schema fit, duplicate risk, validation output, and promotion readiness.
- Human reviewer explicitly approves promotion.

## Supabase MCP Guardrails

Supabase MCP is configured for the public-atlas project `facoactpdckkhciamflk`.

Allowed in normal agent runs:

- read table schemas
- read taxonomy/reference data
- check duplicate risk
- inspect data-stage coverage
- validate whether candidate output fits the database
- invoke `public.stage_research_candidates_for_review` with the current run's validated, non-publishable staging export to create private pending candidates

Not allowed without explicit human approval:

- `apply_migration`
- `execute_sql` writes
- direct inserts or updates to published `organizations`, `capabilities`, mission or demand matches, `sources`, `evidence_snippets`, or `field_citations`
- promotion of candidate batches
- any candidate intake path other than `public.stage_research_candidates_for_review`

If Supabase MCP reports reauthentication or permission failure, stop database inspection and surface the setup issue. Do not silently fall back to assumptions for schema, taxonomy, or duplicate checks.

## Validation Workflow

Before BD sharing, run:

```bash
pnpm release:validate
```

This command runs tests, lint, typed v2 research validation, live production coverage checks, and the production build. It requires production database configuration and fails closed when the connection is unavailable.

Browser QA should cover:

- `/`
- `/organizations`
- `/organizations/kraken-robotics`
- `/capabilities/kraken-katfish-sas`
- `/demand`
- `/demand/land-formation-combat-effectiveness`
- `/collections`
- `/account`
- `/admin/review`
- `/admin/demand-signals`
- `/admin/demand-matches`
- `/admin/organizations/[id]/edit`

## Change Log

- `2026-07-20`: Marked the public beta release fallback at `beta-release-2026-07-20-pre-ask-true-north` and added Ask True North as a constrained published-corpus discovery layer. It uses known records and citations only, separates derived fit from source support, falls back safely, and does not change the research, review, or publication contracts.
- `2026-07-19`: Added relationship-safe public Demand Signals administration, enriched the complete live beta corpus with evidence-bounded outcome language, and published seven individually reviewed demand matches with dual-source citations and reviewer rationales.
- `2026-07-19`: Made the production database the sole runtime and research source, removed the bundled and CSV-era data paths, retired v1 ingestion tooling, and consolidated validation around the typed v2 review-first pipeline.
- `2026-07-19`: Added decision-led public profiles, plain-language discovery and editor terminology, official public-contact editing, and a private review-first technology-to-demand matching workflow; replaced the fixed corpus freeze with evidence-backed human-approved expansion.
- `2026-07-19`: Retired the authenticated legacy workspace routes and their old data/action stack, made capability dossiers public-only, removed legacy search and export modes, and aligned active QA with the True North Map surface.
- `2026-07-19`: Removed stale full-route publication visibility from organization and demand indexes, generalized public demand beyond NATO, and added typed recent-publication confirmation with direct live links.
- `2026-07-19`: Required generated reviewer rationale on typed research candidates and connected public-demand candidates to the same human Review and Publish workflow as organizations.
- `2026-07-19`: Connected successful autonomous research runs directly to private candidate review; `research_runs` remains hidden audit metadata and is not a review or promotion step.
- `2026-07-18`: Implemented the bounded Codex-native autonomous research pipeline, typed organization and demand contracts, repository skills, two passing shadow cycles, and a weekly review-first schedule.
- `2026-07-18`: Restored the canonical `research/` workspace, established True North Map (`https://truenorthmap.ca`) as the public brand and canonical domain, and froze the public-beta corpus at 30 reviewed records.
- `2026-07-15`: Separated the workspace into `app/`, `research/`, `context/`, and `content/`; root package commands continue to forward to the application.
- `2026-04-19`: Initial scaffold created.
- `2026-04-19`: Added project-local skills scaffolding.
- `2026-04-29`: Replaced scaffold with current mission, non-goals, vocabulary, evidence rules, and validation workflow.
- `2026-04-30`: Added review-first batch research agent system, five focused agent roles, source hierarchy, handoffs, and Supabase MCP guardrails.
- `2026-07-15`: Pointed Supabase guardrails to the new public-atlas project and simplified organization dossiers around one canonical entity row.
