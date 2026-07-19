---
name: tnm-evidence-mapper
description: Add field-level public evidence, source confidence, and conservative derived mission or demand alignment to True North Map research candidates. Use when completing typed candidate bundles or assessing capability-to-mission and capability-to-public-demand relevance; keep sourced facts separate from derived analysis and never imply classified demand or endorsement.
---

# True North Map Evidence Mapper

Make every important public claim traceable and every interpretation visibly derived.

## Workflow

1. Confirm every source is canonical HTTPS and durable.
2. Add concise paraphrased evidence, a useful locator, accessed time, and source ID.
3. Add required `fieldPath` evidence:
   - `organization.description`
   - `capabilities.<slug>.summary`
   - `programs.<slug>.summary`
   - `relationships.<index>.publicSummary`
   - `demandSource.summary`
   - `requirements.<slug>.problemStatement`
   - `program.summary`
   - `participations.<index>.publicSummary`
4. Mark a fact `source_backed`; mark analyst alignment `derived`.
5. Assess source confidence separately from mission or demand alignment confidence.
6. Use only existing mission and technical-domain slugs.
7. Defer evidence gaps instead of lowering the quality bar.
8. Check that the generated reviewer rationale accurately summarizes the inclusion case, evidence strength, and remaining review questions; do not let it introduce uncited facts.

## Demand boundary

Treat a source as public demand only when it states a concrete problem, desired outcome, funded action, challenge, or procurement activity. Eligible issuers include Canadian governments, departments, DND/CAF, the RCN, RCAF, Canadian Army, procurement and innovation authorities, NATO, and other public bodies. Company announcements remain event evidence. Every public-demand alignment carries a caveat that it is not eligibility, endorsement, customer interest, or classified demand.

Read [references/evidence-contract.md](references/evidence-contract.md) for validation paths.
