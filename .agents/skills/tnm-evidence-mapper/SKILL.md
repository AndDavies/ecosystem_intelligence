---
name: tnm-evidence-mapper
description: Add field-level public evidence, source confidence, and conservative derived mission or demand alignment to True North Map research candidates. Use when completing typed candidate bundles or assessing capability-to-mission and capability-to-public-demand relevance; keep sourced facts separate from derived analysis and never imply classified demand or endorsement.
---

# True North Map Evidence Mapper

This project-local skill is the evidence-mapping skill of record. Use it only within the current repository workflow and executable schemas.

Make every important public claim traceable and every interpretation visibly derived.

## Workflow

1. Confirm every source is canonical HTTPS and durable.
2. Add concise paraphrased evidence, a useful locator, accessed time, and source ID. Prefer complementary official identity, capability or program, location or contact, and current-activity sources when available.
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
7. Treat evidence recovery as an active research loop. For a plausible thin candidate, search at least three complementary lanes before deferral: canonical identity or newsroom, government or program evidence, and a durable directory, portfolio, procurement, award, partner, or industry source.
8. Separate core inclusion evidence from optional enrichment. Hard-stop only when identity, Canadian presence, a concrete offering or mandate, durable evidence, taxonomy, operational status, or duplicate safety cannot be resolved. Route non-blocking gaps to amber `reviewWarnings`.
9. Audit enrichment completeness. Ensure material identity, role, capability or program, relationship, location, public-contact, and current-activity fields found in the sources are represented or explicitly identified as unavailable or irrelevant.
10. Check that the generated reviewer rationale accurately summarizes the inclusion case, evidence strength, omitted or unavailable detail, and remaining review questions; do not let it introduce uncited facts.
11. For refresh candidates, require durable evidence for every changed field or child operation. Preserve existing evidence and citations; new evidence is appended. Newsletter, LinkedIn, social, video, podcast, and search-result content may retain discovery provenance but cannot be used as field evidence without a resolved durable source.
12. Do not evidence-map a candidate kind for live intake unless the deployed application contract supports that kind and schema. Keep unsupported shapes as research artifacts until their complete Review and Publish workflow exists.

## Demand boundary

Treat a source as public demand only when it states a concrete problem, desired outcome, funded action, challenge, or procurement activity. Eligible issuers include Canadian governments, departments, DND/CAF, the RCN, RCAF, Canadian Army, procurement and innovation authorities, NATO, and other public bodies. Company announcements remain event evidence. Every public-demand alignment carries a caveat that it is not eligibility, endorsement, customer interest, or classified demand.

Read [references/evidence-contract.md](references/evidence-contract.md) for validation paths.
