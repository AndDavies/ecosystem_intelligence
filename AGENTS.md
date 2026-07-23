# AGENTS

This file is the operating contract for agent work in the `Ecosystem Intelligence` project.

## Project Mission

`Ecosystem Intelligence` is the project and system category. Its public brand is `True North Map` at `https://truenorthmap.ca`: a simple, evidence-backed business intelligence, ecosystem-mapping, and engagement-management service for defence and strategic-tech teams. Supabase project `facoactpdckkhciamflk` is the sole canonical runtime, taxonomy, coverage, duplicate-check, and publication data source. Read live corpus counts from production rather than copying them into operating contracts. Expansion is governed by evidence quality and explicit candidate review and publication rather than a fixed release number.

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
- Promotion posture: source discovery -> deterministic lead qualification -> automatic candidate building -> validation -> private Admin Review -> human review and editing -> explicit publication.

## Agent Roles

- Product Builder: implements focused slices that preserve the current workflow.
- UX Reviewer: checks whether a first-time BD user can understand where to start and what to do next.
- Research Coordinator: owns source-lead scope, mission-area balance, batch planning, task routing, and readiness checks.
- Source Discovery Scout: finds source leads from company sites, press releases, government/program pages, publications, and broad web search.
- Company Profile Builder: converts validated qualified source leads into enriched company and capability profile drafts using existing taxonomy IDs only.
- Evidence And Mapping Analyst: maps capabilities to use cases/clusters and prepares evidence snippets, field citations, confidence notes, and `why_it_matters` rationale.
- Database And Review Steward: checks schema fit, duplicate risk, validation readiness, Supabase table shape, and promotion safety.
- Governance Reviewer: checks trust boundaries, review posture, and documentation drift.

## Research Skills Of Record

The six project-local skills below are the canonical skills of record for the current research and ingestion pipeline. Manual runs, scheduled runs, tests, and governance reviews must use these repository copies. They supersede cached or globally installed variants, older operator-guide instructions, and workflow assumptions embedded in historical run artifacts. `app/src/lib/research/pipeline-schema.ts` remains the executable data contract when prose and code differ.

- `.agents/skills/tnm-autonomous-research/`: live-database coverage, batch planning, limits, and handoffs.
- `.agents/skills/tnm-signal-refresh/`: multi-source monitoring, atomic-signal extraction, durable-evidence resolution, live entity matching, and refresh handoffs.
- `.agents/skills/tnm-source-discovery/`: broad prospect enumeration, evidence recovery, durable public-source discovery, and typed leads.
- `.agents/skills/tnm-candidate-builder/`: qualified-lead conversion into enriched green or amber organization, demand, or relationship candidates.
- `.agents/skills/tnm-evidence-mapper/`: field evidence, citations, confidence, and derived rationale.
- `.agents/skills/tnm-review-steward/`: live taxonomy and duplicate checks, deterministic validation, private review intake, and publication guardrails.

## Research Batch Protocol

- Run `pnpm data:readiness` before assigning a new research batch.
- Keep reusable source starting points in `research/source-book/known-sources.csv`.
- Keep plain-language source search rules in `research/source-book/source-search-playbook.md`.
- Expand the Global Source Book before creating source leads when the source base is thin or regionally narrow.
- Do not cap Global Source Book expansion at a fixed number of rows; record useful durable sources and unresolved search trails.
- Produce source leads before candidate records unless validated qualified source leads already exist.
- Use `discovery_batch` for broad expansion: enumerate 40-75 unique prospects across at least six source lanes, target 10 candidates, and require at least eight unless the run records specific exhaustion evidence.
- Use `deep_dossier` for 1-5 named organizations; search at least three complementary source lanes and prioritize portfolio depth over prospect volume.
- Use `refresh_batch` for multi-source change monitoring: 45 minutes, at most 50 inspected source items, at least four source families, at most 10 consolidated candidates, and a seven-day watermark overlap.
- Keep plausible unused prospects queued in the prospect inventory so later runs resume the backlog instead of rediscovering it.
- When creating source leads, choose an explicit reviewable batch size by Mission Area before work begins.
- Prefer one source-lead batch per Mission Area when review load or provenance clarity matters.
- A combined source-lead batch is acceptable only when leads are clearly grouped by Mission Area in `scope` and `leadSummary`.
- Every source lead must include organization, source URL, publisher, source type, summary, possible use cases/domains, confidence, follow-up questions, and `doNotIngestReason` when rejected or deferred.
- Every validated `qualified` lead proceeds automatically to candidate building in the same active run. Do not pause for source-lead approval. Deferred and rejected leads do not proceed.
- Enrich candidates to the depth supported by durable public evidence, including identity, aliases, role, capabilities or programs, public relationships, location, public contact paths, and current official activity when available and useful. Never pad or invent fields.
- Score inclusion separately from completeness. Route evidence-anchored candidates with non-blocking enrichment gaps to amber review with explicit warnings; missing legal name, direct contact, exact address, or exhaustive relationships is not by itself a hard stop.
- Before deferring a plausible thin prospect for evidence, record recovery attempts across at least three distinct source lanes.
- Candidate batches must follow `research/ingestion/schema/research-candidate-batch-v2.schema.json` and the executable contract in `app/src/lib/research/pipeline-schema.ts`.
- Before any live candidate staging, verify the deployed `/api/system/research-contract` supports every candidate kind and schema version in the batch. If not, stop at validated file-only artifacts. Database migrations and candidate staging must never lead the deployed Review and Publish interfaces.
- Refresh runs must write `research_signal_batch_v1`, disposition every atomic signal, and consolidate existing-record changes into one organization or demand refresh candidate per target per run.
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
- Deterministic evidence, taxonomy, and duplicate gates mark leads qualified, deferred, or rejected; qualified leads continue automatically.
- Company Profile Builder converts qualified leads into enriched company and capability records.
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

