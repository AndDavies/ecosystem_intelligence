# Source Discovery Skill

Project-local skill for finding broad public-source leads for the `Ecosystem Intelligence` research pipeline.

## Purpose

Actively search the web and inspect durable public sources to find real organizations, capabilities, and signals, then produce source-lead output for human review before any candidate records are built.

## When To Use

Use this skill when the task is to:

- find companies relevant to existing Mission Areas / Use Cases
- find public sources for capabilities or signals
- build or expand the Global Source Book
- build a source-lead batch
- search across company websites, press releases, publications, government/program pages, broad web search, LinkedIn, social media, or YouTube
- find newsletters, mailing lists, RSS feeds, alerts, briefings, and other recurring source feeds
- identify promising but incomplete leads for follow-up

Do not use this skill to:

- create candidate batch records
- write to Supabase
- promote source leads
- treat social posts or YouTube transcripts as sufficient promoted evidence without durable corroboration

## Inputs

- Mission Area / Use Case scope
- Target Domains
- Batch target count
- Existing taxonomy IDs
- Known companies or source ecosystems to include or avoid
- Source quality constraints
- Source-book feed availability requirements

## Outputs

- Source-lead JSON following `research/ingestion/schema/source-leads.schema.json`
- Rejected/deferred leads with `doNotIngestReason`
- Follow-up questions for ambiguous leads
- Notes on source ecosystems worth monitoring later
- Reusable source additions or updates for `research/source-book/known-sources.csv`
- Recurring feed availability and notes in `research/source-book/known-sources.csv`

## Source Priority

Use this source order:

1. Official company product, documentation, news, investor, or press-release pages.
2. Government, NATO, defence program, procurement, or public policy pages.
3. Reputable industry publications with direct company or program references.
4. LinkedIn pages, social media, YouTube channels, and transcripts only to discover durable follow-up sources.
5. Secondary summaries only when they lead to primary sources.
6. Newsletters, mailing lists, RSS feeds, alerts, and briefings as recurring discovery feeds, with important claims still verified against durable source URLs.

Reject or defer:

- non-HTTPS URLs
- non-canonical URLs
- browser citation tokens
- copied report markers
- social posts without durable corroborating links
- vague marketing pages without concrete capability detail
- claims that imply classified or internal target guidance

## Required Lead Fields

Every lead must include:

- `id`
- `organizationName`
- `candidateCapabilityName`
- `sourceUrl`
- `sourceTitle`
- `publisher`
- `sourceType`
- `publishedAt`
- `leadSummary`
- `possibleUseCaseIds`
- `possibleDomainIds`
- `confidence`
- `followUpQuestions`
- `doNotIngestReason`

## Workflow

1. Confirm existing use case and domain IDs from local seed files or Supabase read inspection.
2. Read `research/source-book/known-sources.csv` and `research/source-book/source-search-playbook.md` when they exist.
3. If the task is Global Source Book expansion, add durable reusable sources to `research/source-book/known-sources.csv` and do not create source leads.
4. Run active web searches across official programs, publications, company sites, press rooms, procurement portals, LinkedIn discovery paths, social discovery paths, and YouTube discovery paths.
5. Search recursively from official pages into linked challenge pages, cohorts, partner pages, investor hubs, LinkedIn pages, social accounts, YouTube channels, newsletters, events, and exhibitor directories.
6. Open and inspect promising pages in the browser or web tooling before treating them as reusable sources.
7. Search durable sources first.
8. Use social and YouTube only to identify official or durable follow-up URLs.
9. For publications, company press rooms, industry associations, conferences, and government programs, check for newsletters, mailing lists, alerts, RSS feeds, briefings, press email updates, podcasts, LinkedIn pages, social accounts, and YouTube channels.
10. Record feed availability in `recurring_feed_available` as `yes`, `no`, or `unknown`.
11. Describe available feeds in `recurring_feed_notes`.
12. Add or propose reusable source discoveries in `research/source-book/known-sources.csv`.
13. Deduplicate by exact canonical source URL.
14. If creating source leads, assign possible use case and domain IDs conservatively.
15. If creating source leads, mark weak leads `needs_validation` or `reject` rather than forcing candidate readiness.
16. If creating source leads, validate with `pnpm leads:validate`.

## Recurring Feed Discovery Workflow

Use this workflow when expanding the Global Source Book.

1. Inspect the source page for footer links, header links, popups, RSS links, "newsletter", "subscribe", "alerts", "briefing", "daily", "weekly", "press release", "email updates", podcast feeds, LinkedIn links, social links, and YouTube links.
2. Record the recurring feed URL as a reusable source when it can be revisited later.
3. Set `recurring_feed_available` to `yes`, `no`, or `unknown`.
4. Use `recurring_feed_notes` to describe what was found.
5. Do not subscribe, submit forms, click confirmation links, or use Gmail verification in this skill unless the user explicitly asks for that separate action.

Required source-book columns:

```text
name,url,source_kind,coverage_notes,mission_area_fit,domain_fit,credibility,status,last_checked,search_notes,recurring_feed_available,recurring_feed_notes
```

Use these feed values:

- `yes`: a recurring feed was found.
- `no`: the source was checked and no recurring feed was found.
- `unknown`: the source was not checked deeply enough to decide.

## Allowed Tools

- Web search and source inspection
- Local schema and seed reads
- `pnpm leads:validate`
- Supabase MCP read inspection for duplicate/source checks when authenticated

## Restricted Actions

- Do not write files outside the requested source-lead artifact.
- Do not run database writes.
- Do not create new taxonomy IDs.
- Do not scrape private personal contact data.
- Do not submit subscriptions, mailing-list forms, phone-number forms, password-based account creation, CAPTCHA-blocked forms, or forms requiring unnecessary personal data.

## Quality Checklist

- Global Source Book expansion is not capped at a fixed count; stop only because of time, tool, reviewer, or handoff limits.
- Source-book rows describe repeatable places to search, not individual company/capability claims.
- Recurring feed availability is checked and recorded for each reusable source.
- `recurring_feed_notes` describes newsletters, mailing lists, RSS feeds, alerts, briefings, LinkedIn pages, social accounts, YouTube channels, podcasts, or why none were found.
- Lead URLs are canonical and `https`.
- Lead summaries explain why the source matters.
- Possible use case/domain IDs are existing IDs.
- Follow-up questions capture uncertainty.
- Rejected leads explain why they should not be ingested.

## Change Log

- `2026-04-30`: Initial focused skill created.
