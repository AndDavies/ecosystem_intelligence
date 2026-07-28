# True North Map Brand System

Status: Phase 1B public system
Approved: 2026-07-26

## Brand idea

True North Map makes Canadian capability visible. It helps people move from a
fragmented market picture to evidence, possible fit, and a better-informed
conversation.

## Message system

| Role | Approved copy |
| --- | --- |
| Brand promise | **Make Canadian capability visible.** |
| Homepage headline | **Canada is building more than most people can see.** |
| Category | **Evidence-led ecosystem discovery** |
| Positioning | **True North Map is an independent, evidence-led discovery platform that helps people find Canadian defence and dual-use capability, understand where it may fit, and move into better-informed conversations.** |
| Journey | **Follow the evidence. Find the fit. Start the right conversation.** |
| Trust | **Reviewed public evidence · Transparent gaps · Human review** |

## Identity

The North Signal mark combines an angular N, a white evidence path, and a
yellow signal point. It represents finding a clear path through scattered
evidence. The permanent wordmark never includes the Public Beta label.

Available artwork:

- Horizontal header lockup.
- Stacked wordmark.
- Standalone North Signal mark.
- Light, dark, and one-colour variants.
- Simplified favicon and social-avatar mark.

Canonical asset packet:

| Asset | Repository path | Intended use |
| --- | --- | --- |
| Horizontal lockup | `app/public/brand/true-north-map-horizontal.svg` | Desktop header, partner material, wide placements |
| Stacked wordmark | `app/public/brand/true-north-map-stacked.svg` | Compact editorial and collateral placements |
| North Signal mark | `app/public/brand/north-signal-mark.svg` | Primary standalone mark on light surfaces |
| Light mark | `app/public/brand/north-signal-mark-light.svg` | Dark surfaces |
| Monochrome mark | `app/public/brand/north-signal-mark-monochrome.svg` | One-colour reproduction |
| Small-size marks | `app/public/brand/north-signal-mark-16.svg`, `north-signal-mark-24.svg`, `north-signal-mark-32.svg` | Favicons and compact interface use |
| Social avatar | `app/public/brand/true-north-map-social-avatar.svg` | LinkedIn and other account avatars |
| LinkedIn banner | `content/launch/phase-2/true-north-map-linkedin-banner.png` | True North Map organization page |
| Partner overview | `content/launch/phase-2/true-north-map-partner-overview.pdf` | One-page external orientation |
| Partner/media deck | `content/launch/phase-2/true-north-map-partner-media-deck.pptx` | Editable launch and partner presentation |

The raster brand-audit concepts are design inputs, not production marks. The flat SVG packet above is the source of truth. Do not redraw the mark from screenshots or add “Public Beta” to the permanent identity.

## Colour

| Token | Value | Use |
| --- | --- | --- |
| North Ink | `#242827` | Headlines, navigation, high-confidence structure |
| Field | `#F7F7F3` | Primary page canvas |
| Paper | `#FFFFFF` | Focused content and form surfaces |
| Signal Yellow | `#F5E900` | Primary actions, active states, short highlights, evidence paths |
| Signal Wash | `#FFFBD2` | Low-intensity signal background |
| Evidence Green | `#126147` | Public evidence and verified-source states |
| Quiet Grey | `#666965` | Supporting copy and secondary metadata |
| Warning Gold | `#735100` | Review and caution states |
| Alert Red | `#9F3027` | Errors and destructive actions |

Yellow is a signal, not a canvas. It should draw attention to the next useful
action or a short piece of meaning.

## Brand regression checks

- Preserve the approved message roles; do not create a competing homepage promise.
- Use only the canonical marks and tokens above.
- Check contrast, keyboard focus, favicon legibility, clear space, social crops, and fixed image dimensions.
- Verify public pages at 390, 768, 1024, and 1440 pixels after shared layout or typography changes.
- Rebuild current screenshots and launch assets when the visible product changes materially; July 18 assets remain historical only.
- Keep evidence confidence and uncertainty visually distinct. Brand polish must never make an assessment appear more certain than its sources.

## Typography and geometry

- Barlow: headlines, metrics, navigation, and concise labels.
- Inter: body copy, forms, tables, evidence, and long-form reading.
- Rounded geometry remains part of the identity, generally 12 to 18 pixels.
- Pills are reserved for filters and status labels.
- Prefer aligned sections, fine rules, and restrained shadows over stacked
  floating cards.

### Homepage hero

- Use the approved maritime evidence image as a full-bleed visual field with no
  border, corner radius, card shadow, or framed image treatment.
- Place the headline, explanation, live coverage count, and actions in a square
  North Ink editorial panel over the image on desktop. Stack the panel before
  the image on smaller screens so the decision path remains readable.
- Keep the headline's three-part reading rhythm and restrict Signal Yellow to
  the opening phrase and primary action.
- Render the static hero immediately. Stream the live coverage count in its own
  boundary and keep national map/search data behind the existing downstream
  loading boundary so corpus growth cannot block the first meaningful view.

## Public navigation

1. Map
2. Organizations
3. Public Needs
4. Defence Briefs
5. How It Works
6. About

`/demand` remains the canonical collection URL. **Public Needs** names the
collection; **Demand Signal** names one source-gated released record. Regions
remain available through the map, organization browsing, and footer.

## Evidence language

| State | Public meaning |
| --- | --- |
| Public-source fact | A claim supported by a released or official source |
| Our assessment | A human-reviewed interpretation, not a direct source claim |
| Evidence strength | How well the public record supports the displayed claim |
| Last reviewed | When the record was last checked |
| Not yet verified | Information that remains missing or uncertain |

Every public-demand connection keeps the procurement, endorsement, eligibility,
customer-interest, and classified-information caveats. Visual confidence must
never exceed evidentiary confidence.
