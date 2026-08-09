# True North Map design QA record

## Organization dossier pilot-template refinement gate - 2026-08-09

### Visual truth and scope

- Approved structural reference: `/Users/andrewdavies/.codex/generated_images/019fe42f-bf09-72c3-8bed-dc0492dd341b/exec-89d62920-d8b6-457a-9fe3-d0d110d28dce.png`.
- Prior governed implementation comparison: `/Users/andrewdavies/.codex/visualizations/2026/08/09/019fe42f-bf09-72c3-8bed-dc0492dd341b/dossier-option2-vs-final-comparison.png`.
- Current local route: `http://127.0.0.1:3011/dev/dossier-preview`.
- Current state: rich deterministic dossier fixture with no approved logo or contextual image, two capabilities, Mission Area and Public Need relationships, dated activity, public record, questions, geography, sources, map pathways, and the final engagement handoff.

This pass preserves the approved section order, editorial hero, action hierarchy, and optional-image model. It adds the requested compact organization identity slot, equalizes the two desktop context panels without a fixed height, separates narrative Canadian-footprint copy from the fact list, removes the repeated hero entity type, makes reviewed relationships fully actionable, moves longer capability detail into a disclosure, and derives the section navigator only from content that renders. The final refinement makes the navigator and evidence-supporting areas as restrained and editorial as the central dossier.

### Conditional, interaction, and accessibility review

- The identity order is approved official logo, deterministic one- or two-letter monogram, then the shared neutral `Building2` mark. The preview exercises the initials branch without reserving an empty media column.
- `At a glance` is capped at six supported facts. Its Canadian-footprint value comes from structured Canadian locations; the full sourced footprint narrative remains in `What the organization does`.
- The section navigator is non-sticky and omitted when no optional report chapter renders beyond the always-available overview and next-step destinations. Rich mobile dossiers use one 44-pixel disclosure instead of a dominant multi-row block; desktop uses a slim Paper index with persistent editorial underlines and a Signal Yellow active state. Desktop links are left-aligned on one line with a fixed 16-pixel rhythm at 1024 pixels and 24 pixels on wider frames rather than being distributed by leftover viewport width. It contains no numbering, expansion symbols, filter tiles, or links to absent sections. Its labels are generated from the same predicates as the report sections.
- The report uses one tightened 28/32/40-pixel responsive section stack. Recent activity fills the report width on Signal Wash, while Connections, Capabilities, Programs and Relationships, Questions, Geography, Sources, and Related Intelligence use full-width Paper reading surfaces.
- Mission Area and Public Need rows use one full-row link with a visible continuation cue and focus outline. A sole relationship type spans the report; paired columns stretch from a shared grid and no longer expose mismatched bottom rules. Review dates are scoped as capability- or profile-level review dates rather than presented as match-level facts.
- Inline and directional links use persistent Signal Yellow underlines or an existing button treatment instead of relying on North Ink colour or hover alone.
- Capability rows show at most three decision-useful features. Applications and excess technical detail move into a native keyboard-operable disclosure.
- Questions are open numbered editorial rows; Geography is a compact contextual row; and the source ledger uses grouped, rule-separated rows with primary source identity visible and secondary associations in a disclosure.
- Related editorial and map destinations are descriptive rule-separated links rather than filter-like controls. Each group exposes no more than four destinations before a conditional disclosure.
- The organization-specific action section precedes Related Intelligence, which precedes North Signal.
- Long organization names can wrap anywhere, optional related-intelligence output and its loading placeholder collapse to `null`, and all dossier controls reviewed in this pass meet the 44-pixel target.
- Pure presentation tests cover sparse, each single-optional, and rich navigator output, initials behavior, and compact Canadian-footprint derivation. Source-contract assertions also lock the mobile disclosure, compact nowrap desktop index and breakpoint spacing, common report stack, Paper surfaces, full-width activity, conditional spans, compact source rows, bounded related links, final action order, and persistent link affordance.

### Local validation

