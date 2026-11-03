# NOVA design system

> Status: **draft v2, waiting for approval** (prompt 0A, step 2). Nothing in `src/` or `admin/` has been changed yet.
> Once approved, this file is the source of truth for every page. It overrides the "orange-500 / gray-950 /
> rounded-2xl" rules in CLAUDE.md.
>
> **What changed in v2 (3 Nov 2026).** The feedback on v1 asked for "more interesting animation that attracts every
> visitor" and "an attractive colour theme". So:
> - The brand layer is now a **night sky with a living nova glow**: hero, deals band, footer and the order-placed screen.
>   Shopping pages stay light.
> - The palette gains **aurora violet** and a **nova gradient** (pink core, marigold halo, violet edge) that is used only
>   for light and celebration, never as a section background.
> - Motion goes from "one moment, everything else calm" to **four tiers** (signature, ambient, scroll, interaction)
>   with a strict performance budget, so it stays fast on mid-range phones.
> - The open questions are settled in [section 12](#12-decisions).

Contents: [Audit](#1-audit-what-the-site-looks-like-today) · [Concept](#2-concept-lights-on) ·
[Colour](#3-colour) · [Type](#4-type) · [Layout](#5-layout) · [Wireframes](#6-wireframes) ·
[Components](#7-components) · [Motion](#8-motion) · [Copy](#9-copy) · [Quality bar](#10-quality-bar) ·
[Self-review](#11-self-review-what-was-generic-and-what-changed) · [Decisions](#12-decisions)

**Visual preview:** `docs/design-preview.html` is a working sketch of v2: the nova-burst intro, the swipeable deck,
the category marquee, filter reflow, card tilt, favourite sparks, add-to-cart flare, the mini cart with its
free-delivery meter, the deals countdown, coupon feedback and the order-placed celebration. **Double-click the file to
open it in your browser.** No server is needed: it uses the bundled demo catalogue, and your API's products when the API
is running and the page is opened through Vite (<http://localhost:5173/docs/design-preview.html>). It's a throwaway
sketch in plain HTML, not app code.

Before screenshots for every route (1366px full page, and 390px as one image per page, screen by screen) are in
`docs/screenshots/before/`. That folder is git-ignored. Regenerate it locally when needed.

---

## 1. Audit: what the site looks like today

### Across every page

| Problem | Where it shows |
| --- | --- |
| **It reads as Daraz.** Orange accent on a warm cream background (`#faf9f6`) with black pill buttons is the look of Pakistan's biggest marketplace, and it's on the "avoid" list. | Everywhere |
| **One shape for everything.** 205 `rounded-full`, 96 `rounded-2xl`, 46 `rounded-3xl`. Every card is white with a border and a soft shadow, so nothing has more weight than anything else. | Cards, buttons, inputs, chips |
| **Labels shout.** 119 uppercase/tracking-wide uses: an orange ALL-CAPS label above nearly every heading ("OUR COLLECTION", "SUPPORT", "HELP CENTRE", "CURATED COLLECTIONS"). | Every page header |
| **The same page header on every page:** grey band, eyebrow, H1, one-line subtitle. Templated, and it takes 220px before any content. | Shop, Categories, Cart, Checkout, Contact, FAQ, About, Track order |
| **Motion with no cause.** Things move with nobody touching them: floating badges, pulsing glow, shifting gradients, the marquee ticker, a shimmer sweep on buttons, fade-up on scroll. 51 gradient utilities. | Home mostly; `src/index.css` |
| **Two currency controls** (top bar "USD ($) \| Change" and navbar "USD ($)"). | Header |
| **Closed cart drawer leaks its shadow** onto the right edge of every page. The off-screen panel keeps `shadow-2xl`. | Right edge, all pages (desktop) |
| **The back-to-top button covers content on phones.** It sits over "Place order" on checkout and over product cards. | Mobile, all long pages |
| **Mobile footer is 2+ screens of links.** | Mobile, all pages |
| `CurrencySidebar` uses `animate-in fade-in slide-in-from-right` classes that don't exist (no plugin), so it just appears. | Currency drawer |

### Page by page

- **Home (mobile page is 13,450px tall, about 16 screens).** The hero is a stock photo with made-up stats (10K+ clients, 500+ products, 4.9 from 1,240 reviews), but the catalogue has 8 products. The same photo is reused on About. The headline colours one word ("Your **Style**."). The trust bar is four equal icon tiles. The categories section is 6 identical icon cards, each with a different badge ("TRENDING", "BEST SELLER", "POPULAR", "NEW", "HOT DEALS", "FEATURED") that means nothing, and three of the six categories are empty. The two promo banners are gradient cards. Flash sale and featured products are single-column lists on mobile.
- **Categories.** Stock Unsplash photos, not NOVA's products. Empty categories ("Coming soon") get the same big tile and a "Browse … Products" button as full ones. The bottom banner says "Unbeatable Prices On Top Categories".
- **Shop.** On mobile the grid is **one column**, so 8 products take 6 screens. The desktop filter sidebar is fine but generic. The sort is a native select. Category counts show "0" next to empty categories.
- **Product.** The rating shows **4.8 stars next to "0 reviews"** and "No reviews yet". The gallery is small on desktop. No sticky add-to-cart on mobile; the button scrolls away. The reviews block repeats the "No reviews yet" message twice.
- **Cart / mini cart.** Solid, but the table layout is desktop-first and the free-shipping bar is a gradient. On mobile, checkout is far below the fold.
- **Checkout.** One long form. On mobile the order total and "Place order" are on screen 3, and the back-to-top button overlaps them. "Order Summary (1 items)". Read-only name and email fields take up space as disabled inputs.
- **Account.** Three stat cards stack to fill a whole phone screen before the tabs. The tabs overflow and get cut off ("Security & Pa…"). "VERIFIED MEMBER" is decoration.
- **Login / Register.** The side panel quotes a testimonial that isn't real ("Sophie V."). "Forgot password?" appears twice. The Google and Apple buttons are simulated: they only show a toast. "256-Bit SSL Encrypted" is marketing filler.
- **Track order, Contact, FAQ, About, Legal.** Clean but templated: grey band, cards with icons, arrows on links. The FAQ accordion opens with no height animation.
- **404.** A gradient "404" on a radial glow. Friendly copy, generic look.
- **Admin.** I could audit only the login screen in the browser (the admin password in `backend/.env` differs from the example default, and I didn't read it). From the code: a dark top bar plus horizontal tabs, three stat cards with uppercase labels and coloured icon squares, `rounded-3xl` panels, and a 2,918-line `Admin.tsx`. The login page has a "Fill Default Credentials" button, which should not ship to production (outside 0A scope; flagged for later).

---

## 2. Concept: "Lights on"

**A nova is a star that suddenly flares bright.** NOVA has two layers:

- **The brand layer is a night sky.** The hero, the deals band, the footer and the order-placed screen are deep indigo
  `night`, lit by a slowly breathing nova glow (pink core, marigold halo, violet edge), a few twinkling stars and
  faint light rays. This is the part people screenshot and share.
- **The shopping layer is light porcelain.** Product grids, product pages, cart, checkout and account stay calm and
  bright, so photos keep their true colours and text stays readable on a cheap phone in sunlight.

When a shopper does something, the store flares. The item you add flies into your bag and bursts, the heart you tap
sparks, the deck deals the next card, your order lands with confetti. The light is the brand, and the shopper turns
it on.

Why it fits NOVA:

- **The name explains the look and the motion.** Every reaction is a "flare", from a tiny one on a heart to a big
  burst on a placed order, and the glow behind the hero is literally a nova.
- **It's eye-catching without making shopping harder.** The drama lives in the brand layer and in reactions to taps;
  the places where people compare prices and fill in forms stay quiet.
- **It unifies a mixed catalogue.** Headphones shot on black, sneakers on white, a watch in moody brown: white cards on
  night, or photos multiplied onto a cool `well`, hold all of them together.
- **It leaves Daraz orange behind.** Young Pakistani shoppers see orange marketplaces all day. Hot pink, marigold and
  violet on deep indigo are festive (think wedding lights, bazaar signage and truck art, without borrowing any
  motifs), and no other store's checkout looks like it.
- **It's built for phones.** Big type at full width, a swipeable deck, a two-column grid, actions in the thumb zone,
  and motion that answers thumbs.

**Pink means "this gets you closer to owning it."** It's reserved for commerce actions (Add to cart, Checkout,
Place order), favourites, selection and focus. Everything else is ink. If pink appears anywhere else, it's a bug.
**The nova gradient means "something good just happened."** It appears only in the glow, the wordmark spark,
bursts, confetti and the free-delivery meter at 100%.

---

## 3. Colour

### Core tokens

| Token | Hex | Role |
| --- | --- | --- |
| `night` | `#130E33` | The brand layer: hero, deals band, footer, order-placed screen, announcement strip (`night-2`). |
| `porcelain` | `#F6F4FB` | The shopping layer's page background. Cool, faintly violet off-white, deliberately not cream. |
| `ink` | `#17132E` | Text and primary buttons on light surfaces. Night's softer twin, not pure black. |
| `flare` | `#D4167A` | The accent: commerce buttons, favourites, focus ring, selected state, the burst. |
| `marigold` | `#FFB21E` | Discount tags, "You save", the deal countdown, rating stars, the glow's halo. Always with `ink` text, never as text on light. |
| `aurora` | `#6A4BE0` | Supporting violet: "New" tags, the outer edge of the glow, info highlights. |

### Supporting tokens

| Token | Hex | Use |
| --- | --- | --- |
| `surface` | `#FFFFFF` | Sheets, drawers, modals, inputs, deck cards, the cart summary. |
| `muted` | `#5E5A73` | Secondary text, meta, placeholders on light surfaces. |
| `well` | `#ECEAF4` | Product image tiles and skeletons. Product photos use `mix-blend-mode: multiply`, so white photo backgrounds melt into the well and every tile reads as one set. |
| `line` | `#E4E1EE` | Hairline dividers and card edges (decorative only). |
| `line-strong` | `#8D89A3` | Input and control borders (≥ 3:1, meets WCAG 1.4.11). |
| `night-2` | `#221A52` | Raised surfaces on night: deal cards, the announcement strip. |
| `on-night-muted` | `#B7B0E0` | Secondary text on `night` / `night-2`. |
| `flare-press` | `#B3105F` | Hover/pressed accent, and pink **text** on tinted backgrounds. |
| `flare-tint` | `#FCE8F2` | Selected chip / selected swatch background, the "just added" cart line. |
| `flare-glow` | `#FF5CA8` | Pink on night: the buy button on night (with `night` text), badges, focus ring on night, bursts. |
| `marigold-tint` | `#FFF1D1` | Free-delivery unlocked, deal highlight backgrounds. |
| `aurora-glow` | `#A58BFF` | Violet on night: confetti, the glow's edge, icons on night. |

### The nova gradient

One gradient, used only for light: a radial glow behind the hero deck and the order-placed check, the wordmark spark,
bursts and confetti, and the free-delivery meter at 100%.

```css
--nova-glow: radial-gradient(closest-side,
  rgb(255 255 255 / .85), rgb(255 92 168 / .72) 38%, rgb(255 92 168 / .55) 52%,
  rgb(255 178 30 / .40) 63%, rgb(106 75 224 / .40) 74%, rgb(106 75 224 / .14) 86%, transparent 98%);
--nova-spark: linear-gradient(135deg, #FF5CA8, #FFB21E 55%, #A58BFF);
```

The glow is sized to about 2.75× the deck's width so its pink and marigold rings show around the cards. Faint light
rays (a `repeating-conic-gradient`, 11% white) turn slowly on top of it. It's never a section background, never
behind body text, and never on the shopping layer.

### Status

| Token | Text | Tint (bg) | Text on white | Text on tint |
| --- | --- | --- | --- | --- |
| `success` | `#0F7A4D` | `#E6F4EC` | 5.37 | 4.73 |
| `warning` | `#8A5600` | `#FFF1D1` | 6.16 | 5.50 |
| `error` | `#C42B1C` | `#FDECEA` | 5.66 | 4.95 |
| `info` | `#2453B8` | `#E8EEFB` | 6.99 | 6.01 |

Error and flare are both warm reds, so **an error is never colour alone**: it always has an `AlertCircle` icon and a
sentence saying what went wrong. Flare is a magenta-pink (hue ≈ 328°) and error is a red-orange (hue ≈ 5°).

### Contrast (WCAG 2.2, computed)

| Pair | Ratio | Verdict |
| --- | --- | --- |
| ink on porcelain / white | 16.47 / 17.96 | AAA |
| muted on porcelain / white / well | 6.04 / 6.59 / 5.54 | AA |
| flare on white / porcelain | 5.01 / 4.59 | AA (body text OK) |
| white on flare (button label) | 5.01 | AA |
| white on flare-press | 6.65 | AA |
| flare-press on flare-tint | 5.69 | AA |
| ink on marigold | 9.96 | AAA |
| white / on-night-muted on night | 18.45 / 9.05 | AAA |
| on-night-muted on night-2 | 7.70 | AAA |
| flare-glow / marigold / aurora-glow on night | 6.46 / 10.22 / 6.80 | AA+ |
| night on flare-glow (buy button on night) | 6.46 | AA |
| white on aurora ("New" tag) | 5.68 | AA |
| white on the glow's pink ring (worst case) | 6.75 | AA |
| line-strong vs porcelain (input border) | 3.09 | Passes 3:1 for UI |

**Don'ts:** flare text on `well` (4.21) or on `night` (3.69, use `flare-glow`); **white text on `flare-glow`**
(2.86, use `night` text); `on-night-muted` text over the glow's pink ring (3.31, keep secondary text outside the
glow's inner 60%); muted text on `night` (use `on-night-muted`).

---

## 4. Type

**One family, three widths: [Mona Sans](https://fonts.google.com/specimen/Mona+Sans)** (variable: weight 200–900,
width 75–125%). It's loaded once from Google Fonts, Latin subsets only, with `font-display: swap`.

Why: a nova *expands*, and Mona Sans stretches. **Expanded** headlines feel loud and poster-like. **Normal** width
reads cleanly in UI. **Semi-condensed** bold numbers look like price tags and fit long PKR prices
("Rs 22,280") in a narrow two-column card. One font file covers all three, so it's cheaper than two families.
It isn't the Inter / Poppins / Plus Jakarta default that most Pakistani stores use.

Codes (coupons, order numbers) use the same font semi-condensed with `tabular-nums` and `0.04em` tracking.
No monospace download.

| Role | Width (`font-stretch`) | Weight | Size (mobile → desktop) | Line height | Tracking |
| --- | --- | --- | --- | --- | --- |
| Display XL (hero only) | 125% | 800 | `clamp(2.5rem, 5.4vw + 0.5rem, 5.25rem)` 40 → 84px (shares the row with the deck on desktop) | 0.95 | -0.02em |
| Display L (page titles) | 125% | 760 | `clamp(2rem, 3vw + 1.25rem, 3.5rem)` 32 → 56px | 1.0 | -0.015em |
| H2 (section) | 112% | 700 | `clamp(1.375rem, 1.5vw + 1rem, 2rem)` 22 → 32px | 1.1 | -0.01em |
| H3 (card, panel) | 100% | 620 | 1rem → 1.0625rem | 1.3 | 0 |
| Body | 100% | 420 | 1rem (16px; never smaller for inputs) | 1.55 | 0 |
| Small | 100% | 420 | 0.875rem | 1.5 | 0 |
| Micro (meta, legal) | 100% | 500 | 0.75rem (minimum anywhere) | 1.4 | 0.005em |
| Label (form, filter) | 87.5% | 600 | 0.8125rem | 1.3 | 0.01em, sentence case |
| Price | 87.5% | 720 | card 1.0625rem · PDP 2rem · totals 1.5rem | 1.0 | -0.01em, `tabular-nums` |
| Code | 87.5% | 700 | 0.875rem | 1.2 | 0.04em, `tabular-nums` |
| Button | 100% | 620 | 0.9375rem | 1 | 0 |

Rules: sentence case everywhere (no ALL-CAPS labels; codes like `WELCOME10` are already uppercase).
Headlines are one colour. Max line length 68ch for body.

---

## 5. Layout

### Grid and spacing

- **Base unit 4px.** Spacing steps: 4, 8, 12, 16, 24, 32, 48, 64, 96. Use Tailwind's default spacing scale
  limited to `1 2 3 4 6 8 12 16 24`.
- **Container** max 1280px. Gutters: 16px under 640px, 24px to 1023px, 40px from 1024px.
- **Columns:** 4 (mobile) / 8 (≥640) / 12 (≥1024). Gaps: 12px mobile, 16px tablet, 24px desktop.
- **Product grids:** 2 columns on phones (from 360px), 3 at ≥768, 4 at ≥1280. Never one column.
- **Section rhythm:** 48px between sections on mobile, 96px on desktop. Page titles get 32px top padding, no band.
- **Thumb zone:** on phones, the main action of a page sits in a sticky bottom bar
  (product: Add to cart · shop: Filters + Sort · cart: Checkout · checkout: Place order).
- Minimum hit area 44×44px.

### Radius: four levels, by hierarchy

| Token | Value | Used for |
| --- | --- | --- |
| `radius-tag` | 4px | Discount tags, badges, code chips. Sharp, like a printed tag. |
| `radius-control` | 12px | Buttons, inputs, selects, quantity steppers, toasts. |
| `radius-tile` | 20px | Product image wells, category tiles, panels. |
| `radius-sheet` | 28px | Drawers, modals, bottom sheets (top corners only for bottom sheets). |
| `rounded-full` | | **Only** avatars, colour swatches, icon buttons and filter chips. |

### Elevation: flat page, lifted overlays

- **Level 0 (page):** no shadows. Panels are `surface` on `porcelain`, with a `line` hairline only where an edge is
  needed. Product cards have **no container at all**: an image well and text below it.
- **Level 1 (hover lift, desktop only):** `0 10px 24px -14px rgb(23 19 46 / .28)` + `translateY(-2px)` on product
  image wells under `@media (hover: hover)`.
- **Level 2 (overlays):** drawers, modals, popovers, toasts: `0 24px 64px -20px rgb(23 19 46 / .40)`.
  Overlays that are off-screen get **no shadow** (fixes the leak).
- **Deck cards on night** carry a deep static shadow (`0 30px 60px -22px rgb(0 0 0 / .65)`) so they float above the
  glow. Shadows are never animated; they move with the card's transform.
- Sticky bars get a `line` hairline, not a shadow. No `backdrop-blur` (expensive on mid-range phones).

---

## 6. Wireframes

### Home: mobile (390px)

```
┌──────────────────────────────────────┐
│   Free delivery over $100. COD.      │  night-2 strip, one static line, real threshold
├──────────────────────────────────────┤
│ NOVA✦                   ⌕   ♡   ⊡ 2 │  56px sticky. On night over the hero, surface after it
├▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓┤  ▓ = night, · = twinkling stars
│▓ Up to 30% off ·                    ▓│  Display XL. "30" is the real max discount and
│▓ the good stuff.                    ▓│  counts up during the intro
│▓ Swipe the deck for today's best    ▓│
│▓ deals, or browse all 20 products.  ▓│
│▓       ░░░┌──────────────┐░░░       ▓│  ░ = nova glow: pink core, marigold halo, violet
│▓    ░░┌──┤              ├──┐░░      ▓│  edge, slow light rays. Fanned deck of the 5 best
│▓    ░░│  │    photo     │  │░░  ·   ▓│  real deals. Swipe, tap, or ‹ › to deal.
│▓    ░░└──┤              ├──┘░░      ▓│  Cards bob gently; the deck tilts toward the
│▓       ░░░└──────────────┘░░░       ▓│  pointer on desktop
│▓            ‹  ● ○ ○ ○ ○  ›         ▓│
│▓ Accessories  [−30%]                ▓│  caption follows the top card
│▓ Classic Aviator Sunglasses         ▓│
│▓ $35.00  $50.00                     ▓│  price rolls when the card changes
│▓ [ Add to cart ━━━━ ] [ Shop all ]  ▓│  flare-glow buy button (night text) + outline
├──────────────────────────────────────┤
│ Fashion ✦ Footwear ✦ Accessories ✦ E │  category marquee in Display type. Drifts slowly,
├──────────────────────────────────────┤  speeds up and changes direction with scrolling
│ Shop by category          See all ›  │  snap shelf, real product photo per category +
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌──          │  live count. Tiles tilt and settle into place as
│ │photo│ │photo│ │photo│ │            │  they scroll in. Empty categories collapse into
│ Fashion Footw.  Access.              │  one "Coming soon: …" line underneath
│ 3 items 3 items 4 items              │
├──────────────────────────────────────┤
│ Shop all                Showing 8/20 │
│ (All 20)(Fashion 3)(Footwear 3)(…→   │  chips; the grid reflows with layout animation
│ ┌────────┐ ┌────────┐                │  2-col grid; cards stagger in once
│ │  well  │ │  well  │                │
│ └────────┘ └────────┘                │
├▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓┤
│▓ Deals end in      [0][0]:[3][4]:[5][8]▓│  night band, glow blooms when it scrolls in;
│▓ ┌────┐ ┌────┐ ┌──                  ▓│  marigold digits flip; deal cards (night-2)
│▓ └────┘ └────┘                      ▓│  slide in once
├──────────────────────────────────────┤
│ Codes for today                      │  coupon "tickets" with a perforated edge,
│ ┌ WELCOME10 ┊ 10% off first order ┐  │  tap to copy → mini flare + "Copied"
├──────────────────────────────────────┤
│ What shoppers said                   │  real featured reviews only (swipe row)
│ Recently viewed                      │  only if any
├▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓┤
│▓ NOVA✦   newsletter field           ▓│  night footer, link groups as accordions
│▓ ▸ Shop  ▸ Help  ▸ Legal            ▓│
└──────────────────────────────────────┘
```

### Home: desktop (1366px), hero only (the rest follows mobile in 12 columns)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ NOVA✦   Shop  Categories  Deals  Help        [⌕ Search products……………]   USD ▾  ♡  ⊡ 2 │
├▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓┤
│▓                                         │     ░░░░░░░┌────────────┐░░░░░░░           ▓│
│▓  Up to 30% off                          │   ░░░┌─────┤            ├─────┐░░░         ▓│
│▓  the good stuff.                        │  ░░┌─┤     │   photo    │     ├─┐░░        ▓│
│▓  (Display XL, cols 1–6)                 │  ░░│ │     │            │     │ │░░        ▓│
│▓  Swipe the deck for today's best deals… │  ░░└─┤     │            │     ├─┘░░        ▓│
│▓                                         │   ░░░└─────┤            ├─────┘░░░         ▓│
│▓  Accessories [−30%]                     │     ░░░░░░░└────────────┘░░░░░░░           ▓│
│▓  Classic Aviator Sunglasses             │            ‹  ● ○ ○ ○ ○  ›    (cols 7–12) ▓│
│▓  $35.00  $50.00                         │  deck + glow tilt toward the pointer          ▓│
│▓  [ Add to cart ]  [ Shop all ]          │  (max 12°/16°); buy button leans to cursor    ▓│
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Shop: mobile

```
┌──────────────────────────────────────┐
│ ☰   NOVA✦               ⌕   ♡   ⊡   │
├──────────────────────────────────────┤
│ Shop all                    8 items  │  Display L, no band
│ (All 8)(Fashion 3)(Accessories 4)(…→ │  category chips, horizontal scroll
├──────────────────────────────────────┤
│ ┌────────┐ ┌────────┐                │  2 columns, 12px gap
│ │ -30% ♡ │ │      ♡ │                │  one tag max, top-left
│ │  well  │ │  well  │                │
│ │ ●●○  + │ │ ●○   + │                │  colour dots + quick-add (44px target)
│ └────────┘ └────────┘                │
│ Sneakers Pro Gaming Headph…          │
│ $69.99 $99.99  $20.00                │
│ ★ 4.8 (12)                           │  only when reviews > 0
│            …                         │
│ [ Load more ]                        │
├──────────────────────────────────────┤
│ [ ⚟ Filters · 2 ]   [ Sort: Newest ▾]│  sticky bottom bar → bottom sheets
└──────────────────────────────────────┘
  Filters sheet: price slider with live "Show 6 products" button, rating, in stock, on sale, Reset
```

### Shop: desktop

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ Shop all                                                       8 products  Sort: Newest ▾│
│ (All 8) (Fashion 3) (Accessories 4) (Electronics 1) (On sale 6)  · Coming soon: Footwear…│
├───────────────┬────────────────────────────────────────────────────────────────────────┤
│ Price         │ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                       │
│ ●━━━━━━━━━●   │ │   well   │ │   well   │ │   well   │ │   well   │   4 columns ≥1280     │
│ $0      $800  │ │          │ │          │ │          │ │          │   (3 at 1024–1279)    │
│ Rating        │ └──────────┘ └──────────┘ └──────────┘ └──────────┘                       │
│ ○ 4★+  ○ 3★+  │  name          name          name          name                          │
│ ☐ In stock    │  price         price         price         price                         │
│ Reset filters │                       [ Load more ]                                     │
│ (sticky)      │                                                                         │
└───────────────┴────────────────────────────────────────────────────────────────────────┘
```

### Product: mobile

```
┌──────────────────────────────────────┐
│ ‹ Fashion                     ♡   ⤴  │  compact top bar on this page
├──────────────────────────────────────┤
│ ┌──────────────────────────────────┐ │  gallery 4:5, swipe, pinch/tap to zoom
│ │                                  │ │  shared-element morph from the card
│ │          product photo           │ │
│ │                                  │ │
│ └──────────────────────────────────┘ │
│              ● ○ ○                   │
│ Sneakers Pro                         │  Display L
│ No reviews yet · Be the first        │  or ★ 4.8 · 12 reviews (tap → reviews)
│ $69.99  $99.99   [You save $30]      │  marigold tag
│ Colour · Grey                        │
│ (◉ Grey 10) (● Black 10) (○ White 10)│  swatch chips with stock per colour
│ ✓ In stock · ships Fri 6 – Tue 10 Nov│
│ ↺ 30-day returns  ⛨ 1-year warranty │  one quiet line each, no cards
│ About this product …                 │
│ Reviews  ▇▇▇▇▇▇▇▆▂▁ (bars fill once) │
│ You may also like  → 2-col           │
│ Recently viewed                      │
├──────────────────────────────────────┤
│ [− 1 +]  [ Add to cart · $69.99 ━━ ] │  sticky bottom bar, appears once the main
└──────────────────────────────────────┘  button scrolls out of view
```

### Product: desktop

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ Home / Fashion / Sneakers Pro                                                          │
│ ┌──┐ ┌────────────────────────────────────┐   Sneakers Pro                (cols 8–12,   │
│ │th│ │                                    │   ★ 4.8 · 12 reviews           sticky)      │
│ ├──┤ │                                    │   $69.99  $99.99  [You save $30]             │
│ │th│ │        product photo (cols 2–7)     │   Colour · Grey  (◉)(●)(○)                   │
│ ├──┤ │        hover = zoom lens            │   [− 1 +] [ Add to cart ━━━━━━━━━ ]          │
│ │th│ │                                    │   [ Buy it now ]                             │
│ └──┘ └────────────────────────────────────┘   ✓ Ships Fri 6 – Tue 10 Nov · ↺ 30 days     │
│ Reviews (cols 1–5) · write a review (cols 7–12)                                        │
│ You may also like (4 columns)                                                          │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Components

Build these first (prompt 0A, step 3). Every page uses them; no one-off styling.

- **Wordmark:** `NOVA` in Mona Sans 125% / 800 with a small 4-point **spark ✦** filled with `--nova-spark`,
  replacing the orange dot. The spark is also the particle shape of the bursts, and it turns a quarter and flashes
  every time something is added to the bag.
- **Announcement strip:** 32px `night-2` strip, **one** static sentence chosen in priority order (active coupon →
  free-delivery threshold in the shopper's currency), short enough for one line at 360px. It doesn't scroll.
- **Navbar:** desktop: wordmark · Shop · Categories · Deals · Help · search field · currency · wishlist · cart.
  Mobile: menu · wordmark · search icon (opens a full-screen search sheet) · wishlist · cart. Login and account
  move into the menu or account icon. One currency control. Over the night hero the bar is `night` with white
  icons and `flare-glow` badges; once the hero has scrolled under it, a `surface` layer with a hairline fades in
  (opacity only) and icons turn `ink`. On pages without a night hero it starts as `surface`.
- **Buttons** (`radius-control`, height 48 mobile / 44 desktop, label weight 620):
  - `buy`: `flare` → `flare-press` on hover, white label. On night: `flare-glow` with a `night` label. Only for
    Add to cart, Checkout, Place order. On desktop the hero's buy button leans up to 10px toward the cursor.
  - `primary`: `ink`. Sign in, Send message, Track, Apply, Save.
  - `secondary`: `surface` + `line-strong` border, ink text. View cart, Continue shopping, Buy it now.
  - `ghost`: text only, underline on hover.
  - `danger`: `error` text + border. Remove, Cancel order.
  - No arrows on buttons. A trailing "›" appears only on links that navigate to a listing ("See all deals").
- **Inputs:** 48px, `surface`, 1px `line-strong`, `radius-control`, 16px text (prevents iOS zoom). Label above in
  Label style. Focus: 2px `flare` outline, 2px offset. Error: `error` border + icon + message below. Valid (after
  blur): small `success` check fades in at the right.
- **Chips:** filter/category chips are pills, 36px tall inside a 44px hit area. Selected chip: `flare-tint` background, `flare-press` text, with a check icon (so selection isn't colour-only).
- **Tags:** `radius-tag`, Micro size, weight 700. Discount `−30%` = `marigold` + `ink`. `New` = `aurora` + white. `Bestseller` =
  `ink` + white. `Sold out` = `surface` + `muted`. **One tag per card max** (priority: Sold out > discount > New >
  Bestseller).
- **Product card (no container):** a `well` tile at 4:5 with `radius-tile` and the photo multiplied onto it. Top-left: one tag. Top-right: favourite (44px). Bottom-left: colour dots. Bottom-right: quick-add `+` (adds directly
  if the product has one or no colours, otherwise opens Quick view to pick one). Below the tile: name (H3, 2 lines max), price row (Price style, old price `muted` struck through), and stars only when `reviewCount > 0`.
- **Price block:** current price, old price, and a "You save $30" marigold tag (PDP and cart only, not cards).
- **Coupon ticket:** `surface` panel with a perforated divider (`radial-gradient` notches; static, no animation),
  code in Code style, description, Copy button.
- **Cart drawer:** right sheet on desktop (420px), full-height sheet from the right on mobile, `radius-sheet` on
  the leading corners. Free-delivery meter at top, lines, sticky footer with total + `buy` Checkout + `secondary`
  View cart.
- **Quick view:** centered modal on desktop (`radius-sheet`), bottom sheet on mobile (drag down to close).
- **Toast:** `ink` panel, white text, status icon, `radius-control`. Bottom-center on mobile (above any sticky bar),
  top-right on desktop. 4s, swipe to dismiss, `role="status"`.
- **Skeletons:** `well` blocks with exactly the final dimensions (4:5 tile, two text lines, price line). One shimmer
  band moving via `transform`.
- **Empty states:** one sentence in H2, one sentence in body, one button, plus a real-products row where it helps
  ("Your cart is empty." → "Just added" 2×2). No illustrations.
- **Page title:** Display L + one body line in `muted`, left-aligned, no band, no eyebrow.
- **Footer:** `night`, wordmark, three link groups (accordions under 640px), newsletter field, legal row.
  No back-to-top button anywhere.
- **Nova glow:** a reusable `<NovaGlow>` (radial glow + slow light rays + optional stars) for the hero, the deals
  band, the order-placed screen and the auth side panel. Decorative, `aria-hidden`, pauses off screen.
- **Category marquee:** category names in Display type separated by sparks, between the hero and the shelf. Each
  name links to the shop filtered by that category. Drifts at 40px/s, speeds up with scroll velocity and follows
  scroll direction, slows to a quarter on hover. With reduced motion it's a static, horizontally scrollable row.
- **Deals band:** `night` band with the glow above it, marigold flip digits counting down to the sale's real end
  time, and `night-2` deal cards on a horizontal snap row (4 columns ≥1280).
- **Sign-in side panel (Login / Register):** night with the glow and a small live deck of real products instead of the
  invented testimonial. The **Google and Apple buttons stay visible**, restyled as `secondary` buttons with their
  marks. They keep today's behaviour (a toast), until real OAuth is added.

### Admin portal: "workspace"

Same tokens, calmer and denser:

- Body 14px, controls 40px, `radius-control` 10px, panels `radius-tile` 14px, no shadows, hairlines everywhere.
- Desktop: a 240px `night` sidebar (Overview, Orders, Products, Add product, Settings) with the active item marked by a sliding `flare-glow` bar. No glow or ambient motion in the admin. Mobile: top bar + menu sheet.
- Stats: one strip of 3–4 numbers (Price style) with a delta line. No icon squares, no uppercase labels.
- Tables: sticky header, zebra-free rows with hairlines, `tabular-nums`, right-aligned money, row hover `porcelain`.
- Status pills (`radius-tag`, tint + text): Pending = warning, Processing = info, Shipped = ink-on-`well`,
  Delivered = success, Cancelled = error. The colour changes with a 160ms cross-fade when the status changes.
- Charts: a single `ink` series with `flare` for the hovered bar. Bars grow once on first load.

---

## 8. Motion

Library: `motion` (`import { m } from "motion/react"`), wrapped in `<MotionConfig reducedMotion="user">` and
`<LazyMotion features={loadFeatures} strict>`, where `loadFeatures` dynamically imports `domMax` (needed for layout,
`layoutId` and drag). Only `transform` and `opacity` animate (one exception: SVG `stroke-dashoffset` on the 24–88px
checkmarks). Ambient loops are plain CSS keyframes, so they cost no JavaScript.

### Four tiers

v2 makes NOVA feel alive, not just reactive. Motion comes in four tiers, from loudest to quietest. Each tier has a
place it's allowed to live, so the shopping layer never gets busy.

| Tier | What it is | Where it may appear |
| --- | --- | --- |
| **1. Signature** | Big, orchestrated, once per trigger: `nova` (hero intro), `flare` (add to cart), `land` (order placed) | Hero, bag icon, order-placed screen |
| **2. Ambient** | Slow loops that make the night sky breathe: glow `breathe`, `rays` turning, `twinkle`, deck `bob` | **Brand layer only** (hero, deals band, order placed, auth panel), and paused off screen |
| **3. Scroll** | Motion tied to scrolling, never hijacking it: `drift` (marquee), `settle` (category tiles), `stagger` (grid, once), `bloom` (deals glow, once) | Home and the shop grid |
| **4. Interaction** | Direct answers to a tap, drag or hover: everything in the named-motions table | Everywhere |

### Timing

| Token | Value | For |
| --- | --- | --- |
| `instant` | 90ms | Press feedback |
| `quick` | 160ms | Hover, colour/tint changes, fades, exits |
| `base` | 240ms | Route change, tab content, accordion |
| `slow` | 420–600ms | Fly-to-cart path, deck deal, grid reflow |
| `signature` | ≤ 1.2s total | Hero intro, order placed (once each) |
| `ambient` | 3–90s loops | Twinkle 3–6s, bob 5.6–7.6s, breathe 7s, rays 90s per turn |

| Easing | Curve | For |
| --- | --- | --- |
| `out` | `cubic-bezier(0.22, 1, 0.36, 1)` | Everything entering |
| `in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` | Things travelling (fly-to-cart, horizontal leg) |
| `in` | `cubic-bezier(0.55, 0, 1, 0.45)` | Things leaving (exits are ~30% faster than entrances) |
| `pop` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Small things that land: badges, hearts, cards bursting out of the nova |

| Spring | `stiffness / damping` | For |
| --- | --- | --- |
| `snappy` | 520 / 34 | Buttons, chips, toggles: no visible overshoot |
| `sheet` | 380 / 38 | Drawers, modals, bottom sheets |
| `layout` | 300 / 32 | Grid reflow, shared image, tab indicator |
| `pop` | 600 / 16 | Small things only (badges, heart): overshoot allowed |

### Tier 1: signature moments

**`nova`: the hero intro (page load, once per session, ≤ 1.2s).**

1. 0ms: the night sky is empty except for stars. A white point appears where the deck will be and flares to 2×,
   throwing 12 light rays outward (alternating long and short).
2. 120ms: the glow blooms from 10% to full size (1.15s, `out`).
3. 280ms: the five deal cards burst out of the point, back cards first, 75ms apart, and land in their fan with a
   `pop` overshoot.
4. 320ms: the headline rises letter by letter (18ms apart, each from 0.6em below with a slight 8° tilt), while the
   discount counts up from 0 to the real maximum ("Up to **30**% off").
5. 820ms: the subline, deck controls and caption fade up 12px, 90ms apart.

After that the hero is **alive but calm**: cards bob a few pixels out of phase, the glow breathes, rays turn, stars
twinkle. On desktop the deck and glow tilt toward the pointer (parallax inside the hero only, smoothed, max 12° × 16°).

**`flare`: add to cart.**

1. **Fly (600ms):** a clone of the product photo leaves the exact spot that was tapped (card, deck, quick view, product
   gallery, sticky bar) and travels on a real arc to the bag icon: the horizontal leg eases in-out while the vertical
   leg rises fast, and the photo lifts slightly (scale 1.06, −4°) before shrinking to 26px and turning 12°.
2. **Flare (460ms):** the bag icon squashes (1.2 × 0.8) and springs back; 9 short pink rays and two marigold sparks
   burst around it; the wordmark spark turns a quarter and flashes; the count badge `roll`s to the new number with a `pop`.
3. **Sheet:** the mini cart springs open as the burst fades. The new line glows `flare-tint` for 1.2s, the subtotal
   rolls, and the free-delivery meter fills. When it reaches 100% it turns marigold and fires its own mini burst:
   "Free delivery unlocked".

`useFlyToCart()` returns `fly(fromElement, imageUrl)`; the navbar bag registers itself as the target.

**`land`: order placed.** The success screen is night with the glow centred on an 88px check. The ring draws (560ms),
then the tick (340ms), then a 16-ray burst with 5 marigold sparks and 30 pieces of confetti (pink, marigold, violet,
white; 1.1–1.6s, falling with gravity). Once per order.

### Tier 2: ambient (brand layer only)

| Name | What moves | Budget |
| --- | --- | --- |
| `breathe` | Glow scales 1 → 1.07 → 1 | 7s loop |
| `rays` | Light rays rotate | 90s per turn |
| `twinkle` | ≤ 28 stars, 2–3px, opacity 0.25 → 0.95 and scale 1.7 | 3–6s, random phases |
| `bob` | Each deck card rises 7px and tilts 0.7° | 5.6–7.6s, out of phase |

Rules: ambient elements are pure CSS keyframes on `transform`/`opacity`, `aria-hidden`, and **paused** (via
`animation-play-state`) when their section is off screen or the tab is hidden. Never on the shopping layer, never
behind body text, never more than ~40 ambient elements per page.

### Tier 3: scroll

| Name | Trigger | What moves |
| --- | --- | --- |
| `drift` | Always (when visible) | Marquee drifts at 40px/s; scrolling adds speed (decays in ~0.5s) and sets the direction |
| `settle` | Category tiles entering the viewport | Each tile starts 40px low, rotated ±7° (alternating), and settles flat as it scrolls into the top 58% of the screen. Scroll-linked, so it reverses when scrolling back |
| `stagger` | Shop grid first comes into view | Visible cards rise 22px and fade in, 55ms apart, once |
| `bloom` | Deals band first comes into view | Glow scales from 0.4 to 1; deal cards slide in from 40px right with a 3° tilt, 80ms apart, once |

Content is visible at rest: these only play when a section scrolls into view, they never leave anything hidden while
waiting. No scroll-jacking, no smooth-scroll library, no scroll-linked parallax on the shopping layer.

### Tier 4: interaction (named motions)

| Name | User action | What moves |
| --- | --- | --- |
| `press` | Any tap on a button, chip, swatch or card | Scale 0.97 (`instant`), springs back (`snappy`) |
| `route` | Navigating | Old page fades out (`quick`), new page fades in + rises 8px (`base`). Scroll is at top before the new page paints. |
| `lift` | Opening a product from a card | Product photo morphs from card to gallery (`layoutId`, `layout` spring). Rest of the page uses `route`. |
| `deal` | Swipe, tap, ‹ › or arrow keys on the hero deck | Top card follows the finger; past 80px (or on tap) it swings out to the side (±200px, ±20°) and tucks to the back while the rest move up one place. Released early, it springs home with `pop`. The caption cross-fades and the price rolls. |
| `tilt` | Hovering a product tile (desktop, `(hover: hover) and (pointer: fine)` only) | Tile tilts up to 9° × 11° toward the cursor and lifts 3px; a soft white glare follows the cursor |
| `swap` | Hovering a tile with several colours (desktop) · tapping a colour dot | Image cross-fades to the next colour's photo (`quick`) and back on leave |
| `spark` | Favourite on | Heart 0.6 → 1.25 → 1 (`pop`) + a 7-ray pink/marigold mini burst. Wishlist badge rolls and pops. Favourite off: a small dip, no burst. |
| `reflow` | Filter, sort, category chip, marquee or shelf link | Leaving cards fade + scale to 0.92 (170ms), the rest glide to their new places (560ms), new cards fade in 45ms apart. The chip's check pops in. |
| `roll` | A number changes (qty, total, coupon, currency, cart count, countdown) | Changed digits roll vertically, up when increasing, down when decreasing, 320ms, 28ms apart |
| `flip` | Countdown ticks | Each changed digit rolls inside its marigold tag |
| `sheet` | Opening a drawer, modal or bottom sheet | Panel slides in (`sheet`), backdrop fades to 50% night (`quick`). Focus trapped, Esc / backdrop / drag-down closes, focus returns to the opener. |
| `collapse` | Removing a cart line | Line slides 40px right and fades (190ms); the lines below glide up (380ms) |
| `tab` | Switching tabs | Indicator slides (`layoutId`), content cross-fades (`base`) |
| `fill` | Rating bars enter view (once) · free-delivery meter changes | Bar `scaleX` from its previous value (left origin) |
| `expand` | FAQ / footer accordion | Content height via `layout` on a wrapper + fade (`base`) |
| `shake` | A form is submitted with an error | The field shakes 6px twice (320ms) and the error line appears with its icon |
| `confirm` | Coupon applied, message sent, review submitted | The check draws (420ms) and a mini burst rings the button |
| `shimmer` | Content loading | One band sweeps across skeletons (transform loop). Stops when content arrives; no layout shift. |

### Never

Ambient loops on the shopping layer; fade-up on scroll for every section; scroll-linked parallax; scroll-jacking or
smooth-scroll libraries; marquees of promotional text; animating width, height, top/left, box-shadow, blur, filters
or colour on large areas; anything that blinks faster than 3 times a second.

### Reduced motion (`prefers-reduced-motion: reduce`)

`MotionConfig reducedMotion="user"` turns transforms off, and a CSS block stops every keyframe animation. On top of
that: no intro (the hero renders in its final state), no ambient loops (the glow is a still image of light), no fly,
bursts or confetti, no tilt, parallax or magnetic button, the marquee becomes a static scrollable row, the deck
swaps instantly, route and sheets fade only, numbers change instantly, shimmer becomes a static `well`, and checkmarks
appear without drawing. The drawer still opens after Add to cart.

---

## 9. Copy

- Plain, specific, active, sentence case. Buttons say exactly what happens: "Add to cart", "Place order",
  "Apply code", "Send message", "Track order".
- Errors say what went wrong and how to fix it: "That code needs an order over $150. Add $42 more to use it."
- No claims the site can't back up: no invented stats, testimonials, "256-bit SSL" or badges like "Verified member"
  unless the data exists.
- Fix small grammar slips while restyling ("1 items" → "1 item").

---

## 10. Quality bar

- Reduced motion respected as described above.
- Only `transform` / `opacity` animate; 60fps on a mid-range Android phone (test with 4× CPU throttling).
- Ambient budget: ≤ 40 looping elements per page, CSS only, paused off screen and in hidden tabs. JavaScript-driven
  motion (marquee, parallax, scroll `settle`) runs in one `requestAnimationFrame` loop and stops when its section
  isn't visible.
- The intro never delays content: the page is usable while it plays, and it plays once per session.
- Lighthouse mobile ≥ 90 Performance and Accessibility on Home, Shop, Product; CLS < 0.1 (image wells have fixed
  aspect ratios; fonts use `swap` with a metric-matched fallback).
- Visible keyboard focus everywhere (2px `flare` outline, 2px offset), aria-labels kept, AA contrast (Section 3).
- 360px to 1920px with no horizontal scroll.
- `npx tsc -b`, `npm run lint`, `npm run build` pass. Before/after screenshots at 390px and 1366px for every touched page.

---

## 11. Self-review: what was generic, and what changed

I wrote a first pass, then asked of each choice: "would I have put this on any e-commerce site?" These parts were
generic, and this is what replaced them:

| First pass (generic) | Changed to | Why |
| --- | --- | --- |
| Keep orange, just refine it | Hot pink `flare` + indigo `ink` + `marigold` on cool porcelain | Orange-on-cream is on the avoid list and reads as Daraz. Pink is tied to the name (a flare) and reserved for buying actions, so it means something. |
| Hero: big headline, CTA, lifestyle photo, three stats | **The Drop**: a fanned deck of the 5 newest real products you can swipe through | Stats were invented; a stock photo isn't NOVA. A deck is built from the catalogue, changes as products are added, and gives thumbs something to play with. |
| Inter / Plus Jakarta Sans for everything | Mona Sans at three widths | Width carries meaning (expanded = voice, normal = UI, condensed = price tag), and it fits long PKR prices. |
| Product card: white card, border, shadow, hover "Add to cart" bar | No container: a multiplied photo on a `well` tile, one tag, a quick-add `+` | Removes the "identical cards with the same soft shadow" look and makes mismatched supplier photos look like one set. |
| Category grid: 6 icon tiles with badges | A snap shelf of real product photos with live counts; empty categories reduced to one "Coming soon" line | Badges meant nothing, and empty categories had equal billing. |
| Trust bar with four icon tiles under the hero | Removed from Home; the facts live where they matter (delivery date on product, free-delivery meter in cart, COD in the strip) | Every store has this bar; shoppers read the facts at the moment of decision. |
| Eyebrow label + H1 + subtitle in a grey band on every page | Display L title on the page, no band | Saves ~180px per page on phones and drops the ALL-CAPS label pattern. |
| Fade-up on scroll for sections | None. Motion only answers actions; rating bars fill once | The brief, and it keeps the site calm so the flare stands out. |
| One-column product list on phones | Two columns from 360px | 8 products took 6 screens; two columns halves that. |
| Floating back-to-top button | Removed | It covered "Place order". |
| Footer: 4 link columns + social icons + newsletter | Same content, accordions on mobile, no oversized wordmark | It was 2+ screens long on phones. |
| **v2:** "make it more animated" read as "fade in every section" | Four tiers with a place for each; ambient motion only on the night brand layer | Scroll-fade on everything is the most generic animated look there is. A breathing night sky that bursts when you act is NOVA's own. |
| **v2:** "attractive colours" read as a purple-to-blue gradient hero | Deep indigo night with a radial nova glow (pink, marigold, violet) behind real products | The glow is the nova itself, not a decoration wash, and it's used only for light and celebration. |
| **v2:** headline stays "New this week" | "Up to 30% off the good stuff." with the real maximum discount counting up | Specific, true and computed from the catalogue; the number moving is the hook. |

---

## 12. Decisions

Settled after v1:

1. **Colour theme:** the brief asked for an attractive theme rather than choosing pink or orange. v2 keeps hot pink
   for buying, adds the night sky, aurora violet and the nova gradient, and drops orange entirely.
2. **Google and Apple sign-in buttons: keep them visible** (your call). They're restyled to match and keep today's
   behaviour (a toast) until real OAuth is added.
3. **Invented content: remove it** (your call). Hero stats, the "Sophie V." testimonial, "256-bit SSL" and "Verified
   member" go. The hero's discount figure and product counts are computed from the catalogue. Real stats come back
   with prompt 5.
4. **Admin screens** (still open): for 0B group 8 I'll need you to sign in once in the browser pane, or give me the
   admin credentials.
