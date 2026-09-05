# Defence Signal alert

Status: source-controlled provider template polished in the MailerLite RSS draft on 2026-09-05; activation requires a nonempty independently consented audience
Owner: Andrew Davies
Last reviewed: 2026-09-05

Sender: `True North Map <updates@truenorthmap.ca>`

Reply to: `Andrew Davies <andrew@truenorthmap.ca>`

## Presentation contract

- Use the compact Directional N plus a separate `DEFENCE SIGNAL` label in the
  established 600-to-640-pixel North Signal Field/Paper email frame.
- Use Inter for body/UI copy and one restrained Barlow title where client
  support is reliable. Use Signal Yellow once on the rectangular primary CTA.
- Do not use acquisition imagery, `Public Beta`, a second primary action, a
  second-newsletter label, or a promise of daily delivery.
- Keep the verified sender, reply-to, lawful physical address, privacy link,
  MailerLite preference link and global unsubscribe control functional.

## Subject

`New Defence Signal: {{edition_title}}`

## Preheader

What changed, why it matters for Canada, and where the evidence stops.

## Body

**TRUE NORTH MAP**

**DEFENCE SIGNAL**

# {{edition_title}}

{{executive_summary}}

## Topics in this edition

- {{topic_1}}
- {{topic_2}}
- {{topic_3_optional}}

## Evidence limit

{{principal_limit}}

[Read the Defence Signal](https://truenorthmap.ca/signals/{{edition_slug}}?utm_source=mailerlite&utm_medium=email&utm_campaign=defence_signal_alerts&utm_content={{edition_slug}}_read_signal)

This alert is an optional delivery preference within North Signal. It is sent
only when a validated Defence Signal is published. A no-publish outcome creates
no email. Change your preferences or unsubscribe using the provider-managed
links below.

Public sources cited. Facts and assessments kept separate. Human review.

## RSS field mapping

The MailerLite RSS campaign must map the stable feed item directly:

- `title` -> `{{edition_title}}`
- `link` and GUID -> the canonical edition URL and primary CTA destination
- original `pubDate` -> publication timestamp; corrections retain it
- `description` -> executive summary, two to three concrete topics, and the
  principal published evidence limit in the exact order above

Do not reconstruct topics from search terms or provider metadata. The feed
description is the send-ready source. Configure **new posts only** after the
current-edition baseline is established; missing or invalid feed content blocks
the campaign rather than sending a partial alert.

The production MailerLite campaign is `Defence Signal Alerts — RSS` (campaign
ID `196946216528905287`). It checks the public feed daily at `08:00`
`America/Halifax`, the provider's supported whole-hour cadence, with **new posts
only** enabled. The edition current at activation is the baseline and is not a
backlog send. The campaign targets only the `Defence Signal Alerts` delivery
group and had zero members after the controlled preference verification was
returned to its original group state. MailerLite automatic UTM tagging is off;
the application and source-controlled link contract remain authoritative for
bounded campaign attribution.

## Required footer

Use the lawful physical address `22 Dawson Street, Unit 716, Dartmouth, NS B3A
0H7, Canada`, the True North Map privacy link, MailerLite preference link and
functional global unsubscribe control. Do not add tracking pixels outside
MailerLite's approved campaign settings or imply that an alert was sent when
the edition was not published.

## September 5 rendering and activation safeguards

Use Full Content rather than Excerpts, 16-pixel body copy, dark readable links and the new padded Directional N header. The feed description is escaped email-safe HTML: separate summary paragraphs, topic list, optional evidence limit and one Signal Yellow CTA. Disable the RSS block's separate Read More link to avoid duplicate actions. Stable GUID and original publication time remain unchanged.

Before activation, use `/signals/feed.xml?after=<explicit UTC activation baseline>` to exclude the existing archive independently of MailerLite's first-send behaviour. Keep new-posts-only enabled. The provider can show up to 20 fresh entries, matching the feed's bounded window, but a normal check contains only newly published editions. Previewing the unfiltered historical feed is not a send candidate. Do not activate with a historical backlog or omit intervening new editions.

September 5 live review found the campaign in Draft, with zero alert recipients; this supersedes the August 27 activation claim above. Do not infer alert consent from weekly membership.

## Discovery copy reconciliation

September 5 source update: terminology and reader-facing copy now follow the current Brand System. These source edits are a proposed presentation delta to the previously verified provider state. They do not mean the live welcome workflow, reusable template or draft campaign has been edited. Andrew must approve the exact provider presentation update before it is applied; consent, recipients, sender, lawful footer, preferences and unsubscribe controls remain intact.
