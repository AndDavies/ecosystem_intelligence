# True North Map Brand System

Status: deployed public brand system
Approved: 2026-07-26
Identity revision: approved and deployed 2026-07-29
Last reviewed: 2026-09-06

## Brand idea

True North Map makes Canadian capability visible. It helps people see who can
help, understand why they may matter, and start the right conversation. Public
sources, assessment labels, limits, and human review establish trust after the
visitor understands the useful outcome.

## Message system

| Role | Approved copy |
| --- | --- |
| Brand promise | **Make Canadian capability visible.** |
| Homepage headline | **Find Canadian companies and technologies for your next defence project.** |
| Slogan | **Canada is building more than most people can see.** |
| Category | **Canadian defence and dual-use directory** |
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
| Link Blue | `#245B78` | Underlined editorial and source links on light surfaces |
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

- Use Link Blue `#245B78` for inline prose, sources and contextual navigation on light surfaces, with persistent underlines. Editorial Blue remains a pale organizing surface, not a text colour. Visited prose links may use `#59476B`; keep the underline.
- On North Ink, use white links with visible underlines and Signal Yellow for selective emphasis. Never place dark blue source links on ink.
- Links, buttons and other action controls use a three-pixel North Ink keyboard outline with a white separating halo; inverse surfaces use a white outline with an ink halo. Text fields and selects retain their existing one-pixel border, changing from grey to North Ink on focus with no extra ring or halo. Yellow may supplement focus, never supply the only indicator on white.
- External links that open a new tab retain the external-link symbol and accessible **opens in a new tab** text.
- Action pills and navigation have distinct shape, placement and descriptive copy. Use destination-specific labels and retain source, assessment and limitation distinctions.

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

The approved September 5 desktop mockups supersede the earlier rounded-card default. The logo, product wording, Barlow and Inter remain unchanged.

- Barlow 800 for brand/display headlines; 700 for section headings. Inter for navigation, body, forms, tables and reading. The header owns its Inter face explicitly.
- Desktop heroes use 56–64px type; collections 40–44px; section headings 28–32px; record headings 20–24px. Use deliberate heading styles and display tracking near -0.035em.
- Use the shared 1480px maximum frame, aligned gutters, open columns and dividing rules. The map remains fluid. Signals use a 1160px reading-plus-contents frame with a 32px grid gap; prose occupies its full column rather than leaving a phantom image column.
- Content sections and record rows are square and open. Fields use 12px radius. Real panels and dialogs use 8px. Primary/secondary actions use pills; compact status and filter pills retain their semantics. About's approved jet hero keeps its soft geometry as a deliberate feature exception.
- Use the spacing scale 4, 8, 12, 16, 24, 32, 48, 64 and 96px. Interaction targets default to 44px. Shadows are for overlays and layering, not routine article or record cards. Hover does not move the layout.

### Component grids and grouping

Apply these rules to new or materially changed components. This is a forward design contract, not an instruction to restyle every existing route.

- Start with the parent grid, then groups, then text and controls. Align sibling content edges to the same columns and shared gutters; do not position each card independently. Use an 8px base for layout with the existing 4px increments for compact text/control spacing. Prefer 16, 24 and 32px within components; use larger scale steps between major sections.
- Give a real information panel a consistent 24px inset. Use 16px only for compact layouts and 32px when the content warrants a larger inset. Inset belongs to the panel container, so headings, copy and controls share an edge. Preserve the established 8px panel radius, 12px fields and pill actions; a 24px radius is not a new global default.
- Use space and a quiet Field surface to distinguish a supporting group before adding another grey rule. A divider has one owner: a section, a repeated row or a fact group. Avoid adjacent parent/child rules that describe the same boundary. A panel should not need an additional decorative outer border and internal separators for every paragraph.
- Align separators to the width of the group they describe. Shared footnotes and freshness rows span the whole facts grid, including its column gap. Align peer cards' section boundaries and actions with shared row structure; allow text to wrap without arbitrary fixed heights, truncation or reordering at narrower widths.
- Within a compact component, aim for at most three type sizes and three weights, each with a clear job: heading, reading/action text and supporting metadata. Use Barlow and Inter, the existing type tokens and readable line height. Do not shrink body text to meet a quota; a complex dossier contains several components rather than one global three-size limit.
- Keep the primary contextual action next to the explanation it acts on. Organization capability rows read: description, Explore link, Domains, then evidence strength and review date. Supporting operating context sits in a separate Field panel. Source facts, assessment and uncertainty remain distinguishable through wording and labels, never colour alone.
- On smaller screens, keep semantic source order, stack panels with the same grouping logic, and preserve touch targets and keyboard focus. Check the changed component at 390, 768, 1024 and 1440px with long and sparse content; use local fixtures rather than a production profile sweep.

