# True North Map Brand System

Status: Phase 1B public system
Approved: 2026-07-26
Identity revision: 2026-07-29 local review candidate

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

The revised True North Map mark is a compact directional N. Its uninterrupted
black or white structure represents a strong Canadian capability base. A
separated Signal Yellow corner points north and makes direction, discovery and
forward movement visible without adding a literal map pin, compass or military
symbol. The permanent wordmark never includes the Public Beta label.

The approved visual reference for this revision is
`content/brand/source/true-north-map-logo-master-2026-07-29.png`. Production-ready
artwork is reconstructed as flat SVG geometry rather than cropped from that
raster presentation sheet. Until Andrew approves the local website review, this
packet is a local identity candidate and must not be described as deployed.

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
| Horizontal light lockup | `app/public/brand/true-north-map-horizontal-light.svg` | Dark footers, presentation fields, and wide inverse placements |
| Stacked wordmark | `app/public/brand/true-north-map-stacked.svg` | Compact editorial and collateral placements |
| Directional N mark | `app/public/brand/north-signal-mark.svg` | Primary standalone mark on light surfaces |
| Light mark | `app/public/brand/north-signal-mark-light.svg` | Dark surfaces |
| Monochrome mark | `app/public/brand/north-signal-mark-monochrome.svg` | One-colour reproduction |
| Small-size marks | `app/public/brand/north-signal-mark-16.svg`, `north-signal-mark-24.svg`, `north-signal-mark-32.svg` | Favicons and compact interface use |
| App tile | `app/public/brand/true-north-map-app-tile.svg` | App icons and square product placements |
| Social avatar | `app/public/brand/true-north-map-social-avatar.svg` | LinkedIn and other account avatars |
| Social avatar PNG | `app/public/brand/true-north-map-social-avatar.png` | 1024 pixel upload-ready social account avatar |
| Collateral PNG exports | `content/brand/exports/true-north-map-symbol.png`, `true-north-map-horizontal.png`, `true-north-map-stacked.png` | Transparent high-resolution exports for documents and presentations |
| LinkedIn banner | `content/launch/phase-2/true-north-map-linkedin-banner.png` | True North Map organization page |
| Partner overview | `content/launch/phase-2/true-north-map-partner-overview.pdf` | One-page external orientation |
| Partner/media deck | `content/launch/phase-2/true-north-map-partner-media-deck.pptx` | Editable launch and partner presentation |

The master reference image records the approved direction, not a distributable
logo file. The flat SVG packet above is the implementation source of truth. Do
not crop production marks from the reference sheet, alter the N proportions,
move or enlarge the Signal Yellow corner, add gradients, or add “Public Beta”
to the permanent identity.

### Clear space and minimum size

- Preserve clear space equal to at least one quarter of the symbol width.
- Use the simplified 16, 24 or 32 pixel files for compact interface placements.
- Do not place the dark mark on a dark image or the light mark on a light field.
- The yellow corner must remain visible; use the monochrome mark only when
  colour reproduction is unavailable.
- Use the horizontal lockup as one line. Do not restack the words independently.

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

- Use the approved maritime evidence image in a compact square-edged split hero
  with no corner radius, card shadow, or decorative image border.
- Place the headline, explanation, live coverage count, and actions in a Paper
  editorial panel beside the image on desktop. Stack the panel before the image
  on smaller screens so the decision path remains readable.
- Keep the headline's three-part reading rhythm and restrict Signal Yellow to
  the opening phrase and primary action.
- Keep the desktop hero to 480 pixels so discovery remains visible without an
  oversized image pushing the map farther down the page.
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
