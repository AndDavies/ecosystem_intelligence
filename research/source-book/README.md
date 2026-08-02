# Research Source Book

This folder stores reusable research starting points before they become source leads or database-ready candidate records.

Use it for the growing list of places the research agents should check repeatedly.

Global Source Book expansion is intentionally uncapped. Keep adding useful durable sources and recursive trails until a time, tool, reviewer, or handoff limit requires a stop.

## Files

- `known-sources.csv`: structured source book for publications, company pages, press rooms, government pages, YouTube channels, social accounts, conferences, research labs, procurement portals, and other repeatable research sources.
- `newsletter-subscriptions.csv`: optional manual signup and verification tracker for source newsletters and mailing lists.
- `source-search-playbook.md`: plain-language search tactics, source rules, and notes about how to use the source book.
- `north-signal-sources.csv`: versioned editorial discovery registry for the weekly North Signal briefing.
- `north-signal-feeds.opml`: importable copy of the approved Inoreader starter portfolio.

## Known-source fields

The first twelve fields preserve the original source-book contract. The autonomous pipeline adds these planning and recursion fields:

- `expected_organization_yield`: rough yield expectation such as low, moderate, or high
- `geography`: geographic coverage
- `organization_kinds`: pipe-separated controlled organization kinds
- `issuer_coverage`: public-demand issuer coverage when applicable
- `refresh_cadence`: sensible revisit frequency
- `canonical_domain_owner`: owner of the durable web domain
- `last_successful_discovery`: last date the source produced a useful lead
- `access_limitations`: paywall, robots, authentication, rate-limit, or extraction notes
- `recursive_follow_up_urls`: pipe-separated durable next-hop sources

Source Book expansion has a 30-minute sub-limit inside each 90-minute run, but no row quota. Prefer useful canonical sources and unresolved search trails over artificially filling a target count.

## Workflow

1. Add or update reusable sources in `known-sources.csv`.
2. Add official social accounts, YouTube channels, newsletters, event pages, partner pages, and exhibitor directories when they are useful repeatable discovery paths.
3. Record whether each source has newsletters, mailing lists, RSS feeds, alerts, briefings, social feeds, YouTube channels, or other recurring feeds.
4. Use `newsletter-subscriptions.csv` only when a human manually signs up or explicitly asks for signup tracking.
5. Use those sources during Source Discovery Scout runs.
6. Save newly discovered organization, demand, program, or relationship leads to `research/ingestion/source-leads-v2/*.json` for autonomous v2 runs.
7. Convert qualified leads into typed private bundles in `research/ingestion/candidate-batches-v2/*.json`; human review remains mandatory before publication.
8. Move approved leads only through the current v2 candidate and private Admin Review workflow; do not recreate retired file-based promotion paths.

The source book is not the database. It is the reusable map of where to look.

The North Signal registry is also not a public-evidence corpus. RSS feeds, newsletters, and aggregators surface possible developments. The independent `tnm-north-signal` editorial workflow must resolve every selected item to an original durable source before it can appear in a private issue candidate.
