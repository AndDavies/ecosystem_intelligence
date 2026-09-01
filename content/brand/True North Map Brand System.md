# True North Map Brand System

Status: deployed public brand system
Approved: 2026-07-26
Identity revision: approved and deployed 2026-07-29
Last reviewed: 2026-08-31

## Brand idea

True North Map makes Canadian capability visible. It helps people see who can
help, understand why they may matter, and start the right conversation. Public
sources, assessment labels, limits, and human review establish trust after the
visitor understands the useful outcome.

## Message system

| Role | Approved copy |
| --- | --- |
| Brand promise | **Make Canadian capability visible.** |
| Homepage headline | **Canada is building more than most people can see.** |
| Category | **Canadian defence capability discovery** |
| Positioning | **True North Map helps people find Canadian defence and dual-use organizations and technologies, understand where they may fit, and decide who is worth speaking with next.** |
| Journey | **See who can help. Understand why they matter. Start the right conversation.** |
| Founder thesis | **The capability was here. The shared picture was not.** |
| Trust | **Public sources cited · Facts and assessments kept separate · Human review** |

Apply the message in this order: user job or desired outcome; possible fit and
next action; facts and True North Map assessment; then sources, limits, and
human review. `Evidence-led` remains correct in methodology, research, review,
evidence-strength, legal, and governance contexts. It is not the public product
category, a hero eyebrow, a social-card brand line, or the primary sales claim.

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
| Collateral PNG exports | `content/brand/exports/true-north-map-symbol.png`, `true-north-map-horizontal.png`, `true-north-map-stacked.png` | Transparent high-resolution exports for documents and presentations |

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
| Editorial Blue | `#E8F1F4` | Editorial structure, summaries, source panels, navigation and environment tags |
| Quiet Grey | `#666965` | Supporting copy and secondary metadata |
| Warning Gold | `#735100` | Review and caution states |
| Alert Red | `#9F3027` | Errors and destructive actions |

Yellow is a signal, not a canvas. It should draw attention to the next useful
action or a short piece of meaning.

Editorial Blue is a calm organizing colour, not an evidence or status signal.
Use it to separate reading structure, source actions and contextual navigation
from Signal Yellow actions and Evidence Green facts. Its interactive shade is
`#DCEBED`.

### Link affordance

- North Ink remains the normal inline-link colour. Colour alone must never be
  the only indication that text is actionable.
- Inline prose, methodology, citation and source-ledger links use a persistent
  current-colour underline approximately two pixels thick with visible offset.
  Hover may add Editorial Blue emphasis, but hover is not the first link cue.
- Keyboard focus uses the established Signal Yellow ring treatment. Visited
  editorial links may move to Quiet Grey while retaining the underline.
- External links that open a new tab include the external-link symbol and
  accessible **opens in a new tab** text.
- Navigation, cards, pills and buttons remain un-underlined when shape,
  placement and descriptive action copy already establish affordance.
- Use destination-specific labels such as **Explore Kraken Robotics' organization
  profile** or **View organizations connected to Arctic surveillance**. Do not
  use **Click here**, **Here**, **Read more** or another context-free anchor.

## Brand regression checks

- Preserve the approved message roles; do not create a competing homepage promise.
- Use only the canonical marks and tokens above.
- Check contrast, keyboard focus, favicon legibility, clear space, social crops, and fixed image dimensions.
- Verify public pages at 390, 768, 1024, and 1440 pixels after shared layout or typography changes.
- Compare the shared header across `/`, `/map`, and at least one public detail
  route whenever landing-page typography changes; navigation must not shift
  between routes.
- Create screenshots and launch assets only when Andrew explicitly requests a durable deliverable. Validate every requested asset against production at creation time; never maintain old screenshots as active brand guidance.
- Treat the North Signal name as the editorial briefing. Call the visual symbol the Directional N even where legacy filenames retain `north-signal-mark`.
- Keep evidence confidence and uncertainty visually distinct. Brand polish must never make an assessment appear more certain than its sources.