Adapted from the grid and hierarchy guidance in [Michael Schwaibold's post](https://x.com/MSchwaibold/status/2096306405649318139), using the excerpt Andrew supplied on September 6. TNM retains its approved typography, palette and geometry.

### Colour fields and edges

- North Ink `#242827` is the dark brand surface; it is not pure black. Use it for the shared header/footer, homepage and Signals mastheads and newsletter bands.
- Paper supports reports and collection reading; Field supplies alternating homepage sections. Use fine neutral rules to group open content.
- Signal Yellow identifies primary actions and short headline highlights. Evidence Green, Warning Gold, Alert Red and the established Signal taxonomy colours retain their meanings; design does not strengthen evidence or imply endorsement.
- Company logos sit directly on the reading surface with clearspace and a fixed layout slot. Do not add a gray rounded tile behind a supplied logo. Missing marks use a deterministic neutral monogram.

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
  Paper with open reading sections. The opening uses dark editorial type, a
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

### Defence Signals editorial reading

- Let significance determine editorial length and unequal item depth. Lead with a substantial orientation, then explain the developments and connections that earned attention. A shared thesis is optional.
- V3 shows the narrative once, with accessible evidence/assessment details and source links nearby. Show a limitation or next step when it adds a specific conclusion; avoid repeating four mandatory evidence boxes or adding confidence badges. Historical editions retain their existing presentation.
- A relevant cited source image is welcome; an intentional text-led edition is complete without one. Do not replace a missing event image with a generic logo, unrelated stock or generated event photograph. No new brand artwork is required.
- Keep the existing Paper-on-Field typography, spacing, readable measure, tonal hierarchy and keyboard focus. Reader-facing content should explain the intelligence rather than the private research mechanics.

### System states and recovery

- Loading language stays short and literal: **Loading the map…**, **Loading published organizations…**, and **Loading published Public Needs…**.
- Empty states name the published scope and suggest one useful adjustment. They use a quiet tonal surface rather than a decorative dashed border.
- The shared route error leads with **We could not load this view.** and offers retry plus Map recovery. It never exposes provider or database details.
- The not-found page leads with **We could not find that page.** and offers Map and homepage actions. It is explicitly excluded from indexing.
- Supporting trust and governance routes use Home as their breadcrumb parent. Product collections and dossiers retain their Map or collection parent so navigation describes the visitor's actual context.

### Homepage and discovery journey

The September 5 desktop visual implementation restores the original maritime image within the approved discovery journey. Use this fixed order: practical search hero; compact current Kraken/KATFISH profile proof with the slogan; North Signal; three discovery paths; one current Defence Signals edition; founder, FAQ and footer.

The hero says what the service is and helps the visitor do something immediately. Its support copy is: “Search a free directory of defence and dual-use companies, research centres and industry organizations. See what they do, check the sources and build a shortlist for your next conversation.” The primary action is **Search the directory**, with **Explore the map** and **How it works** supporting it. State **Free to browse. No account needed.** Use Paper, North Ink and Editorial Blue; Signal Yellow identifies the primary action. Keep the directional N, Barlow display and Inter interface fonts. Use the original `home-maritime-evidence.webp` on the right of the open North Ink hero; copy and deterministic search occupy the left. Keep the entire headline in plain white lettering with no marker highlight or letter outline. The image is brand atmosphere, not evidence or a functioning map. The 50/50 desktop split may use a subtle uneven harbour-mist transition on the image edge. Motion settles within five seconds and is disabled for reduced-motion preferences; copy remains on solid North Ink. On small screens, copy/search precede a compact image. Keep search visible at 1366px desktop width without a decorative overlay card.

The product specimen uses current published Kraken/KATFISH facts, assessment, evidence strength, review date and limits. It must fail honestly when unavailable and must not imply endorsement or procurement eligibility. Do not hardcode a corpus count.

Homepage, directory and map share deterministic lookup. Direct record selection opens the profile; a submitted home query opens `/organizations?q=...`; taxonomy suggestions open the existing filtered map. The directory preserves query, type and region through pagination. Ask True North remains a separately labelled, optional AI action.

Bare `/map` visits below 1024 pixels start with results; desktop starts with the map. Explicit `view` wins. A selected record or bounds without `view` preserves map intent. Resizing does not override a choice. List is a real view switch at every width. Results disclose geographic scope, and **Search all Canada** clears only bounds. The four browse lenses remain available in a compact disclosure. Mobile utilities follow results.

How It Works follows **Find a team or technology → assess a profile → save and start a conversation**. It retains the adjustable modular naval guided example and the optional Ask path. Its product tour uses current page views, captions and a transcript.

### Public terminology

| Concept | Public label |
| --- | --- |
| Organization collection | Directory |
| Single record | Organization profile |
| Mixed capability collection | Technologies and services |
| Technology taxonomy | Technology areas |
| Operational taxonomy | Mission areas |
| Released requirement navigation | Defence needs |
| Released requirement collection heading | Published defence needs |
| Private saved collection | Shortlists / My shortlists / Add to shortlist |
| Public editorial stream | Defence Signals — news and analysis |
| Email product | North Signal — weekly briefing from True North Map |
| Zero reviewed relationships | No reviewed connection yet |

Keep URLs, database keys, event names, canonical taxonomy IDs, source quotations and user-authored shortlist names intact. Missing reviewed links are a coverage limit, not evidence of no real-world fit.

### Voice and evidence for the design

Write as a knowledgeable person helping another person investigate a real project. Use concrete nouns and verbs, short descriptive headings, natural sentence lengths and specific next steps. Keep “dual-use” where scope matters and explain it as technology with civilian and defence uses when needed. Avoid repeated three-part slogans, vague intelligence language, invented social proof, unnecessary superlatives and promises about outcomes the product cannot establish. Use first-person founder prose only for Andrew’s account of the project.

Research informing this hierarchy: Nielsen Norman Group’s [homepage principles](https://www.nngroup.com/articles/homepage-design-principles/), [online reading research](https://www.nngroup.com/articles/how-people-read-online/) and [information scent](https://www.nngroup.com/articles/information-scent/), plus [GOV.UK content design guidance](https://www.gov.uk/guidance/content-design/writing-for-gov-uk). These support clarity, scanning and descriptive actions; they do not establish a conversion uplift for True North Map. Validate that with real visitors and measured behaviour.

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

Directory, Map, Mission areas, Defence needs, Defence Signals, About. **Free weekly briefing** is the persistent acquisition action. How It Works remains in the footer, homepage and contextual journey. Regions and the Defence Brief archive remain available through their existing paths. A newsletter header action must work on sign-in as well as public content routes.

`/demand`, `/capabilities` and `/collections` retain their canonical URLs. Public language changes do not rename their data contracts.

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

- Root metadata and social art use **Canadian defence and dual-use directory**,
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

## September 5 desktop implementation and editorial imagery

The homepage, directory, company dossier and Signals mockups define the shared presentation. Directory filters occupy a left desktop rail; open rows preserve every record and pagination. Profiles retain all source-backed facts, assessments, dates, limitations, sources, downloads, sharing, introductions and Shortlist paths. Supporting collections, forms, guides, legal pages and private workspaces inherit the same type, control and divider system. About's original jet composition remains intact.

Every Signals edition has an intentional visual cover: its published source image, a specifically reviewed presentation asset, a published linked-organization logo, or the Directional N editorial cover. Article headings can use a relevant published logo without reserving empty space beside the subsequent prose. The Allen-Vanguard edition uses its official EQUINOX NG product image and company mark, with source credit and an explicit product-context caption. These display assets do not change article claims, immutable source records, metadata evidence, publisher requirements or publication state. Source photographs remain optional under the executable Signals contract. Do not invent documentary imagery to fill a missing source photo.

Signals have one desktop contents rail and a collapsed mobile contents control. The complete introduction and every story remain available; no editorial text is shortened to match a mockup excerpt. Newsletter consent, validation, optional alerts, automatic-trigger suppression, dismissal and success/error behaviour remain unchanged. Public/member/admin controls keep their existing permissions and workflows.

This implementation is local pending Andrew's browser review and a separately authorized production release. No database migration, research/Signals publication, provider write or campaign belongs to the visual change. Use local automated checks and a bounded set of representative browser states; do not run `launch:audit` or a production route crawl.

### September 5 browser-review refinements

Inline newsletter copy and signup use a centred 1216px maximum composition with a 48px desktop column gap. Dark newsletter links use yellow for the offer and white for privacy. Enabled buttons and links use a pointer cursor; disabled controls remain visually and behaviourally distinct.

Map lookup is the primary control beside a bounded title column. Ask True North and Browse retain fixed trigger positions and expand into full-width panels below both triggers. Expansion must never change a trigger's column or force its neighbour onto another line. Decorative scope pills are omitted; published-result counts and functional geographic-scope controls remain.

Paired mission statistics/dividers and defence-need actions share baselines without truncating summaries. Defence-need icons reflect broad title topics, using ink marks inside yellow circles; these are navigation decoration, not evidence or eligibility classifications.

The Signals archive shows four earlier editions per page, retains search/topic filtering across page changes and resets to page one when a filter changes. Group topic controls by operating environment, development and technology, using pill-shaped controls with a light one-pixel grey border and a yellow selected state. Selection changes colour only: no check icon, width change, font-weight change or movement of neighbouring tags. Article tags are compact text with yellow separators. Other semantic evidence/status colours remain unchanged. Teasers use the edition's existing published lead image, explicit attribution and an ink editorial composition; the established branded cover handles editions without images. The newsletter stays after pagination. No image is presented as support for an unrelated claim.

The homepage product specimen separates its source-backed offering from the highlighted assessment. Use a yellow left rule on North Ink for “Our assessment · Where this could help”; retain the complete existing unknowns under “What still needs checking”. Do not invent additional technology claims for visual emphasis.

September 5 follow-up: map search uses a uniform grey outline on white, with the same rounded input geometry as other forms; do not use the yellow left-rule treatment on inputs. Public footer backgrounds span the viewport, with inner content aligned to the shared frame. The Defence needs index omits the redundant “How connections are assessed” disclosure; methodology and record-level evidence/limitations remain available.

### Discovery-control refinements (September 5 local review)

- Organization-type browsing offers Companies, Innovation & business support, Research and test centres, and Investors and funders. The support group includes accelerators, incubators, ecosystem organizations and government innovation offices; it is a discovery convenience, not a new canonical classification. Existing exact type/category links remain supported and visibly selected.
- Mission and Defence need discovery cards, including reciprocal related-record bridges, share a 48px Signal Yellow circle with a North Ink topic icon. Choose a meaningful subject cue (patrol radar, Arctic snowflake, underwater waves, edge processor); do not reuse a generic document icon for every topic. Keep status and evidence icons semantically separate.
- The desktop results table has fixed column proportions and reserved selection borders. Expanding or hydrating a record must not reflow its column widths. Long text wraps within its column; narrower layouts use the existing mobile result cards or contained table scrolling.

- About presents the founder’s military and civilian career in ordinary narrative paragraphs; omit the uppercase career-credit tagline from the jet feature.

- Signal link previews use the published hero when present, then an approved presentation image, then the edition-specific branded social card. Open Graph and Twitter must never omit their image merely because the source edition has no hero image.
