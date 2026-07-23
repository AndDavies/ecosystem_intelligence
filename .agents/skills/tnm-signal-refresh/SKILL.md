---
name: tnm-signal-refresh
description: Monitor multiple public and authenticated discovery sources for material technology, product, procurement, contract, funding, partnership, program, and demand changes; resolve durable evidence; match live True North Map records; and hand new or refresh leads into the private review-first pipeline. Use for manual or scheduled database refresh runs. Never publish or interact with social accounts.
---

# True North Map Signal Refresh

This project-local skill is the signal-refresh skill of record. It extends the existing research chain; it does not create a second review queue.

## Workflow

1. Read `AGENTS.md`, the active refresh run, and [references/signal-contract.md](references/signal-contract.md). Run `pnpm data:readiness`; Supabase failure is a hard stop.
2. Build live published-record and public-demand watchlists from production Supabase. Include IDs, slugs, aliases, domains, known sources, pending candidates, and `updated_at` baselines.
3. Select sources from at least four families: government/procurement/programs; published-company products/newsrooms; due high-priority Source Book rows; and one or more discovery feeds or ecosystem directories. Inspect at most 50 items in 45 minutes.
4. Use the Gmail connector for `Newsletters/Defence`. Use authenticated Chrome read-only for targeted LinkedIn/company/program/procurement searches when available. Never like, follow, connect, comment, message, submit, or use the general LinkedIn feed as the main search method. Browser unavailability is a warning; Supabase unavailability stops the run.
5. Split composite pages, newsletters, marketplaces, and digests into atomic signals. Strip tracking parameters, record redirects, resolve canonical HTTPS URLs, and generate deterministic fingerprints.
6. Treat Gmail, LinkedIn, social, video, podcasts, event commentary, and search results as discovery only. Resolve material claims to durable company, government, procurement, program, regulatory, funding, or technical sources before using them as field evidence.
7. Deduplicate the same event across channels while preserving distinct claims. Match each signal to live entities and pending candidates. Keep the intended existing target in `targetMatch`; use `duplicateCheck` only for accidental other-entity conflicts.
8. Disposition every signal and write `research_signal_batch_v1` under `research/ingestion/signal-batches-v1/`.
9. Hand qualified new-record leads and `record_refresh_lead` records automatically to `$tnm-candidate-builder`, then `$tnm-evidence-mapper` and `$tnm-review-steward`. Consolidate one refresh candidate per target per run.
10. Verify the deployed `/api/system/research-contract` supports the refresh candidate kind and schema before database staging. An unavailable or incompatible endpoint is a hard stop before `candidate_changes`; preserve the validated file-only artifacts and report the deployment dependency.
11. Confirm all candidates are pending in the existing Admin Review queue and stop. Never accept or publish them.

## Refresh rules

- Search with a seven-day overlap from the last successful watermark.
- Support technology launches/updates, contracts/awards, procurement notices, marketplaces/supply arrangements, government projects, partnerships/consortia, financing/ownership events, cohort participation, and official demand statements.
- Produce new organization/demand candidates, organization/demand refresh candidates, existing demand-match candidates, or deferred backlog items.
- Refresh operations are additive `set_field`, `add_child`, or `update_child` changes. V1 never deletes.
- Every operation includes before/after data, durable evidence IDs, and a reviewer explanation. Preserve existing evidence and stable IDs/slugs.
- A zero-candidate refresh is valid only when every extracted signal has a recorded disposition and at least four source families were searched.

Read [references/source-routing.md](references/source-routing.md) before using Gmail, Chrome, or LinkedIn.
