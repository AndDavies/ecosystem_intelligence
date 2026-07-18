# True North Map Canadian Public Beta Release Plan

Status: release-ready; go
Plan updated: Saturday, July 18, 2026
Release target: Monday, July 20, 2026 at 08:00 Atlantic
Release URL: `https://truenorthmap.ca/`
Creator and steward: Andrew Davies
Shareable PDF: [True North Map - Canadian Public Beta Release Plan](https://drive.google.com/file/d/1NL0I35kokG4c1XwzJGXVLAa6nZnjRgpP/view?usp=drivesdk)

## Executive release decision

True North Map is ready for its Monday public-beta release. The production
application, database, authentication, governance, launch assets, and discovery
workflows have passed the release gates. No further feature-development cycle is
required before launch.

The corpus is deliberately frozen at 30 verified organizations and 30 reviewed
capabilities. The atlas, evidence-backed profiles, connection workflow, public
contributions, private administration, Web Analytics, authentication, account
controls, exports, technical SEO, and independent True North Map identity are
implemented at `https://truenorthmap.ca/`.

The remaining work is operational and time-bound:

1. run the Monday 06:30 database and release-commit check
2. confirm the production alias and logs at 07:00
3. perform one fresh desktop/mobile smoke test at 07:30
4. make the 08:00 go decision and publish Andrew's founder announcement
5. execute the prepared stakeholder and community outreach sequence

New features and corpus expansion beyond 30 remain frozen until launch feedback
identifies the highest-value next change.

## Verification snapshot — July 18

| Release signal | Verified result |
| --- | --- |
| Canonical production | `truenorthmap.ca` serves the latest `main` deployment; `www` and the former Vercel URL redirect to it |
| Corpus | 30 published organizations, 30 reviewed capabilities, zero scaffold records |
| Coverage | Nine provinces or territories and more than four technical domains, with thin areas stated rather than padded |
| Authentication | Google OAuth and passwordless email links pass; safe returns, progress states, sign-out, private account views, and deletion pass |
| Administration | Andrew-only, unlinked, fail-closed; non-administrator access denied |
| Database privacy | RLS, explicit grants, private-table denial, owner-only rows, retention, and service-secret boundaries pass |
| Product QA | Desktop, mobile, keyboard, reduced motion, map/list, search, evidence, exports, contributions, connections, and admin journeys pass |
| Automated suite | 24 test files and 83 tests; lint; two source-lead batches; seed; candidate ingestion; and 41-route production build all pass |
| Performance | Mobile Lighthouse: 96/100/100/100; desktop: 100/100/100/100 for performance/accessibility/best practices/SEO |
| Observability | Vercel Web Analytics scripts return 200; production browser and Vercel error logs are clean |
| Search registration | Google Search Console and Bing Webmaster Tools verified; sitemap submitted; priority pages requested for indexing |
| Launch collateral | Founder post, direct outreach, organization message, Build Canada note, BetaKit pitch, Show HN/Reddit variants, four screenshots, Open Graph card, and 21-second demo ready |

## Release story

Primary message:

> Canada’s defence and dual-use capability is stronger than it is visible.
> True North Map is an independent public atlas built to make Canadian
> organizations, capabilities, evidence, and collaboration opportunities easier
> to discover and connect.

Supporting story:

- Andrew repeatedly encountered strong Canadian capabilities that were hard to
  find across fragmented regional, industry, program, and innovation networks.
- True North Map creates a free public discovery layer grounded in
  reviewed sources rather than opaque claims or synthetic records.
- The beta launches with 30 verified organizations and capabilities, visible
  evidence, explicit gaps, and paths to contribute or request an introduction.
- The purpose is practical sovereign-industry visibility: help Canadians find
  one another, understand what exists, and create better collaboration paths.
- The atlas is independent. It is not a government, military, procurement,
  association, or classified-demand system.

## Fixed release scope

The Monday beta is:

- English-only and Canada-wide
- free for public browsing, searching, profiles, evidence, PDF generation, and
  CSV export
- published under the True North Map brand at `truenorthmap.ca`
- built around 30 verified organizations and 30 reviewed capabilities
- open to public feedback, contact, and update subscriptions
- protected by authentication only for private Working Lists, contributions,
  connection requests, account management, and administration
- review-first: nothing submitted publicly can directly change published data
- manually stewarded by Andrew, including profile review and introductions

Espace Aéro/Axya remains interaction inspiration only: capability-led discovery,
saved organizations, an expression of connection intent, and an intermediary who
can help make the right introduction. Its Quebec scope, membership model,
branding, language model, and procurement platform are not being reproduced.

## Current implementation status

### Completed and release-relevant

| Area | Current state |
| --- | --- |
| Public identity | Independent Canadian Public Beta, founder story, public trust boundaries, and no partner-branded presentation |
| Visual system | Field Atlas treatment: warm neutral canvas, spruce primary actions, coral selection, violet analyst assessments, rounded surfaces and controls |
| Corpus | 30 published organizations and 30 published capabilities; 15 scaffold records excluded |
| Atlas | Natural-language search, structured filters, MapTiler/MapLibre map, numbered clusters, synchronized viewport-bounded results, URL state, and visible-result export |
| Organization profiles | Editorial organization profiles with capabilities, evidence, mission relevance, demand relevance, sources, Save, Connect, Export, website, and correction actions |
| Authentication | Google OAuth with Supabase PKCE plus passwordless email links for personal or work email addresses |
| Auth feedback | Pending states and progress indicators for Google, email-link, sign-out, and deletion actions |
| Account | Session-aware header, `/account`, Working Lists, connection status, contribution status, sign-out, and private-data deletion |
| Administrator security | No public admin link; access restricted to Andrew’s immutable identity, exact email, and controlled `app_metadata.role = admin` |
| Collections | Owner-only Working Lists and collection lookbook export |
| Public participation | Claim, correction, new-organization suggestion, connection request, contact, feedback, and consent-backed update signup |
| Connections | Private intent form, Andrew review, and `new`, `reviewing`, `introduced`, `declined`, and `closed` status workflow |
| Editorial workflow | Structured candidate review, per-field editing, duplicate handling, substantive rationale, one-button atomic publication, and audit log |
| Published maintenance | Searchable organization manager and unified organization/capability editor with stable slugs, rationale, audit history, and cache refresh |
| Administration | Subscribers, searches, events, feedback, contact, contributions, connection requests, coverage, candidate review, publication, and organization editing |
| Analytics | Vercel Web Analytics plus bounded semantic events, private raw searches, and no replay, keystroke, mouse, advertising, or raw-IP collection; Lighthouse is the release performance check |
| Search repair | Halifax, HRM, and Dartmouth resolve to Halifax Regional Municipality; absent campaign-cohort values no longer invalidate discovery requests |
| SEO/AEO foundation | `en-CA`, crawlable public routes, private-route blocking, sitemap, canonical metadata, Open Graph, and structured data |
| Legal/trust pages | About, Methodology, Contact, Privacy, and Terms |
| Release checks | Latest clean run passed unit tests, lint, source-lead validation, seed validation, ingestion validation, and production build |

### Acceptable beta limitations

These do not block Monday:

- the corpus is intentionally frozen at 30 verified organizations for launch
- uneven regional coverage where evidence is thin
- five public NATO demand families with no capability matches until mappings
  pass editorial review
- generic organization icons where approved logos are unavailable
- Supabase’s default passwordless-email sender rather than branded SMTP
- Vercel's paid Speed Insights add-on is not purchased; Lighthouse and Web
  Analytics provide the release performance and usage checks
- manual introduction brokerage rather than automated contact exchange
- English-only presentation
- no monetization, CRM synchronization, tender feed, or autonomous publication

### Repository path resolved

The tracked research history, ingestion schemas, source book, audits, and
promotion records have been restored to the canonical `research/` directory.
The established four-folder contract remains intact and final validation should
run from this restored path.

## Completed launch gates

### Gate 1 — Repository and release integrity

Owner: Andrew decision; Codex execution
Deadline: Saturday, 18:00 Atlantic

- [x] Restore and verify the canonical `research/` directory.
- [x] Confirm the release branch is `main` and its remote is
      `AndDavies/ecosystem_intelligence`.
- [x] Confirm the working tree contains only intentional release changes.
- [x] Confirm no raw PDFs, colleague emails, local media, `.env` files,
      credentials, or node modules are entering GitHub.
- [x] Rerun all data validators from the final path.
- [x] Record final release application commit `f385d4f` and production deployment
      `dpl_7niF4ZYyEwTxdsnAvTvxBpanvu8w` before Monday.

Pass condition: clean, reproducible repository; no lost research; all required
commands can find their source and schema files.

### Gate 2 — Production authentication and account controls

Owner: Andrew for real-account checks; Codex for defect repair
Deadline: Sunday, 13:00 Atlantic

Test with a fresh browser and at least one non-administrator account:

- [x] Google sign-in succeeds from `/sign-in`.
- [x] Google cancellation or denial returns a clear, safe state.
- [x] Passwordless email-link sign-in succeeds with a work or non-Google email.
- [x] Safe `returnTo` paths return the user to collections, contribution, or
      connection workflows.
- [x] Both sign-in methods show visible progress and prevent duplicate submits.
- [x] Signed-out navigation says `Sign in`; signed-in navigation says `Account`.
- [x] `/account` shows the correct user’s private Working Lists, requests, and
      contributions only.
- [x] Sign-out clears the session and updates navigation.
- [x] A non-admin test account can complete recent reauthentication and delete
      its account/private data after exact-email confirmation.
- [x] Andrew’s administrator account cannot self-delete.
- [x] Andrew can open `/admin`; all other accounts receive fail-closed denial.
- [x] No public page, account page, sitemap, or navigation exposes an admin link.

Pass condition: both sign-in paths and deletion work in production; no user can
see another user’s private state or gain administrator access.

### Gate 3 — Database, RLS, privacy, and evidence boundary

Owner: Codex verification; Andrew approval
Deadline: Sunday, 15:00 Atlantic

- [x] Confirm production contains exactly the intended 30 published records and
      zero scaffold/placeholder organizations.
- [x] Confirm every commercial organization has a reviewed capability and
      durable public source.
- [x] Confirm anonymous users can read published records only.
- [x] Confirm anonymous and ordinary authenticated clients cannot read raw
      searches, events, feedback, subscribers, contacts, connection requests,
      submissions, drafts, raw files, or audit history.
- [x] Confirm users can access only their own collections, submissions,
      connections, and account data.
- [x] Confirm service credentials and the Google secret exist only in protected
      server/provider configuration.
- [x] Confirm raw searches retain a 90-day expiry and detailed events a 30-day
      expiry.
- [x] Review Privacy and Terms against the actual Google/email authentication,
      subscriptions, analytics, connections, contact, and deletion behaviour.
- [x] Spot-check substantive public claims and assessment labels for source
      links and non-endorsement caveats.

Pass condition: zero private-data exposure, zero scaffold records, and no
unsupported public claim found in the release sample.

### Gate 4 — Production product and accessibility smoke test

Owner: Codex execution; Andrew acceptance
Deadline: Sunday, 18:00 Atlantic

Required public journeys:

- [x] Canada-wide atlas loads without console or server errors.
- [x] Numbered clusters zoom and separate correctly.
- [x] Panning and zooming update the table to the organizations visible on the
      map, including entities represented by a cluster.
- [x] Map, result count, selection, filters, URL, and CSV export stay synchronized.
- [x] `Halifax`, `HRM`, and `Dartmouth` return the intended metro result.
- [x] A zero-result search provides broadening and feedback paths.
- [x] Marker and row selection open a compact profile preview.
- [x] Organization and capability profiles show evidence and omit unknown data.
- [x] Individual PDF, collection lookbook, regional PDF, and filtered CSV export.
- [x] Save to Working List, claim/correction/new organization, connection,
      contact, feedback, and update-subscription workflows.
- [x] Admin review, one-button publication preview, and published-record edit.

Required presentation and accessibility checks:

- [x] Desktop and mobile layouts.
- [x] Keyboard navigation, visible focus, and logical heading order.
- [x] Map/list equivalence and a usable non-map path.
- [x] Colour contrast and reduced-motion behaviour.
- [x] Missing coordinates, missing media, thin regions, stale evidence, failed
      API calls, and unavailable sources have safe states.
- [x] Core pages return correct canonicals, Open Graph data, and JSON-LD.
- [x] Sitemap contains public canonical routes only; robots/noindex block private
      routes.
- [x] Lighthouse shows no material regression on the final build: mobile
      96/100/100/100 and desktop 100/100/100/100. Paid Speed Insights remains
      deliberately unpurchased.

Pass condition: no critical or high-severity defect in the public discovery,
profile, authentication, contribution, connection, export, or admin workflows.

### Gate 5 — Automated release suite

Owner: Codex
Deadline: Sunday, 19:00 Atlantic

Run from the final, clean repository state:

```bash
pnpm test
pnpm lint
pnpm leads:validate
pnpm seed:validate
pnpm ingest:validate
pnpm build
```

Verified result: all six commands exit successfully; 24 test files and 83 tests
pass, both source-lead batches validate with zero errors or warnings, the seed
validates, the candidate batch validates with zero errors or warnings, and the
production build generates 41 routes.

Pass condition: every command exits successfully. Do not treat the earlier
passing run as final if the research hierarchy changes afterward.

### Gate 6 — Search registration and observability

Owner: Andrew for account-bound registration; Codex for verification
Deadline: Monday, 07:30 Atlantic or within 24 hours of release

- [x] Register `https://truenorthmap.ca/` with Google Search Console.
- [x] Submit `/sitemap.xml` and request indexing for `/`, `/organizations`,
      `/about`, and `/methodology`.
- [x] Register the site with Bing Webmaster Tools and submit the sitemap.
- [x] Confirm Vercel Web Analytics scripts receive production traffic; both
      deployed analytics endpoints return 200.
- [x] Confirm semantic searches/events appear privately in admin insights.
- [x] Confirm production errors and failed functions can be observed in Vercel.

Search-engine registration is important but is not a reason to miss 08:00 if
the public technical SEO is correct and the registration accounts are the only
remaining dependency.

## Launch content package

Owner: Andrew approval; Codex drafting and assembly
Deadline: Sunday, 17:00 Atlantic

Required:

- [x] Founder-led LinkedIn post with one clear atlas link.
- [x] One short demonstration video or screen recording showing search, map,
      cluster, profile, evidence, and Connect.
- [x] Three clean screenshots: national atlas, organization profile, and
      evidence/connection interaction.
- [x] Current Open Graph card verified through the deployed route.
- [x] Direct-outreach email or message for 15–25 ecosystem contacts.
- [x] Short organization-inclusion message for companies already in the atlas.
- [x] Build Canada community submission/message.
- [x] BetaKit pitch with release facts, why it matters, traction/context, and
      license-safe assets.
- [x] Show HN title/body and Reddit maker-story variants.
- [x] One UTM convention for launch links, for example:
      `utm_source`, `utm_medium`, `utm_campaign=public_beta_2026_07`.

The approved 21-second H.264 release cut is tracked at
`content/launch/true-north-map-public-beta-demo.mp4`. Its six clean source frames,
four release screenshots, and Open Graph image are retained under
`content/launch/` with no private workflow content.

## Promotion sequence

### Wave 1 — Core Canadian ecosystem, Monday morning

08:00–10:00 Atlantic:

1. Publish Andrew’s LinkedIn founder announcement.
2. Send direct notes to the existing reviewers and 15–25 defence, dual-use,
   innovation, marine, accelerator, investment, and BD contacts.
3. Notify organizations included in the atlas and invite claims or corrections.
4. Share with relevant Canadian accelerators, test centres, research centres,
   clusters, CADSI contacts, IDEaS/DISH contacts, and NATO DIANA ecosystem peers.
5. Submit to the [Build Canada community](https://www.buildcanada.com/en/get-involved)
   as a concrete Canadian capacity/sovereignty project, not as a generic product
   advertisement.

### Wave 2 — Canadian technology and builder story

Sunday before launch or Monday after the first public post:

- Send BetaKit a concise story pitch. BetaKit asks for the announcement, why it
  matters to its technology audience, media assets, and follow-up information;
  advance notice improves the chance of coverage. Use the official
  [BetaKit pitch page](https://betakit.com/contact-us/).
- Publish a `Show HN:` submission only when Andrew can remain available to answer
  questions and the public product works without mandatory sign-in. Follow the
  official [Show HN guidelines](https://news.ycombinator.com/showhn.html).
- Post a maker-story version to `r/SideProject`, leading with the fragmented
  Canadian capability-discovery problem and what was learned while building.
- Use only the current
  [r/BuyCanadian self-promotion megathread](https://www.reddit.com/r/BuyCanadian/comments/1sbzjnq/self_promotion_megathread_2026/);
  do not create a standalone promotional post.
- Consider Indie Hackers and relevant Canadian developer communities after the
  core stakeholder wave, using a build-and-learning story rather than identical
  cross-posted copy.

Re-check every community’s live sidebar, pinned post, and flair requirements on
the day of posting. Avoid broad military forums, indiscriminate cross-posting,
or cold direct-message campaigns.

## Updated delivery schedule

### Saturday, July 18

Primary objective achieved: release-ready production build.

- [x] Research hierarchy, repository remote, `main` branch, and tracked release
  boundaries verified.
- [x] Feature development and the corpus frozen at 30.
- [x] Privacy, Terms, About, Methodology, brand, domain, and authentication copy
  reconciled.
- [x] Google and passwordless-email authentication, RLS, account deletion,
  administrator isolation, and private workflows verified with fresh test data;
  test identities and records removed afterward.
- [x] Launch post, outreach copy, screenshots, Open Graph image, and demo video
  finalized under `content/launch/`.
- [x] Production environment-variable inventory and provider callbacks verified
  without exposing protected values.
- [x] Release code pushed to `main`, deployed, and verified at the canonical
  domain with a clean production browser and error-log check.

### Sunday, July 19

The technical proof work was completed ahead of schedule on Saturday. Sunday is
a stability buffer, not a feature day.

- Keep the corpus, schema, authentication, and public workflows frozen.
- Review the founder announcement and channel copy once in Andrew's voice.
- Assemble the final 15–25 person direct-outreach list outside the repository.
- Optionally send the prepared BetaKit advance pitch.
- Recheck current posting rules for Build Canada, Show HN, and the chosen Reddit
  communities; do not publish the community wave early.
- Repair only a newly observed critical launch-gate defect.
- Confirm no unexpected production error, database change, or secret/config
  drift at 20:00 Atlantic.

### Monday, July 20

- 06:30: database count, RLS posture, environment, and release-commit review.
- 07:00: deploy the final release commit to Vercel.
- 07:15: verify deployment health, logs, analytics, and `/sitemap.xml`.
- 07:30: fresh-browser desktop and mobile smoke test covering atlas → profile →
  evidence/export plus both sign-in options.
- 07:50: final go/no-go decision.
- 08:00: official Canadian Public Beta release.
- 08:05: Andrew’s founder-led LinkedIn post.
- 08:15: direct stakeholder and included-organization outreach.
- 09:00: Build Canada/community outreach.
- 10:00: monitor searches, zero results, errors, subscriptions, feedback,
  submissions, and connections.
- 12:00 onward: developer/community wave if production remains stable.
- 16:00: first launch-day review and prioritized repair list.

## Go/no-go criteria

### Release at 08:00 when

- final repository and production deployment are identifiable and reproducible
- at least 30 verified organizations and capabilities remain published
- both sign-in methods work, or Google works and any email issue is clearly
  disabled rather than silently broken
- administrator access is owner-only and private user rows remain owner-only
- atlas, map/table, profile, search, source, and export journeys work
- no scaffold data, unsupported claims, or private material is visible
- all automated checks pass
- launch assets and the founder post are ready

### Delay when

- any ordinary user can reach administration or another user’s data
- RLS or storage exposes private searches, subscribers, feedback, contacts,
  connection requests, submissions, drafts, or raw sources
- the final deployment contains scaffold data or loses reviewed records
- atlas search, profiles, or exports consistently fail
- account deletion can affect the administrator or another user
- the release commit unintentionally deletes the research/source/evidence trail
- a critical accessibility or mobile defect prevents the core discovery journey

Non-critical copy, minor spacing, missing approved logos, thin regions, the
36-record target, and search-engine indexing latency do not justify delay.

## Launch-week learning system

The beta should collect useful product evidence without becoming an analytics
warehouse or asking every user for feedback.

Use:

- Vercel Analytics for aggregate traffic and route use
- Lighthouse for reproducible release performance and Vercel Web Analytics for
  aggregate production usage
- semantic events for search, filter, marker/result selection, profile, source,
  export, save, contribution, connection, subscription, and feedback
- private 90-day raw search records to understand intent and zero-result gaps
- private 30-day workflow events to understand the discovery funnel
- contextual feedback after zero-result searches
- the persistent unobtrusive feedback control
- the delayed, affirmative-consent update prompt with 30-day dismissal

Do not add session replay, arbitrary click capture, keystroke capture, mouse
tracking, advertising profiles, or raw IP storage.

First-week targets:

- 300 qualified sessions
- at least 50% using search, filters, or the map
- at least 25% reaching an organization profile
- zero-result search rate below 30%
- 25 consented subscribers
- five credible profile contributions
- three credible connection requests
- ten direct feedback responses
- five stakeholder follow-up conversations
- zero private-data exposure, unsupported public claims, or unresolved critical
  failures

Review at 16:00 on launch day and daily for the first week. Prioritize repeated
search failures, missing high-demand organizations, failed contribution or
connection flows, and evidence corrections before new feature work.

## First two weeks after release

### Days 1–3

- repair critical search, authentication, contribution, connection, or export
  problems
- review every direct correction or privacy request promptly
- categorize zero-result searches by missing organization, geography,
  capability, mission, demand, or vocabulary
- acknowledge credible organization claims and connection requests

### Days 4–7

- publish the highest-value verified corrections
- add only records justified by observed demand and coverage gaps
- compare acquisition channels by qualified engagement, not raw clicks
- decide whether 36 records remains the next corpus milestone
- summarize what users tried to accomplish and where the product failed them

### Week 2

- choose one evidence-backed improvement theme from search, profile depth,
  comparison, connection, or contribution data
- prepare a small reviewed corpus expansion rather than a broad volume push
- decide whether a compliant branded sender/SMTP is worth adding after observing
  actual passwordless-email and subscriber volume
- publish a short transparent update on coverage growth and what changed

## Explicitly deferred

- branded email sender and custom SMTP
- campaigns to captured subscribers until unsubscribe and sender requirements
  are complete
- monetization and paid tiers
- French content, routes, locale switching, or localization scaffolding
- CRM synchronization and relationship-history ingestion
- tender feeds as a primary workflow
- direct self-service publication
- outbound sequencing or sales-pipeline management
- continuous autonomous publication
- classified, restricted, or inferred government demand