- Focused dossier contract: 6 passed.
- Full Vitest suite under the pinned Node 24 runtime: 305 passed.
- Full ESLint: passed.
- TypeScript `--noEmit`: passed.
- Optimized Next.js production build: passed.
- Public launch validator at the production-release gate: 869 canonical pages checked, zero findings, zero recovered warnings, and zero duplicate titles. The reported 230 orphan candidates remain informational under the existing validator contract.
- Research validation: 422 artifacts, zero errors, and historical/advisory warnings only.
- Final local dossier preview: HTTP 200.
- Chrome responsive review completed at 1440, 1024, 768, and 390 CSS pixels. Every measured report surface aligned to the shared frame, `scrollWidth` equalled `clientWidth`, one H1 rendered, no duplicate IDs appeared, and every visible navigator anchor resolved to exactly one target.
- Desktop profile panels and the paired Mission Area/Public Need lanes aligned to equal top and bottom edges. Tablet and mobile layouts stacked without overflow. Recent activity, ordinary Paper surfaces, and the Field canvas resolved to their governed semantic colours.
- Desktop and mobile navigator activation updated the hash, moved focus to the target, placed the target 112 pixels below the viewport edge, and exposed exactly one visible `aria-current="location"`. The mobile disclosure opened with Enter and Space, closed after selection, and its focused anchor showed the governed Signal Yellow outline.
- The final spacing lock measured one shared top coordinate for every desktop anchor, `nowrap` layout, 16-pixel gaps at 1024 and 24-pixel gaps at 1440, equal 62-pixel navigator height, and no list or document overflow.
- In-session Chrome captures were reviewed at 1440 and 390 pixels. No relevant application console error or warning appeared; local Turnstile origin warnings were the only browser noise.
- Independent read-only review found two final P2 supporting-surface issues: repeated source-control accessible names and an editorial label on the organization-only related fallback. Both were corrected before the exact-final regression run; no P0 or P1 issue remained.
- Governance was synchronized after local QA. Production deployment, migration, publication, provider writes, and Git staging were not performed within this local design checkpoint.

### Remaining rollout gate

The shared template passes its local regression and browser gate. Before broad activation, it still needs the governed pilot matrix against canonical rich, sparse, non-company, no-logo, no-current-activity, and relationship-heavy records. That pilot is a production-release and reviewed-content checkpoint rather than a reason to add more template structure.

final result: passed

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

# Design QA — organization dossier editorial report amendment

## Visual truth and scope

- Structural reference: `/Users/andrewdavies/.codex/generated_images/019fe42f-bf09-72c3-8bed-dc0492dd341b/exec-89d62920-d8b6-457a-9fe3-d0d110d28dce.png`.
- Current implementation capture: `/Users/andrewdavies/.codex/visualizations/2026/08/09/019fe42f-bf09-72c3-8bed-dc0492dd341b/dossier-editorial-redesign-final-top.png`.
- Combined comparison input: `/Users/andrewdavies/.codex/visualizations/2026/08/09/019fe42f-bf09-72c3-8bed-dc0492dd341b/dossier-option2-vs-final-comparison.png`.
- Supporting production-route references: `/Users/andrewdavies/.codex/visualizations/2026/08/09/019fe42f-bf09-72c3-8bed-dc0492dd341b/comparable-signals-editorial-route.png` and `/Users/andrewdavies/.codex/visualizations/2026/08/09/019fe42f-bf09-72c3-8bed-dc0492dd341b/comparable-defence-brief-route.png`.
- Local route: `http://127.0.0.1:3011/dev/dossier-preview`.
- State: deterministic rich dossier fixture, signed out, neutral organization fallback mark, four source groups, one mission connection, one Public Need connection, public record, curated questions, geography, related pathways, and final contact handoff.

The selected option remains structural visual truth for the split report cover, prominent organization identity, and action hierarchy. The latest written amendment supersedes its dashboard strip, sticky section navigation, evidence ratings, source-status pills, and narrow content treatment. True North Map's Brand System and the existing Signals and Defence Brief routes govern colour, type, radii, report width, and section rhythm.

## Comparison normalization

- Implementation capture: 1265 × 720 pixels at 1× density from a 1280 × 720 CSS viewport with the scrollbar consuming 15 pixels.
- The reference was top-cropped and proportionally normalized to the same 1265 × 720 panel for the combined comparison. Both panels share one labelled 2554 × 776 comparison canvas.
- The invalid repeated full-page capture `dossier-editorial-redesign-first-pass-full.png` was explicitly excluded from final evidence.

## Final visual assessment