## Typography and geometry

- Barlow: deliberate brand-display moments such as hero headlines, major
  editorial statements, and selected metrics.
- Inter: navigation, body copy, interface labels, forms, tables, evidence, and
  long-form reading.
- The shared public header owns its Inter typography explicitly. Route-level
  wrappers must not change the navigation face or weight through inheritance.
- Rounded geometry remains part of the identity. Use 18 pixels for primary
  editorial and feature cards, 12 to 16 pixels for supporting content panels
  and controls, and a full pill radius only for compact labels, tags, filters,
  social actions, and directional links. Do not mix sharp cards into a rounded
  page family or make every surface a pill.
- Pills are used for filters, status labels, selected concepts, social actions,
  and compact directional calls to action. Major editorial actions remain
  rectangular so Signal Yellow and the primary journey retain hierarchy.
- Public surfaces remain predominantly borderless. Keyword and taxonomy pills,
  plus pill-shaped links, use one quiet one-pixel neutral edge so adjacent
  colours remain legible and actions stay identifiable.
- Prefer aligned sections, fine rules, and restrained shadows over stacked
  floating cards.
- Keep public cards and buttons spatially stable on hover. Use a subtle tonal
  shift, shadow refinement, underline or CTA colour change instead of lifting
  the component or moving its arrow.

### Tonal surface and edge system

- Field is the page canvas; Paper is the primary reading surface; Signal Wash
  marks the most important editorial conclusion; Editorial Blue organizes
  context, summaries, sources and navigation; quiet greys carry secondary
  structure. Evidence Green remains reserved for evidence and verified-source
  meaning rather than general decoration.
- Use colour-on-colour separation, whitespace and restrained shadow before
  drawing a container edge. Feature cards, article entries, newsletter bands
  and explanatory panels normally have no visible border.
- Borders are a semantic exception: use one quiet neutral pixel around keyword
  or taxonomy pills when adjacent tones need separation, and around pill-shaped
  links when the control must read immediately as an action. Do not use Signal
  Yellow as a decorative card outline.
- Article and archive cards stay on their assigned surface colour when hovered.
  A small shadow or tonal change may reinforce interactivity, but only the
  actual link or link pill receives the stronger colour response.
- Signals use the shared tonal vocabulary consistently: environment tags use
  Editorial Blue, activity and decision tags use Signal Yellow, and technology
  tags use a soft Evidence Green treatment. These meanings should be reused on
  other public routes rather than introducing route-specific tag colours.

### Collection and dossier reconciliation

- Signals, Organizations, and Mission Areas use one compact public collection
  hierarchy: category label, decision-oriented heading, one concise explanation,
  then the first useful records or choices. Do not place a full-width evidence
  legend or repeated activity showcase ahead of the primary collection.
- Use compact tonal metric strips only when live counts help a visitor choose a
  path. Editorial Blue, soft Evidence Green, Signal Wash, and quiet grey may
  separate measures without turning them into status claims.
- Organization directory cards show an approved official logo when available
  and a neutral organization mark otherwise. Summary cards do not repeat an
  evidence-strength pill; record-level evidence, assessment, freshness, and
  gaps remain visible on the dossier.
- Compact organization results use one shared identity hierarchy: approved
  public logo, then a deterministic two-letter monogram. Keep the mark inside a
  fixed square so lazy imagery does not shift text. A selected map result uses
  Signal Wash plus a Signal Yellow rule and clear focus state; colour never
  changes its rank, confidence, or publication meaning.
