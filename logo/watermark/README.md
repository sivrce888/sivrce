# Sivrce — Photo Watermark Kit (board Spark Star · 100/100)

Mark = owner board silhouette (`logo/concepts/sivrce-spark-mark.png`),
not the flat v3 crescents. Soft opacity overlays for marketing / social /
press — **not** for listing gallery images (BRAND.md §7).

## Pick one (`png/`)

| File | Use on |
|---|---|
| `sivrce-wm-soft-white-8x.png` | Dark / dusk photos **(default)** |
| `sivrce-wm-soft-ink-8x.png` | Light interiors |
| `sivrce-wm-soft-color-8x.png` | Hero / brand shots |
| `sivrce-wm-capsule-8x.png` | Busy / mixed frames |
| `sivrce-wm-mark-soft-*-8x.png` | Tight corners — mark only |
| `*-16x.png` | Print / 4K+ |
| `*-color-*` / `*-mono-*` (no soft) | Full opacity — dial strength in editor |

## Placement

- Corner: bottom-right (LTR)
- Size: lockup ≈ **8–12%** of photo width
- Margin: clear space already baked into canvas
- Never stretch, recolor, rotate, or outline

## Rebuild

```bash
python3 logo/watermark/build_watermark.py
```

Needs Chrome + Pillow + numpy (same headless pipeline as `logo/v3`).
