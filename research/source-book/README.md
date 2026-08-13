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
- `access_method`: the reproducible collection surface such as `public_web`
- `source_posture`: whether the row is discovery-only, an evidence anchor, or both
- `supported_signal_types`: pipe-separated event families this source can surface
- `last_signal_found`: last date the source yielded a material signal
- `last_successful_refresh`: last date the source was checked successfully

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

## North Signal feed admission and health

`north-signal-sources.csv` is the complete registry. `north-signal-feeds.opml` contains only rows whose registry status is `active`. Editing either tracked file does not change the live Inoreader account; importing or changing provider subscriptions remains a separate explicitly approved action.

The feed registry records `admission_state`, `probation_until`, the last stored health state and check date, the last useful signal date, 90-day qualified/accepted/duplicate counts, and an operator note. Historical rows may leave the new yield fields blank until they are measured; new and quarantined rows must carry the applicable admission metadata.

Admit a feed only when it has a canonical HTTPS home, parses as RSS or Atom, resolves entries to original durable pages, has a defined Canadian or allied editorial use, and either produced at least three qualified items during a 90-day review or is a strategically authoritative official source. New feeds enter a 30-day `probation` state. At the end of probation, record qualified, accepted and duplicate item counts; keep a low-volume source only when its official authority justifies the cost.

Health and editorial yield are separate:

- `available`, `failed`, `stale`, and `unresolved` describe the latest read-only probe.
- `active`, `paused`, and `quarantined` describe operator eligibility.
- A transient failure never deletes a row. Malformed Vanguard XML is retained as `quarantined`; its home page remains available for manual discovery.
- A stale feed is not assumed dead. NRC remains active and is supplemented by direct monitoring of its official news index.
- `qualified_items_90d`, `accepted_items_90d`, and `duplicate_items_90d` stay blank until measured. Never backfill invented zeroes.

Run both checks after any registry edit:

```bash
python3 .agents/skills/tnm-north-signal/scripts/validate_source_registry.py research/source-book/north-signal-sources.csv
python3 .agents/skills/tnm-north-signal/scripts/check_feed_health.py research/source-book/north-signal-sources.csv
```

The validator also proves that the active registry set and OPML seed are exact URL-for-URL matches. The health probe reconciles every registered row, including paused and quarantined feeds, so a failure cannot disappear from the weekly report.
