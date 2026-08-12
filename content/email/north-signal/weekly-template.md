# North Signal weekly template

Status: source-controlled MailerLite campaign copy template

Authority: Andrew reviews, edits, tests and manually authorizes every send. This file does not create or send a MailerLite campaign.

## Subject

North Signal: {{ one_thing_to_know_short }}

## Preheader

{{ concise_consequence }} · Source-linked Signals · Five-minute read.

## Issue structure

The reader-facing structure below maps directly to the six required `north_signal_issue_v2` section IDs. Do not add an unsourced seventh editorial section or pad the selected Signals.

### One thing to know (`one_thing_to_know`)

{{ consequence-led weekly thesis }}

Include the bounded `What this changes for Canadian decision teams` interpretation inside this section after the thesis. It must not imply procurement direction, eligibility, endorsement, customer interest, or certainty beyond the sources.

### Signals behind it (`signals_behind_it`)

Include one to three selected published Signals. For each:

- linked Signal title and `/signals/[slug]` URL;
- one concise reason it supports the weekly thesis;
- the original durable source links;
- supported organization, Mission Area, Public Need or technology links where useful.

Never hard-code three items. Label the real set sequentially and omit unused Signal blocks.

### New on the map (`new_on_the_map`)

{{ include only a newly published or materially refreshed organization or technology that changes the reader's understanding; otherwise omit the rendered section while preserving the typed packet section }}

### Public Need and Mission Area connections (`public_needs_and_mission_connections`)

{{ only the published connections that change the reader's understanding }}

Retain the standard caveat that reviewed discovery connections do not indicate procurement direction, eligibility, endorsement, or customer interest.

### Explore next (`explore_next`)

{{ one useful bounded continuation into a Mission Area, Public Need, organization, technology, or the map }}

### What remains unresolved and what to watch next (`watch_next`)

{{ material evidence gaps, source conflicts, unknowns, and one or two specific developments whose evidence would change the current view }}

## Required actions

- `Explore recent Signals` → `https://truenorthmap.ca/signals?utm_source=mailerlite&utm_medium=weekly_email&utm_campaign=north_signal_weekly&utm_content={{issue_id}}`
- One contextual product link to a Mission Area, Public Need, organization, technology or the map with the same attribution.

North Signal copy must not contain `/briefs` links.

## Provider presentation

- Use the shared True North Map email system: a 600–640 pixel one-column Paper reading surface on Field, a compact provider-safe Directional N with the True North Map name, and the separate `NORTH SIGNAL · WEEKLY` product label. Keep issue date and five-minute-read metadata in Quiet Grey.
- Use Inter with Arial/Helvetica fallbacks for body, labels and links. Use Barlow with Arial/Helvetica fallbacks for one consequence-led thesis only when the provider and tested clients render it reliably.
- Use North Ink for high-confidence structure, Editorial Blue for Signal/source/context organization, Signal Wash for one earned bottom-line conclusion, and Evidence Green only for original-source or verified-evidence meaning.
- Reserve Signal Yellow for the single rectangular `Explore recent Signals` action and, at most, one short masthead accent. Keep contextual and original-source actions as underlined text links. Do not turn every section into a bordered card or button.
- The reusable template has no permanent hero image. When one current, issue-specific image from a selected published Signals edition materially improves orientation, use one fixed 16:9 JPEG or PNG with descriptive alt text and source attribution. Do not use the acquisition fighter/map artwork, a generic military image, an uncited image, or a WebP-only email asset.
- Keep the message useful when images, web fonts, or dark-mode colour assumptions fail. Use explicit background colours, client-safe spacing, a minimum 44-pixel action target, and table/inline-safe structure rather than CSS grid, flex-dependent layout, SVG dependency, or background-image text.
- Do not display MailerLite provider branding, the Public Beta mark, fabricated proof, rankings, endorsements, customer-interest language, procurement eligibility, or subscriber counts.

## Provider sender

- Sender: `True North Map <updates@truenorthmap.ca>`.
- Reply to: `andrew@truenorthmap.ca`.
- Audience: only the dedicated `Ecosystem Intelligence` group after the manual pre-send checkpoint.

## Manual pre-send checkpoint

Andrew must review and edit the issue, send tests to Gmail and a non-Gmail client, verify sender, reply-to, footer, links and unsubscribe, select only the `Ecosystem Intelligence` group, and explicitly authorize the full send.