- Versioned organization dossiers read as one continuous editorial report on
  Field with Paper reading surfaces. The opening uses dark editorial type, a
  compact approved-logo/monogram/neutral identity slot and a controlled action
  panel rather than a mandatory image or dark database hero. Major chapters
  use aligned open layouts, fine rules and conditional content; Signal Wash is
  reserved for supported current activity. The desktop **On this page** index
  is non-sticky, left-aligned and compact, using a 16-pixel gap at the 1024
  breakpoint and 24 pixels on wider screens instead of stretching links across
  the frame. Mobile uses one native disclosure. Taxonomy pills retain their
  quiet neutral edge and enough wrapping space to remain legible.
- Mission Areas carry the distinction between reviewed discovery lenses and
  released requirements once in the collection introduction. Do not repeat the
  same boundary in stacked banners unless a later interaction creates a new
  risk of misunderstanding. Do not place the full evidence method before the
  first records.
- Functional collection pages lead with one outcome-led question, show useful
  published records before supporting methodology, and end with one contextual
  continuation. Summary cards use one canonical whole-card link with a visible
  text action and keyboard focus; counts name their published scope rather than
  implying ecosystem size or ranking.
- This is an active route-by-route reconciliation, not permission to restyle an
  untouched route opportunistically. Preserve existing workflows and evidence
  semantics while applying the shared surface contract.

### Shared public shell and editorial family

- Public collection/editorial headers use one order: breadcrumb, eyebrow,
  decision-oriented Barlow H1, one concise supporting sentence, at most one
  rectangular primary action plus an optional directional link, then a fine
  rule and the first useful object or records. A route must not replace this
  shell with a competing full-funnel hero.
- The shared header, mobile menu and footer remain Inter. Mobile navigation
  exposes the active route, Escape closes and restores focus, route changes
  close the menu, and interactive targets are at least 44 pixels.
- The footer groups **Explore**, **Intelligence**, and **Trust & About**, carries
  the concise independence line, and keeps North Signal as the standing signup
  action. Feedback belongs in the shared header/footer journey rather than a
  competing floating rail.
- **Defence Signals** is the publication-driven public proof library; **North
  Signal** is the single free email newsletter, with a human-reviewed weekly
  briefing by default and optional separately consented edition alerts. Use the Directional N for the visual mark and
  never use `Public Beta` as permanent wordmark, footer or social-card branding.
- Organization and capability details form one editorial dossier family. The
  public sequence is the record and its role, supported decision relevance,
  capabilities and reviewed connections, public programs or contracts with
  caveats, sources, **Evidence limits**, and one next-conversation handoff.
  Sparse records omit unsupported sections rather than falling into a separate
  legacy visual template.

### System states and recovery

- Loading language stays short and literal: **Loading the map…**, **Loading published organizations…**, and **Loading published Public Needs…**.
- Empty states name the published scope and suggest one useful adjustment. They use a quiet tonal surface rather than a decorative dashed border.
- The shared route error leads with **We could not load this view.** and offers retry plus Map recovery. It never exposes provider or database details.
- The not-found page leads with **We could not find that page.** and offers Map and homepage actions. It is explicitly excluded from indexing.
- Supporting trust and governance routes use Home as their breadcrumb parent. Product collections and dossiers retain their Map or collection parent so navigation describes the visitor's actual context.

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
  dark outcome-led worked example, selected Mission Areas and recent Signals,
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
- `/map` is the compact atlas workspace. Lead with **Explore True North Map**
  and **Find a company, capability or area of interest.** The first control is
  a familiar deterministic lookup over published organizations, capabilities,
  Technology Areas, Mission Areas, and Public Needs. It must say plainly that
  it does not use AI, provide grouped direct suggestions, and keep the live map
  immediately after the compact lookup, starting-point, and filter controls.
  Do not place a marketing hero or explanatory section before the tool.