- The report now uses the shared 1480px Atlas frame instead of the dossier-only 1240px wrapper.
- The North Ink cover uses a 3 / 5 / 4 identity, narrative, and action grid from 1024px upward. The organization mark reserves 144px on mobile, 192px on tablet, and approximately 198–220px on desktop without cropping.
- Barlow carries the H1 and editorial headings; Inter carries narrative, facts, sources, and controls. Body copy remains 16–17px with 65–72ch reading measures.
- Signal Yellow is restricted to directional actions and emphasis. Editorial Blue and Signal Wash divide profile facts, Mission Areas, Public Needs, geography, and source-library movements.
- The page reads in a continuous report sequence: executive summary, why now, mission fit, capabilities, public record, conversation questions, geography, sources, related intelligence, and next conversation.
- Evidence strength and source-status furniture are absent. The underlying source library, source details, public-source caveat, dates, and public-record role language remain intact.
- Optional report sections no longer expose fixed chapter numbers, curated questions no longer create a misleading empty public-record section, and the no-static-map state no longer describes a map that is not present.
- The large North Signal continuation remains once, within the related-intelligence phase, before the final Working List and introduction conclusion as required by the dossier plan.

## Responsive and interaction review

- Static breakpoint review covered 390, 768, 1024, and wide desktop layouts. All fixed tracks use `minmax(0,…)` or stack before their safe breakpoint; long source, identifier, and map-pathway copy has explicit wrapping; actions wrap rather than compress.
- At 1024px, the cover remains a dense 3 / 5 / 4 report grid instead of dropping the action rail into a mostly empty second row.
- Exactly one H1 is rendered. Section heading order is valid, no CSS order utilities are used, and the dossier has no sticky or floating navigator.
- Working List remains first and 48px high; introduction remains secondary; Website, Share, and PDF use the 12px control radius and remain visually quiet.
- Share retains the Radix trigger and focus-restoration path; source details retain native keyboard-operable disclosures.
- Related intelligence now streams behind a local Suspense boundary so optional related reads do not delay the editorial cover.
- Chrome's extension connection was unavailable for a fresh exact-width final capture even though local installation checks passed. No alternate external browser was substituted. The final responsive conclusion therefore combines the prior governed breakpoint evidence, the current desktop comparison, the current HTTP-rendered route, and a fresh static Tailwind audit; exact Chrome responsive capture remains part of the later release review.

## Iteration history

1. Removed the sticky navigator, evidence-strength facts, source-backed labels, status pills, and the narrow nested wrapper identified in the user's amendment.
2. Rebuilt the page as a full-width editorial dossier with a report cover, executive snapshot, tonal narrative movements, grouped source appendix, and dark concluding handoff.
3. Corrected the 1024px cover density, removed breakable fixed chapter numbering, separated questions from the public-record facts condition, aligned all utility controls to the brand radius, and prevented duplicate profile copy when dedicated editorial context exists.
4. Added a compact no-map geography treatment, corrected geographic copy and alt text, omitted unknown review dates, added safe wrapping for long public strings, and streamed related intelligence below the primary report.

## Validation

- Focused dossier, language, architecture, analytics, and accessibility checks: 27 passed.
- Full Vitest suite under the pinned Node 24 runtime: 301 passed.
- Scoped and full ESLint: passed.
- TypeScript `--noEmit`: passed.
- Optimized Next.js production build: passed.
- Final local dossier preview: HTTP 200.
- Production deployment, migration, publication, provider writes, and governance updates: not performed in this local-only review phase.

No actionable P0, P1, or P2 visual, content, responsive, interaction, or accessibility finding remains within the approved local redesign scope. The neutral fallback preview proves reserved logo geometry but does not replace final real-logo review on the eight approved pilot records.

final result: passed

## Homepage compact split hero revision - 2026-07-28

### Comparison target

- Source visual truth: `/var/folders/zy/qv3qyrkj13n26_6wv7xrdndm0000gn/T/codex-clipboard-48011238-33e5-4d41-b24c-82aea21fb7fa.png`
- Browser implementation: `output/hero-option-1-1586-final.png`
- Combined comparison: `output/hero-option-1-comparison-final.png`
- Comparison viewport: `1586 x 992` CSS pixels at device scale 1.
- State: anonymous homepage using the current production-backed coverage count.

### Full-view and focused comparison

- The implementation preserves the source's Paper editorial panel, North Ink
  headline, Signal Yellow opening phrase, public-beta label, live count, paired
  actions, square-edged maritime image, and image caption.
- The implementation intentionally constrains the desktop hero to 480 pixels,
  placing Ask True North materially higher than the taller source mockup. This
  is the requested deviation and prevents the visual from pushing discovery
  farther down the page.
