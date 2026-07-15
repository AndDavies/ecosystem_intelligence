# Research Source Book

This folder stores reusable research starting points before they become source leads or database-ready candidate records.

Use it for the growing list of places the research agents should check repeatedly.

Global Source Book expansion is intentionally uncapped. Keep adding useful durable sources and recursive trails until a time, tool, reviewer, or handoff limit requires a stop.

## Files

- `known-sources.csv`: structured source book for publications, company pages, press rooms, government pages, YouTube channels, social accounts, conferences, research labs, procurement portals, and other repeatable research sources.
- `newsletter-subscriptions.csv`: optional manual signup and verification tracker for source newsletters and mailing lists.
- `source-search-playbook.md`: plain-language search tactics, source rules, and notes about how to use the source book.

## Workflow

1. Add or update reusable sources in `known-sources.csv`.
2. Add official social accounts, YouTube channels, newsletters, event pages, partner pages, and exhibitor directories when they are useful repeatable discovery paths.
3. Record whether each source has newsletters, mailing lists, RSS feeds, alerts, briefings, social feeds, YouTube channels, or other recurring feeds.
4. Use `newsletter-subscriptions.csv` only when a human manually signs up or explicitly asks for signup tracking.
5. Use those sources during Source Discovery Scout runs.
6. Save actual discovered company/capability leads to `research/ingestion/source-leads/*.json` only when the task explicitly moves from source-book expansion to lead creation.
7. Convert only reviewed source leads into candidate batches in `research/ingestion/candidate-batches/*.json`.

The source book is not the database. It is the reusable map of where to look.
