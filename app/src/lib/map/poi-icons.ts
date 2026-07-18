/**
 * MapLibre POI sprites — Lucide glyphs on branded circles.
 * ponytail: canvas-free SVG data URLs; no sprite atlas / icon font.
 */

import { createElement, type ComponentType } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  Dumbbell,
  GraduationCap,
  Hospital,
  Pill,
  School,
  Store,
  TrainFront,
  Trees,
  type LucideProps,
} from 'lucide-react'
import type { Map as MlMap } from 'maplibre-gl'
import { POI_CATEGORIES, POI_COLORS, type PoiCategory } from '@/lib/map/pois'

const ICONS: Record<PoiCategory, ComponentType<LucideProps>> = {
  metro: TrainFront,
  pharmacy: Pill,
  school: School,
  university: GraduationCap,
  park: Trees,
  shop: Store,
  gym: Dumbbell,
  hospital: Hospital,
}

export function poiImageId(cat: PoiCategory): string {
  return `sv-poi-${cat}`
}

/** Branded Lucide badge — used by MapLibre sprites + POI popup. */
export function poiIconDataUrl(cat: PoiCategory, stroke = '#FFFFFF'): string {
  const Icon = ICONS[cat]
  const glyph = renderToStaticMarkup(
    createElement(Icon, {
      size: 22,
      color: '#FFFFFF',
      strokeWidth: 2.4,
      absoluteStrokeWidth: false,
    }),
  )
  const inner = glyph
    .replace(/<svg[^>]*>/, '')
    .replace(/<\/svg>/, '')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <circle cx="32" cy="32" r="30" fill="${POI_COLORS[cat]}" stroke="${stroke}" stroke-width="4"/>
  <g transform="translate(20 20)">${inner}</g>
</svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

/** Idempotent — safe on every style remount. */
export function loadPoiImages(map: MlMap): Promise<void> {
  return Promise.all(
    POI_CATEGORIES.map(
      (cat) =>
        new Promise<void>((resolve) => {
          const id = poiImageId(cat)
          if (map.hasImage(id)) {
            resolve()
            return
          }
          const img = new Image(64, 64)
          img.onload = () => {
            try {
              if (!map.hasImage(id)) map.addImage(id, img, { pixelRatio: 2 })
            } catch {
              /* style torn down mid-load */
            }
            resolve()
          }
          img.onerror = () => resolve()
          img.src = poiIconDataUrl(cat)
        }),
    ),
  ).then(() => undefined)
}