- `2026-07-23`: Reconciled the signal-refresh migration filenames with the applied production history, made unknown candidate types fail closed, added visible accepted-to-publish navigation, and introduced a deployed application-contract check that stops research intake before database staging when Review or Publish support is absent.
- `2026-07-23`: Added the sixth canonical `$tnm-signal-refresh` skill and weekday multi-source refresh schedule. Refresh runs now build live watchlists, extract and deduplicate atomic signals from official, Source Book, Gmail, LinkedIn, and ecosystem sources, resolve durable evidence, and stage additive organization or demand refresh candidates with target baselines and before/after operations. Admin Review and the human Publish checkpoint now support refresh diffs, provenance, stale-baseline rejection, stable-ID updates, appended evidence, and immediate route revalidation.

- `2026-07-22`: Completed the separated email-delivery stack: Zoho now hosts the monitored `andrew@truenorthmap.ca` mailbox and five operational aliases; MailerLite uses a verified `updates@truenorthmap.ca` sender, authenticated domain, consent-backed `True North Map Updates` group, lawful footer address, and signed lifecycle webhook; Supabase Auth sends branded security mail through domain-restricted Resend SMTP. Root SPF authorizes Zoho and MailerLite, service DKIM records are active, DMARC monitors at `p=none`, and controlled inbound and outbound tests passed. The obsolete Zoho mailbox/domain and ROOTED MailerLite sending domain were removed.

- `2026-07-22`: Rebuilt Canadian Defence Briefs as reviewed editorial articles rather than question-and-answer pages. Public briefs now use a compact title-and-image hero, thesis, bottom line, executive takeaways, narrative sections, evidence-bounded implications, a recommended next step, visible limits, and public sources. `/admin/briefs` now edits this article contract and manages the main image through an administrator-only Supabase Storage library, while preserving the existing review, source, record-link, RLS, and publication boundaries.

- `2026-07-22`: Published the five source-backed Defence Brief drafts prepared from the recompiled private knowledge base and simplified `/admin/briefs` for the sole administrator. Saving and publishing no longer require a manually entered rationale; administrator authorization, approved-source requirements, review identity and timestamps, publication state, and automatic audit events remain enforced.

- `2026-07-21`: Hardened Ask True North with deterministic live-snapshot preselection capped at 16 organizations, sanitized provider failure classes, private candidate and failure telemetry, and safe deterministic fallback. No embedding index or second corpus was introduced, so human-published records remain immediately eligible.

- `2026-07-21`: Reframed the public About page and marketing ethos around Andrew Davies's veteran and Combat Systems Engineering Officer background, his call to contribute to Canadian defence and sovereign capability, the missing shared picture he encountered, and the North Star of mapping what Canada can build and connecting the people ready to build it. Confirmed July 19 submissions and connection items are release-test fixtures and July 18 launch visuals are legacy assets excluded from the broader release.

- `2026-07-21`: Reconciled the broader public-sharing package with the current production product, added current positioning and channel-specific release copy, and established that the remaining release gates are operational checks and queue readiness rather than new features or a fixed corpus target. Exact live counts must be read from production; durable public claims use rounded values.

- `2026-07-21`: Added Canadian Defence Briefs as the reviewed public synthesis surface at `/briefs`, with source and record links, labelled interpretation, and administrator-only editing at `/admin/briefs`; raw packets and private wiki markdown remain outside the public runtime.

- `2026-07-21`: Established the private Canada-first Defence Wiki foundation as a sibling Obsidian root, with versioned read-only source-packet adapters for current Crashboard Turso intelligence and True North Map public evidence/source leads. The private wiki is not a public runtime and publication remains deferred behind a future reviewed Supabase candidate workflow.

- `2026-07-21`: Designated the five project-local TNM research skills as the canonical skills of record, superseding cached copies and older operator-guide workflow language; aligned the weekly schedule contract to the exact high-yield skill chain, queued-backlog reuse, prospect inventory, evidence recovery, green/amber review, and verified private Admin Review completion.

- `2026-07-21`: Reworked autonomous research for higher yield: broad runs now build 40-75 prospect inventories across six lanes, target 8-10 private candidates, retain queued backlogs, rank reusable sources, require three-lane evidence recovery before deferral, and admit useful amber candidates with explicit reviewer warnings while preserving duplicate, identity, Canada, evidence, taxonomy, and publication hard stops.

- `2026-07-21`: Added private subscriber administration and MailerLite delivery synchronization while keeping the production database as the consent ledger; sender-domain authentication and campaign sending remain gated on a monitored True North Map address and confirmed campaign-footer mailing address.

- `2026-07-20`: Removed the redundant human source-lead approval pause, made qualified leads continue automatically into enriched typed candidates, and kept human editing, acceptance, and publication in the private Admin workflow.

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
