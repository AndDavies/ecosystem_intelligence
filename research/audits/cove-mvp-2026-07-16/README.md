# COVE design-partner preview audit

Date: 2026-07-16

## Scope

The baseline screenshots in this folder capture the atlas, organization lookbook, correction flow, regional page, demand preview, natural-language discovery, and mobile map/list flow before the invitation-preview hardening pass.

## Preview blockers found

- The preview did not clearly describe its limited 18-organization coverage.
- There was no lightweight way to collect update consent or structured product feedback.
- Pilot interactions were not measured in a privacy-conscious, first-party event stream.
- The mobile map could publish collapsed bounds while hidden and lose the visible-results set.
- The public presentation felt separate from COVE's high-trust marine design language.
- Privacy, preview indexing, empty-demand states, and global error/empty-state handling needed explicit safe states.

## Implemented response

- Added invitation-only preview framing and COVE-adjacent navy, marine teal, and cyan visual tokens without using COVE marks or implying endorsement.
- Added a delayed, dismissible, consent-based update prompt plus a persistent structured feedback workflow.
- Added private, service-role-only Supabase tables for signups, feedback, and a bounded event taxonomy.
- Added privacy and no-index routes, Vercel Web Analytics/Speed Insights, and public preview footers.
- Fixed collapsed map bounds and verified the mobile map-to-list flow only shows organizations from the last visible map viewport.
- Clarified zero-match demand states and kept derived reads distinct from source-backed facts.

## Acceptance evidence

- `pnpm test`
- `pnpm lint`
- `pnpm leads:validate`
- `pnpm seed:validate`
- `pnpm ingest:validate`
- `pnpm build`
- Browser QA at desktop and mobile breakpoints covering atlas, map/list transition, lookbook drill-down, update prompt, feedback form, and privacy framing.

The design-partner preview remains intentionally incomplete. It is ready for workflow learning, not broad public launch or claims of national ecosystem coverage.
