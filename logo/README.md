# Sivrce — Logo System

**Current master (v1.13, locked): the owner lockup** —
`source/sivrce-lockup-master.png` (horizontal spark + wordmark on white).
Every shipped asset is a 1:1 crop: `board1x1/` → `app/public/logo/`, app
icons, favicon, `og-brand.png`, share watermark. Rebuild all:
`python3 logo/build_board1x1.py` (idempotent). See `app/BRAND.md` §2.

Everything below (v1.0 "Space Point" geometry, Manrope wordmark outlines,
SVG lockups) is **legacy history** — never ship it as the primary identity.

---

# Sivrce — Logo System v1.0 · "The Space Point" (LEGACY)

სივრცე means **space**. The mark: one blue space (squircle r=14/48), one infinite
white path (the S — two tangent elliptical arcs, exact 180° rotational symmetry),
one orange point (the home inside that space). Built 100% from BRAND.md locked tokens.

Open **`index.html`** for the full award-style presentation (concept, construction,
lockups, variants, rules, palette, assets).

## Geometry contract (48-unit grid)

| Element | Value |
|---|---|
| Tile | `rect 48×48, rx=14`, fill `#2E6BFF` |
| S path | `M32.649 15.143 A9.2 6.6 0 1 0 24 24 A9.2 6.6 0 1 1 15.351 32.857` |
| S stroke | 6.4 units, round caps (7.0 below 32 px — use `sivrce-mark-small.svg`) |
| Space point | circle `(38.2, 38.2) r=3.0`, fill `#FF6A2D` |
| Symmetry | exact 180° rotation about `(24, 24)` |
| Wordmark | Manrope 800, lowercase, tracking −0.045em, orange final period |
| Lockup | gap 15 units · x-height 25/48 of mark · optically centered |

## Rules

- Clear space = **50% of tile** on all sides.
- Never recolor, rotate, outline, or place on busy backgrounds (dark scrim required).
- Orange is the point only — ≤10% of any surface.
- Ink `#0A1030` lockups on light, white lockups on navy. Tile never changes.

## Files

- `assets/` — master SVGs (mark, display gradient, mono ×2, horizontal ×2, stacked ×2,
  wordmark ×2, app icons iOS + Android adaptive, favicon) + `favicon.ico`
- `png/` — Chrome-rendered PNGs: mark 16→1024, app-icon 180→1024, lockups, wordmarks
- `build_wordmark.py` → outlines Manrope 800 (real font paths, GPOS kerning, −0.045em)
- `build_assets.py` → regenerates every SVG from the single geometry source
- `fonts/Manrope-Variable.ttf` — pinned type source (OFL license)

## Drop-in React component (matches SVG 1:1)

```tsx
export function LogoMark({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-label="Sivrce">
      <rect width="48" height="48" rx="14" fill="#2E6BFF" />
      <path
        d="M32.649 15.143 A9.2 6.6 0 1 0 24 24 A9.2 6.6 0 1 1 15.351 32.857"
        fill="none" stroke="#fff" strokeWidth={size <= 32 ? 7 : 6.4}
        strokeLinecap="round"
      />
      <circle cx="38.2" cy="38.2" r={size <= 32 ? 3.3 : 3} fill="#FF6A2D" />
    </svg>
  );
}
```

## Web integration

```html
<link rel="icon" href="/logo/sivrce-favicon.svg" type="image/svg+xml">
<link rel="icon" href="/logo/favicon.ico" sizes="32x32">
<link rel="apple-touch-icon" href="/logo/app-icon-180.png">
```

## Sivrce Spark — AI sub-brand (v1.3)

The Spark marks AI features (AI search, assistant, recommendations) — never
replaces the Space Point master identity. Two crescent blades with exact 180°
rotational symmetry about (24,24): one family, two marks.

| Element | Value |
|---|---|
| Blade A | `M24 3.2 Q21.4 21.4 3.2 24 Q25.2 25.2 24 3.2 Z` |
| Blade A gradient | T→L: `#8FB4FF` 0 · `#2E6BFF` .55 · `#7A5CFF` 1 |
| Blade B | exact 180° rotation of blade A |
| Blade B gradient | R→B: `#7A5CFF` 0 · `#FF4D6D` .62 · `#FF6A2D` 1 |
| Assets | `assets/sivrce-spark.svg` (bare) · `sivrce-spark-navy.svg` (tile) · `sivrce-spark-mono-white.svg` · `sivrce-spark-mono-ink.svg` |
| PNGs | `png/sivrce-spark-{16…1024}.png` · `png/sivrce-spark-navy-{180,512,1024}.png` |
| Generator | `build_spark.py` (SVG) · `build_spark_png.py` (PNG) |
| Component | `app/src/components/SparkMark.tsx` |

Rules: AI contexts only · never a category/deal icon · never recolor · clear
space 25% of mark on all sides.
