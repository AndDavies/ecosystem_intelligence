# North Signal weekly template

Status: source-controlled `north_signal_issue_v2` campaign contract reconciled to the MailerLite template on 2026-08-27; per-issue inbox tests and send authorization remain explicit checkpoints

Authority: Andrew reviews, edits, tests and manually authorizes every send. This file does not create or send a MailerLite campaign.

Sender: `True North Map <updates@truenorthmap.ca>`

Reply to: `Andrew Davies <andrew@truenorthmap.ca>`

Audience: only affirmative-consent members of the `North Signal Weekly` delivery group selected at the manual send checkpoint

## Presentation contract

- Use the same approved compact Directional N plus separate
  `NORTH SIGNAL` product label, 600-to-640-pixel Field/Paper column and
  restrained North Ink / Editorial Blue structure as the welcome email. Inter
  carries body/UI copy; one Barlow editorial statement may be used only when
  client support is reliable.
- Use Signal Yellow once, on the rectangular **Explore recent Signals** CTA.
  Contextual product navigation is a secondary North Ink text link. Evidence
  Green appears only for verified-source meaning.
- Do not make a generic fighter, naval, map, stock or military image part of the
  permanent template. One issue-specific image is optional only when it is the
  approved image from a cited published Signals edition, preserves its crop,
  uses meaningful alt text, and links to the edition or source relationship.
- Keep sender, reply-to, lawful physical address, privacy and unsubscribe
  controls functional. No MailerLite branding panel, `Public Beta`, fabricated
  proof, second primary button or `/briefs` link is permitted.

## Subject

North Signal: {{ one_thing_to_know_short }}

## Preheader

{{ concise_consequence }} · Source-linked Signals and the Canadian connections behind them.

## Issue structure

### One thing to know

{{ consequence-led weekly thesis }}

### Signals behind it

Include one to three selected published Signals. For each:

- linked Signal title and `/signals/[slug]` URL;
- one concise reason it supports the weekly thesis;
- the original durable source links;
- supported organization, Mission Area, Public Need or technology links where useful.

### What this changes for Canadian decision teams

{{ bounded interpretation; no procurement, eligibility, endorsement or customer-interest implication }}

### New capability, Mission Area and Public Need connections

{{ only the published connections that change the reader's understanding }}

### Evidence limits

{{ evidence limits, source conflicts and what the reviewed public record does not establish }}

### What to watch next

{{ one or two specific developments and the evidence that would change the view }}

## Required actions

- One Signal Yellow primary CTA: `Explore recent Signals` → `https://truenorthmap.ca/signals?utm_source=mailerlite&utm_medium=email&utm_campaign=north_signal_weekly&utm_content={{issue_id}}_explore_signals`
- At most one secondary text link to a Mission Area, Public Need, organization,
  technology or the map when it changes the reader's understanding. Use
  `utm_source=mailerlite&utm_medium=email&utm_campaign=north_signal_weekly&utm_content={{issue_id}}_{{cta_slug}}`.
- One North Ink text link to `https://truenorthmap.ca/privacy` in the lawful
  footer area, alongside the functional MailerLite unsubscribe control.

North Signal copy must not contain `/briefs` links.

## Manual pre-send checkpoint

Andrew must review and edit the issue, send tests to Gmail and a non-Gmail client, verify sender, reply-to, footer, links and unsubscribe, select only the `North Signal Weekly` delivery group, and explicitly authorize the full send.

The live reusable MailerLite template is named `North Signal Weekly` (provider
template ID `16906930`). It was reconciled on August 27 to the source-controlled
Signals and Mission Areas links, bounded weekly UTM contract, privacy,
preference-management and unsubscribe controls. MailerLite automatic UTM
tagging is disabled. This tracked source and reusable provider template are not
a campaign and have no selected recipients, schedule, Outbox item or send.

Verify each selected issue contains one to three published Signals, preserves
their original durable sources, uses the optional image only when the cited
Signals record supports it, and renders cleanly with images disabled and on
mobile. Before each issue, Andrew still creates or selects the campaign,
reconciles issue-specific copy and links, sends Gmail and non-Gmail tests,
selects only the `North Signal Weekly` delivery group and explicitly authorizes
the full send.