- The approved production image remains sharp, responsive, and uncropped by any
  rounded mask. No replacement artwork or decorative CSS drawing was added.
- Focused comparison was not required beyond the full-size combined image: the
  typography, controls, caption, and image treatment remain readable at the
  normalized 1586-pixel width.

### Findings and comparison history

1. P1: the first compact implementation clipped the live count and actions at
   the 1024-pixel breakpoint. Fixed with a wider tablet text track, a smaller
   tablet display size, and a responsive 55/45 split. Post-fix evidence:
   `output/hero-option-1-1024-final-v2.png`.
2. P2: the first 1440-pixel capture left insufficient space below the actions.
   Fixed by matching the source's approximately 45/55 desktop proportion so the
   headline returns to three lines. Post-fix evidence:
   `output/hero-option-1-1440-final-v3.png`.
3. No actionable P0, P1, or P2 finding remains.

### Responsive, interaction, and regression verification

- Verified at 390, 768, 1024, and 1440 requested pixel widths.
- No horizontal overflow at any required width.
- The 1024- and 1440-pixel heroes remain exactly 480 pixels high.
- Image corner radius is `0px` at every breakpoint.
- Primary actions remain linked to `#ask-true-north` and `/demand`.
- The static image remains priority-loaded while the live count and national
  dataset retain their separate Suspense boundaries.
- Browser console errors: none.
- Targeted tests: 14 passed.
- Full test suite: 181 passed.
- Lint: passed.
- Production build: passed.

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

# Guided Landing Page Design QA

## Source of visual truth

The approved consecutive landing-page frames established section order,
narrative hierarchy and component relationships during local review. They were
reference material rather than tracked production assets or a pixel-perfect,
fixed-height specification. The implementation and the canonical brand contract
are now the repository sources of truth.

## Implementation evidence

- Local route: `http://localhost:3014/`
- Atlas route: `http://localhost:3014/map`
- Desktop landing capture: `/tmp/tnm-guided-landing-top.png`
- Worked-example capture: `/tmp/tnm-guided-landing-flow.png`
- Responsive captures: `/tmp/tnm-landing-390-cdp-final.png`, `/tmp/tnm-landing-768.png`, `/tmp/tnm-landing-1024.png`, `/tmp/tnm-landing-1440.png`

## Comparison review

- The landing page preserves the approved three-act sequence while allowing the page to scroll naturally.
- The hero keeps one obvious yellow primary action, one secondary map action and one contextual explanation link.
- Coverage appears immediately after the hero and uses current production counts.
- The three job choices are separate from the hero and retain one action each.
- The dark worked example is visually distinct, readable without miniature copy and converts to a standard shareable `/map` state.
- The product specimen uses the published Kraken Robotics and KATFISH records and separates fact, assessment and gap states.
- Mission Areas, Defence Briefs, North Signal, contribution, founder context and four FAQs remain separate sections with clear purposes.
- Signal Yellow remains directional rather than decorative.

## Responsive and interaction review

Chrome device-metric review covered 390, 768, 1024 and 1440 pixels. At every width:

- document horizontal overflow: false;
- body copy base size: 16px;
- primary action height: 48px;
- mobile navigation replaces desktop navigation below the desktop breakpoint;
- the hero, job choices, worked example and product specimen stack without shrinking explanatory copy.

The in-app browser also verified:

- the brand logo returns to `/` and Map links to `/map`;
- the guided example changes `/map?example=modular-naval` into `/map?q=modular+naval+systems` after the ordinary atlas state loads;
- the example displays in the normal Ask True North field without calling the discovery endpoint or using normal question quota;
- no application error appeared in the browser console;
- the four FAQ controls use native keyboard-operable disclosure elements;
- legacy root atlas parameters redirect to `/map` while campaign-only landing parameters remain on `/`.

## Iterations completed

1. Moved middleware into the active `src/` application tree after live QA showed that legacy query redirects were not executing.
2. Reduced the mobile headline floor and made it safely breakable.
3. Separated the Public Beta label from the eyebrow so neither becomes compressed on mobile.
4. Reduced mobile hero padding so the coverage strip begins within the first 844-pixel viewport.
5. Restarted the local development server after production-build validation to clear the expected Next.js dev/build manifest collision.

## Validation

- `pnpm test`: 248 tests passed.
- `pnpm lint`: passed.
- `pnpm scale:validate`: passed with 5,000 markers.
- `pnpm build`: passed; `/` is static and `/map` is dynamic.
- `pnpm launch:validate`: 790 production pages, zero findings, zero warnings and zero orphan candidates.
- `pnpm release:validate`: passed, including production dependency audit with no known vulnerabilities.

