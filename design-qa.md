# True North Map design QA record

## Phase 1B North Signal system - 2026-07-26

### Comparison target

- Source visual truth:
  - `/var/folders/zy/qv3qyrkj13n26_6wv7xrdndm0000gn/T/codex-clipboard-5e259cdc-6ba8-4419-a112-e58b042295bd.png`
  - `/Users/andrewdavies/Downloads/ChatGPT Image Jul 25, 2026, 04_50_05 PM.png`
- Browser-rendered implementation:
  - `output/phase1b-home-1440.png`
  - `output/phase1b-home-390.png`
- Combined comparison: `output/phase1b-design-comparison.png`
- Route: `http://localhost:3011/`
- State: anonymous public visitor using current production records.

### Viewport and normalization

- Source homepage mock: `629 x 445` pixels.
- Implementation desktop capture: `1425 x 990` content pixels from a requested
  `1440 x 1000` viewport.
- Implementation mobile capture: `375 x 844` content pixels from a requested
  `390 x 844` viewport.
- The combined comparison normalizes both desktop frames to 900 pixels wide.
  The source is a compact audit mock rather than a pixel-for-pixel page export,
  so the comparison evaluates visual hierarchy, proportion, colour, imagery,
  navigation, and decision flow.

### Full and focused comparison

- The implementation preserves the mock's compact white header, yellow active
  rule, headline-and-maritime split hero, paired calls to action, bounded Ask
  True North panel, suggested searches, and four-step decision journey.
- The approved highlight treatment is restored as charcoal type on Signal
  Yellow, improving contrast over the interim yellow-text treatment.
- The live trust boundary and dynamic coverage metrics extend the audit mock
  without displacing the core hero or search journey.
- The approved maritime image is contained at every breakpoint with fixed
  responsive dimensions and no observed layout shift.
- Mobile keeps the hierarchy intact, presents both actions before the image,
  and uses an accessible menu. `scrollWidth` equals `clientWidth` at 390 pixels.

### Findings and iterations

1. P1: Signal-yellow headline text on the Field canvas did not provide adequate
   contrast. Fixed by using the approved marker treatment with North Ink text.
2. P1: Organization profile actions and desktop navigation overflowed at the
   1024-pixel breakpoint. Fixed by retaining the compact menu and stacked page
   header until 1280 pixels. Post-fix `scrollWidth` equals `clientWidth`.
3. P2: The compact evidence legend left an imbalanced empty column at the
   1024-pixel breakpoint. Fixed by holding the horizontal legend layout until
   1280 pixels and using three balanced state columns at tablet width.
4. No actionable P0, P1, or P2 findings remain after the final comparison.

### Verification

- [x] Primary and mobile navigation.
- [x] Public Needs routes to `/demand`.
- [x] Signed-out account and admin boundaries redirect safely.
- [x] Ask True North returns deterministic fallback safely when the model is
  temporarily unavailable.
- [x] Mobile map and accessible-list toggle stay synchronized.
- [x] Update prompt opens as a centered consent-backed dialog.
- [x] Share dialog exposes LinkedIn, X, and copy-link actions.
- [x] North Signal remains legible in 16- and 32-pixel renders.
- [x] No horizontal overflow across the required public routes at 768, 1024,
  and 1440 pixels after the profile breakpoint repair.

final result: passed
## Defence Briefs design QA

## Comparison target

- Source visual truth paths:
  - `/var/folders/zy/qv3qyrkj13n26_6wv7xrdndm0000gn/T/codex-clipboard-caac04c9-0241-45b1-83b8-ed253012f62a.png`
  - `/var/folders/zy/qv3qyrkj13n26_6wv7xrdndm0000gn/T/codex-clipboard-7c2804ea-071e-4bd3-90ec-5c99ce1d7db9.png`
- Browser-rendered implementation screenshots:
  - `/tmp/tnm-briefs-landing.png`
  - `/tmp/tnm-brief-detail.png`
- Routes: `http://localhost:3000/briefs` and `http://localhost:3000/briefs/modular-containerized-systems-for-naval-operations`
- State: anonymous public visitor, published article data, light theme.

## Viewport and normalization

- Source pixels: `1503 x 810` and `1515 x 826`.
- In-app-browser implementation pixels: `933 x 948`; CSS viewport reported as `948 x 963` because browser chrome consumes part of the capture.
- Density: browser and source captures were treated as 1x UI captures.
- For focused comparison, source images were proportionally normalized to 933 pixels wide. The corresponding implementation page regions were cropped below global navigation to the same 933-pixel width. Normalized landing regions were `933 x 503`; normalized detail regions were `933 x 508`.
- The available in-app-browser viewport is narrower than the supplied desktop screenshots. Comparison therefore focuses on the responsive intent and the reported defects, not false pixel-level desktop parity.

## Full-view comparison evidence

