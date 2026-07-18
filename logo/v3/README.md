# Sivrce — Logo v3.0 · "The Spark Star"

The owner-supplied spark concept rebuilt as exact vector geometry — Apple-grade:
no raster effects, no gloss, pure mathematics that survives 16 px favicons and
billboards alike. Master identity for platform + social, owner-approved
2026-07-18 (BRAND.md v1.5).

Four crescent blades in exact 90° rotational symmetry about (24,24), swirling
around a pinwheel void — the space inside the space (სივრცე). The gradient
flows sky-blue → violet and lands on the **orange point**: the home, rhyming
with the wordmark's orange period. Two points, one system.

## Geometry contract (48-unit grid)

| Element | Value |
|---|---|
| Blade | Crescent: spine sway 2.0 toward clockwise + asymmetric width profile (peak 5.7 at ~41% from tip), both ends needle-sharp |
| Symmetry | exact 90° rotations about (24,24) — geometry; color breaks it deliberately |
| Tips | 3.2 margin (radius 20.8); hooked 1.4 clockwise (pinwheel energy) |
| Void | pinwheel aperture at center, blade bases at radius 1.9 |
| Gradients | N: `#8FB4FF→#2E6BFF` · E/W: `#2E6BFF→#7A5CFF` · S: `#FF6A2D→#FF4D6D→#7A5CFF` (orange at the tip) — locked stops only |
| Wordmark | unchanged — Manrope 800, lowercase, tracking −0.045em, orange period |
| Lockup | gap 15/48 of mark · x-height 25/48 · optically centered |

### Optical size masters

| Master | Range | Adjustments |
|---|---|---|
| `sivrce-v3-mark.svg` | > 32 px | display geometry |
| `sivrce-v3-mark-small.svg` | ≤ 32 px | blades ×1.28, sway ×0.8, void 2.7, tips 21.6 |
| `sivrce-v3-mark-micro.svg` | ≤ 16 px | blades ×1.45, sway ×0.55, void 3.2, tips 22.4 |

## Rules

- Clear space = **25% of mark** on all sides.
- Never recolor, rotate, outline, or add shadows/effects.
- Gradient master on light; **white mono** on navy/photo (dark scrim) and on
  brand gradients; **ink mono** for single-color reproduction.
- Orange lives in the bottom point and the wordmark period only.
- v1 tile + v2 marks: retired to logo history (`logo/assets/`, `logo/v2/`).
- v1.3 two-blade Spark stays the **AI-features signifier** (`SparkMark.tsx`) —
  same family, different role. Never swap one for the other.

## Files

- `assets/` — master SVGs (gradient ×3 sizes, mono ink/white ×2 sizes,
  horizontal + stacked lockups ×2 colors, app icons iOS + Android, svg favicon)
  + `favicon.ico` (16/32/48)
- `png/` — Chrome-rendered @2x PNGs: mark 16→1024 (gradient + mono ×2),
  lockups, avatars navy/cloud 512+1024 (58% mark — circle-crop safe),
  app icons 180→1024, favicon PNGs, `sivrce-v3-og-1200x630.png`
- `board.html` / `board.png` — presentation board
- `build_v3.py` — one geometry source → every asset (`python build_v3.py`)

## Platform integration (live since v1.5)

- `app/src/components/Logo.tsx` — `LogoMark` renders this geometry (token
  vars, `useId`-scoped gradients, master + small sets)
- `app/src/app/icon.svg` · `apple-icon.png` · `public/icons/*` — v3 set
- v1 tile remains in git history if a rollback is ever needed
