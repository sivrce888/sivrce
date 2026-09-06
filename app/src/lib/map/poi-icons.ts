/**
 * MapLibre POI sprites — Lucide glyphs on branded circles.
 * Metro: official Tbilisi M mark (CC0 path), not Lucide TrainFront.
 * ponytail: glyph paths baked from lucide-react 1.39.0 — react-dom/server in
 * the client bundle throws under Next 16.3.4's mismatched vendored canaries
 * and cost ~100 KB; re-bake these strings when upgrading lucide.
 */

import { createElement, type SVGProps } from 'react'
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

/** Lucide 24×24 geometry, stroke contract: round caps/joins, 2.4 width. */
const GLYPHS: Partial<Record<PoiCategory, string>> = {
  pharmacy:
    '<path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/>',
  school:
    '<path d="M14 21v-3a2 2 0 0 0-4 0v3"/><path d="M18 4.933V21"/><path d="m4 6 7.106-3.79a2 2 0 0 1 1.788 0L20 6"/><path d="m6 11-3.52 2.147a1 1 0 0 0-.48.854V19a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a1 1 0 0 0-.48-.853L18 11"/><path d="M6 4.933V21"/><circle cx="12" cy="9" r="2"/>',
  university:
    '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
  park:
    '<path d="M10 10v.2A3 3 0 0 1 8.9 16H5a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0Z"/><path d="M7 16v6"/><path d="M13 19v3"/><path d="M12 19h8.3a1 1 0 0 0 .7-1.7L18 14h.3a1 1 0 0 0 .7-1.7L16 9h.2a1 1 0 0 0 .8-1.7L13 3l-1.4 1.5"/>',
  shop:
    '<path d="M15 21v-5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5"/><path d="M17.774 10.31a1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.451 0 1.12 1.12 0 0 0-1.548 0 2.5 2.5 0 0 1-3.452 0 1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.77-3.248l2.889-4.184A2 2 0 0 1 7 2h10a2 2 0 0 1 1.653.873l2.895 4.192a2.5 2.5 0 0 1-3.774 3.244"/><path d="M4 10.95V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8.05"/>',
  gym:
    '<path d="M17.596 12.768a2 2 0 1 0 2.829-2.829l-1.768-1.767a2 2 0 0 0 2.828-2.829l-2.828-2.828a2 2 0 0 0-2.829 2.828l-1.767-1.768a2 2 0 1 0-2.829 2.829z"/><path d="m2.5 21.5 1.4-1.4"/><path d="m20.1 3.9 1.4-1.4"/><path d="M5.343 21.485a2 2 0 1 0 2.829-2.828l1.767 1.768a2 2 0 1 0 2.829-2.829l-6.364-6.364a2 2 0 1 0-2.829 2.829l1.768 1.767a2 2 0 0 0-2.828 2.829z"/><path d="m9.6 14.4 4.8-4.8"/>',
  hospital:
    '<path d="M12 7v4"/><path d="M14 21v-3a2 2 0 0 0-4 0v3"/><path d="M14 9h-4"/><path d="M18 11h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h2"/><path d="M18 21V5a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16"/>',
}

export function poiImageId(cat: PoiCategory): string {
  return `sv-poi-${cat}`
}

/** Branded badge — used by MapLibre sprites + POI popup. */
export function poiIconDataUrl(cat: PoiCategory, stroke = '#FFFFFF'): string {
  const fill = POI_COLORS[cat]
  // Glyph stays white regardless of ring stroke — same contract as before.
  const inner =
    cat === 'metro'
      ? // Scale official M into the same ~22px pocket Lucide uses.
        `<g transform="translate(20 18) scale(0.26)" fill="#FFFFFF"><polygon points="${METRO_M_POINTS}"/></g>`
      : `<g transform="translate(20 20)" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${GLYPHS[cat] ?? ''}</g>`
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
