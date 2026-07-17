# სივრცე — Brand Lock (v1.2) · FROZEN 2026-07-17

**STATUS: LOCKED.** Do not invent colors, radii, fonts, motion, logo geometry,
or category hues. Owner-approved. Change only with explicit owner approval +
version bump in this file + matching updates to the three code sources below.

| Source of truth | Path |
|---|---|
| Spec (this file) | `app/BRAND.md` |
| JS tokens | `app/src/lib/brand.ts` |
| Category / deal / service hues | `app/src/lib/category-brand.ts` |
| CSS + Tailwind `@theme` | `app/src/app/globals.css` |
| Logo geometry | `logo/README.md` + `app/src/components/Logo.tsx` |

## 0. Enforcement (how to build UI)

Never write raw hex in components. Use locked tokens / `CATEGORY_BRAND` /
`SERVICE_BRAND` / `DEAL_BRAND`. Exception: logo SVG white stroke `#ffffff`
and third-party brand marks (Google).

| Token | Class examples | Value |
|---|---|---|
| Blue (primary) | `bg-sv-blue` `text-sv-blue/60` `ring-sv-blue/15` | #2E6BFF |
| Blue light | `text-sv-blue-light` | #8FB4FF |
| Blue deep | `hover:bg-sv-blue-deep` | #1A3FC0 |
| Violet — gradients only | `to-sv-violet` | #7A5CFF |
| Orange (action) | `bg-sv-orange` `text-sv-orange` | #FF6A2D |
| Orange light | `to-sv-orange-light` | #FFB25E |
| Orange deep — gradients only | `to-sv-orange-deep` | #FF4D6D |
| Navy (dark bg) | `bg-sv-navy` | #050B26 |
| Navy soft | `to-sv-navy-soft` | #0A1440 |
| Ink (text on light) | `text-sv-ink` `text-sv-ink/50` | #0A1030 |
| Cloud (light bg) | `bg-sv-cloud` | #F6F7FB |
| Surface (cards) | `bg-sv-surface` | #FFFFFF |
| Success (dark surfaces only) | `text-sv-success` | #4ADE80 |

Radius: `rounded-card` 26 · `rounded-tile` 22 · `rounded-module` 16 · `rounded-control` 12 · `rounded-full` pill.
Elevation: `shadow-card` `shadow-card-hover` `shadow-soft` `shadow-glow-orange` `shadow-glow-orange-lg`
`shadow-glow-blue` `shadow-glow-blue-sm` `shadow-glow-navy` `shadow-panel-dark` `shadow-showcase-blue`.

### Forbidden (anti-hallucination)

