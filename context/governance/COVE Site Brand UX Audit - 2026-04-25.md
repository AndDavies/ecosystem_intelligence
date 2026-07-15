# COVE Site Brand UX Audit - 2026-04-25

Source audited: https://coveocean.com/

Screenshots captured:

- `output/playwright/cove-home-desktop.png`
- `output/playwright/cove-home-mobile.png`

## Executive Summary

COVE presents itself as a high-trust marine innovation hub rather than a generic business accelerator. The site combines a dark, cinematic ocean-tech identity with practical program navigation for companies, researchers, public-sector partners, students, and ecosystem stakeholders.

The brand system is restrained: mostly black, white, deep charcoal, ocean blue, cyan highlights, large marine/technology imagery, square grids, thin white rules, and bold geometric typography. The UI avoids decorative card softness. It feels institutional, technical, and sector-specific.

## Business And Positioning

COVE is positioned as both a shared physical space and a collaborative marine technology community. The home page describes it as a place where ideas become solutions, technologies become ventures, and opportunities become careers.

Core business functions:

- Physical innovation hub and waterfront facility in Dartmouth, Nova Scotia.
- Marine technology commercialization support.
- On-shore and off-shore testing infrastructure.
- Community-building across members, collaborators, investors, researchers, employers, technicians, and mentors.
- Program orchestration across testing, acceleration, research commercialization, talent, insights, and international/regional hub development.
- Reports, insights, events, newsletters, and community visibility.

Primary audiences:

- Start-ups commercializing marine technology.
- SMEs building sustainable marine solutions.
- Multinationals seeking supply chain, marine R&D, and business-development access.
- Research institutes needing shared infrastructure and industry/government access.
- Students, educators, and future marine-sector workers.
- Defence, dual-use, ocean technology, and maritime-security stakeholders.

Offer architecture:

- Test + Validate: Digital Labs, SmartATLANTIC, Stella Maris Testing Solution.
- Incubate + Accelerate: accelerators, industry challenges, Indigenous ocean-business connection programs.
- Research + Commercialize: DeepSense, MORI, SEATAC.
- Hub + Spoke: regional, national, and international satellite hub relationships.
- Work + Learn: internships, Ocean Institute, education workshops.
- Reports + Insights: research and reports for marine-sector growth.

## Color Palette

### Core Tokens From CSS

| Role | Hex | Usage |
|---|---:|---|
| White | `#ffffff` | Primary text, rules, borders, logo in dark contexts |
| Black | `#000000` | Hero/news/sub-footer backgrounds, overlays |
| Dark Grey | `#1d1d1d` | Body background, footer, community logo cells |
| Grey | `#707070` | Secondary hover text, fallback program background |
| Light Grey | `#efefef` | Light content blocks |
| Soft Grey | `#f9f9f9` | Alternate light section background |
| Ocean Blue | `#124a5c` | Brand blue, selection color, mobile nav gradient end |
| Cyan Focus | `#228aac` | Focus outline |
| Bright Marine Blue | `#2393b7` | Mobile menu gradient start |
| Submit Blue | `#77c2ec` | Newsletter submit button computed style |
| Deep Indigo | `#2D3360` | Flexible purple background utility |
| Very Dark Ocean | `#05161b` | Overlay background utility |
| Placeholder Grey | `#767676` | Search placeholder |
| Dot White Alpha | `#ffffff52` | Slick carousel inactive dots |

Important note: the CSS defines `--purple` as `#124a5c`, so "purple" is functionally the same as the ocean blue token in the active theme.

### Palette Character

The live visual system is a near-monochrome dark interface with ocean blue as a restrained accent rather than a loud brand field. Most contrast comes from:

- White type on black/charcoal.
- Thin white dividers and borders.
- Marine imagery darkened by opacity overlays.
- Cyan/blue data-wave hero imagery.
- White logo marks and partner logos in dark sections.

The palette does not rely on gradients except the mobile navigation overlay, which uses:

```css
linear-gradient(to bottom, #2393b7 0%, #124a5c 100%)
```

## Typography

Fonts are loaded from Google Fonts:

- Headings: `Montserrat`, fallback `Arial`, `serif` in CSS token.
- Body text: `Open Sans`, fallback `Arial`, `sans-serif`.
- Icons: `Font Awesome 6 Pro`.