final result: passed

# Design QA — organization dossier option 2 (superseded record)

## Visual truth

- Selected reference: `/Users/andrewdavies/.codex/generated_images/019fe42f-bf09-72c3-8bed-dc0492dd341b/exec-89d62920-d8b6-457a-9fe3-d0d110d28dce.png`
- Reference dimensions: 1487 × 1058 pixels.
- Final implementation capture: `/Users/andrewdavies/.codex/visualizations/2026/08/09/019fe42f-bf09-72c3-8bed-dc0492dd341b/dossier-brand-redesign-1487x1058-final.png`
- Same-size comparison input: `/Users/andrewdavies/.codex/visualizations/2026/08/09/019fe42f-bf09-72c3-8bed-dc0492dd341b/dossier-reference-vs-brand-final.png`
- State: deterministic local development dossier with the neutral organization fallback mark, reviewed connections, public record, sources, related pathways, and contact handoff rendered.
- Pixel density: 1× browser capture.

The reference is structural visual truth, not a copy or evidence contract. The implementation preserves its split cover, prominent identity field, decision strip, sticky navigator, and strong action hierarchy while replacing the mock's unsupported copy, invented evidence states, off-brand green-black gradient, and pill-heavy controls with the canonical True North Map brand and dossier plan.

## Responsive evidence

| Viewport | Evidence | Result |
| --- | --- | --- |
| 390 × 844 | `dossier-brand-redesign-390x844-final.png` | One column, 112px identity mark, one H1, primary action in the first fold, 70px sticky offset, no page overflow. |
| 768 × 1024 | `dossier-brand-redesign-768x1024-final.png` | Logo and narrative share the upper grid, decision cells stack, actions remain 48px high, no page overflow. |
| 1024 × 768 | `dossier-brand-redesign-1024x768-final.png` | Compact two-row hero, 214px identity field, primary action visible, no premature 12-column squeeze or page overflow. |
| 1487 × 1058 | `dossier-brand-redesign-1487x1058-final.png` | Full 2/6/4 cover, 176px square identity field, nine valid navigation targets, readable first fold, no page overflow. |

## Interaction and accessibility evidence

- Exactly one H1; Barlow is limited to the H1 and major editorial headings, while Inter carries narrative, evidence, controls, and navigation.
- Every navigator link resolves to a rendered section. The active item uses a Paper state with a Signal Yellow underline, and the navigator remains below the 70/76px global header.
- Pointer section navigation does not leave a decorative Signal Yellow outline around the full card. Keyboard activation moves focus to the labelled section heading.
- Share options move focus into the dialog; Escape closes it and returns focus to the Share trigger.
- Native source disclosures open with keyboard input.
- Primary and secondary dossier actions are 48px high; quiet Share/PDF controls are 44px high.
- Static geography imagery remains lazy and the organization identity image alone is priority loaded.
- The only browser warning was the existing Cloudflare Turnstile localhost-domain warning from the shared North Signal form. It did not affect dossier rendering or interaction. Production/browser-provider verification remains part of the later release pass.
- The in-app Browser did not expose a working browser-zoom control, so a literal 200% zoom pass was not available. Text wrapping and reflow were instead checked at all four governed responsive widths, including the equivalent 768px content pressure point.

## Iteration history

1. Pass 1 retained the selected structure but exposed an 849px-high hero at 1024px, incomplete section navigation, decorative use of Evidence Green, and fixture-heavy preview copy.
2. Pass 2 introduced the compact tablet/1024 composition, square responsive identity field, complete rendered-section navigator, neutral fallback treatment, canonical copy roles, and larger quiet controls.
3. Pass 3 corrected pointer-versus-keyboard target focus, bottom-of-page active navigation, Share-dialog focus restoration, and preview prose. The final same-size comparison confirmed the intended structural fidelity and brand-governed differences.

## Final assessment

No P0, P1, or P2 visual, responsive, interaction, content, or accessibility findings remain within the redesign scope.

final result: passed

# Organization dossier QA status — current

The authoritative current review is **Organization dossier pilot-template refinement gate - 2026-08-09** at the top of this file. The option 2 and editorial-report sections above are retained as iteration history only; their sticky-navigation, evidence-status, and earlier responsive-layout claims were superseded by the user's later refinements.

final result: passed
