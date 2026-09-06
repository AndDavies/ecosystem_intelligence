# True North Map Project Status

Status: production and review-first data operation
Owner: Andrew Davies
Last reviewed: 2026-09-06
Canonical production: Supabase project `facoactpdckkhciamflk`
Public brand: [True North Map](https://truenorthmap.ca)

## Current operating position

True North Map is in production. The September 5 desktop design release is the tracked baseline. Production and live service reads establish deployment, taxonomy, counts, queues, consent and provider state; this document does not certify a release or turn historical counts into current facts.

Research remains Codex-led, manually invoked or owner-scheduled, review-first and private. The calling Codex task controls its model and reasoning effort. Pipeline 1.8.0 / Review v4 remains the deployed compatibility boundary: exact baselines, durable leaf evidence, private guarded intake, human Admin Review and separate Publish. Canonical repairs use their separate snapshot and individual review/publication contract.

Daily Signals remains manual-only under its isolated v3 publication contract. North Signal is the consent-backed newsletter; delivery and provider writes retain their own authority. Visibility uses bounded technical sampling; full production site assurance requires explicit invocation. Consult the System Registry and actual scheduler/provider state when touching those workflows.

## September 6 local implementation

The approved efficiency changes add reusable private snapshots, deterministic refresh assembly, a bounded public-source cache, focused enrichment scope and one shared finalization validation gate with a resumable intake receipt. Local skills route by mode and reuse the calling task's model selection. The optional public assistant requires an explicit `OPENAI_MODEL` and key; there is no fallback model in application code. Existing production environment settings are unchanged.

These are locally checkpointed changes verified by 840 passing tests, typecheck, lint, research, skill and governance checks, pending any later owner-authorized release. No new research intake, canonical write, migration, publication, campaign or provider change is part of this implementation. Previously prepared research artifacts remain intact. A September 6 read-only reconciliation confirmed both candidates from run `tnm-manual-20260906074301` were subsequently published by the owner; their original research/intake lineage is retained without rewriting the run history.

## Codex instruction migration

Project guidance and all eleven installed private skills now share the [Codex Workflow Contract](Codex%20Workflow%20Contract.md), tuned for GPT-6 Astra. Andrew retains control of the calling task's model and effort. Startup reads, authorized follow-through, interrupted work and proportional checks are consistent across research, Signals, North Signal, visibility and site assurance. This local instruction migration makes no API, provider, schedule, schema or publication change; it is not a production release or a measured model-performance claim.

## Operating links

- [Project Overview](True%20North%20Map%20Project%20Overview.md): current product, architecture and trust boundary.
- [Cross-System Contract](Cross-System%20Change%20And%20Regression%20Contract.md): choose the affected-system regression level.
- [System Registry](Skills%20And%20Automation%20Map.md): skills, workflows, schedules and providers.
- [Research Contract](Research%20Agent%20Schema%20And%20Source%20Contract.md): evidence and candidate requirements.
- [Admin Workflow](Admin%20Workflow%20And%20Data%20Contract.md): Review and Publish authority.
- [Remediation Log](Security%20And%20Reliability%20Remediation%20Log.md): unresolved reliability/security work.
- [Development Log](Development%20Log.md): dated implementation and verification records.

## Historical checkpoints

The [status history through September 5](../archive/governance/Project%20Status%20-%20through%202026-09-05.md) retains prior releases, counts, validation results and follow-ups. Consult a specific checkpoint only when it explains the present task; it is not mandatory startup reading or live-state evidence.
