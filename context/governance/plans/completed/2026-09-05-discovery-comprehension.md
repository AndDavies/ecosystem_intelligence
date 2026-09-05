# Discovery and comprehension implementation

Status: implementation and candidate validation complete; production confirmation belongs to the release task
Owner: Andrew Davies
Last reviewed: 2026-09-05

Authority: Andrew approved the full discovery/brand/newsletter plan and requested implementation. The Brand System and Project Overview are the current language and journey contracts; production Supabase remains canonical.

## Delivered

- Practical directory-search hero, retained slogan, compact real Kraken/KATFISH proof, earlier newsletter, three discovery paths and one current Signal.
- Shared deterministic lookup and directory query/type/region pagination; mobile results default and real desktop List switch; explicit shared view intent and spatial scope preserved.
- Public Shortlists terminology, technologies and services, mission areas and defence needs; IDs, stored names and URLs unchanged.
- Clear newsletter/reporting distinction, contextual signup on all public profiles, automatic popup suppression, accessible dialog naming and functional newsletter navigation at sign-in.
- Contextual sign-in return and named selected record; sources and review boundaries preserved.
- Current-page guided video tour with captions and transcript, optional Ask and relocated adjustable naval example.
- Bounded discovery measurement, manual distribution examples, updated brand/governance/email sources and ignored skill voice.
- Validated private current North Signal sample and proposed provider presentation delta. No sample publication or provider write.

## Validation and release

Final Node 24 `pnpm release:validate` passed: 819 tests in 110 files, lint without warnings, type checking, dependency audit with no known vulnerabilities, repository/governance hygiene, 5,000-marker scale and production build. `pnpm skills:validate` passed for 11 installed skills. The private current issue passed its issue validator. The bounded local `pnpm launch:validate` passed 15 selected public pages with no findings or recovered warnings; this was a localhost check, not a production crawl. Production has 585 published organizations and 548 technologies and services at the read-only reconciliation. Local rendered counts reconcile to that baseline.

Browser checks: 390, 768, 1024 and 1440 layout observations; no horizontal overflow on checked homepage/profile surfaces; named-company lookup and keyboard selection; profile-to-sign-in context; source navigation; newsletter dialog accessible name, Escape and focus return. Full screen-reader product testing and recruited-user comprehension studies are not yet performed. No real subscription, private-account mutation or email send is part of QA.

The final production build also passed the bounded-list → national map projection → spatially scoped list → Search all Canada sequence; resizing retained the explicit List choice. The replacement guide video is 30 seconds, loads its English caption track and has an operable transcript disclosure. The unapproved sample renders the not-found UI and is noindex; Next.js may stream that response with HTTP 200, so it is not described as an HTTP-status assertion.

## Separate review checkpoints

Andrew must review the current weekly sample before adding its sanitized public text and enabling sample links. The route is unavailable until then. Exact provider wording changes are prepared privately; no welcome/template/campaign write is implied by the tracked source edit. Sending an issue remains a separate action. Manual interviews and 14/28-day measurement need real users and elapsed post-release data; no scheduled work has been created.

## Release handoff

Commit explicit application, asset and governance paths and push main once. Confirm the exact GitHub/Vercel deployment and health. Andrew explicitly reiterated that production must not receive an exhaustive route/page test: post-ready verification is limited to the five core pages plus How It Works, one organization profile, one technology profile and sign-in. No dynamic-family sweep, full launch audit or production load test is authorized or needed. Exact release outcome is reported in the task after deployment; this pre-push record does not claim future production verification. The separate editorial/provider checkpoints above remain explicit.