- Use four compact labelled browse lenses—Mission Area, Public Need, Technology
  Area, and Organization type—when helping visitors start from known taxonomy.
  Show live organization counts and route every lens through ordinary shareable
  filter state. Ask True North is the distinct, secondary AI-assisted discovery
  path. Its compact disclosure leads with **Describe a challenge. See which
  Canadian capabilities may help.** The expanded panel asks **Not sure who or
  what to search for?** and explains **Ask True North helps you explore who may
  help—and why.** Retain the sensitive-information caution without repeating
  **public records only** at the point of entry, and keep the panel as the
  anchored destination for **Describe a need** actions.
  Desktop lenses use restrained
  popovers; mobile uses a focus-managed sheet rather than compressed option
  rows. Ask examples remain inside that panel as quiet prompts, not competing cards.
- At desktop widths, pair the active canvas with a fixed 380-pixel internally
  scrolling results rail and keep the synchronized accessible evidence table
  below the workspace. On mobile, use an explicit Map/List control and
  collapsed, preview and expanded results-sheet states. Preserve the shared
  URL state and never shrink desktop controls into unreadable mobile density.
  Secondary help, export and share utilities may follow the mobile map when
  that preserves a meaningful first-screen canvas; primary filters and Map/List
  state remain immediately adjacent to the workspace.
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

- Use imagery where it improves orientation or gives editorial content a clear point of entry: the homepage, Regions, Signals, the North Signal acquisition page, the preserved Defence Brief archive, About, and individual editorial heroes. North Signal may use the approved grayscale Canadian fighter/connected-map artwork with Signal Yellow afterburners as landing-page atmosphere; preserve the aircraft and exhaust crop and use descriptive alt text. Do not repeat that artwork inside the interrupt modal or mobile sheet, where the offer, live issue proof and form must remain the complete value proposition.
- Do not add decorative hero images to every directory. Organizations and Public Needs should lead with the task, evidence, and first useful records; additional image weight must earn its place through meaning or navigation value.
- Prefer Canadian people, engineering, facilities, testing, manufacturing, and operating environments over generic military spectacle.
- Keep fixed dimensions, descriptive alt text, responsive WebP delivery, and stable layout geometry. Visual polish must not delay the public shell or hide current coverage.

## Public navigation

1. Map
2. Organizations
3. Missions
4. Public Needs
5. Signals
6. How It Works
7. About

North Signal is the persistent signup action rather than another primary
navigation item. Existing Defence Brief URLs remain indexed and available as an
evergreen archive, but they are not promoted in primary navigation or new
acquisition journeys.

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
| Evidence limits | The claim-adjacent boundary of what the public record does not establish. Use a specific construction such as **Not established in the reviewed public record:** followed by the bounded missing point. `unknowns` and Coverage gap remain internal field/state names. |

Use the compact **How these records are assessed** disclosure when a collection
first introduces reviewed records. Editorial organization dossiers do not add a
standalone evidence legend, evidence-status badge, or unknowns panel. They keep
source links, review context, evidence strength where a relationship needs it,
and material limitations beside the specific claim they qualify. Keep the
complete definitions on How It Works and Methodology.
The footer uses the restrained line **Independent project by Andrew Davies.**;
the brand-level trust signature appears selectively rather than repeating on
every route.

Every public-demand connection keeps the procurement, endorsement, eligibility,
customer-interest, and classified-information caveats. Visual confidence must
never exceed evidentiary confidence.

## Public metadata, social cards, and founder voice

- Root metadata and social art use **Canadian defence capability discovery**,
  the approved headline, and **Make Canadian capability visible.** They never
  use `Public Beta` as permanent identity.
- The root share image complements, rather than repeats, the adjacent page
  title. It uses a dedicated 1,200-by-630-pixel asset with the Directional N,
  True North Map identity, category and one large promise: **Make Canadian
  capability visible.** The composition must remain legible when reduced to a
  168-by-88-pixel LinkedIn thumbnail; do not turn it into a miniature webpage
  with the long homepage headline, trust paragraphs, URL or small footer copy.
  Keep essential content inside a 72-pixel source safe zone and give a material
  composition revision a fresh image pathname so social scrapers do not retain
  stale art. The approved headline and positioning remain in the page metadata.
