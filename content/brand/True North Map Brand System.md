# True North Map Brand System

Status: deployed public brand system
Approved: 2026-07-26
Identity revision: approved and deployed 2026-07-29
Last reviewed: 2026-08-03

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
raster presentation sheet. Andrew approved the local website review and the
directional-N packet is the deployed product identity.

Available artwork:

- Horizontal header lockup.
- Stacked wordmark.
- Standalone Directional N mark.
- Light, dark, and one-colour variants.
- Simplified favicon and social-avatar mark.

Canonical asset packet:

| Asset | Repository path | Intended use |
| --- | --- | --- |
| Horizontal lockup | `app/public/brand/true-north-map-horizontal.svg` | Desktop header, partner material, wide placements |
| Horizontal light lockup | `app/public/brand/true-north-map-horizontal-light.svg` | Dark footers, presentation fields, and wide inverse placements |
| Stacked wordmark | `app/public/brand/true-north-map-stacked.svg` | Compact editorial and collateral placements |
| Directional N mark | `app/public/brand/north-signal-mark.svg` | Primary standalone mark on light surfaces; the retained filename is an implementation detail |
| Light mark | `app/public/brand/north-signal-mark-light.svg` | Dark surfaces |
| Monochrome mark | `app/public/brand/north-signal-mark-monochrome.svg` | One-colour reproduction |
| Small-size marks | `app/public/brand/north-signal-mark-16.svg`, `north-signal-mark-24.svg`, `north-signal-mark-32.svg` | Favicons and compact interface use |
| App tile | `app/public/brand/true-north-map-app-tile.svg` | App icons and square product placements |
| Social avatar | `app/public/brand/true-north-map-social-avatar.svg` | LinkedIn and other account avatars |
| Social avatar PNG | `app/public/brand/true-north-map-social-avatar.png` | 1024 pixel upload-ready social account avatar |
| X profile header | `content/launch/broader-public-beta-2026-08/true-north-map-x-header.png` | Text-free companion header with a protected left avatar area |
| Collateral PNG exports | `content/brand/exports/true-north-map-symbol.png`, `true-north-map-horizontal.png`, `true-north-map-stacked.png` | Transparent high-resolution exports for documents and presentations |
| LinkedIn banner | `content/launch/phase-2/true-north-map-linkedin-banner.png` | Historical Phase 2 asset; rebuild with the Directional N before distribution |
| Partner overview | `content/launch/phase-2/true-north-map-partner-overview.pdf` | Historical Phase 2 asset; rebuild with current interface and identity before distribution |
| Partner/media deck | `content/launch/phase-2/true-north-map-partner-media-deck.pptx` | Historical Phase 2 asset; rebuild with current interface and identity before distribution |

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
- Compare the shared header across `/`, `/map`, and at least one public detail
  route whenever landing-page typography changes; navigation must not shift
  between routes.
- Rebuild current screenshots and launch assets when the visible product changes materially; July 18 assets remain historical only.
- Treat the North Signal name as the editorial briefing. Call the visual symbol the Directional N even where legacy filenames retain `north-signal-mark`.
- Keep evidence confidence and uncertainty visually distinct. Brand polish must never make an assessment appear more certain than its sources.

## Typography and geometry

- Barlow: deliberate brand-display moments such as hero headlines, major
  editorial statements, and selected metrics.
- Inter: navigation, body copy, interface labels, forms, tables, evidence, and
  long-form reading.
- The shared public header owns its Inter typography explicitly. Route-level
  wrappers must not change the navigation face or weight through inheritance.
- Rounded geometry remains part of the identity, generally 12 to 18 pixels.
- Pills are used for filters, status labels, selected concepts, social actions,
  and compact directional calls to action. Major editorial actions remain
  rectangular so Signal Yellow and the primary journey retain hierarchy.
- Prefer aligned sections, fine rules, and restrained shadows over stacked
  floating cards.

### Homepage hero

- Use the approved maritime evidence image in a compact square-edged split hero
  with no corner radius, card shadow, or decorative image border.
- Place the headline, explanation, and actions in a Paper editorial panel beside
  the image on desktop. Keep the three live coverage measures in one restrained
  Paper overlay within the image field rather than a separate page-width band.
  On mobile, use a compact three-column overlay that does not add hero height or
  obscure the primary decision path.
- Keep the headline's three-part reading rhythm and restrict Signal Yellow to
  the opening phrase and primary action.
- Continue the image field into a 64-pixel Paper caption cutout beneath the
  desktop image. Use it for the brand promise and one short supporting line;
  do not add another card, border, or shadow.