Imported font weights:

- Montserrat: `400`, `500`, `600`, `700`.
- Open Sans: `300`, `400`, `600`, `700`.

### Type Scale

| Element | Family | Size | Weight | Line Height | Letter Spacing | Notes |
|---|---|---:|---:|---:|---:|---|
| Body | Open Sans | `20px` | `400` | `1.6` / `32px` | normal | Large, readable editorial base |
| H1 default | Montserrat | `46px` | `600` | `1.1` | `2px` | Large institutional display |
| Home hero H1 | Montserrat | `46px` | `500` | `1.3` | `2px` | Centered, calmer than default heading |
| H2 default | Montserrat | `40px` | `600` | `1.1` | `1px` | Section heading |
| Home news H2 | Montserrat | `38px` | `600` | `1.1` | `1px` | Carousel headline |
| Interior hero H1 | Montserrat | `42px` | default heading weight | `1.1` | inherited | Over image hero |
| Interior hero H2 | Montserrat | `28px` | `400` | `1.6` | inherited | Long descriptive subtitle |
| H3 | Montserrat | `30px` | `600` | `1.2` | default | Card/module headings |
| H4 | Montserrat | `24px` | `600` | `1.2` | default | Uppercase |
| Nav | Open Sans | `18px` | `700` | `1.1` | `1px` | Desktop primary nav |
| Dropdown nav | Open Sans | `13px` | `700` | `1.1` | `1px` | Compact black dropdown |
| Eyebrow/category | Open Sans | `13px-16px` | `600` | `1.2` | `2px-3px` | Uppercase labels |
| Button/link CTA | Open Sans | `14px` desktop, `16px` tablet | `400` | `1.2` | `1px` | Text link plus icon |

Responsive behavior:

- H2 drops to `26px` below `1200px`.
- Hero H1 drops to `40px` below `1200px`.
- Body content drops to `16px` below `1200px`.
- Mobile menu nav becomes very large, `2.2rem`, then `1.4rem` below `486px`.

## Layout And Spacing

Primary layout container:

- Max width: `1640px`.
- Desktop side padding: `10px`, then `30px` below `1366px`, `40px` below `1200px`, `20px` below `580px`.

Section rhythm:

- Many `.main` sections use `padding: 100px 0`.
- Home testimonials use `160px 0`, dropping to `90px 0` on smaller screens.
- Content/video blocks use large vertical spacing and full-width bands rather than nested cards.

Layout patterns:

- Full-viewport hero.
- Black news ticker/slider directly under hero.
- Full-width editorial sections.
- Two-column content grids.
- Square logo grids.
- Image-backed bands with dark overlays.
- News grid with one larger feature item and smaller repeated story rows.
- Footer split into contact/resources/connect/logo zones.

## UI Components

### Header And Navigation

Desktop header:

- Absolute positioned over hero.
- Padding: `80px 0` on desktop, `40px 0` default.
- Logo width: `203px` desktop, `132px` below `1200px`.
- Header grid: logo column plus nav column.
- Primary nav is white, bold, spaced, and minimal.
- Hover state adds a thin white underline below top-level items.

Dropdowns:

- Black dropdown background.
- `6px` padding.
- Subnav item size: `13px`, bold, white.
- Hover background: dark grey.

Mobile menu:

- Full-screen overlay.
- Slides in from off-canvas left.
- Gradient background from bright marine blue to ocean blue.
- Large centered navigation.
- Separate back and close controls using Font Awesome.

### Buttons And Links

COVE's primary CTA style is not a filled button. It is a text link with an icon:

- Display: inline/flex.
- Font: Open Sans.
- Size: `14px`.
- Weight: `400`.
- Color: white on dark, black on light.
- Padding: `5px 0`.
- No border, no filled background, no radius.
- Adds Font Awesome circle-arrow icon via `:after`.
- Hover shifts text toward grey and nudges the icon from `10px` to `14px` left margin.

The newsletter submit is the exception:

- Pill style.
- Computed color: `#77c2ec`.
- Radius: `40px`.
- White/blue treatment inside dark footer form.

### Cards And Content Blocks