- Organization cards lead with the organization name and role or primary
  capability. Capability cards lead with the capability, organization, and
  location. The restrained footer is **Public sources cited · [location] ·
  Human review**. It does not imply endorsement, rank, procurement status, or
  customer interest.
- Andrew's founder voice is concrete, curious, and useful. It starts from one
  real Canadian capability or coordination question, explains what the public
  record makes visible, and invites correction or a better-informed
  conversation. It does not imitate institutional authority or turn caveats
  into the headline.
- Permanent product pages keep **Describe a need**, **Explore the map**, and
  **Working List** actions. The campaign line **Bring one real question. See
  what Canada can do.** belongs to approved outreach, not permanent site copy.
- North Signal's public offer is **Five minutes to understand what changed,
  which Canadian capabilities it may affect, and what to watch next.** Its
  reassurance is **Weekly. Original sources included. Human reviewed.
  Unsubscribe anytime.**

The operating cadence, post types, factual-check outreach, UTM contract, and
external-write authority live in `context/governance/Marketing And Outreach
Operations.md`.

## North Signal email application

The automated welcome, manual weekly issue and optional Defence Signal alert are
one restrained True North Map email family. Source-controlled email copy defines
the approved content and presentation contract; it does not edit MailerLite,
activate an automation or authorize a campaign or alert send.

- Use one compact provider-safe True North Map masthead: the approved
  Directional N followed or immediately succeeded by the separate
  `NORTH SIGNAL` product label. A horizontal True North Map lockup is
  also permitted when it fits the same restrained hierarchy. Do not invent a
  North Signal logo or add `Public Beta`.
- Use one 600-to-640-pixel column: Field outer canvas, Paper reading surface,
  North Ink headings and Inter body/UI copy. Barlow is reserved for one offer or
  editorial headline when the email client renders the approved web font
  reliably; otherwise use a safe sans-serif fallback without changing hierarchy.
- Use Editorial Blue for calm issue structure and Evidence Green only for
  verified-source meaning. Signal Yellow appears once on the rectangular
  primary CTA; it is never an email background, decorative outline or repeated
  button colour.
- Welcome email: concise brand orientation, one Signal Yellow **Read recent
  Canadian Defence Signals** action, Mission Areas as a secondary text link,
  and the lawful MailerLite footer. It is intended to send once to future
  affirmative-consent entrants in the North Signal master lifecycle group. The
  master, weekly and alert delivery groups were reconciled in MailerLite on
  August 27, 2026.
- Weekly email: map `north_signal_issue_v2` into one bottom line, one to three
  published Signals, decision implications, new supported connections,
  evidence limits and what to watch next. Use one Signal Yellow **Explore recent
  Signals** action and at most one secondary contextual product text link.
- Optional alert email: use a separate `DEFENCE SIGNAL` label, the published
  edition title, executive summary, two to three concrete topics, one principal
  evidence limit and one Signal Yellow **Read the Defence Signal** action. It is
  part of North Signal, not a second newsletter, and sends only after a validated
  edition appears in the stable-GUID RSS feed. A draft, correction or
  `no_publish` outcome creates no alert. The alert format, published Preference
  Center and new-posts-only RSS campaign are active; the checkbox remains
  fail-closed unless the public flag and complete server-side provider
  configuration agree.
- Do not make a generic fighter, naval, map or stock image part of the permanent
  template. One issue-specific image may appear in a weekly issue only when it
  is the approved image from a cited published Signals edition, has meaningful
  alt text, a stable crop and a destination/source relationship. The welcome
  does not need a hero image.
- Keep the verified sender/reply-to, physical address, privacy/unsubscribe
  controls and provider footer functional. No fabricated subscriber proof,
  endorsement, MailerLite branding panel, extra consent request or `/briefs`
  acquisition link is permitted.
