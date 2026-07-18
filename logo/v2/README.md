# Sivrce — Logo v2.0 · "The Space Point, freed"

v1 lived inside a blue tile — an app icon, not a logo. v2 removes the
container. One continuous S path, one orange point, nothing else. The point
is the destination: the home inside the space (სივრცე). It rhymes with the
wordmark's orange period — two points, one system.

Geometry, tokens, wordmark: inherited 1:1 from the frozen v1 contract
(`logo/README.md`). Nothing recolored, nothing invented.

## Geometry contract (48-unit grid)

| Element | Value |
|---|---|
| S path | `M32.649 15.143 A9.2 6.6 0 1 0 24 24 A9.2 6.6 0 1 1 15.351 32.857` |
| S stroke | 6.4 units, round caps (7.0 below 32 px — use `*-small.svg`) |
| Space point | circle `(38.2, 38.2) r=3.0` (r=3.3 below 32 px), `#FF6A2D` |
| Master (light) | stroke `#0A1030` on transparent |
| Brand variant | stroke `#2E6BFF` — brand-color moments only |
| Dark surfaces | stroke `#FFFFFF` |
| Wordmark | unchanged — Manrope 800 lowercase, orange period |
| Lockup gap | 15 units, optically centered |

## Rules

- Clear space = 25% of mark height on all sides (no tile to lean on anymore).
- Orange is the point only — never recolor the S, never a second accent.
- Blue S on white/light only; white S on navy/photo (dark scrim).
- v1 tile mark remains the iOS/Android app icon — OS gives it the squircle
  for free. v2 is the identity everywhere else.

## Files

- `assets/` — 5 master SVGs (ink, blue, white + small-size variants)
- `png/` — Chrome-rendered PNGs 16→1024 (ink/white/blue)
- `board.html` / `board.png` — presentation board
- `build_v2.py` — regenerates everything from the geometry source above

## Adoption

Brand is locked (BRAND.md frozen 2026-07-17). Switching v2 live = owner
approval + version bump in BRAND.md and `app/src/lib/brand.ts`, then swap
header/footer/favicon references from v1 paths to `logo/v2/`.
