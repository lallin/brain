# Page Topology — boilerlab.ai (`/`)

## Engine
Site is a full-screen slide deck using reveal.js-style DOM conventions (`.reveal-viewport > .reveal > .slides > section`, `.backgrounds`, `.progress`, `.slide-number`, `<aside class="controls">` with `navigate-left/right/up/down`, `.speaker-notes`, `.pause-overlay`, `.aria-status`) BUT the actual slide-transition CSS is bespoke (`slide-in-fwd-center`, `slide-out-fwd-center`, `slide-in-bottom/top`, `slide-in-fade`), not reveal.js's built-in transition styles. Treat reveal.js as the navigation/state engine (indexing, keyboard/wheel/touch capture, progress bar, slide counter) and layer the site's own exact transition CSS/keyframes on top (see `SOURCE_CUSTOM_CSS.css`).

Full page is exactly one viewport tall (`html,body{overflow:hidden}`, `100dvh`) — there is no normal document scroll. "Scrolling" (mouse wheel / trackpad / swipe) advances the slide index instead.

## Layers (z-index, back to front)
1. `#star-canvas` — fixed, full-viewport 2D canvas starfield (z-index 0), `position:fixed; pointer-events:none`. Persists across all slides; fades in/out (`.stars-hidden`) around slide 4/6/7 transitions (contacts, in-press, products don't use the starfield background the same way — see per-slide notes).
2. `.reveal` (z-index 1) — the slides container.
3. `.site-header` / `.site-footer` (z-index 20) — fixed overlays, always visible, contain the logo, sound toggle, and footer nav.

## Slides (8 DOM sections, 6 "topics" — footer nav has 6 items)
| # | id | data-section-id | Footer label | Notes |
|---|----|-----------------|---------------|-------|
| 0 | `mission` | — | MISSION | Hero: `h1.eyebrow` "AI startups at<br>rocket speed", subtitle, "Scroll down to explore" hint |
| 1 | `numbers` (class `mission-slide`) | numbers | NUMBERS | Typewriter paragraph: mission statement, then "We're Boiler Lab." |
| 2 | (no id) | numbers | NUMBERS | Stat: "20+ million users" / "of our products worldwide" |
| 3 | (no id) | numbers | NUMBERS | Stat: "Grew 2 Products to" / "1+ million MAU" / "in 1 year" |
| 4 | `partners` | — | PARTNERS | "Became / Essential on AI market / Grew B2B Ecosystem Product" + auto-scrolling partner-logo marquee inside an expanding bordered frame (corner nodes) |
| 5 | `products` (class `product-slide`) | — | PRODUCTS | 9 product cards, desktop: absolutely-positioned 3D stack, internal scroll changes focused card (see BEHAVIORS.md); mobile ≤820px: plain vertical stacked list, no 3D/scroll-jack |
| 6 | `in-press` (class `in-press-slide`) | — | IN PRESS | 7 floating/orbiting tweet-style cards around centered "Press about our products" title, gentle float animation |
| 7 | `contacts` (class `contacts-slide`) | — | CONTACTS | CTA "Let's fly to the Moon together" + "Contact us" mailto button + typewriter-revealed address, with a large rotating moon image rising from the bottom on first arrival |

Footer nav shows 6 pill-style links (Mission/Numbers/Partners/Products/In Press/Contacts) joined by thin connector lines; the active one enlarges (font-size grows via clamp, letter rises via `translateY(-0.42em)`), others stay dim (`color:#dde1ecad`).

## Fixed Chrome
- **Header**: centered logo (`boiler-lab-logo.svg`, 13.75rem wide desktop / 8.25rem mobile) linking to `/`; absolutely-positioned "Sound: OFF/ON" toggle pill top-left (icon-only on mobile).
- **Footer**: nav grid (`grid-template-columns: repeat(5, minmax(0,1fr)) auto` desktop; horizontal scroll flex row on mobile ≤760px).

## Responsive Breakpoints Observed
- 1440px → down to ~1180px: fluid `font-size:calc(-0.0022rem + 1.1136vw)` root scaling (locked at 1440px value above that).
- 991px / 767px / 479px: root font-size pinned to 1rem (fluid scaling stops).
- 1180px: product-card alignment tweak.
- 1000px: product card/copy density tightens (smaller heading/gap/padding).
- 820px: products slide flips from absolute 3D stack to plain scrollable stacked list.
- 760px: header/footer/hero/typography/partners/contacts mobile overrides kick in broadly (see `SOURCE_CUSTOM_CSS.css` `@media(width<=760px)` blocks).

## Dependencies
- Footer/header are always-on overlays above every slide.
- `#star-canvas` is shared across slides (single global starfield), not per-slide.
- Products slide's internal card-stack transform math (translate3d Y-offset + scale + opacity + blur) is JS-driven per current scroll offset within that slide — captured via computed inline styles in `components/products-slide.spec.md`.