- Keep the desktop hero to 480 pixels so discovery remains visible without an
  oversized image pushing the map farther down the page.
- Render the static hero immediately. Stream the live coverage measures in their
  own fixed-geometry overlay boundary and keep national map/search data behind the existing downstream
  loading boundary so corpus growth cannot block the first meaningful view.

### Guided landing and map workspace

- `/` is the guided public entrance. It moves from the hero and compact live
  coverage overlay into three clear starting jobs, a real published product specimen, a
  dark evidence-led worked example, selected Mission Areas and Defence Briefs,
  North Signal, contribution, independence, and trust questions.
- The starting-job cards are functional choices, not decorative dashboard
  tiles. Use one Signal Yellow primary card, two Paper secondary cards, solid
  icon fields, concise copy, and pill-shaped directional actions.
- The worked example uses the North Ink field, selected-concept pills, a clear
  five-step path, and one prominent guided-search action. Its result is a
  private evidence-backed Working List, not an automated recommendation.
- The landing specimen uses the real published Kraken Robotics and KATFISH
  record with a lazy fixed MapTiler view. Kraken is visibly selected, while
  zoom, pan, markers, controls, tooltips, and other map interactions remain
  disabled so the specimen reads as a spatial illustration rather than a
  second atlas workspace.
- `/map` is the compact atlas workspace. Lead with **Map Canadian capability**
  and **Search by need, mission, technology or place.**, then place the live
  map immediately after the compact search, starting-point and filter controls.
  Do not place a marketing hero or explanatory section before the tool.
- At desktop widths, pair the active canvas with a fixed 380-pixel internally
  scrolling results rail and keep the synchronized accessible evidence table
  below the workspace. On mobile, use an explicit Map/List control and
  collapsed, preview and expanded results-sheet states. Preserve the shared
  URL state and never shrink desktop controls into unreadable mobile density.
- The hero coverage overlay shows only published organizations, reviewed
  technologies, and cited public sources. It omits a freshness sentence, uses
  fine separators only in its vertical desktop form, and becomes a compact
  three-column image overlay on smaller screens without increasing hero height.
- Use compact LinkedIn and X social-action pills in the footer with the plain
  invitation **Follow us on...**. Social controls remain secondary to the
  page's task and evidence actions.

### Regional imagery

- The approved regional image family uses restrained grayscale photography
  with Signal Yellow as a directional or evidence accent.
- Canada, Atlantic Canada, Quebec, Ontario, the Prairies, British Columbia and
  the North each have one 4:3 WebP image under
  `app/public/imagery/regions/`.
- Regional images are illustrative orientation, never geographic evidence.
  Counts, organization locations and coverage statements must continue to come
  from the canonical published records.
- Use descriptive alt text, fixed aspect ratios and the shared regional hero
  component. Directory cards use the source-native 4:3 frame so approved art
  meets every card edge without cropping or empty side gutters. Unknown regions
  retain the abstract fallback rather than borrowing another region's image.
- Do not add text, flags, logos or place labels inside the image asset. Route
  headings and evidence remain readable HTML outside the artwork.

### Collection and editorial imagery

- Use imagery where it improves orientation or gives editorial content a clear point of entry: the homepage, Regions, Defence Briefs, About, and individual Brief heroes.
- Do not add decorative hero images to every directory. Organizations and Public Needs should lead with the task, evidence, and first useful records; additional image weight must earn its place through meaning or navigation value.
- Prefer Canadian people, engineering, facilities, testing, manufacturing, and operating environments over generic military spectacle.
- Keep fixed dimensions, descriptive alt text, responsive WebP delivery, and stable layout geometry. Visual polish must not delay the public shell or hide current coverage.

## Public navigation

1. Map
2. Organizations
3. Missions
4. Public Needs
5. Defence Briefs
6. How It Works
7. About

`/demand` remains the canonical collection URL. **Public Needs** names the
collection; **Demand Signal** names one source-gated released record. Regions
remain available through the map, organization browsing, and footer.

## Evidence language

| State | Public meaning |
| --- | --- |
| Source-backed fact | A claim supported by a released or official source |
| Our assessment | A human-reviewed interpretation, not a direct source claim |
| Evidence strength | How well the public record supports the displayed claim |
| Last reviewed | When the record was last checked |
| Coverage gap | Information that remains missing or uncertain |

Every public-demand connection keeps the procurement, endorsement, eligibility,
customer-interest, and classified-information caveats. Visual confidence must
never exceed evidentiary confidence.