- No purple-on-white / indigo default AI themes
- No warm cream (#F4F1EA-ish) + terracotta serif look
- No broadsheet / newspaper layouts
- No `bg-black/*` overlays — navy-tint only
- No pure-black shadows — navy-tint only (`rgba(10,16,48,…)`)
- No Inter / Roboto / Arial / system-only stacks for UI type
- No emoji/unicode glyphs in UI
- No inventing category/deal colors — extend `category-brand.ts` + this file first
- No new CSS brand colors outside `BRAND.md`

## 1. Identity
- **Name:** sivrce (always lowercase in the wordmark) + orange period
- **KA name:** სივრცე · **Domain:** sivrce.ge
- **Tagline:** „უძრავი ქონება ერთ სივრცეში" / "Real estate in one space"
- **Personality:** premium, calm, technological, trustworthy — Apple-grade restraint

## 2. Logo
- `LogoMark` — blue squircle (r=14/48), white infinite-S path, **orange space point** at bottom-right
- **Geometry lock (48-unit grid):** S = `M32.649 15.143 A9.2 6.6 0 1 0 24 24 A9.2 6.6 0 1 1 15.351 32.857`,
  stroke 6.4 (7.0 below 32 px), round caps, exact 180° symmetry about (24,24);
  point = circle (38.2, 38.2) r=3.0 (3.3 below 32 px). Masters: `logo/assets/`, see `logo/README.md`
- Never recolor, rotate, outline, or place on busy backgrounds without a dark scrim
- Min clear space = 50% of tile size on all sides
- Wordmark: Manrope 800, tracking −0.045em, lowercase, orange final period (`text-sv-orange`)

## 3. Color
| Role | Token | Hex | Usage |
|---|---|---|---|
| Primary | `sv-blue` | #2E6BFF | links, icons, AI features, active states |
| Accent | `sv-orange` | #FF6A2D | CTAs, VIP, highlights, favorites — **action only** |
| Deep bg | `sv-navy` | #050B26 | hero + dark sections + footer |
| Text | `sv-ink` | #0A1030 | headlines/body on light |
| Light bg | `sv-cloud` | #F6F7FB | alternating section background |
| Surface | `sv-surface` | #FFFFFF | cards / elevated panels (light) |
| Violet | `sv-violet` | #7A5CFF | gradient partner only, never standalone |

Rules:
- Orange ≤ 10% of any viewport · white space is a feature
- Dark sections always use dot-grid/aurora ambience, never flat color
- **Overlays and image scrims are always navy-tinted** (`bg-sv-navy/55`, `from-sv-navy/70`) — never `bg-black/*`
- Shadows are navy-tinted (`rgba(10,16,48,…)` / `rgba(5,11,38,…)` / `rgba(1,4,20,…)`) — never pure black
- **Positive metrics on light backgrounds use `sv-blue`** (brand-positive), not green;
  `sv-success` green is reserved for dark surfaces (LIVE, verified, trust badges)
- **Hover rules:** blue surfaces → `sv-blue-deep`; orange surfaces → keep color, upgrade
  elevation to `shadow-glow-orange-lg` + `hover:-translate-y-0.5` (never a new hue)

### 3.1 Category & service branding (locked — owner-approved 2026-07-17)

Every category/service icon owns its personal hue + chip tint. Source of truth:
`src/lib/category-brand.ts` · CSS mirror: `--color-cat-*` tokens in `globals.css`.
Never cycle tints, never recolor, never inline new hex values for these items.

| Category (KA) | Key | Hue | Chip |
|---|---|---|---|
| ბინები | `apartments` | #2E6BFF | #EFF3FF |
| სახლები | `houses` | #FF6A2D | #FFF3EF |
| აგარაკები | `cottages` | #16A34A | #EDF8F1 |
| მიწის ნაკვეთები | `land` | #D97706 | #FCF4EB |
| კომერციული | `commercial` | #7C3AED | #F5F0FE |
| დღიური ქირა | `dailyRent` | #E11D48 | #FDEDF1 |
| სასტუმროები | `hotels` | #0891B2 | #ECF6F9 |
| ახალი პროექტები | `newProjects` | #5B8BFF | #EFF3FF |

| Service (KA) | Key | Hue | Chip |
|---|---|---|---|
| აგენტები და სააგენტოები | `agents` | #2E6BFF | #EFF3FF |
| დეველოპერები | `developers` | #7C3AED | #F5F0FE |
| რემონტი და კალკულატორი | `renovation` | #FF6A2D | #FFF3EF |
| იპოთეკა და ფინანსები | `mortgage` | #16A34A | #EDF8F1 |

Rules:
- Icon chip = category `chip` bg + category `hue` glyph; hover keeps hue, upgrades scale/elevation only
- The ≤10% orange rule applies to CTAs/highlights, NOT to the locked category identity hues
- A new category is added ONLY by extending `category-brand.ts` + this table first

### 3.2 Deal tabs (locked — maps to category hues)

Source: `DEAL_BRAND` in `category-brand.ts`. Hero deal tabs + search deal chips.

| Deal | Key | Hue | Maps to |
|---|---|---|---|
| იყიდება (sale) | `sale` | #2E6BFF | apartments |
| ქირავდება (rent) | `rent` | #7C3AED | commercial |
| დღიურად (daily) | `daily` | #E11D48 | dailyRent |
| ახალი პროექტები | `newProjects` | #5B8BFF | newProjects |

### 3.3 Dark mode flips (locked)

Brand hues (blue/orange/violet/category) stay fixed. Only foundations flip in `.dark`:

| Token | Light | Dark |
|---|---|---|
| `sv-ink` | #0A1030 | #E9EDFF |
| `sv-cloud` | #F6F7FB | #060B21 |
| `sv-surface` | #FFFFFF | #0E1737 |
| category chips | pastel fills | `color-mix(in oklab, <hue> 18–20%, transparent)` |

Navy (`#050B26`) stays fixed — hero, CTA, map, footer are brand-dark in BOTH themes.
Glass light → smoked navy `rgba(8,13,38,0.92)` in dark.

## 4. Typography
- Stack: Manrope (Latin/digits, weights 400–900 loaded) + Noto Sans Georgian
- Headlines: weight 900 (`font-black`), tracking −0.02em…−0.045em, `text-balance`
- Body: 15–17px, weight 500–600, `sv-ink` at 45–75% opacity
- Numbers/prices: Manrope 800–900
- Layout MUST load Manrope 900 — headlines break without it

## 5. Shape & Elevation
- Cards r=26 · tiles r=22 · nested modules r=16 · controls r=12 · buttons pill
- **Concentric rule:** inner radius = outer radius − padding (e.g. segmented control:
  outer 12 + p-1 → inner 8 `rounded-lg`)
- **Icon chips:** ≥44px box → r=16 (`rounded-module`); <44px → r=12 (`rounded-control`)
- Shadows only from `elevation` tokens — never `shadow-lg/2xl` or arbitrary black shadows
- Glass: `.glass` (dark) / `.glass-light` (light) — 20px blur, hairline translucent border only

## 6. Motion
- Ease `[0.21,0.65,0.2,1]`, reveals: y+28 → 0, 0.7s, once (`<Reveal />`)
- Hover: lift −6…−8px + shadow upgrade (≤0.5s)
- Respect `prefers-reduced-motion` (handled globally in `globals.css`)

## 7. Iconography & Imagery
- Lucide icons only, 1.5–2px stroke, rounded — **no emoji/unicode glyphs in UI**
  (ratings use `<Star className="fill-sv-orange text-sv-orange" />`)
- Favorites (heart) states: default `sv-ink`, hover/active `sv-orange` (filled)
- AI-generated imagery: dusk/blue-hour real estate, warm interiors;
  no watermarks, no baked-in text/logos (except developer renders)
- 3D-map visuals: navy #050B26 base, blue pins, ONE orange highlight

## 8. VIP system (locked — `BRAND.vipTiers` is the only source)
- VIP — dark navy badge + Flame
- VIP+ — blue→violet gradient + Flame
- SUPER VIP — orange→red gradient + Crown

## 9. Gradients (locked — `BRAND.gradients`)
- Brand: `linear-gradient(120deg, #8FB4FF 0%, #2E6BFF 55%, #7A5CFF 100%)`
- Action: `linear-gradient(120deg, #FFB25E 0%, #FF6A2D 60%, #FF4D6D 100%)`
- VIP+: `linear-gradient(90deg, #2E6BFF, #7A5CFF)`
- SUPER VIP: `linear-gradient(90deg, #FF6A2D, #FF4D6D)`

## 10. Sync checklist (before shipping UI)

1. Hex exists in §3 / §3.1 / §3.2 / §3.3 of this file?
2. Mirrored in `brand.ts` and/or `category-brand.ts`?
3. Mirrored in `globals.css` `@theme` / `:root` / `.dark`?
4. Component uses token class or brand import — no raw hex?

If any answer is no → stop and fix before merging.
