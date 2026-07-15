# Source Search Playbook

Use this playbook when adding to or searching from `research/source-book/known-sources.csv`.

## Grandma Version

The source book is the address book. Source leads are the interesting clippings found while checking the address book. Candidate batches are the cleaned-up cards that might go into the official filing cabinet after review.

For Global Source Book work, keep building the address book. Do not stop at an arbitrary number of rows and do not create source leads unless the operator explicitly changes the task.

## Source Kinds

- `publication`
- `company_site`
- `company_press_room`
- `government_program`
- `procurement_portal`
- `youtube_channel`
- `linkedin_page`
- `social_account`
- `newsletter`
- `conference`
- `research_lab`
- `standards_body`
- `industry_association`
- `official_report`

## Source Rules

- Prefer durable `https` URLs.
- Prefer company, government, program, press-release, and reputable publication pages.
- Use LinkedIn, social media, and YouTube as discovery paths first.
- Use newsletters and mailing lists as recurring discovery feeds.
- Do not treat social posts or transcripts as promoted evidence unless a durable canonical source supports the same claim.
- Do not treat newsletter text as promoted evidence unless a durable canonical source supports the same claim.
- Keep notes short enough that another researcher can understand why the source is worth checking.

## Recursive Search Rules

- When a source has official LinkedIn pages, social links, YouTube channels, newsletters, event pages, partner pages, or exhibitor directories, add those as separate rows if they are useful recurring sources.
- When a source has a newsletter, mailing list, RSS feed, alert, briefing, social feed, or YouTube channel, record availability in `known-sources.csv`.
- When a publication names a company, program, challenge, or award winner, follow the trail to the official company site, press room, program page, or procurement notice before treating it as evidence.
- When a conference or exhibitor list names a company, add the event page as a reusable source and inspect company pages separately during source-lead work.
- When a government innovation page links to cohorts, winners, challenges, solicitations, or investor hubs, add the durable subpage as its own reusable source.
- Keep broad source discovery separate from source leads. The source book records where to look repeatedly; source leads record specific companies or capabilities found there.
- If a search trail is promising but unfinished, add the durable source you found and note the next recursive trail in `search_notes`.

## Search Notes To Capture

- What the source tends to cover.
- Which Mission Areas or Technical Domains it may support.
- Whether it is high, moderate, or uncertain credibility.
- How often it should be checked.
- Useful search terms or page patterns.

## Recurring Feed Notes

- Check every durable source for newsletters, mailing lists, RSS feeds, alerts, briefings, press updates, podcasts, social feeds, and YouTube channels.
- Use `recurring_feed_available` values of `yes`, `no`, or `unknown`.
- Use `recurring_feed_notes` to describe what exists or why nothing was found.
- Treat signup and Gmail verification as a separate manual workflow unless the operator explicitly asks to automate it.
