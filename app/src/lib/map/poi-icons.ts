/**
 * MapLibre POI sprites — Lucide glyphs on branded circles.
 * Metro: official Tbilisi M mark (CC0 path), not Lucide TrainFront.
 * ponytail: canvas-free SVG data URLs; no sprite atlas / icon font.
 */

import { createElement, type ComponentType, type SVGProps } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  Dumbbell,
  GraduationCap,
  Hospital,
  Pill,
  School,
  Store,
  Trees,
  type LucideProps,
} from 'lucide-react'
import type { Map as MlMap } from 'maplibre-gl'
import { POI_CATEGORIES, POI_COLORS, type PoiCategory } from '@/lib/map/pois'

/** Official Tbilisi Metro M (Soviet-era mark, SVG Repo CC0). */
const METRO_M_POINTS =
  '91.405,67.947 85.546,67.947 67.369,18.558 46.539,48.683 24.275,18.916 7.534,67.947 1.675,67.947 0,74.522 22.242,74.522 30.973,50.486 46.803,71.626 46.898,71.759 46.995,71.626 62.107,50.486 70.838,74.522 93.08,74.522'

export function MetroMark({ className, ...rest }: SVGProps<SVGSVGElement>) {
  return createElement(
    'svg',
    {
      viewBox: '0 0 93.08 93.08',
      className,
      fill: 'currentColor',
      'aria-hidden': true,
      ...rest,
    },
    createElement('polygon', { points: METRO_M_POINTS }),
  )
}

const ICONS: Partial<Record<PoiCategory, ComponentType<LucideProps>>> = {
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

/** Branded badge — used by MapLibre sprites + POI popup. */
export function poiIconDataUrl(cat: PoiCategory, stroke = '#FFFFFF'): string {
  const fill = POI_COLORS[cat]
  let inner: string
  if (cat === 'metro') {
    // Scale official M into the same ~22px pocket Lucide uses.
    inner = `<g transform="translate(20 18) scale(0.26)" fill="#FFFFFF"><polygon points="${METRO_M_POINTS}"/></g>`
  } else {
    const Icon = ICONS[cat]!
    const glyph = renderToStaticMarkup(
      createElement(Icon, {
        size: 22,
        color: '#FFFFFF',
        strokeWidth: 2.4,
        absoluteStrokeWidth: false,
      }),
    )
    inner = `<g transform="translate(20 20)">${glyph
      .replace(/<svg[^>]*>/, '')
      .replace(/<\/svg>/, '')}</g>`
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <circle cx="32" cy="32" r="30" fill="${fill}" stroke="${stroke}" stroke-width="4"/>
  ${inner}
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