- The supplied landing capture showed the featured image escaping its grid track and covering the headline, description, and call to action.
- The revised landing capture keeps all featured metadata, headline, standfirst, source count, and action in a bounded white panel. At narrower widths, the editorial panel appears before the image; at desktop width the same components use a two-column grid.
- The supplied detail capture showed a large image-first region with the article content effectively below the fold. The revised detail capture uses a bounded headline-and-image hero, with the Bottom line section visibly beginning at the fold.
- Mobile checks at a 390 x 844 requested viewport found no horizontal overflow (`scrollWidth` equals `clientWidth`) and no question-form headings in article content.

## Focused region comparison evidence

- Typography: the existing True North Map Barlow hierarchy is preserved. Headlines retain the established heavy display weight, while metadata, standfirst, and article body use the existing site scale and line-height tokens.
- Spacing and layout: hero imagery is now explicitly bounded by a positioned, full-width container. Tablet and mobile heights are capped; desktop uses paired grid tracks and equal-height imagery.
- Colours and tokens: existing off-white canvas, white editorial surfaces, dark-grey ink, and yellow signal accent are unchanged.
- Image quality: original supplied editorial assets remain in use through `next/image`; no placeholder, SVG substitute, or CSS illustration was introduced.
- Copy and content: question labels were replaced by thesis-led article headings, narrative sections, takeaways, implications, a recommended action, limitations, and public sources.
- Interactions: the featured article action and every article-card link remain navigable. Breadcrumbs and in-page section links are present on article pages.
- Console: no page-specific browser console error was observed during the final public-route checks.

## Findings

- No actionable P0, P1, or P2 findings remain.
- P3 follow-up: longer articles may eventually benefit from editorial preview and section reordering controls in the administrator, but this is not required for the current article workflow.

## Comparison history

1. Earlier P1: absolutely positioned images escaped zero-height containers and covered the landing content. Fix: restored a clean development runtime, made the image wrapper positioned and full width, and bounded responsive heights. Post-fix evidence: `/tmp/tnm-briefs-landing.png` and browser bounding-box checks show the image contained within its card.
2. Earlier P2: at tablet width the landing page placed the large image before the featured title and action. Fix: changed responsive order so editorial copy and the action precede the image below the desktop breakpoint. Post-fix evidence: the action is visible at y=748 in the 948 x 963 CSS viewport and the image begins at y=828.
3. Earlier P2: the detail hero image filled too much vertical space before the article began. Fix: capped the detail image at 260 to 300 pixels below desktop and retained the 420-pixel split hero at desktop. Post-fix evidence: the Bottom line section begins at y=904 in a 963-pixel-high viewport.

## Implementation checklist

- [x] Constrain landing featured image and preserve call-to-action visibility.
- [x] Build compact title-and-image article hero.
- [x] Replace question-led public structure with narrative article structure.
- [x] Replace question-form administration with article editing fields.
- [x] Verify desktop-responsive and mobile layouts.
- [x] Preserve public sources, related records, review status, and publication controls.

final result: passed

## Homepage full-bleed hero revision - 2026-07-27

### Comparison target

- Reference: `/var/folders/zy/qv3qyrkj13n26_6wv7xrdndm0000gn/T/codex-clipboard-6b746c90-7879-454c-a796-b06f3f633da9.png`
- Implementation: `output/hero-phase2-selected-1586-final-v4.png`
- Combined comparison: `output/hero-phase2-design-comparison-final.png`
- Comparison viewport: `1586 x 992` CSS pixels at device scale 1.
- State: signed out, homepage, current production-backed coverage count.

### Result

The implemented hero preserves the North Signal launch direction: full-bleed
maritime evidence imagery, a square North Ink editorial panel, Signal Yellow
emphasis, Barlow-led hierarchy, and restrained calls to action. The image and
panel have zero border radius and no card border or shadow.

Visible differences from the selected mockup are non-blocking:

- The implementation uses the approved production image asset and its natural
  crop rather than recreating the screenshot composition.
- The decorative line-and-dot flourish is omitted because it does not add
  meaning and is not a required brand asset.
- Existing feedback and search controls remain functional product surfaces
  rather than being restyled outside the selected hero scope.

No P0, P1, or P2 visual issue remains.

### Responsive verification

Verified at 390, 768, 1024, and 1440 pixel browser widths:

- No horizontal overflow.
- Zero-radius image and editorial panel at every breakpoint.
- An intentional responsive headline rhythm.
- Primary links remain present and point to `#ask-true-north` and `/demand`.
- Mobile presents the decision copy before the image without clipping.
- Desktop keeps the panel over the image in a stable 690-pixel hero frame.

### Loading and regression verification

- The static hero image remains priority-loaded with `sizes="100vw"`.
- The live organization count remains inside its own Suspense boundary.
- National map and search data remain inside the existing downstream Suspense
  boundary and do not block the hero shell.
- Existing map, search, analytics, authentication, and publication contracts
  were not changed.
- Browser console errors: none.
- Targeted hero and public-copy tests: 14 passed.
- Full unit and integration suite: 181 passed.
- Lint: passed.
- Production build: passed.

final result: passed