The site rarely uses soft cards. It uses squared, high-contrast blocks:

- News feature card: black background, `2px` white border, `3:2` aspect ratio, image overlay at `0.5` opacity.
- News list items: image left, text right, top/bottom white rules.
- Community logos: square cells, dark background, white borders, logo centered with `object-fit: contain`.
- Hover on logo cells flips to white with `mix-blend-mode: difference`.
- Image/content modules: two-column split with image occupying 50% and text panel using `80px 50px` padding.

Border radius is essentially absent in the main brand UI except forms and circular icon controls. The design language is rectilinear and technical.

### Forms

Gravity Forms styling:

- Inputs are transparent.
- Border: `1px solid white`.
- Border radius: `28px`.
- Padding: `8px 22px`.
- Font size: `18px`, weight `300`.
- Placeholder: white on dark.
- Checkboxes are custom square controls with `2px` white border.
- Consent copy is small and light.

### Carousel And Controls

Slick carousel is used.

- Dots are circular, `14px`, inactive `#ffffff52`, active white.
- Previous/next controls are circular `50px` buttons with `2px` black border on light contexts.
- Home news slider uses large headlines, black background, top and bottom white border.

## Imagery And Motion

Imagery strategy:

- Full-bleed ocean/marine/technology imagery.
- Dark overlays for legibility and brand consistency.
- Hero video on desktop, static image fallback below `1024px`.
- Object-fit cover used heavily.
- Hero image object position: `100% 40%`.
- Program blocks use photographic backgrounds with a black overlay at `0.3` opacity.
- Interior hero images use `0.6` opacity.

Motion:

- Smooth scroll enabled.
- Transitions are short: `100ms`, `200ms`, `400ms`.
- Scroll reveal classes include slide-up, fade-in, blur-in.
- Slide-up begins at `top: 90px`, blurred and transparent, then resolves over `1s`.
- Reduced-motion media query sharply reduces animation duration.

## UX And Information Architecture

Top navigation:

- About COVE
- Programs + Services
- Community
- Events
- Contact
- Search

The site organizes around audience trust and ecosystem participation:

- "What is COVE?"
- "What can COVE help me do?"
- "Who is already in the community?"
- "What programs and assets are available?"
- "What news and reports prove activity?"
- "How do I contact or subscribe?"

The UX is strongest at communicating institutional credibility and ecosystem density. It uses partner logos, testimonials, programs, reports, news, and location/contact details as trust proof.

Primary conversion paths:

- Contact COVE.
- Subscribe to newsletter.
- Explore programs.
- See community/companies.
- Read news and reports.
- Attend events.

Search is present but visually secondary.

## Brand Translation Notes For Ecosystem Intelligence

Useful cues if borrowing from COVE:

- Keep a serious, high-trust dark foundation.
- Use restrained marine blue as an accent rather than washing the UI in blue.
- Prefer square panels, fine rules, and structured editorial grids over rounded SaaS cards.
- Use evidence surfaces like logos, categories, dates, news, reports, and testimonials to create credibility.
- Treat CTAs as quiet text actions with icon affordances, reserving filled pills for form submission or high-commitment actions.
- Let photography and real artifacts carry the brand, especially facilities, people, equipment, maps, reports, and operational outputs.

Risks to avoid:

- Too much black can reduce scanning efficiency in data-heavy app workflows.
- Large marketing typography should not be copied into dense intelligence tables.
- Purely image-led sections are excellent for brand but weak for analytical comparison.
- COVE's public-site minimal CTAs are elegant, but an operator workspace needs stronger active, selected, warning, and review states.

## Source Notes

- Home page: https://coveocean.com/
- About page: https://coveocean.com/about-cove/
- Programs page: https://coveocean.com/programs-services/
- Community page: https://coveocean.com/community/
- Reports page: https://coveocean.com/reports-insights/
- Theme CSS inspected:
  - `https://coveocean.com/wp-content/themes/cove2023/assets/css/style.css`
  - `https://coveocean.com/wp-content/themes/cove2023/assets/css/flexible-content.css`
  - `https://coveocean.com/wp-content/themes/cove2023/assets/css/navigation.css`
  - `https://coveocean.com/wp-content/themes/cove2023/assets/css/gform.css`
